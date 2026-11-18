//! A node's list slots and the gaps between their items.
//!
//! A list slot of a node is a slot its read routes two or more children to
//! (`read::Routed`). The gap between two of its items is a separator gap the
//! slot's layout spells when nothing but one of the slot's own separators
//! lies between them: its run before the separator and its run after it. A
//! gap with no separator (a sequence's, whose breaks are each gap's own), or
//! holding an extra, an `ERROR`, another slot's child or more than one
//! separator, is no gap the slot spells.

use crate::read::{Route, Routed};
use std::collections::BTreeMap;

/// A gap's separator: its grammar id and bytes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Separator {
    pub kind: crate::types::KindId,
    pub start: u32,
    pub end: u32,
}

/// One separator gap between two items of a list slot: the items'
/// descendant indexes and its separator.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SlotGap {
    pub items: (crate::types::NodeIndex, crate::types::NodeIndex),
    pub separator: Separator,
}

/// A list slot of a node: its wire key and the gaps it spells.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SlotGaps {
    pub key: &'static str,
    pub gaps: Vec<SlotGap>,
}

/// The list slots of a routed node, each with the separator gaps it spells.
#[must_use]
pub fn slot_gaps(routed: &Routed) -> Vec<SlotGaps> {
    let mut items: BTreeMap<crate::types::SlotId, Vec<usize>> = BTreeMap::new();
    for (at, route) in routed.routes.iter().enumerate() {
        if let Route::Slot { slot, .. } = *route {
            items.entry(slot).or_default().push(at);
        }
    }
    items
        .into_iter()
        .filter(|(_, at)| at.len() >= 2)
        .filter_map(|(slot, at)| {
            let key = *routed.keys.get(slot.index())?;
            let gaps = at
                .windows(2)
                .filter_map(|pair| {
                    let (first, last) = (&routed.children[pair[0]], &routed.children[pair[1]]);
                    let mut separators = Vec::new();
                    for between in pair[0] + 1..pair[1] {
                        match routed.routes[between] {
                            Route::Separator { slot: own, .. } if own == slot => separators.push(&routed.children[between]),
                            Route::Trivia => {}
                            _ => return None,
                        }
                    }
                    let [separator] = separators.as_slice() else { return None };
                    Some(SlotGap {
                        items: (first.index, last.index),
                        separator: Separator { kind: separator.grammar, start: separator.start, end: separator.end },
                    })
                })
                .collect();
            Some(SlotGaps { key, gaps })
        })
        .collect()
}

/// Each item of a routed node's list slots, in document order, with whether
/// the source sets it apart from the item before with a blank line
/// (`sets_apart`); a slot's first item never is.
#[must_use]
pub fn list_items(routed: &Routed, source: &str) -> Vec<(crate::types::NodeIndex, bool)> {
    let mut slots: BTreeMap<crate::types::SlotId, Vec<usize>> = BTreeMap::new();
    for (at, route) in routed.routes.iter().enumerate() {
        if let Route::Slot { slot, .. } = *route {
            slots.entry(slot).or_default().push(at);
        }
    }
    let mut items: Vec<(crate::types::NodeIndex, bool)> = Vec::new();
    for at in slots.values().filter(|at| at.len() >= 2) {
        items.push((routed.children[at[0]].index, false));
        items.extend(at.windows(2).map(|pair| {
            let (before, item) = (&routed.children[pair[0]], &routed.children[pair[1]]);
            let extras = (pair[0] + 1..pair[1]).filter(|&between| routed.routes[between] == Route::Trivia).map(|between| routed.children[between].span());
            (item.index, sets_apart(source, before.end, item.start, extras))
        }));
    }
    items.sort_unstable_by_key(|&(item, _)| item);
    items
}

