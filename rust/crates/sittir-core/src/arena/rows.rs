//! A parsed tree's arena and its row index: the record of each node a read
//! has reached, by the node's row.
//!
//! A parsed node's record is written on its first read, whatever the read,
//! and is the node's storage from then on. A parent's tag-1 cell names the
//! child's row and is never rewritten, so this index is the one bridge from
//! a row to its record. Both the arena and the index only append.

use super::{Address, Arena, ArenaError};
use crate::types::NodeIndex;

/// One parsed tree's records, and the record each row's first read wrote.
#[derive(Debug, Default)]
pub struct TreeArena {
    arena: Arena,
    /// Each row's record, by the row: `Address::NONE` where no read has
    /// written one yet.
    rows: Vec<Address>,
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

    /// `row`'s record: the one a read wrote for it, else the one `write`
    /// appends now, which the index then holds for every later read. `write`
    /// runs at most once per row.
    ///
    /// # Errors
    ///
    /// What `write` refused with, or `ArenaError::Malformed` when it answers
    /// `Address::NONE`, which names no record. Either way the row stays
    /// without one.
    pub fn record_or_write(&mut self, row: NodeIndex, write: impl FnOnce(&mut Arena) -> Result<Address, ArenaError>) -> Result<Address, ArenaError> {
        if let Some(at) = self.record(row) {
            return Ok(at);
        }
        let at = write(&mut self.arena)?;
        if at == Address::NONE {
            return Err(ArenaError::Malformed { what: "record address", word: 0 });
        }
        let index = row.0 as usize;
        if self.rows.len() <= index {
            self.rows.resize(index + 1, Address::NONE);
        }
        self.rows[index] = at;
        Ok(at)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_row_s_record_is_written_once() {
        let mut tree = TreeArena::new();
        let row = NodeIndex(3);
        assert_eq!(tree.record(row), None);
        let first = tree.record_or_write(row, |arena| arena.push(&[7, 8])).expect("written");
        let again = tree.record_or_write(row, |_| panic!("a row's record is written once")).expect("the record");
        assert_eq!(again, first);
        assert_eq!(tree.record(row), Some(first));
        assert_eq!(tree.arena().words(first, 2).expect("its words"), &[7, 8]);
    }

    #[test]
    fn rows_are_written_in_any_order_and_the_rest_stay_unwritten() {
        let mut tree = TreeArena::new();
        let late = tree.record_or_write(NodeIndex(9), |arena| arena.push(&[9])).expect("written");
        let early = tree.record_or_write(NodeIndex(2), |arena| arena.push(&[2])).expect("written");
        assert_ne!(late, early);
        assert_eq!(tree.record(NodeIndex(9)), Some(late));
        assert_eq!(tree.record(NodeIndex(2)), Some(early));
        for row in [0, 1, 3, 8, 10] {
            assert_eq!(tree.record(NodeIndex(row)), None, "row {row} was never read");
        }
    }

    #[test]
    fn a_refused_or_addressless_write_leaves_the_row_without_a_record() {
        let mut tree = TreeArena::new();
        let row = NodeIndex(4);
        assert_eq!(tree.record_or_write(row, |_| Err(ArenaError::Full)), Err(ArenaError::Full));
        assert_eq!(tree.record(row), None);
        assert_eq!(tree.record_or_write(row, |_| Ok(Address::NONE)), Err(ArenaError::Malformed { what: "record address", word: 0 }));
        assert_eq!(tree.record(row), None);
        let at = tree.record_or_write(row, |arena| arena.push(&[1])).expect("a later read writes it");
        assert_eq!(tree.record(row), Some(at));
    }
}
