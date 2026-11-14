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

/// The row in its run that the cell at `site` of the read's record at
/// `holder` names, the record's shape found by `shape`.
///
/// # Errors
///
/// What reading the record refuses, and `ArenaError::Malformed` for a site
/// no cell of the record is at or whose cell holds no such node.
pub fn site_row(arena: &dyn ArenaRead, holder: Address, shape: fn(KindId) -> Option<RecordShape>, bits: u32, site: CellSite) -> Result<u32, ArenaError> {
    let (shape, words) = shape_of(arena, holder, shape, bits)?;
    let cell = *shape.cells.iter().find(|cell| cell.word == site.word).ok_or(malformed("cell site word", site.word))?;
    let decoded = match cell.run {
        None if site.item == 0 => Cell::decode_parsed(slot_words(words, cell)?, cell, bits)?,
        None => return Err(malformed("cell site item", site.item)),
        Some(width) => {
            let list = ListCell::of_word(CellWord(slot_words(words, CellShape { width: 1, ..cell })?[0]), arena)?;
            let item = list.items(arena, width)?.nth(site.item as usize).ok_or(malformed("cell site item", site.item))?;
            Cell::decode_parsed(item, cell, bits)?
        }
    };
    leaf_row(&decoded).ok_or(malformed("cell site", site.word))
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
pub fn node_site(arena: &dyn ArenaRead, shape: fn(KindId) -> Option<RecordShape>, bits: u32, name: crate::types::NodeName) -> Result<super::NodeSite, ArenaError> {
    let holder = Address(name.node.0);
    let Some([word, item]) = name.site else { return Ok(super::NodeSite::Record(holder)) };
    Ok(match site_row(arena, holder, shape, bits, CellSite { word, item })? {
        1 => super::NodeSite::Record(holder),
        row => super::NodeSite::Row { holder, entry: row.checked_sub(2).ok_or(malformed("cell row", row))? },
    })
}
