//! Whitespace classes derived from the bytes between two still-parsed
//! siblings. A class is one of the arms a site admits, chosen by seam rank,
//! so the value is exactly what an options address could have named.

use crate::render::{SourceTable, WhitespaceTable};
use crate::slot::NodeCoordinate;
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

/// The text outside a gap's separators: everything before the first `token`
/// and everything after the last one. One separator is the adjacent-pair
/// case; more than one means the items between were rebuilt and their old
/// source lies between the two, which is neither side's spelling. An empty
/// token makes the whole gap the "before" side. `None` when the token is
/// absent.
pub fn split_gap<'a>(gap: &'a str, token: &str) -> Option<(&'a str, &'a str)> {
    if token.is_empty() {
        return Some((gap, ""));
    }
    let first = gap.find(token)?;
    let last = gap.rfind(token)?;
    Some((&gap[..first], &gap[last + token.len()..]))
}

/// The most frequent class; the first seen wins a tie.
pub fn majority(classes: impl IntoIterator<Item = u16>) -> Option<u16> {
    let mut counts: Vec<(u16, usize)> = Vec::new();
    for class in classes {
        match counts.iter_mut().find(|(c, _)| *c == class) {
            Some((_, n)) => *n += 1,
            None => counts.push((class, 1)),
        }
    }
    let mut best: Option<(u16, usize)> = None;
    for &(class, n) in &counts {
        if best.is_none_or(|(_, seen)| n > seen) {
            best = Some((class, n));
        }
    }
    best.map(|(class, _)| class)
}

/// The source between two coordinates of one live tree, in source order.
fn gap_between<'s>(
    a: &NodeCoordinate,
    b: &NodeCoordinate,
    sources: &'s dyn SourceTable,
) -> Option<&'s str> {
    if a.tree_id() != b.tree_id() || a.span.end > b.span.start {
        return None;
    }
    let source = sources.source_of(a.tree_id())?;
    source.get(a.span.end as usize..b.span.start as usize)
}

/// One class per side over every classifiable gap of a list, by majority.
/// Items with no coordinate — the ones an edit rebuilt — are skipped, so a
/// gap spans from the nearest surviving coordinate on the left to the
/// nearest on the right. A gap without the token, or a pair that is not two
/// ordered coordinates of one tree, contributes nothing.
pub fn classify_list_gaps(
    items: &[Option<&NodeCoordinate>],
    sources: &dyn SourceTable,
    token: &str,
    allowed_before: &[u16],
    allowed_after: &[u16],
    table: &WhitespaceTable,
) -> (Option<u16>, Option<u16>) {
    let mut before = Vec::new();
    let mut after = Vec::new();
    let mut previous: Option<&NodeCoordinate> = None;
    for item in items.iter().flatten() {
        if let Some(a) = previous {
            if let Some(gap) = gap_between(a, item, sources) {
                if let Some((lead, trail)) = split_gap(gap, token) {
                    if let Some(class) = classify_whitespace(lead, allowed_before, table) {
                        before.push(class);
                    }
                    if let Some(class) = classify_whitespace(trail, allowed_after, table) {
                        after.push(class);
                    }
                }
            }
        }
        previous = Some(item);
    }
    (majority(before), majority(after))
}
