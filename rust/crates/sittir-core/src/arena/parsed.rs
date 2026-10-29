//! A parsed tree's record entry points: a node's record, written on its
//! first read; a record rendered; and a chunk of the tree's arena, copied.
//! A record is named by its tree and its address together: the address
//! reads nothing once its tree is gone.

use super::{Address, Arena, ArenaRead, Cell, CellAt, HeldArenas, HydrateError, HydrateNode, RecordCells, RecordTrees, Row, SideRecord, TreeArena};
use crate::engine::{EngineGrammar, ParsedTree};
use crate::options::ResolvedOptions;
use crate::prepare::RenderContext;
use crate::read::Depth;
use crate::record::HEADER_WORDS;
use crate::render::{RenderError, SourceTable};
use crate::slot::{ChangedEdges, NodeCoordinate};
use crate::trivia_store::TriviaStore;
use crate::types::{KindId, NodeIndex};

/// A grammar's render of a record: its generated `render_record`.
pub trait RecordGrammar: EngineGrammar {
    /// Renders the record `root` names, prepared into a fresh overlay over
    /// the parsed trees' arenas `trees`, the built arena `built` and the
    /// store of written sides `store`, and answers its text before its line
    /// endings are spelled.
    ///
    /// # Errors
    ///
    /// What the record's prepare or render refuses.
    fn render_record(self, root: CellAt, trees: &mut dyn RecordTrees, built: &dyn ArenaRead, store: &TriviaStore<Self::Trivia>, ctx: &RenderContext<'_>) -> Result<String, RenderError>;

    /// Writes the built record `root` names into `w` as a trivia entry in
    /// the side that holds it: prepared into a fresh overlay of its own over
    /// the same arenas and store, under `ctx`, without its own leading and
    /// trailing sides, which are its neighbours in that side, and written
    /// where `w` stands, at its depth.
    ///
    /// # Errors
    ///
    /// As `render_record`.
    fn render_entry(self, root: CellAt, trees: &mut dyn RecordTrees, built: &dyn ArenaRead, store: &TriviaStore<Self::Trivia>, ctx: &RenderContext<'_>, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult;

    /// The record a node of `kind` is written as, `None` for a kind that has
    /// no record (`RecordCells::shape` of the grammar's node).
    fn shape(kind: KindId) -> Option<super::RecordShape>;

    /// The storage key of the slot a record of `kind` holds at `word`
    /// (`PrepareRecord::slot_key` of the grammar's node).
    fn slot_key(kind: KindId, word: u32) -> Option<&'static str>;

    /// The word a record of `kind` holds the slot `key` at
    /// (`PrepareRecord::slot_word` of the grammar's node).
    fn slot_word(kind: KindId, key: &str) -> Option<u32>;
}

impl<G: EngineGrammar> ParsedTree<G> {
    /// The record of the node at `index`: the one a read wrote, else the
    /// one its direct hydration `depth` levels down writes now, with the
    /// records of its ancestors no read wrote, each one level down (`reach`).
    /// `None` for a node that has no record: a parsed leaf or a unit, which
    /// its holder's cell holds whole, and an `ERROR` node, which is trivia of
    /// its tree.
    ///
    /// # Errors
    ///
    /// The read's refusal, naming the kind, and what the arena refuses.
    pub fn read_record<N: HydrateNode + RecordCells>(&self, index: NodeIndex, depth: Depth) -> Result<Option<Address>, String> {
        if self.read_error(index).is_some() {
            return Ok(None);
        }
        self.with_reads(|tree, cursor, ctx| super::reach::<N>(tree, cursor, ctx, index, depth, true))
    }

    /// Writes the records `depth` levels down from the node at `index` that
    /// no read has, reaching past records already written; a record already
    /// written stays as it is.
    ///
    /// # Errors
    ///
    /// What the hydration refuses.
    pub fn hydrate_record<N: HydrateNode + RecordCells>(&self, index: NodeIndex, depth: Depth) -> Result<Option<Address>, String> {
        if self.read_error(index).is_some() {
            return Ok(None);
        }
        self.with_reads(|tree, cursor, ctx| {
            let at = super::reach::<N>(tree, cursor, ctx, index, Depth::ONE, true)?;
            if let Some(at) = at {
                super::deepen::<N>(tree, cursor, ctx, at, depth)?;
            }
            Ok(at)
        })
    }

    /// The record the cell at `word`, item `item`, of the record `holder`
    /// names: on the first read through it, written `depth` levels down and
    /// the cell rewritten to name it (`read_cell`).
    ///
    /// # Errors
    ///
    /// What `read_cell` refuses.
    pub fn read_cell<N: HydrateNode + RecordCells>(&self, holder: Address, word: u32, item: u32, depth: Depth) -> Result<Address, String> {
        self.with_reads(|tree, cursor, ctx| super::read_cell::<N>(tree, cursor, ctx, holder, word, item, depth))
    }

    /// The record of the node at `index` a read wrote, or `None` while none has.
    #[must_use]
    pub fn written_record<N: HydrateNode + RecordCells>(&self, index: NodeIndex) -> Option<Address> {
        self.with_reads(|tree, cursor, ctx| super::reach::<N>(tree, cursor, ctx, index, Depth::ONE, false)).ok().flatten()
    }

    fn with_reads<R>(&self, f: impl FnOnce(&mut TreeArena, &mut tree_sitter::TreeCursor<'_>, &mut crate::read::ReadCtx<'_>) -> Result<R, HydrateError>) -> Result<R, String> {
        let grammar = self.grammar();
        let mut arena = self.tree_arena();
        let mut ctx = self.read_ctx();
        f(&mut arena, &mut self.tree().walk(), &mut ctx).map_err(|refusal| refusal.describe(&|kind| grammar.kind_name(kind)))
    }

    /// `f` of the words records fill in chunk `n` of the tree's arena,
    /// borrowed for the call, or `None` for a chunk the arena does not hold.
    /// A later read adds words after them, and rewrites a coordinate cell
    /// among them to name the record it writes.
    pub fn with_record_chunk<R>(&self, n: u32, f: impl FnOnce(&[u32]) -> R) -> Option<R> {
        self.tree_arena().arena().chunk(n).map(f)
    }

    /// The storage of chunk `n` of the tree's arena, every word of it, to
    /// share with a buffer JavaScript reads it through; `None` for a chunk
    /// the arena does not hold.
    #[must_use]
    pub fn record_chunk_memory(&self, n: u32) -> Option<std::sync::Arc<super::ChunkMem<u32>>> {
        self.tree_arena().arena().chunk_memory(n)
    }

    /// The bytes the tree's arena takes.
    #[must_use]
    pub fn arena_bytes(&self) -> usize {
        self.tree_arena().arena().allocated_bytes()
    }

    /// The words of chunk `n` of the tree's arena that records fill, copied:
    /// a later read that appends to the chunk leaves the copy as it was.
    #[must_use]
    pub fn record_chunk(&self, n: u32) -> Option<Vec<u32>> {
        self.with_record_chunk(n, <[u32]>::to_vec)
    }
}

impl<G: RecordGrammar> ParsedTree<G> {
    /// The hydrated typed nodes below `index`, in stored field order, as
    /// the coordinates of their rows. Excludes unit cells and captured
    /// strings.
    ///
    /// # Errors
    ///
    /// An unhydrated record, an invalid row or a malformed stored cell.
    pub fn record_candidates<N: HydrateNode + RecordCells>(
        &self,
        index: NodeIndex,
    ) -> Result<Vec<NodeCoordinate>, RenderError> {
        let refused = |what, word| RenderError::Record(super::ArenaError::Malformed { what, word });
        let coord = self
            .row_coordinate(index)
            .ok_or_else(|| refused("candidate row", index.0))?;
        let address = self.written_record::<N>(index);
        let root = match address {
            Some(at) => self.record_root(at, ChangedEdges::default())?.cell,
            None => Cell::Coordinate {
                kind: coord
                    .kind
                    .ok_or_else(|| refused("candidate kind", index.0))?,
                index,
                span: coord.span,
            },
        };
        let mut pending = vec![root];
        let mut seen = std::collections::HashSet::new();
        let mut candidates = Vec::new();
        while let Some(cell) = pending.pop() {
            match cell {
                Cell::Child {
                    kind,
                    at,
                    link: None,
                    ..
                } => {
                    if !seen.insert(at) {
                        continue;
                    }
                    let (root, row) = self.candidate_record(at)?;
                    if root.cell.kind() != Some(kind) {
                        return Err(refused("candidate record kind", at.0));
                    }
                    let mut coordinate = self
                        .row_coordinate(row.index)
                        .ok_or_else(|| refused("candidate row", row.index.0))?;
                    coordinate.kind = Some(kind);
                    coordinate.end = row.end;
                    coordinate.span = row.span;
                    candidates.push(coordinate);
                    let record = N::shape(kind)
                        .ok_or_else(|| refused("candidate record shape", u32::from(kind.0)))?;
                    let first = pending.len();
                    super::admit::for_each_parsed_cell(self.tree_arena().arena(), at, record, G::KIND_BITS, |child, _| {
                        pending.push(child);
                        Ok(())
                    })
                    .map_err(RenderError::Record)?;
                    pending[first..].reverse();
                }
                Cell::Coordinate { kind, index, span } => {
                    let node = crate::engine::node_at_index(self.tree(), index)
                        .ok_or_else(|| refused("candidate row", index.0))?;
                    if self.grammar().unit_id(&mut node.walk()).is_some() {
                        continue;
                    }
                    let shape = N::shape(kind)
                        .ok_or_else(|| refused("candidate record shape", u32::from(kind.0)))?;
                    if shape.words > HEADER_WORDS || !shape.cells.is_empty() {
                        return Err(refused("unhydrated candidate record", index.0));
                    }
                    let mut coordinate = self
                        .row_coordinate(index)
                        .ok_or_else(|| refused("candidate row", index.0))?;
                    coordinate.kind = Some(kind);
                    coordinate.span = span;
                    candidates.push(coordinate);
                }
                Cell::ParsedLeaf { kind, span, row } => {
                    let mut coordinate = self
                        .row_coordinate(row)
                        .ok_or_else(|| refused("candidate row", row.0))?;
                    coordinate.kind = Some(kind);
                    coordinate.span = span;
                    candidates.push(coordinate);
                }
                Cell::Absent | Cell::Unit { .. } | Cell::ParsedText { .. } => {}
                _ => return Err(refused("built cell in parsed candidates", index.0)),
            }
        }
        Ok(candidates)
    }

    /// The record at `at` of the tree's arena, rendered as a render root
    /// whose `changed` edges have no neighbour (the edges a node crossing as
    /// its coordinate marks), under `options`, its line endings unspelled,
    /// through `sources`: the call's table, which holds this tree among the
    /// others its trivia entries reach, and renders their built records.
    ///
    /// # Errors
    ///
    /// `RenderError::Record` for an address that names no record of the
    /// arena: none, past what it wrote, or a header naming no kind the
    /// grammar writes a record of; else what the record's render refuses.
    pub fn render_record(&self, at: Address, changed: ChangedEdges, options: &ResolvedOptions, sources: &dyn SourceTable) -> Result<String, RenderError> {
        self.render_cell(self.record_root(at, changed)?, options, sources)
    }

    /// Renders the parsed candidate at row `index` without its outer trivia:
    /// the row's record, which stays native, or, for a recordless leaf, the
    /// same coordinate cell as a slot holds. Every other lookup is
    /// `sources`', the call's table, as `render_record` reads it.
    /// Only the candidate's own outer sides are omitted; the frames its
    /// edge items hold remain part of its content.
    ///
    /// # Errors
    ///
    /// An invalid row, or a refused prepare or render.
    pub fn render_candidate<N: HydrateNode + RecordCells>(
        &self,
        index: NodeIndex,
        options: &ResolvedOptions,
        sources: &dyn SourceTable,
    ) -> Result<String, RenderError> {
        let refused = || RenderError::Record(super::ArenaError::Malformed { what: "candidate row", word: index.0 });
        let coord = self.row_coordinate(index).ok_or_else(refused)?;
        let record = self.written_record::<N>(index);
        let root = if let Some(at) = record {
            self.record_root(at, ChangedEdges::default())?
        } else {
            CellAt {
                cell: Cell::Coordinate {
                    kind: coord.kind.ok_or_else(refused)?,
                    index,
                    span: coord.span,
                },
                tree: Some(self.tree_id()),
                site: None,
            }
        };
        self.render_cell(root, options, &CandidateSources { sources, tree: self, index })
    }

    fn candidate_record(&self, at: Address) -> Result<(CellAt, Row), RenderError> {
        let root = self.record_root(at, ChangedEdges::default())?;
        let arena = self.tree_arena();
        let header = arena
            .arena()
            .words(at, HEADER_WORDS)
            .map_err(RenderError::Record)?;
        let row = SideRecord::read(arena.arena(), Address(header[1]))
            .map_err(RenderError::Record)?
            .at
            .ok_or(RenderError::Record(super::ArenaError::Malformed {
                what: "candidate record row",
                word: at.0,
            }))?;
        Ok((root, row))
    }

    fn record_root(&self, at: Address, changed: ChangedEdges) -> Result<CellAt, RenderError> {
        let kind = {
            let arena = self.tree_arena();
            let kind = arena.arena().header_kind(at, G::KIND_BITS).map_err(RenderError::Record)?;
            if !arena.contains_record(at) {
                return Err(RenderError::Record(super::ArenaError::Malformed { what: "record address", word: at.0 }));
            }
            kind
        };
        Ok(CellAt {
            cell: Cell::Child {
                kind,
                at,
                link: None,
                changed,
            },
            tree: Some(self.tree_id()),
            site: None,
        })
    }

    fn render_cell(
        &self,
        root: CellAt,
        options: &ResolvedOptions,
        sources: &dyn SourceTable,
    ) -> Result<String, RenderError> {
        let ctx = RenderContext { options, sources };
        let mut arenas = HeldArenas::of([(self.tree_id(), self.tree_arena())]);
        self.grammar().render_record(root, &mut arenas, &Arena::new(), self.written(), &ctx)
    }
}

/// The table a candidate renders through: `sources`', except that the
/// candidate, the node at `index` of `tree`, has no outer sides.
struct CandidateSources<'a, G: EngineGrammar> {
    sources: &'a dyn SourceTable,
    tree: &'a ParsedTree<G>,
    index: NodeIndex,
}

impl<G: EngineGrammar> CandidateSources<'_, G> {
    fn is_root(&self, coord: &NodeCoordinate) -> bool {
        coord.tree == self.tree.tree_id() && coord.index == self.index
    }
}

