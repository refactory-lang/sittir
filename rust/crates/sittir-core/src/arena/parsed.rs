//! A parsed tree's record entry points: a node's record, written on its
//! first read; a record rendered; and a chunk of the tree's arena, copied.
//! A record is named by its tree and its address together: the address
//! reads nothing once its tree is gone.

use crate::tree_sitter;
use super::{Address, Arena, ArenaRead, Cell, CellAt, HeldArenas, HydrateError, HydrateNode, RecordCells, RecordTrees, SideRecord, TreeArena};
use crate::engine::{EngineGrammar, ParsedTree};
use crate::nodes::{Nodes, RecordNodes, TreeNodes};
use crate::options::{ResolvedOptions, Side};
use crate::prepare::RenderContext;
use crate::read::Depth;
use crate::record::HEADER_WORDS;
use crate::render::{RenderError, SourceTable};
use crate::slot::ChangedEdges;
use crate::trivia_store::TriviaStore;
use crate::types::{KindId, NodeIndex};

/// Whether a tree's record backer answers its nodes as its tree backer does
/// (`ParsedTree::backer_parity`): the nodes compared, how many differ, and
/// the first that does.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct BackerParity {
    pub nodes: u32,
    pub differing: u32,
    pub first: Option<u32>,
}

/// What a parsed node with no record reads as (`ParsedTree::read_leaf`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LeafRead {
    /// A leaf: its kind and byte span, its text its source's there.
    Leaf { kind: KindId, span: crate::types::Span },
    /// A unit: the kind its holder's slot stores, which it reads as.
    Unit(KindId),
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for BackerParity {
    /// `{ nodes, differing, first? }`, `first` only when a node differs.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with_present, present};
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe {
            object_with_present(env, &[
                present(env, c"nodes", Some(val.nodes))?,
                present(env, c"differing", Some(val.differing))?,
                present(env, c"first", val.first)?,
            ])
        }
    }
}

/// Whether `records` and `nodes` answer the node at `index` alike: its
/// facts, children, children at each edge (the first and last it lists)
/// and parent, whether it is `MISSING` and whether it holds an error.
fn agree(records: &mut dyn Nodes<'_>, nodes: &mut dyn Nodes<'_>, index: NodeIndex) -> bool {
    let kids = nodes.kids(index);
    let edges = [(Side::Before, kids.first().copied()), (Side::After, kids.last().copied())];
    records.kid(index) == nodes.kid(index)
        && *records.kids(index) == *kids
        && edges.into_iter().all(|(side, edge)| records.edge(index, side) == edge && nodes.edge(index, side) == edge)
        && records.parent(index) == nodes.parent(index)
        && records.missing(index) == nodes.missing(index)
        && records.holds_error(index) == nodes.holds_error(index)
}

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
    fn render_record(self, root: CellAt, trees: &mut dyn RecordTrees, built: &dyn ArenaRead, store: &TriviaStore<Self::Trivia>, ctx: &RenderContext<'_>, recording: Option<Recording<'_>>) -> Result<String, RenderError>;

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

/// A recording render of a parsed record (`RecordGrammar::render_record`),
/// as the reader's render records the node a read gives it
/// (`EngineGrammar::render_read`): the nodes it renders from their
/// templates, and what it records what it writes into. It writes no text.
pub struct Recording<'b> {
    pub templates: super::Templates,
    pub baseline: &'b mut crate::baseline::Baseline,
}

impl<'b> Recording<'b> {
    /// What a render renders from its templates and records into: none of
    /// either for a render that records nothing.
    #[must_use]
    pub fn parts(recording: Option<Self>) -> (Option<super::Templates>, Option<&'b mut crate::baseline::Baseline>) {
        recording.map_or((None, None), |Self { templates, baseline }| (Some(templates), Some(baseline)))
    }
}

/// The record a recording render renders (`render_record_read`): the node at
/// `index` of tree `tree`, from its templates `depth` levels down, over the
/// parsed trees' arenas `arenas`, which another render lent and which hold
/// every row and record of the tree.
#[derive(Clone, Copy)]
pub struct RecordRead<'a> {
    pub tree: crate::types::TreeId,
    pub index: NodeIndex,
    pub depth: Depth,
    pub arenas: &'a dyn super::RecordArenas,
}

