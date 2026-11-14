//! A grammar's render of a record, the recording render of a node a read
//! left records of, and the parity of a read's records with the tree they
//! were read from.

use super::{Address, Arena, ArenaRead, Cell, CellAt, RecordCells, RecordTrees};
use crate::engine::{EngineGrammar, ParsedTree, Records};
use crate::nodes::{Navigation, Nodes, TreeNodes};
use crate::prepare::RenderContext;
use crate::read::Depth;
use crate::render::RenderError;
use crate::slot::ChangedEdges;
use crate::trivia_store::TriviaStore;
use crate::types::{KindId, NodeIndex};

/// Whether the records a read leaves of a source answer its nodes as the
/// tree they were read from does (`runs_agree`): the nodes compared, how
/// many differ, and the first that does, by its index in the tree.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct BackerParity {
    pub nodes: u32,
    pub differing: u32,
    pub first: Option<u32>,
}

/// A read's layout runs with the tally its baseline writes at each, as
/// `ParsedTree::baseline_runs` answers them.
pub type BaselineRuns = Vec<(crate::trivia_table::LayoutRun, Option<crate::baseline::Tally>)>;

/// Each node of the tree `nodes` navigates compared with the node the
/// records `parsed` is over answer in its place, from the record's node
/// `root` down: its facts but its index and count, its span below the root,
/// whether it is `MISSING` and whether it holds an error, its depth move,
/// its children, their parents and its edges, and, for a node with a
/// record, whether each leaf and unit cell of it names one of its rows
/// (`cells_name_rows`). A node of the tree the records answer no node for
/// differs. With it, the records' layout baseline (`baseline_runs`), each
/// run naming its node and its owner by their indexes in the tree.
///
/// # Errors
///
/// What reading the records or their baseline refuses, and a baseline run
/// on a node the walk met no node of the tree for.
pub fn runs_agree<G: RecordGrammar, N: RecordCells>(parsed: &ParsedTree<G, Records<'_>>, root: NodeIndex, nodes: &mut TreeNodes<'_>, kinds: crate::trivia_table::SurfaceKinds) -> Result<(BackerParity, BaselineRuns), String> {
    let Navigation::Runs(mut runs) = parsed.nodes() else { return Err("a tree over a read's records navigates its runs".to_owned()) };
    let built = parsed.records_arena();
    let count = nodes.kid(NodeIndex::ROOT).count;
    let members = crate::trivia_table::DepthMembers::scanned((0..count).map(|index| nodes.kid(NodeIndex(index))), kinds);
    let mut agree = vec![false; count as usize];
    let mut rows = std::collections::HashMap::new();
    let mut pending = vec![(root, NodeIndex::ROOT)];
    while let Some((run, row)) = pending.pop() {
        rows.insert(run, row);
        let (met, kept) = (runs.kid(run), nodes.kid(row));
        let top = row == NodeIndex::ROOT;
        let (met_kids, kept_kids) = (runs.kids(run), nodes.kids(row));
        let same = crate::nodes::Kid { index: kept.index, count: kept.count, start: if top { kept.start } else { met.start }, end: if top { kept.end } else { met.end }, ..met } == kept
            && met.leaf() == kept.leaf()
            && runs.missing(run) == nodes.missing(row)
            && runs.holds_error(run) == nodes.holds_error(row)
            && runs.depth_move(run, kinds) == Ok(members.between(row, row + kept.count))
            && met_kids.len() == kept_kids.len()
            && met_kids.iter().all(|kid| runs.parent(kid.index) == Some(run))
            && runs.edge(run, crate::options::Side::Before).map(|kid| kid.index) == met_kids.first().map(|kid| kid.index)
            && runs.edge(run, crate::options::Side::After).map(|kid| kid.index) == met_kids.last().map(|kid| kid.index)
            && match runs.site(run) {
                Some(super::NodeSite::Record(at)) => cells_name_rows::<N>(&mut runs, built, at, G::KIND_BITS).map_err(|refusal| refusal.to_string())?,
                _ => true,
            };
        agree[row.0 as usize] = same;
        pending.extend(met_kids.iter().zip(kept_kids.iter()).map(|(met, kept)| (met.index, kept.index)));
    }
    if let Some(refusal) = runs.refused() {
        return Err(refusal.to_string());
    }
    let mut parity = BackerParity { nodes: count, ..BackerParity::default() };
    for (index, same) in (0..).zip(agree) {
        if !same {
            parity.differing += 1;
            parity.first.get_or_insert(index);
        }
    }
    let in_tree = |index: NodeIndex| rows.get(&index).copied().ok_or_else(|| format!("a layout run names node {} of the records, which the tree has no node for", index.0));
    let baseline = parsed
        .baseline_runs(false)?
        .into_iter()
        .map(|(run, written)| Ok((crate::trivia_table::LayoutRun { node: in_tree(run.node)?, owner: in_tree(run.owner)?, ..run }, written)))
        .collect::<Result<_, String>>()?;
    Ok((parity, baseline))
}

