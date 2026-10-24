//! A parsed tree's record entry points: a node's record, written on its
//! first read; a record rendered; and a chunk of the tree's arena, copied.
//! A record is named by its tree and its address together: the address
//! reads nothing once its tree is gone.

use super::{
    Address, Arena, ArenaRead, Cell, CellAt, HeldArenas, RecordCells, RecordTrees, Row, SideRecord, WriteCell,
};
use crate::engine::{EngineGrammar, ParsedTree};
use crate::options::ResolvedOptions;
use crate::prepare::RenderContext;
use crate::read::{Depth, ReadNode};
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

    /// Renders the built record `root` names as the text of a trivia entry:
    /// as `render_record` renders it, its end holding no line break, since
    /// the entry writes its kind's line end after the text.
    ///
    /// # Errors
    ///
    /// As `render_record`.
    fn render_entry(self, root: CellAt, trees: &mut dyn RecordTrees, built: &dyn ArenaRead, store: &TriviaStore<Self::Trivia>, ctx: &RenderContext<'_>) -> Result<String, RenderError>;
}

impl<G: EngineGrammar> ParsedTree<G> {
    /// The record of the node at `index`: the one a read wrote, else the
    /// one its read `depth` levels down writes now. `None` for a node that
    /// has no record: a parsed leaf, which its holder's cell holds whole, and
    /// an `ERROR` node, which is trivia of its tree.
    ///
    /// # Errors
    ///
    /// The read's refusal, naming the kind, and what the record writer
    /// refuses.
    pub fn read_record<N: ReadNode + WriteCell<G::Trivia>>(&self, index: NodeIndex, depth: Depth) -> Result<Option<Address>, String> {
        self.materialize_record::<N>(index, depth, false)
    }

    /// Materializes records to `depth` without exporting their words. A
    /// deeper request reaches children of records already written; published
    /// records and their addresses remain unchanged.
    ///
    /// # Errors
    ///
    /// What the native read or a record writer refuses.
    pub fn hydrate_record<N: ReadNode + WriteCell<G::Trivia>>(
        &self,
        index: NodeIndex,
        depth: Depth,
    ) -> Result<Option<Address>, String> {
        self.materialize_record::<N>(index, depth, true)
    }

    fn materialize_record<N: ReadNode + WriteCell<G::Trivia>>(
        &self,
        index: NodeIndex,
        depth: Depth,
        hydrate: bool,
    ) -> Result<Option<Address>, String> {
        if !hydrate {
            if let Some(at) = self.tree_arena().record(index) {
                return Ok(Some(at));
            }
        }
        if self.read_error(index).is_some() {
            return Ok(None);
        }
        let grammar = self.grammar();
        let node: N = self.read(index, depth).map_err(|refusal| refusal.describe(&|kind| grammar.kind_name(kind)))?;
        let mut arena = self.tree_arena();
        let mut sink = super::RecordSink::parsed(self.tree_id(), &mut arena);
        if hydrate {
            node.hydrate_records(&mut sink)
        } else {
            node.write_cell(&mut sink).map(|_| ())
        }
        .map_err(|refusal| refusal.to_string())?;
        Ok(arena.record(index))
    }

    /// The words of chunk `n` of the tree's arena that records fill, copied:
    /// a later read that appends to the chunk leaves the copy as it was.
    #[must_use]
    pub fn record_chunk(&self, n: u32) -> Option<Vec<u32>> {
        self.tree_arena().arena().chunk(n).map(<[u32]>::to_vec)
    }
}

