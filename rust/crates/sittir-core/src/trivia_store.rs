//! The sides of trivia a writer set, for every node an engine renders: one
//! store per engine, keyed by the node's place and the side. A side reads as
//! what the store holds, else, for a parsed node, what its tree's trivia table
//! assigned from the source (`ParsedTree::side_entries`).
//!
//! Written trivia is a layout overlay: setting or replacing a side never
//! edits a node or a record. The store is outside every record, so a record
//! that shares a child never sees another record's sides.

use std::collections::BTreeMap;
use std::sync::{Arc, PoisonError, RwLock};

use crate::trivia::TriviaEntry;
use crate::trivia_table::TriviaSide;
use crate::types::{NodeIndex, TreeId};

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

type Sides<T> = BTreeMap<(Place, TriviaSide), Vec<TriviaEntry<T>>>;

/// One engine's written sides. Every handle cloned from it shares them: the
/// engine holds one, and each tree it parses another.
///
/// A built node's entries live as long as the engine's built arena, which
/// only appends, so no record's address is reused while its entries are
/// here. A parsed tree's entries leave with the tree (`drop_tree`), and a
/// tree's id is never reused (`engine::claim_tree_id`).
#[derive(Debug)]
pub struct TriviaStore<T> {
    sides: Arc<RwLock<Sides<T>>>,
    /// The chunks of the arena the engine's builders write, which a record
    /// entry this store answers renders from.
    #[cfg(feature = "arena")]
    built: Arc<RwLock<crate::arena::BuiltChunks>>,
    /// The buffers JavaScript reads the built arena's chunks through, which
    /// whatever frees a chunk detaches in the same call.
    #[cfg(all(feature = "arena", feature = "napi-bindings"))]
    buffers: Arc<std::sync::Mutex<crate::napi_engine::Buffers>>,
}

impl<T> Clone for TriviaStore<T> {
    fn clone(&self) -> Self {
        Self {
            sides: Arc::clone(&self.sides),
            #[cfg(feature = "arena")]
            built: Arc::clone(&self.built),
            #[cfg(all(feature = "arena", feature = "napi-bindings"))]
            buffers: Arc::clone(&self.buffers),
        }
    }
}

/// Two handles are equal when they share one store: a record's address
/// names a record only in the store of the arena that wrote it.
impl<T> PartialEq for TriviaStore<T> {
    fn eq(&self, other: &Self) -> bool {
        Arc::ptr_eq(&self.sides, &other.sides)
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
            sides: Arc::new(RwLock::new(BTreeMap::new())),
            #[cfg(feature = "arena")]
            built: Arc::new(RwLock::new(crate::arena::BuiltChunks::new(kind_bits, no_shape))),
            #[cfg(all(feature = "arena", feature = "napi-bindings"))]
            buffers: Arc::default(),
        }
    }

    /// A store whose built arena's kind fields take `kind_bits` bits and
    /// whose records' shapes are `shape`'s: the grammar's stamps.
    #[cfg(feature = "arena")]
    #[must_use]
    pub fn for_records(kind_bits: u32, shape: crate::arena::ShapeOf) -> Self {
        Self {
            sides: Arc::new(RwLock::new(BTreeMap::new())),
            built: Arc::new(RwLock::new(crate::arena::BuiltChunks::new(kind_bits, shape))),
            #[cfg(feature = "napi-bindings")]
            buffers: Arc::default(),
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
            TriviaEntry::Value(_) => None,
        })
        .collect()
}

/// The rows `[index, end)` of `tree`, as store keys.
fn rows(tree: TreeId, index: NodeIndex, end: NodeIndex) -> std::ops::Range<(Place, TriviaSide)> {
    (Place::Row { tree, row: index }, TriviaSide::Leading)..(Place::Row { tree, row: end }, TriviaSide::Leading)
}

