//! Admitting records written outside the native writer. A native writer
//! writes a record's children before it, so its records hold no cycle; words
//! written elsewhere are walked once, when they cross in, and refused unless
//! they hold to that order. Decode then trusts them, checking only bounds.

use super::small::{SmallMap, SmallStack};

use super::{Address, ArenaError, ArenaRead, Cell, CellWord, ListCell, SideRecord};
#[cfg(test)]
use super::Arena;
use crate::record::HEADER_WORDS;
use crate::types::{KindId, TreeId};

/// Where a record of one kind keeps its cells: its width in words, parsed
/// and built, and each slot's cell, by the stamps its node type carries.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RecordShape {
    pub words: u32,
    pub built_words: u32,
    pub cells: &'static [CellShape],
}

/// One slot's cell in a record: in a parsed record, its first word and
/// width, and for a list the width of each item's cell in its run; in a
/// built record, its one word.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CellShape {
    pub word: u32,
    pub width: u32,
    pub run: Option<u32>,
    pub inline: u32,
    pub built: u32,
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
        (kind == KindId::ERROR).then_some(RecordShape { words: HEADER_WORDS, built_words: HEADER_WORDS, cells: &[] })
    }
}

fn malformed(what: &'static str, word: u32) -> ArenaError {
    ArenaError::Malformed { what, word }
}

/// Visits each cell of the parsed record at `at`, of shape `record`, with
/// the capacity of an embedded child: a list slot's each item. Every record
/// a cell names outside an embedded child lies below `floor`.
pub(super) fn for_each_parsed_cell(
    arena: &dyn ArenaRead,
    at: Address,
    record: RecordShape,
    floor: Address,
    mut visit: impl FnMut(Cell, u32) -> Result<(), ArenaError>,
) -> Result<(), ArenaError> {
    let words = arena.words(at, record.words.max(HEADER_WORDS))?;
    for cell in record.cells {
        let start = cell.word as usize;
        match cell.run {
            None => {
                let words = words.get(start..start + cell.width as usize).ok_or(malformed("cell word", cell.word))?;
                let slot = at.offset(cell.word).ok_or(malformed("cell word", cell.word))?;
                let decoded = Cell::decode_slot(words, slot, cell.inline)?;
                if words.first() == Some(&super::cell::tag::INLINE) {
                    visit(decoded, cell.inline)?;
                } else {
                    visit(decoded.below(floor)?, 0)?;
                }
            }
            Some(run) => {
                let list = ListCell::decode(words.get(start..start + ListCell::WIDTH as usize).ok_or(malformed("cell word", cell.word))?)?;
                for item in list.items(arena, run)? {
                    visit(Cell::decode(item)?.below(floor)?, 0)?;
                }
            }
        }
    }
    Ok(())
}

/// Visits each cell of the built record at `at`, of shape `record`: a list
/// slot's each item. Every record a cell names, and every list's run, lies
/// below `floor`.
pub(super) fn for_each_built_cell(
    arena: &dyn ArenaRead,
    at: Address,
    record: RecordShape,
    floor: Address,
    mut visit: impl FnMut(Cell) -> Result<(), ArenaError>,
) -> Result<(), ArenaError> {
    let words = arena.words(at, record.built_words.max(HEADER_WORDS))?;
    for cell in record.cells {
        let word = *words.get(cell.built as usize).ok_or(malformed("cell word", cell.built))?;
        if cell.run.is_none() {
            visit(Cell::decode_built(CellWord(word), arena)?.below(floor)?)?;
            continue;
        }
        let list = ListCell::decode_built(CellWord(word), arena)?;
        if list.len != 0 && list.run >= floor {
            return Err(malformed("list run address", list.run.0));
        }
        for item in list.items(arena, 1)? {
            visit(Cell::decode_built(CellWord(item[0]), arena)?.below(floor)?)?;
        }
    }
    Ok(())
}

