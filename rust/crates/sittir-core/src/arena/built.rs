//! A built record's render entry point. Its words were written outside the
//! native writer, so they are admitted as they cross in (`admit`), and the
//! parsed trees its cells link are held for the render.

use std::collections::HashMap;
use std::hash::BuildHasher;

use super::{admit, Address, ArenaError, ArenaRead, Cell, CellAt, HeldArenas, RecordGrammar, StringRef};
use crate::engine::{encode_handle, Engine, EngineGrammar, ParsedTree};
use crate::prepare::RenderContext;
use crate::render::{CoordinateError, RenderError, RenderResult, RenderSink};
use crate::slot::ChangedEdges;
use crate::trivia::{BuiltEntry, TriviaEntry};
use crate::trivia_store::{Place, TriviaStore};
use crate::trivia_table::TriviaSide;
use crate::types::{NodeIndex, TreeId};

/// What a built render starts from: a compound record, or a built leaf's
/// header record and the text its cells hold, which its record does not.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BuiltRoot {
    Record(Address),
    Leaf { record: Address, text: StringRef },
}

impl BuiltRoot {
    /// The record the root names, which holds its kind and its sides.
    #[must_use]
    pub fn record(self) -> Address {
        match self {
            Self::Record(at) | Self::Leaf { record: at, .. } => at,
        }
    }
}

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
        self.written().write_side(Place::Record(at.record()?), side, entries);
        Ok(())
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
        let kind = arena.header_kind(at)?;
        let units = self.written().units(at);
        units
            .into_iter()
            .map(|(word, item, trivia)| {
                let slot = G::slot_key(kind, word).ok_or(ArenaError::Malformed { what: "unit slot word", word })?;
                Ok(crate::layout::UnitSides { slot: slot.to_owned(), item, trivia })
            })
            .collect()
    }

    /// The units the built record at `at` in `arena` holds have the sides
    /// `units` gives, in place of every unit side it had; its render then
    /// writes them.
    ///
    /// # Errors
    ///
    /// What `ArenaRead::header_kind` refuses, and `ArenaError::UnknownSlot`
    /// for a slot the record's kind has no cell for.
    pub fn write_built_unit_sides(&self, arena: &impl ArenaRead, at: Address, units: Vec<crate::layout::UnitSides<G::Trivia>>) -> Result<(), ArenaError> {
        let kind = arena.header_kind(at)?;
        let units = units
            .into_iter()
            .map(|unit| {
                let word = G::slot_word(kind, &unit.slot).ok_or_else(|| ArenaError::UnknownSlot(unit.slot.clone().into_boxed_str()))?;
                Ok((word, unit.item, unit.trivia))
            })
            .collect::<Result<Vec<_>, ArenaError>>()?;
        self.written().write_units(at, units);
        Ok(())
    }

    /// The built node `root` names, of the built arena `arena`, rendered as
    /// a render root whose `changed` edges have no neighbour, under `ctx`,
    /// its line endings unspelled. The records it reaches are admitted
    /// first; each parsed tree a cell links is held from `trees` for the
    /// render, and every tree's source and every trivia
    /// entry's record are read through `ctx`'s table.
    ///
    /// # Errors
    ///
    /// `RenderError::Record` for an address naming no record and for words
    /// `admit` refuses, `RenderError::Coordinate` for a linked tree `trees`
    /// does not hold, else what the record's render refuses.
    pub fn render_built<H: BuildHasher>(
        &self,
        arena: &dyn ArenaRead,
        root: BuiltRoot,
        changed: ChangedEdges,
        trees: &HashMap<TreeId, ParsedTree<G>, H>,
        ctx: &RenderContext<'_>,
    ) -> Result<String, RenderError> {
        let (root, mut held) = admitted_root::<G, H>(arena, root, changed, trees)?;
        G::render_record(self.grammar(), root, &mut held, arena, self.written(), ctx)
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
    if arena.header_kind(record.at).map_err(RenderError::Record)? != record.kind {
        return Err(RenderError::Record(ArenaError::Malformed { what: "trivia entry kind", word: u32::from(record.kind.0) }));
    }
    let (root, mut held) = admitted_root::<G, H>(arena, BuiltRoot::Record(record.at), ChangedEdges::default(), trees)?;
    G::render_entry(grammar, root, &mut held, arena, store, ctx, w)
}

fn admitted_root<'t, G: RecordGrammar, H: BuildHasher>(
    arena: &dyn ArenaRead,
    root: BuiltRoot,
    changed: ChangedEdges,
    trees: &'t HashMap<TreeId, ParsedTree<G>, H>,
) -> Result<(CellAt, HeldArenas<'t>), RenderError> {
    let at = root.record();
    let kind = arena.header_kind(at).map_err(RenderError::Record)?;
    let linked = admit(arena, at, G::shape).map_err(RenderError::Record)?;
    let held = linked
        .into_iter()
        .map(|tree| {
            let parsed = trees.get(&tree).ok_or(CoordinateError::UnknownTree { handle: encode_handle(tree, NodeIndex::ROOT), tree_id: tree })?;
            Ok((tree, parsed.tree_arena()))
        })
        .collect::<Result<Vec<_>, CoordinateError>>()?;
    let cell = match root {
        BuiltRoot::Record(at) => Cell::Child { kind, at, link: None, changed },
        BuiltRoot::Leaf { record, text } => Cell::BuiltLeaf { kind, text, record },
    };
    Ok((CellAt { cell, tree: None, site: None }, HeldArenas::of(held)))
}
