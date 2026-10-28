//! Admitting records written outside the native writer. A native writer
//! writes a record's children before it, so its records hold no cycle; words
//! written elsewhere are walked once, when they cross in, and refused unless
//! they hold to that order. Decode then trusts them, checking only bounds.

use super::small::{SmallMap, SmallStack};

use super::{Address, ArenaError, ArenaRead, Cell, CellWord, ListCell, SideRecord};
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
/// width, the forms it holds (`record::form`), the words a bounded child's
/// embedded record takes, and for a list (one word naming its run) the width
/// of each item's cell in its run; in a built record, its one word. `key` is
/// the slot's wire key, which a refusal of the slot names.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CellShape {
    pub word: u32,
    pub width: u32,
    pub run: Option<u32>,
    pub inline: u32,
    pub forms: u8,
    pub built: u32,
    pub key: &'static str,
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

/// Visits each cell of the parsed record at `at`, of shape `record`: a list
/// slot's each item, and with an embedded record its capacity.
pub(super) fn for_each_parsed_cell(
    arena: &dyn ArenaRead,
    at: Address,
    record: RecordShape,
    bits: u32,
    mut visit: impl FnMut(Cell, u32) -> Result<(), ArenaError>,
) -> Result<(), ArenaError> {
    let words = arena.words(at, record.words.max(HEADER_WORDS))?;
    for cell in record.cells {
        let start = cell.word as usize;
        match cell.run {
            None => {
                let words = words.get(start..start + cell.width as usize).ok_or(malformed("cell word", cell.word))?;
                let slot = at.offset(cell.word).ok_or(malformed("cell word", cell.word))?;
                let decoded = Cell::decode_parsed(words, slot, *cell, bits)?;
                visit(decoded, if matches!(decoded, Cell::Child { .. }) { cell.inline } else { 0 })?;
            }
            Some(run) => {
                let word = *words.get(start).ok_or(malformed("cell word", cell.word))?;
                for item in ListCell::of_word(CellWord(word), arena)?.items(arena, run)? {
                    visit(Cell::decode_parsed(item, Address::NONE, *cell, bits)?, 0)?;
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
    bits: u32,
    mut visit: impl FnMut(Cell) -> Result<(), ArenaError>,
) -> Result<(), ArenaError> {
    let words = arena.words(at, record.built_words.max(HEADER_WORDS))?;
    for cell in record.cells {
        let word = *words.get(cell.built as usize).ok_or(malformed("cell word", cell.built))?;
        if cell.run.is_none() {
            visit(Cell::decode_built(CellWord(word), arena, bits)?.below(floor)?)?;
            continue;
        }
        let list = ListCell::of_word(CellWord(word), arena)?;
        if list.len != 0 && list.run >= floor {
            return Err(malformed("list run address", list.run.0));
        }
        for item in list.items(arena, 1)? {
            visit(Cell::decode_built(CellWord(item[0]), arena, bits)?.below(floor)?)?;
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
/// arenas a render of the root reaches. Kind fields take `bits` bits.
///
/// # Errors
///
/// The first word that breaks one of these: `ArenaError::OutOfBounds` for
/// words the arena never wrote, `ArenaError::Malformed` for any other.
pub fn admit(arena: &dyn ArenaRead, root: Address, shape: fn(KindId) -> Option<RecordShape>, bits: u32) -> Result<Vec<TreeId>, ArenaError> {
    let mut seen = SmallMap::<(Address, Address), Option<KindId>>::new();
    let mut pending = SmallStack::new();
    let mut linked = Vec::new();
    pending.push((root, arena.header_kind(root, bits)?));
    while let Some((at, named)) = pending.pop() {
        let record = shape(named).ok_or(malformed("record kind", u32::from(named.0)))?;
        let verified = seen.entry((at, at)).or_default();
        if let Some(kind) = verified {
            if *kind != named {
                return Err(malformed("record kind", u32::from(kind.0)));
            }
            continue;
        }
        let kind = arena.header_kind(at, bits)?;
        if kind != named {
            return Err(malformed("record kind", u32::from(kind.0)));
        }
        *verified = Some(kind);
        let words = arena.words(at, record.built_words.max(HEADER_WORDS))?;
        SideRecord::read(arena, Address(words[1]))?;
        for_each_built_cell(arena, at, record, at, bits, |cell| {
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
    use crate::arena::built_image::{built_cell, BuiltImage};
    use crate::arena::StringRef;
    use crate::record::form;
    use crate::slot::ChangedEdges;
    use crate::types::{NodeIndex, Span};

    const BITS: u32 = 9;
    const PAIR: KindId = KindId(7);
    const LEAF: KindId = KindId(8);
    const FORK: KindId = KindId(9);

    /// A pair record holds one child cell, built at word 2; a fork two, at
    /// words 2 and 3; a leaf is its header.
    fn shape(kind: KindId) -> Option<RecordShape> {
        const PAIR_CELLS: &[CellShape] = &[CellShape { word: 2, width: 3, run: None, inline: 0, forms: form::NODE, built: 2, key: "_child" }];
        const FORK_CELLS: &[CellShape] = &[
            CellShape { word: 2, width: 3, run: None, inline: 0, forms: form::NODE, built: 2, key: "_first" },
            CellShape { word: 5, width: 3, run: None, inline: 0, forms: form::NODE, built: 3, key: "_second" },
        ];
        match kind {
            PAIR => Some(RecordShape { words: 5, built_words: 3, cells: PAIR_CELLS }),
            FORK => Some(RecordShape { words: 8, built_words: 4, cells: FORK_CELLS }),
            LEAF => Some(RecordShape { words: HEADER_WORDS, built_words: HEADER_WORDS, cells: &[] }),
            _ => None,
        }
    }

    fn cell(at: Address) -> u32 {
        built_cell(at, ChangedEdges::default())
    }

    fn pair(image: &mut BuiltImage, child: Address) -> Address {
        image.record(PAIR, 3, &[(2, cell(child))])
    }

    #[test]
    fn records_whose_cells_name_records_below_them_are_admitted() {
        let mut image = BuiltImage::new(BITS);
        let leaf = image.record(LEAF, HEADER_WORDS, &[]);
        let inner = pair(&mut image, leaf);
        let outer = pair(&mut image, inner);
        assert_eq!(admit(&image, outer, shape, BITS), Ok(Vec::new()));
    }

    #[test]
    fn a_built_leaf_cell_is_admitted_by_its_kind_and_its_text() {
        let mut image = BuiltImage::new(BITS);
        let leaves = [image.entry(LEAF, "x"), image.entry(KindId(40), "x"), image.entry_claiming(LEAF, 64, "x")];
        let [admitted, unknown, past] = leaves.map(|leaf| pair(&mut image, leaf));
        assert_eq!(admit(&image, admitted, shape, BITS), Ok(Vec::new()));
        assert_eq!(admit(&image, unknown, shape, BITS), Err(ArenaError::Malformed { what: "built leaf kind", word: 40 }));
        assert!(matches!(admit(&image, past, shape, BITS), Err(ArenaError::BadString(StringRef { len: 64, .. }))));
    }

    #[test]
    fn a_record_two_cells_name_is_admitted_once() {
        let mut image = BuiltImage::new(BITS);
        let leaf = image.record(LEAF, HEADER_WORDS, &[]);
        let shared = image.record(FORK, 4, &[(2, cell(leaf)), (3, cell(leaf))]);
        assert_eq!(admit(&image, shared, shape, BITS), Ok(Vec::new()));
    }

    #[test]
    fn the_trees_its_cells_link_are_answered_once_each_in_order() {
        let mut image = BuiltImage::new(BITS);
        let linked = |image: &mut BuiltImage, tree| cell(image.link(PAIR, TreeId(tree), NodeIndex(1), NodeIndex(2), Address(6), Span { start: 0, end: 1 }));
        let (four, two) = (linked(&mut image, 4), linked(&mut image, 2));
        let inner = image.record(FORK, 4, &[(2, four), (3, two)]);
        let again = linked(&mut image, 4);
        let outer = image.record(FORK, 4, &[(2, cell(inner)), (3, again)]);
        assert_eq!(admit(&image, outer, shape, BITS), Ok(vec![TreeId(2), TreeId(4)]));
    }

    #[test]
    fn a_cell_naming_a_record_at_or_past_its_holder_is_refused() {
        let mut image = BuiltImage::new(BITS);
        let first = image.record(LEAF, HEADER_WORDS, &[]);
        let inner = Address(first.0 + HEADER_WORDS);
        let outer = Address(inner.0 + 3);
        assert_eq!(pair(&mut image, outer), inner);
        assert_eq!(pair(&mut image, inner), outer);
        assert_eq!(admit(&image, outer, shape, BITS), Err(ArenaError::Malformed { what: "child record address", word: outer.0 }), "the inner record names the outer one: a cycle");
    }

    #[test]
    fn a_record_of_a_kind_with_no_shape_is_refused() {
        let mut image = BuiltImage::new(BITS);
        let unknown = image.record(KindId(99), HEADER_WORDS, &[]);
        assert_eq!(admit(&image, unknown, shape, BITS), Err(ArenaError::Malformed { what: "record kind", word: 99 }));
        let holder = pair(&mut image, unknown);
        assert_eq!(admit(&image, holder, shape, BITS), Err(ArenaError::Malformed { what: "record kind", word: 99 }));
    }
}