impl<T: Clone> TriviaStore<T> {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    fn read(&self) -> std::sync::RwLockReadGuard<'_, Sides<T>> {
        self.sides.read().unwrap_or_else(PoisonError::into_inner)
    }

    fn write(&self) -> std::sync::RwLockWriteGuard<'_, Sides<T>> {
        self.sides.write().unwrap_or_else(PoisonError::into_inner)
    }

    /// `entries` as this store answers them: each built record among them
    /// holds this store, which holds the record's own sides and the arena
    /// that wrote it.
    #[cfg_attr(not(feature = "arena"), allow(clippy::unused_self, reason = "an entry names a built record only in the arena build"))]
    fn answered(&self, entries: &[TriviaEntry<T>]) -> Vec<TriviaEntry<T>> {
        entries
            .iter()
            .map(|entry| match entry {
                #[cfg(feature = "arena")]
                TriviaEntry::Record(record) => TriviaEntry::Record(crate::trivia::RecordEntry { store: Some(self.clone()), ..record.clone() }),
                entry @ TriviaEntry::Value(_) => entry.clone(),
            })
            .collect()
    }

    /// The entries a write gave `side` of the node at `place`, or `None` when
    /// no write did. A write of no entries is `Some` of none: it replaced the
    /// side with nothing.
    #[must_use]
    pub fn side(&self, place: Place, side: TriviaSide) -> Option<Vec<TriviaEntry<T>>> {
        self.read().get(&(place, side)).map(|entries| self.answered(entries))
    }

    /// The sides writes gave the node at `place`, as its trivia, or `None`
    /// when no write gave it any.
    #[must_use]
    pub fn sides(&self, place: Place) -> Option<crate::trivia::NodeTrivia<T>> {
        let sides = self.read();
        let side = |side| sides.get(&(place, side)).map(|entries| self.answered(entries));
        let trivia = crate::trivia::NodeTrivia { leading: side(TriviaSide::Leading), trailing: side(TriviaSide::Trailing), inner: side(TriviaSide::Inner) };
        (trivia.leading.is_some() || trivia.trailing.is_some() || trivia.inner.is_some()).then_some(trivia)
    }

    /// The sides writes gave each built unit `holder`'s record holds, by the
    /// unit's slot word and its item there, in that order.
    #[cfg(feature = "arena")]
    #[must_use]
    pub fn units(&self, holder: crate::arena::Address) -> Vec<(u32, crate::types::ItemIndex, crate::trivia::NodeTrivia<T>)> {
        let first = (Place::Unit(Site { holder, word: 0, item: crate::types::ItemIndex(0) }), TriviaSide::Leading);
        let mut units: Vec<(u32, crate::types::ItemIndex, crate::trivia::NodeTrivia<T>)> = Vec::new();
        for ((place, side), entries) in self.read().range(first..) {
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
            *held = Some(self.answered(entries));
        }
        units
    }

    /// The units `holder`'s record holds have the sides `units` gives, each by
    /// its slot word and its item there, in place of every unit side the
    /// holder had. The built records the new sides name are held, and the
    /// ones the old sides named released.
    ///
    /// # Errors
    ///
    /// What holding or releasing a record refuses, before any side is
    /// written when a new side's record is refused.
    #[cfg(feature = "arena")]
    pub fn write_units(&self, holder: crate::arena::Address, units: Vec<(u32, crate::types::ItemIndex, crate::trivia::NodeTrivia<T>)>) -> Result<(), crate::arena::ArenaError> {
        for (_, _, trivia) in &units {
            for entries in [&trivia.leading, &trivia.trailing, &trivia.inner].into_iter().flatten() {
                self.hold(entries)?;
            }
        }
        let released = {
            let mut sides = self.write();
            let first = (Place::Unit(Site { holder, word: 0, item: crate::types::ItemIndex(0) }), TriviaSide::Leading);
            let held: Vec<_> = sides.range(first..).take_while(|((place, _), _)| matches!(place, Place::Unit(site) if site.holder == holder)).map(|(&key, _)| key).collect();
            held.into_iter().filter_map(|key| sides.remove(&key)).flat_map(|entries| held_records(&entries)).collect::<Vec<_>>()
        };
        for (word, item, trivia) in units {
            let place = Place::Unit(Site { holder, word, item });
            for (side, entries) in [(TriviaSide::Leading, trivia.leading), (TriviaSide::Trailing, trivia.trailing), (TriviaSide::Inner, trivia.inner)] {
                if let Some(entries) = entries {
                    self.insert(place, side, entries);
                }
            }
        }
        self.release_records(released)
    }

    /// The sides of every unit and leaf site of `from`'s record, written at
    /// the same site of `to`'s, except a site at a word `skip` names: what a
    /// copy of a record keeps of its children's sides. Each built record a
    /// copied side names is held once more.
    ///
    /// # Errors
    ///
    /// What holding a record refuses, before any side is copied.
    #[cfg(feature = "arena")]
    pub fn copy_sites(&self, from: crate::arena::Address, to: crate::arena::Address, skip: &[u32]) -> Result<(), crate::arena::ArenaError> {
        let copied: Vec<(Place, TriviaSide, Vec<TriviaEntry<T>>)> = {
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
        for (_, _, entries) in &copied {
            self.hold(entries)?;
        }
        let mut sides = self.write();
        for (place, side, entries) in copied {
            sides.insert((place, side), entries);
        }
        Ok(())
    }

    /// `side` of the node at `place` holds `entries`, in place of what it held.
    /// A built record is a record of this store's arena: it is kept with no
    /// store, and this store answers it. The write takes no count of a
    /// record: the sides a render roots at, and those a record sink keeps,
    /// hold none (`write_held_side`).
    pub fn write_side(&self, place: Place, side: TriviaSide, entries: Vec<TriviaEntry<T>>) {
        self.insert(place, side, entries);
    }

    fn insert(&self, place: Place, side: TriviaSide, entries: Vec<TriviaEntry<T>>) -> Option<Vec<TriviaEntry<T>>> {
        let entries = entries
            .into_iter()
            .map(|entry| match entry {
                #[cfg(feature = "arena")]
                TriviaEntry::Record(record) => TriviaEntry::Record(crate::trivia::RecordEntry { store: None, ..record }),
                entry @ TriviaEntry::Value(_) => entry,
            })
            .collect();
        self.write().insert((place, side), entries)
    }

    /// `side` of the node at `place` holds `entries`, as `write_side`, and
    /// holds each built record among them: it moves the count the record's
    /// builder's handle holds, else takes one more. The records the side
    /// named before are released.
    ///
    /// # Errors
    ///
    /// What holding or releasing a record refuses, before the side is
    /// written when a new entry's record is refused.
    #[cfg(feature = "arena")]
    pub fn write_held_side(&self, place: Place, side: TriviaSide, entries: Vec<TriviaEntry<T>>) -> Result<(), crate::arena::ArenaError> {
        #[cfg(debug_assertions)]
        if let Place::Record(holder) | Place::Unit(Site { holder, .. }) | Place::Leaf(Site { holder, .. }) = place {
            let built = self.built();
            for record in held_records(&entries) {
                if built.reaches(record, holder)? {
                    return Err(crate::arena::ArenaError::Malformed { what: "side record reaching its holder", word: record.0 });
                }
            }
        }
        self.hold(&entries)?;
        let old = self.insert(place, side, entries);
        self.release_records(old.as_deref().map(held_records).unwrap_or_default())
    }

    #[cfg(feature = "arena")]
    fn hold(&self, entries: &[TriviaEntry<T>]) -> Result<(), crate::arena::ArenaError> {
        let records = held_records(entries);
        if records.is_empty() {
            return Ok(());
        }
        let mut built = self.built_mut();
        records.into_iter().try_for_each(|at| built.adopt(at))
    }

    #[cfg(feature = "arena")]
    fn release_records(&self, records: Vec<crate::arena::Address>) -> Result<(), crate::arena::ArenaError> {
        records.into_iter().try_for_each(|at| self.release(crate::arena::count::Held::Record(at), false))
    }

    /// Releases a count of `held` (`BuiltChunks::release`), dropping the
    /// sides of each record it releases, and with them the counts those
    /// sides held.
    ///
    /// # Errors
    ///
    /// What `BuiltChunks::release` refuses.
    #[cfg(feature = "arena")]
    pub fn release(&self, held: crate::arena::count::Held, owned: bool) -> Result<(), crate::arena::ArenaError> {
        self.built_mut().release(held, owned, &mut |at| self.drop_record(at))
    }

    /// Drops the sides of the built record at `at` and of the units and
    /// leaves it holds, answering the built records they named.
    #[cfg(feature = "arena")]
    fn drop_record(&self, at: crate::arena::Address) -> Vec<crate::arena::Address> {
        let mut sides = self.write();
        let first = Site { holder: at, word: 0, item: crate::types::ItemIndex(0) };
        let mut keys: Vec<_> = [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].into_iter().map(|side| (Place::Record(at), side)).filter(|key| sides.contains_key(key)).collect();
        for start in [Place::Unit(first), Place::Leaf(first)] {
            keys.extend(sides.range((start, TriviaSide::Leading)..).map_while(|(&(place, side), _)| match (place, start) {
                (Place::Unit(site), Place::Unit(_)) | (Place::Leaf(site), Place::Leaf(_)) if site.holder == at => Some((place, side)),
                _ => None,
            }));
        }
        keys.into_iter().filter_map(|key| sides.remove(&key)).flat_map(|entries| held_records(&entries)).collect()
    }

    /// A store over this one's built arena that holds `sides` alone, as the
    /// sides of the lone leaf a render roots at (`Place::ROOT_LEAF`), which
    /// has no site in this store to key them by. A built record among them
    /// renders from the arena this store holds.
    #[cfg(feature = "arena")]
    #[must_use]
    pub fn root_leaf(&self, sides: Option<crate::trivia::NodeTrivia<T>>) -> Self {
        let store = Self {
            sides: Arc::default(),
            built: Arc::clone(&self.built),
            #[cfg(feature = "napi-bindings")]
            buffers: Arc::clone(&self.buffers),
        };
        if let Some(sides) = sides {
            for (side, entries) in [(TriviaSide::Leading, sides.leading), (TriviaSide::Trailing, sides.trailing), (TriviaSide::Inner, sides.inner)] {
                if let Some(entries) = entries {
                    store.write_side(Place::ROOT_LEAF, side, entries);
                }
            }
        }
        store
    }

    /// Whether a write set a side of a node in rows `[index, end)` of `tree`:
    /// of a descendant of the node at `index`, or of that node's own `inner`,
    /// and of its own leading and trailing too when `own_sides` is set.
    #[must_use]
    pub fn edited_within(&self, tree: TreeId, index: NodeIndex, end: NodeIndex, own_sides: bool) -> bool {
        let own = Place::Row { tree, row: index };
        self.read().range(rows(tree, index, end)).any(|(&(place, side), _)| place != own || own_sides || side == TriviaSide::Inner)
    }

    /// Drop every side written on a node of `tree`, and release the built
    /// records they held. A record the release refuses is left counted.
    /// Answers whether a side it dropped held a built record.
    #[must_use]
    pub fn drop_tree(&self, tree: TreeId) -> bool {
        let dropped: Vec<Vec<TriviaEntry<T>>> = {
            let mut sides = self.write();
            let first = (Place::Row { tree, row: NodeIndex::ROOT }, TriviaSide::Leading);
            let keys: Vec<_> = sides.range(first..).take_while(|((place, _), _)| matches!(place, Place::Row { tree: t, .. } if *t == tree)).map(|(&key, _)| key).collect();
            keys.into_iter().filter_map(|key| sides.remove(&key)).collect()
        };
        #[cfg(feature = "arena")]
        {
            let records: Vec<_> = dropped.iter().flat_map(|entries| held_records(entries)).collect();
            let held = !records.is_empty();
            let _ = self.release_records(records);
            held
        }
        #[cfg(not(feature = "arena"))]
        {
            drop(dropped);
            false
        }
    }

    /// The sides the store holds, every place's.
    #[cfg(test)]
    pub(crate) fn len(&self) -> usize {
        self.read().len()
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

    fn entry(text: &str) -> TriviaEntry<TriviaText> {
        TriviaEntry::new(SlotValue::Node(TriviaText { kind: KindId(1), text: text.to_owned(), span: None, before: None, after: None }))
    }

    fn row(tree: u32, row: u32) -> Place {
        Place::Row { tree: TreeId(tree), row: NodeIndex::new(row) }
    }

    #[test]
    fn a_write_replaces_the_side_and_every_handle_sees_it() {
        let store = TriviaStore::<TriviaText>::new();
        let other = store.clone();
        assert_eq!(store.side(row(1, 2), TriviaSide::Leading), None);
        store.write_side(row(1, 2), TriviaSide::Leading, vec![entry("// a")]);
        other.write_side(row(1, 2), TriviaSide::Leading, vec![entry("// b")]);
        assert_eq!(store.side(row(1, 2), TriviaSide::Leading), Some(vec![entry("// b")]));
        assert_eq!(store.side(row(1, 2), TriviaSide::Trailing), None);
        store.write_side(row(1, 2), TriviaSide::Trailing, Vec::new());
        assert_eq!(store.side(row(1, 2), TriviaSide::Trailing), Some(Vec::new()), "a side replaced with nothing is written");
    }

    #[test]
    fn a_range_holds_a_write_below_its_node_or_on_the_node_s_inner() {
        let store = TriviaStore::<TriviaText>::new();
        store.write_side(row(1, 4), TriviaSide::Leading, Vec::new());
        let (tree, end) = (TreeId(1), NodeIndex::new(9));
        assert!(store.edited_within(tree, NodeIndex::new(3), end, false), "a descendant's side");
        assert!(!store.edited_within(tree, NodeIndex::new(4), end, false), "a node's own leading is not within it");
        assert!(store.edited_within(tree, NodeIndex::new(4), end, true));
        assert!(!store.edited_within(tree, NodeIndex::new(5), end, true), "past the write");
        assert!(!store.edited_within(TreeId(2), NodeIndex::new(3), end, true), "another tree's rows");
        store.write_side(row(1, 6), TriviaSide::Inner, Vec::new());
        assert!(store.edited_within(tree, NodeIndex::new(6), end, false), "a node's own inner is within it");
    }

    #[test]
    fn dropping_a_tree_drops_its_rows_alone() {
        let store = TriviaStore::<TriviaText>::new();
        for tree in 1..=3 {
            store.write_side(row(tree, 0), TriviaSide::Leading, vec![entry("// x")]);
            store.write_side(row(tree, 7), TriviaSide::Inner, Vec::new());
        }
        assert!(!store.drop_tree(TreeId(2)), "text alone holds no record");
        assert_eq!(store.len(), 4);
        assert_eq!(store.side(row(2, 0), TriviaSide::Leading), None);
        assert_eq!(store.side(row(1, 0), TriviaSide::Leading), Some(vec![entry("// x")]));
        assert_eq!(store.side(row(3, 7), TriviaSide::Inner), Some(Vec::new()));
    }

    #[cfg(feature = "arena")]
    #[test]
    fn dropping_a_tree_answers_whether_a_side_it_dropped_held_a_built_record() {
        let store = TriviaStore::<TriviaText>::new();
        store.write_side(row(1, 0), TriviaSide::Leading, vec![entry("// x"), record(5, None)]);
        store.write_side(row(2, 0), TriviaSide::Leading, vec![entry("// y")]);
        assert!(store.drop_tree(TreeId(1)));
        assert!(!store.drop_tree(TreeId(2)), "text alone holds no record");
        assert!(!store.drop_tree(TreeId(3)), "a tree with no sides");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_built_place_keeps_its_sides_beside_the_trees() {
        use crate::arena::Address;
        let store = TriviaStore::<TriviaText>::new();
        let record = Place::Record(Address(5));
        let unit = Place::Unit(Site { holder: Address(5), word: 2, item: crate::types::ItemIndex(0) });
        store.write_side(record, TriviaSide::Leading, vec![entry("// r")]);
        store.write_side(unit, TriviaSide::Trailing, vec![entry("// u")]);
        store.write_side(row(1, 0), TriviaSide::Leading, Vec::new());
        assert!(!store.drop_tree(TreeId(1)));
        assert_eq!(store.side(record, TriviaSide::Leading), Some(vec![entry("// r")]));
        assert_eq!(store.side(unit, TriviaSide::Trailing), Some(vec![entry("// u")]));
        assert_eq!(store.len(), 2);
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_copy_keeps_the_unit_and_leaf_sides_of_its_kept_sites_and_nothing_else() {
        let site = |holder: u32, word: u32, item: u32| Site { holder: Address(holder), word, item: crate::types::ItemIndex(item) };
        let store = TriviaStore::<TriviaText>::new();
        store.write_side(Place::Record(Address(5)), TriviaSide::Leading, vec![entry("// own")]);
        store.write_side(Place::Unit(site(5, 2, 0)), TriviaSide::Trailing, vec![entry("// unit")]);
        store.write_side(Place::Leaf(site(5, 2, 1)), TriviaSide::Leading, vec![entry("// leaf")]);
        store.write_side(Place::Leaf(site(5, 7, 0)), TriviaSide::Leading, vec![entry("// patched")]);
        store.write_side(Place::Leaf(site(6, 2, 0)), TriviaSide::Leading, vec![entry("// other holder")]);
        store.copy_sites(Address(5), Address(9), &[7]).expect("a copy");
        assert_eq!(store.side(Place::Unit(site(9, 2, 0)), TriviaSide::Trailing), Some(vec![entry("// unit")]));
        assert_eq!(store.side(Place::Leaf(site(9, 2, 1)), TriviaSide::Leading), Some(vec![entry("// leaf")]));
        assert_eq!(store.side(Place::Leaf(site(9, 7, 0)), TriviaSide::Leading), None, "a skipped word keeps none");
        assert_eq!(store.side(Place::Record(Address(9)), TriviaSide::Leading), None, "a record's own sides are not its sites'");
        assert_eq!(store.side(Place::Leaf(site(9, 2, 0)), TriviaSide::Leading), None, "another holder's sites stay its own");
        assert_eq!(store.side(Place::Leaf(site(5, 2, 1)), TriviaSide::Leading), Some(vec![entry("// leaf")]), "the source keeps its sides");
    }

    #[cfg(feature = "arena")]
    #[test]
    fn a_node_s_written_sides_read_as_its_trivia_and_a_holder_s_units_as_theirs() {
        use crate::arena::Address;
        use crate::trivia::NodeTrivia;
        use crate::types::ItemIndex;
        let store = TriviaStore::<TriviaText>::new();
        let record = Place::Record(Address(5));
        assert_eq!(store.sides(record), None, "no write gave it a side");
        store.write_side(record, TriviaSide::Inner, Vec::new());
        assert_eq!(store.sides(record), Some(NodeTrivia { leading: None, trailing: None, inner: Some(Vec::new()) }));
        let unit = |holder, word, item| Place::Unit(Site { holder: Address(holder), word, item: ItemIndex(item) });
        store.write_side(unit(5, 7, 1), TriviaSide::Trailing, vec![entry("// b")]);
        store.write_side(unit(5, 2, 0), TriviaSide::Leading, vec![entry("// a")]);
        store.write_side(unit(5, 7, 1), TriviaSide::Leading, Vec::new());
        store.write_side(unit(6, 2, 0), TriviaSide::Leading, vec![entry("// other")]);
        assert_eq!(
            store.units(Address(5)),
            [
                (2, ItemIndex(0), NodeTrivia { leading: Some(vec![entry("// a")]), trailing: None, inner: None }),
                (7, ItemIndex(1), NodeTrivia { leading: Some(Vec::new()), trailing: Some(vec![entry("// b")]), inner: None }),
            ]
        );
        assert_eq!(store.units(Address(4)), []);
    }

    #[cfg(feature = "arena")]
    #[test]
    fn writing_a_holder_s_units_replaces_all_of_them_and_no_other_holder_s() {
        use crate::arena::Address;
        use crate::trivia::NodeTrivia;
        use crate::types::ItemIndex;
        let store = TriviaStore::<TriviaText>::new();
        let unit = |holder, word, item| Place::Unit(Site { holder: Address(holder), word, item: ItemIndex(item) });
        store.write_side(unit(5, 2, 0), TriviaSide::Leading, vec![entry("// gone")]);
        store.write_side(unit(5, 7, 1), TriviaSide::Inner, Vec::new());
        store.write_side(unit(6, 2, 0), TriviaSide::Leading, vec![entry("// other")]);
        store.write_side(Place::Record(Address(5)), TriviaSide::Leading, vec![entry("// own")]);
        let leaf = Place::Leaf(Site { holder: Address(5), word: 2, item: ItemIndex(0) });
        store.write_side(leaf, TriviaSide::Trailing, vec![entry("// leaf")]);
        let kept = NodeTrivia { leading: None, trailing: Some(vec![entry("// b")]), inner: None };
        store.write_units(Address(5), vec![(7, ItemIndex(0), kept.clone())]).expect("a write");
        assert_eq!(store.units(Address(5)), [(7, ItemIndex(0), kept)]);
        assert_eq!(store.units(Address(6)), [(2, ItemIndex(0), NodeTrivia { leading: Some(vec![entry("// other")]), trailing: None, inner: None })]);
        assert_eq!(store.side(Place::Record(Address(5)), TriviaSide::Leading), Some(vec![entry("// own")]), "the holder's own sides are not its units'");
        assert_eq!(store.side(leaf, TriviaSide::Trailing), Some(vec![entry("// leaf")]), "a leaf at a unit's site keeps its sides");
        store.write_units(Address(5), Vec::new()).expect("a write");
        assert_eq!(store.units(Address(5)), []);
    }

    #[cfg(feature = "arena")]
    fn record(at: u32, store: Option<TriviaStore<TriviaText>>) -> TriviaEntry<TriviaText> {
        TriviaEntry::Record(crate::trivia::RecordEntry { record: crate::trivia::BuiltEntry { kind: KindId(1), at: crate::arena::Address(at) }, store })
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
        one.write_side(row(1, 0), TriviaSide::Leading, vec![record(5, Some(one.clone())), entry("// x"), record(7, None)]);
        let read = one.side(row(1, 0), TriviaSide::Leading).expect("written");
        assert_eq!(store_of(&read[1]), None, "an entry that names no record holds no store");
        assert_eq!((store_of(&read[0]), store_of(&read[2])), (Some(&one), Some(&one)), "a record is answered by the store that holds it");
        one.write_side(Place::Record(Address(5)), TriviaSide::Trailing, vec![record(6, None)]);
        let trailing = one.sides(Place::Record(Address(5))).and_then(|sides| sides.trailing).expect("written");
        assert_eq!(store_of(&trailing[0]), Some(&one), "a record's own sides answer with their store too");
        drop((read, trailing));
        assert_eq!(one.handles(), 2, "no store holds itself: the handles are `one` and `handle`");
    }

}
