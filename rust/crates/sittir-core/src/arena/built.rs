//! A built record's render entry point. Its words were written outside the
//! native writer, so they are admitted as they cross in (`admit`), and the
//! parsed trees its cells link are held for the render.

use std::collections::HashMap;
use std::hash::BuildHasher;

use super::{admit, Address, ArenaError, ArenaRead, Cell, CellAt, CellWord, HeldArenas, RecordGrammar};
use crate::engine::{encode_handle, Engine, EngineGrammar, ParsedTree};
use crate::prepare::RenderContext;
use crate::render::{CoordinateError, RenderError, RenderResult, RenderSink};
use crate::slot::ChangedEdges;
use crate::trivia::{BuiltEntry, NodeTrivia, TriviaEntry};
use crate::trivia_store::{Place, Site, TriviaStore};
use crate::trivia_table::TriviaSide;
use crate::types::{KindId, NodeIndex, TreeId};

impl<G: EngineGrammar> Engine<G> {
    /// The entries a write gave `side` of the built record at `at`, or
    /// `None` when no write did, so the side is the one of the node it was
    /// rebuilt from.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for address 0, which names no record.
    pub fn built_trivia_side(&self, at: Address, side: TriviaSide) -> Result<Option<Vec<TriviaEntry<G::Trivia>>>, ArenaError> {
        Ok(self.written().side(Place::Record(at.record()?), side))
    }

    /// Replace `side` of the built record at `at` with `entries`, which its
    /// render then writes (`render_built`).
    ///
    /// # Errors
    ///
    /// As `built_trivia_side`.
    pub fn write_built_trivia_side(&self, at: Address, side: TriviaSide, entries: Vec<TriviaEntry<G::Trivia>>) -> Result<(), ArenaError> {
        self.written().write_held_side(Place::Record(at.record()?), side, entries)
    }

    /// The entries a write gave `side` of the built leaf at `site`, or `None`
    /// when no write did.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a site whose holder is address 0.
    pub fn built_leaf_side(&self, site: Site<Address>, side: TriviaSide) -> Result<Option<Vec<TriviaEntry<G::Trivia>>>, ArenaError> {
        site.holder.record()?;
        Ok(self.written().side(Place::Leaf(site), side))
    }

    /// The sides of every unit and leaf site of the built record at `from`,
    /// written at the same site of the record at `to`, except a site at a
    /// word `skip` names.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for address 0 as either record, before any
    /// side is copied.
    pub fn copy_built_sites(&self, from: Address, to: Address, skip: &[u32]) -> Result<(), ArenaError> {
        from.record()?;
        to.record()?;
        self.written().copy_sites(from, to, skip)
    }

    /// Replace `side` of the built leaf at each of `sites` with `entries`,
    /// which a render of its holder then writes.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a site whose holder is address 0, before
    /// any site is written.
    pub fn write_built_leaf_side(&self, sites: &[Site<Address>], side: TriviaSide, entries: &[TriviaEntry<G::Trivia>]) -> Result<(), ArenaError> {
        for site in sites {
            site.holder.record()?;
        }
        sites.iter().try_for_each(|&site| self.written().write_held_side(Place::Leaf(site), side, entries.to_vec()))
    }
}

impl<G: RecordGrammar> Engine<G> {
    /// The sides writes gave each unit the built record at `at` in `arena`
    /// holds: by the unit's slot and its item there.
    ///
    /// # Errors
    ///
    /// What `ArenaRead::header_kind` refuses, and `ArenaError::Malformed` for
    /// a unit at a word the record's kind holds no slot at.
    pub fn built_unit_sides(&self, arena: &impl ArenaRead, at: Address) -> Result<Vec<crate::layout::UnitSides<G::Trivia>>, ArenaError> {
        let kind = arena.header_kind(at, G::KIND_BITS)?;
        let units = self.written().units(at);
        units
            .into_iter()
            .map(|(word, item, trivia)| {
                let slot = G::slot_key(kind, word).ok_or(ArenaError::Malformed { what: "unit slot word", word })?;
                Ok(crate::layout::UnitSides { slot: slot.to_owned(), item, trivia })
            })
            .collect()
    }

    /// The units the built record at `at` holds have the sides `units`
    /// gives, in place of every unit side it had; its render then writes
    /// them.
    ///
    /// # Errors
    ///
    /// What `ArenaRead::header_kind` and `TriviaStore::write_units` refuse,
    /// and `ArenaError::UnknownSlot` for a slot the record's kind has no
    /// cell for.
    pub fn write_built_unit_sides(&self, at: Address, units: Vec<crate::layout::UnitSides<G::Trivia>>) -> Result<(), ArenaError> {
        let kind = self.written().built().readable()?.header_kind(at, G::KIND_BITS)?;
        let units = units
            .into_iter()
            .map(|unit| {
                let word = G::slot_word(kind, &unit.slot).ok_or_else(|| ArenaError::UnknownSlot(unit.slot.clone().into_boxed_str()))?;
                Ok((word, unit.item, unit.trivia))
            })
            .collect::<Result<Vec<_>, ArenaError>>()?;
        self.written().write_units(at, units)
    }

