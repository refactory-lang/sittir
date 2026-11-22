//! A grammar's render of a record, and the parity of a read's records with
//! the tree they were read from.

use super::{Address, ArenaRead, Cell, CellAt, RecordCells};
use crate::engine::{Backing, EngineGrammar, Records};
use crate::nodes::{Navigation, Nodes, TreeNodes};
use crate::prepare::RenderContext;
use crate::render::RenderError;

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

/// Each node of the tree `nodes` navigates compared with the node the
/// records `parsed` is over answer in its place, from the record's node
/// `root` down: its facts but its index and count, its span below the root,
/// whether it is `MISSING` and whether it holds an error, its depth move,
/// its children, their parents and its edges, and, for a node with a
/// record, whether each leaf and unit cell of it names one of its rows
/// (`cells_name_rows`). A node of the tree the records answer no node for
/// differs.
///
/// # Errors
///
/// What reading the records refuses.
pub fn runs_agree<G: RecordGrammar, N: RecordCells>(parsed: &Records<'_, G>, root: NodeIndex, nodes: &mut TreeNodes<'_>, kinds: crate::trivia_table::SurfaceKinds) -> Result<BackerParity, String> {
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
    Ok(parity)
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

/// A grammar's render of a record: its generated `render_record`. Its
/// trivia type is written into the built arena as a side keeps it
/// (`RecordSink::kept`).
pub trait RecordGrammar: EngineGrammar<Trivia: super::WriteCell<<Self as EngineGrammar>::Trivia>> {
    /// Renders the record `root` names, prepared into a fresh overlay over
    /// the parsed trees' arenas `trees`, the built arena `built` and the
    /// store of written sides `store`, and answers its text before its line
    /// endings are spelled.
    ///
    /// # Errors
    ///
    /// What the record's prepare or render refuses.
    fn render_record(self, root: CellAt, reads: Option<&dyn ArenaRead>, built: &dyn ArenaRead, store: &TriviaStore<Self::Trivia>, ctx: &RenderContext<'_>) -> Result<String, RenderError>;

    /// Writes the built record `root` names into `w` as a trivia entry in
    /// the side that holds it: prepared into a fresh overlay of its own over
    /// the same arenas and store, under `ctx`, without its own leading and
    /// trailing sides, which are its neighbours in that side, and written
    /// where `w` stands, at its depth.
    ///
    /// # Errors
    ///
    /// As `render_record`.
    fn render_entry(self, root: CellAt, reads: Option<&dyn ArenaRead>, built: &dyn ArenaRead, store: &TriviaStore<Self::Trivia>, ctx: &RenderContext<'_>, w: &mut dyn crate::render::RenderSink) -> crate::render::RenderResult;

    /// Renders the node a read left that `at` names as a render root, its
    /// source bytes between its kind's edges, and answers its text before
    /// its line endings are spelled.
    ///
    /// # Errors
    ///
    /// What resolving the node's bytes or writing them refuses.
    fn render_source(self, at: crate::slot::NodeIdOrCoordinate<'_>, ctx: &RenderContext<'_>) -> Result<String, RenderError>;

    /// The storage key of the slot a record of `kind` holds at `word`
    /// (`PrepareRecord::slot_key` of the grammar's node).
    fn slot_key(kind: KindId, word: u32) -> Option<&'static str>;

    /// The word a record of `kind` holds the slot `key` at
    /// (`PrepareRecord::slot_word` of the grammar's node).
    fn slot_word(kind: KindId, key: &str) -> Option<u32>;
}

