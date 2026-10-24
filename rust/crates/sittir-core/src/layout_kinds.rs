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

    #[must_use]
    pub const fn from_bits(bits: u8) -> Self {
        Self(bits)
    }

    #[must_use]
    pub const fn has(self, other: Self) -> bool {
        self.0 & other.0 != 0
    }

    #[must_use]
    pub const fn and(self, other: Self) -> Self {
        Self(self.0 & other.0)
    }

    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub const fn is_single(self) -> bool {
        self.0 != 0 && self.0.is_power_of_two()
    }

    /// The narrowest kind of the set: the lowest bit, since the bits run from
    /// the empty gap up through wider whitespace.
    #[must_use]
    pub const fn narrowest(self) -> Self {
        Self(self.0 & self.0.wrapping_neg())
    }

    /// The seam rank of one kind: a run of spaces, then no whitespace at all,
    /// then a run by how many lines it breaks. See [`crate::spacing::SeamRank`].
    #[must_use]
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
    #[must_use]
    pub const fn breaks(self) -> bool {
        self.0 & (Self::BREAKING.0 | Self::LINE_CONTINUATION.0) != 0
    }

    /// The kind with one line break fewer, or none for a kind with one.
    #[must_use]
    pub fn without_first_break(self) -> Self {
        match self {
            Self::BLANKLINE => Self::NEWLINE,
            Self::DOUBLE_BLANKLINE => Self::BLANKLINE,
            _ => Self::NONE,
        }
    }

    /// The text of one kind when a writer holds no whitespace table.
    #[must_use]
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

/// A snapshot root's two flanks as its read stamped them: the gap kind
/// before its first item and after its last, each one kind or `NONE` where
/// the read stamped none (`ReadCtx::layout`). The render resolves each to
/// the arm its edge site admits (`classify::classify_kind`).
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default)]
pub struct Flanks {
    pub before: LayoutKinds,
    pub after: LayoutKinds,
}

impl Flanks {
    /// Whether neither flank is stamped.
    #[must_use]
    pub const fn is_none(self) -> bool {
        self.before.is_empty() && self.after.is_empty()
    }

    /// The flanks as one word, as a side record and the wire hold them: the
    /// before kind in the low byte, the after kind in the next.
    #[must_use]
    pub fn word(self) -> u32 {
        u32::from(self.before.0) | u32::from(self.after.0) << 8
    }

    /// The flanks a word holds (`word`); `None` for a word past two bytes or
    /// a byte that is neither one kind nor `NONE`.
    #[must_use]
    pub fn of_word(word: u32) -> Option<Self> {
        let kind = |byte: u32| u8::try_from(byte).ok().map(LayoutKinds).filter(|kind| kind.is_empty() || (kind.is_single() && LayoutKinds::ALL.has(*kind)));
        if word >> 16 != 0 {
            return None;
        }
        Some(Self { before: kind(word & 0xff)?, after: kind(word >> 8)? })
    }
}