/// Whether each leaf and unit cell of the record at `at` in `arena`, and of
/// each content read from the same node, names a node of `runs` by its
/// holder's run (`RunNodes::row_index`): a leaf one of the cell's span.
fn cells_name_rows<N: RecordCells>(runs: &mut super::RunNodes<'_>, arena: &dyn ArenaRead, at: Address, bits: u32) -> Result<bool, super::ArenaError> {
    let cells = parsed_cells::<N>(arena, at, bits)?;
    let own = runs.index_of(at)?;
    for cell in cells {
        let named = match cell {
            Cell::ParsedLeaf { span, row, .. } => {
                let index = runs.row_index(at, row.0)?;
                runs.kid(index).span() == span && (index == own || runs.parent(index).is_some())
            }
            Cell::Unit { row: Some(row), .. } => {
                let index = runs.row_index(at, row.0)?;
                index == own || runs.parent(index).is_some()
            }
            Cell::Child { at: content, .. } if runs.index_of(content)? == own => cells_name_rows::<N>(runs, arena, content, bits)?,
            _ => true,
        };
        if !named {
            return Ok(false);
        }
    }
    Ok(true)
}

/// The cells of the parsed record at `at` in `arena`, as its kind's shape
/// lays them out: each slot's, a list slot's each item's.
fn parsed_cells<N: RecordCells>(arena: &dyn ArenaRead, at: Address, bits: u32) -> Result<Vec<Cell>, super::ArenaError> {
    Ok(super::view::parsed_cells(arena, at, N::shape, bits)?.into_iter().map(|(_, _, cell)| cell).collect())
}

/// The cell a node of records that outlive their tree renders from, kept
/// at `site` and named `index` by the call: its record, or, for a leaf or a
/// unit, the cell of its holder that names its row, naming it `index`;
/// `None` for a row no cell names.
fn site_cell<N: RecordCells>(reads: &dyn ArenaRead, site: super::NodeSite, index: NodeIndex, bits: u32) -> Result<Option<Cell>, super::ArenaError> {
    let (holder, entry) = match site {
        super::NodeSite::Record(at) => return Ok(Some(Cell::Child { kind: reads.header_kind(at, bits)?, at, link: None, changed: ChangedEdges::default() })),
        super::NodeSite::Row { holder, entry } => (holder, entry),
    };
    Ok(parsed_cells::<N>(reads, holder, bits)?.into_iter().find_map(|cell| match cell {
        Cell::ParsedLeaf { kind, span, row } if row.0 == entry + 2 => Some(Cell::ParsedLeaf { kind, span, row: index }),
        Cell::Unit { kind, row: Some(row) } if row.0 == entry + 2 => Some(Cell::Unit { kind, row: Some(index) }),
        _ => None,
    }))
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
/// arenas `arenas`, which hold the records a read left of the tree's source.
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
/// cell that names it (`site_cell`), its record or, for a leaf or a unit,
/// its holder's cell, its sides from the store `store`. A node no cell
/// names is one the records keep no value of (a
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
    let reads = arenas.reads().ok_or_else(|| format!("no arena of tree {} was lent", tree.0))?;
    let cell = match render.sources.row_site(tree, index) {
        Some(site) => site_cell::<N>(reads, site, index, G::KIND_BITS).map_err(describe)?,
        None => None,
    };
    let Some(cell) = cell else { return Ok(()) };
    let root = CellAt { cell, tree: Some(tree), site: None };
    let recording = Recording { templates: super::Templates { tree, root: index, depth }, baseline };
    match grammar.render_record(root, &mut super::ReadArenas(arenas), &Arena::new(), store, render, Some(recording)) {
        Ok(_) => Ok(()),
        Err(RenderError::Record(error)) => Err(describe(error)),
        Err(error) => Err(error.to_string()),
    }
}
