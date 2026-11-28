//! The sides of trivia writes set for every node an engine renders, keyed
//! by the node and the side. Each parsed tree keeps its own rows in a table
//! (`SideRows`), written through the tree alone
//! (`ParsedTree::write_trivia_side`): a node of a tree's own rows reads as
//! what a write set, else as what its tree's placement assigned from its
//! source (`ParsedTree::side_entries`, `Placement`). The engine's store
//! keeps a node of the built arena's sides, built or read, as rows of
//! compact entries (`CompactEntry`) in the arena's chunks, in a side record
//! of rows the record's header names (`RowFields`). A node a read left reads
//! as the side its parse placed there, under the same key a write sets
//! (`Place::Node`), so a write replaces it; the store tells the sides a
//! write gave apart from those (`TriviaStore::written`).
//!
//! Setting or replacing a side never edits a node's cells. A record that
//! shares a child with another names it by the same cell, and the child's
//! sides at its site are each holder's own row.

use crate::heap::HeapBytes;
use std::collections::BTreeMap;
#[cfg(feature = "arena")]
use std::sync::atomic::{AtomicU64, Ordering};
#[cfg(feature = "arena")]
use std::sync::{Arc, PoisonError, RwLock};

use crate::trivia::TriviaEntry;
use crate::trivia_table::TriviaSide;
#[cfg(feature = "arena")]
use crate::arena::{Address, ArenaError, ArenaRead};
#[cfg(feature = "arena")]
use crate::types::KindId;

/// What a write of entries to an inner side `TriviaStore::keyed` names no
/// site for is refused with: that of a unit or a leaf, which has no record
/// and no inside.
#[cfg(feature = "arena")]
const NO_INSIDE: &str = "an inner side on a node with no record, which has no inside";
#[cfg(feature = "arena")]
const READ_SIDE: &str = "a side of a read's node, which its read's list of replaced ranges holds (`write_read_kept`)";

/// Where a node's sides are kept.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Place {
    /// A node of the built arena, built or read, by its name: a record, or
    /// a unit or leaf at its site in its holder's record, so a holder's
    /// sides and those of the nodes it keeps at its sites are one range.
    #[cfg(feature = "arena")]
    Node(crate::types::NodeId),
    /// The lone built leaf a render roots at, which has no holder and so
    /// no id: its sides are the ones the render is given.
    #[cfg(feature = "arena")]
    RootLeaf,
}

#[cfg(feature = "arena")]
impl Place {
    /// The record at `at`.
    #[must_use]
    pub const fn record(at: crate::arena::Address) -> Place {
        Place::Node(crate::types::NodeId::record(at.0))
    }

    /// The unit or leaf at `site` in its holder's record.
    #[must_use]
    pub const fn site(site: Site<crate::arena::Address>) -> Place {
        Place::Node(crate::types::NodeId::leaf(site.holder.0, site.word, site.item.0))
    }

    /// The record whose sides this place keeps; none for a node with no
    /// record of its own, a tree's row and the root leaf.
    #[must_use]
    pub const fn as_record(self) -> Option<crate::arena::Address> {
        match self {
            Place::Node(id) => match id.as_record() {
                Some(at) => Some(crate::arena::Address(at)),
                None => None,
            },
            Place::RootLeaf => None,
        }
    }
}

/// A position in a holder: the holder, the slot's stamped word and the
/// item in that slot, 0 for a slot holding one value. A built unit's place
/// is its site in a built record; a fact a holder writes about the child it
/// holds there is keyed by its site in any holder's place.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Site<H> {
    pub holder: H,
    pub word: u32,
    pub item: crate::types::ItemIndex,
}

/// The sides writes set, by node and side, each as its entries `E`, with
/// the bytes they hold: the table every store of sides keeps, the engine's
/// by built place in compact entries and each parsed tree's by row in trivia
/// entries. A write replaces a side; a read borrows it.
#[derive(Debug)]
pub struct SideRows<K, E> {
    rows: BTreeMap<(K, TriviaSide), Vec<E>>,
    /// The sides a write gave in place of the side a parse placed (`mark`);
    /// a table whose rows are writes alone marks none.
    marked: std::collections::BTreeSet<(K, TriviaSide)>,
    bytes: usize,
    /// The range removals made (`remove_range`).
    removals: u64,
}

impl<K, E> Default for SideRows<K, E> {
    fn default() -> Self {
        Self { rows: BTreeMap::new(), marked: std::collections::BTreeSet::new(), bytes: 0, removals: 0 }
    }
}

impl<K: Ord, E> SideRows<K, E> {
    /// The entries a write gave `side` of the node at `key`, or `None` when
    /// no write did. A write of no entries is `Some` of none: it replaced
    /// the side with nothing.
    #[must_use]
    pub fn get(&self, key: K, side: TriviaSide) -> Option<&[E]> {
        self.rows.get(&(key, side)).map(Vec::as_slice)
    }

    /// Whether a write set `side` of the node at `key`.
    #[must_use]
    pub fn contains(&self, key: K, side: TriviaSide) -> bool {
        self.rows.contains_key(&(key, side))
    }

    /// The rows whose keys `keys` holds, in key order.
    pub fn range<R: std::ops::RangeBounds<(K, TriviaSide)>>(&self, keys: R) -> std::collections::btree_map::Range<'_, (K, TriviaSide), Vec<E>> {
        self.rows.range(keys)
    }

    /// Whether a write gave `side` of the node at `key` in place of the side
    /// a parse placed (`mark`).
    #[must_use]
    pub fn marked(&self, key: K, side: TriviaSide) -> bool {
        self.marked.contains(&(key, side))
    }

    /// The marked sides whose keys `keys` holds, in key order (`mark`).
    pub fn marked_range<R: std::ops::RangeBounds<(K, TriviaSide)>>(&self, keys: R) -> std::collections::btree_set::Range<'_, (K, TriviaSide)> {
        self.marked.range(keys)
    }

    /// The sides the table holds.
    #[must_use]
    pub fn len(&self) -> usize {
        self.rows.len()
    }

    /// Whether the table holds no side.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.rows.is_empty()
    }

    /// The bytes the table's rows take: each row's key and value, and the
    /// value's heap, kept at every insert and removal.
    #[must_use]
    pub fn bytes(&self) -> usize {
        self.bytes
    }

    /// The range removals the table has made (`remove_range`): a diagnostic
    /// a test compares.
    #[must_use]
    pub fn removals(&self) -> u64 {
        self.removals
    }
}

impl<K: Ord, E: HeapBytes> SideRows<K, E> {
    /// `side` of the node at `key` holds `entries`, answering what it held.
    pub fn insert(&mut self, key: K, side: TriviaSide, entries: Vec<E>) -> Option<Vec<E>> {
        self.bytes += row_bytes::<K, _>(&entries);
        let replaced = self.rows.insert((key, side), entries);
        if let Some(replaced) = &replaced {
            self.bytes -= row_bytes::<K, _>(replaced);
        }
        replaced
    }

    /// The row at `key`, removed.
    pub fn remove(&mut self, key: &(K, TriviaSide)) -> Option<Vec<E>> {
        let removed = self.rows.remove(key);
        if let Some(removed) = &removed {
            self.bytes -= row_bytes::<K, _>(removed);
        }
        removed
    }

    /// The rows whose keys `keys` holds, removed, in key order.
    pub fn remove_range<R: std::ops::RangeBounds<(K, TriviaSide)>>(&mut self, keys: R) -> Vec<Vec<E>>
    where
        K: Copy,
    {
        self.removals += 1;
        let held: Vec<_> = self.rows.range(keys).map(|(&key, _)| key).collect();
        held.into_iter().filter_map(|key| self.remove(&key)).collect()
    }

    /// Marks `side` of the node at `key` as one a write gave in place of
    /// the side a parse placed, whether or not a row holds it.
    pub fn mark(&mut self, key: K, side: TriviaSide) {
        if self.marked.insert((key, side)) {
            self.bytes += std::mem::size_of::<(K, TriviaSide)>();
        }
    }

    /// Every row, removed, and every mark.
    pub fn take(&mut self) -> Vec<Vec<E>> {
        self.bytes = 0;
        self.marked.clear();
        std::mem::take(&mut self.rows).into_values().collect()
    }
}

/// `entries` as a parsed tree's rows keep them: a built record among them
/// is kept with no store, since the engine's store answers it.
#[must_use]
pub fn kept<T>(entries: Vec<TriviaEntry<T>>) -> Vec<TriviaEntry<T>> {
    entries
        .into_iter()
        .map(|entry| match entry {
            #[cfg(feature = "arena")]
            TriviaEntry::Record(record) => TriviaEntry::Record(crate::trivia::RecordEntry { store: None, ..record }),
            entry @ TriviaEntry::Value(_) => entry,
        })
        .collect()
}

/// The bytes a row keyed by `K` and holding `value` takes: its key, its
/// value and the value's heap.
fn row_bytes<K, V: HeapBytes>(value: &V) -> usize {
    std::mem::size_of::<((K, TriviaSide), V)>() + value.heap_bytes()
}

/// One entry of a side as the engine's store keeps it, in order, in 8
/// bytes: a built record, a read's among them, by its kind and address; a
/// layout member by its kind, as it carries nothing else; and an entry that
/// holds text by its kind and the leaf entry of the built arena's string
/// pool holding the text. A side holds a count of each leaf entry it names
/// and of each record a value of it was written as.
#[cfg(feature = "arena")]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CompactEntry {
    Record { kind: KindId, at: Address },
    Layout { kind: KindId },
    Text { kind: KindId, at: Address },
}

#[cfg(feature = "arena")]
impl HeapBytes for CompactEntry {
    fn heap_bytes(&self) -> usize {
        0
    }
}

#[cfg(feature = "arena")]
impl CompactEntry {
    /// The entry of the built arena it names, a record or a leaf entry;
    /// none for a layout member.
    #[must_use]
    pub fn at(self) -> Option<Address> {
        match self {
            Self::Record { at, .. } | Self::Text { at, .. } => Some(at),
            Self::Layout { .. } => None,
        }
    }

    /// The entry the built cell `cell` names in `arena`, whose kind fields
    /// take `bits` bits: a record by its kind and address, a unit as a
    /// layout member, a leaf entry as text.
    ///
    /// # Errors
    ///
    /// What decoding the cell refuses, and `ArenaError::Unwritable` for a
    /// cell of any other form.
    pub fn of_cell(cell: crate::arena::CellWord, arena: &dyn ArenaRead, bits: u32) -> Result<CompactEntry, ArenaError> {
        use crate::arena::Cell;
        match Cell::decode_built(cell, arena, bits)? {
            Cell::Unit { kind, .. } if kind != KindId::BLANK => Ok(CompactEntry::Layout { kind }),
            Cell::Child { kind, at, .. } => Ok(CompactEntry::Record { kind, at }),
            Cell::BuiltLeaf { kind, .. } => Ok(CompactEntry::Text { kind, at: cell.address() }),
            Cell::BuiltText { .. } => Ok(CompactEntry::Text { kind: KindId::BLANK, at: cell.address() }),
            _ => Err(ArenaError::Unwritable("a trivia value written as no record, layout member or leaf entry")),
        }
    }

