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

/// The side of its separator a gap's run lies on.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SlotSide {
    Before,
    After,
}

/// A gap's separator: its grammar id and bytes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Separator {
    pub kind: crate::types::KindId,
    pub start: u32,
    pub end: u32,
}

/// One separator gap between two items of a list slot: the items'
/// descendant indexes, its runs before and after its separator by their
/// places among the trivia table's runs (`TriviaTable::runs`), where the
/// table has one there, and its separator.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SlotGap {
    pub items: (u32, u32),
    pub before: Option<usize>,
    pub after: Option<usize>,
    pub separator: Separator,
}

/// A list slot of a node: its wire key and the gaps it spells.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SlotGaps {
    pub key: &'static str,
    pub gaps: Vec<SlotGap>,
}

/// The list slots of a routed node, each with the separator gaps it spells;
/// `run_at` finds the run from one byte to another.
pub fn slot_gaps(routed: &Routed, run_at: impl Fn(u32, u32) -> Option<usize>) -> Vec<SlotGaps> {
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
                            _ => return None,
                        }
                    }
                    let [separator] = separators.as_slice() else { return None };
                    Some(SlotGap {
                        items: (first.index, last.index),
                        before: run_at(first.end, separator.start),
                        after: run_at(separator.end, last.start),
                        separator: Separator { kind: separator.grammar, start: separator.start, end: separator.end },
                    })
                })
                .collect();
            Some(SlotGaps { key, gaps })
        })
        .collect()
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
    use crate::read::Child;
    use crate::types::KindId;

    fn child(index: u32, start: u32, end: u32) -> Child {
        Child { index, grammar: KindId(index as u16), display: KindId(index as u16), field: None, named: true, trivia: false, start, end, descendants: 1 }
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
        };
        let runs = [(1, 2), (3, 4), (5, 5), (6, 6)];
        let run_at = |start, end| runs.iter().position(|&run| run == (start, end));
        let [slot] = slot_gaps(&routed, run_at).try_into().unwrap();
        assert_eq!(slot.key, "_item");
        assert_eq!(slot.gaps.iter().map(|gap| (gap.before, gap.after)).collect::<Vec<_>>(), vec![(Some(0), Some(1)), (Some(2), Some(3))]);
        assert_eq!(slot.gaps[0].separator, Separator { kind: KindId(2), start: 2, end: 3 });
    }

    #[test]
    fn a_gap_with_no_separator_is_not_spelled() {
        let routed = Routed {
            children: vec![child(1, 0, 1), child(2, 2, 3)],
            routes: vec![Route::Slot { slot: crate::types::SlotId(0), scalar: false }, Route::Slot { slot: crate::types::SlotId(0), scalar: false }],
            keys: &["_statements"],
        };
        let [slot] = slot_gaps(&routed, |_, _| Some(0)).try_into().unwrap();
        assert!(slot.gaps.is_empty());
    }

    #[test]
    fn a_gap_holding_trivia_or_another_slots_child_is_not_spelled() {
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
        };
        let [slot] = slot_gaps(&routed, |_, _| Some(0)).try_into().unwrap();
        assert!(slot.gaps.is_empty());
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
