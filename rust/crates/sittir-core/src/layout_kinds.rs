//! The gap kinds a seam or a leaf's edge speaks of, as an 8-bit set. Indent
//! and dedent are depth moves, outside the set.

#[derive(Clone, Copy, PartialEq, Eq, Debug, Default)]
pub struct LayoutKinds(pub u8);

impl LayoutKinds {
    pub const NONE: Self = Self(0);
    pub const TIGHT: Self = Self(1);
    pub const SPACE: Self = Self(1 << 1);
    pub const TAB: Self = Self(1 << 2);
    pub const NEWLINE: Self = Self(1 << 3);
    pub const BLANKLINE: Self = Self(1 << 4);
    pub const DOUBLE_BLANKLINE: Self = Self(1 << 5);
    pub const LINE_CONTINUATION: Self = Self(1 << 6);
    pub const ALL: Self = Self(0x7f);
    /// Every kind that writes text, which a word boundary may be spelled with.
    pub const SEPARATING: Self = Self(0x3e);
    /// The kinds that break the line.
    pub const BREAKING: Self = Self(0x78);

    pub const fn from_bits(bits: u8) -> Self {
        Self(bits)
    }

    pub const fn has(self, other: Self) -> bool {
        self.0 & other.0 != 0
    }

    pub const fn and(self, other: Self) -> Self {
        Self(self.0 & other.0)
    }

    pub const fn is_empty(self) -> bool {
        self.0 == 0
    }

    pub const fn is_single(self) -> bool {
        self.0 != 0 && self.0 & (self.0 - 1) == 0
    }

    /// The narrowest kind of the set: the lowest bit, since the bits run from
    /// the empty gap up through wider whitespace.
    pub const fn narrowest(self) -> Self {
        Self(self.0 & self.0.wrapping_neg())
    }

    /// The seam rank of one kind: a run of spaces, then no whitespace at all,
    /// then a run by how many lines it breaks. See [`crate::spacing::SeamRank`].
    pub fn rank(self) -> usize {
        match self {
            Self::TIGHT => 2,
            Self::NEWLINE | Self::LINE_CONTINUATION => 3,
            Self::BLANKLINE => 4,
            Self::DOUBLE_BLANKLINE => 5,
            _ => 1,
        }
    }

    /// Whether the one kind breaks the line.
    pub const fn breaks(self) -> bool {
        self.0 & (Self::BREAKING.0 | Self::LINE_CONTINUATION.0) != 0
    }

    /// The kind with one line break fewer, or none for a kind with one.
    pub fn without_first_break(self) -> Self {
        match self {
            Self::BLANKLINE => Self::NEWLINE,
            Self::DOUBLE_BLANKLINE => Self::BLANKLINE,
            _ => Self::NONE,
        }
    }

    /// The text of one kind when a writer holds no whitespace table.
    pub fn default_text(self) -> &'static str {
        match self {
            Self::SPACE => " ",
            Self::TAB => "\t",
            Self::NEWLINE => "\n",
            Self::BLANKLINE => "\n\n",
            Self::DOUBLE_BLANKLINE => "\n\n\n",
            _ => "",
        }
    }
}
