//! Admitting records written outside the native writer. A native writer
//! writes a record's children before it, so its records hold no cycle; words
//! written elsewhere are walked once, when they cross in, and refused unless
//! they hold to that order. Decode then trusts them, checking only bounds.

use std::collections::HashSet;

use super::{Address, Arena, ArenaError, Cell, ListCell, SideRecord};
use crate::record::HEADER_WORDS;
use crate::types::KindId;

/// Where a record of one kind keeps its cells: its width in words, and each
/// slot's cell, by the stamps its node type carries.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RecordShape {
    pub words: u32,
    pub cells: &'static [CellShape],
}

/// One slot's cell in a record: its first word and width, and for a list
/// the width of each item's cell in its run.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CellShape {
    pub word: u32,
    pub width: u32,
    pub run: Option<u32>,
}

/// The record shapes a node type is written as, by the kind a record's
/// header names: a struct's own, a choice's variants', none for a type that
/// is never a record. The derive writes every impl.
pub trait RecordCells {
    fn shape(kind: KindId) -> Option<RecordShape>;
}

impl<N: RecordCells + ?Sized> RecordCells for Box<N> {
    fn shape(kind: KindId) -> Option<RecordShape> {
        N::shape(kind)
    }
}

/// An `ERROR` node a built record holds is a leaf with a header-only record.
impl RecordCells for crate::verbatim::VerbatimNode {
    fn shape(kind: KindId) -> Option<RecordShape> {
        (kind == KindId::ERROR).then_some(RecordShape { words: HEADER_WORDS, cells: &[] })
    }
}

fn malformed(what: &'static str, word: u32) -> ArenaError {
    ArenaError::Malformed { what, word }
}

/// Admits the records of `arena` the record at `root` reaches, their shapes
/// by `shape`: each is read once, its header naming a kind `shape` knows and
/// its cell's, its side record and every cell decoding, and every record a
/// cell names in the arena lying below the record that names it
/// (`Cell::below`), so no chain of cells cycles. A cell linking another
/// arena's record is left to that arena, which only a native writer writes.
///
/// # Errors
///
/// The first word that breaks one of these: `ArenaError::OutOfBounds` for
/// words the arena never wrote, `ArenaError::Malformed` for any other.
pub fn admit(arena: &Arena, root: Address, shape: fn(KindId) -> Option<RecordShape>) -> Result<(), ArenaError> {
    let kind_of = |word: u32| u16::try_from(word).map(KindId).map_err(|_| malformed("record kind", word));
    let root_kind = kind_of(arena.word(root)?)?;
    let mut seen = HashSet::new();
    let mut pending = vec![(root, root_kind)];
    while let Some((at, named)) = pending.pop() {
        if !seen.insert(at) {
            continue;
        }
        let header = arena.words(at, HEADER_WORDS)?;
        let kind = kind_of(header[0])?;
        if kind != named {
            return Err(malformed("record kind", header[0]));
        }
        let record = shape(kind).ok_or(malformed("record kind", header[0]))?;
        let words = arena.words(at, record.words.max(HEADER_WORDS))?;
        SideRecord::read(arena, Address(words[1]))?;
        for cell in record.cells {
            let start = cell.word as usize;
            let mut admit_cell = |words: &[u32]| -> Result<(), ArenaError> {
                match Cell::decode(words)?.below(at)? {
                    Cell::Child { kind, at: child, link: None, .. } | Cell::BuiltLeaf { kind, record: child, .. } => pending.push((child, kind)),
                    _ => {}
                }
                Ok(())
            };
            match cell.run {
                None => admit_cell(words.get(start..start + cell.width as usize).ok_or(malformed("cell word", cell.word))?)?,
                Some(run) => {
                    let list = ListCell::decode(words.get(start..start + ListCell::WIDTH as usize).ok_or(malformed("cell word", cell.word))?)?;
                    for item in list.items(arena, run)? {
                        admit_cell(item)?;
                    }
                }
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::slot::ChangedEdges;

    const PAIR: KindId = KindId(7);
    const LEAF: KindId = KindId(8);

    /// A pair record holds one child cell at word 2; a leaf is its header.
    fn shape(kind: KindId) -> Option<RecordShape> {
        const CELLS: &[CellShape] = &[CellShape { word: 2, width: 5, run: None }];
        match kind {
            PAIR => Some(RecordShape { words: 7, cells: CELLS }),
            LEAF => Some(RecordShape { words: HEADER_WORDS, cells: &[] }),
            _ => None,
        }
    }

    fn pair(arena: &mut Arena, child: Address, kind: KindId) -> Address {
        let mut words = [0; 7];
        words[0] = u32::from(PAIR.0);
        Cell::Child { kind, at: child, link: None, changed: ChangedEdges::default() }.encode(&mut words[2..]).expect("it fits");
        arena.push(&words).expect("room")
    }

    #[test]
    fn records_whose_cells_name_records_below_them_are_admitted() {
        let mut arena = Arena::new();
        let leaf = arena.push(&[u32::from(LEAF.0), 0]).expect("room");
        let inner = pair(&mut arena, leaf, LEAF);
        let outer = pair(&mut arena, inner, PAIR);
        assert_eq!(admit(&arena, outer, shape), Ok(()));
    }

    #[test]
    fn a_cell_naming_a_record_at_or_past_its_holder_is_refused() {
        let mut arena = Arena::new();
        let leaf = arena.push(&[u32::from(LEAF.0), 0]).expect("room");
        let inner = pair(&mut arena, leaf, LEAF);
        let outer = pair(&mut arena, inner, PAIR);
        arena.words_mut(inner.offset(4).expect("the cell's address word"), 1).expect("written")[0] = outer.0;
        arena.words_mut(inner.offset(3).expect("the cell's kind word"), 1).expect("written")[0] = u32::from(PAIR.0);
        assert_eq!(admit(&arena, outer, shape), Err(ArenaError::Malformed { what: "child record address", word: outer.0 }), "the inner record names the outer one: a cycle");
    }

    #[test]
    fn a_record_whose_kind_is_not_its_cells_or_has_no_shape_is_refused() {
        let mut arena = Arena::new();
        let leaf = arena.push(&[u32::from(LEAF.0), 0]).expect("room");
        let named_wrong = pair(&mut arena, leaf, PAIR);
        assert_eq!(admit(&arena, named_wrong, shape), Err(ArenaError::Malformed { what: "record kind", word: u32::from(LEAF.0) }));
        let unknown = arena.push(&[99, 0]).expect("room");
        assert_eq!(admit(&arena, unknown, shape), Err(ArenaError::Malformed { what: "record kind", word: 99 }));
    }
}