/// Admits the built records of `arena` the record at `root` reaches, their
/// shapes by `shape`: each is read once, its header naming a kind `shape`
/// knows and its cell's, its side record and every cell decoding, and every
/// record a cell names in the arena lying below the record that names it
/// (`Cell::below`), so no chain of cells cycles. A cell linking a parsed
/// node is left to its tree's arena, which only a native writer writes; the
/// trees those cells link are answered, each once, in order: the parsed
/// arenas a render of the root reaches.
///
/// # Errors
///
/// The first word that breaks one of these: `ArenaError::OutOfBounds` for
/// words the arena never wrote, `ArenaError::Malformed` for any other.
pub fn admit(arena: &dyn ArenaRead, root: Address, shape: fn(KindId) -> Option<RecordShape>) -> Result<Vec<TreeId>, ArenaError> {
    let mut seen = SmallMap::<(Address, Address), Option<KindId>>::new();
    let mut pending = SmallStack::new();
    let mut linked = Vec::new();
    pending.push((root, arena.header_kind(root)?));
    while let Some((at, named)) = pending.pop() {
        let record = shape(named).ok_or(malformed("record kind", u32::from(named.0)))?;
        let verified = seen.entry((at, at)).or_default();
        if let Some(kind) = verified {
            if *kind != named {
                return Err(malformed("record kind", u32::from(kind.0)));
            }
            continue;
        }
        let kind = arena.header_kind(at)?;
        if kind != named {
            return Err(malformed("record kind", u32::from(kind.0)));
        }
        *verified = Some(kind);
        let words = arena.words(at, record.built_words.max(HEADER_WORDS))?;
        SideRecord::read(arena, Address(words[1]))?;
        for_each_built_cell(arena, at, record, at, |cell| {
            match cell {
                Cell::Child { kind, at: child, link: None, .. } => pending.push((child, kind)),
                Cell::Child { link: Some(tree), .. } | Cell::LinkedLeaf { tree, .. } => linked.push(tree),
                Cell::BuiltLeaf { kind, text, .. } => {
                    shape(kind).ok_or(malformed("built leaf kind", u32::from(kind.0)))?;
                    arena.text(text)?;
                }
                Cell::BuiltText { text } => {
                    arena.text(text)?;
                }
                _ => {}
            }
            Ok(())
        })?;
    }
    linked.sort_unstable();
    linked.dedup();
    Ok(linked)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::arena::StringRef;
    use crate::slot::ChangedEdges;

    const PAIR: KindId = KindId(7);
    const LEAF: KindId = KindId(8);

    /// A pair record holds one child cell at word 2; a leaf is its header.
    fn shape(kind: KindId) -> Option<RecordShape> {
        const CELLS: &[CellShape] = &[CellShape { word: 2, width: 5, run: None, inline: 0, built: 2 }];
        match kind {
            PAIR => Some(RecordShape { words: 7, built_words: 3, cells: CELLS }),
            LEAF => Some(RecordShape { words: HEADER_WORDS, built_words: HEADER_WORDS, cells: &[] }),
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
        assert_eq!(admit(&arena, outer, shape), Ok(Vec::new()));
    }

    #[test]
    fn a_built_leaf_cell_is_admitted_by_its_kind_and_its_text() {
        let mut arena = Arena::new();
        let text = arena.intern("x").expect("room");
        let holding = |arena: &mut Arena, kind: KindId, text| {
            let mut words = [0; 7];
            words[0] = u32::from(PAIR.0);
            Cell::BuiltLeaf { kind, text, changed: ChangedEdges::default() }.encode(&mut words[2..]).expect("it fits");
            arena.push(&words).expect("room")
        };
        let admitted = holding(&mut arena, LEAF, text);
        assert_eq!(admit(&arena, admitted, shape), Ok(Vec::new()));
        let unknown = holding(&mut arena, KindId(40), text);
        assert_eq!(admit(&arena, unknown, shape), Err(ArenaError::Malformed { what: "built leaf kind", word: 40 }));
        let past = StringRef { len: 64, ..text };
        let outside = holding(&mut arena, LEAF, past);
        assert_eq!(admit(&arena, outside, shape), Err(ArenaError::BadString(past)));
    }

    #[test]
    fn every_reference_to_a_shared_record_must_name_its_actual_kind() {
        const FORK: KindId = KindId(9);
        fn fork_shape(kind: KindId) -> Option<RecordShape> {
            const CELLS: &[CellShape] = &[
            CellShape { word: 2, width: 5, run: None, inline: 0, built: 2 },
            CellShape { word: 7, width: 5, run: None, inline: 0, built: 3 },
            ];
            if kind == FORK { Some(RecordShape { words: 12, built_words: 4, cells: CELLS }) } else { shape(kind) }
        }
        let mut arena = Arena::new();
        let leaf = arena.push(&[u32::from(LEAF.0), 0]).expect("room");
        let mut words = [0; 12];
        words[0] = u32::from(FORK.0);
        Cell::Child { kind: PAIR, at: leaf, link: None, changed: ChangedEdges::default() }.encode(&mut words[2..7]).expect("cell");
        Cell::Child { kind: LEAF, at: leaf, link: None, changed: ChangedEdges::default() }.encode(&mut words[7..]).expect("cell");
        let root = arena.push(&words).expect("room");
        assert!(admit(&arena, root, fork_shape).is_err());
        Cell::Child { kind: LEAF, at: leaf, link: None, changed: ChangedEdges::default() }.encode(&mut words[2..7]).expect("cell");
        let shared = arena.push(&words).expect("room");
        assert!(admit(&arena, shared, fork_shape).is_ok());
    }

    #[test]
    fn the_trees_its_cells_link_are_answered_once_each_in_order() {
        const FORK: KindId = KindId(9);
        fn fork_shape(kind: KindId) -> Option<RecordShape> {
            const CELLS: &[CellShape] = &[
            CellShape { word: 2, width: 5, run: None, inline: 0, built: 2 },
            CellShape { word: 7, width: 5, run: None, inline: 0, built: 3 },
            ];
            if kind == FORK { Some(RecordShape { words: 12, built_words: 4, cells: CELLS }) } else { shape(kind) }
        }
        let linked = |tree| Cell::Child { kind: PAIR, at: Address(6), link: Some(TreeId(tree)), changed: ChangedEdges::default() };
        let fork = |arena: &mut Arena, first: Cell, second: Cell| {
            let mut words = [0; 12];
            words[0] = u32::from(FORK.0);
            first.encode(&mut words[2..7]).expect("cell");
            second.encode(&mut words[7..]).expect("cell");
            arena.push(&words).expect("room")
        };
        let mut arena = Arena::new();
        let inner = fork(&mut arena, linked(4), linked(2));
        let outer = fork(&mut arena, Cell::Child { kind: FORK, at: inner, link: None, changed: ChangedEdges::default() }, linked(4));
        assert_eq!(admit(&arena, outer, fork_shape), Ok(vec![TreeId(2), TreeId(4)]));
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
    fn an_embedded_child_cannot_point_back_to_its_enclosing_allocation() {
        fn inline_shape(kind: KindId) -> Option<RecordShape> {
            if kind == KindId(9) {
                Some(RecordShape { words: 11, built_words: 3, cells: &[CellShape { word: 2, width: 9, run: None, inline: 7, built: 2 }] })
            } else { shape(kind) }
        }
        let mut arena = Arena::new();
        let root = arena.push(&[9, 0, super::super::cell::tag::INLINE, 0, u32::from(PAIR.0), 0, super::super::cell::tag::CHILD, 9, 0, 0, 0]).expect("a record image");
        arena.words_mut(root.offset(8).expect("the pointer"), 1).expect("the pointer")[0] = root.0;
        assert_eq!(admit(&arena, root, inline_shape), Err(ArenaError::Malformed { what: "child record address", word: root.0 }));
    }

    #[test]
    fn an_embedded_variant_cannot_read_past_the_stamped_child_capacity() {
        fn narrow_shape(kind: KindId) -> Option<RecordShape> {
            if kind == KindId(9) { Some(RecordShape { words: 7, built_words: 3, cells: &[CellShape { word: 2, width: 5, run: None, inline: 2, built: 2 }] }) }
            else { shape(kind) }
        }
        let mut arena = Arena::new();
        let root = arena.push(&[9, 0, super::super::cell::tag::INLINE, 0, u32::from(PAIR.0), 0, 0]).expect("an inline image");
        assert_eq!(admit(&arena, root, narrow_shape), Err(ArenaError::Malformed { what: "inline record width", word: 7 }));
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