/// Whether the source between `from` (an item's end) and `to` (the next
/// item's start), holding `extras` in document order, sets the next item
/// apart with a blank line: whether the first run of line breaks after the
/// item and the extras on its last row breaks two lines before the next
/// extra, token or the item. A blank line between an extra on a row of its
/// own and the item does not count: that extra leads the item. An extra
/// whose bytes end in a line break ends its row.
#[must_use]
pub fn sets_apart(source: &str, from: u32, to: u32, extras: impl IntoIterator<Item = crate::types::Span>) -> bool {
    let bytes = source.as_bytes();
    let mut extras = extras.into_iter().filter(|extra| extra.start >= from && extra.end <= to).peekable();
    let mut breaks = 0;
    let mut at = from;
    while at < to {
        if let Some(extra) = extras.next_if(|extra| extra.start <= at) {
            if breaks > 0 {
                return breaks >= 2;
            }
            if extra.end > extra.start && bytes.get(extra.end as usize - 1) == Some(&b'\n') {
                breaks = 1;
            }
            at = at.max(extra.end);
            continue;
        }
        match bytes.get(at as usize) {
            Some(b'\n') => breaks += 1,
            Some(&byte) if crate::points::blank(byte) => {}
            Some(_) if breaks > 0 => return breaks >= 2,
            _ => {}
        }
        at += 1;
    }
    breaks >= 2
}