    /// The built cell naming the entry (`of_cell`).
    ///
    /// # Errors
    ///
    /// What making the cell refuses.
    pub fn cell(self) -> Result<crate::arena::CellWord, ArenaError> {
        match self {
            Self::Record { at, .. } | Self::Text { at, .. } => crate::arena::CellWord::of(at, crate::slot::ChangedEdges::default()),
            Self::Layout { kind } => crate::arena::CellWord::unit(kind),
        }
    }

    /// What giving back the count the entry holds releases.
    fn held(self) -> Option<crate::arena::count::Held> {
        match self {
            Self::Record { at, .. } => Some(crate::arena::count::Held::Record(at)),
            Self::Text { at, .. } => Some(crate::arena::count::Held::Text(at)),
            Self::Layout { .. } => None,
        }
    }
}

/// The text of the leaf entry of `kind` at `at` in `arena`, whose kind
/// fields take `bits` bits.
#[cfg(feature = "arena")]
fn leaf_text(arena: &dyn ArenaRead, at: Address, kind: KindId, bits: u32) -> Result<&str, ArenaError> {
    use crate::arena::{Cell, CellWord};
    match Cell::decode_built(CellWord::of(at, crate::slot::ChangedEdges::default())?, arena, bits)? {
        Cell::BuiltLeaf { kind: found, text, .. } if found == kind => arena.text(text),
        Cell::BuiltText { text } if kind == KindId::BLANK => arena.text(text),
        _ => Err(ArenaError::Malformed { what: "trivia text entry", word: at.0 }),
    }
}

/// One engine's sides of built nodes. Every handle cloned from it shares
/// them: the engine holds one, and each tree it parses another.
///
/// A built record's sides, and those of the units and leaves at its sites,
/// are rows in the built arena's chunks, in a side record of rows its
/// header names (`RowFields`), released with the record. A parsed tree's
/// written rows are its own (`ParsedTree::write_trivia_side`). A side a
/// write gave a read's node is an entry of its read's list of replaced
/// ranges (`Replaced`), which the store reads over the rows its parse
/// placed (`read_overlay`). The store keeps the sides of the lone leaf a
/// render roots at (`Place::RootLeaf`).
#[derive(Debug)]
pub struct TriviaStore<T> {
    /// The leading, trailing and inner sides of the lone leaf a render
    /// roots at (`root_leaf`).
    #[cfg(feature = "arena")]
    root: Option<Box<[Option<Vec<CompactEntry>>; 3]>>,
    /// How many times a read's list of replaced ranges was read
    /// (`list_reads`).
    #[cfg(feature = "arena")]
    list_reads: Arc<AtomicU64>,
    /// The chunks of the arena the engine's builders write, which a record
    /// entry this store answers renders from.
    #[cfg(feature = "arena")]
    built: Arc<RwLock<crate::arena::BuiltChunks>>,
    /// The bits the built arena's kind fields take, by which a text entry's
    /// leaf entry is read.
    #[cfg(feature = "arena")]
    kind_bits: u32,
    /// How the grammar lays a record of each kind out, the one the built
    /// arena takes, by which a holder's cells tell what its sites hold.
    #[cfg(feature = "arena")]
    shape: crate::arena::ShapeOf,
    /// The grammar's whitespace table, by which a built record's header
    /// keeps the gap members at the head of its sides as layout codes
    /// (`HeaderLayout`); none for a store that keeps every side in its rows.
    #[cfg(feature = "arena")]
    whitespace: Option<&'static crate::render::WhitespaceTable>,
    /// The buffers JavaScript reads the built arena's chunks through, which
    /// whatever frees a chunk detaches in the same call.
    #[cfg(all(feature = "arena", feature = "napi-bindings"))]
    buffers: Arc<std::sync::Mutex<crate::napi_engine::Buffers>>,
    trivia: std::marker::PhantomData<fn() -> T>,
}

impl<T> Clone for TriviaStore<T> {
    fn clone(&self) -> Self {
        Self {
            #[cfg(feature = "arena")]
            root: self.root.clone(),
            #[cfg(feature = "arena")]
            list_reads: Arc::clone(&self.list_reads),
            #[cfg(feature = "arena")]
            built: Arc::clone(&self.built),
            #[cfg(feature = "arena")]
            kind_bits: self.kind_bits,
            #[cfg(feature = "arena")]
            shape: self.shape,
            #[cfg(feature = "arena")]
            whitespace: self.whitespace,
            #[cfg(all(feature = "arena", feature = "napi-bindings"))]
            buffers: Arc::clone(&self.buffers),
            trivia: std::marker::PhantomData,
        }
    }
}

/// Two handles are equal when they share one store: a record's address
/// names a record only in the store of the arena that wrote it. A store
/// with no arena holds nothing one handle could tell from another's.
impl<T> PartialEq for TriviaStore<T> {
    #[cfg(feature = "arena")]
    fn eq(&self, other: &Self) -> bool {
        Arc::ptr_eq(&self.built, &other.built)
    }

    #[cfg(not(feature = "arena"))]
    fn eq(&self, _: &Self) -> bool {
        true
    }
}

impl<T> Default for TriviaStore<T> {
    fn default() -> Self {
        Self::with_kind_bits(crate::record::PARSED_KIND_BITS)
    }
}

#[cfg(feature = "arena")]
fn no_shape(_: crate::types::KindId) -> Option<crate::arena::RecordShape> {
    None
}

/// The index of `side` among a node's three sides: leading, trailing,
/// inner.
#[cfg(feature = "arena")]
const fn side_index(side: TriviaSide) -> usize {
    match side {
        TriviaSide::Leading => 0,
        TriviaSide::Trailing => 1,
        TriviaSide::Inner => 2,
    }
}

/// A record's header layout (`HeaderLayout`), with the header word it was
/// decoded from.
#[cfg(feature = "arena")]
type Header = (crate::arena::cell::HeaderLayout, u32);

/// The side a site's key holds `side` as (`RowFields::site_key`): its
/// trailing side's code for a trailing side, else its leading side's. A
/// site has no inner side.
#[cfg(feature = "arena")]
fn site_side(side: TriviaSide) -> u32 {
    if side == TriviaSide::Trailing { TriviaSide::Trailing.code() } else { TriviaSide::Leading.code() }
}

impl<T> TriviaStore<T> {
    /// A store whose built arena's kind fields take `kind_bits` bits and
    /// that knows no record's shape, so it releases no built record.
    #[must_use]
    #[cfg_attr(not(feature = "arena"), allow(unused_variables, reason = "only the arena build has a built arena"))]
    pub fn with_kind_bits(kind_bits: u32) -> Self {
        Self {
            #[cfg(feature = "arena")]
            root: None,
            #[cfg(feature = "arena")]
            list_reads: Arc::default(),
            #[cfg(feature = "arena")]
            built: Arc::new(RwLock::new(crate::arena::BuiltChunks::new(kind_bits, no_shape))),
            #[cfg(feature = "arena")]
            kind_bits,
            #[cfg(feature = "arena")]
            shape: no_shape,
            #[cfg(feature = "arena")]
            whitespace: None,
            #[cfg(all(feature = "arena", feature = "napi-bindings"))]
            buffers: Arc::default(),
            trivia: std::marker::PhantomData,
        }
    }

    /// A store whose built arena's kind fields take `kind_bits` bits and
    /// whose records' shapes are `shape`'s: the grammar's stamps.
    #[cfg(feature = "arena")]
    #[must_use]
    pub fn for_records(kind_bits: u32, shape: crate::arena::ShapeOf) -> Self {
        Self {
            root: None,
            list_reads: Arc::default(),
            built: Arc::new(RwLock::new(crate::arena::BuiltChunks::new(kind_bits, shape))),
            kind_bits,
            shape,
            whitespace: None,
            #[cfg(feature = "napi-bindings")]
            buffers: Arc::default(),
            trivia: std::marker::PhantomData,
        }
    }

    /// This store, keeping the gap members at the head of a built record's
    /// sides in the record's header as `whitespace`, the grammar's table,
    /// names them.
    #[cfg(feature = "arena")]
    #[must_use]
    pub fn with_whitespace(self, whitespace: &'static crate::render::WhitespaceTable) -> Self {
        Self { whitespace: Some(whitespace), ..self }
    }

    /// Whether this store keeps `side` of the node at `place`: every side
    /// but the inner side of a unit, a leaf or the root leaf, which has no
    /// record and no inside.
    #[cfg(feature = "arena")]
    fn keeps(place: Place, side: TriviaSide) -> bool {
        side != TriviaSide::Inner || place.as_record().is_some()
    }

    /// The list of replaced ranges of the read that left the record at
    /// `holder` (`replaced_list`), which the readers that take a `list`
    /// read once a call: the empty list for a built record. Each read of
    /// a list counts (`list_reads`).
    ///
    /// # Errors
    ///
    /// What reading the record's side record and its read's refuses.
    #[cfg(feature = "arena")]
    pub fn list_of(&self, holder: Address, arena: &dyn ArenaRead) -> Result<crate::arena::CellWord, ArenaError> {
        if !arena.read_record(holder) {
            return Ok(crate::arena::CellWord(0));
        }
        self.list_reads.fetch_add(1, Ordering::Relaxed);
        Ok(crate::arena::replaced_list(arena, holder)?.map_or(crate::arena::CellWord(0), |(_, list)| list))
    }

    /// `list_of` the read whose source's entry is at `source`.
    ///
    /// # Errors
    ///
    /// What reading the source's entry and the read's side record refuses.
    #[cfg(feature = "arena")]
    pub fn list_of_source(&self, source: Address, arena: &dyn ArenaRead) -> Result<crate::arena::CellWord, ArenaError> {
        self.list_reads.fetch_add(1, Ordering::Relaxed);
        Ok(crate::arena::read_replaced_list(arena, source)?.map_or(crate::arena::CellWord(0), |(_, list)| list))
    }

    /// `list_of` the record the node at `place` is kept in; the empty list
    /// for the root leaf.
    #[cfg(feature = "arena")]
    fn list_of_place(&self, place: Place, arena: &dyn ArenaRead) -> Result<crate::arena::CellWord, ArenaError> {
        match place {
            Place::Node(name) => self.list_of(Address(name.address()), arena),
            Place::RootLeaf => Ok(crate::arena::CellWord(0)),
        }
    }

    /// How many times a read's list of replaced ranges was read
    /// (`list_of`), every handle's: a diagnostic a test compares.
    #[cfg(feature = "arena")]
    #[must_use]
    pub fn list_reads(&self) -> u64 {
        self.list_reads.load(Ordering::Relaxed)
    }
}

impl<T> TriviaStore<T> {
    /// The chunks of the engine's built arena this store holds.
    #[cfg(feature = "arena")]
    pub fn built(&self) -> std::sync::RwLockReadGuard<'_, crate::arena::BuiltChunks> {
        self.built.read().unwrap_or_else(PoisonError::into_inner)
    }

    /// The chunks of the engine's built arena this store holds, to add to or
    /// release.
    #[cfg(feature = "arena")]
    pub fn built_mut(&self) -> std::sync::RwLockWriteGuard<'_, crate::arena::BuiltChunks> {
        self.built.write().unwrap_or_else(PoisonError::into_inner)
    }

    /// The buffers JavaScript reads the built arena's chunks through. Taken
    /// before the chunks' lock wherever both are held.
    #[cfg(all(feature = "arena", feature = "napi-bindings"))]
    pub fn buffers(&self) -> std::sync::MutexGuard<'_, crate::napi_engine::Buffers> {
        self.buffers.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

