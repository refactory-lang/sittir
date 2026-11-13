//! A parsed tree's arena and the records it holds itself.
//!
//! A parsed node's record is written on its first read, whatever the read,
//! and is the node's storage from then on. A tree holds one record per row,
//! however the row is reached. A node a cell names is reached through that
//! cell, which names its record once a read writes it. A node no cell names
//! (the root, an extra a side holds, a node inside an `ERROR` or inside a
//! leaf's captured text) is held by its tree, by its row, here: the one place
//! a row names a record. The map never leaves native code.
//!
//! The tree also keeps a row of facts for every node, record or not, written
//! as the hydrate pass meets the node (`NodeRows`): navigation's one source
//! of a node's facts once the tree is read whole.

use crate::heap::{CountedMap, HeapBytes};
use super::{Address, Arena, ArenaError, ArenaMark};
use crate::nodes::{shown_as_error, Kid};
use crate::types::{FieldId, KindId, NodeIndex};

/// The bits of a node row's packed word that hold the node's field id.
pub const ROW_FIELD_BITS: u32 = 10;

/// What a node row's packed word holds above its grammar kind (16 bits):
/// its field id (`ROW_FIELD_BITS`), then its flags.
mod packed {
    pub const KIND_MASK: u32 = 0xffff;
    pub const FIELD_SHIFT: u32 = 16;
    pub const FIELD_MASK: u32 = (1 << super::ROW_FIELD_BITS) - 1;
    pub const NAMED: u32 = 1 << 26;
    pub const EXTRA: u32 = 1 << 27;
    pub const MISSING: u32 = 1 << 28;
    pub const HOLDS_ERROR: u32 = 1 << 29;
    pub const ALIASED: u32 = 1 << 30;
}

/// Every node's row by its descendant index: `[start, end, subtree end,
/// packed]`, the packed word its grammar kind, field id and flags
/// (`packed`), and the display kind of each node shown as an alias, by
/// index. A row whose subtree end is 0 is unwritten, since every node's
/// subtree ends past it. Whether a node holds an error is set on every row
/// once the last is written, as are the aliases' order and capacity and
/// each node's parent.
#[derive(Debug, Default)]
pub struct NodeRows {
    rows: Vec<[u32; 4]>,
    aliases: Vec<(NodeIndex, KindId)>,
    parents: Vec<u32>,
    written: u32,
}

impl HeapBytes for NodeRows {
    fn heap_bytes(&self) -> usize {
        let Self { rows, aliases, parents, written: _ } = self;
        rows.capacity() * std::mem::size_of::<[u32; 4]>() + aliases.capacity() * std::mem::size_of::<(NodeIndex, KindId)>() + parents.capacity() * std::mem::size_of::<u32>()
    }
}

impl NodeRows {
    /// How many nodes the rows hold, written or not.
    #[must_use]
    pub fn len(&self) -> u32 {
        u32::try_from(self.rows.len()).unwrap_or(u32::MAX)
    }

