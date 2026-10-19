//! The render's prepared overlay: what a prepare fills for the nodes a
//! render's records name, beside what the records store, since a record is
//! never rewritten. One overlay is built for one render and dropped after it.
//!
//! A fact of a node itself is keyed by the node's place: its own kind's
//! edges, its print settings, its defaulted units, its prepared sides and its
//! slots' per-item separators. Every other fact of its layout is read where
//! it is kept: its side record, the store of written sides, or its tree. A fact a holder writes about the child it
//! holds at one site (a gap fill, a seat) is keyed by that site, so a node
//! placed at two sites gets each site's facts, as each native copy does.

use std::collections::HashMap;

use super::entry_by_word;
use crate::layout::UnitSides;
use crate::options::Edges;
use crate::slot::CoordinateEdges;
use crate::trivia::NodeTrivia;
use crate::trivia_store::{Place, Site};

/// Where the overlay keeps a node's facts: the place the store keeps its
/// sides at, or, for an envelope's content, which shares its envelope's row
/// and has no place in the store, its cell's site in the envelope. A parsed
/// content's key carries its tree, so no built record's address meets it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum PrepPlace {
    Stored(Place),
    Content(Site<Place>),
}

impl PrepPlace {
    /// The place the store keeps this node's sides at; none for an
    /// envelope's content, whose row's sides are its envelope's.
    #[must_use]
    pub fn stored(self) -> Option<Place> {
        match self {
            Self::Stored(place) => Some(place),
            Self::Content(_) => None,
        }
    }

    /// The tree row of a parsed node: its own row, or for an envelope's
    /// content its envelope's; none for a built node.
    #[must_use]
    pub fn row(self) -> Option<(crate::types::TreeId, crate::types::NodeIndex)> {
        match self {
            Self::Stored(Place::Row { tree, row }) | Self::Content(Site { holder: Place::Row { tree, row }, .. }) => Some((tree, row)),
            _ => None,
        }
    }
}

impl From<Place> for PrepPlace {
    fn from(place: Place) -> Self {
        Self::Stored(place)
    }
}
use crate::types::{Delimiter, KindId};

/// What prepare fills for one node, beside what its record stores. A stored
/// value always wins over a filled one.
#[derive(Debug, Clone, PartialEq)]
pub struct PreparedNode<T> {
    /// The node's own edges: its kind's edge row, or a root's source flanks.
    pub edges: Edges,
    pub delimiter: Option<Delimiter>,
    pub separator_kind: Option<KindId>,
    /// Its slots' print settings and defaulted units, by stamped word, for
    /// the slots that have any.
    pub slots: Vec<PreparedSlot>,
    /// Its sides as prepare leaves them: each side it stores, else the side
    /// of the node it was rebuilt from, each entry prepared. They are
    /// untrimmed: changed edges are a site's fact, so the render drops the
    /// layout runs at the edges its site marks changed.
    pub trivia: Option<NodeTrivia<T>>,
    /// Its unit children's sides, each entry prepared.
    pub units: Vec<UnitSides<T>>,
    /// Its list slots' per-item separators (`SlotLayout::tokens`), by the
    /// slot's wire key.
    pub tokens: Vec<SlotTokens>,
}

impl<T> Default for PreparedNode<T> {
    fn default() -> Self {
        Self { edges: Edges::default(), delimiter: None, separator_kind: None, slots: Vec::new(), trivia: None, units: Vec::new(), tokens: Vec::new() }
    }
}

/// The separator before each item of one list slot, by the item's place
/// (`SlotLayout::tokens`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SlotTokens {
    pub slot: String,
    pub tokens: Vec<Option<KindId>>,
}

/// What prepare fills for one slot of a node: a list's separator spacing,
/// and an optional slot's defaulted unit.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct PreparedSlot {
    pub word: u32,
    pub space_before: Option<KindId>,
    pub space_after: Option<KindId>,
    /// The unit an unset optional slot takes from its option site.
    pub unit: Option<KindId>,
}

impl<T> PreparedNode<T> {
    /// The entry of the slot at `word`, added when the node has none.
    pub fn slot_mut(&mut self, word: u32) -> &mut PreparedSlot {
        entry_by_word(&mut self.slots, word, |slot| slot.word, || PreparedSlot { word, ..PreparedSlot::default() })
    }

    /// The entry of the slot at `word`, when prepare filled any of it.
    #[must_use]
    pub fn slot(&self, word: u32) -> Option<&PreparedSlot> {
        self.slots.iter().find(|slot| slot.word == word)
    }

    /// The per-item separators of the list slot `slot`; none where prepare
    /// gave it none.
    #[must_use]
    pub fn tokens(&self, slot: &str) -> Option<&[Option<KindId>]> {
        self.tokens.iter().find(|entry| entry.slot == slot).map(|entry| entry.tokens.as_slice())
    }

