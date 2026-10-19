//! The render's prepared overlay: what a prepare fills for the nodes a
//! render's records name, beside what the records store, since a record is
//! never rewritten. One overlay is built for one render and dropped after it.
//!
//! A fact of a node itself is keyed by the node's place: its own kind's
//! edges, its print settings, its slots' per-item separators, its defaulted
//! units and its merged trivia. A fact a holder writes about the child it
//! holds at one site (a gap fill, a seat) is keyed by that site, so a node
//! placed at two sites gets each site's facts, as each native copy does.

use std::collections::HashMap;

use super::entry_by_word;
use crate::options::Edges;
use crate::trivia::NodeTrivia;
use crate::trivia_store::{Place, Site};
use crate::types::{Delimiter, KindId};

/// What prepare fills for one node, beside what its record stores. A stored
/// value always wins over a filled one.
#[derive(Debug, Clone, PartialEq)]
pub struct PreparedNode<T> {
    /// The node's own edges: its kind's edge row, or a root's source flanks.
    pub edges: Edges,
    pub delimiter: Option<Delimiter>,
    pub separator_kind: Option<KindId>,
    /// Its slots' prepared facts, by stamped word, for the slots that have any.
    pub slots: Vec<PreparedSlot>,
    /// Its trivia merged with the trivia of the node it was rebuilt from,
    /// untrimmed: changed edges are a site's fact, so the render drops the
    /// layout runs at the edges its site marks changed.
    pub trivia: Option<NodeTrivia<T>>,
}

impl<T> Default for PreparedNode<T> {
    fn default() -> Self {
        Self { edges: Edges::default(), delimiter: None, separator_kind: None, slots: Vec::new(), trivia: None }
    }
}

/// What prepare fills for one slot of a node: a list's separator spacing,
/// its items' own separators, and an optional slot's defaulted unit.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct PreparedSlot {
    pub word: u32,
    pub space_before: Option<KindId>,
    pub space_after: Option<KindId>,
    /// The separator before each item, by its place in the slot, where its
    /// source spells another than the slot's.
    pub tokens: Vec<Option<KindId>>,
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
}

/// One render's prepared overlay.
#[derive(Debug, Clone)]
pub struct Prepared<T> {
    nodes: HashMap<Place, PreparedNode<T>>,
    sites: HashMap<Site<Place>, Edges>,
}

impl<T> Default for Prepared<T> {
    fn default() -> Self {
        Self { nodes: HashMap::new(), sites: HashMap::new() }
    }
}

impl<T> Prepared<T> {
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// What prepare filled for the node at `place`, when it filled anything.
    #[must_use]
    pub fn node(&self, place: Place) -> Option<&PreparedNode<T>> {
        self.nodes.get(&place)
    }

    /// What prepare fills for the node at `place`, added empty on first use.
    pub fn node_mut(&mut self, place: Place) -> &mut PreparedNode<T> {
        self.nodes.entry(place).or_default()
    }

    /// The edges a holder fills for the child it holds at `site`. On first
    /// use they start as the child's `stored` edges, so a fill that sets only
    /// an unset side leaves a stored side alone, as it does on a native child.
    pub fn site_edges_mut(&mut self, site: Site<Place>, stored: Edges) -> &mut Edges {
        self.sites.entry(site).or_insert(stored)
    }

    /// The edges the node at `place` renders with, at `site` when a holder
    /// holds it: on each side, what its record stores, else what its holder
    /// filled there, else its own kind's. A native node takes them in that
    /// order: the wire's, then its holder's fills, which set only unset
    /// sides, then its own prepare's, which does too.
    #[must_use]
    pub fn edges(&self, stored: Edges, site: Option<Site<Place>>, place: Place) -> Edges {
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

    fn child() -> Place {
        Place::Row { tree: TreeId(1), row: NodeIndex(4) }
    }

    fn site(holder: u32, item: u32) -> Site<Place> {
        Site { holder: Place::Record(Address(holder)), word: 2, item: ItemIndex(item) }
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
        assert_eq!(prepared.edges(Edges::default(), None, Place::Record(Address(6))), Edges::default(), "a node prepare never reached has only what it stores");
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
        node.slot_mut(2).tokens = vec![None, Some(KindId(8))];
        assert_eq!(node.slot(2), Some(&PreparedSlot { word: 2, space_after: Some(KindId(1)), tokens: vec![None, Some(KindId(8))], ..PreparedSlot::default() }));
        assert_eq!(node.slot(4).and_then(|slot| slot.unit), Some(KindId(3)));
        assert_eq!(node.slot(6), None);
        assert_eq!(prepared.node(Place::Record(Address(9))), None);
    }
}