    /// Whether the rows hold no node.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.rows.is_empty()
    }

    fn row(&self, index: NodeIndex) -> [u32; 4] {
        self.rows[index.0 as usize]
    }

    /// The facts of the node at `index`.
    #[must_use]
    pub fn kid(&self, index: NodeIndex) -> Kid {
        let [start, end, subtree_end, word] = self.row(index);
        let grammar = grammar_of(word);
        let field = (word >> packed::FIELD_SHIFT) & packed::FIELD_MASK;
        Kid {
            index,
            start,
            end,
            count: subtree_end - index.0,
            grammar,
            display: display_of(&self.aliases, index, word),
            field: (field != 0).then(|| FieldId(u16::try_from(field).unwrap_or(u16::MAX))),
            named: word & packed::NAMED != 0,
            extra: word & packed::EXTRA != 0,
        }
    }

    /// Where the subtree of the node at `index` ends: the index past its
    /// last descendant.
    #[must_use]
    pub fn subtree_end(&self, index: NodeIndex) -> NodeIndex {
        NodeIndex(self.row(index)[2])
    }

    /// Whether the node at `index` is `MISSING`.
    #[must_use]
    pub fn missing(&self, index: NodeIndex) -> bool {
        self.row(index)[3] & packed::MISSING != 0
    }

    /// Whether an `ERROR` or a `MISSING` token is in the subtree of the node
    /// at `index`, itself included.
    #[must_use]
    pub fn holds_error(&self, index: NodeIndex) -> bool {
        self.row(index)[3] & packed::HOLDS_ERROR != 0
    }

    /// The parent of the node at `index`, `None` for the root.
    #[must_use]
    pub fn parent(&self, index: NodeIndex) -> Option<NodeIndex> {
        (index != NodeIndex::ROOT).then(|| NodeIndex(self.parents[index.0 as usize]))
    }

    /// The rows from the root to the node at `index`, ascending: its
    /// ancestors and itself.
    #[must_use]
    pub fn spine(&self, index: NodeIndex) -> Vec<NodeIndex> {
        let mut rows: Vec<NodeIndex> = std::iter::successors(Some(index), |&at| self.parent(at)).collect();
        rows.reverse();
        rows
    }

    /// How many levels the node at `index` lies below the node at `above`,
    /// counted up to `most`: `None` when it lies `most` levels or more below
    /// it, or not under it.
    #[must_use]
    pub fn levels_below(&self, above: NodeIndex, index: NodeIndex, most: u32) -> Option<u32> {
        std::iter::successors(Some(index), |&at| self.parent(at)).take(most as usize).position(|at| at == above).and_then(|levels| u32::try_from(levels).ok())
    }

    /// Writes the row of `kid` once, with whether it is `MISSING`, the rows
    /// made for `nodes` nodes on the first write; the last row written
    /// finishes them (`finish`). Answers whether the write changed the
    /// rows' heap, which making them and finishing them do.
    fn write(&mut self, nodes: u32, kid: &Kid, missing: bool) -> Result<bool, ArenaError> {
        let field = kid.field.map_or(0, |field| u32::from(field.0));
        if field > packed::FIELD_MASK {
            return Err(ArenaError::Malformed { what: "row field id", word: field });
        }
        if kid.index.0 >= nodes {
            return Err(ArenaError::Malformed { what: "node row", word: kid.index.0 });
        }
        let made = self.rows.is_empty();
        if made {
            self.rows = vec![[0; 4]; nodes as usize];
        }
        let row = &mut self.rows[kid.index.0 as usize];
        if row[2] != 0 {
            return Ok(made);
        }
        let aliased = kid.display != kid.grammar;
        let flags = [(kid.named, packed::NAMED), (kid.extra, packed::EXTRA), (missing, packed::MISSING), (aliased, packed::ALIASED)];
        let word = flags.into_iter().filter(|&(set, _)| set).fold(u32::from(kid.grammar.0) | field << packed::FIELD_SHIFT, |word, (_, bit)| word | bit);
        *row = [kid.start, kid.end, kid.index.0 + kid.count, word];
        self.written += 1;
        let capacity = self.aliases.capacity();
        if aliased {
            self.aliases.push((kid.index, kid.display));
        }
        if self.written == nodes {
            self.finish();
            return Ok(true);
        }
        Ok(made || self.aliases.capacity() != capacity)
    }

    /// Sorts the aliases by index and fits them to their count, marks every
    /// node that holds an error, in one sweep from the last row to the
    /// first: a node holds one when the nearest `ERROR` (`shown_as_error`)
    /// or `MISSING` token at or after it lies before its subtree's end; and
    /// finds each node's parent, in one pass from the first, holding the
    /// nodes whose subtrees are still open.
    fn finish(&mut self) {
        self.aliases.sort_unstable_by_key(|&(index, _)| index.0);
        self.aliases.shrink_to_fit();
        let mut nearest = u32::MAX;
        let len = self.len();
        let Self { rows, aliases, parents, written: _ } = self;
        for (index, row) in (0..len).zip(rows.iter_mut()).rev() {
            if row[3] & packed::MISSING != 0 || shown_as_error(display_of(aliases, NodeIndex(index), row[3])) {
                nearest = index;
            }
            if nearest < row[2] {
                row[3] |= packed::HOLDS_ERROR;
            }
        }
        *parents = vec![0; rows.len()];
        let mut open: Vec<(u32, u32)> = Vec::new();
        for (index, row) in (0..len).zip(rows.iter()) {
            while open.last().is_some_and(|&(_, end)| end <= index) {
                open.pop();
            }
            if let Some(&(parent, _)) = open.last() {
                parents[index as usize] = parent;
            }
            open.push((index, row[2]));
        }
    }
}

