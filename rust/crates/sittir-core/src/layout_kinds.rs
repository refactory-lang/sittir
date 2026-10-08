//! The gap kinds a leaf's edge can take layout text of, as an 8-bit set.
//! indent and dedent are depth moves, outside the set.

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
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

    pub const fn has(self, other: Self) -> bool {
        self.0 & other.0 != 0
    }

    /// The kind whose text a seam holds: its line breaks decide it, else its
    /// tab or space.
    pub fn of_text(text: &str) -> Self {
        match text.matches('\n').count() {
            0 if text.is_empty() => Self::TIGHT,
            0 if text.contains('\t') => Self::TAB,
            0 => Self::SPACE,
            1 => Self::NEWLINE,
            2 => Self::BLANKLINE,
            _ => Self::DOUBLE_BLANKLINE,
        }
    }
}
