//! The sides of trivia writes set for every node an engine renders, keyed
//! by the node and the side. One table type holds them (`SideRows`): the
//! engine's store keeps one for its built places, its entries compact
//! (`CompactEntry`), and each parsed tree one for its own rows, written
//! through the tree alone (`ParsedTree::write_trivia_side`). A parsed node's
//! side reads as what a write set, else as what its tree's placement
//! assigned from its source (`ParsedTree::side_entries`, `Placement`).
//!
//! Written trivia is a layout overlay: setting or replacing a side never
//! edits a node or a record, and never removes what the placement assigned
//! the side, which the source's own view still reads. The store is outside
//! every record, so a record that shares a child never sees another
//! record's sides.

use crate::heap::HeapBytes;
use std::collections::BTreeMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
#[cfg(feature = "arena")]
use std::sync::{PoisonError, RwLock};

use crate::trivia::TriviaEntry;
use crate::trivia_table::TriviaSide;
use crate::types::{NodeIndex, TreeId};
#[cfg(feature = "arena")]
use crate::arena::{Address, ArenaError, ArenaRead};
#[cfg(feature = "arena")]
use crate::types::KindId;

/// Where a node's sides are kept.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Place {
    /// A parsed node, unit or leaf: its tree and its row there.
    Row { tree: TreeId, row: NodeIndex },
    /// A built record, by its address.
    #[cfg(feature = "arena")]
    Record(crate::arena::Address),
    /// A built unit, which has no record: its site in its holder's record.
    #[cfg(feature = "arena")]
    Unit(Site<crate::arena::Address>),
    /// A built leaf, which has no record: its site in its holder's record,
    /// keyed apart from the holder's units, which a write replaces together.
    #[cfg(feature = "arena")]
    Leaf(Site<crate::arena::Address>),
    /// A node of a read whose tree is gone: the source it was read from, as
    /// the tree its coordinates name, and where its records keep it.
    #[cfg(feature = "arena")]
    Read { tree: TreeId, site: crate::arena::NodeSite },
    /// A node of a read, as `Read` names it, for the side its parse placed
    /// its source's extras on.
    #[cfg(feature = "arena")]
    Placed { tree: TreeId, site: crate::arena::NodeSite },
}

#[cfg(feature = "arena")]
impl Place {
    /// The place of the lone built leaf a render roots at, which has no
    /// site: its sides are the ones the render is given.
    pub const ROOT_LEAF: Place = Place::Leaf(Site { holder: crate::arena::Address::NONE, word: 0, item: crate::types::ItemIndex(0) });
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
    bytes: usize,
}

impl<K, E> Default for SideRows<K, E> {
    fn default() -> Self {
        Self { rows: BTreeMap::new(), bytes: 0 }
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

    /// Every row, removed.
    pub fn take(&mut self) -> Vec<Vec<E>> {
        self.bytes = 0;
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
            entry @ (TriviaEntry::Value(_) | TriviaEntry::Tokens) => entry,
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
/// A built node's entries live as long as the engine's built arena, which
/// only appends, so no record's address is reused while its entries are
/// here. A parsed tree's written rows are its own
/// (`ParsedTree::write_trivia_side`); a read whose tree is gone left its
/// nodes in the built arena, and their written sides are here
/// (`Place::Read`).
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
            #[cfg(feature = "napi-bindings")]
            buffers: Arc::default(),
            trivia: std::marker::PhantomData,
        }
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
            TriviaEntry::Value(_) | TriviaEntry::Tokens => None,
        })
        .collect()
}

