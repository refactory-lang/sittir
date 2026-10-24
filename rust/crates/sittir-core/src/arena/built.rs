//! A built record's render entry point. Its words were written outside the
//! native writer, so they are admitted as they cross in (`admit`), and the
//! parsed trees its cells link are held for the render.

use std::collections::HashMap;
use std::hash::BuildHasher;

use super::{admit, Address, ArenaError, ArenaRead, Cell, CellAt, HeldArenas, RecordGrammar, RecordShape};
use crate::engine::{encode_handle, Engine, EngineGrammar, ParsedTree};
use crate::options::ResolvedOptions;
use crate::prepare::RenderContext;
use crate::render::{CoordinateError, RenderError};
use crate::slot::{ChangedEdges, SlotValue};
use crate::trivia::{BuiltEntry, FromTriviaText, SideWrite, TriviaEntry, TriviaText};
use crate::trivia_store::Place;
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
        self.written().write_side(Place::Record(at.record()?), side, entries);
        Ok(())
    }
}

impl<G: RecordGrammar> Engine<G> {
    /// The record at `at` of the built arena `arena` rendered as a render
    /// root whose `changed` edges have no neighbour, under `options`, its
    /// line endings unspelled. The records it reaches are admitted first,
    /// their shapes by `shape`; each parsed tree a cell links is held from
    /// `trees` for the render, and every tree's source is read from `trees`.
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
        shape: fn(KindId) -> Option<RecordShape>,
        trees: &HashMap<TreeId, ParsedTree<G>, H>,
        options: &ResolvedOptions,
    ) -> Result<String, RenderError> {
        let (root, mut held) = admitted_root(arena, at, changed, shape, trees)?;
        G::render_record(self.grammar(), root, &mut held, arena, self.written(), &RenderContext { options, sources: trees })
    }

    /// `entries` as a side write stores them: each built record stamped with
    /// the text it renders as an entry (`RecordGrammar::render_entry`), under
    /// `options` over the engine's, as `render_built` renders a record of
    /// `arena`, beside the record it names. A record is immutable, so its
    /// text is a fact of it, written once.
    ///
    /// # Errors
    ///
    /// What `render_built` refuses of a record, and a record whose header
    /// names a kind other than its entry's.
    pub fn stamp_side<H: BuildHasher>(
        &self,
        arena: &dyn ArenaRead,
        entries: Vec<SideWrite<G::Trivia>>,
        shape: fn(KindId) -> Option<RecordShape>,
        trees: &HashMap<TreeId, ParsedTree<G>, H>,
        options: &ResolvedOptions,
    ) -> Result<Vec<TriviaEntry<G::Trivia>>, RenderError> {
        entries
            .into_iter()
            .map(|entry| match entry {
                SideWrite::Entry(entry) => Ok(entry),
                SideWrite::Built(record @ BuiltEntry { kind, at }) => {
                    let header = arena.header_kind(at).map_err(RenderError::Record)?;
                    if header != kind {
                        return Err(RenderError::Record(ArenaError::Malformed { what: "trivia entry kind", word: u32::from(kind.0) }));
                    }
                    let (root, mut held) = admitted_root(arena, at, ChangedEdges::default(), shape, trees)?;
                    let text = G::render_entry(self.grammar(), root, &mut held, arena, self.written(), &RenderContext { options, sources: trees })?;
                    let mut entry = TriviaEntry::new(SlotValue::Node(G::Trivia::from_text(TriviaText::of(kind, &text))));
                    entry.record = Some(record);
                    Ok(entry)
                }
            })
            .collect()
    }

}

fn admitted_root<'t, G: EngineGrammar, H: BuildHasher>(
    arena: &dyn ArenaRead,
    at: Address,
    changed: ChangedEdges,
    shape: fn(KindId) -> Option<RecordShape>,
    trees: &'t HashMap<TreeId, ParsedTree<G>, H>,
) -> Result<(CellAt, HeldArenas<'t>), RenderError> {
    let kind = arena.header_kind(at).map_err(RenderError::Record)?;
    let linked = admit(arena, at, shape).map_err(RenderError::Record)?;
    let held = linked
        .into_iter()
        .map(|tree| {
            let parsed = trees.get(&tree).ok_or(CoordinateError::UnknownTree { handle: encode_handle(tree, NodeIndex::ROOT), tree_id: tree })?;
            Ok((tree, parsed.tree_arena()))
        })
        .collect::<Result<Vec<_>, CoordinateError>>()?;
    Ok((CellAt { cell: Cell::Child { kind, at, link: None, changed }, tree: None, site: None }, HeldArenas::of(held)))
}
