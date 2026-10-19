//! Whitespace classes derived from the bytes between two still-parsed
//! siblings. A class is one of the arms a site admits, chosen by seam rank,
//! so the value is exactly what an options address could have named.

use crate::render::WhitespaceTable;
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
    classify(seam_rank(ws), |text| text == ws, allowed, table)
}

/// `classify_whitespace` of the text `gap` implies, read from its counts:
/// no text is made, so a gap of any size classifies in constant space.
#[must_use]
pub fn classify_gap(gap: GeometryGap, allowed: &[KindId], table: &WhitespaceTable) -> Option<KindId> {
    classify(gap.rank(), |text| gap.spelled_by(text), allowed, table)
}

/// The admitted arm `spells` names, else the one of seam rank `want`, else
/// the widest admitted arm below it; depth arms never classify.
fn classify(want: SeamRank, spells: impl Fn(&str) -> bool, allowed: &[KindId], table: &WhitespaceTable) -> Option<KindId> {
    let ranked: Vec<(KindId, usize)> = allowed
        .iter()
        .copied()
        .filter(|&arm| arm != table.indent && arm != table.dedent)
        .map(|arm| (arm, seam_rank((table.text_of)(arm))))
        .collect();
    if let Some(&(arm, _)) = ranked.iter().find(|&&(arm, _)| spells((table.text_of)(arm))) {
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
    /// The gap's seam rank (`seam_rank` of its text).
    #[must_use]
    pub fn rank(self) -> SeamRank {
        match (self.breaks, self.spaces) {
            (0, 0) => 2,
            (0, _) => 1,
            (breaks, _) => 2 + breaks as SeamRank,
        }
    }

    /// Whether `text` is the gap's text: its breaks as `\n`, then its spaces.
    #[must_use]
    pub fn spelled_by(self, text: &str) -> bool {
        let (breaks, spaces) = (self.breaks as usize, self.spaces as usize);
        text.len() == breaks.saturating_add(spaces) && text.bytes().enumerate().all(|(at, byte)| byte == if at < breaks { b'\n' } else { b' ' })
    }
}