/// The store a render of a lone built leaf reads that leaf's sides from
/// (`Place::ROOT_LEAF`), over its engine's built arena, and the entries its
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
                entry @ (TriviaEntry::Value(_) | TriviaEntry::Tokens) => entry.clone(),
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
                    CompactEntry::Record { kind, at } => TriviaEntry::Record(RecordEntry { record: BuiltEntry { kind, at }, store: Some(self.clone()) }),
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
        self.read().get(place, side).map(|kept| self.expanded(kept, arena)).transpose()
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
        let sides = self.read();
        let side = |side| sides.get(place, side).map(|kept| self.expanded(kept, arena)).transpose();
        let trivia = crate::trivia::NodeTrivia { leading: side(TriviaSide::Leading)?, trailing: side(TriviaSide::Trailing)?, inner: side(TriviaSide::Inner)? };
        Ok((trivia.leading.is_some() || trivia.trailing.is_some() || trivia.inner.is_some()).then_some(trivia))
    }

    /// Each side a write gave a node read from the source `tree` names, by
    /// where the read's records keep the node.
    #[cfg(feature = "arena")]
    #[must_use]
    pub fn written(&self, tree: TreeId) -> Vec<(crate::arena::NodeSite, TriviaSide)> {
        let first = (Place::Read { tree, site: crate::arena::NodeSite::Record(crate::arena::Address(0)) }, TriviaSide::Leading);
        self.read()
            .range(first..)
            .map_while(|(&(place, side), _)| match place {
                Place::Read { tree: of, site } if of == tree => Some((site, side)),
                _ => None,
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
        let first = (Place::Unit(Site { holder, word: 0, item: crate::types::ItemIndex(0) }), TriviaSide::Leading);
        let mut units: Vec<(u32, crate::types::ItemIndex, crate::trivia::NodeTrivia<T>)> = Vec::new();
        for ((place, side), kept) in self.read().range(first..) {
            let Place::Unit(site) = *place else { break };
            if site.holder != holder {
                break;
            }
            if units.last().is_none_or(|unit| (unit.0, unit.1) != (site.word, site.item)) {
                units.push((site.word, site.item, crate::trivia::NodeTrivia::default()));
            }
            let Some(unit) = units.last_mut() else { continue };
            let held = match side {
                TriviaSide::Leading => &mut unit.2.leading,
                TriviaSide::Trailing => &mut unit.2.trailing,
                TriviaSide::Inner => &mut unit.2.inner,
            };
            *held = Some(self.expanded(kept, arena)?);
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
            let place = Place::Unit(Site { holder, word: *word, item: *item });
            for (side, entries) in [(TriviaSide::Leading, &trivia.leading), (TriviaSide::Trailing, &trivia.trailing), (TriviaSide::Inner, &trivia.inner)] {
                if let Some(entries) = entries {
                    kept.push((place, side, self.compact(entries)?));
                }
            }
        }
        for (_, _, trivia) in units {
            for entries in [&trivia.leading, &trivia.trailing, &trivia.inner].into_iter().flatten() {
                self.hold(entries)?;
            }
        }
        let released = {
            let mut sides = self.write();
            let first = (Place::Unit(Site { holder, word: 0, item: crate::types::ItemIndex(0) }), TriviaSide::Leading);
            let held: Vec<_> = sides.range(first..).take_while(|((place, _), _)| matches!(place, Place::Unit(site) if site.holder == holder)).map(|(&key, _)| key).collect();
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
    /// copy of a record keeps of its children's sides. Each record and leaf
    /// entry a copied side names is held once more.
    ///
    /// # Errors
    ///
    /// What holding an entry refuses, before any side is copied.
    #[cfg(feature = "arena")]
    pub fn copy_sites(&self, from: crate::arena::Address, to: crate::arena::Address, skip: &[u32]) -> Result<(), ArenaError> {
        let copied: Vec<(Place, TriviaSide, Vec<CompactEntry>)> = {
            let sides = self.read();
            let first = Site { holder: from, word: 0, item: crate::types::ItemIndex(0) };
            [Place::Unit(first), Place::Leaf(first)]
                .into_iter()
                .flat_map(|start| {
                    sides
                        .range((start, TriviaSide::Leading)..)
                        .map_while(move |(&(place, side), entries)| match (place, start) {
                            (Place::Unit(site), Place::Unit(_)) if site.holder == from => Some((Place::Unit(Site { holder: to, ..site }), site.word, side, entries)),
                            (Place::Leaf(site), Place::Leaf(_)) if site.holder == from => Some((Place::Leaf(Site { holder: to, ..site }), site.word, side, entries)),
                            _ => None,
                        })
                        .filter(|&(_, word, _, _)| !skip.contains(&word))
                        .map(|(place, _, side, entries)| (place, side, entries.clone()))
                        .collect::<Vec<_>>()
                })
                .collect()
        };
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
        self.write_kept(place, side, kept);
        Ok(())
    }

    /// `side` of the built node at `place` holds `kept`, entries already
    /// kept as this store keeps them, as `write_side` writes them.
    #[cfg(feature = "arena")]
    pub fn write_kept(&self, place: Place, side: TriviaSide, kept: Vec<CompactEntry>) {
        debug_assert!(!matches!(place, Place::Row { .. }), "a parsed row's sides are its tree's");
        self.write().insert(place, side, kept);
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
        if let Place::Record(holder) | Place::Unit(Site { holder, .. }) | Place::Leaf(Site { holder, .. }) = place {
            let built = self.built();
            for record in held_records(entries) {
                if built.reaches(record, holder)? {
                    return Err(ArenaError::Malformed { what: "side record reaching its holder", word: record.0 });
                }
            }
        }
        let kept = self.compact(entries)?;
        self.hold(entries)?;
        let old = self.write().insert(place, side, kept);
        self.release_kept(old.as_deref().unwrap_or_default())
    }

    /// Takes a count of each built record `entries` name, moving the count
    /// the record's builder's handle holds, else taking one more.
    ///
    /// # Errors
    ///
    /// What adopting a record refuses.
    #[cfg(feature = "arena")]
    pub fn hold(&self, entries: &[TriviaEntry<T>]) -> Result<(), ArenaError> {
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
        let mut built = self.built_mut();
        kept.iter().try_for_each(|&entry| match entry {
            CompactEntry::Record { at, .. } => built.adopt(at),
            CompactEntry::Text { at, .. } => built.hold_text(at),
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
        records.into_iter().try_for_each(|at| self.release(crate::arena::count::Held::Record(at), false))
    }

    /// Gives back the count each record and leaf entry `kept` names holds.
    #[cfg(feature = "arena")]
    fn release_kept(&self, kept: &[CompactEntry]) -> Result<(), ArenaError> {
        kept.iter().filter_map(|entry| entry.held()).try_for_each(|held| self.release(held, false))
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
        self.built_mut().release(held, owned, &mut |at| self.drop_record(at))
    }

    /// Drops the sides of the built record at `at` and of the units and
    /// leaves it holds, answering the records and leaf entries they named.
    #[cfg(feature = "arena")]
    fn drop_record(&self, at: crate::arena::Address) -> Vec<crate::arena::Address> {
        let mut sides = self.write();
        let first = Site { holder: at, word: 0, item: crate::types::ItemIndex(0) };
        let mut keys: Vec<_> = [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].into_iter().map(|side| (Place::Record(at), side)).filter(|&(place, side)| sides.contains(place, side)).collect();
        for start in [Place::Unit(first), Place::Leaf(first)] {
            keys.extend(sides.range((start, TriviaSide::Leading)..).map_while(|(&(place, side), _)| match (place, start) {
                (Place::Unit(site), Place::Unit(_)) | (Place::Leaf(site), Place::Leaf(_)) if site.holder == at => Some((place, side)),
                _ => None,
            }));
        }
        keys.into_iter().filter_map(|key| sides.remove(&key)).flatten().filter_map(CompactEntry::at).collect()
    }

    /// A store over this one's built arena that holds `sides` alone, as the
    /// sides of the lone leaf a render roots at (`Place::ROOT_LEAF`), which
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
                    store.write_kept(Place::ROOT_LEAF, side, kept);
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
        TriviaEntry::new(SlotValue::Node(TriviaText { kind: KindId(1), text: text.to_owned(), span: None, before: None, after: None, bytes: None }))
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
        let record = Place::Record(Address(5));
        let unit = Place::Unit(Site { holder: Address(5), word: 2, item: crate::types::ItemIndex(0) });
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
        store.write_side(Place::Record(Address(5)), TriviaSide::Leading, &[entry("// own")]).expect("kept");
        store.write_side(Place::Unit(site(5, 2, 0)), TriviaSide::Trailing, &[entry("// unit")]).expect("kept");
        store.write_side(Place::Leaf(site(5, 2, 1)), TriviaSide::Leading, &[entry("// leaf")]).expect("kept");
        store.write_side(Place::Leaf(site(5, 7, 0)), TriviaSide::Leading, &[entry("// patched")]).expect("kept");
        store.write_side(Place::Leaf(site(6, 2, 0)), TriviaSide::Leading, &[entry("// other holder")]).expect("kept");
        store.copy_sites(Address(5), Address(9), &[7]).expect("a copy");
        assert_eq!(read_side(&store, Place::Unit(site(9, 2, 0)), TriviaSide::Trailing), Some(vec![entry("// unit")]));
        assert_eq!(read_side(&store, Place::Leaf(site(9, 2, 1)), TriviaSide::Leading), Some(vec![entry("// leaf")]));
        assert_eq!(read_side(&store, Place::Leaf(site(9, 7, 0)), TriviaSide::Leading), None, "a skipped word keeps none");
        assert_eq!(read_side(&store, Place::Record(Address(9)), TriviaSide::Leading), None, "a record's own sides are not its sites'");
        assert_eq!(read_side(&store, Place::Leaf(site(9, 2, 0)), TriviaSide::Leading), None, "another holder's sites stay its own");
        assert_eq!(read_side(&store, Place::Leaf(site(5, 2, 1)), TriviaSide::Leading), Some(vec![entry("// leaf")]), "the source keeps its sides");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_node_s_written_sides_read_as_its_trivia_and_a_holder_s_units_as_theirs() {
        use crate::arena::Address;
        use crate::trivia::NodeTrivia;
        use crate::types::ItemIndex;
        let store = TriviaStore::<TriviaText>::new();
        let record = Place::Record(Address(5));
        assert_eq!(store.sides(record, &*store.built()).expect("read"), None, "no write gave it a side");
        store.write_side(record, TriviaSide::Inner, &[]).expect("kept");
        assert_eq!(store.sides(record, &*store.built()).expect("read"), Some(NodeTrivia { leading: None, trailing: None, inner: Some(Vec::new()) }));
        let unit = |holder, word, item| Place::Unit(Site { holder: Address(holder), word, item: ItemIndex(item) });
        store.write_side(unit(5, 7, 1), TriviaSide::Trailing, &[entry("// b")]).expect("kept");
        store.write_side(unit(5, 2, 0), TriviaSide::Leading, &[entry("// a")]).expect("kept");
        store.write_side(unit(5, 7, 1), TriviaSide::Leading, &[]).expect("kept");
        store.write_side(unit(6, 2, 0), TriviaSide::Leading, &[entry("// other")]).expect("kept");
        assert_eq!(
            store.units(Address(5), &*store.built()).expect("read"),
            [
                (2, ItemIndex(0), NodeTrivia { leading: Some(vec![entry("// a")]), trailing: None, inner: None }),
                (7, ItemIndex(1), NodeTrivia { leading: Some(Vec::new()), trailing: Some(vec![entry("// b")]), inner: None }),
            ]
        );
        assert_eq!(store.units(Address(4), &*store.built()).expect("read"), []);
    }

    #[cfg(feature = "arena")]
    #[test]
    fn writing_a_holder_s_units_replaces_all_of_them_and_no_other_holder_s() {
        use crate::arena::Address;
        use crate::trivia::NodeTrivia;
        use crate::types::ItemIndex;
        let store = TriviaStore::<TriviaText>::new();
        let unit = |holder, word, item| Place::Unit(Site { holder: Address(holder), word, item: ItemIndex(item) });
        store.write_side(unit(5, 2, 0), TriviaSide::Leading, &[entry("// gone")]).expect("kept");
        store.write_side(unit(5, 7, 1), TriviaSide::Inner, &[]).expect("kept");
        store.write_side(unit(6, 2, 0), TriviaSide::Leading, &[entry("// other")]).expect("kept");
        store.write_side(Place::Record(Address(5)), TriviaSide::Leading, &[entry("// own")]).expect("kept");
        let leaf = Place::Leaf(Site { holder: Address(5), word: 2, item: ItemIndex(0) });
        store.write_side(leaf, TriviaSide::Trailing, &[entry("// leaf")]).expect("kept");
        let kept = NodeTrivia { leading: None, trailing: Some(vec![entry("// b")]), inner: None };
        store.write_units(Address(5), &[(7, ItemIndex(0), kept.clone())]).expect("a write");
        assert_eq!(store.units(Address(5), &*store.built()).expect("read"), [(7, ItemIndex(0), kept)]);
        assert_eq!(store.units(Address(6), &*store.built()).expect("read"), [(2, ItemIndex(0), NodeTrivia { leading: Some(vec![entry("// other")]), trailing: None, inner: None })]);
        assert_eq!(read_side(&store, Place::Record(Address(5)), TriviaSide::Leading), Some(vec![entry("// own")]), "the holder's own sides are not its units'");
        assert_eq!(read_side(&store, leaf, TriviaSide::Trailing), Some(vec![entry("// leaf")]), "a leaf at a unit's site keeps its sides");
        store.write_units(Address(5), &[]).expect("a write");
        assert_eq!(store.units(Address(5), &*store.built()).expect("read"), []);
    }

    #[cfg(feature = "arena")]
    fn record(at: u32, store: Option<TriviaStore<TriviaText>>) -> TriviaEntry<TriviaText> {
        TriviaEntry::Record(crate::trivia::RecordEntry { record: crate::trivia::BuiltEntry { kind: KindId(1), at: crate::arena::Address(at) }, store })
    }

    #[cfg(feature = "arena")]
    fn store_of(entry: &TriviaEntry<TriviaText>) -> Option<&TriviaStore<TriviaText>> {
        match entry {
            TriviaEntry::Record(record) => record.store.as_ref(),
            TriviaEntry::Value(_) | TriviaEntry::Tokens => None,
        }
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_record_entry_is_answered_by_the_store_that_holds_it_and_no_store_holds_itself() {
        let (one, two) = (TriviaStore::<TriviaText>::new(), TriviaStore::<TriviaText>::new());
        let handle = one.clone();
        assert!(one == handle && one != two, "a handle equals another only when they share one store");
        one.write_side(Place::Record(Address(4)), TriviaSide::Leading, &[record(5, Some(one.clone())), entry("// x"), record(7, None)]).expect("kept");
        let read = read_side(&one, Place::Record(Address(4)), TriviaSide::Leading).expect("written");
        assert_eq!(store_of(&read[1]), None, "an entry that names no record holds no store");
        assert_eq!((store_of(&read[0]), store_of(&read[2])), (Some(&one), Some(&one)), "a record is answered by the store that holds it");
        one.write_side(Place::Record(Address(5)), TriviaSide::Trailing, &[record(6, None)]).expect("kept");
        let trailing = one.sides(Place::Record(Address(5)), &*one.built()).expect("read").and_then(|sides| sides.trailing).expect("written");
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
    #[test]
    fn a_side_s_entry_is_kept_in_eight_bytes() {
        assert_eq!(std::mem::size_of::<CompactEntry>(), 8);
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_record_a_layout_member_and_a_text_entry_read_back_as_they_were_written() {
        use crate::trivia::{BuiltEntry, RecordEntry};
        let store = TriviaStore::<Probe>::new();
        let place = Place::Record(Address(5));
        let record = BuiltEntry { kind: KindId(2), at: Address(7) };
        store.write_side(place, TriviaSide::Leading, &[TriviaEntry::Record(RecordEntry { record, store: None }), member(), text("// x")]).expect("kept");
        let kept = store.read().get(place, TriviaSide::Leading).map(<[CompactEntry]>::to_vec).expect("written");
        assert!(
            matches!(kept[..], [CompactEntry::Record { kind: KindId(2), at: Address(7) }, CompactEntry::Layout { kind: NEWLINE }, CompactEntry::Text { kind: KindId(1), .. }]),
            "a record by its kind and address, a member by its kind, text by its kind and its leaf entry: {kept:?}"
        );
        let read = read_side(&store, place, TriviaSide::Leading);
        assert_eq!(read, Some(vec![TriviaEntry::Record(RecordEntry { record, store: Some(store) }), member(), text("// x")]));
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_coordinate_is_refused_and_the_side_keeps_what_it_held() {
        use crate::types::{Span, TreeId};
        let store = TriviaStore::<Probe>::new();
        let place = Place::Record(Address(5));
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
        use crate::types::{NodeId, NodeName, Span, TreeId};
        let store = TriviaStore::<Probe>::new();
        let read = ReadWriter::new(&mut store.built_mut()).push(&[u32::from(KindId(2).0), 0]).expect("a read's record");
        let mut coordinate = crate::slot::NodeCoordinate::new(TreeId(1), NodeIndex::new(2), NodeIndex::new(3), Span { start: 0, end: 4 }).named(Some(NodeName { node: NodeId(read.0), site: None }));
        coordinate.kind = Some(KindId(2));
        let place = Place::Record(Address(5));
        store.write_held_side(place, TriviaSide::Leading, &[TriviaEntry::new(SlotValue::Coord(coordinate))]).expect("kept");
        assert_eq!(read_side(&store, place, TriviaSide::Leading), Some(vec![TriviaEntry::Record(RecordEntry { record: BuiltEntry { kind: KindId(2), at: read }, store: Some(store.clone()) })]));
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_text_entry_holds_its_string_chunk_until_its_side_is_replaced() {
        let store = TriviaStore::<Probe>::new();
        let place = Place::Record(Address(5));
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
        let unit = |holder| Place::Unit(Site { holder: Address(holder), word: 2, item: ItemIndex(0) });
        store.write_held_side(unit(5), TriviaSide::Leading, &[text("// a")]).expect("kept");
        let chunk = text_chunk(&store, unit(5), TriviaSide::Leading);
        store.copy_sites(Address(5), Address(9), &[]).expect("a copy");
        assert_eq!(store.built().text_count(chunk), Some(2));
        assert_eq!(read_side(&store, unit(9), TriviaSide::Leading), Some(vec![text("// a")]));
    }
}
