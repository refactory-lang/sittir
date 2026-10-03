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
pub fn gap_between<'s>(
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

/// One list item as the gap vote sees it: its coordinate when it crossed as
/// one, and the whitespace run its leading trivia opens with when it carries
/// one (`Prepare::leading_seam`).
pub struct GapItem<'a> {
    pub coord: Option<&'a NodeCoordinate>,
    pub held: Option<&'a str>,
}

/// A list's source gaps: one class per side over every classifiable gap, by
/// majority, and for each item whether the gap from it to the next
/// coordinate is a source separator: it splits on the token and each side
/// with a site classifies. Every gap the source shows votes once. An item
/// past the first that carries a whitespace run toward its predecessor votes
/// that run: the whole gap's class with no token, the after side with one,
/// since the run starts past the separator. Its gap is then never also read
/// as a coordinate pair, because the pair chain restarts after it. Items with
/// no coordinate and no run, the ones an edit rebuilt, are skipped, so a gap
/// spans from the nearest surviving coordinate on the left to the nearest on
/// the right. A gap without the token, or a pair that is not two ordered
/// coordinates of one tree, contributes nothing and leaves its item
/// unseparated, as does a pair with a coordinate that addresses its text only.
pub struct ListGaps {
    pub before: Option<u16>,
    pub after: Option<u16>,
    pub separated: Vec<bool>,
}

pub fn classify_list_gaps(
    items: &[GapItem<'_>],
    sources: &dyn SourceTable,
    token: &str,
    allowed_before: &[u16],
    allowed_after: &[u16],
    table: &WhitespaceTable,
) -> ListGaps {
    let mut before = Vec::new();
    let mut after = Vec::new();
    let mut separated = vec![false; items.len()];
    let mut previous: Option<(usize, &NodeCoordinate)> = None;
    let mut seen = false;
    for (index, gap_item) in items.iter().enumerate() {
        let present = gap_item.coord.is_some() || gap_item.held.is_some();
        if let (true, Some(run)) = (seen, gap_item.held) {
            if token.is_empty() {
                before.extend(classify_whitespace(run, allowed_before, table));
            } else {
                after.extend(classify_whitespace(run, allowed_after, table));
            }
            previous = None;
            continue;
        }
        seen |= present;
        let Some(item) = gap_item.coord else {
            if gap_item.held.is_some() {
                previous = None;
            }
            continue;
        };
        if let Some((at, a)) = previous {
            let evidence = a.is_layout_evidence() && item.is_layout_evidence();
            if let Some((lead, trail)) = evidence
                .then(|| gap_between(a, item, sources))
                .flatten()
                .and_then(|gap| split_gap(gap, token))
            {
                let lead_class = classify_whitespace(lead, allowed_before, table);
                let trail_class = classify_whitespace(trail, allowed_after, table);
                before.extend(lead_class);
                after.extend(trail_class);
                separated[at] = (allowed_before.is_empty() || lead_class.is_some())
                    && (allowed_after.is_empty() || trail_class.is_some());
            }
        }
        previous = Some((index, item));
    }
    ListGaps { before: majority(before), after: majority(after), separated }
}
