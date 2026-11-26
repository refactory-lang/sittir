//! The sides of trivia writes set for every node an engine renders, keyed
//! by the node and the side. One table type holds them (`SideRows`): the
//! engine's store keeps one for its built places, its entries compact
//! (`CompactEntry`), and each parsed tree one for its own rows, written
//! through the tree alone (`ParsedTree::write_trivia_side`). A node of a
//! tree's own rows reads as what a write set, else as what its tree's
//! placement assigned from its source (`ParsedTree::side_entries`,
//! `Placement`). A node a read left in the built arena reads as the side its
//! parse placed there, under the same key a write sets (`Place::Node`), so a
//! write replaces it; the store tells the sides a write gave apart from
//! those (`TriviaStore::written`).
//!
//! Setting or replacing a side never edits a node or a record. The store is
//! outside every record, so a record that shares a child never sees another
//! record's sides.

use crate::heap::HeapBytes;
use std::collections::BTreeMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
#[cfg(feature = "arena")]
use std::sync::{PoisonError, RwLock};

use crate::trivia::TriviaEntry;
use crate::trivia_table::TriviaSide;
use crate::types::NodeIndex;
#[cfg(feature = "arena")]
use crate::arena::{Address, ArenaError, ArenaRead};
#[cfg(feature = "arena")]
use crate::types::KindId;

