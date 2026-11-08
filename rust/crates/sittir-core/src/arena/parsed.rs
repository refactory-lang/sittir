//! A parsed tree's record entry points: a node's record, written on its
//! first read; a record rendered; and a chunk of the tree's arena, copied.
//! A record is named by its tree and its address together: the address
//! reads nothing once its tree is gone.

use super::{Address, Arena, ArenaRead, Cell, CellAt, HeldArenas, HydrateError, HydrateNode, RecordCells, RecordTrees, SideRecord, TreeArena};
use crate::engine::{EngineGrammar, ParsedTree};
use crate::nodes::{Nodes, RecordNodes, TreeNodes};
use crate::options::ResolvedOptions;
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
/// facts, children and parent, whether it is `MISSING` and whether it holds
/// an error.
fn agree(records: &mut dyn Nodes<'_>, nodes: &mut dyn Nodes<'_>, index: NodeIndex) -> bool {
    records.kid(index) == nodes.kid(index)
        && *records.kids(index) == *nodes.kids(index)
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
    /// its tree, whose subtree's rows the read writes (`meet_error`).
    ///
    /// # Errors
    ///
    /// The read's refusal, naming the kind, and what the arena refuses.
    pub fn read_record<N: HydrateNode + RecordCells>(&self, index: NodeIndex, depth: Depth) -> Result<Option<Address>, String> {
        if self.meet_error(index)? {
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
        self.with_reads(|tree, cursor, ctx| super::reach::<N>(tree, cursor, ctx, index, Depth::ONE, false)).ok().flatten()
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

    /// The tree read whole as `N`, then each node compared as its record
    /// backer (`RecordNodes`) and its tree backer (`TreeNodes`) answer it. A
    /// diagnostic.
    ///
    /// # Errors
    ///
    /// The read's refusal, and a read that leaves some node with no row.
    pub fn backer_parity<N: HydrateNode + RecordCells>(&self) -> Result<BackerParity, String> {
        self.read_record::<N>(NodeIndex::ROOT, Depth::All)?;
        let arena = self.tree_arena();
        let mut records = RecordNodes::new(&arena, self.source()).ok_or("the whole read left a node with no row")?;
        let work = crate::layout::LayoutWorkCounter::default();
        let mut nodes = TreeNodes::new(self.tree(), self.source(), &work);
        let mut parity = BackerParity::default();
        for index in (0..nodes.kid(NodeIndex::ROOT).count).map(NodeIndex) {
            parity.nodes += 1;
            if !agree(&mut records, &mut nodes, index) {
                parity.differing += 1;
                parity.first.get_or_insert(index.0);
            }
        }
        Ok(parity)
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
        let ctx = RenderContext { options, sources };
        let mut arenas = HeldArenas::of([(self.tree_id(), self.tree_arena())]);
        self.grammar().render_record(root, &mut arenas, &Arena::new(), self.store(), &ctx)
    }
}
