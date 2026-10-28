//! How a read reaches a parsed node's record. A node a cell names is reached
//! through that cell: a coordinate until the first read through it writes the
//! record and rewrites the cell to name it, once. A node reached by its row
//! (a query's hit, a side's extra, the root) is reached from the root down
//! the cells that name its ancestors, each written and named on the way when
//! no read has written it yet; a node no cell names is held by its tree. So a
//! tree holds one record per row, however the row is reached.

use super::{Address, ArenaError, ArenaRead, Cell, CellShape, CellWord, HydrateError, HydrateNode, Hydration, ListCell, RecordCells, SideRecord, TreeArena};
use crate::read::{Depth, ReadCtx};
use crate::record::HEADER_WORDS;
use crate::types::NodeIndex;
use tree_sitter::TreeCursor;

fn malformed(what: &'static str, word: u32) -> ArenaError {
    ArenaError::Malformed { what, word }
}

/// Where one parsed cell lies: its words, and its slot's shape.
#[derive(Debug, Clone, Copy)]
pub(super) struct CellPlace {
    at: Address,
    len: u32,
    shape: CellShape,
}

impl CellPlace {
    /// The cell at `at` of a slot of shape `shape`: its one cell, or an item
    /// of its list, whose run's width it takes.
    pub(super) fn new(at: Address, shape: CellShape) -> Self {
        Self { at, len: shape.run.unwrap_or(shape.width), shape }
    }
}

/// The cells of one slot of a parsed record: its one cell, or its list's items
/// in the order of their rows.
enum SlotPlaces {
    One(CellPlace),
    Run { run: Address, len: u32, width: u32, shape: CellShape },
}

impl SlotPlaces {
    fn item(&self, n: u32) -> Result<CellPlace, ArenaError> {
        match *self {
            SlotPlaces::One(place) => Ok(place),
            SlotPlaces::Run { run, width, shape, .. } => Ok(CellPlace { at: run.offset(n * width).ok_or(malformed("list item address", run.0))?, len: width, shape }),
        }
    }

    fn len(&self) -> u32 {
        match self {
            SlotPlaces::One(_) => 1,
            SlotPlaces::Run { len, .. } => *len,
        }
    }
}

/// The slots of the parsed record at `at`, its kind's shape read from `N`.
fn slots<N: RecordCells>(tree: &TreeArena, at: Address) -> Result<Vec<SlotPlaces>, ArenaError> {
    let arena = tree.arena();
    let kind = arena.header_kind(at, arena.kind_bits())?;
    let record = N::shape(kind).ok_or(malformed("record shape", u32::from(kind.0)))?;
    let words = arena.words(at, record.words.max(HEADER_WORDS))?;
    record
        .cells
        .iter()
        .map(|&shape| match shape.run {
            None => Ok(SlotPlaces::One(CellPlace { at: at.offset(shape.word).ok_or(malformed("cell word", shape.word))?, len: shape.width, shape })),
            Some(width) => {
                let list = ListCell::of_word(CellWord(*words.get(shape.word as usize).ok_or(malformed("cell word", shape.word))?), arena)?;
                Ok(SlotPlaces::Run { run: list.run, len: list.len, width, shape })
            }
        })
        .collect()
}

fn cell_at(tree: &TreeArena, place: CellPlace) -> Result<Cell, ArenaError> {
    let arena = tree.arena();
    Cell::decode_parsed(arena.words(place.at, place.len)?, place.at, place.shape, arena.kind_bits())
}

/// The row the node `cell` names: a record's from its side record.
fn row_of(tree: &TreeArena, cell: Cell) -> Result<Option<NodeIndex>, ArenaError> {
    Ok(match cell {
        Cell::Coordinate { index, .. } => Some(index),
        Cell::ParsedLeaf { row, .. } | Cell::Unit { row: Some(row), .. } => Some(row),
        Cell::Child { at, .. } => {
            let header = tree.arena().words(at, HEADER_WORDS)?;
            Some(SideRecord::read(tree.arena(), Address(header[1]))?.at.ok_or(malformed("parsed record row", at.0))?.index)
        }
        _ => None,
    })
}