/// What a write of entries to an inner side `TriviaStore::keyed` names no
/// site for is refused with: that of a unit or a leaf, which has no record
/// and no inside.
#[cfg(feature = "arena")]
const NO_INSIDE: &str = "an inner side on a node with no record, which has no inside";

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

    /// The first place of the record at `at`, and the first past every
    /// place its sites key: the range its own sides and its sites' sides
    /// are.
    fn holding(at: crate::arena::Address) -> std::ops::Range<(Place, TriviaSide)> {
        (Place::record(at), TriviaSide::Leading)..(Place::record(crate::arena::Address(at.0 + 1)), TriviaSide::Leading)
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

impl<E> SideRows<NodeIndex, E> {
    /// Whether a write set a side of a node in rows `[index, end)`: of a
    /// descendant of the node at `index`, or of that node's own `inner`, and
    /// of its own leading and trailing too when `own_sides` is set; and the
    /// rows the check walked, which are written rows alone.
    #[must_use]
    pub fn edited_within(&self, index: NodeIndex, end: NodeIndex, own_sides: bool) -> (bool, u64) {
        let mut walked = 0;
        let edited = self.rows.range((index, TriviaSide::Leading)..(end, TriviaSide::Leading)).inspect(|_| walked += 1).any(|(&(row, side), _)| row != index || own_sides || side == TriviaSide::Inner);
        (edited, walked)
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
/// A built record's entries, and those of the nodes at its sites, are
/// dropped when the record is released (`drop_record`), before its chunk's
/// number can name another chunk. A parsed tree's written rows are its own
/// (`ParsedTree::write_trivia_side`); a read whose tree is gone left its
/// nodes in the built arena, and their written sides are here, by the
/// nodes' names (`Place::Node`).
#[derive(Debug)]
pub struct TriviaStore<T> {
    #[cfg(feature = "arena")]
    sides: Arc<RwLock<SideRows<Place, CompactEntry>>>,
    /// The rows the edit checks have walked (`edit_walks`).
    edit_walks: Arc<AtomicU64>,
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
            sides: Arc::clone(&self.sides),
            edit_walks: Arc::clone(&self.edit_walks),
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
/// names a record only in the store of the arena that wrote it.
impl<T> PartialEq for TriviaStore<T> {
    fn eq(&self, other: &Self) -> bool {
        Arc::ptr_eq(&self.edit_walks, &other.edit_walks)
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

impl<T> TriviaStore<T> {
    /// A store whose built arena's kind fields take `kind_bits` bits and
    /// that knows no record's shape, so it releases no built record.
    #[must_use]
    #[cfg_attr(not(feature = "arena"), allow(unused_variables, reason = "only the arena build has a built arena"))]
    pub fn with_kind_bits(kind_bits: u32) -> Self {
        Self {
            #[cfg(feature = "arena")]
            sides: Arc::default(),
            edit_walks: Arc::default(),
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
            sides: Arc::default(),
            edit_walks: Arc::default(),
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

    /// Where this store keeps `side` of the node at `place`: a record's
    /// inner side is the leading side of its inside site (`NodeId::inside`);
    /// every other side is kept where `place` and `side` name it. `None` for
    /// the inner side of a unit or a leaf, which has no record and no
    /// inside.
    #[cfg(feature = "arena")]
    fn keyed(place: Place, side: TriviaSide) -> Option<(Place, TriviaSide)> {
        let name = match place {
            Place::Node(name) => name,
            Place::RootLeaf => return (side != TriviaSide::Inner).then_some((place, side)),
        };
        if side != TriviaSide::Inner {
            return Some((place, side));
        }
        name.inside().map(|inside| (Place::Node(inside), TriviaSide::Leading))
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

/// A side the store keeps for a unit a holder holds: the unit's site, the
/// side, and its entries (`TriviaStore::unit_sides`).
#[cfg(feature = "arena")]
type UnitSide<'r> = (crate::arena::site::CellSite, TriviaSide, &'r [CompactEntry]);

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

    #[cfg(feature = "arena")]
    fn read(&self) -> std::sync::RwLockReadGuard<'_, SideRows<Place, CompactEntry>> {
        self.sides.read().unwrap_or_else(PoisonError::into_inner)
    }

    #[cfg(feature = "arena")]
    fn write(&self) -> std::sync::RwLockWriteGuard<'_, SideRows<Place, CompactEntry>> {
        self.sides.write().unwrap_or_else(PoisonError::into_inner)
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
    /// What reading a text entry's leaf entry refuses.
    #[cfg(feature = "arena")]
    pub fn side(&self, place: Place, side: TriviaSide, arena: &dyn ArenaRead) -> Result<Option<Vec<TriviaEntry<T>>>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        let Some((place, side)) = Self::keyed(place, side) else { return Ok(None) };
        self.kept_side(&self.read(), place, side, self.header(place, arena)?.as_ref())?.map(|kept| self.expanded(&kept, arena)).transpose()
    }

    /// Whether a write gave `side` of the read's node at `place` in place of
    /// the side its parse placed (`write_kept_in`).
    #[cfg(feature = "arena")]
    #[must_use]
    pub fn edited(&self, place: Place, side: TriviaSide) -> bool {
        Self::keyed(place, side).is_some_and(|(place, side)| self.read().marked(place, side))
    }

    /// Whether `side` of the node at `place`, its header's codes and its
    /// row read under `arena` (`kept_side`), ends with the layout member of
    /// `kind`, read without expanding its entries.
    ///
    /// # Errors
    ///
    /// What reading the node's header refuses.
    #[cfg(feature = "arena")]
    pub fn ends_with_layout(&self, place: Place, side: TriviaSide, kind: KindId, arena: &dyn ArenaRead) -> Result<bool, ArenaError> {
        let Some((place, side)) = Self::keyed(place, side) else { return Ok(false) };
        Ok(matches!(self.kept_side(&self.read(), place, side, self.header(place, arena)?.as_ref())?.as_deref().and_then(<[CompactEntry]>::last), Some(&CompactEntry::Layout { kind: last }) if last == kind))
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
        self.sides_with(place, self.header(place, arena)?, arena)
    }

    /// `sides`, `header` the header word of the record `place` names as its
    /// caller read it.
    ///
    /// # Errors
    ///
    /// As `side`, and `ArenaError::Malformed` for a header layout code past
    /// the widest layout kind.
    #[cfg(feature = "arena")]
    pub fn sides_under(&self, place: Place, header: u32, arena: &dyn ArenaRead) -> Result<Option<crate::trivia::NodeTrivia<T>>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        self.sides_with(place, self.header_of(place, header)?, arena)
    }

    /// `sides`, `header` the record's header (`header`): none at once when
    /// the store holds no row and the header keeps no layout code.
    #[cfg(feature = "arena")]
    fn sides_with(&self, place: Place, header: Option<(crate::arena::cell::HeaderLayout, u32)>, arena: &dyn ArenaRead) -> Result<Option<crate::trivia::NodeTrivia<T>>, ArenaError>
    where
        T: crate::trivia::FromTriviaText,
    {
        let sides = self.read();
        if sides.is_empty() && header.as_ref().is_none_or(|(layout, _)| layout.is_empty()) {
            return Ok(None);
        }
        let side = |side| match Self::keyed(place, side) {
            Some((keyed, side)) if keyed == place => self.kept_side(&sides, keyed, side, header.as_ref())?.map(|kept| self.expanded(&kept, arena)).transpose(),
            Some((keyed, side)) => self.kept_side(&sides, keyed, side, self.header(keyed, arena)?.as_ref())?.map(|kept| self.expanded(&kept, arena)).transpose(),
            None => Ok(None),
        };
        let trivia = crate::trivia::NodeTrivia { leading: side(TriviaSide::Leading)?, trailing: side(TriviaSide::Trailing)?, inner: side(TriviaSide::Inner)? };
        Ok((trivia.leading.is_some() || trivia.trailing.is_some() || trivia.inner.is_some()).then_some(trivia))
    }

    /// Each side a write gave a node of the read whose records lie in
    /// `spans` (`read_spans`), by the node's name, as this store keys it
    /// (`keyed`); not a side its parse placed and no write replaced.
    #[cfg(feature = "arena")]
    #[must_use]
    pub fn written(&self, spans: &[std::ops::Range<crate::arena::Address>]) -> Vec<(crate::types::NodeId, TriviaSide)> {
        let sides = self.read();
        spans
            .iter()
            .flat_map(|span| sides.marked_range((Place::record(span.start), TriviaSide::Leading)..(Place::record(span.end), TriviaSide::Leading)))
            .filter_map(|&(place, side)| match place {
                Place::Node(name) => Some((name, side)),
                Place::RootLeaf => None,
            })
            .collect()
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
        let sides = self.read();
        let mut units: Vec<(u32, crate::types::ItemIndex, crate::trivia::NodeTrivia<T>)> = Vec::new();
        if sides.is_empty() {
            return Ok(units);
        }
        for (site, side, kept) in self.unit_sides(&sides, holder, arena)? {
            let (word, item) = (site.word, crate::types::ItemIndex(site.item));
            if units.last().is_none_or(|unit| (unit.0, unit.1) != (word, item)) {
                units.push((word, item, crate::trivia::NodeTrivia::default()));
            }
            let Some(unit) = units.last_mut() else { continue };
            let held = match side {
                TriviaSide::Leading => &mut unit.2.leading,
                TriviaSide::Trailing => &mut unit.2.trailing,
                TriviaSide::Inner => return Err(ArenaError::Malformed { what: "an inner side kept for a unit", word }),
            };
            *held = Some(self.expanded(kept, arena)?);
        }
        units.sort_unstable_by_key(|&(word, item, _)| (word, item));
        Ok(units)
    }

    /// Each side `sides` keeps for a unit `holder`'s record holds, by the
    /// unit's site, in key order, read under `arena`: the sites of
    /// `holder`'s keys, its inside site aside, whose child is a unit
    /// (`site::holds_unit`).
    ///
    /// # Errors
    ///
    /// What reading the holder's cells refuses.
    #[cfg(feature = "arena")]
    fn unit_sides<'r>(&self, sides: &'r SideRows<Place, CompactEntry>, holder: crate::arena::Address, arena: &dyn ArenaRead) -> Result<Vec<UnitSide<'r>>, ArenaError> {
        let mut units = Vec::new();
        for ((place, side), kept) in sides.range(Place::holding(holder)) {
            let Place::Node(name) = *place else { continue };
            let Some([word, item]) = name.site() else { continue };
            if name.inside_of().is_some() {
                continue;
            }
            let site = crate::arena::site::CellSite { word, item };
            if crate::arena::site::holds_unit(arena, holder, self.shape, self.kind_bits, site)? {
                units.push((site, *side, kept.as_slice()));
            }
        }
        Ok(units)
    }

    /// The units `holder`'s record holds have the sides `units` gives, each by
    /// its slot word and its item there, in place of every unit side the
    /// holder had. The built records the new sides name are held, and what
    /// the old sides held released.
    ///
    /// # Errors
    ///
    /// What keeping a side or holding or releasing a record refuses, before
    /// any side is written when a new side is refused.
    #[cfg(feature = "arena")]
    pub fn write_units(&self, holder: crate::arena::Address, units: &[(u32, crate::types::ItemIndex, crate::trivia::NodeTrivia<T>)]) -> Result<(), ArenaError>
    where
        T: HeapBytes + crate::arena::WriteCell<T>,
    {
        let mut kept = Vec::new();
        for (word, item, trivia) in units {
            if trivia.inner.as_ref().is_some_and(|inner| !inner.is_empty()) {
                return Err(ArenaError::Unwritable(NO_INSIDE));
            }
            let place = Place::site(Site { holder, word: *word, item: *item });
            for (side, entries) in [(TriviaSide::Leading, &trivia.leading), (TriviaSide::Trailing, &trivia.trailing)] {
                if let Some(entries) = entries {
                    kept.push((place, side, self.compact(entries)?));
                }
            }
        }
        for (_, _, trivia) in units {
            for entries in [&trivia.leading, &trivia.trailing].into_iter().flatten() {
                self.adopt(entries)?;
            }
        }
        let released = {
            let built = self.built();
            let mut sides = self.write();
            let held: Vec<_> = self.unit_sides(&sides, holder, &*built)?.into_iter().map(|(site, side, _)| (Place::site(Site { holder, word: site.word, item: crate::types::ItemIndex(site.item) }), side)).collect();
            let released: Vec<CompactEntry> = held.into_iter().filter_map(|key| sides.remove(&key)).flatten().collect();
            for (place, side, entries) in kept {
                sides.insert(place, side, entries);
            }
            released
        };
        self.release_kept(&released)
    }

    /// The sides of every unit and leaf site of `from`'s record, written at
    /// the same site of `to`'s, except a site at a word `skip` names: what a
    /// copy of a record keeps of its children's sides, its own inside not
    /// among them. Each record and leaf
    /// entry a copied side names is held once more.
    ///
    /// # Errors
    ///
    /// What holding an entry refuses, before any side is copied.
    #[cfg(feature = "arena")]
    pub fn copy_sites(&self, from: crate::arena::Address, to: crate::arena::Address, skip: &[u32]) -> Result<(), ArenaError> {
        let copied: Vec<(Place, TriviaSide, Vec<CompactEntry>)> = self
            .read()
            .range(Place::holding(from))
            .filter_map(|(&(place, side), entries)| match place {
                Place::Node(name) => match name.site() {
                    Some([word, item]) if !skip.contains(&word) && name.inside_of().is_none() => Some((Place::Node(crate::types::NodeId::leaf(to.0, word, item)), side, entries.clone())),
                    _ => None,
                },
                Place::RootLeaf => None,
            })
            .collect();
        for (_, _, kept) in &copied {
            self.hold_kept(kept)?;
        }
        let mut sides = self.write();
        for (place, side, kept) in copied {
            sides.insert(place, side, kept);
        }
        Ok(())
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

    /// `side` of the built node at `place` holds `entries`, in place of what
    /// it held, each kept as this store keeps it (`compact`). The write
    /// takes no count of a record its entries name: the sides a render roots
    /// at, and those a record sink keeps, hold none (`write_held_side`). A
    /// parsed row's sides are its tree's (`ParsedTree::write_trivia_side`).
    ///
    /// # Errors
    ///
    /// What keeping an entry refuses, before the side is written.
    #[cfg(feature = "arena")]
    pub fn write_side(&self, place: Place, side: TriviaSide, entries: &[TriviaEntry<T>]) -> Result<(), ArenaError>
    where
        T: HeapBytes + crate::arena::WriteCell<T>,
    {
        let kept = self.compact(entries)?;
        self.write_kept_in(&mut self.built_mut(), place, side, kept)?;
        Ok(())
    }

    /// `side` of the node at `place`, which has no header of its own to
    /// keep layout codes in, holds `kept`, entries already kept as this
    /// store keeps them, as `write_side` writes them.
    #[cfg(feature = "arena")]
    pub fn write_kept(&self, place: Place, side: TriviaSide, kept: Vec<CompactEntry>) {
        debug_assert!(place.as_record().is_none(), "a record's sides go through its header");
        self.write().insert(place, side, kept);
    }

    /// `side` of the read's node kept at `site` holds `kept`, the side its
    /// parse placed its source's extras on, by the node's name
    /// (`site::site_name`, `known` holding each holder's cells once read),
    /// kept as a write keeps a side (`write_kept_in`) but not marked as one
    /// (`written`), holding a count of each record it names beside its
    /// holder's run's. `chunks` are the built arena's, which hold the read's
    /// records.
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for a row no cell of its holder names and
    /// for a non-empty inner side of a node with no inner site, and what
    /// reading the node's records or writing a record's header refuses.
    #[cfg(feature = "arena")]
    pub fn write_placed(&self, chunks: &mut crate::arena::BuiltChunks, site: crate::arena::NodeSite, side: TriviaSide, kept: Vec<CompactEntry>, known: &mut crate::arena::site::RowSites) -> Result<(), ArenaError> {
        let name = crate::arena::site::site_name(&*chunks, self.shape, self.kind_bits, site, known)?.ok_or(ArenaError::Unwritable("a placed side on a row no cell of its holder names"))?;
        let Some((place, side)) = Self::keyed(Place::Node(name), side) else {
            return if kept.is_empty() { Ok(()) } else { Err(ArenaError::Unwritable(NO_INSIDE)) };
        };
        Self::hold_kept_in(chunks, &kept)?;
        self.keep_keyed(chunks, place, side, kept).map(drop)
    }

    /// `side` of the built node at `place` holds `kept`, as `write_kept`:
    /// for a record, whose words `chunks` hold, the gap members at the
    /// side's head that its header keeps for the side as its codes
    /// (`header_split`), and the rest as its row. A side of a read's node
    /// is marked as one a write gave (`written`). Answers what the row held.
    ///
    /// # Errors
    ///
    /// What reading or writing a record's header refuses.
    #[cfg(feature = "arena")]
    pub fn write_kept_in(&self, chunks: &mut crate::arena::BuiltChunks, place: Place, side: TriviaSide, kept: Vec<CompactEntry>) -> Result<Option<Vec<CompactEntry>>, ArenaError> {
        let Some((place, side)) = Self::keyed(place, side) else {
            return if kept.is_empty() { Ok(None) } else { Err(ArenaError::Unwritable(NO_INSIDE)) };
        };
        let replaced = self.keep_keyed(chunks, place, side, kept)?;
        if matches!(place, Place::Node(name) if chunks.read_record(Address(name.address()))) {
            self.write().mark(place, side);
        }
        Ok(replaced)
    }

    /// The side `keyed` keeps `side` of `place` at holds `kept`
    /// (`header_split`), answering what its row held.
    #[cfg(feature = "arena")]
    fn keep_keyed(&self, chunks: &mut crate::arena::BuiltChunks, place: Place, side: TriviaSide, kept: Vec<CompactEntry>) -> Result<Option<Vec<CompactEntry>>, ArenaError> {
        let row = self.header_split(chunks, place, side, kept)?;
        let mut sides = self.write();
        Ok(match row {
            Some(row) => sides.insert(place, side, row),
            None => sides.remove(&(place, side)),
        })
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

    /// The header of the record `place` names, read under `arena`, with the
    /// word it was decoded from: what `kept_side` reads a side's gap members
    /// from. `None` for a place with no record, a store that keeps no gap
    /// members, or a record `arena` does not hold.
    #[cfg(feature = "arena")]
    fn header(&self, place: Place, arena: &dyn ArenaRead) -> Result<Option<(crate::arena::cell::HeaderLayout, u32)>, ArenaError> {
        let (Some(at), Some(_)) = (place.as_record(), self.whitespace) else { return Ok(None) };
        let Ok(word) = arena.word(at) else { return Ok(None) };
        self.header_of(place, word)
    }

    /// The header `word` of the record `place` names, decoded as `header`
    /// decodes it.
    #[cfg(feature = "arena")]
    fn header_of(&self, place: Place, word: u32) -> Result<Option<(crate::arena::cell::HeaderLayout, u32)>, ArenaError> {
        let (Some(_), Some(_)) = (place.as_record(), self.whitespace) else { return Ok(None) };
        Ok(Some((crate::arena::cell::HeaderLayout::of(word, self.kind_bits)?, word)))
    }

    /// The entries `side` of the node at `place` holds as this store keeps
    /// them, `sides` its rows and `header` its record's (`header`): for a
    /// record, built or a read's, the gap members its header keeps for the
    /// side (`header_split`), then its row; `None` when it holds neither.
    #[cfg(feature = "arena")]
    fn kept_side<'r>(&self, sides: &'r SideRows<Place, CompactEntry>, place: Place, side: TriviaSide, header: Option<&(crate::arena::cell::HeaderLayout, u32)>) -> Result<Option<std::borrow::Cow<'r, [CompactEntry]>>, ArenaError> {
        let row = sides.get(place, side);
        let (Some((layout, word)), Some(table)) = (header, self.whitespace) else { return Ok(row.map(std::borrow::Cow::Borrowed)) };
        let codes = layout.side(side);
        if codes.first().is_none_or(|gap| gap.is_empty()) {
            return Ok(row.map(std::borrow::Cow::Borrowed));
        }
        let gaps = codes
            .iter()
            .take_while(|gap| !gap.is_empty())
            .map(|&gap| table.gap_kind(gap).map(|kind| CompactEntry::Layout { kind }).ok_or(ArenaError::Malformed { what: "header layout code naming no gap kind of the grammar", word: *word }));
        Ok(Some(std::borrow::Cow::Owned(gaps.chain(row.unwrap_or_default().iter().copied().map(Ok)).collect::<Result<_, _>>()?)))
    }

    /// `side` of the node at `place` holds `entries`, as `write_side`, and
    /// holds each built record among them: it moves the count the record's
    /// builder's handle holds, else takes one more. What the side held
    /// before is released.
    ///
    /// # Errors
    ///
    /// What keeping an entry or holding or releasing a record refuses,
    /// before the side is written when a new entry is refused.
    #[cfg(feature = "arena")]
    pub fn write_held_side(&self, place: Place, side: TriviaSide, entries: &[TriviaEntry<T>]) -> Result<(), ArenaError>
    where
        T: HeapBytes + crate::arena::WriteCell<T>,
    {
        #[cfg(debug_assertions)]
        if let Place::Node(name) = place {
            let (holder, built) = (crate::arena::Address(name.address()), self.built());
            for record in held_records(entries) {
                if built.reaches(record, holder)? {
                    return Err(ArenaError::Malformed { what: "side record reaching its holder", word: record.0 });
                }
            }
        }
        let kept = self.compact(entries)?;
        self.adopt(entries)?;
        let old = self.write_kept_in(&mut self.built_mut(), place, side, kept)?;
        self.release_kept(old.as_deref().unwrap_or_default())
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

    /// Takes one more count of each record and leaf entry `kept` names.
    #[cfg(feature = "arena")]
    fn hold_kept(&self, kept: &[CompactEntry]) -> Result<(), ArenaError> {
        if kept.iter().all(|entry| entry.at().is_none()) {
            return Ok(());
        }
        Self::hold_kept_in(&mut self.built_mut(), kept)
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

    /// Releases a count of `held` (`BuiltChunks::release`), dropping the
    /// sides of each record it releases, and with them the counts those
    /// sides held.
    ///
    /// # Errors
    ///
    /// What `BuiltChunks::release` refuses.
    #[cfg(feature = "arena")]
    pub fn release(&self, held: crate::arena::count::Held, owned: bool) -> Result<(), ArenaError> {
        if self.read().is_empty() {
            return self.built_mut().release(held, owned, &mut |_| Vec::new());
        }
        self.built_mut().release(held, owned, &mut |at| self.drop_record(at))
    }

    /// Releases each entry of `batch` (`BuiltChunks::release_batch`) under
    /// one lock of the built arena, dropping the sides of each record it
    /// releases as `release` does.
    ///
    /// # Errors
    ///
    /// What `BuiltChunks::release_batch` refuses.
    #[cfg(feature = "arena")]
    pub fn release_batch(&self, batch: impl IntoIterator<Item = (crate::arena::count::Held, bool)>) -> Result<(), ArenaError> {
        if self.read().is_empty() {
            return self.built_mut().release_batch(batch, &mut |_| Vec::new());
        }
        self.built_mut().release_batch(batch, &mut |at| self.drop_record(at))
    }

    /// Drops the sides of the built record at `at` and of the units and
    /// leaves it holds, answering the records and leaf entries they named.
    #[cfg(feature = "arena")]
    fn drop_record(&self, at: crate::arena::Address) -> Vec<crate::arena::Address> {
        self.write().remove_range(Place::holding(at)).into_iter().flatten().filter_map(CompactEntry::at).collect()
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
        let store = Self {
            sides: Arc::default(),
            edit_walks: Arc::default(),
            built: Arc::clone(&self.built),
            kind_bits: self.kind_bits,
            shape: self.shape,
            whitespace: self.whitespace,
            #[cfg(feature = "napi-bindings")]
            buffers: Arc::clone(&self.buffers),
            trivia: std::marker::PhantomData,
        };
        let mut made = Vec::new();
        if let Some(sides) = sides {
            for (side, entries) in [(TriviaSide::Leading, sides.leading), (TriviaSide::Trailing, sides.trailing), (TriviaSide::Inner, sides.inner)] {
                if let Some(entries) = entries {
                    let kept = store.compact(&entries)?;
                    made.extend(entries.iter().zip(&kept).filter(|(entry, _)| matches!(entry, TriviaEntry::Value(_))).map(|(_, &kept)| kept));
                    store.write_kept(Place::RootLeaf, side, kept);
                }
            }
        }
        Ok(RootLeaf { store, made })
    }

    /// Adds `walked` to the rows the edit checks have walked
    /// (`ParsedTree::edited_within`).
    pub fn walked(&self, walked: u64) {
        self.edit_walks.fetch_add(walked, Ordering::Relaxed);
    }

    /// The rows the edit checks (`ParsedTree::edited_within`) have walked so
    /// far, every tree's: a diagnostic a test compares.
    #[must_use]
    pub fn edit_walks(&self) -> u64 {
        self.edit_walks.load(Ordering::Relaxed)
    }

    /// The range removals the store's side rows have made so far
    /// (`SideRows::removals`): a diagnostic a test compares.
    #[cfg(feature = "arena")]
    #[must_use]
    pub fn side_removals(&self) -> u64 {
        self.read().removals()
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

    /// The written sides the store holds, every place's: none without
    /// the arena, which has no built place.
    #[cfg(test)]
    #[cfg_attr(not(feature = "arena"), allow(clippy::unused_self, reason = "only the arena build has a built place"))]
    pub(crate) fn len(&self) -> usize {
        #[cfg(feature = "arena")]
        {
            self.read().len()
        }
        #[cfg(not(feature = "arena"))]
        0
    }

    /// How many handles of the store are held.
    #[cfg(all(test, feature = "arena"))]
    pub(crate) fn handles(&self) -> usize {
        Arc::strong_count(&self.sides)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(feature = "arena")]
    use crate::arena::Address;
    use crate::slot::SlotValue;
    use crate::trivia::TriviaText;
    use crate::types::KindId;

    /// The entries `side` of `place` holds, read under the store's own
    /// built arena.
    #[cfg(feature = "arena")]
    fn read_side<T: Clone + crate::trivia::FromTriviaText>(store: &TriviaStore<T>, place: Place, side: TriviaSide) -> Option<Vec<TriviaEntry<T>>> {
        store.side(place, side, &*store.built()).expect("read")
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

    #[test]
    fn a_range_holds_a_write_below_its_node_or_on_the_node_s_inner_and_walks_written_rows_alone() {
        let mut rows = SideRows::<NodeIndex, TriviaEntry<TriviaText>>::default();
        rows.insert(NodeIndex::new(4), TriviaSide::Leading, Vec::new());
        let end = NodeIndex::new(9);
        assert_eq!(rows.edited_within(NodeIndex::new(3), end, false), (true, 1), "a descendant's side");
        assert_eq!(rows.edited_within(NodeIndex::new(4), end, false), (false, 1), "a node's own leading is not within it");
        assert!(rows.edited_within(NodeIndex::new(4), end, true).0);
        assert_eq!(rows.edited_within(NodeIndex::new(5), end, true), (false, 0), "past the write");
        rows.insert(NodeIndex::new(6), TriviaSide::Inner, Vec::new());
        assert!(rows.edited_within(NodeIndex::new(6), end, false).0, "a node's own inner is within it");
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
    fn a_built_place_keeps_its_sides_beside_the_trees() {
        use crate::arena::Address;
        let store = TriviaStore::<TriviaText>::new();
        let record = Place::record(Address(5));
        let unit = Place::site(Site { holder: Address(5), word: 2, item: crate::types::ItemIndex(0) });
        let other = store.clone();
        store.write_side(record, TriviaSide::Leading, &[entry("// a")]).expect("kept");
        other.write_side(record, TriviaSide::Leading, &[entry("// r")]).expect("kept");
        store.write_side(unit, TriviaSide::Trailing, &[entry("// u")]).expect("kept");
        assert_eq!(read_side(&store, record, TriviaSide::Leading), Some(vec![entry("// r")]), "every handle writes the one store");
        assert_eq!(read_side(&store, unit, TriviaSide::Trailing), Some(vec![entry("// u")]));
        assert_eq!(store.len(), 2);
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_copy_keeps_the_unit_and_leaf_sides_of_its_kept_sites_and_nothing_else() {
        let site = |holder: u32, word: u32, item: u32| Site { holder: Address(holder), word, item: crate::types::ItemIndex(item) };
        let store = TriviaStore::<TriviaText>::new();
        store.write_side(Place::record(Address(5)), TriviaSide::Leading, &[entry("// own")]).expect("kept");
        store.write_side(Place::site(site(5, 2, 0)), TriviaSide::Trailing, &[entry("// unit")]).expect("kept");
        store.write_side(Place::site(site(5, 2, 1)), TriviaSide::Leading, &[entry("// leaf")]).expect("kept");
        store.write_side(Place::site(site(5, 7, 0)), TriviaSide::Leading, &[entry("// patched")]).expect("kept");
        store.write_side(Place::site(site(6, 2, 0)), TriviaSide::Leading, &[entry("// other holder")]).expect("kept");
        store.copy_sites(Address(5), Address(9), &[7]).expect("a copy");
        assert_eq!(read_side(&store, Place::site(site(9, 2, 0)), TriviaSide::Trailing), Some(vec![entry("// unit")]));
        assert_eq!(read_side(&store, Place::site(site(9, 2, 1)), TriviaSide::Leading), Some(vec![entry("// leaf")]));
        assert_eq!(read_side(&store, Place::site(site(9, 7, 0)), TriviaSide::Leading), None, "a skipped word keeps none");
        assert_eq!(read_side(&store, Place::record(Address(9)), TriviaSide::Leading), None, "a record's own sides are not its sites'");
        assert_eq!(read_side(&store, Place::site(site(9, 2, 0)), TriviaSide::Leading), None, "another holder's sites stay its own");
        assert_eq!(read_side(&store, Place::site(site(5, 2, 1)), TriviaSide::Leading), Some(vec![entry("// leaf")]), "the source keeps its sides");
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
        store.write_side(record, TriviaSide::Leading, &[]).expect("kept");
        assert_eq!(store.sides(record, &*store.built()).expect("read"), Some(NodeTrivia { leading: Some(Vec::new()), trailing: None, inner: None }));
        let site = |holder, word| Place::site(Site { holder, word, item: ItemIndex(0) });
        store.write_side(site(one, 2), TriviaSide::Trailing, &[entry("// b")]).expect("kept");
        store.write_side(site(one, 2), TriviaSide::Leading, &[entry("// a")]).expect("kept");
        store.write_side(site(one, 7), TriviaSide::Leading, &[entry("// leaf")]).expect("kept");
        store.write_side(site(other, 2), TriviaSide::Leading, &[entry("// other")]).expect("kept");
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
        store.write_side(site(3, 0), TriviaSide::Leading, &[entry("// single")]).expect("kept");
        store.write_side(site(2, 1), TriviaSide::Leading, &[entry("// second item")]).expect("kept");
        let order: Vec<_> = store.units(at, &*store.built()).expect("read").into_iter().map(|(word, item, _)| (word, item)).collect();
        assert_eq!(order, [(2, ItemIndex(1)), (3, ItemIndex(0))]);
    }

    #[cfg(feature = "arena")]
    #[test]
    fn writing_a_holder_s_units_replaces_all_of_them_and_no_other_holder_s() {
        use crate::trivia::NodeTrivia;
        use crate::types::ItemIndex;
        let store = TriviaStore::<TriviaText>::for_records(crate::record::PARSED_KIND_BITS, holder_shape);
        let (one, other) = (holder(&store), holder(&store));
        let site = |holder, word| Place::site(Site { holder, word, item: ItemIndex(0) });
        store.write_side(site(one, 2), TriviaSide::Leading, &[entry("// gone")]).expect("kept");
        store.write_side(site(other, 2), TriviaSide::Leading, &[entry("// other")]).expect("kept");
        store.write_side(Place::record(one), TriviaSide::Leading, &[entry("// own")]).expect("kept");
        store.write_side(site(one, 7), TriviaSide::Trailing, &[entry("// leaf")]).expect("kept");
        let kept = NodeTrivia { leading: None, trailing: Some(vec![entry("// b")]), inner: None };
        store.write_units(one, &[(2, ItemIndex(0), kept.clone())]).expect("a write");
        assert_eq!(store.units(one, &*store.built()).expect("read"), [(2, ItemIndex(0), kept)]);
        assert_eq!(store.units(other, &*store.built()).expect("read"), [(2, ItemIndex(0), NodeTrivia { leading: Some(vec![entry("// other")]), trailing: None, inner: None })]);
        assert_eq!(read_side(&store, Place::record(one), TriviaSide::Leading), Some(vec![entry("// own")]), "the holder's own sides are not its units'");
        assert_eq!(read_side(&store, site(one, 7), TriviaSide::Trailing), Some(vec![entry("// leaf")]), "a site whose cell holds no unit keeps its sides");
        store.write_units(one, &[]).expect("a write");
        assert_eq!(store.units(one, &*store.built()).expect("read"), []);
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
        let (one, two) = (TriviaStore::<TriviaText>::new(), TriviaStore::<TriviaText>::new());
        let handle = one.clone();
        assert!(one == handle && one != two, "a handle equals another only when they share one store");
        one.write_side(Place::record(Address(4)), TriviaSide::Leading, &[record(5, Some(one.clone())), entry("// x"), record(7, None)]).expect("kept");
        let read = read_side(&one, Place::record(Address(4)), TriviaSide::Leading).expect("written");
        assert_eq!(store_of(&read[1]), None, "an entry that names no record holds no store");
        assert_eq!((store_of(&read[0]), store_of(&read[2])), (Some(&one), Some(&one)), "a record is answered by the store that holds it");
        one.write_side(Place::record(Address(5)), TriviaSide::Trailing, &[record(6, None)]).expect("kept");
        let trailing = one.sides(Place::record(Address(5)), &*one.built()).expect("read").and_then(|sides| sides.trailing).expect("written");
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

    /// The string chunk the first text entry of `side` at `place` lies in.
    #[cfg(feature = "arena")]
    fn text_chunk<T: Clone>(store: &TriviaStore<T>, place: Place, side: TriviaSide) -> u32 {
        let sides = store.read();
        let kept = sides.get(place, side).expect("written");
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
    /// writes it, and a read's record, its header carrying a set-apart
    /// trailing code as a parse writes it.
    #[cfg(feature = "arena")]
    fn records(store: &TriviaStore<Probe>) -> (Address, Address) {
        let mut chunks = store.built_mut();
        let header = crate::arena::BuiltWriter::new(&mut chunks).header(KindId(2), 0).expect("a header");
        let built = crate::arena::BuiltWriter::new(&mut chunks).record(&[header, 0], true).expect("a built record");
        let layout = crate::arena::cell::HeaderLayout { trailing: crate::layout_kinds::LayoutKinds::BLANKLINE, ..crate::arena::cell::HeaderLayout::default() };
        let stamped = layout.onto(header, store.kind_bits).expect("a header");
        let read = crate::arena::RecordSpace::push(&mut crate::arena::ReadWriter::new(&mut chunks), &[stamped, 0]).expect("a read's record");
        (built, read)
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_unit_keeps_no_inner_side() {
        use crate::arena::Address;
        use crate::trivia::NodeTrivia;
        use crate::types::ItemIndex;
        let store = TriviaStore::<TriviaText>::for_records(crate::record::PARSED_KIND_BITS, holder_shape);
        let unit = Place::site(Site { holder: Address(5), word: 2, item: ItemIndex(0) });
        let refused = |result: Result<(), ArenaError>| matches!(result, Err(ArenaError::Unwritable("an inner side on a node with no record, which has no inside")));
        assert!(refused(store.write_side(unit, TriviaSide::Inner, &[entry("// in")])), "an entry inside a unit is refused");
        store.write_side(unit, TriviaSide::Inner, &[]).expect("a write of nothing");
        assert_eq!(read_side(&store, unit, TriviaSide::Inner), None, "and keeps nothing");
        let inside = NodeTrivia { leading: Some(vec![entry("// a")]), trailing: None, inner: Some(vec![entry("// in")]) };
        assert!(refused(store.write_units(Address(5), &[(2, ItemIndex(0), inside)])), "a unit written with an entry inside is refused, as the same side written alone is");
        assert_eq!(store.units(Address(5), &*store.built()).expect("read"), [], "before any side of it is written");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_record_s_inside_is_kept_as_the_leading_side_of_its_inside_site_in_every_kind() {
        let store = TriviaStore::<Probe>::new();
        let (built, read) = records(&store);
        for at in [built, read] {
            let record = Place::record(at);
            let inside = Place::Node(crate::types::NodeId::leaf(at.0, crate::types::NodeId::INSIDE_WORD, 0));
            store.write_held_side(record, TriviaSide::Inner, &[text("// in")]).expect("kept");
            assert_eq!(store.read().get(record, TriviaSide::Inner), None, "no record keeps an inner side");
            assert!(store.read().get(inside, TriviaSide::Leading).is_some(), "the record's inside site keeps it, on its leading side");
            assert_eq!((read_side(&store, record, TriviaSide::Inner), read_side(&store, inside, TriviaSide::Leading)), (Some(vec![text("// in")]), Some(vec![text("// in")])));
            assert_eq!(store.sides(record, &*store.built()).expect("read").and_then(|sides| sides.inner), Some(vec![text("// in")]));
            assert_eq!(store.units(at, &*store.built()).expect("read"), [], "a record's inside is no unit's side");
            store.write_held_side(record, TriviaSide::Inner, &[]).expect("a write of nothing");
            assert_eq!(read_side(&store, record, TriviaSide::Inner), Some(Vec::new()), "a write of nothing replaces it");
        }
        store.write_held_side(Place::record(built), TriviaSide::Inner, &[text("// in")]).expect("kept");
        let copy = {
            let mut chunks = store.built_mut();
            let header = crate::arena::BuiltWriter::new(&mut chunks).header(KindId(2), 0).expect("a header");
            crate::arena::BuiltWriter::new(&mut chunks).record(&[header, 0], true).expect("a built record")
        };
        store.copy_sites(built, copy, &[]).expect("a copy");
        assert_eq!(read_side(&store, Place::record(copy), TriviaSide::Inner), None, "a copy of a record keeps its children's sites, not its inside");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_built_record_s_header_keeps_the_gap_members_at_the_head_of_its_sides() {
        let store = TriviaStore::<Probe>::new().with_whitespace(&PROBE_WHITESPACE);
        let (built, read) = records(&store);
        let place = Place::record(built);
        let row = |side| store.read().get(place, side).map(<[CompactEntry]>::to_vec);
        let leading = [member(), member(), member(), member(), text("// x")];
        store.write_held_side(place, TriviaSide::Leading, &leading).expect("kept");
        store.write_side(place, TriviaSide::Trailing, &[member()]).expect("kept");
        assert!(matches!(row(TriviaSide::Leading).as_deref(), Some([CompactEntry::Layout { kind: NEWLINE }, CompactEntry::Text { .. }])), "three members in the header, the rest in the row: {:?}", row(TriviaSide::Leading));
        assert_eq!(row(TriviaSide::Trailing), None, "a side the header holds whole keeps no row");
        assert_eq!(read_side(&store, place, TriviaSide::Leading), Some(leading.to_vec()));
        assert_eq!(read_side(&store, place, TriviaSide::Trailing), Some(vec![member()]));
        store.write_held_side(place, TriviaSide::Trailing, &[]).expect("kept");
        assert_eq!(read_side(&store, place, TriviaSide::Trailing), Some(Vec::new()), "a side replaced with nothing is written, and its codes cleared");
        store.write_held_side(place, TriviaSide::Leading, &[text("// y")]).expect("kept");
        assert_eq!(read_side(&store, place, TriviaSide::Leading), Some(vec![text("// y")]), "a write replaces the side's codes with its row");
        let header = |at| crate::arena::ArenaRead::word(&*store.built(), at).expect("a header");
        let stamp = header(read);
        store.write_held_side(Place::record(read), TriviaSide::Trailing, &[member()]).expect("kept");
        assert_eq!(store.read().get(Place::record(read), TriviaSide::Trailing), None, "a read's record keeps a side of members alone in its header, as a built record does");
        assert_ne!(header(read), stamp, "the write replaced the codes its parse stamped");
        assert_eq!(read_side(&store, Place::record(read), TriviaSide::Trailing), Some(vec![member()]));
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
        let place = Place::record(Address(5));
        let record = BuiltEntry { kind: KindId(2), at: Address(7) };
        store.write_side(place, TriviaSide::Leading, &[TriviaEntry::Record(RecordEntry { record, store: None, as_source: None }), member(), text("// x")]).expect("kept");
        let kept = store.read().get(place, TriviaSide::Leading).map(<[CompactEntry]>::to_vec).expect("written");
        assert!(
            matches!(kept[..], [CompactEntry::Record { kind: KindId(2), at: Address(7) }, CompactEntry::Layout { kind: NEWLINE }, CompactEntry::Text { kind: KindId(1), .. }]),
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
        let place = Place::record(Address(5));
        store.write_held_side(place, TriviaSide::Leading, &[text("// a")]).expect("kept");
        let coordinate = crate::slot::NodeCoordinate::new(TreeId(1), NodeIndex::new(2), NodeIndex::new(3), Span { start: 0, end: 4 });
        let refused = store.write_held_side(place, TriviaSide::Leading, &[member(), TriviaEntry::new(SlotValue::Coord(coordinate))]);
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
        let place = Place::record(Address(5));
        store.write_held_side(place, TriviaSide::Leading, &[TriviaEntry::new(SlotValue::Coord(coordinate))]).expect("kept");
        assert_eq!(read_side(&store, place, TriviaSide::Leading), Some(vec![TriviaEntry::Record(RecordEntry { record: BuiltEntry { kind: KindId(2), at: read }, store: Some(store.clone()), as_source: None })]));
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_text_entry_holds_its_string_chunk_until_its_side_is_replaced() {
        let store = TriviaStore::<Probe>::new();
        let place = Place::record(Address(5));
        store.write_held_side(place, TriviaSide::Leading, &[text("// a"), text("// b")]).expect("kept");
        let chunk = text_chunk(&store, place, TriviaSide::Leading);
        assert_eq!(store.built().text_count(chunk), Some(2));
        store.write_held_side(place, TriviaSide::Leading, &[member()]).expect("kept");
        assert_eq!(store.built().text_count(chunk), Some(0), "the replaced side gives its counts back");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_copied_text_entry_holds_its_string_chunk_once_more() {
        use crate::types::ItemIndex;
        let store = TriviaStore::<Probe>::new();
        let unit = |holder| Place::site(Site { holder: Address(holder), word: 2, item: ItemIndex(0) });
        store.write_held_side(unit(5), TriviaSide::Leading, &[text("// a")]).expect("kept");
        let chunk = text_chunk(&store, unit(5), TriviaSide::Leading);
        store.copy_sites(Address(5), Address(9), &[]).expect("a copy");
        assert_eq!(store.built().text_count(chunk), Some(2));
        assert_eq!(read_side(&store, unit(9), TriviaSide::Leading), Some(vec![text("// a")]));
    }
}