fn kid_of(index: usize, facts: super::side::NodeFacts, span: crate::types::Span) -> Kid {
    Kid { index: NodeIndex(crate::types::narrow(index)), start: span.start, end: span.end, count: 1, grammar: facts.kind, display: facts.display(), field: facts.field, named: facts.named, extra: facts.extra }
}

fn grammar_of(word: u32) -> KindId {
    KindId(u16::try_from(word & packed::KIND_MASK).unwrap_or(u16::MAX))
}

/// The kind the node at `index`, its row's packed word `word`, is shown as:
/// its alias's, from `aliases` sorted by index, or its grammar kind.
fn display_of(aliases: &[(NodeIndex, KindId)], index: NodeIndex, word: u32) -> KindId {
    let grammar = grammar_of(word);
    if word & packed::ALIASED == 0 {
        return grammar;
    }
    aliases.binary_search_by_key(&index.0, |&(at, _)| at.0).map_or(grammar, |at| aliases[at].1)
}

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
    /// Whether a write grew the arena since the last `take_grown`.
    grown: bool,
    arena: Arena,
    held: CountedMap<NodeIndex, Address>,
    nodes: u32,
    /// Native record starts, including an embedded record, which starts
    /// inside its holder's.
    records: CountedMap<Address>,
    rows: std::sync::Arc<NodeRows>,
}

impl HeapBytes for TreeArena {
    fn heap_bytes(&self) -> usize {
        let Self { grown: _, arena, held, nodes: _, records, rows } = self;
        arena.heap_bytes() + held.heap_bytes() + records.heap_bytes() + rows.heap_bytes()
    }
}

impl TreeArena {
    /// The arena of a tree of `rows` nodes, whose kind fields take
    /// `kind_bits` bits: grown, since nothing has taken its growth yet.
    #[must_use]
    pub fn new(kind_bits: u32, rows: u32) -> Self {
        Self { grown: true, arena: Arena::with_kind_bits(kind_bits), held: CountedMap::default(), nodes: rows, records: CountedMap::default(), rows: std::sync::Arc::default() }
    }

    /// Whether the tree has a row for the node at `index`.
    #[must_use]
    pub fn has_row(&self, index: NodeIndex) -> bool {
        self.rows.rows.get(index.0 as usize).is_some_and(|row| row[2] != 0)
    }

    /// Every node's row, once the hydrate pass has met every node of the
    /// tree; `None` while some node has none.
    #[must_use]
    pub fn node_rows(&self) -> Option<&NodeRows> {
        (self.rows.written == self.nodes).then_some(&*self.rows)
    }

    /// Every node's row, shared, once the hydrate pass has met every node of
    /// the tree: no row is written after that (`write_row`).
    #[must_use]
    pub fn shared_rows(&self) -> Option<std::sync::Arc<NodeRows>> {
        (self.rows.written == self.nodes).then(|| std::sync::Arc::clone(&self.rows))
    }

    /// Writes the row of `kid`, with whether it is `MISSING`, unless the
    /// tree has one for it. A row is a fact of the tree, so a rewind keeps
    /// it.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a field id wider than `ROW_FIELD_BITS`
    /// or a node past the tree's.
    pub(super) fn write_row(&mut self, kid: &Kid, missing: bool) -> Result<(), ArenaError> {
        if self.has_row(kid.index) {
            return Ok(());
        }
        let rows = std::sync::Arc::get_mut(&mut self.rows).ok_or(ArenaError::Unwritable("a node row once every row is shared"))?;
        if rows.write(self.nodes, kid, missing)? {
            self.grown = true;
        }
        Ok(())
    }

    /// Whether a write grew the arena since the last call.
    pub fn take_grown(&mut self) -> bool {
        std::mem::take(&mut self.grown)
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
        self.grown = true;
        &mut self.arena
    }