    /// The built record at `at`, of the built arena `arena`, rendered as a
    /// render root whose `changed` edges have no neighbour, under `ctx`, its
    /// line endings unspelled. The records it reaches are admitted first;
    /// each parsed tree a cell links is held from `trees` for the render,
    /// and every tree's source and every trivia entry's record are read
    /// through `ctx`'s table.
    ///
    /// # Errors
    ///
    /// `RenderError::Record` for an address naming no record and for words
    /// `admit` refuses, `RenderError::Coordinate` for a linked tree `trees`
    /// does not hold, else what the record's render refuses.
    pub fn render_built<H: BuildHasher>(
        &self,
        arena: &dyn ArenaRead,
        at: Address,
        changed: ChangedEdges,
        trees: &HashMap<TreeId, ParsedTree<G>, H>,
        ctx: &RenderContext<'_>,
    ) -> Result<String, RenderError> {
        let (root, mut held) = admitted_root::<G, H>(arena, at, changed, trees)?;
        G::render_record(self.grammar(), root, &mut held, arena, self.written(), ctx)
    }

    /// The lone built leaf of `kind` whose leaf entry is at `entry` in
    /// `arena`, rendered as a render root whose `changed` edges have no neighbour,
    /// with the sides `sides`: a root has no site, so its sides come with the
    /// call (`Place::ROOT_LEAF`).
    ///
    /// # Errors
    ///
    /// `RenderError::Record` for a kind no node of the grammar is written as
    /// and for an entry of another kind or outside the arena's strings, else
    /// what the leaf's render refuses.
    pub fn render_built_leaf(
        &self,
        arena: &dyn ArenaRead,
        kind: KindId,
        entry: Address,
        sides: Option<NodeTrivia<G::Trivia>>,
        changed: ChangedEdges,
        ctx: &RenderContext<'_>,
    ) -> Result<String, RenderError> {
        let cell = admitted_leaf::<G>(arena, kind, entry, changed).map_err(RenderError::Record)?;
        let store = self.written().root_leaf(sides);
        let mut held = HeldArenas::of([]);
        G::render_record(self.grammar(), CellAt { cell, tree: None, site: None }, &mut held, arena, &store, ctx)
    }
}

/// The cell of a built leaf of `kind` whose leaf entry is at `entry` in
/// `arena`, as admission admits it: by what it holds, an entry of that kind,
/// a kind the grammar writes, and text inside the arena's strings.
fn admitted_leaf<G: RecordGrammar>(arena: &dyn ArenaRead, kind: KindId, entry: Address, changed: ChangedEdges) -> Result<Cell, ArenaError> {
    G::shape(kind).ok_or(ArenaError::Malformed { what: "built leaf kind", word: u32::from(kind.0) })?;
    let word = entry.0.checked_mul(4).filter(|_| entry.0 < 1 << 30).ok_or(ArenaError::Malformed { what: "leaf entry address", word: entry.0 })?;
    match Cell::decode_built(CellWord(word), arena, G::KIND_BITS)? {
        Cell::BuiltLeaf { kind: found, text, .. } if found == kind => {
            arena.text(text)?;
            Ok(Cell::BuiltLeaf { kind, text, changed })
        }
        _ => Err(ArenaError::Malformed { what: "built leaf entry", word: entry.0 }),
    }
}

/// The built record `record` of `arena` written into `w` as a trivia entry
/// in the side that holds it, under `ctx`: admitted, the parsed trees it
/// links held from `trees`, and rendered as the record its grammar renders
/// as an entry (`RecordGrammar::render_entry`), its sides from `store`.
///
/// # Errors
///
/// `RenderError::Record` for a record whose header names a kind other than
/// its entry's and for words `admit` refuses, else what the render refuses.
pub fn render_record_entry<G: RecordGrammar, H: BuildHasher>(
    grammar: G,
    arena: &dyn ArenaRead,
    record: BuiltEntry,
    store: &TriviaStore<G::Trivia>,
    trees: &HashMap<TreeId, ParsedTree<G>, H>,
    ctx: &RenderContext<'_>,
    w: &mut dyn RenderSink,
) -> RenderResult {
    if arena.header_kind(record.at, G::KIND_BITS).map_err(RenderError::Record)? != record.kind {
        return Err(RenderError::Record(ArenaError::Malformed { what: "trivia entry kind", word: u32::from(record.kind.0) }));
    }
    let (root, mut held) = admitted_root::<G, H>(arena, record.at, ChangedEdges::default(), trees)?;
    G::render_entry(grammar, root, &mut held, arena, store, ctx, w)
}

fn admitted_root<'t, G: RecordGrammar, H: BuildHasher>(
    arena: &dyn ArenaRead,
    at: Address,
    changed: ChangedEdges,
    trees: &'t HashMap<TreeId, ParsedTree<G>, H>,
) -> Result<(CellAt, HeldArenas<'t>), RenderError> {
    let kind = arena.header_kind(at, G::KIND_BITS).map_err(RenderError::Record)?;
    let linked = admit(arena, at, G::shape, G::KIND_BITS).map_err(RenderError::Record)?;
    let held = linked
        .into_iter()
        .map(|tree| {
            let parsed = trees.get(&tree).ok_or(CoordinateError::UnknownTree { handle: encode_handle(tree, NodeIndex::ROOT), tree_id: tree })?;
            Ok((tree, parsed.tree_arena()))
        })
        .collect::<Result<Vec<_>, CoordinateError>>()?;
    Ok((CellAt { cell: Cell::Child { kind, at, link: None, changed }, tree: None, site: None }, HeldArenas::of(held)))
}
