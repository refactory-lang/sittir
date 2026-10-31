//! A parsed tree's arena and the records it holds itself.
//!
//! A parsed node's record is written on its first read, whatever the read,
//! and is the node's storage from then on. A tree holds one record per row,
//! however the row is reached. A node a cell names is reached through that
//! cell, which names its record once a read writes it. A node no cell names
//! (the root, an extra a side holds, a node inside an `ERROR` or inside a
//! leaf's captured text) is held by its tree, by its row, here: the one place
//! a row names a record. The map never leaves native code.

use super::{Address, Arena, ArenaError, ArenaMark};
use crate::types::NodeIndex;
use std::collections::{HashMap, HashSet};

/// What a tree's arena holds: its chunks' written words, its record starts
/// and its held rows, each in order.
#[cfg(test)]
#[derive(Debug, PartialEq, Eq)]
pub(super) struct Snapshot {
    pub chunks: Vec<Vec<u32>>,
    pub records: Vec<Address>,
    pub held: Vec<(NodeIndex, Address)>,
}

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

    /// Records a native node record written at `at`, an embedded one
    /// included; side records and list runs never enter the set of record
    /// starts.
    pub(super) fn keep_record(&mut self, at: Address) {
        self.records.insert(at);
    }

    #[must_use]
    /// Whether the native writer wrote a record at `at`.
    pub(super) fn contains_record(&self, at: Address) -> bool {
        self.records.contains(&at)
    }

    /// Where the tree's writes stand now.
    pub(super) fn mark(&self) -> ArenaMark {
        self.arena.mark()
    }

    /// Drops what was written after `mark`: its words and chunks, and the
    /// record starts and held rows that name them.
    pub(super) fn rewind(&mut self, mark: ArenaMark) {
        self.arena.rewind(mark);
        self.records.retain(|&at| !mark.precedes(at));
        self.held.retain(|_, at| !mark.precedes(*at));
    }

    /// Every chunk's written words, the record starts in order, and the held
    /// rows in order.
    #[cfg(test)]
    pub(super) fn snapshot(&self) -> Snapshot {
        let chunks = (0..).map_while(|n| self.arena.chunk(n).map(<[u32]>::to_vec)).collect();
        let mut records: Vec<_> = self.records.iter().copied().collect();
        records.sort_unstable();
        let mut held: Vec<_> = self.held.iter().map(|(&row, &at)| (row, at)).collect();
        held.sort_unstable();
        Snapshot { chunks, records, held }
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
    use crate::arena::CHUNK_WORDS;

    fn record(tree: &mut TreeArena, words: &[u32]) -> Address {
        let at = tree.arena_mut().push(words).expect("room");
        tree.keep_record(at);
        at
    }

    #[test]
    fn a_rewind_drops_what_was_written_after_its_mark() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 16);
        let kept = record(&mut tree, &[7, 8]);
        tree.hold(NodeIndex(1), kept).expect("the row had none");
        let before = tree.snapshot();
        let mark = tree.mark();
        let first = record(&mut tree, &[9, 0, 3]);
        let own = tree.arena_mut().alloc(CHUNK_WORDS + 1).expect("a run with a chunk of its own");
        let next = record(&mut tree, &vec![5; CHUNK_WORDS as usize]);
        assert_ne!(own.chunk(), kept.chunk());
        assert_ne!(next.chunk(), kept.chunk(), "a record past the open chunk's room opens another");
        tree.hold(NodeIndex(2), first).expect("the row had none");
        tree.rewind(mark);
        assert_eq!(tree.snapshot(), before, "the words, chunks, record starts and held rows past the mark are gone");
        assert!(!tree.contains_record(first) && tree.held(NodeIndex(2)).is_none());
        let again = tree.arena_mut().alloc(3).expect("room");
        assert_eq!(again, first, "the next write takes the dropped words");
        assert_eq!(tree.arena().words(again, 3), Ok(&[0, 0, 0][..]), "zeroed");
    }

    #[test]
    fn a_held_row_holds_one_record() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 16);
        let row = NodeIndex(3);
        assert_eq!(tree.held(row), None);
        let first = record(&mut tree, &[7, 8]);
        tree.hold(row, first).expect("the row had none");
        assert_eq!(tree.held(row), Some(first));
        let second = record(&mut tree, &[9, 0]);
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
        let first = record(&mut tree, &[7, 0]);
        assert_ne!(first, Address::NONE, "the arena's first word is reserved");
    }

    #[test]
    fn a_row_past_the_tree_s_nodes_is_refused() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 4);
        let at = record(&mut tree, &[7, 0]);
        assert_eq!(tree.hold(NodeIndex(4), at), Err(ArenaError::Malformed { what: "record row", word: 4 }));
        assert_eq!(tree.held(NodeIndex(4)), None);
    }
}
