//! Whitespace classes derived from the bytes between two still-parsed
//! siblings. A class is one of the arms a site admits, chosen by seam rank,
//! so the value is exactly what an options address could have named.

use crate::render::WhitespaceTable;
use crate::layout_kinds::LayoutKinds;
use crate::types::KindId;
use crate::spacing::{seam_rank, SeamRank};

/// The admitted arm spelled as `ws`, else the one whose text has its seam
/// rank (a space and a tab share one); a wider run takes the widest admitted
/// arm below it. Text that is not whitespace is not a gap
/// spelling and has no class. Depth arms never classify: indentation is the
/// writer's depth tracking, not a gap's spelling, and both depth arms spell
/// a plain break, so they are excluded by kind id and never by text.
pub fn classify_whitespace(ws: &str, allowed: &[KindId], table: &WhitespaceTable) -> Option<KindId> {
    if !ws.chars().all(char::is_whitespace) {
        return None;
    }
    classify(seam_rank(ws), |arm| (table.text_of)(arm) == ws, allowed, table)
}

/// The admitted arm that is the gap kind `kind` (`WhitespaceTable::gap_of`),
/// else the one of its seam rank, else the widest admitted arm below it, as
/// `classify_whitespace` classifies the kind's text: a stamped kind needs no
/// text to resolve. `NONE` and sets of kinds classify to nothing.
#[must_use]
pub fn classify_kind(kind: LayoutKinds, allowed: &[KindId], table: &WhitespaceTable) -> Option<KindId> {
    if !kind.is_single() {
        return None;
    }
    classify(kind.rank(), |arm| table.gap_of(arm) == Some(kind), allowed, table)
}

/// The admitted arm `spells` holds, else the one of seam rank `want`, else
/// the widest admitted arm below it; depth arms never classify.
fn classify(want: SeamRank, spells: impl Fn(KindId) -> bool, allowed: &[KindId], table: &WhitespaceTable) -> Option<KindId> {
    let ranked: Vec<(KindId, usize)> = allowed
        .iter()
        .copied()
        .filter(|&arm| arm != table.indent && arm != table.dedent)
        .map(|arm| (arm, seam_rank((table.text_of)(arm))))
        .collect();
    if let Some(&(arm, _)) = ranked.iter().find(|&&(arm, _)| spells(arm)) {
        return Some(arm);
    }
    if let Some(&(arm, _)) = ranked.iter().find(|(_, rank)| *rank == want) {
        return Some(arm);
    }
    ranked
        .iter()
        .filter(|(_, rank)| *rank < want)
        .max_by_key(|(_, rank)| *rank)
        .map(|&(arm, _)| arm)
}

/// The whitespace two spans in one frame imply for the gap between them, `a`
/// before `b`: the columns between them when `b` starts on `a`'s last row,
/// else a break per row crossed and `b`'s column as its indentation. What
/// geometry cannot give (tabs, trailing spaces, line endings) is left to the
/// options. Columns count bytes, as a point's do.
#[must_use]
pub fn geometry_gap(a: &crate::points::PointSpan, b: &crate::points::PointSpan) -> GeometryGap {
    let last = a.last_row();
    if b.start.row == last {
        let from = if a.end.row == last { a.end.column } else { 0 };
        GeometryGap { breaks: 0, spaces: b.start.column.saturating_sub(from) }
    } else {
        GeometryGap { breaks: b.start.row.saturating_sub(last), spaces: b.start.column }
    }
}

/// A gap as geometry implies it: `breaks` line breaks, then `spaces` spaces.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct GeometryGap {
    pub breaks: u32,
    pub spaces: u32,
}

impl GeometryGap {
    /// The one gap kind the gap is: no whitespace, a run of spaces, or a run
    /// by how many lines it breaks, its indentation the writer's. A kind
    /// classifies to the arm the gap itself does (`classify_kind`).
    #[must_use]
    pub fn kind(self) -> LayoutKinds {
        match (self.breaks, self.spaces) {
            (0, 0) => LayoutKinds::TIGHT,
            (0, _) => LayoutKinds::SPACE,
            (1, _) => LayoutKinds::NEWLINE,
            (2, _) => LayoutKinds::BLANKLINE,
            _ => LayoutKinds::DOUBLE_BLANKLINE,
        }
    }

}