    /// `slot`'s per-item separators are `tokens`, in place of any it had.
    pub fn set_tokens(&mut self, slot: &str, tokens: Vec<Option<KindId>>) {
        match self.tokens.iter_mut().find(|entry| entry.slot == slot) {
            Some(entry) => entry.tokens = tokens,
            None => self.tokens.push(SlotTokens { slot: slot.to_owned(), tokens }),
        }
    }
}

/// One render's prepared overlay.
#[derive(Debug, Clone)]
pub struct Prepared<T> {
    nodes: HashMap<PrepPlace, PreparedNode<T>>,
    sites: HashMap<Site<PrepPlace>, Edges>,
    /// The seams of the kind an untouched parsed child names, by its site:
    /// it renders its slice between them. A site prepare reached whose kind
    /// has no edge row holds none.
    coordinates: HashMap<Site<PrepPlace>, Option<CoordinateEdges>>,
    /// A unit child's own kind's edges, by its site: a unit has no place of
    /// its own to key them by.
    units: HashMap<Site<PrepPlace>, Edges>,
}

impl<T> Default for Prepared<T> {
    fn default() -> Self {
        Self { nodes: HashMap::new(), sites: HashMap::new(), coordinates: HashMap::new(), units: HashMap::new() }
    }
}

impl<T> Prepared<T> {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// What prepare filled for the node at `place`, when it filled anything.
    #[must_use]
    pub fn node(&self, place: PrepPlace) -> Option<&PreparedNode<T>> {
        self.nodes.get(&place)
    }

    /// What prepare fills for the node at `place`, added empty on first use.
    pub fn node_mut(&mut self, place: PrepPlace) -> &mut PreparedNode<T> {
        self.nodes.entry(place).or_default()
    }

    /// The edges a holder fills for the child it holds at `site`. On first
    /// use they start as the child's `stored` edges, so a fill that sets only
    /// an unset side leaves a stored side alone, as it does on a native child.
    pub fn site_edges_mut(&mut self, site: Site<PrepPlace>, stored: Edges) -> &mut Edges {
        self.sites.entry(site).or_insert(stored)
    }

    /// The unit child at `site`'s own kind's edges, for prepare to fill.
    pub fn unit_edges_mut(&mut self, site: Site<PrepPlace>) -> &mut Edges {
        self.units.entry(site).or_default()
    }

    /// The edges the unit child at `site` renders with: on each side its
    /// holder's fill there, else its own kind's. A unit stores none.
    #[must_use]
    pub fn unit_edges(&self, site: Option<Site<PrepPlace>>) -> Edges {
        let Some(site) = site else { return Edges::default() };
        let held = self.sites.get(&site).copied().unwrap_or_default();
        let own = self.units.get(&site).copied().unwrap_or_default();
        Edges { before: held.before.or(own.before), after: held.after.or(own.after) }
    }

    /// A node's delimiters setting: the one its record stores, else the one
    /// prepare filled.
    #[must_use]
    pub fn delimiter(&self, place: PrepPlace, stored: Option<Delimiter>) -> Option<Delimiter> {
        stored.or_else(|| self.node(place)?.delimiter)
    }

    /// A node's chosen separator: the one its record stores, else the one
    /// prepare filled.
    #[must_use]
    pub fn separator_kind(&self, place: PrepPlace, stored: Option<KindId>) -> Option<KindId> {
        stored.or_else(|| self.node(place)?.separator_kind)
    }

    /// A list slot's separator spacing on one side: the one its record
    /// stores, else the one prepare filled.
    #[must_use]
    pub fn space(&self, place: PrepPlace, word: u32, before: bool, stored: Option<KindId>) -> Option<KindId> {
        stored.or_else(|| {
            let slot = self.node(place)?.slot(word)?;
            if before { slot.space_before } else { slot.space_after }
        })
    }

    /// The seams prepare resolved for the untouched parsed child at `site`.
    #[must_use]
    pub fn coordinate_edges(&self, site: Site<PrepPlace>) -> Option<CoordinateEdges> {
        self.coordinates.get(&site).copied().flatten()
    }

    /// The seams of the untouched parsed child at `site`, for a holder's gap
    /// and seat fills to set.
    pub fn coordinate_edges_mut(&mut self, site: Site<PrepPlace>) -> &mut Option<CoordinateEdges> {
        self.coordinates.entry(site).or_default()
    }

    /// The untouched parsed child at `site` renders between `edges`.
    pub fn set_coordinate_edges(&mut self, site: Site<PrepPlace>, edges: Option<CoordinateEdges>) {
        self.coordinates.insert(site, edges);
    }

