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
    /// A built node or a built leaf, by its record.
    #[cfg(feature = "arena")]
    Record(crate::arena::Address),
    /// A built unit, which has no record: its site in its holder's record.
    #[cfg(feature = "arena")]
    Unit(Site<crate::arena::Address>),
    /// A parsed record its row's index does not name: an envelope's
    /// content, which shares its envelope's row and is reached through the
    /// envelope's cell, by its record in its tree's arena. No side is written
    /// at it: the row's sides are its envelope's.
    #[cfg(feature = "arena")]
    Content { tree: TreeId, record: crate::arena::Address },
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
}

impl<T> Clone for TriviaStore<T> {
    fn clone(&self) -> Self {
        Self { sides: Arc::clone(&self.sides) }
    }
}

impl<T> Default for TriviaStore<T> {
    fn default() -> Self {
        Self { sides: Arc::new(RwLock::new(BTreeMap::new())) }
    }
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

    /// The entries a write gave `side` of the node at `place`, or `None` when
    /// no write did. A write of no entries is `Some` of none: it replaced the
    /// side with nothing.
    #[must_use]
    pub fn side(&self, place: Place, side: TriviaSide) -> Option<Vec<TriviaEntry<T>>> {
        self.read().get(&(place, side)).cloned()
    }

    /// The sides writes gave the node at `place`, as its trivia, or `None`
    /// when no write gave it any.
    #[must_use]
    pub fn sides(&self, place: Place) -> Option<crate::trivia::NodeTrivia<T>> {
        let sides = self.read();
        let side = |side| sides.get(&(place, side)).cloned();
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
            *held = Some(entries.clone());
        }
        units
    }

    /// `side` of the node at `place` holds `entries`, in place of what it held.
    pub fn write_side(&self, place: Place, side: TriviaSide, entries: Vec<TriviaEntry<T>>) {
        self.write().insert((place, side), entries);
    }

    /// Whether a write set a side of a node in rows `[index, end)` of `tree`:
    /// of a descendant of the node at `index`, or of that node's own `inner`,
    /// and of its own leading and trailing too when `own_sides` is set.
    #[must_use]
    pub fn edited_within(&self, tree: TreeId, index: NodeIndex, end: NodeIndex, own_sides: bool) -> bool {
        let own = Place::Row { tree, row: index };
        self.read().range(rows(tree, index, end)).any(|(&(place, side), _)| place != own || own_sides || side == TriviaSide::Inner)
    }

    /// Drop every side written on a node of `tree`.
    pub fn drop_tree(&self, tree: TreeId) {
        let mut sides = self.write();
        let first = (Place::Row { tree, row: NodeIndex::ROOT }, TriviaSide::Leading);
        let keys: Vec<_> = sides.range(first..).take_while(|((place, _), _)| matches!(place, Place::Row { tree: t, .. } if *t == tree)).map(|(&key, _)| key).collect();
        for key in keys {
            sides.remove(&key);
        }
    }

    /// The sides the store holds, every place's.
    #[cfg(test)]
    pub(crate) fn len(&self) -> usize {
        self.read().len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
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
        store.drop_tree(TreeId(2));
        assert_eq!(store.len(), 4);
        assert_eq!(store.side(row(2, 0), TriviaSide::Leading), None);
        assert_eq!(store.side(row(1, 0), TriviaSide::Leading), Some(vec![entry("// x")]));
        assert_eq!(store.side(row(3, 7), TriviaSide::Inner), Some(Vec::new()));
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
        store.drop_tree(TreeId(1));
        assert_eq!(store.side(record, TriviaSide::Leading), Some(vec![entry("// r")]));
        assert_eq!(store.side(unit, TriviaSide::Trailing), Some(vec![entry("// u")]));
        assert_eq!(store.len(), 2);
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
}
