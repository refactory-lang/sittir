//! Whitespace classes derived from the bytes between two still-parsed
//! siblings. A class is one of the arms a site admits, chosen by seam rank,
//! so the value is exactly what an options address could have named.

use crate::render::WhitespaceTable;
use crate::spacing::seam_rank;

/// The admitted arm whose text has `ws`'s seam rank; a wider run takes the
/// widest admitted arm below it. Text that is not whitespace is not a gap
/// spelling and has no class. Depth arms never classify: indentation is the
/// writer's depth tracking, not a gap's spelling, and both depth arms spell
/// a plain break, so they are excluded by kind id and never by text.
pub fn classify_whitespace(ws: &str, allowed: &[u16], table: &WhitespaceTable) -> Option<u16> {
    if !ws.chars().all(char::is_whitespace) {
        return None;
    }
    let want = seam_rank(ws);
    let ranked: Vec<(u16, usize)> = allowed
        .iter()
        .copied()
        .filter(|&arm| arm != table.indent && arm != table.dedent)
        .map(|arm| (arm, seam_rank((table.text_of)(arm))))
        .collect();
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

/// A geometric list gap split around its separator `token`, as a source gap
/// splits at it: the side before the separator and the side after. Geometry
/// does not place the separator, so it is taken to sit against the earlier
/// item: on a shared row its columns are the gap's first, and a gap across
/// rows lies wholly after it. With no token, the whole gap is the side
/// before.
pub fn geometry_gap_sides(a: &crate::points::PointSpan, b: &crate::points::PointSpan, token: &str) -> (String, String) {
    let gap = geometry_gap_text(a, b);
    if token.is_empty() {
        return (gap, String::new());
    }
    let after = if b.start.row == a.last_row() { gap.get(token.len()..).unwrap_or("").to_owned() } else { gap };
    (String::new(), after)
}
