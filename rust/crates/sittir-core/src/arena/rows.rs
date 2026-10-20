//! A parsed tree's arena and its row index: the record of each node a read
//! has reached, by the node's row.
//!
//! A parsed node's record is written on its first read, whatever the read,
//! and is the node's storage from then on. A parent's tag-1 cell names the
//! child's row and is never rewritten, so this index is the one bridge from
//! a row to its record. Both the arena and the index only append.
//!
//! Beside it, each row whose coordinate names another kind than the cell
//! that holds the row's node: an alias envelope's content, which shares its
//! envelope's row and whose coordinate names the envelope's display id. Every
//! other row's coordinate names its cell's kind, so the table is sparse.

use std::collections::btree_map::{BTreeMap, Entry};

use super::{Address, Arena, ArenaError};
use crate::types::{KindId, NodeIndex};

/// One parsed tree's records, the record each row's first read wrote, and
/// the coordinate kinds that differ from their cells'.
#[derive(Debug, Default)]
pub struct TreeArena {
    arena: Arena,
    /// Each row's record, by the row: `Address::NONE` where no read has
    /// written one yet.
    rows: Vec<Address>,
    /// The kind a row's coordinate names, for a row whose node's cell names
    /// another kind.
    coordinate_kinds: BTreeMap<NodeIndex, KindId>,
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

    /// The kind `row`'s coordinate names, as its read stamped it, when the
    /// cell of the row's node names another; `None` when the cell's kind is
    /// the coordinate's.
    #[must_use]
    pub fn stamped_kind(&self, row: NodeIndex) -> Option<KindId> {
        self.coordinate_kinds.get(&row).copied()
    }

    /// The kind the coordinate of the node a cell of kind `cell` names at
    /// `row` names: the row's stamped kind, else the cell's.
    #[must_use]
    pub fn coordinate_kind(&self, row: NodeIndex, cell: KindId) -> KindId {
        self.stamped_kind(row).unwrap_or(cell)
    }

    /// Holds `coordinate`, the kind a read stamped on `row`'s coordinate, when
    /// it differs from `cell`, the kind of the cell written for the row's
    /// node. A row's coordinate is the read's alone, so a second stamp of the
    /// row names the same kind.
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for a stamp that names another kind than the
    /// row's first.
    pub(super) fn stamp(&mut self, row: NodeIndex, coordinate: KindId, cell: KindId) -> Result<(), ArenaError> {
        if coordinate == cell {
            return Ok(());
        }
        match self.coordinate_kinds.entry(row) {
            Entry::Occupied(first) if *first.get() != coordinate => Err(ArenaError::Unwritable("a second coordinate kind for a row")),
            Entry::Occupied(_) => Ok(()),
            Entry::Vacant(entry) => {
                entry.insert(coordinate);
                Ok(())
            }
        }
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
        if at == Address::NONE {
            return Err(ArenaError::Malformed { what: "record address", word: 0 });
        }
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
    fn a_row_holds_a_coordinate_kind_only_where_it_differs_from_its_cell_s() {
        let mut tree = TreeArena::new();
        tree.stamp(NodeIndex(2), KindId(5), KindId(5)).expect("the cell's own kind");
        assert_eq!(tree.stamped_kind(NodeIndex(2)), None, "a coordinate naming its cell's kind is not held");
        assert_eq!(tree.coordinate_kind(NodeIndex(2), KindId(5)), KindId(5));
        tree.stamp(NodeIndex(4), KindId(469), KindId(1)).expect("an envelope's content");
        tree.stamp(NodeIndex(4), KindId(469), KindId(1)).expect("the same stamp again");
        assert_eq!(tree.coordinate_kind(NodeIndex(4), KindId(1)), KindId(469));
        assert_eq!(tree.coordinate_kind(NodeIndex(4), KindId(469)), KindId(469), "the envelope's own cell names the same coordinate");
        assert_eq!(tree.stamp(NodeIndex(4), KindId(7), KindId(1)), Err(ArenaError::Unwritable("a second coordinate kind for a row")));
        assert_eq!(tree.stamped_kind(NodeIndex(4)), Some(KindId(469)), "the first stamp stays the row's");
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