    /// Every node under the record at `root`, itself first, in document
    /// order, as its records' runs hold them: each node's facts, numbered
    /// from `NodeIndex::ROOT` as the walk meets it, with whether it is
    /// `MISSING` and whether it holds an error. The root's bytes are its
    /// record's, the whole source.
    ///
    /// # Errors
    ///
    /// What reading a record or its side record refuses, and a record with
    /// no facts or a run whose rows hold more entries than it has.
    pub fn run_preorder(&self, root: Address) -> Result<Vec<(Kid, bool, bool)>, ArenaError> {
        let mut out = Vec::new();
        self.run_record(root, &mut out)?;
        Ok(out)
    }

    fn side_of(&self, at: Address) -> Result<super::SideRecord, ArenaError> {
        let header = self.arena.words(at, crate::record::HEADER_WORDS)?;
        super::SideRecord::read(&self.arena, Address(header[1]))
    }

    fn run_record(&self, at: Address, out: &mut Vec<(Kid, bool, bool)>) -> Result<u32, ArenaError> {
        let side = self.side_of(at)?;
        let facts = side.node.ok_or(ArenaError::Malformed { what: "parsed record facts", word: at.0 })?;
        let span = side.at.ok_or(ArenaError::Malformed { what: "parsed record row", word: at.0 })?.span;
        let own = out.len();
        out.push((kid_of(own, facts, span), facts.missing, facts.holds_error));
        let count = 1 + self.run_entries(&side.run, out)?;
        out[own].0.count = count;
        Ok(count)
    }

    fn run_entries(&self, mut entries: &[super::side::RunEntry], out: &mut Vec<(Kid, bool, bool)>) -> Result<u32, ArenaError> {
        let mut count = 0;
        while let Some((&entry, rest)) = entries.split_first() {
            entries = rest;
            match entry {
                super::side::RunEntry::Record { at, shared: true } => count += self.run_entries(&self.side_of(at)?.run, out)?,
                super::side::RunEntry::Record { at, shared: false } => count += self.run_record(at, out)?,
                super::side::RunEntry::Row { facts, span, inner } => {
                    let (inside, after) = entries.split_at_checked(inner as usize).ok_or(ArenaError::Malformed { what: "run row entries", word: inner })?;
                    entries = after;
                    let own = out.len();
                    out.push((kid_of(own, facts, span), facts.missing, facts.holds_error));
                    let nodes = 1 + self.run_entries(inside, out)?;
                    out[own].0.count = nodes;
                    count += nodes;
                }
            }
        }
        Ok(count)
    }

    /// Records a native node record written at `at`, an embedded one
    /// included; side records and list runs never enter the set of record
    /// starts.
    pub(super) fn keep_record(&mut self, at: Address) {
        self.grown = true;
        self.records.insert(at, ());
    }

    #[must_use]
    /// Whether the native writer wrote a record at `at`.
    pub(super) fn contains_record(&self, at: Address) -> bool {
        self.records.contains_key(&at)
    }

    /// Where the tree's writes stand now.
    pub(super) fn mark(&self) -> ArenaMark {
        self.arena.mark()
    }

    /// Drops what was written after `mark`: its words and chunks, and the
    /// record starts and held rows that name them.
    pub(super) fn rewind(&mut self, mark: ArenaMark) {
        self.arena.rewind(mark);
        self.records = std::mem::take(&mut self.records).kept(|&at, ()| !mark.precedes(at));
        self.held = std::mem::take(&mut self.held).kept(|_, &at| !mark.precedes(at));
    }