/// The built records `entries` name.
#[cfg(feature = "arena")]
fn held_records<T>(entries: &[TriviaEntry<T>]) -> Vec<crate::arena::Address> {
    entries
        .iter()
        .filter_map(|entry| match entry {
            TriviaEntry::Record(record) => Some(record.record.at),
            TriviaEntry::Value(_) => None,
        })
        .collect()
}

/// The store a render of a lone built leaf reads that leaf's sides from
/// (`Place::RootLeaf`), over its engine's built arena, and the entries its
/// sides' values were written as, which `release` gives back once the render
/// is done.
#[cfg(feature = "arena")]
#[derive(Debug)]
pub struct RootLeaf<T> {
    pub store: TriviaStore<T>,
    made: Vec<CompactEntry>,
}

#[cfg(feature = "arena")]
impl<T: Clone> RootLeaf<T> {
    /// Gives back the count each entry its sides' values were written as
    /// holds.
    ///
    /// # Errors
    ///
    /// What releasing an entry refuses.
    pub fn release(self) -> Result<(), ArenaError> {
        self.store.release_kept(&self.made)
    }
}

impl<T: Clone> TriviaStore<T> {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// `entries`, a parsed tree's row, as this store answers them: each
    /// built record among them holds this store, which holds the record's
    /// own sides and the arena that wrote it.
    #[cfg_attr(not(feature = "arena"), allow(clippy::unused_self, reason = "an entry names a built record only in the arena build"))]
    #[must_use]
    pub fn answered(&self, entries: &[TriviaEntry<T>]) -> Vec<TriviaEntry<T>> {
        entries
            .iter()
            .map(|entry| match entry {
                #[cfg(feature = "arena")]
                TriviaEntry::Record(record) => TriviaEntry::Record(crate::trivia::RecordEntry { store: Some(self.clone()), ..record.clone() }),
                entry @ TriviaEntry::Value(_) => entry.clone(),
            })
            .collect()
    }

