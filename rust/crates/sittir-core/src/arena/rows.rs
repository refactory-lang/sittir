//! A parsed tree's arena and its row index: the record of each node a read
//! has reached, by the node's row.
//!
//! A parsed node's record is written on its first read, whatever the read,
//! and is the node's storage from then on. A parent's tag-1 cell names the
//! child's row and is never rewritten, so this index is the one bridge from
//! a row to its record. Both the arena and the index only append.

use super::{Address, Arena, ArenaError};
use crate::types::NodeIndex;
use std::collections::HashSet;

/// One parsed tree's records, and the record each row's first read wrote.
#[derive(Debug, Default)]
pub struct TreeArena {
    arena: Arena,
    /// Each row's record, by the row: `Address::NONE` where no read has
    /// written one yet.
    rows: Vec<Address>,
    /// Native record starts, including content that shares its envelope's
    /// row and has no row-index entry.
    records: HashSet<Address>,
}

impl TreeArena {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    #[must_use]
    pub fn arena(&self) -> &Arena {
        &self.arena
    }

    /// The record a read wrote for `row`, or `None` while no read has.
    #[must_use]
    pub fn record(&self, row: NodeIndex) -> Option<Address> {
        self.rows.get(row.0 as usize).copied().filter(|&at| at != Address::NONE)
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
    /// `ArenaError::Malformed` for `Address::NONE`, which names no record, and
    /// `ArenaError::Unwritable` when `row` holds a record already. Either way
    /// the index is unchanged.
    pub(super) fn index(&mut self, row: NodeIndex, at: Address) -> Result<(), ArenaError> {
        at.record()?;
        if self.record(row).is_some() {
            return Err(ArenaError::Unwritable("a second record for a row"));
        }
        let index = row.0 as usize;
        if self.rows.len() <= index {
            self.rows.resize(index + 1, Address::NONE);
        }
        self.rows[index] = at;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_row_holds_one_record() {
        let mut tree = TreeArena::new();
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
        let mut tree = TreeArena::new();
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
        let mut tree = TreeArena::new();
        assert_eq!(tree.index(NodeIndex(4), Address::NONE), Err(ArenaError::Malformed { what: "record address", word: 0 }));
        assert_eq!(tree.record(NodeIndex(4)), None);
    }
}
