//! A parsed tree's arena and its row index: the record of each node a read
//! has reached, by the node's row.
//!
//! A parsed node's record is written on its first read, whatever the read,
//! and is the node's storage from then on. A holder's cell names a child
//! with a record by its row and is never rewritten, so this index is the one
//! bridge from a row to its record. Both the arena and the index only append.
//!
//! The index is one word per node of the tree, in memory native code owns
//! and JavaScript reads in place, so a holder's coordinate reaches its
//! child's record with no native call once the record is written: 0 is no
//! record, since no record is ever at address 0, the arena's reserved first
//! word.

use super::{Address, Arena, ArenaError, ChunkMem};
use crate::types::NodeIndex;
use std::collections::HashSet;
use std::sync::Arc;

/// One parsed tree's records, and the record each row's first read wrote.
#[derive(Debug)]
pub struct TreeArena {
    arena: Arena,
    /// Each row's record address, by the row: 0 where no read has written
    /// one. Made on the first record or the first ask for it.
    rows: Option<Arc<ChunkMem<u32>>>,
    nodes: u32,
    /// Native record starts, including content that shares its envelope's
    /// row and an embedded copy of a record its row names elsewhere.
    records: HashSet<Address>,
}

impl TreeArena {
    /// The arena of a tree of `rows` nodes whose kind fields take
    /// `kind_bits` bits.
    #[must_use]
    pub fn new(kind_bits: u32, rows: u32) -> Self {
        Self { arena: Arena::with_kind_bits(kind_bits), rows: None, nodes: rows, records: HashSet::new() }
    }

    #[must_use]
    pub fn arena(&self) -> &Arena {
        &self.arena
    }

    /// The row index's memory, to share with a buffer JavaScript reads it
    /// through.
    #[must_use]
    pub fn rows_memory(&mut self) -> Arc<ChunkMem<u32>> {
        Arc::clone(self.rows.get_or_insert_with(|| ChunkMem::zeroed(self.nodes as usize)))
    }

    /// The record a read wrote for `row`, or `None` while no read has.
    #[must_use]
    pub fn record(&self, row: NodeIndex) -> Option<Address> {
        // SAFETY: the tree's arena is borrowed for the call, inside one
        // native call, and only `index` writes the index, through `&mut self`.
        let rows = unsafe { self.rows.as_ref()?.slice() };
        rows.get(row.0 as usize).copied().filter(|&at| at != Address::NONE.0).map(Address)
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

    /// Holds `at` as `row`'s record, for every later read. The record writer
    /// calls it once it has written the record of a row that had none.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for `Address::NONE`, which names no record,
    /// or a row past the tree's nodes, and `ArenaError::Unwritable` when
    /// `row` holds a record already. Either way the index is unchanged.
    pub(super) fn index(&mut self, row: NodeIndex, at: Address) -> Result<(), ArenaError> {
        at.record()?;
        if self.record(row).is_some() {
            return Err(ArenaError::Unwritable("a second record for a row"));
        }
        let rows = self.rows_memory();
        // SAFETY: `&mut self` is the one borrow of the index, inside one
        // native call.
        let rows = unsafe { rows.slice_mut() };
        *rows.get_mut(row.0 as usize).ok_or(ArenaError::Malformed { what: "record row", word: row.0 })? = at.0;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_row_holds_one_record() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 16);
        let row = NodeIndex(3);
        assert_eq!(tree.record(row), None);
        let first = tree.arena_mut().push(&[7, 8]).expect("room");
        tree.index(row, first).expect("the row had none");
        assert_eq!(tree.record(row), Some(first));
        let second = tree.arena_mut().push(&[9]).expect("room");
        assert_eq!(tree.index(row, second), Err(ArenaError::Unwritable("a second record for a row")));
        assert_eq!(tree.record(row), Some(first), "the first record stays the row's");
        assert_eq!(tree.arena().words(first, 2).expect("its words"), &[7, 8]);
    }

    #[test]
    fn rows_are_indexed_in_any_order_and_the_rest_stay_unwritten() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 16);
        let late = tree.arena_mut().push(&[9]).expect("room");
        tree.index(NodeIndex(9), late).expect("indexed");
        let early = tree.arena_mut().push(&[2]).expect("room");
        tree.index(NodeIndex(2), early).expect("indexed");
        assert_eq!(tree.record(NodeIndex(9)), Some(late));
        assert_eq!(tree.record(NodeIndex(2)), Some(early));
        for row in [0, 1, 3, 8, 10] {
            assert_eq!(tree.record(NodeIndex(row)), None, "row {row} was never read");
        }
    }

    #[test]
    fn no_address_names_no_record() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 16);
        assert_eq!(tree.index(NodeIndex(4), Address::NONE), Err(ArenaError::Malformed { what: "record address", word: 0 }));
        assert_eq!(tree.record(NodeIndex(4)), None);
    }

    #[test]
    fn address_0_is_never_a_record_so_an_index_word_of_0_is_no_record() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 4);
        let first = tree.push_record(&[7, 0]).expect("room");
        assert_ne!(first, Address::NONE, "the arena's first word is reserved");
        tree.index(NodeIndex(0), first).expect("the root's record");
        // SAFETY: no other borrow of the index is live in this test.
        assert_eq!(unsafe { tree.rows_memory().slice() }, &[first.0, 0, 0, 0]);
    }

    #[test]
    fn a_row_past_the_tree_s_nodes_is_refused() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 4);
        let at = tree.push_record(&[7, 0]).expect("room");
        assert_eq!(tree.index(NodeIndex(4), at), Err(ArenaError::Malformed { what: "record row", word: 4 }));
        assert_eq!(tree.record(NodeIndex(4)), None);
    }
}