/// Renders the node `read` names from its templates, read only, as the
/// reader's render renders the node a read `depth` levels down gives it,
/// under `render`, recording into `baseline` (`Lookups::recorded`): from the
/// cell the tree's rows reach for it (`written`), its record or, for a leaf
/// or a unit, its holder's cell, its sides from the store `store`. A node no
/// cell names in a tree read whole is one the records keep no value of (a
/// token, a pinned slot's value): its holder's template writes it, so it
/// records nothing of its own, and its runs are measured in its holder's
/// region (`Lookups::baseline_gap`).
///
/// # Errors
///
/// What the render refuses, naming the kinds it names.
pub fn render_record_read<G: RecordGrammar, N: RecordCells>(grammar: G, read: RecordRead<'_>, store: &TriviaStore<G::Trivia>, render: &RenderContext<'_>, baseline: &mut crate::baseline::Baseline) -> Result<(), String> {
    let RecordRead { tree, index, depth, arenas } = read;
    let describe = |error: super::ArenaError| match error {
        super::ArenaError::ReadOnly { index, kind } => format!("a render over arenas lent read-only met node {} ({}), which has no record to read", index.0, grammar.kind_name(kind)),
        error => error.to_string(),
    };
    let arena = arenas.tree(tree).ok_or_else(|| format!("no arena of tree {} was lent", tree.0))?;
    let Some(cell) = super::written::<N>(arena, index).map_err(describe)? else { return Ok(()) };
    let root = CellAt { cell, tree: Some(tree), site: None };
    let recording = Recording { templates: super::Templates { tree, root: index, depth }, baseline };
    match grammar.render_record(root, &mut super::ReadArenas(arenas), &Arena::new(), store, render, Some(recording)) {
        Ok(_) => Ok(()),
        Err(RenderError::Record(error)) => Err(describe(error)),
        Err(error) => Err(error.to_string()),
    }
}