    /// The edges the node at `place` renders with, at `site` when a holder
    /// holds it: on each side, what its record stores, else what its holder
    /// filled there, else its own kind's. A native node takes them in that
    /// order: the wire's, then its holder's fills, which set only unset
    /// sides, then its own prepare's, which does too.
    #[must_use]
    pub fn edges(&self, stored: Edges, site: Option<Site<PrepPlace>>, place: PrepPlace) -> Edges {
        let held = site.and_then(|site| self.sites.get(&site)).copied().unwrap_or(stored);
        let own = self.node(place).map_or_else(Edges::default, |node| node.edges);
        Edges { before: held.before.or(own.before), after: held.after.or(own.after) }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::arena::Address;
    use crate::options::EdgeArm;
    use crate::trivia::TriviaText;
    use crate::types::{ItemIndex, NodeIndex, TreeId};

    fn arm(kind: u16) -> EdgeArm {
        EdgeArm { arm: KindId(kind), strength: None }
    }

    fn child() -> PrepPlace {
        Place::Row { tree: TreeId(1), row: NodeIndex(4) }.into()
    }

    fn site(holder: u32, item: u32) -> Site<PrepPlace> {
        Site { holder: Place::Record(Address(holder)).into(), word: 2, item: ItemIndex(item) }
    }

    #[test]
    fn a_child_s_edges_take_its_stored_side_then_its_holder_s_fill_then_its_own_kind_s() {
        let mut prepared = Prepared::<TriviaText>::new();
        prepared.node_mut(child()).edges = Edges { before: Some(arm(1)), after: Some(arm(2)) };
        let stored = Edges { before: Some(arm(9)), after: None };
        let held = prepared.site_edges_mut(site(5, 0), stored);
        held.before = held.before.or(Some(arm(7)));
        held.after = held.after.or(Some(arm(8)));
        assert_eq!(prepared.edges(stored, Some(site(5, 0)), child()), Edges { before: Some(arm(9)), after: Some(arm(8)) }, "a holder's fill leaves a stored side alone");
        assert_eq!(prepared.edges(stored, None, child()), Edges { before: Some(arm(9)), after: Some(arm(2)) }, "unheld, its own kind's fills what it stores nothing for");
        assert_eq!(prepared.edges(Edges::default(), None, Place::Record(Address(6)).into()), Edges::default(), "a node prepare never reached has only what it stores");
    }

    #[test]
    fn one_node_at_two_sites_keeps_each_site_s_fill() {
        let mut prepared = Prepared::<TriviaText>::new();
        prepared.site_edges_mut(site(5, 0), Edges::default()).after = Some(arm(3));
        prepared.site_edges_mut(site(6, 1), Edges::default()).after = Some(arm(4));
        assert_eq!(prepared.edges(Edges::default(), Some(site(5, 0)), child()).after, Some(arm(3)));
        assert_eq!(prepared.edges(Edges::default(), Some(site(6, 1)), child()).after, Some(arm(4)));
        assert_eq!(prepared.edges(Edges::default(), Some(site(5, 1)), child()).after, None, "another item of the same holder is another site");
    }

    #[test]
    fn a_site_s_edges_start_from_the_child_s_stored_edges_once() {
        let mut prepared = Prepared::<TriviaText>::new();
        let stored = Edges { before: Some(arm(9)), after: None };
        assert_eq!(*prepared.site_edges_mut(site(5, 0), stored), stored);
        prepared.site_edges_mut(site(5, 0), stored).after = Some(arm(1));
        assert_eq!(*prepared.site_edges_mut(site(5, 0), Edges::default()), Edges { before: Some(arm(9)), after: Some(arm(1)) }, "a later use keeps the fills");
    }

    #[test]
    fn a_slot_s_facts_join_its_entry_or_add_one() {
        let mut prepared = Prepared::<TriviaText>::new();
        let node = prepared.node_mut(child());
        node.slot_mut(2).space_after = Some(KindId(1));
        node.slot_mut(4).unit = Some(KindId(3));
        node.slot_mut(2).space_before = Some(KindId(8));
        assert_eq!(node.slot(2), Some(&PreparedSlot { word: 2, space_before: Some(KindId(8)), space_after: Some(KindId(1)), ..PreparedSlot::default() }));
        assert_eq!(node.slot(4).and_then(|slot| slot.unit), Some(KindId(3)));
        assert_eq!(node.slot(6), None);
        assert_eq!(prepared.node(Place::Record(Address(9)).into()), None);
    }

    #[test]
    fn a_built_record_an_envelope_and_the_content_at_the_same_numbers_keep_their_own_facts() {
        let mut prepared = Prepared::<TriviaText>::new();
        let envelope = Place::Row { tree: TreeId(1), row: NodeIndex(3) };
        let places = [Place::Record(Address(3)).into(), envelope.into(), PrepPlace::Content(Site { holder: envelope, word: 2, item: ItemIndex(0) })];
        for (place, kind) in places.into_iter().zip(1..) {
            prepared.node_mut(place).edges.before = Some(arm(kind));
        }
        let kept: Vec<_> = places.into_iter().map(|place| prepared.node(place).and_then(|node| node.edges.before)).collect();
        assert_eq!(kept, [Some(arm(1)), Some(arm(2)), Some(arm(3))]);
        assert_eq!(places.map(PrepPlace::stored), [Some(Place::Record(Address(3))), Some(envelope), None], "a content has no place in the store");
    }
}
