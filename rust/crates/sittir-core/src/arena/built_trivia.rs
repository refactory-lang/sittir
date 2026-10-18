//! The built nodes' trivia: one table per engine, beside its built-record
//! arena. A node's sides are keyed by its record's address, a unit's by its
//! holder's record, the slot's stamped word and the item. Writing a side
//! updates the table, never the immutable record or a record that shares it.
//! A parsed node placed in a built holder keeps its sides in its tree's table.

use std::collections::HashMap;

use super::Address;
use crate::trivia::{NodeTrivia, TriviaEntry};
use crate::trivia_table::TriviaSide;
use crate::types::ItemIndex;

/// Where a unit's sides are kept: its holder's record, the slot's stamped
/// word and the unit's item in that slot.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UnitKey {
    pub holder: Address,
    pub word: u32,
    pub item: ItemIndex,
}

#[derive(Debug, Clone)]
pub struct BuiltTrivia<T> {
    nodes: HashMap<Address, NodeTrivia<T>>,
    units: HashMap<UnitKey, NodeTrivia<T>>,
}

impl<T> Default for BuiltTrivia<T> {
    fn default() -> Self {
        Self { nodes: HashMap::new(), units: HashMap::new() }
    }
}

fn side_of<T>(trivia: &NodeTrivia<T>, side: TriviaSide) -> Option<&[TriviaEntry<T>]> {
    match side {
        TriviaSide::Leading => trivia.leading.as_deref(),
        TriviaSide::Trailing => trivia.trailing.as_deref(),
        TriviaSide::Inner => trivia.inner.as_deref(),
    }
}

fn side_of_mut<T>(trivia: &mut NodeTrivia<T>, side: TriviaSide) -> &mut Option<Vec<TriviaEntry<T>>> {
    match side {
        TriviaSide::Leading => &mut trivia.leading,
        TriviaSide::Trailing => &mut trivia.trailing,
        TriviaSide::Inner => &mut trivia.inner,
    }
}

fn holds_any<T>(trivia: &NodeTrivia<T>) -> bool {
    trivia.leading.is_some() || trivia.trailing.is_some() || trivia.inner.is_some()
}

impl<T> BuiltTrivia<T> {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// The trivia the node at `at` holds, every side it holds.
    #[must_use]
    pub fn node(&self, at: Address) -> Option<&NodeTrivia<T>> {
        self.nodes.get(&at)
    }

    /// One side of the node at `at`, when the node holds it.
    #[must_use]
    pub fn side(&self, at: Address, side: TriviaSide) -> Option<&[TriviaEntry<T>]> {
        self.nodes.get(&at).and_then(|trivia| side_of(trivia, side))
    }

    /// The node at `at` holds `trivia`, in place of what it held.
    pub fn set_node(&mut self, at: Address, trivia: NodeTrivia<T>) {
        if holds_any(&trivia) {
            self.nodes.insert(at, trivia);
        } else {
            self.nodes.remove(&at);
        }
    }

    /// The node at `at` holds `entries` on `side`, or no such side with `None`.
    pub fn set_side(&mut self, at: Address, side: TriviaSide, entries: Option<Vec<TriviaEntry<T>>>) {
        let trivia = self.nodes.entry(at).or_default();
        *side_of_mut(trivia, side) = entries;
        if !holds_any(trivia) {
            self.nodes.remove(&at);
        }
    }

    /// The sides of the unit at `key`.
    #[must_use]
    pub fn unit(&self, key: UnitKey) -> Option<&NodeTrivia<T>> {
        self.units.get(&key)
    }

    /// The unit at `key` holds `trivia`, in place of what it held.
    pub fn set_unit(&mut self, key: UnitKey, trivia: NodeTrivia<T>) {
        if holds_any(&trivia) {
            self.units.insert(key, trivia);
        } else {
            self.units.remove(&key);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::slot::SlotValue;

    fn entries(n: u8) -> Vec<TriviaEntry<u8>> {
        vec![TriviaEntry { value: SlotValue::Node(n) }]
    }

    #[test]
    fn a_node_s_sides_are_kept_by_its_record() {
        let mut table = BuiltTrivia::new();
        let (a, b) = (Address(4), Address(9));
        table.set_node(a, NodeTrivia { leading: Some(entries(1)), trailing: None, inner: Some(Vec::new()) });
        assert_eq!(table.side(a, TriviaSide::Leading), Some(entries(1).as_slice()));
        assert_eq!(table.side(a, TriviaSide::Trailing), None);
        assert_eq!(table.side(a, TriviaSide::Inner), Some([].as_slice()), "an empty side is held apart from none");
        assert!(table.node(b).is_none());
    }

    #[test]
    fn setting_a_side_keeps_the_others() {
        let mut table = BuiltTrivia::new();
        let at = Address(4);
        table.set_side(at, TriviaSide::Leading, Some(entries(1)));
        table.set_side(at, TriviaSide::Trailing, Some(entries(2)));
        table.set_side(at, TriviaSide::Leading, None);
        assert_eq!(table.side(at, TriviaSide::Leading), None);
        assert_eq!(table.side(at, TriviaSide::Trailing), Some(entries(2).as_slice()));
        table.set_side(at, TriviaSide::Trailing, None);
        assert!(table.node(at).is_none(), "a node with no side is not kept");
    }

    #[test]
    fn a_unit_s_sides_are_kept_by_holder_slot_and_item() {
        let mut table = BuiltTrivia::new();
        let key = UnitKey { holder: Address(4), word: 2, item: ItemIndex(1) };
        table.set_unit(key, NodeTrivia { leading: None, trailing: Some(entries(3)), inner: None });
        assert_eq!(table.unit(key).and_then(|trivia| trivia.trailing.as_deref()), Some(entries(3).as_slice()));
        assert!(table.unit(UnitKey { item: ItemIndex(0), ..key }).is_none());
        assert!(table.unit(UnitKey { word: 3, ..key }).is_none());
        table.set_unit(key, NodeTrivia::default());
        assert!(table.unit(key).is_none());
    }
}
