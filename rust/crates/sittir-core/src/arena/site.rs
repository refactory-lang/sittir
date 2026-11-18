//! Where a read's record keeps a node that has no record of its own, as
//! its slots name it: the word its cell starts at and, in a list slot, the
//! item. The cell there holds the node's row in the record's run, so a
//! site names the node past a call as the row does, and each is found
//! from the other through the record's shape.

use super::{Address, ArenaError, ArenaRead, Cell, CellShape, CellWord, ListCell, RecordShape};
use crate::types::KindId;

/// A cell's place in its record: the word its slot's cell starts at, and
/// the item of a list slot, 0 in a slot of one cell.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct CellSite {
    pub word: u32,
    pub item: u32,
}

fn malformed(what: &'static str, word: u32) -> ArenaError {
    ArenaError::Malformed { what, word }
}

/// The row a cell names in its record's run when it holds a node with no
/// record of its own.
fn leaf_row(cell: &Cell) -> Option<u32> {
    match *cell {
        Cell::ParsedLeaf { row, .. } | Cell::Unit { row: Some(row), .. } => Some(row.0),
        _ => None,
    }
}

fn shape_of(arena: &dyn ArenaRead, holder: Address, shape: fn(KindId) -> Option<RecordShape>, bits: u32) -> Result<(RecordShape, &[u32]), ArenaError> {
    let kind = arena.header_kind(holder, bits)?;
    let shape = shape(kind).ok_or(malformed("record kind", u32::from(kind.0)))?;
    Ok((shape, arena.words(holder, shape.words)?))
}

fn slot_words(words: &[u32], cell: CellShape) -> Result<&[u32], ArenaError> {
    words.get(cell.word as usize..(cell.word + cell.width) as usize).ok_or(malformed("cell word", cell.word))
}

/// The cell at `site` of the read's record at `holder`, the record's shape
/// found by `shape`; none for an item past the end of the list there.
fn parsed_cell(arena: &dyn ArenaRead, holder: Address, shape: fn(KindId) -> Option<RecordShape>, bits: u32, site: CellSite) -> Result<Option<Cell>, ArenaError> {
    let (shape, words) = shape_of(arena, holder, shape, bits)?;
    let cell = *shape.cells.iter().find(|cell| cell.word == site.word).ok_or(malformed("cell site word", site.word))?;
    match cell.run {
        None if site.item == 0 => Cell::decode_parsed(slot_words(words, cell)?, cell, bits).map(Some),
        None => Err(malformed("cell site item", site.item)),
        Some(width) => {
            let list = ListCell::of_word(CellWord(slot_words(words, CellShape { width: 1, ..cell })?[0]), arena)?;
            list.items(arena, width)?.nth(site.item as usize).map(|item| Cell::decode_parsed(item, cell, bits)).transpose()
        }
    }
}

/// The row in its run that the cell at `site` of the read's record at
/// `holder` names, the record's shape found by `shape`.
///
/// # Errors
///
/// What reading the record refuses, and `ArenaError::Malformed` for a site
/// no cell of the record is at or whose cell holds no such node.
pub fn site_row(arena: &dyn ArenaRead, holder: Address, shape: fn(KindId) -> Option<RecordShape>, bits: u32, site: CellSite) -> Result<u32, ArenaError> {
    let cell = parsed_cell(arena, holder, shape, bits, site)?.ok_or(malformed("cell site item", site.item))?;
    leaf_row(&cell).ok_or(malformed("cell site", site.word))
}

/// Whether the child the record at `holder` holds at `site` is a unit: the
/// cell there, a read's record's parsed cell or a built record's cell,
/// the record's shape found by `shape`; false for an item past the end of
/// the list there, which holds no child.
///
/// # Errors
///
/// What reading the record refuses, and `ArenaError::Malformed` for a site
/// no cell of the record is at.
pub fn holds_unit(arena: &dyn ArenaRead, holder: Address, shape: fn(KindId) -> Option<RecordShape>, bits: u32, site: CellSite) -> Result<bool, ArenaError> {
    if arena.read_chunk(holder.chunk()) {
        return Ok(matches!(parsed_cell(arena, holder, shape, bits, site)?, Some(Cell::Unit { .. })));
    }
    let (record, _) = shape_of(arena, holder, shape, bits)?;
    if !record.cells.iter().any(|cell| cell.word == site.word) {
        return Err(malformed("cell site word", site.word));
    }
    let mut unit = false;
    super::cell::built_cells(arena, holder, record, super::cell::Lists::Items, |cell, item, word| {
        if cell.word == site.word && item == site.item {
            unit = matches!(Cell::decode_built(word, arena, bits)?, Cell::Unit { .. });
        }
        Ok(())
    })?;
    Ok(unit)
}