    /// `kept` as the trivia entries it was written from, under `arena`, the
    /// built arena its caller holds: a record answered by this store, a
    /// layout member and text built by the grammar's trivia type.
    #[cfg(feature = "arena")]
    fn expanded(&self, kept: &[CompactEntry], arena: &dyn ArenaRead) -> Result<Vec<TriviaEntry<T>>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        use crate::slot::SlotValue;
        use crate::trivia::{BuiltEntry, RecordEntry, TriviaText};
        kept.iter()
            .map(|&entry| {
                Ok(match entry {
                    CompactEntry::Record { kind, at } => TriviaEntry::Record(RecordEntry { record: BuiltEntry { kind, at }, store: Some(self.clone()), as_source: None }),
                    CompactEntry::Layout { kind } => {
                        let member = T::from_layout(TriviaText::of(kind, "")).ok_or(ArenaError::Malformed { what: "layout member kind", word: u32::from(kind.0) })?;
                        TriviaEntry::new(SlotValue::Node(member))
                    }
                    CompactEntry::Text { kind, at } => TriviaEntry::new(SlotValue::Node(T::from_text(TriviaText::of(kind, leaf_text(arena, at, kind, self.kind_bits)?)))),
                })
            })
            .collect()
    }

    /// The entries a write gave `side` of the node at `place`, or `None` when
    /// no write did, read under `arena`, the built arena its caller holds. A
    /// write of no entries is `Some` of none: it replaced the side with
    /// nothing.
    ///
    /// # Errors
    ///
    /// What reading the node's rows or a text entry's leaf entry refuses.
    #[cfg(feature = "arena")]
    pub fn side(&self, place: Place, side: TriviaSide, arena: &dyn ArenaRead) -> Result<Option<Vec<TriviaEntry<T>>>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        self.side_in(place, side, self.list_of_place(place, arena)?, arena)
    }

    /// `side`, `list` the list of replaced ranges of the read that left the
    /// node's record (`list_of`), which the caller read once a call.
    ///
    /// # Errors
    ///
    /// As `side`.
    #[cfg(feature = "arena")]
    pub fn side_in(&self, place: Place, side: TriviaSide, list: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<Option<Vec<TriviaEntry<T>>>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        self.kept_of(place, side, list, arena)?.map(|kept| self.expanded(&kept, arena)).transpose()
    }

    /// The entries a write gave `side` of the node at `place`, as this store
    /// keeps them, its record's header and rows read under `arena`
    /// (`kept_side`); `None` when no write did.
    #[cfg(feature = "arena")]
    fn kept_of(&self, place: Place, side: TriviaSide, list: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<Option<Vec<CompactEntry>>, ArenaError> {
        if !Self::keeps(place, side) {
            return Ok(None);
        }
        let (header, rows) = self.header_and_rows(place, list, arena)?;
        self.kept_side(place, side, header.as_ref(), rows.as_ref(), arena)
    }

    /// The header of the record `place` names (`header_of`) and the rows its
    /// node is kept in: the record's own, or its holder's for a unit or a
    /// leaf at its site; none for the root leaf. One lookup of the record's
    /// chunk for a record whose side record lies there and holds no rows
    /// (`RowFields::of_record`).
    #[cfg(feature = "arena")]
    fn header_and_rows(&self, place: Place, list: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<(Option<Header>, Option<crate::arena::RowFields>), ArenaError> {
        let Place::Node(name) = place else { return Ok((None, None)) };
        let holder = Address(name.address());
        let (header, _, rows) = crate::arena::RowFields::of_record(arena, holder)?;
        Self::read_overlay(holder, self.header_of(place, header)?, rows, list, arena)
    }

    /// The entries of `list`, a read's list of replaced ranges, that name a
    /// node kept in the record at `holder`: none for a built record.
    #[cfg(feature = "arena")]
    fn replaced_of(holder: Address, list: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<Vec<crate::arena::Replaced>, ArenaError> {
        if list.0 == 0 || !arena.read_record(holder) {
            return Ok(Vec::new());
        }
        let mut entries = crate::arena::Replaced::read(arena, list)?;
        entries.retain(|entry| entry.node.address() == holder.0);
        Ok(entries)
    }

    /// The header and rows of the record at `holder` as its sides read,
    /// `list` its read's list of replaced ranges (`list_of`): for a read's
    /// record, each side the list holds an entry for (`replaced_of`) is
    /// that entry's row in place of the row its parse placed, with no
    /// layout codes from the header; any other record's as they are.
    #[cfg(feature = "arena")]
    fn read_overlay(holder: Address, mut header: Option<Header>, rows: Option<crate::arena::RowFields>, list: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<(Option<Header>, Option<crate::arena::RowFields>), ArenaError> {
        let entries = Self::replaced_of(holder, list, arena)?;
        if entries.is_empty() {
            return Ok((header, rows));
        }
        let mut rows = rows.unwrap_or_default();
        for entry in entries {
            Self::set_row_of(&mut rows, entry.node, entry.side, Some(entry.row));
            if let (None, Some((layout, _))) = (entry.node.site(), header.as_mut()) {
                layout.side_mut(entry.side).fill(crate::layout_kinds::LayoutKinds::NONE);
            }
        }
        Ok((header, Some(rows)))
    }

    /// Whether a write gave `side` of the read's node at `place` in place of
    /// the side its parse placed: an entry of its read's list of replaced
    /// ranges names it (`write_read_kept`), read under `arena`.
    ///
    /// # Errors
    ///
    /// What reading the read's list refuses.
    #[cfg(feature = "arena")]
    pub fn edited(place: Place, side: TriviaSide, list: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<bool, ArenaError> {
        let Place::Node(name) = place else { return Ok(false) };
        Ok(Self::keeps(place, side) && Self::replaced_of(Address(name.address()), list, arena)?.iter().any(|entry| entry.node == name && entry.side == side))
    }

    /// Whether `side` of the node at `place`, its header's codes and its
    /// row read under `arena` (`kept_side`), ends with the layout member of
    /// `kind`.
    ///
    /// # Errors
    ///
    /// What reading the node's header and rows refuses.
    #[cfg(feature = "arena")]
    pub fn ends_with_layout(&self, place: Place, side: TriviaSide, kind: KindId, list: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<bool, ArenaError> {
        Ok(matches!(self.kept_of(place, side, list, arena)?.as_deref().and_then(<[CompactEntry]>::last), Some(&CompactEntry::Layout { kind: last }) if last == kind))
    }

    /// The sides writes gave the node at `place`, as its trivia, or `None`
    /// when no write gave it any, read under `arena`.
    ///
    /// # Errors
    ///
    /// As `side`.
    #[cfg(feature = "arena")]
    pub fn sides(&self, place: Place, arena: &dyn ArenaRead) -> Result<Option<crate::trivia::NodeTrivia<T>>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        self.sides_in(place, self.list_of_place(place, arena)?, arena)
    }

    /// `sides`, `list` the list of replaced ranges of the read that left
    /// the node's record (`list_of`), which the caller read once a call.
    ///
    /// # Errors
    ///
    /// As `side`.
    #[cfg(feature = "arena")]
    pub fn sides_in(&self, place: Place, list: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<Option<crate::trivia::NodeTrivia<T>>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        let (header, rows) = self.header_and_rows(place, list, arena)?;
        self.sides_with(place, header, rows.as_ref(), arena)
    }

    /// `sides` of the record `place` names, `header` its header word and
    /// `rows` the rows of its side record as its caller read them
    /// (`SideRecord::rows`).
    ///
    /// # Errors
    ///
    /// As `side`, and `ArenaError::Malformed` for a header layout code past
    /// the widest layout kind.
    #[cfg(feature = "arena")]
    pub fn sides_under(&self, place: Place, header: u32, rows: &crate::arena::RowFields, list: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<Option<crate::trivia::NodeTrivia<T>>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        let header = self.header_of(place, header)?;
        let Place::Node(name) = place else { return self.sides_with(place, header, Some(rows), arena) };
        let (header, rows) = Self::read_overlay(Address(name.address()), header, Some(rows.clone()), list, arena)?;
        self.sides_with(place, header, rows.as_ref(), arena)
    }

    /// `sides`, `header` the record's header (`header_of`) and `rows` the
    /// rows its node is kept in (`header_and_rows`): none at once when they
    /// hold no row and the header keeps no layout code.
    #[cfg(feature = "arena")]
    fn sides_with(&self, place: Place, header: Option<Header>, rows: Option<&crate::arena::RowFields>, arena: &dyn ArenaRead) -> Result<Option<crate::trivia::NodeTrivia<T>>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        if rows.is_none_or(|rows| !rows.holds_rows()) && place != Place::RootLeaf && header.as_ref().is_none_or(|(layout, _)| layout.is_empty()) {
            return Ok(None);
        }
        let side = |side| {
            if !Self::keeps(place, side) {
                return Ok(None);
            }
            self.kept_side(place, side, header.as_ref(), rows, arena)?.map(|kept| self.expanded(&kept, arena)).transpose()
        };
        let trivia = crate::trivia::NodeTrivia { leading: side(TriviaSide::Leading)?, trailing: side(TriviaSide::Trailing)?, inner: side(TriviaSide::Inner)? };
        Ok((trivia.leading.is_some() || trivia.trailing.is_some() || trivia.inner.is_some()).then_some(trivia))
    }

    /// Each side a write gave a node of a read, by the node's name: the
    /// entries of `list`, its list of replaced ranges (`list_of`), in the
    /// list's order; not a side its parse placed and no write replaced.
    ///
    /// # Errors
    ///
    /// What reading the list refuses.
    #[cfg(feature = "arena")]
    pub fn written(list: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<Vec<(crate::types::NodeId, TriviaSide)>, ArenaError> {
        Ok(crate::arena::Replaced::read(arena, list)?.into_iter().map(|entry| (entry.node, entry.side)).collect())
    }

    /// The sides writes gave each built unit `holder`'s record holds, by the
    /// unit's slot word and its item there, in that order, read under
    /// `arena`.
    ///
    /// # Errors
    ///
    /// As `side`.
    #[cfg(feature = "arena")]
    pub fn units(&self, holder: crate::arena::Address, arena: &dyn ArenaRead) -> Result<Vec<(u32, crate::types::ItemIndex, crate::trivia::NodeTrivia<T>)>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        self.units_with(holder, self.list_of(holder, arena)?, arena)
    }

    /// `units`, `list` the list of replaced ranges of the read that left
    /// the holder's record (`list_of`), which the caller read once a call.
    ///
    /// # Errors
    ///
    /// As `units`.
    #[cfg(feature = "arena")]
    pub fn units_with(&self, holder: crate::arena::Address, list: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<Vec<(u32, crate::types::ItemIndex, crate::trivia::NodeTrivia<T>)>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        let rows = crate::arena::RowFields::of_record(arena, holder)?.2.unwrap_or_default();
        self.units_in(holder, &rows, list, arena)
    }

    /// `units` of `holder`, `rows` the rows of its side record as its caller
    /// read them (`SideRecord::rows`).
    ///
    /// # Errors
    ///
    /// As `side`.
    #[cfg(feature = "arena")]
    pub fn units_in(&self, holder: crate::arena::Address, rows: &crate::arena::RowFields, list: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<Vec<(u32, crate::types::ItemIndex, crate::trivia::NodeTrivia<T>)>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        let mut units: Vec<(u32, crate::types::ItemIndex, crate::trivia::NodeTrivia<T>)> = Vec::new();
        let (_, overlaid) = Self::read_overlay(holder, None, Some(rows.clone()), list, arena)?;
        let rows = overlaid.as_ref().unwrap_or(rows);
        for (key, cell) in self.unit_sites(rows, holder, arena)? {
            let (word, item, side) = crate::arena::RowFields::site_of(key);
            let item = crate::types::ItemIndex(item);
            if units.last().is_none_or(|unit| (unit.0, unit.1) != (word, item)) {
                units.push((word, item, crate::trivia::NodeTrivia::default()));
            }
            let Some(unit) = units.last_mut() else { continue };
            let held = if side == site_side(TriviaSide::Trailing) { &mut unit.2.trailing } else { &mut unit.2.leading };
            *held = Some(self.expanded(&self.entries(cell, arena)?, arena)?);
        }
        Ok(units)
    }

    /// Each site row of `rows`, the rows of `holder`'s record, whose site's
    /// child is a unit (`site::holds_unit`), in key order, read under
    /// `arena`.
    ///
    /// # Errors
    ///
    /// What reading the holder's cells refuses.
    #[cfg(feature = "arena")]
    fn unit_sites(&self, rows: &crate::arena::RowFields, holder: crate::arena::Address, arena: &dyn ArenaRead) -> Result<Vec<(u32, crate::arena::CellWord)>, ArenaError> {
        let mut units = Vec::new();
        for &(key, cell) in &rows.sites {
            let (word, item, _) = crate::arena::RowFields::site_of(key);
            if crate::arena::site::holds_unit(arena, holder, self.shape, self.kind_bits, crate::arena::site::CellSite { word, item })? {
                units.push((key, cell));
            }
        }
        Ok(units)
    }

    /// `entries` as this store keeps them (`RecordSink::kept`), each value
    /// written into its built arena.
    #[cfg(feature = "arena")]
    fn compact(&self, entries: &[TriviaEntry<T>]) -> Result<Vec<CompactEntry>, ArenaError>
    where
        T: HeapBytes + crate::arena::WriteCell<T>,
    {
        let mut chunks = self.built_mut();
        let mut unlinked = |_: &crate::slot::NodeCoordinate| Err::<crate::arena::Linked, _>(ArenaError::Unwritable("a coordinate in a side"));
        crate::arena::RecordSink::built(&mut chunks, self, &mut unlinked).kept(entries)
    }

    /// The sides a read placed its source's extras on, each a site, its
    /// side and its entries, written through the read's `writer` before
    /// the read finishes. Every site is named first (`site::site_name`)
    /// and every side checked as one the store keeps, so a refusal comes
    /// before any write. Then, holder by holder, each side's run is placed
    /// and one side record of rows is written over the holder's own side
    /// record (`RowFields::write_over`). A side is kept as a write keeps
    /// one (`header_split`) but not marked as one (`written`), holding a
    /// count of each record it names beside its holder's run's.
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for a row no cell of its holder names and
    /// for a non-empty inner side of a node with no inner site, and what
    /// reading the node's records or writing a record's header refuses.
    #[cfg(feature = "arena")]
    pub fn write_read_sides(&self, writer: &mut crate::arena::ReadWriter<'_>, sides: Vec<(crate::arena::NodeSite, TriviaSide, Vec<CompactEntry>)>) -> Result<(), ArenaError> {
        let mut known = crate::arena::site::RowSites::default();
        let mut named = Vec::with_capacity(sides.len());
        for (site, side, kept) in sides {
            let name = crate::arena::site::site_name(&*writer, self.shape, self.kind_bits, site, &mut known)?.ok_or(ArenaError::Unwritable("a placed side on a row no cell of its holder names"))?;
            if Self::keeps(Place::Node(name), side) {
                named.push((name, side, kept));
            } else if !kept.is_empty() {
                return Err(ArenaError::Unwritable(NO_INSIDE));
            }
        }
        named.sort_by_key(|&(name, side, _)| (name, side_index(side)));
        let mut named = named.into_iter().peekable();
        while let Some(&(first, _, _)) = named.peek() {
            let holder = Address(first.address());
            let (_, at, old) = crate::arena::RowFields::of_record(&*writer, holder)?;
            let mut rows = old.clone().unwrap_or_default();
            while let Some((name, side, kept)) = named.next_if(|&(name, _, _)| name.address() == first.address()) {
                Self::hold_kept_in(writer.chunks_mut(), &kept)?;
                let cell = self.header_split(writer.chunks_mut(), Place::Node(name), side, kept)?.map(|row| Self::place_row_over(writer, None, &row)).transpose()?;
                Self::set_row_of(&mut rows, name, side, cell);
            }
            crate::arena::RowFields::write_over(writer, holder, at, old.as_ref(), rows)?;
        }
        Ok(())
    }

    /// `side` of the built node at `place` holds `kept`, entries already
    /// kept as this store keeps them: for a record, whose words `chunks`
    /// hold, the gap members at the side's head that its header keeps for
    /// the side as its codes (`header_split`), and the rest as its row
    /// (`set_row`). A side of a read's node is marked as one a write gave
    /// (`written`). What the side's row held is released.
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for a non-empty inner side of a node with no
    /// inside, and what reading or writing the node's records refuses.
    #[cfg(feature = "arena")]
    pub fn write_kept_in(&self, chunks: &mut crate::arena::BuiltChunks, place: Place, side: TriviaSide, kept: Vec<CompactEntry>) -> Result<(), ArenaError> {
        if !Self::keeps(place, side) {
            return if kept.is_empty() { Ok(()) } else { Err(ArenaError::Unwritable(NO_INSIDE)) };
        }
        if matches!(place, Place::Node(name) if chunks.read_record(Address(name.address()))) {
            return Err(ArenaError::Unwritable(READ_SIDE));
        }
        self.keep_kept(chunks, place, side, kept)
    }

    /// `side` of the node at `place`, which this store keeps, holds `kept`:
    /// its header's codes and its row (`header_split`, `set_row`).
    #[cfg(feature = "arena")]
    fn keep_kept(&self, chunks: &mut crate::arena::BuiltChunks, place: Place, side: TriviaSide, kept: Vec<CompactEntry>) -> Result<(), ArenaError> {
        let row = self.header_split(chunks, place, side, kept)?;
        Self::set_row(chunks, place, side, row)
    }

    /// `side` of the node at `place` holds the row `row`, or none, in
    /// `chunks`: the row of the record's own side, or of the unit or leaf's
    /// site in its holder's record (`RowFields::write_over`), its entries
    /// placed as a run that holds the count each of them holds.
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for the root leaf, which has no record, and
    /// what placing the row or writing the record's rows refuses.
    #[cfg(feature = "arena")]
    fn set_row(chunks: &mut crate::arena::BuiltChunks, place: Place, side: TriviaSide, row: Option<Vec<CompactEntry>>) -> Result<(), ArenaError> {
        let Place::Node(name) = place else { return Err(ArenaError::Unwritable("a written side of the leaf a render roots at, which has no record")) };
        let mut writer = crate::arena::ReadWriter::new(chunks);
        let holder = Address(name.address());
        let (_, at, old) = crate::arena::RowFields::of_record(&writer, holder)?;
        let was = match &old {
            Some(rows) if writer.chunks_mut().count_of(at)? == 1 => Self::row_of(rows, name, side),
            _ => None,
        };
        let cell = row.map(|row| Self::place_row_over(&mut writer, was, &row)).transpose()?;
        let mut rows = old.clone().unwrap_or_default();
        Self::set_row_of(&mut rows, name, side, cell);
        crate::arena::RowFields::write_over(&mut writer, holder, at, old.as_ref(), rows)
    }

    /// `row` as a run of its entries' cells, written over the run `old` or
    /// placed anew (`RowFields::place_row_over`).
    #[cfg(feature = "arena")]
    fn place_row_over(writer: &mut crate::arena::ReadWriter<'_>, old: Option<crate::arena::CellWord>, row: &[CompactEntry]) -> Result<crate::arena::CellWord, ArenaError> {
        let cells = row.iter().map(|entry| entry.cell()).collect::<Result<Vec<_>, _>>()?;
        crate::arena::RowFields::place_row_over(writer, old, &cells)
    }

    /// The row `rows` holds for `side` of the node `name`: the record's own
    /// when `name` names no site, else its site's.
    #[cfg(feature = "arena")]
    fn row_of(rows: &crate::arena::RowFields, name: crate::types::NodeId, side: TriviaSide) -> Option<crate::arena::CellWord> {
        match name.site() {
            None => rows.side_row(side),
            Some([word, item]) => rows.site_row(crate::arena::RowFields::site_key(word, item, site_side(side))),
        }
    }

    /// `rows` holds `cell` as the row of `side` of the node `name`: the
    /// record's own when `name` names no site, else its site's.
    #[cfg(feature = "arena")]
    fn set_row_of(rows: &mut crate::arena::RowFields, name: crate::types::NodeId, side: TriviaSide, cell: Option<crate::arena::CellWord>) {
        match name.site() {
            None => *rows.side_row_mut(side) = cell,
            Some([word, item]) => rows.set_site_row(crate::arena::RowFields::site_key(word, item, site_side(side)), cell),
        }
    }

    /// The entries of the row `rows` (`header_and_rows`) holds for `side` of the
    /// node at `place`, read under `arena`; the root leaf's sides from this
    /// store; `None` for no row.
    #[cfg(feature = "arena")]
    fn row(&self, place: Place, side: TriviaSide, rows: Option<&crate::arena::RowFields>, arena: &dyn ArenaRead) -> Result<Option<Vec<CompactEntry>>, ArenaError> {
        let name = match place {
            Place::Node(name) => name,
            Place::RootLeaf => return Ok(self.root.as_ref().and_then(|root| root[side_index(side)].clone())),
        };
        let Some(rows) = rows else { return Ok(None) };
        let cell = match name.site() {
            None => rows.side_row(side),
            Some([word, item]) => rows.site_row(crate::arena::RowFields::site_key(word, item, site_side(side))),
        };
        cell.map(|cell| self.entries(cell, arena)).transpose()
    }

    /// The entries of the row whose list cell is `cell`, read under `arena`.
    #[cfg(feature = "arena")]
    fn entries(&self, cell: crate::arena::CellWord, arena: &dyn ArenaRead) -> Result<Vec<CompactEntry>, ArenaError> {
        crate::arena::RowFields::row_cells(arena, cell)?.map(|cell| CompactEntry::of_cell(cell, arena, self.kind_bits)).collect()
    }

    /// `kept`, the entries `side` of the node at `place` is written with,
    /// split for a record, built or a read's, whose words `chunks` hold: the
    /// gap members at the side's head, as many as its header keeps for the
    /// side (`HeaderLayout::side`), set as the header's codes for the side,
    /// and the rest, the side's row, which is none when the codes hold the
    /// whole side. A store with no whitespace table and an address that
    /// holds no words keep the whole side as its row.
    #[cfg(feature = "arena")]
    fn header_split(&self, chunks: &mut crate::arena::BuiltChunks, place: Place, side: TriviaSide, mut kept: Vec<CompactEntry>) -> Result<Option<Vec<CompactEntry>>, ArenaError> {
        let (Some(at), Some(table)) = (place.as_record(), self.whitespace) else { return Ok(Some(kept)) };
        let Ok(header) = chunks.words_mut(at, 1) else { return Ok(Some(kept)) };
        let gaps = crate::arena::rewrite_layout(header, self.kind_bits, |layout| {
            let codes = layout.side_mut(side);
            let gaps: Vec<crate::layout_kinds::LayoutKinds> = kept
                .iter()
                .map_while(|entry| match *entry {
                    CompactEntry::Layout { kind } => table.gap_of(kind),
                    _ => None,
                })
                .take(codes.len())
                .collect();
            for (n, code) in codes.iter_mut().enumerate() {
                *code = gaps.get(n).copied().unwrap_or(crate::layout_kinds::LayoutKinds::NONE);
            }
            gaps
        })?;
        let row = kept.split_off(gaps.len());
        Ok((gaps.is_empty() || !row.is_empty()).then_some(row))
    }

    /// The header `word` of the record `place` names, with the word it was
    /// decoded from: what `kept_side` reads a side's gap members from.
    /// `None` for a place with no record and a store that keeps no gap
    /// members.
    #[cfg(feature = "arena")]
    fn header_of(&self, place: Place, word: u32) -> Result<Option<Header>, ArenaError> {
        let (Some(_), Some(_)) = (place.as_record(), self.whitespace) else { return Ok(None) };
        Ok(Some((crate::arena::cell::HeaderLayout::of(word, self.kind_bits)?, word)))
    }

    /// The entries `side` of the node at `place` holds as this store keeps
    /// them, `header` its record's (`header_of`) and `rows` the rows it is
    /// kept in (`header_and_rows`), read under `arena`: for a record, built or a read's,
    /// the gap members its header keeps for the side (`header_split`), then
    /// its row; `None` when it holds neither.
    #[cfg(feature = "arena")]
    fn kept_side(&self, place: Place, side: TriviaSide, header: Option<&Header>, rows: Option<&crate::arena::RowFields>, arena: &dyn ArenaRead) -> Result<Option<Vec<CompactEntry>>, ArenaError> {
        let row = self.row(place, side, rows, arena)?;
        let (Some((layout, word)), Some(table)) = (header, self.whitespace) else { return Ok(row) };
        let codes = layout.side(side);
        if codes.first().is_none_or(|gap| gap.is_empty()) {
            return Ok(row);
        }
        let gaps = codes
            .iter()
            .take_while(|gap| !gap.is_empty())
            .map(|&gap| table.gap_kind(gap).map(|kind| CompactEntry::Layout { kind }).ok_or(ArenaError::Malformed { what: "header layout code naming no gap kind of the grammar", word: *word }));
        Ok(Some(gaps.chain(row.unwrap_or_default().into_iter().map(Ok)).collect::<Result<_, _>>()?))
    }

    /// Adopts each built record `entries` name (`BuiltChunks::adopt`): the
    /// side the entries are written to takes their handles.
    ///
    /// # Errors
    ///
    /// What adopting a record refuses.
    #[cfg(feature = "arena")]
    pub fn adopt(&self, entries: &[TriviaEntry<T>]) -> Result<(), ArenaError> {
        let records = held_records(entries);
        if records.is_empty() {
            return Ok(());
        }
        let mut built = self.built_mut();
        records.into_iter().try_for_each(|at| built.adopt(at))
    }

    /// Takes one more count in `chunks` of each record and leaf entry
    /// `kept` names.
    #[cfg(feature = "arena")]
    fn hold_kept_in(chunks: &mut crate::arena::BuiltChunks, kept: &[CompactEntry]) -> Result<(), ArenaError> {
        kept.iter().try_for_each(|&entry| match entry {
            CompactEntry::Record { at, .. } => chunks.hold(at),
            CompactEntry::Text { at, .. } => chunks.hold_text(at),
            CompactEntry::Layout { .. } => Ok(()),
        })
    }

    /// Releases a count of each built record `entries` name (`release`).
    ///
    /// # Errors
    ///
    /// What releasing a record refuses.
    #[cfg(feature = "arena")]
    pub fn release_entries(&self, entries: &[TriviaEntry<T>]) -> Result<(), ArenaError> {
        self.release_records(held_records(entries))
    }

    #[cfg(feature = "arena")]
    fn release_records(&self, records: Vec<crate::arena::Address>) -> Result<(), ArenaError> {
        self.release_batch(records.into_iter().map(|at| (crate::arena::count::Held::Record(at), false)))
    }

    /// Gives back the count each record and leaf entry `kept` names holds.
    #[cfg(feature = "arena")]
    fn release_kept(&self, kept: &[CompactEntry]) -> Result<(), ArenaError> {
        self.release_batch(kept.iter().filter_map(|entry| entry.held()).map(|held| (held, false)))
    }

    /// Releases a count of `held` (`BuiltChunks::release`), and with each
    /// record it releases the sides its rows hold.
    ///
    /// # Errors
    ///
    /// What `BuiltChunks::release` refuses.
    #[cfg(feature = "arena")]
    pub fn release(&self, held: crate::arena::count::Held, owned: bool) -> Result<(), ArenaError> {
        self.built_mut().release(held, owned)
    }

    /// Releases each entry of `batch` (`BuiltChunks::release_batch`) under
    /// one lock of the built arena, as `release` does.
    ///
    /// # Errors
    ///
    /// What `BuiltChunks::release_batch` refuses.
    #[cfg(feature = "arena")]
    pub fn release_batch(&self, batch: impl IntoIterator<Item = (crate::arena::count::Held, bool)>) -> Result<(), ArenaError> {
        self.built_mut().release_batch(batch)
    }

    /// A store over this one's built arena that holds `sides` alone, as the
    /// sides of the lone leaf a render roots at (`Place::RootLeaf`), which
    /// has no site in this store to key them by, with the entries their
    /// values were written as. A built record among them renders from the
    /// arena this store holds. Its caller holds no lock of that arena, which
    /// the values are written into.
    ///
    /// # Errors
    ///
    /// What keeping an entry refuses.
    #[cfg(feature = "arena")]
    pub fn root_leaf(&self, sides: Option<crate::trivia::NodeTrivia<T>>) -> Result<RootLeaf<T>, ArenaError>
    where
        T: HeapBytes + crate::arena::WriteCell<T>,
    {
        let mut root: [Option<Vec<CompactEntry>>; 3] = Default::default();
        let mut made = Vec::new();
        if let Some(sides) = sides {
            for (side, entries) in [(TriviaSide::Leading, sides.leading), (TriviaSide::Trailing, sides.trailing), (TriviaSide::Inner, sides.inner)] {
                if let Some(entries) = entries {
                    let kept = self.compact(&entries)?;
                    made.extend(entries.iter().zip(&kept).filter(|(entry, _)| matches!(entry, TriviaEntry::Value(_))).map(|(_, &kept)| kept));
                    root[side_index(side)] = Some(kept);
                }
            }
        }
        let store = Self {
            root: Some(Box::new(root)),
            list_reads: Arc::clone(&self.list_reads),
            built: Arc::clone(&self.built),
            kind_bits: self.kind_bits,
            shape: self.shape,
            whitespace: self.whitespace,
            #[cfg(feature = "napi-bindings")]
            buffers: Arc::clone(&self.buffers),
            trivia: std::marker::PhantomData,
        };
        Ok(RootLeaf { store, made })
    }

    /// Releases the built records the written `rows` of a dropped tree
    /// name, answering whether one did. A record the release refuses is left
    /// counted.
    #[must_use]
    #[cfg_attr(not(feature = "arena"), allow(clippy::unused_self, unused_variables, reason = "an entry names a built record only in the arena build"))]
    pub fn release_rows(&self, rows: &[Vec<TriviaEntry<T>>]) -> bool {
        #[cfg(feature = "arena")]
        {
            let records: Vec<_> = rows.iter().flat_map(|entries| held_records(entries)).collect();
            let held = !records.is_empty();
            let _ = self.release_records(records);
            held
        }
        #[cfg(not(feature = "arena"))]
        false
    }

    /// How many handles of the store are held.
    #[cfg(all(test, feature = "arena"))]
    pub(crate) fn handles(&self) -> usize {
        Arc::strong_count(&self.built)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(feature = "arena")]
    use crate::arena::Address;
    use crate::slot::SlotValue;
    use crate::trivia::TriviaText;
    use crate::types::{KindId, NodeIndex};

    /// The entries `side` of `place` holds, read under the store's own
    /// built arena.
    #[cfg(feature = "arena")]
    fn read_side<T: Clone + crate::trivia::FromTriviaText>(store: &TriviaStore<T>, place: Place, side: TriviaSide) -> Option<Vec<TriviaEntry<T>>> {
        store.side(place, side, &*store.built()).expect("read")
    }

    /// Writes `entries` to `side` of `place` through the store's kept core
    /// (`compact`, `write_kept_in`), taking no count of a record they name.
    #[cfg(feature = "arena")]
    fn write<T: Clone + HeapBytes + crate::arena::WriteCell<T>>(store: &TriviaStore<T>, place: Place, side: TriviaSide, entries: &[TriviaEntry<T>]) -> Result<(), ArenaError> {
        let kept = store.compact(entries)?;
        store.write_kept_in(&mut store.built_mut(), place, side, kept)
    }

    /// As `write`, each record `entries` name held by the side (`adopt`).
    #[cfg(feature = "arena")]
    fn write_held<T: Clone + HeapBytes + crate::arena::WriteCell<T>>(store: &TriviaStore<T>, place: Place, side: TriviaSide, entries: &[TriviaEntry<T>]) -> Result<(), ArenaError> {
        let kept = store.compact(entries)?;
        store.adopt(entries)?;
        store.write_kept_in(&mut store.built_mut(), place, side, kept)
    }

    fn entry(text: &str) -> TriviaEntry<TriviaText> {
        TriviaEntry::new(SlotValue::Node(TriviaText { kind: KindId(1), text: text.to_owned(), span: None, before: None, after: None }))
    }

    #[test]
    fn a_write_replaces_its_side_and_the_table_counts_what_its_rows_hold() {
        let mut rows = SideRows::<NodeIndex, TriviaEntry<TriviaText>>::default();
        let at = NodeIndex::new(2);
        assert_eq!(rows.get(at, TriviaSide::Leading), None);
        assert_eq!(rows.insert(at, TriviaSide::Leading, vec![entry("// a")]), None);
        assert_eq!(rows.insert(at, TriviaSide::Leading, vec![entry("// b")]), Some(vec![entry("// a")]), "a write answers what it replaced");
        assert_eq!(rows.get(at, TriviaSide::Leading), Some([entry("// b")].as_slice()));
        assert_eq!(rows.get(at, TriviaSide::Trailing), None);
        rows.insert(at, TriviaSide::Trailing, Vec::new());
        assert_eq!(rows.get(at, TriviaSide::Trailing), Some([].as_slice()), "a side replaced with nothing is written");
        let walked: usize = rows.range(..).map(|(_, entries)| row_bytes::<NodeIndex, _>(entries)).sum();
        assert_eq!(rows.bytes(), walked, "the count is what a walk of the rows finds");
        assert_eq!(rows.take().len(), 2);
        assert_eq!((rows.len(), rows.bytes()), (0, 0), "taking the rows empties the table and its count");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn releasing_a_dropped_tree_s_rows_answers_whether_one_named_a_built_record() {
        let store = TriviaStore::<TriviaText>::new();
        assert!(store.release_rows(&[vec![entry("// x"), record(5, None)]]));
        assert!(!store.release_rows(&[vec![entry("// y")]]), "text alone holds no record");
        assert!(!store.release_rows(&[]), "a tree with no sides");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_built_place_keeps_its_sides_in_its_record_s_rows_for_every_handle() {
        let store = TriviaStore::<TriviaText>::for_records(crate::record::PARSED_KIND_BITS, holder_shape);
        let at = holder(&store);
        let record = Place::record(at);
        let unit = Place::site(Site { holder: at, word: 2, item: crate::types::ItemIndex(0) });
        let other = store.clone();
        write(&store, record, TriviaSide::Leading, &[entry("// a")]).expect("kept");
        write(&other, record, TriviaSide::Leading, &[entry("// r")]).expect("kept");
        write(&store, unit, TriviaSide::Trailing, &[entry("// u")]).expect("kept");
        assert_eq!(read_side(&store, record, TriviaSide::Leading), Some(vec![entry("// r")]), "every handle writes the one store");
        assert_eq!(read_side(&store, unit, TriviaSide::Trailing), Some(vec![entry("// u")]));
        let rows = rows_of(&store, at).expect("a side record of rows");
        assert!(rows.leading.is_some() && rows.site_row(crate::arena::RowFields::site_key(2, 0, 1)).is_some(), "the record's own row and its unit's, in the side record of rows its header names: {rows:?}");
    }

    #[cfg(feature = "arena")]
    const HOLDER: KindId = KindId(2);

    /// A holder's record: a single slot at word 2 and one at word 7.
    #[cfg(feature = "arena")]
    fn holder_shape(kind: KindId) -> Option<crate::arena::RecordShape> {
        const CELLS: &[crate::arena::CellShape] = &[
            crate::arena::CellShape { word: 2, width: 1, run: None, forms: crate::record::form::NODE, built: 2, key: "unit", ..crate::arena::CellShape::BARE },
            crate::arena::CellShape { word: 7, width: 1, run: None, forms: crate::record::form::NODE, built: 3, key: "leaf", ..crate::arena::CellShape::BARE },
        ];
        (kind == HOLDER).then_some(crate::arena::RecordShape { words: 8, built_words: 4, cells: CELLS, ..crate::arena::RecordShape::BARE })
    }

    /// A built record of `store`'s arena of `holder_shape`'s kind, a unit
    /// in its slot at word 2 and its slot at word 7 empty.
    #[cfg(feature = "arena")]
    fn holder<T>(store: &TriviaStore<T>) -> Address {
        let mut chunks = store.built_mut();
        let mut writer = crate::arena::BuiltWriter::new(&mut chunks);
        let header = writer.header(HOLDER, 0).expect("a header");
        let unit = crate::arena::CellWord::unit(KindId(9)).expect("a unit").0;
        writer.record(&[header, 0, unit, 0], true).expect("a built record")
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_node_s_written_sides_read_as_its_trivia_and_a_holder_s_units_as_theirs() {
        use crate::trivia::NodeTrivia;
        use crate::types::ItemIndex;
        let store = TriviaStore::<TriviaText>::for_records(crate::record::PARSED_KIND_BITS, holder_shape);
        let (one, other, none) = (holder(&store), holder(&store), holder(&store));
        let record = Place::record(one);
        assert_eq!(store.sides(record, &*store.built()).expect("read"), None, "no write gave it a side");
        write(&store, record, TriviaSide::Leading, &[]).expect("kept");
        assert_eq!(store.sides(record, &*store.built()).expect("read"), Some(NodeTrivia { leading: Some(Vec::new()), trailing: None, inner: None }));
        let site = |holder, word| Place::site(Site { holder, word, item: ItemIndex(0) });
        write(&store, site(one, 2), TriviaSide::Trailing, &[entry("// b")]).expect("kept");
        write(&store, site(one, 2), TriviaSide::Leading, &[entry("// a")]).expect("kept");
        write(&store, site(one, 7), TriviaSide::Leading, &[entry("// leaf")]).expect("kept");
        write(&store, site(other, 2), TriviaSide::Leading, &[entry("// other")]).expect("kept");
        assert_eq!(
            store.units(one, &*store.built()).expect("read"),
            [(2, ItemIndex(0), NodeTrivia { leading: Some(vec![entry("// a")]), trailing: Some(vec![entry("// b")]), inner: None })],
            "the sides at a site whose cell holds no unit are not a unit's"
        );
        assert_eq!(store.units(none, &*store.built()).expect("read"), []);
    }

    /// A holder's record: a list slot at word 2 and a single slot at word 3.
    #[cfg(feature = "arena")]
    fn list_holder_shape(kind: KindId) -> Option<crate::arena::RecordShape> {
        const CELLS: &[crate::arena::CellShape] = &[
            crate::arena::CellShape { word: 2, width: 1, run: Some(3), forms: crate::record::form::NODE, built: 2, key: "units", ..crate::arena::CellShape::BARE },
            crate::arena::CellShape { word: 3, width: 1, run: None, forms: crate::record::form::NODE, built: 3, key: "unit", ..crate::arena::CellShape::BARE },
        ];
        (kind == HOLDER).then_some(crate::arena::RecordShape { words: 4, built_words: 4, cells: CELLS, ..crate::arena::RecordShape::BARE })
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_holder_s_units_come_by_their_slot_word_then_their_item() {
        use crate::types::ItemIndex;
        let store = TriviaStore::<TriviaText>::for_records(crate::record::PARSED_KIND_BITS, list_holder_shape);
        let at = {
            let mut chunks = store.built_mut();
            let mut writer = crate::arena::BuiltWriter::new(&mut chunks);
            let header = writer.header(HOLDER, 0).expect("a header");
            let unit = crate::arena::CellWord::unit(KindId(9)).expect("a unit").0;
            let units = writer.run(&[unit, unit]).expect("a run").0;
            writer.record(&[header, 0, units, unit], true).expect("a built record")
        };
        let site = |word, item| Place::site(Site { holder: at, word, item: ItemIndex(item) });
        write(&store, site(3, 0), TriviaSide::Leading, &[entry("// single")]).expect("kept");
        write(&store, site(2, 1), TriviaSide::Leading, &[entry("// second item")]).expect("kept");
        let order: Vec<_> = store.units(at, &*store.built()).expect("read").into_iter().map(|(word, item, _)| (word, item)).collect();
        assert_eq!(order, [(2, ItemIndex(1)), (3, ItemIndex(0))]);
    }

    #[cfg(feature = "arena")]
    fn record(at: u32, store: Option<TriviaStore<TriviaText>>) -> TriviaEntry<TriviaText> {
        TriviaEntry::Record(crate::trivia::RecordEntry { record: crate::trivia::BuiltEntry { kind: KindId(1), at: crate::arena::Address(at) }, store, as_source: None })
    }

    #[cfg(feature = "arena")]
    fn store_of(entry: &TriviaEntry<TriviaText>) -> Option<&TriviaStore<TriviaText>> {
        match entry {
            TriviaEntry::Record(record) => record.store.as_ref(),
            TriviaEntry::Value(_) => None,
        }
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_record_entry_is_answered_by_the_store_that_holds_it_and_no_store_holds_itself() {
        let (one, two) = (TriviaStore::<TriviaText>::for_records(crate::record::PARSED_KIND_BITS, holder_shape), TriviaStore::<TriviaText>::new());
        let handle = one.clone();
        assert!(one == handle && one != two, "a handle equals another only when they share one store");
        let [four, five, six, seven] = [(); 4].map(|()| holder(&one));
        write(&one, Place::record(four), TriviaSide::Leading, &[record(five.0, Some(one.clone())), entry("// x"), record(seven.0, None)]).expect("kept");
        let read = read_side(&one, Place::record(four), TriviaSide::Leading).expect("written");
        assert_eq!(store_of(&read[1]), None, "an entry that names no record holds no store");
        assert_eq!((store_of(&read[0]), store_of(&read[2])), (Some(&one), Some(&one)), "a record is answered by the store that holds it");
        write(&one, Place::record(five), TriviaSide::Trailing, &[record(six.0, None)]).expect("kept");
        let trailing = one.sides(Place::record(five), &*one.built()).expect("read").and_then(|sides| sides.trailing).expect("written");
        assert_eq!(store_of(&trailing[0]), Some(&one), "a record's own sides answer with their store too");
        drop((read, trailing));
        assert_eq!(one.handles(), 2, "no store holds itself: the handles are `one` and `handle`");
    }

    #[cfg(feature = "arena")]
    const NEWLINE: KindId = KindId(3);

    /// A trivia type with one layout member and text.
    #[cfg(feature = "arena")]
    #[derive(Debug, Clone, PartialEq)]
    enum Probe {
        Newline,
        Text(TriviaText),
    }

    #[cfg(feature = "arena")]
    impl HeapBytes for Probe {
        fn heap_bytes(&self) -> usize {
            match self {
                Probe::Newline => 0,
                Probe::Text(text) => text.heap_bytes(),
            }
        }
    }

    #[cfg(feature = "arena")]
    impl crate::trivia::FromTriviaText for Probe {
        fn from_text(text: TriviaText) -> Self {
            Probe::Text(text)
        }

        fn from_layout(text: TriviaText) -> Option<Self> {
            (text.kind == NEWLINE).then_some(Probe::Newline)
        }
    }

    #[cfg(feature = "arena")]
    impl crate::arena::WriteCell<Probe> for Probe {
        fn write_cell(&self, sink: &mut crate::arena::RecordSink<'_, Probe>) -> Result<crate::arena::CellWord, crate::arena::ArenaError> {
            match self {
                Probe::Newline => crate::arena::CellWord::unit(NEWLINE),
                Probe::Text(text) => text.write_cell(sink),
            }
        }
    }

    #[cfg(feature = "arena")]
    fn member() -> TriviaEntry<Probe> {
        TriviaEntry::new(SlotValue::Node(Probe::Newline))
    }

    #[cfg(feature = "arena")]
    fn text(text: &str) -> TriviaEntry<Probe> {
        TriviaEntry::new(SlotValue::Node(Probe::Text(TriviaText::of(KindId(1), text))))
    }

    /// The side record of rows the record at `at` names in `store`'s built
    /// arena.
    #[cfg(feature = "arena")]
    fn rows_of<T>(store: &TriviaStore<T>, at: Address) -> Option<crate::arena::RowFields> {
        crate::arena::RowFields::of_record(&*store.built(), at).expect("its rows").2
    }

    /// The row `side` of `place` holds in `store`, its header's codes aside.
    #[cfg(feature = "arena")]
    fn kept_row<T: Clone>(store: &TriviaStore<T>, place: Place, side: TriviaSide) -> Option<Vec<CompactEntry>> {
        let built = store.built();
        store.row(place, side, store.header_and_rows(place, store.list_of_place(place, &*built).expect("its read's list"), &*built).expect("its rows").1.as_ref(), &*built).expect("a row")
    }

    /// The string chunk the first text entry of `side` at `place` lies in.
    #[cfg(feature = "arena")]
    fn text_chunk<T: Clone>(store: &TriviaStore<T>, place: Place, side: TriviaSide) -> u32 {
        let kept = kept_row(store, place, side).expect("written");
        kept.iter()
            .find_map(|entry| match *entry {
                CompactEntry::Text { at, .. } => Some(at.chunk()),
                _ => None,
            })
            .expect("a text entry")
    }

    #[cfg(feature = "arena")]
    static PROBE_WHITESPACE: crate::render::WhitespaceTable = crate::render::WhitespaceTable { text_of: |_| "\n", indent: KindId(0), dedent: KindId(0), leaf_edges: &[], gaps: &[(crate::layout_kinds::LayoutKinds::NEWLINE.0, NEWLINE)] };

    /// A built record of `store`'s arena, its header written as a builder
    /// writes it.
    #[cfg(feature = "arena")]
    fn built_record(store: &TriviaStore<Probe>) -> Address {
        let mut chunks = store.built_mut();
        let header = crate::arena::BuiltWriter::new(&mut chunks).header(KindId(2), 0).expect("a header");
        crate::arena::BuiltWriter::new(&mut chunks).record(&[header, 0], true).expect("a built record")
    }

    /// A built record of `store`'s arena (`built_record`), and a read's
    /// record, its header carrying a set-apart trailing code as a parse
    /// writes it.
    #[cfg(feature = "arena")]
    fn records(store: &TriviaStore<Probe>) -> (Address, Address) {
        let built = built_record(store);
        let mut chunks = store.built_mut();
        let header = crate::arena::BuiltWriter::new(&mut chunks).header(KindId(2), 0).expect("a header");
        let layout = crate::arena::cell::HeaderLayout { trailing: crate::layout_kinds::LayoutKinds::BLANKLINE, ..crate::arena::cell::HeaderLayout::default() };
        let stamped = layout.onto(header, store.kind_bits).expect("a header");
        let read = crate::arena::RecordSpace::push(&mut crate::arena::ReadWriter::new(&mut chunks), &[stamped, 0]).expect("a read's record");
        (built, read)
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_unit_keeps_no_inner_side() {
        use crate::types::ItemIndex;
        let store = TriviaStore::<TriviaText>::for_records(crate::record::PARSED_KIND_BITS, holder_shape);
        let at = holder(&store);
        let unit = Place::site(Site { holder: at, word: 2, item: ItemIndex(0) });
        let refused = |result: Result<(), ArenaError>| matches!(result, Err(ArenaError::Unwritable("an inner side on a node with no record, which has no inside")));
        assert!(refused(write(&store, unit, TriviaSide::Inner, &[entry("// in")])), "an entry inside a unit is refused");
        write(&store, unit, TriviaSide::Inner, &[]).expect("a write of nothing");
        assert_eq!(read_side(&store, unit, TriviaSide::Inner), None, "and keeps nothing");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_built_record_s_inner_side_is_its_own_inner_row_and_a_read_s_record_takes_no_written_row() {
        let store = TriviaStore::<Probe>::new();
        let (built, read) = records(&store);
        let record = Place::record(built);
        write_held(&store, record, TriviaSide::Inner, &[text("// in")]).expect("kept");
        let rows = rows_of(&store, built).expect("a side record of rows");
        assert!(rows.inner.is_some() && rows.sites.is_empty(), "the record's own inner row keeps it, at no site: {rows:?}");
        assert_eq!(read_side(&store, record, TriviaSide::Inner), Some(vec![text("// in")]));
        assert_eq!(store.sides(record, &*store.built()).expect("read").and_then(|sides| sides.inner), Some(vec![text("// in")]));
        assert_eq!(store.units(built, &*store.built()).expect("read"), [], "a record's inside is no unit's side");
        write_held(&store, record, TriviaSide::Inner, &[]).expect("a write of nothing");
        assert_eq!(read_side(&store, record, TriviaSide::Inner), Some(Vec::new()), "a write of nothing replaces it");
        assert_eq!(write_held(&store, Place::record(read), TriviaSide::Inner, &[text("// in")]), Err(ArenaError::Unwritable(READ_SIDE)), "a read's record keeps the rows its parse placed: its read's list holds a written side");
        assert_eq!(rows_of(&store, read), None);
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_built_record_s_header_keeps_the_gap_members_at_the_head_of_its_sides() {
        let store = TriviaStore::<Probe>::new().with_whitespace(&PROBE_WHITESPACE);
        let (built, read) = records(&store);
        let place = Place::record(built);
        let row = |side| kept_row(&store, place, side);
        let leading = [member(), member(), member(), member(), text("// x")];
        write_held(&store, place, TriviaSide::Leading, &leading).expect("kept");
        write(&store, place, TriviaSide::Trailing, &[member()]).expect("kept");
        assert!(matches!(row(TriviaSide::Leading).as_deref(), Some([CompactEntry::Layout { kind: NEWLINE }, CompactEntry::Text { .. }])), "three members in the header, the rest in the row: {:?}", row(TriviaSide::Leading));
        assert_eq!(row(TriviaSide::Trailing), None, "a side the header holds whole keeps no row");
        assert_eq!(read_side(&store, place, TriviaSide::Leading), Some(leading.to_vec()));
        assert_eq!(read_side(&store, place, TriviaSide::Trailing), Some(vec![member()]));
        write_held(&store, place, TriviaSide::Trailing, &[]).expect("kept");
        assert_eq!(read_side(&store, place, TriviaSide::Trailing), Some(Vec::new()), "a side replaced with nothing is written, and its codes cleared");
        write_held(&store, place, TriviaSide::Leading, &[text("// y")]).expect("kept");
        assert_eq!(read_side(&store, place, TriviaSide::Leading), Some(vec![text("// y")]), "a write replaces the side's codes with its row");
        let header = |at| crate::arena::ArenaRead::word(&*store.built(), at).expect("a header");
        let stamp = header(read);
        assert_eq!(write_held(&store, Place::record(read), TriviaSide::Trailing, &[member()]), Err(ArenaError::Unwritable(READ_SIDE)), "its read's list holds a written side of a read's record");
        assert_eq!(header(read), stamp, "a read's record keeps the codes its parse stamped");
    }

    /// The side writes `arena/side-writes.json` holds, each written to a
    /// built record through the kept core and read back as the fixture
    /// holds it; the TypeScript built arena's writer reads the same fixture.
    #[cfg(feature = "arena")]
    #[test]
    fn every_side_write_is_kept_as_the_shared_fixture_holds_it() {
        use serde_json::{json, Value};
        let fixture: Value = serde_json::from_str(include_str!("arena/side-writes.json")).expect("the fixture parses");
        let side_of = |name: &str| match name {
            "leading" => TriviaSide::Leading,
            "trailing" => TriviaSide::Trailing,
            "inner" => TriviaSide::Inner,
            other => panic!("no side {other}"),
        };
        let gap = |kinds: crate::layout_kinds::LayoutKinds| -> Value {
            assert_eq!(kinds, crate::layout_kinds::LayoutKinds::NEWLINE, "the probe keeps only newline");
            json!("newline")
        };
        for case in fixture["cases"].as_array().expect("cases") {
            let name = case["name"].as_str().expect("a name");
            let store = TriviaStore::<Probe>::new().with_whitespace(&PROBE_WHITESPACE);
            let at = built_record(&store);
            let own = case["own"].as_bool().expect("own").then(|| {
                let mut chunks = store.built_mut();
                let side = crate::arena::RecordSpace::push(&mut crate::arena::ReadWriter::new(&mut chunks), &[crate::arena::side::mask::SEPARATOR_KIND, 7]).expect("a side record");
                crate::arena::set_side_of(&mut crate::arena::ReadWriter::new(&mut chunks), at, side).expect("its header");
                side
            });
            for write in case["writes"].as_array().expect("writes") {
                let entries: Vec<_> = write["entries"].as_array().expect("entries").iter().map(|entry| entry.as_str().map_or_else(|| text(entry["text"].as_str().expect("a text")), |_| member())).collect();
                write_held(&store, Place::record(at), side_of(write["side"].as_str().expect("a side")), &entries).expect("kept");
            }
            let expect = &case["expect"];
            let header = crate::arena::cell::HeaderLayout::of(crate::arena::ArenaRead::word(&*store.built(), at).expect("a header"), store.kind_bits).expect("its layout");
            for side in ["leading", "trailing"] {
                let codes: Vec<Value> = header.side(side_of(side)).iter().take_while(|kinds| !kinds.is_empty()).map(|&kinds| gap(kinds)).collect();
                assert_eq!(Value::from(codes), expect["codes"][side], "{name}: {side} codes");
            }
            for (side, row) in expect["rows"].as_object().expect("rows") {
                let built = store.built();
                let kept = kept_row(&store, Place::record(at), side_of(side)).map(|kept| {
                    kept.iter()
                        .map(|entry| match *entry {
                            CompactEntry::Layout { kind } if kind == NEWLINE => json!("newline"),
                            CompactEntry::Text { kind, at } => json!({ "text": leaf_text(&*built, at, kind, store.kind_bits).expect("its text") }),
                            other => panic!("{name}: {other:?} is no entry the fixture writes"),
                        })
                        .collect::<Vec<_>>()
                });
                assert_eq!(kept.map_or(Value::Null, Value::from), *row, "{name}: {side} row");
            }
            let side = crate::arena::side_of(&*store.built(), at).expect("its header");
            let rows = rows_of(&store, at);
            assert_eq!(rows.is_some(), expect["rowsRecord"].as_bool().expect("rowsRecord"), "{name}: a side record of rows");
            let under = rows.map_or(Some(side).filter(|&side| side != Address::NONE), |rows| rows.next);
            assert_eq!(under, if expect["under"] == "own" { own } else { None }, "{name}: the side record under its rows");
        }
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_side_s_entry_is_kept_in_eight_bytes() {
        assert_eq!(std::mem::size_of::<CompactEntry>(), 8);
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_record_a_layout_member_and_a_text_entry_read_back_as_they_were_written() {
        use crate::trivia::{BuiltEntry, RecordEntry};
        let store = TriviaStore::<Probe>::new();
        let (place, named) = (Place::record(built_record(&store)), built_record(&store));
        let record = BuiltEntry { kind: KindId(2), at: named };
        write(&store, place, TriviaSide::Leading, &[TriviaEntry::Record(RecordEntry { record, store: None, as_source: None }), member(), text("// x")]).expect("kept");
        let kept = kept_row(&store, place, TriviaSide::Leading).expect("written");
        assert!(
            matches!(kept[..], [CompactEntry::Record { kind: KindId(2), at }, CompactEntry::Layout { kind: NEWLINE }, CompactEntry::Text { kind: KindId(1), .. }] if at == named),
            "a record by its kind and address, a member by its kind, text by its kind and its leaf entry: {kept:?}"
        );
        let read = read_side(&store, place, TriviaSide::Leading);
        assert_eq!(read, Some(vec![TriviaEntry::Record(RecordEntry { record, store: Some(store), as_source: None }), member(), text("// x")]));
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_coordinate_is_refused_and_the_side_keeps_what_it_held() {
        use crate::types::{Span, TreeId};
        let store = TriviaStore::<Probe>::new();
        let place = Place::record(built_record(&store));
        write_held(&store, place, TriviaSide::Leading, &[text("// a")]).expect("kept");
        let coordinate = crate::slot::NodeCoordinate::new(TreeId(1), NodeIndex::new(2), NodeIndex::new(3), Span { start: 0, end: 4 });
        let refused = write_held(&store, place, TriviaSide::Leading, &[member(), TriviaEntry::new(SlotValue::Coord(coordinate))]);
        assert!(matches!(refused, Err(crate::arena::ArenaError::Unwritable(_))), "{refused:?}");
        assert_eq!(read_side(&store, place, TriviaSide::Leading), Some(vec![text("// a")]));
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_coordinate_naming_a_read_s_record_is_kept_as_that_record() {
        use crate::arena::{ReadWriter, RecordSpace};
        use crate::trivia::{BuiltEntry, RecordEntry};
        use crate::types::{NodeId, Span, TreeId};
        let store = TriviaStore::<Probe>::new();
        let read = ReadWriter::new(&mut store.built_mut()).push(&[u32::from(KindId(2).0), 0]).expect("a read's record");
        let mut coordinate = crate::slot::NodeCoordinate::new(TreeId(1), NodeIndex::new(2), NodeIndex::new(3), Span { start: 0, end: 4 }).named(Some(NodeId::record(read.0)));
        coordinate.kind = Some(KindId(2));
        let place = Place::record(built_record(&store));
        write_held(&store, place, TriviaSide::Leading, &[TriviaEntry::new(SlotValue::Coord(coordinate))]).expect("kept");
        assert_eq!(read_side(&store, place, TriviaSide::Leading), Some(vec![TriviaEntry::Record(RecordEntry { record: BuiltEntry { kind: KindId(2), at: read }, store: Some(store.clone()), as_source: None })]));
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_text_entry_holds_its_string_chunk_until_its_side_is_replaced() {
        let store = TriviaStore::<Probe>::new();
        let place = Place::record(built_record(&store));
        write_held(&store, place, TriviaSide::Leading, &[text("// a"), text("// b")]).expect("kept");
        let chunk = text_chunk(&store, place, TriviaSide::Leading);
        assert_eq!(store.built().text_count(chunk), Some(2));
        write_held(&store, place, TriviaSide::Leading, &[member()]).expect("kept");
        assert_eq!(store.built().text_count(chunk), Some(0), "the replaced side gives its counts back");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_first_written_side_is_a_side_record_of_rows_over_the_record_s_own() {
        let store = TriviaStore::<Probe>::new();
        let at = built_record(&store);
        let own = {
            let mut chunks = store.built_mut();
            let side = crate::arena::RecordSpace::push(&mut crate::arena::ReadWriter::new(&mut chunks), &[crate::arena::side::mask::SEPARATOR_KIND, 7]).expect("a side record");
            crate::arena::set_side_of(&mut crate::arena::ReadWriter::new(&mut chunks), at, side).expect("its header");
            side
        };
        write_held(&store, Place::record(at), TriviaSide::Leading, &[text("// a")]).expect("kept");
        let rows = rows_of(&store, at).expect("a side record of rows");
        assert_eq!(rows.next, Some(own), "it names the side record it was written over");
        let side = crate::arena::SideRecord::read(&*store.built(), crate::arena::side_of(&*store.built(), at).expect("its header")).expect("its fields");
        assert_eq!(side.separator_kind, Some(KindId(7)), "the record reads its other fields through it");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_rewritten_row_held_once_keeps_its_side_record_and_gives_the_old_row_back() {
        let store = TriviaStore::<Probe>::new();
        let at = built_record(&store);
        let place = Place::record(at);
        write_held(&store, place, TriviaSide::Leading, &[text("// a")]).expect("kept");
        let side = crate::arena::side_of(&*store.built(), at).expect("its header");
        let chunk = text_chunk(&store, place, TriviaSide::Leading);
        write_held(&store, place, TriviaSide::Leading, &[text("// b"), text("// c")]).expect("kept");
        assert_eq!(crate::arena::side_of(&*store.built(), at).expect("its header"), side, "rewritten in place");
        assert_eq!(read_side(&store, place, TriviaSide::Leading), Some(vec![text("// b"), text("// c")]));
        assert_eq!(store.built().text_count(chunk), Some(2), "the old row's text given back, the new row's two held");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_row_written_again_with_no_more_entries_is_written_over_its_run_and_a_longer_one_pays_one_new_run() {
        let store = TriviaStore::<Probe>::new();
        let at = built_record(&store);
        let place = Place::record(at);
        let run = || rows_of(&store, at).and_then(|rows| rows.leading).expect("a leading row");
        write_held(&store, place, TriviaSide::Leading, &[text("// a"), text("// b")]).expect("kept");
        let (first, chunk) = (run(), text_chunk(&store, place, TriviaSide::Leading));
        write_held(&store, place, TriviaSide::Leading, &[text("// c"), text("// d")]).expect("kept");
        assert_eq!(run(), first, "as many entries: written over");
        assert_eq!(store.built().text_count(chunk), Some(2), "the old entries' counts given back");
        write_held(&store, place, TriviaSide::Leading, &[text("// e")]).expect("kept");
        assert_eq!(run(), first, "fewer entries: written over");
        assert_eq!(read_side(&store, place, TriviaSide::Leading), Some(vec![text("// e")]), "the shorter length stored");
        write_held(&store, place, TriviaSide::Leading, &[text("// f"), text("// g")]).expect("kept");
        let grown = run();
        assert_ne!(grown, first, "more entries than the stored length: one new run");
        assert_eq!(store.built_mut().count_of(first.address()).ok(), Some(0), "the outgrown run released");
        write_held(&store, place, TriviaSide::Leading, &[text("// h"), text("// i")]).expect("kept");
        assert_eq!(run(), grown, "the new run written over in turn");
        assert_eq!(read_side(&store, place, TriviaSide::Leading), Some(vec![text("// h"), text("// i")]));
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_row_under_a_shared_side_record_is_placed_anew_for_the_one_written() {
        let store = TriviaStore::<Probe>::new();
        let (one, two) = (built_record(&store), built_record(&store));
        write_held(&store, Place::record(one), TriviaSide::Leading, &[text("// shared")]).expect("kept");
        let shared = crate::arena::side_of(&*store.built(), one).expect("its header");
        {
            let mut chunks = store.built_mut();
            chunks.hold(shared).expect("a second holder");
            crate::arena::set_side_of(&mut crate::arena::ReadWriter::new(&mut chunks), two, shared).expect("its header");
        }
        write_held(&store, Place::record(two), TriviaSide::Leading, &[text("// own")]).expect("kept");
        assert_eq!(read_side(&store, Place::record(one), TriviaSide::Leading), Some(vec![text("// shared")]), "the other record keeps its row");
        assert_eq!(read_side(&store, Place::record(two), TriviaSide::Leading), Some(vec![text("// own")]));
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_side_record_of_rows_two_records_name_is_written_anew_for_the_one_written() {
        let store = TriviaStore::<Probe>::new();
        let (one, two) = (built_record(&store), built_record(&store));
        write_held(&store, Place::record(one), TriviaSide::Leading, &[text("// shared")]).expect("kept");
        let shared = crate::arena::side_of(&*store.built(), one).expect("its header");
        {
            let mut chunks = store.built_mut();
            chunks.hold(shared).expect("a second holder");
            crate::arena::set_side_of(&mut crate::arena::ReadWriter::new(&mut chunks), two, shared).expect("its header");
        }
        write_held(&store, Place::record(two), TriviaSide::Trailing, &[text("// own")]).expect("kept");
        assert_eq!(crate::arena::side_of(&*store.built(), one).expect("its header"), shared, "the other record keeps the shared one");
        assert_ne!(crate::arena::side_of(&*store.built(), two).expect("its header"), shared, "the written record writes its own");
        assert_eq!(read_side(&store, Place::record(one), TriviaSide::Trailing), None, "the other record never sees the write");
        assert_eq!(read_side(&store, Place::record(two), TriviaSide::Leading), Some(vec![text("// shared")]), "the written record keeps the shared rows it did not write");
        assert_eq!(read_side(&store, Place::record(two), TriviaSide::Trailing), Some(vec![text("// own")]));
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_record_left_with_no_row_names_the_side_record_under_its_rows_again() {
        let store = TriviaStore::<Probe>::new().with_whitespace(&PROBE_WHITESPACE);
        let at = built_record(&store);
        write_held(&store, Place::record(at), TriviaSide::Leading, &[text("// a")]).expect("kept");
        assert!(rows_of(&store, at).is_some());
        write_held(&store, Place::record(at), TriviaSide::Leading, &[member()]).expect("kept");
        assert_eq!(crate::arena::side_of(&*store.built(), at).expect("its header"), Address::NONE, "the header's code holds the side whole, so no row is left");
        assert_eq!(read_side(&store, Place::record(at), TriviaSide::Leading), Some(vec![member()]));
    }
}