impl<G: EngineGrammar> ParsedTree<G> {
    /// The record of the node at `index`: the one a read wrote, else the
    /// one its direct hydration `depth` levels down writes now, with the
    /// records of its ancestors no read wrote, each one level down (`reach`).
    /// `None` for a node that has no record: a parsed leaf or a unit, which
    /// its holder's cell holds whole, and an `ERROR` node, which is trivia of
    /// its tree; the first read in a tree whose root is an `ERROR` writes
    /// its rows (`meet_error`).
    ///
    /// # Errors
    ///
    /// The read's refusal, naming the kind, and what the arena refuses.
    pub fn read_record<N: HydrateNode + RecordCells>(&self, index: NodeIndex, depth: Depth) -> Result<Option<Address>, String> {
        if self.meet_error(index)? {
            return Ok(None);
        }
        if let Some(cell) = self.written::<N>(index)? {
            return Ok(super::reach::record_of_cell(cell));
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
        if self.meet_error(index)? {
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
        if self.tree_arena().node_rows().is_some() {
            return self.written::<N>(index).ok().flatten().and_then(super::reach::record_of_cell);
        }
        self.with_reads(|tree, cursor, ctx| super::reach::<N>(tree, cursor, ctx, index, Depth::ONE, false)).ok().flatten()
    }

    /// The cell that names the node at `index` as the reads so far wrote it,
    /// found by the tree's rows once it holds every one (`written`).
    fn written<N: RecordCells>(&self, index: NodeIndex) -> Result<Option<Cell>, String> {
        super::written::<N>(&self.tree_arena(), index).map_err(|error| error.to_string())
    }

    /// The parsed node at `index` that has no record, read as the tree's rows
    /// and records stamp it, with no cursor: where its holder's record holds
    /// it in a cell (`written`), that cell's leaf or unit; else its row
    /// (`row_leaf`). `None` for a node with a record of its own, a node
    /// neither answers, and a tree no whole read hydrated.
    ///
    /// # Errors
    ///
    /// What the arena refuses of the records it reads.
    pub fn read_leaf<N: RecordCells + crate::read::ReadNode>(&self, index: NodeIndex) -> Result<Option<LeafRead>, super::ArenaError> {
        let cell = super::written::<N>(&self.tree_arena(), index)?;
        Ok(match cell {
            Some(Cell::ParsedLeaf { kind, span, .. }) => Some(LeafRead::Leaf { kind, span }),
            Some(Cell::Unit { kind, .. }) => Some(LeafRead::Unit(kind)),
            Some(Cell::Child { .. }) => None,
            _ => self.row_leaf::<N>(index),
        })
    }

    /// The named node at `index` that `N` reads (`ReadNode::admits`) and no
    /// `ERROR` holds, as its row stamps it once the tree's rows are
    /// published: the unit `N` reads it as (`ReadNode::unit_id`), else, for a
    /// text leaf, which `N` reads routing no slots (`ReadNode::router`), a
    /// leaf of its stamped kind and span (`row_coordinate`); `None` for any
    /// other, such as an envelope whose record no read has written yet.
    fn row_leaf<N: crate::read::ReadNode>(&self, index: NodeIndex) -> Option<LeafRead> {
        let crate::nodes::Navigation::Records(mut nodes) = self.nodes() else { return None };
        let kid = nodes.kid(index);
        if !kid.named || !N::admits(kid.grammar, kid.display) || self.read_error(index).is_some() {
            return None;
        }
        if let Some(kind) = N::unit_id(&mut nodes, &kid) {
            return Some(LeafRead::Unit(kind));
        }
        if N::router(kid.grammar, kid.display).is_some() {
            return None;
        }
        let at = self.row_coordinate(index)?;
        Some(LeafRead::Leaf { kind: at.kind?, span: at.span })
    }

    /// What a view of the parsed record at `at` names it by, read without
    /// its chunk: `[header, row, end, span start, span end, kind]`, the
    /// record's header word, the row and byte span its side record stamps,
    /// and that row's subtree end and kind as a read of the tree names them
    /// (`row_coordinate`).
    ///
    /// # Errors
    ///
    /// What reading the record or its side record refuses, and a record whose
    /// side record stamps no row.
    pub fn record_stub(&self, at: Address) -> Result<[u32; 6], String> {
        let (header, row) = {
            let arena = self.tree_arena();
            let words = at.record().and_then(|at| arena.arena().words(at, HEADER_WORDS)).map_err(|e| e.to_string())?;
            let header = words[0];
            let side = SideRecord::read(arena.arena(), Address(words[1])).map_err(|e| e.to_string())?;
            (header, side.at.ok_or_else(|| format!("the parsed record at {} has no side record that stamps its row", at.0))?)
        };
        let coordinate = self.row_coordinate(row.index).ok_or_else(|| format!("the tree has no node {}", row.index.0))?;
        let kind = coordinate.kind.ok_or_else(|| format!("node {} has no stamped kind", row.index.0))?;
        Ok([header, row.index.0, coordinate.end.0, row.span.start, row.span.end, u32::from(kind.0)])
    }

    /// The tree hydrated whole as `N` (`hydrate_record`), past any record a
    /// shallower read wrote, then each node compared as its record backer
    /// (`RecordNodes`) and its tree backer (`TreeNodes`) answer it, and as
    /// the records and a typed read of the tree answer its unit sides and
    /// its leaf read (`reads_agree`), and, for an extra, whether its tree
    /// holds its record (`extra_agrees`). A diagnostic.
    ///
    /// # Errors
    ///
    /// The hydration's refusal, one that leaves some node with no row, and
    /// what reading a leaf from the records or walking an extra alone
    /// refuses.
    pub fn backer_parity<N>(&self) -> Result<BackerParity, String>
    where
        N: HydrateNode + RecordCells + crate::prepare::Prepare + crate::read::HasLayout<Option<Box<crate::layout::NodeLayout<G::Trivia>>>>,
        G::Trivia: PartialEq,
    {
        self.hydrate_record::<N>(NodeIndex::ROOT, Depth::All)?;
        let facts = {
            let arena = self.tree_arena();
            let mut records = RecordNodes::new(&arena, self.source()).ok_or("the whole read left a node with no row")?;
            let work = crate::layout::LayoutWorkCounter::default();
            let mut nodes = TreeNodes::new(self.tree(), self.source(), &work);
            (0..nodes.kid(NodeIndex::ROOT).count)
                .map(NodeIndex)
                .map(|index| (agree(&mut records, &mut nodes, index), records.kid(index)))
                .collect::<Vec<_>>()
        };
        let runs = {
            let mut whole = super::BuiltChunks::new(G::KIND_BITS, N::shape);
            let grammar = self.grammar();
            let root = match self.read_error(NodeIndex::ROOT) {
                Some(_) => None,
                None => super::hydrate_whole::<N>(&mut self.tree().walk(), &mut self.read_ctx(), None, grammar.surface_kinds(), &mut super::ReadWriter::new(&mut whole)).map_err(|refusal| refusal.describe(&|kind| grammar.kind_name(kind)))?,
            };
            let arena = self.tree_arena();
            let rows = arena.node_rows().ok_or("the whole read left a node with no row")?;
            match root {
                Some(root) => {
                    let mut agree = vec![false; rows.len() as usize];
                    let mut runs = super::RunNodes::new(&whole, self.source(), root).map_err(|refusal| refusal.to_string())?;
                    let mut records = RecordNodes::over(rows, self.source());
                    let kinds = grammar.surface_kinds();
                    let members = crate::trivia_table::DepthMembers::scanned(records.preorder(), kinds);
                    let mut pending = vec![(NodeIndex::ROOT, NodeIndex::ROOT)];
                    while let Some((run, row)) = pending.pop() {
                        let (met, kept) = (runs.kid(run), records.kid(row));
                        let root = row == NodeIndex::ROOT;
                        let (met_kids, kept_kids) = (runs.kids(run), records.kids(row));
                        let same = crate::nodes::Kid { index: kept.index, count: kept.count, start: if root { kept.start } else { met.start }, end: if root { kept.end } else { met.end }, ..met } == kept
                            && met.leaf() == kept.leaf()
                            && runs.missing(run) == records.missing(row)
                            && runs.holds_error(run) == records.holds_error(row)
                            && runs.depth_move(run, kinds) == Ok(members.between(row, row + kept.count))
                            && met_kids.len() == kept_kids.len()
                            && met_kids.iter().all(|kid| runs.parent(kid.index) == Some(run))
                            && runs.edge(run, crate::options::Side::Before).map(|kid| kid.index) == met_kids.first().map(|kid| kid.index)
                            && runs.edge(run, crate::options::Side::After).map(|kid| kid.index) == met_kids.last().map(|kid| kid.index);
                        agree[row.0 as usize] = same;
                        pending.extend(met_kids.iter().zip(kept_kids.iter()).map(|(met, kept)| (met.index, kept.index)));
                    }
                    if let Some(refusal) = runs.refused() {
                        return Err(refusal.to_string());
                    }
                    Some(agree)
                }
                None => None,
            }
        };
        let mut parity = BackerParity::default();
        for (index, (backers_agree, kid)) in (0..).map(NodeIndex).zip(facts) {
            parity.nodes += 1;
            let runs_agree = runs.as_ref().is_none_or(|runs| runs[index.0 as usize]);
            if !backers_agree || !runs_agree || !self.reads_agree::<N>(index, &kid)? || !self.extra_agrees::<N>(index, &kid)? {
                parity.differing += 1;
                parity.first.get_or_insert(index.0);
            }
        }
        Ok(parity)
    }

    /// Whether the tree, read whole, holds the record of the node at `index`
    /// (`kid`) as `N` reads it: an extra no `ERROR` is or holds has its
    /// record held exactly when a walk of it alone, into an arena of its
    /// own, writes one. Any other node agrees.
    fn extra_agrees<N: HydrateNode>(&self, index: NodeIndex, kid: &crate::nodes::Kid) -> Result<bool, String> {
        if !kid.extra || self.read_error(index).is_some() {
            return Ok(true);
        }
        let mut alone = TreeArena::new(G::KIND_BITS, crate::read::descendant_count(&self.tree().root_node()));
        let grammar = self.grammar();
        let written = super::hydrate_at::<N>(&mut self.tree().walk(), &mut self.read_ctx(), index, None, Depth::All, &mut alone).map_err(|refusal| refusal.describe(&|kind| grammar.kind_name(kind)))?;
        Ok(self.tree_arena().held(index).is_some() == written.is_some())
    }

    /// The sides of the unit children of the node at `index` as a typed read
    /// of the tree seats them one level down, through a cursor: what
    /// `unit_sides` answers through the tree's navigation. A diagnostic.
    pub fn typed_unit_sides<N>(&self, index: NodeIndex) -> Vec<crate::layout::UnitSides<G::Trivia>>
    where
        N: crate::read::ReadNode + crate::read::HasLayout<Option<Box<crate::layout::NodeLayout<G::Trivia>>>>,
    {
        let seating = self.seating();
        crate::read::read_from::<N>(&mut seating.cursor(index), &mut seating.ctx().inline_units().units_only(), Depth::ONE)
            .ok()
            .and_then(|mut node| crate::read::HasLayout::take_layout(&mut node))
            .map_or_else(Vec::new, |layout| layout.units)
    }

    /// Whether the records answer the node at `index` as a typed read of the
    /// tree does: its unit sides, and, for a named node (`kid`) with no
    /// record that no `ERROR` holds and the typed read reads, its leaf read
    /// (`read_leaf`): a leaf the typed read routes no slots for
    /// (`ReadNode::router`), of the kind and span its coordinate names, or a
    /// unit; a node it declines is one the typed read routes slots for.
    fn reads_agree<N>(&self, index: NodeIndex, kid: &crate::nodes::Kid) -> Result<bool, String>
    where
        N: HydrateNode + RecordCells + crate::prepare::Prepare + crate::read::HasLayout<Option<Box<crate::layout::NodeLayout<G::Trivia>>>>,
        G::Trivia: PartialEq,
    {
        if self.unit_sides(index) != self.typed_unit_sides::<N>(index) {
            return Ok(false);
        }
        Ok(match self.read_leaf::<N>(index).map_err(|error| error.to_string())? {
            Some(LeafRead::Leaf { kind, span }) => N::router(kid.grammar, kid.display).is_none() && matches!(
                self.read_node::<N>(index, Depth::ONE),
                Some(Ok(crate::engine::NodeRead::Node(node))) if node.source_coordinate().is_some_and(|at| at.kind == Some(kind) && at.span == span)
            ),
            Some(LeafRead::Unit(_)) => true,
            None => !kid.named || N::router(kid.grammar, kid.display).is_some() || self.read_error(index).is_some() || self.written_record::<N>(index).is_some() || !matches!(self.read_node::<N>(index, Depth::ONE), Some(Ok(_))),
        })
    }

    /// `f` of the tree's arena, a cursor on its tree and a read of it, its
    /// refusal in words.
    fn with_reads<R>(&self, f: impl FnOnce(&mut TreeArena, &mut tree_sitter::TreeCursor<'_>, &mut crate::read::ReadCtx<'_>) -> Result<R, HydrateError>) -> Result<R, String> {
        let grammar = self.grammar();
        let mut arena = self.tree_arena();
        let mut ctx = self.read_ctx();
        let mut cursor = self.tree().walk();
        f(&mut arena, &mut cursor, &mut ctx).map_err(|refusal| refusal.describe(&|kind| grammar.kind_name(kind)))
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

    /// The words of chunk `n` of the tree's arena that records fill, copied:
    /// a later read that appends to the chunk leaves the copy as it was.
    #[must_use]
    pub fn record_chunk(&self, n: u32) -> Option<Vec<u32>> {
        self.with_record_chunk(n, <[u32]>::to_vec)
    }
}

impl<G: RecordGrammar> ParsedTree<G> {
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
        let ctx = RenderContext::new(options, sources);
        let mut arenas = HeldArenas::of([(self.tree_id(), self.tree_arena())]);
        self.grammar().render_record(root, &mut arenas, &Arena::new(), self.store(), &ctx, None)
    }
}