/// Rewrites the cell at `place` from its coordinate to `at`.
pub(super) fn patch(tree: &mut TreeArena, place: CellPlace, at: Address) -> Result<(), ArenaError> {
    let bits = tree.arena().kind_bits();
    Cell::patch_parsed(tree.arena_mut().words_mut(place.at, place.len)?, place.shape, bits, at)?;
    Ok(())
}

/// The cell of the record at `at` that names a node of `spine`, which holds
/// rows in ascending order, and that node's place in it. Only one can: the
/// cells of a record name disjoint subtrees, and a list's items are in the
/// order of their rows, so of a list only the last item at or before the
/// spine's last row can.
fn spine_cell<N: RecordCells>(tree: &TreeArena, at: Address, spine: &[NodeIndex]) -> Result<Option<(usize, CellPlace, Cell)>, ArenaError> {
    let Some(&target) = spine.last() else { return Ok(None) };
    let on_spine = |row: Option<NodeIndex>| row.and_then(|row| spine.binary_search(&row).ok());
    for slot in slots::<N>(tree, at)? {
        let found = match slot {
            SlotPlaces::One(place) => {
                let cell = cell_at(tree, place)?;
                on_spine(row_of(tree, cell)?).map(|j| (j, place, cell))
            }
            SlotPlaces::Run { .. } => {
                let row = |n: u32| -> Result<Option<(CellPlace, Cell, NodeIndex)>, ArenaError> {
                    let place = slot.item(n)?;
                    let cell = cell_at(tree, place)?;
                    Ok(row_of(tree, cell)?.map(|row| (place, cell, row)))
                };
                let (mut lo, mut hi, mut best) = (0, slot.len(), None);
                while lo < hi {
                    let mid = lo + (hi - lo) / 2;
                    let mut present = None;
                    for n in mid..hi {
                        if let Some(found) = row(n)? {
                            present = Some((n, found));
                            break;
                        }
                    }
                    match present {
                        Some((n, found)) if found.2 <= target => {
                            best = Some(found);
                            lo = n + 1;
                        }
                        _ => hi = mid,
                    }
                }
                best.and_then(|(place, cell, row)| on_spine(Some(row)).map(|j| (j, place, cell)))
            }
        };
        if found.is_some() {
            return Ok(found);
        }
    }
    Ok(None)
}

/// The rows from the root to `row`, ascending: `row`'s ancestors and itself.
fn spine(cursor: &mut TreeCursor<'_>, row: NodeIndex) -> Vec<NodeIndex> {
    crate::read::goto(cursor, row);
    let mut rows = vec![row];
    while cursor.goto_parent() {
        rows.push(crate::read::index_of(cursor));
    }
    rows.reverse();
    rows
}

/// Writes the record of the node at `row`, which has none, `depth` levels down.
fn write<N: HydrateNode>(tree: &mut TreeArena, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, row: NodeIndex, depth: Depth) -> Result<Option<Address>, HydrateError> {
    super::hydrate_at::<N>(cursor, ctx, row, depth, &mut Hydration::new(tree))
}

/// The record of the node at `row`, which no cell names, held by its tree:
/// written `depth` levels down and held when `writes` and no read has.
fn held<N: HydrateNode>(tree: &mut TreeArena, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, row: NodeIndex, depth: Depth, writes: bool) -> Result<Option<Address>, HydrateError> {
    if let Some(at) = tree.held(row) {
        return Ok(Some(at));
    }
    crate::read::goto(cursor, row);
    if !writes || cursor.node().is_error() {
        return Ok(None);
    }
    let at = write::<N>(tree, cursor, ctx, row, depth)?;
    if let Some(at) = at {
        tree.hold(row, at)?;
    }
    Ok(at)
}

