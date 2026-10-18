//! Whitespace classes derived from the bytes between two still-parsed
//! siblings. A class is one of the arms a site admits, chosen by seam rank,
//! so the value is exactly what an options address could have named.

use crate::render::WhitespaceTable;
use crate::types::KindId;
use crate::spacing::seam_rank;

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
    let want = seam_rank(ws);
    let ranked: Vec<(KindId, usize)> = allowed
        .iter()
        .copied()
        .filter(|&arm| arm != table.indent && arm != table.dedent)
        .map(|arm| (arm, seam_rank((table.text_of)(arm))))
        .collect();
    if let Some(&(arm, _)) = ranked.iter().find(|&&(arm, _)| (table.text_of)(arm) == ws) {
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
pub fn geometry_gap_text(a: &crate::points::PointSpan, b: &crate::points::PointSpan) -> String {
    let last = a.last_row();
    if b.start.row == last {
        let from = if a.end.row == last { a.end.column } else { 0 };
        " ".repeat(b.start.column.saturating_sub(from) as usize)
    } else {
        let mut gap = "\n".repeat(b.start.row.saturating_sub(last) as usize);
        gap.push_str(&" ".repeat(b.start.column as usize));
        gap
    }
}