/// The value most of `values` take. On a tie, `preferred` when it is among
/// the tied values, else the first of them in order. `None` for no values.
pub fn majority<T: Copy + PartialEq>(values: &[T], preferred: Option<T>) -> Option<T> {
    let mut counts: Vec<(T, usize)> = Vec::new();
    for &value in values {
        match counts.iter_mut().find(|(other, _)| *other == value) {
            Some((_, count)) => *count += 1,
            None => counts.push((value, 1)),
        }
    }
    let most = counts.iter().map(|&(_, count)| count).max()?;
    let mut tied = counts.iter().filter(|&&(_, count)| count == most).map(|&(value, _)| value);
    let first = tied.clone().next();
    preferred.filter(|preferred| tied.any(|value| value == *preferred)).or(first)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::read::Kid;
    use crate::types::{KindId, NodeIndex};

    fn child(index: u32, start: u32, end: u32) -> Kid {
        let kind = KindId(u16::try_from(index).unwrap());
        Kid { index: crate::types::NodeIndex(index), start, end, count: 1, grammar: kind, display: kind, field: None, named: true, extra: false }
    }

    #[test]
    fn a_slot_spells_the_gaps_its_own_separators_part() {
        let routed = Routed {
            children: vec![child(1, 0, 1), child(2, 2, 3), child(3, 4, 5), child(4, 5, 6), child(5, 6, 7)],
            routes: vec![
                Route::Slot { slot: crate::types::SlotId(0), scalar: false },
                Route::Separator { slot: crate::types::SlotId(0), tagged: false },
                Route::Slot { slot: crate::types::SlotId(0), scalar: false },
                Route::Separator { slot: crate::types::SlotId(0), tagged: false },
                Route::Slot { slot: crate::types::SlotId(0), scalar: false },
            ],
            keys: &["_item"],
            elided: &[false],
            flags: &[false],
        };
        let [slot] = slot_gaps(&routed).try_into().unwrap();
        assert_eq!(slot.key, "_item");
        assert_eq!(slot.gaps.iter().map(|gap| gap.items).collect::<Vec<_>>(), vec![(NodeIndex(1), NodeIndex(3)), (NodeIndex(3), NodeIndex(5))]);
        assert_eq!(slot.gaps[0].separator, Separator { kind: KindId(2), start: 2, end: 3 });
    }

    #[test]
    fn a_gap_with_no_separator_is_not_spelled() {
        let routed = Routed {
            children: vec![child(1, 0, 1), child(2, 2, 3)],
            routes: vec![Route::Slot { slot: crate::types::SlotId(0), scalar: false }, Route::Slot { slot: crate::types::SlotId(0), scalar: false }],
            keys: &["_statements"],
            elided: &[false],
            flags: &[false],
        };
        let [slot] = slot_gaps(&routed).try_into().unwrap();
        assert!(slot.gaps.is_empty(), "{:?}", slot.gaps);
    }

    #[test]
    fn a_gap_holding_a_comment_beside_its_separator_is_spelled_by_that_separator() {
        let routed = Routed {
            children: vec![child(1, 0, 1), child(2, 1, 2), child(3, 3, 8), child(4, 9, 10), child(5, 11, 12), child(6, 12, 12), child(7, 13, 14)],
            routes: vec![
                Route::Slot { slot: crate::types::SlotId(0), scalar: false },
                Route::Separator { slot: crate::types::SlotId(0), tagged: false },
                Route::Trivia,
                Route::Slot { slot: crate::types::SlotId(0), scalar: false },
                Route::Trivia,
                Route::Separator { slot: crate::types::SlotId(0), tagged: false },
                Route::Slot { slot: crate::types::SlotId(0), scalar: false },
            ],
            keys: &["_item"],
            elided: &[false],
            flags: &[false],
        };
        let [slot] = slot_gaps(&routed).try_into().unwrap();
        assert_eq!(slot.gaps.len(), 2, "{:?}", slot.gaps);
        assert_eq!(slot.gaps[0].separator, Separator { kind: KindId(2), start: 1, end: 2 });
        assert_eq!(slot.gaps[1].separator, Separator { kind: KindId(6), start: 12, end: 12 });
    }

    #[test]
    fn a_gap_with_no_separator_of_its_own_is_not_spelled_whatever_else_it_holds() {
        let routed = Routed {
            children: vec![child(1, 0, 1), child(2, 2, 3), child(3, 4, 5), child(4, 6, 7), child(5, 8, 9)],
            routes: vec![
                Route::Slot { slot: crate::types::SlotId(0), scalar: false },
                Route::Trivia,
                Route::Slot { slot: crate::types::SlotId(0), scalar: false },
                Route::Slot { slot: crate::types::SlotId(1), scalar: false },
                Route::Slot { slot: crate::types::SlotId(0), scalar: false },
            ],
            keys: &["_item", "_other"],
            elided: &[false, false],
            flags: &[false, false],
        };
        let [slot] = slot_gaps(&routed).try_into().unwrap();
        assert!(slot.gaps.is_empty(), "{:?}", slot.gaps);
    }

    fn apart(source: &str, before: &str, item: &str, extras: &[&str]) -> bool {
        let from = u32::try_from(source.find(before).unwrap() + before.len()).unwrap();
        let to = u32::try_from(source.rfind(item).unwrap()).unwrap();
        let spans: Vec<crate::types::Span> = extras
            .iter()
            .map(|extra| {
                let start = u32::try_from(source.find(extra).unwrap()).unwrap();
                crate::types::Span { start, end: start + u32::try_from(extra.len()).unwrap() }
            })
            .collect();
        sets_apart(source, from, to, spans)
    }

    #[test]
    fn a_blank_line_between_items_sets_the_second_apart_whatever_its_length() {
        assert!(apart("a();\n\nb();", "a();", "b();", &[]));
        assert!(apart("a();\n\n\n\nb();", "a();", "b();", &[]));
        assert!(apart("a();\n  \t\r\n  b();", "a();", "b();", &[]));
        assert!(!apart("a();\nb();", "a();", "b();", &[]));
        assert!(!apart("a(); b();", "a();", "b();", &[]));
    }

    #[test]
    fn the_blank_line_is_measured_to_the_item_s_first_leading_extra() {
        assert!(apart("a();\n\n// c\nb();", "a();", "b();", &["// c"]));
        assert!(!apart("a();\n// d\n\nb();", "a();", "b();", &["// d"]));
        assert!(apart("a();  // t\n\nb();", "a();", "b();", &["// t"]));
        assert!(apart("a(); // t\n\n// c\nb();", "a();", "b();", &["// t", "// c"]));
        assert!(!apart("a(); /* m\n\nn */\nb();", "a();", "b();", &["/* m\n\nn */"]));
    }

    #[test]
    fn a_separator_or_an_extra_ending_its_row_counts_as_the_gap_does() {
        assert!(apart("f(a,\n\n  b)", "a", "b)", &[]));
        assert!(apart("a\n\nb", "a", "b", &[]));
        assert!(!apart("a\n, b", "a", "b", &[]));
        assert!(apart("a # t\n\nb", "a", "b", &["# t\n"]));
        assert!(!apart("a # t\nb", "a", "b", &["# t\n"]));
    }

    #[test]
    fn a_tie_takes_the_preferred_value_when_tied_else_the_first() {
        assert_eq!(majority(&[1, 2, 2], Some(1)), Some(2));
        assert_eq!(majority(&[1, 2], Some(2)), Some(2));
        assert_eq!(majority(&[1, 2], Some(3)), Some(1));
        assert_eq!(majority(&[3, 1, 2, 2, 1], None), Some(1));
        assert_eq!(majority::<u16>(&[], Some(1)), None);
    }
}
