//! A parsed tree's arena and the records it holds itself.
//!
//! A parsed node's record is written on its first read, whatever the read,
//! and is the node's storage from then on. A tree holds one record per row,
//! however the row is reached. A node a cell names is reached through that
//! cell, which names its record once a read writes it. A node no cell names
//! (the root, an extra a side holds, a node inside an `ERROR` or inside a
//! leaf's captured text) is held by its tree, by its row, here: the one place
//! a row names a record. The map never leaves native code.

use super::{Address, Arena, ArenaError};
use crate::types::NodeIndex;
use std::collections::{HashMap, HashSet};

/// One parsed tree's records, and those no cell names, by their rows.
#[derive(Debug)]
pub struct TreeArena {
    arena: Arena,
    held: HashMap<NodeIndex, Address>,
    nodes: u32,
    /// Native record starts, including an embedded record, which starts
    /// inside its holder's.
    records: HashSet<Address>,
}

impl TreeArena {
    /// The arena of a tree of `rows` nodes whose kind fields take
    /// `kind_bits` bits.
    #[must_use]
    pub fn new(kind_bits: u32, rows: u32) -> Self {
        Self { arena: Arena::with_kind_bits(kind_bits), held: HashMap::new(), nodes: rows, records: HashSet::new() }
    }

    #[must_use]
    pub fn arena(&self) -> &Arena {
        &self.arena
    }

    /// The record the tree holds for `row`, a node no cell names, or `None`
    /// while no read has written one.
    #[must_use]
    pub fn held(&self, row: NodeIndex) -> Option<Address> {
        self.held.get(&row).copied()
    }

    pub(super) fn arena_mut(&mut self) -> &mut Arena {
        &mut self.arena
    }

    /// Appends a native node record; side records and list runs use the
    /// arena directly and never enter the set of record starts.
    pub(super) fn push_record(&mut self, words: &[u32]) -> Result<Address, ArenaError> {
        let at = self.arena.push(words)?;
        self.records.insert(at);
        Ok(at)
    }

    #[must_use]
    /// Whether the native writer allocated a record at `at`.
    pub(super) fn contains_record(&self, at: Address) -> bool {
        self.records.contains(&at)
    }

    pub(super) fn keep_inline(&mut self, at: Address) {
        self.records.insert(at);
    }

    /// Holds `at` as the record of `row`, a node no cell names, for every
    /// later read of it.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for an address no record is at, or a row past
    /// the tree's nodes, and `ArenaError::Unwritable` when the tree holds a
    /// record for `row` already. Either way nothing is held.
    pub(super) fn hold(&mut self, row: NodeIndex, at: Address) -> Result<(), ArenaError> {
        at.record()?;
        if row.0 >= self.nodes {
            return Err(ArenaError::Malformed { what: "record row", word: row.0 });
        }
        if self.held.contains_key(&row) {
            return Err(ArenaError::Unwritable("a second record for a row"));
        }
        self.held.insert(row, at);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_held_row_holds_one_record() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 16);
        let row = NodeIndex(3);
        assert_eq!(tree.held(row), None);
        let first = tree.push_record(&[7, 8]).expect("room");
        tree.hold(row, first).expect("the row had none");
        assert_eq!(tree.held(row), Some(first));
        let second = tree.push_record(&[9, 0]).expect("room");
        assert_eq!(tree.hold(row, second), Err(ArenaError::Unwritable("a second record for a row")));
        assert_eq!(tree.held(row), Some(first), "the first record stays the row's");
    }

    #[test]
    fn no_address_names_no_record() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 16);
        assert_eq!(tree.hold(NodeIndex(4), Address::NONE), Err(ArenaError::Malformed { what: "record address", word: 0 }));
        assert_eq!(tree.held(NodeIndex(4)), None);
    }

    #[test]
    fn address_0_is_never_a_record() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 4);
        let first = tree.push_record(&[7, 0]).expect("room");
        assert_ne!(first, Address::NONE, "the arena's first word is reserved");
    }

    #[test]
    fn a_row_past_the_tree_s_nodes_is_refused() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 4);
        let at = tree.push_record(&[7, 0]).expect("room");
        assert_eq!(tree.hold(NodeIndex(4), at), Err(ArenaError::Malformed { what: "record row", word: 4 }));
        assert_eq!(tree.held(NodeIndex(4)), None);
    }
}