/// The rows a cell of each read's record names, with the cell's site, by
/// record, sorted by row: what `site_name` reads once a record.
pub type RowSites = std::collections::HashMap<Address, Vec<(u32, CellSite)>, crate::heap::IndexState>;

/// The name of the node kept at `site`: its record's, or its holder's and
/// the site of the cell naming its row, `known` holding each holder's
/// cells once read; none for a row no cell of its holder names.
///
/// # Errors
///
/// What reading a holder's cells refuses (`row_sites`).
pub fn site_name(arena: &dyn ArenaRead, shape: fn(KindId) -> Option<RecordShape>, bits: u32, site: super::NodeSite, known: &mut RowSites) -> Result<Option<crate::types::NodeId>, ArenaError> {
    let (holder, entry) = match site {
        super::NodeSite::Record(at) => return Ok(Some(crate::types::NodeId::record(at.0))),
        super::NodeSite::Row { holder, entry } => (holder, entry),
    };
    let sites = match known.entry(holder) {
        std::collections::hash_map::Entry::Occupied(sites) => sites.into_mut(),
        std::collections::hash_map::Entry::Vacant(unread) => {
            let mut sites = row_sites(arena, holder, shape, bits)?;
            sites.sort_unstable_by_key(|&(row, _)| row);
            unread.insert(sites)
        }
    };
    Ok(sites.binary_search_by_key(&(entry + 2), |&(row, _)| row).ok().map(|at| {
        let CellSite { word, item } = sites[at].1;
        crate::types::NodeId::leaf(holder.0, word, item)
    }))
}

/// Each row of its run that a cell of the read's record at `holder` names
/// for a node with no record of its own, with the cell's site, the
/// record's shape found by `shape`.
///
/// # Errors
///
/// What reading the record or decoding a cell of it refuses.
pub fn row_sites(arena: &dyn ArenaRead, holder: Address, shape: fn(KindId) -> Option<RecordShape>, bits: u32) -> Result<Vec<(u32, CellSite)>, ArenaError> {
    let (shape, words) = shape_of(arena, holder, shape, bits)?;
    let mut sites = Vec::new();
    for &cell in shape.cells {
        match cell.run {
            None => {
                let decoded = Cell::decode_parsed(slot_words(words, cell)?, cell, bits)?;
                sites.extend(leaf_row(&decoded).map(|row| (row, CellSite { word: cell.word, item: 0 })));
            }
            Some(width) => {
                let word = slot_words(words, CellShape { width: 1, ..cell })?[0];
                if word == 0 {
                    continue;
                }
                for (item, held) in ListCell::of_word(CellWord(word), arena)?.items(arena, width)?.enumerate() {
                    let decoded = Cell::decode_parsed(held, cell, bits)?;
                    sites.extend(leaf_row(&decoded).map(|row| (row, CellSite { word: cell.word, item: crate::types::narrow(item) })));
                }
            }
        }
    }
    Ok(sites)
}

/// Where the node `name` names is kept: its own record, or the row of its
/// record's run that the cell at its site names, a cell row of 1 being the
/// record's own node.
///
/// # Errors
///
/// As `site_row`.
pub fn node_site(arena: &dyn ArenaRead, shape: fn(KindId) -> Option<RecordShape>, bits: u32, name: crate::types::NodeId) -> Result<super::NodeSite, ArenaError> {
    let holder = Address(name.address());
    let Some([word, item]) = name.site() else { return Ok(super::NodeSite::Record(holder)) };
    Ok(match site_row(arena, holder, shape, bits, CellSite { word, item })? {
        1 => super::NodeSite::Record(holder),
        row => super::NodeSite::Row { holder, entry: row.checked_sub(2).ok_or(malformed("cell row", row))? },
    })
}