impl<G: RecordGrammar> ParsedTree<G> {
    /// The hydrated typed nodes below `index`, in stored field order, as
    /// coordinates and optional record addresses. Includes nested content
    /// sharing a row, and excludes unit cells and captured strings.
    ///
    /// # Errors
    ///
    /// An unhydrated record, an invalid row or a malformed stored cell.
    pub fn record_candidates<N: RecordCells>(
        &self,
        index: NodeIndex,
    ) -> Result<Vec<(NodeCoordinate, Option<Address>)>, RenderError> {
        let refused = |what, word| RenderError::Record(super::ArenaError::Malformed { what, word });
        let coord = self
            .row_coordinate(index)
            .ok_or_else(|| refused("candidate row", index.0))?;
        let address = self.tree_arena().record(index);
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
                    candidates.push((coordinate, Some(at)));
                    let record = N::shape(kind)
                        .ok_or_else(|| refused("candidate record shape", u32::from(kind.0)))?;
                    let first = pending.len();
                    super::admit::for_each_cell(self.tree_arena().arena(), at, record, at, |child, _| {
                        pending.push(child);
                        Ok(())
                    })
                    .map_err(RenderError::Record)?;
                    pending[first..].reverse();
                }
                Cell::Coordinate { kind, index, span } => {
                    if let Some(at) = self.tree_arena().record(index) {
                        pending.push(Cell::Child {
                            kind,
                            at,
                            link: None,
                            changed: ChangedEdges::default(),
                        });
                    } else {
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
                        candidates.push((coordinate, None));
                    }
                }
                Cell::ParsedLeaf { kind, span, row } => {
                    let mut coordinate = self
                        .row_coordinate(row)
                        .ok_or_else(|| refused("candidate row", row.0))?;
                    coordinate.kind = Some(kind);
                    coordinate.span = span;
                    candidates.push((coordinate, None));
                }
                Cell::Absent | Cell::Unit { .. } | Cell::ParsedText { .. } => {}
                _ => return Err(refused("built cell in parsed candidates", index.0)),
            }
        }
        Ok(candidates)
    }

    /// The record at `at` of the tree's arena, rendered as a render root
    /// whose `changed` edges have no neighbour (the edges a node crossing as
    /// its coordinate marks), under `options`, its line endings unspelled.
    ///
    /// # Errors
    ///
    /// `RenderError::Record` for an address that names no record of the
    /// arena: none, past what it wrote, or a header naming no kind the
    /// grammar writes a record of; else what the record's render refuses.
    pub fn render_record(&self, at: Address, changed: ChangedEdges, options: &ResolvedOptions) -> Result<String, RenderError> {
        self.render_cell(self.record_root(at, changed)?, options, self)
    }

    /// Renders a parsed candidate without its outer trivia. Its record stays
    /// native; a recordless leaf uses the same coordinate cell as a slot does.
    ///
    /// # Errors
    ///
    /// An invalid row or record address, or a refused prepare or render.
    pub fn render_candidate(
        &self,
        index: NodeIndex,
        at: Option<Address>,
        options: &ResolvedOptions,
    ) -> Result<String, RenderError> {
        let refused = || {
            RenderError::Record(super::ArenaError::Malformed {
                what: "candidate row or address",
                word: at.unwrap_or(Address::NONE).0,
            })
        };
        let coord = self.row_coordinate(index).ok_or_else(refused)?;
        let root = if let Some(at) = at {
            let (root, row) = self.candidate_record(at)?;
            if row.index != index {
                return Err(refused());
            }
            root
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
        self.render_cell(root, options, &CandidateSources { tree: self, index })
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
            let kind = arena.arena().header_kind(at).map_err(RenderError::Record)?;
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

struct CandidateSources<'a, G: EngineGrammar> {
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
        self.tree.source_of(tree)
    }

    fn kind_of(&self, coord: &NodeCoordinate) -> Option<KindId> {
        self.tree.kind_of(coord)
    }

    fn line_starts_inside_tokens(&self, coord: &NodeCoordinate) -> Vec<u32> {
        self.tree.line_starts_inside_tokens(coord)
    }

    fn last_list_child_kind(
        &self,
        tree: crate::types::TreeId,
        span: crate::types::Span,
        kind: KindId,
    ) -> Option<KindId> {
        self.tree.last_list_child_kind(tree, span, kind)
    }

    fn for_each_kind_ending_with(&self, coord: &NodeCoordinate, f: &mut dyn FnMut(KindId)) {
        self.tree.for_each_kind_ending_with(coord, f);
    }

    fn depth_move(&self, coord: &NodeCoordinate) -> i32 {
        self.tree.depth_move(coord)
    }

    fn sides(&self, coord: &NodeCoordinate) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
        let sides = self.tree.sides(coord)?;
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
        if self.is_root(coord) {
            crate::trivia::Frames::default()
        } else {
            self.tree.frames(coord)
        }
    }

    fn slot_layouts(&self, coord: &NodeCoordinate) -> Vec<crate::layout::SlotLayout> {
        SourceTable::slot_layouts(self.tree, coord)
    }

    fn separator_before(&self, coord: &NodeCoordinate) -> Option<KindId> {
        SourceTable::separator_before(self.tree, coord)
    }

    fn framed_span(&self, coord: &NodeCoordinate) -> crate::types::Span {
        if self.is_root(coord) {
            coord.span
        } else {
            self.tree.framed_span(coord)
        }
    }

    fn edited_within(&self, coord: &NodeCoordinate) -> bool {
        SourceTable::edited_within(self.tree, coord)
    }

    fn renders_as_source(&self, coord: &NodeCoordinate) -> bool {
        self.tree.renders_as_source(coord)
    }

    fn seat_through(
        &self,
        coord: &NodeCoordinate,
        wrappers: &[Option<crate::options::SeatPath>],
        seat: &dyn Fn(KindId) -> Option<crate::types::SiteId>,
    ) -> Option<crate::types::SiteId> {
        self.tree.seat_through(coord, wrappers, seat)
    }

    fn read_ctx(
        &self,
        tree: crate::types::TreeId,
    ) -> Option<(&tree_sitter::Tree, crate::read::ReadCtx<'_>)> {
        self.tree.read_ctx(tree)
    }
}