    /// Every chunk's written words, the record starts in order, and the held
    /// rows in order.
    #[cfg(test)]
    pub(super) fn snapshot(&self) -> Snapshot {
        let chunks = (0..).map_while(|n| self.arena.chunk(n).map(<[u32]>::to_vec)).collect();
        let mut records: Vec<_> = self.records.iter().map(|(&at, ())| at).collect();
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
        self.grown = true;
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

    fn kid(index: u32, count: u32, field: Option<u16>) -> Kid {
        Kid { index: NodeIndex(index), start: index, end: index + 1, count, grammar: KindId(5), display: KindId(5), field: field.map(FieldId), named: true, extra: false }
    }

    #[test]
    fn a_node_row_reads_back_as_written_and_is_written_once() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 4);
        let root = Kid { display: KindId(9), extra: true, named: false, ..kid(0, 4, None) };
        tree.write_row(&root, false).expect("a row");
        tree.write_row(&kid(1, 1, Some(1023)), true).expect("a row");
        assert!(tree.take_grown(), "the rows were made");
        tree.write_row(&kid(2, 1, None), false).expect("a row");
        assert!(!tree.take_grown(), "a row written into made rows grows nothing");
        tree.write_row(&kid(2, 1, Some(4)), true).expect("a second write of a row");
        assert!(tree.node_rows().is_none(), "node 3 has no row");
        tree.write_row(&kid(3, 1, None), false).expect("a row");
        assert!(tree.take_grown(), "the last row fits the aliases to their count");
        let rows = tree.node_rows().expect("a row for every node");
        assert_eq!(rows.kid(NodeIndex(0)), root);
        assert_eq!(rows.kid(NodeIndex(1)), kid(1, 1, Some(1023)));
        assert_eq!(rows.kid(NodeIndex(2)), kid(2, 1, None), "the first write stands");
        assert_eq!((rows.missing(NodeIndex(1)), rows.missing(NodeIndex(2))), (true, false));
        assert_eq!(rows.subtree_end(NodeIndex(0)), NodeIndex(4));
    }

    #[test]
    fn a_node_holds_an_error_when_an_error_or_a_missing_token_is_in_its_subtree() {
        let error = |index, count| Kid { grammar: KindId::ERROR, display: KindId::ERROR, ..kid(index, count, None) };
        let shown = |index, count, display| Kid { display: KindId(display), ..kid(index, count, None) };
        let written = [shown(0, 9, 7), kid(1, 3, None), kid(2, 1, None), shown(3, 1, 8), kid(4, 3, None), error(5, 2), shown(6, 1, 6), kid(7, 2, None), kid(8, 1, None)];
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 9);
        for kid in written.iter().rev() {
            assert!(tree.node_rows().is_none(), "node {} has no row", kid.index.0);
            tree.write_row(kid, kid.index == NodeIndex(2)).expect("a row");
        }
        let rows = tree.node_rows().expect("a row for every node");
        let holding: Vec<u32> = (0..9).filter(|&index| rows.holds_error(NodeIndex(index))).collect();
        assert_eq!(holding, [0, 1, 2, 4, 5], "the root, the MISSING token and the node over it, the ERROR and the node over it");
        for kid in written {
            assert_eq!(rows.kid(kid.index), kid, "node {} as written", kid.index.0);
        }
        assert!(rows.kid(NodeIndex(5)).error());
    }

    #[test]
    fn an_error_is_the_kind_a_node_is_shown_as() {
        let unshown = Kid { grammar: KindId::ERROR, display: KindId(6), ..kid(2, 1, None) };
        let shown = Kid { display: KindId::ERROR, ..kid(4, 1, None) };
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 5);
        for kid in [kid(0, 5, None), kid(1, 2, None), unshown, kid(3, 2, None), shown] {
            tree.write_row(&kid, false).expect("a row");
        }
        let rows = tree.node_rows().expect("a row for every node");
        let holding: Vec<u32> = (0..5).filter(|&index| rows.holds_error(NodeIndex(index))).collect();
        assert_eq!(holding, [0, 3, 4], "the node shown as an ERROR and those over it, not the ERROR shown as another kind");
        assert_eq!((rows.kid(NodeIndex(2)).error(), rows.kid(NodeIndex(4)).error()), (false, true));
    }

    #[test]
    fn a_field_id_past_a_row_s_bits_is_refused_by_name() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 2);
        assert_eq!(tree.write_row(&kid(1, 1, Some(1024)), false), Err(ArenaError::Malformed { what: "row field id", word: 1024 }));
        assert_eq!(tree.write_row(&kid(2, 1, None), false), Err(ArenaError::Malformed { what: "node row", word: 2 }));
    }

    #[test]
    fn each_write_marks_the_arena_grown_until_a_take() {
        let mut tree = TreeArena::new(crate::record::PARSED_KIND_BITS, 4);
        assert!(tree.take_grown(), "a new arena's growth has not been taken");
        assert!(!tree.take_grown(), "a take clears it");
        let at = record(&mut tree, &[7, 0]);
        assert!(tree.take_grown(), "a record written");
        assert_eq!(tree.held(NodeIndex(1)), None);
        assert!(!tree.take_grown(), "a read writes nothing");
        tree.hold(NodeIndex(1), at).expect("the row had none");
        assert!(tree.take_grown(), "a row held");
    }
}