impl<G: EngineGrammar> SourceTable for CandidateSources<'_, G> {
    fn source_of(&self, tree: crate::types::TreeId) -> Option<&std::sync::Arc<str>> {
        self.sources.source_of(tree)
    }

    fn kind_of(&self, coord: &NodeCoordinate) -> Option<KindId> {
        self.sources.kind_of(coord)
    }

    fn line_starts_inside_tokens(&self, coord: &NodeCoordinate) -> Vec<u32> {
        self.sources.line_starts_inside_tokens(coord)
    }

    fn last_list_child_kind(
        &self,
        tree: crate::types::TreeId,
        span: crate::types::Span,
        kind: KindId,
    ) -> Option<KindId> {
        self.sources.last_list_child_kind(tree, span, kind)
    }

    fn for_each_edge_level(&self, coord: &NodeCoordinate, side: crate::options::Side, f: &mut dyn FnMut(crate::render::EdgeLevel)) {
        self.sources.for_each_edge_level(coord, side, f);
    }

    fn depth_move(&self, coord: &NodeCoordinate) -> i32 {
        self.sources.depth_move(coord)
    }

    fn sides(&self, coord: &NodeCoordinate) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        let sides = self.sources.sides(coord)?;
        if !self.is_root(coord) {
            return Some(sides);
        }
        let mut sides = sides
            .into_any()
            .downcast::<crate::trivia::NodeTrivia<G::Trivia>>()
            .ok()?;
        sides.leading = Some(Vec::new());
        sides.trailing = Some(Vec::new());
        Some(sides)
    }

    fn frames(&self, coord: &NodeCoordinate) -> crate::trivia::Frames {
        let mut frames = self.sources.frames(coord);
        if self.is_root(coord) {
            frames.own = self.sides(coord);
        }
        frames
    }

    fn slot_layouts(&self, coord: &NodeCoordinate) -> Vec<crate::layout::SlotLayout> {
        self.sources.slot_layouts(coord)
    }

    fn separator_before(&self, coord: &NodeCoordinate) -> Option<KindId> {
        self.sources.separator_before(coord)
    }

    fn framed_span(&self, coord: &NodeCoordinate) -> crate::types::Span {
        if self.is_root(coord) {
            coord.span
        } else {
            self.sources.framed_span(coord)
        }
    }

    fn edited_within(&self, coord: &NodeCoordinate) -> bool {
        self.sources.edited_within(coord)
    }

    fn renders_as_source(&self, coord: &NodeCoordinate) -> bool {
        self.sources.renders_as_source(coord)
    }

    fn seat_through(
        &self,
        coord: &NodeCoordinate,
        wrappers: &[Option<crate::options::SeatPath>],
        seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>,
    ) -> Option<crate::types::SiteId> {
        self.sources.seat_through(coord, wrappers, seat)
    }

    fn read_ctx(
        &self,
        tree: crate::types::TreeId,
    ) -> Option<(&tree_sitter::Tree, crate::read::ReadCtx<'_>)> {
        self.sources.read_ctx(tree)
    }

    fn render_record_entry(&self, record: crate::trivia::BuiltEntry, held: &dyn std::any::Any, options: &ResolvedOptions, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult {
        self.sources.render_record_entry(record, held, options, w)
    }
}