/// The record of the node at `row`: reached from the root through the cells
/// that name its ancestors, or held by its tree where no cell names it. When
/// `writes`, a record no read has written yet is written on the way, the
/// node's own `depth` levels down and each ancestor's one, and the cell that
/// names it rewritten to; else such a node answers `None`. `None` too for a
/// node with no record: a leaf, a unit or an `ERROR` node.
///
/// # Errors
///
/// What a hydration or the arena refuses.
pub fn reach<N: HydrateNode + RecordCells>(tree: &mut TreeArena, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, row: NodeIndex, depth: Depth, writes: bool) -> Result<Option<Address>, HydrateError> {
    let spine = spine(cursor, row);
    let last = spine.len() - 1;
    let depth_at = |j: usize| if j == last { depth } else { Depth::ONE };
    let Some(mut at) = held::<N>(tree, cursor, ctx, spine[0], depth_at(0), writes)? else { return Ok(None) };
    let mut i = 0;
    while i < last {
        let named = spine_cell::<N>(tree, at, &spine[i + 1..])?;
        let next = match named {
            Some((j, place, cell)) => {
                let j = i + 1 + j;
                match cell {
                    Cell::Child { at: child, .. } => Some((j, child)),
                    Cell::Coordinate { index, .. } if writes => {
                        let child = write::<N>(tree, cursor, ctx, index, depth_at(j))?.ok_or(malformed("record of a coordinate", index.0))?;
                        patch(tree, place, child)?;
                        Some((j, child))
                    }
                    Cell::Coordinate { .. } => return Ok(None),
                    _ if j == last => return Ok(None),
                    _ => {
                        i = j;
                        None
                    }
                }
            }
            None => None,
        };
        if let Some((j, child)) = next {
            (i, at) = (j, child);
            continue;
        }
        let mut found = None;
        for (j, &row) in spine.iter().enumerate().skip(i + 1) {
            if let Some(child) = held::<N>(tree, cursor, ctx, row, depth_at(j), writes)? {
                found = Some((j, child));
                break;
            }
        }
        let Some((j, child)) = found else { return Ok(None) };
        (i, at) = (j, child);
    }
    Ok(Some(at))
}

/// The record a parsed cell names, the item `item` of the slot at `word` of
/// the record `holder`: written `depth` levels down on the first read through
/// a coordinate, and the cell rewritten to name it.
///
/// # Errors
///
/// `ArenaError::Malformed` for a holder no read wrote, a word that is no
/// slot's or an item past its list, `ArenaError::Unwritable` for a cell that
/// names no record, and what the hydration refuses.
pub fn read_cell<N: HydrateNode + RecordCells>(tree: &mut TreeArena, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, holder: Address, word: u32, item: u32, depth: Depth) -> Result<Address, HydrateError> {
    if !tree.contains_record(holder) {
        return Err(malformed("record address", holder.0).into());
    }
    let slot = slots::<N>(tree, holder)?
        .into_iter()
        .find(|slot| match slot {
            SlotPlaces::One(place) => place.shape.word == word,
            SlotPlaces::Run { shape, .. } => shape.word == word,
        })
        .ok_or(malformed("slot word", word))?;
    if item >= slot.len() {
        return Err(malformed("list item", item).into());
    }
    let place = slot.item(item)?;
    match cell_at(tree, place)? {
        Cell::Child { at, .. } => Ok(at),
        Cell::Coordinate { index, .. } => {
            let at = write::<N>(tree, cursor, ctx, index, depth)?.ok_or(malformed("record of a coordinate", index.0))?;
            patch(tree, place, at)?;
            Ok(at)
        }
        _ => Err(ArenaError::Unwritable("a record for a cell that names none").into()),
    }
}

/// Writes the records `depth` levels down from the record at `at` that no read
/// has, rewriting each cell that names one; a record already written stays.
///
/// # Errors
///
/// What a hydration or the arena refuses.
pub fn deepen<N: HydrateNode + RecordCells>(tree: &mut TreeArena, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, at: Address, depth: Depth) -> Result<(), HydrateError> {
    let Some(below) = depth.below() else { return Ok(()) };
    let mut places = Vec::new();
    for slot in slots::<N>(tree, at)? {
        for n in 0..slot.len() {
            places.push(slot.item(n)?);
        }
    }
    for place in places {
        match cell_at(tree, place)? {
            Cell::Coordinate { index, .. } => {
                let child = write::<N>(tree, cursor, ctx, index, below)?.ok_or(malformed("record of a coordinate", index.0))?;
                patch(tree, place, child)?;
            }
            Cell::Child { at: child, .. } => deepen::<N>(tree, cursor, ctx, child, below)?,
            _ => {}
        }
    }
    Ok(())
}
