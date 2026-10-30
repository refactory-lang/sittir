//! Admitting records written outside the native writer. A native writer
//! writes a record's children before it, so its records hold no cycle; words
//! written elsewhere are walked once, when they cross in, and refused when a
//! chain of their cells returns to a record on it. Where a record lies says
//! nothing of when it was written: a run longer than a chunk has a chunk of
//! its own, numbered past its holder's, and a freed chunk's number comes
//! back. Decode then trusts them, checking only bounds.

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
/// slot's each item.
pub(super) fn for_each_built_cell(arena: &dyn ArenaRead, at: Address, record: RecordShape, bits: u32, mut visit: impl FnMut(Cell) -> Result<(), ArenaError>) -> Result<(), ArenaError> {
    let words = arena.words(at, record.built_words.max(HEADER_WORDS))?;
    for cell in record.cells {
        let word = *words.get(cell.built as usize).ok_or(malformed("cell word", cell.built))?;
        if cell.run.is_none() {
            visit(Cell::decode_built(CellWord(word), arena, bits)?)?;
            continue;
        }
        for item in ListCell::of_word(CellWord(word), arena)?.items(arena, 1)? {
            visit(Cell::decode_built(CellWord(item[0]), arena, bits)?)?;
        }
    }
    Ok(())
}

/// Where the admission walk stands at a record: met, entered while the
/// records its cells name are walked, then left, admitted as the kind its
/// header names.
#[derive(Debug, Clone, Copy)]
enum Walked {
    Met,
    Entered,
    Left(KindId),
}

/// The admission walk's next step: entering the record a cell names, of the
/// kind the cell names, or leaving a record once the records its cells name
/// are walked.
enum Step {
    Enter(Address, KindId),
    Leave(Address, KindId),
}

/// Admits the built records of `arena` the record at `root` reaches, their
/// shapes by `shape`: each is read once, its header naming a kind `shape`
/// knows and its cell's, its side record and every cell decoding, and no
/// cell naming a record the walk has entered and not left, so no chain of
/// cells cycles. A cell linking a parsed node is left to its tree's arena,
/// which only a native writer writes; the trees those cells link are
/// answered, each once, in order: the parsed arenas a render of the root
/// reaches. Kind fields take `bits` bits.
///
/// # Errors
///
/// The first word that breaks one of these: `ArenaError::OutOfBounds` for
/// words the arena never wrote, `ArenaError::Malformed` for any other.
pub fn admit(arena: &dyn ArenaRead, root: Address, shape: fn(KindId) -> Option<RecordShape>, bits: u32) -> Result<Vec<TreeId>, ArenaError> {
    let mut walked = SmallMap::<Address, Walked>::new();
    let mut pending = SmallStack::new();
    let mut linked = Vec::new();
    pending.push(Step::Enter(root, arena.header_kind(root, bits)?));
    while let Some(step) = pending.pop() {
        let (at, named) = match step {
            Step::Enter(at, named) => (at, named),
            Step::Leave(at, kind) => {
                *walked.entry(at).or_insert(Walked::Left(kind)) = Walked::Left(kind);
                continue;
            }
        };
        let record = shape(named).ok_or(malformed("record kind", u32::from(named.0)))?;
        let walk = walked.entry(at).or_insert(Walked::Met);
        match *walk {
            Walked::Entered => return Err(malformed("child record address", at.0)),
            Walked::Left(kind) if kind != named => return Err(malformed("record kind", u32::from(kind.0))),
            Walked::Left(_) => continue,
            Walked::Met => {}
        }
        let kind = arena.header_kind(at, bits)?;
        if kind != named {
            return Err(malformed("record kind", u32::from(kind.0)));
        }
        *walk = Walked::Entered;
        pending.push(Step::Leave(at, kind));
        let words = arena.words(at, record.built_words.max(HEADER_WORDS))?;
        SideRecord::read(arena, Address(words[1]))?;
        for_each_built_cell(arena, at, record, bits, |cell| {
            match cell {
                Cell::Child { kind, at: child, link: None, .. } => pending.push(Step::Enter(child, kind)),
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
    use crate::arena::{BuiltChunks, BuiltWriter, StringRef, CHUNK_WORDS, MAX_BUILT_CHUNKS};
    use crate::record::form;
    use crate::slot::ChangedEdges;
    use crate::types::{NodeIndex, Span};

    const BITS: u32 = 9;
    const PAIR: KindId = KindId(7);
    const LEAF: KindId = KindId(8);
    const FORK: KindId = KindId(9);
    const LIST: KindId = KindId(10);

    /// A pair record holds one child cell, built at word 2; a fork two, at
    /// words 2 and 3; a list the cell naming its run, at word 2; a leaf is
    /// its header.
    fn shape(kind: KindId) -> Option<RecordShape> {
        const PAIR_CELLS: &[CellShape] = &[CellShape { word: 2, width: 3, run: None, inline: 0, forms: form::NODE, built: 2, key: "_child" }];
        const FORK_CELLS: &[CellShape] = &[
            CellShape { word: 2, width: 3, run: None, inline: 0, forms: form::NODE, built: 2, key: "_first" },
            CellShape { word: 5, width: 3, run: None, inline: 0, forms: form::NODE, built: 3, key: "_second" },
        ];
        const LIST_CELLS: &[CellShape] = &[CellShape { word: 2, width: 1, run: Some(3), inline: 0, forms: form::NODE, built: 2, key: "_items" }];
        match kind {
            PAIR => Some(RecordShape { words: 5, built_words: 3, cells: PAIR_CELLS }),
            FORK => Some(RecordShape { words: 8, built_words: 4, cells: FORK_CELLS }),
            LIST => Some(RecordShape { words: 3, built_words: 3, cells: LIST_CELLS }),
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
    fn a_chain_of_records_its_cells_name_is_admitted() {
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
    fn a_record_is_admitted_whatever_chunks_the_records_and_runs_its_cells_name_lie_in() {
        let mut image = BuiltImage::new(BITS);
        let holders = image.open_chunk();
        image.open_chunk();
        let leaf = image.record(LEAF, HEADER_WORDS, &[]);
        let long = image.run(&vec![cell(leaf); CHUNK_WORDS as usize]);
        let short = image.run(&[cell(leaf), cell(leaf)]);
        let held = [
            image.record_in(holders, PAIR, 3, &[(2, cell(leaf))]),
            image.record_in(holders, LIST, 3, &[(2, long)]),
            image.record_in(holders, LIST, 3, &[(2, short)]),
        ];
        assert!(Address(long >> 2).chunk() > leaf.chunk() && Address(short >> 2).chunk() > leaf.chunk());
        for holder in held {
            assert!(holder.chunk() < leaf.chunk());
            assert_eq!(admit(&image, holder, shape, BITS), Ok(Vec::new()));
        }
    }

    #[test]
    fn a_holder_in_a_chunk_whose_number_came_back_is_admitted_over_a_child_in_a_later_numbered_chunk() {
        let mut chunks = BuiltChunks::new(BITS, shape);
        for _ in 1..MAX_BUILT_CHUNKS - 1 {
            chunks.alloc_words(1).expect("a fresh number");
        }
        let mut writer = BuiltWriter::new(&mut chunks);
        let leaf = writer.record(&[writer.header(LEAF, 0).expect("a kind"), 0], false).expect("placed");
        let mut writer = BuiltWriter::new(&mut chunks);
        let holder = writer.record(&[writer.header(PAIR, 0).expect("a kind"), 0, cell(leaf)], true).expect("placed");
        assert!(holder.chunk() < leaf.chunk(), "the holder's chunk took a number freed before the child's chunk opened");
        assert_eq!(admit(&chunks, holder, shape, BITS), Ok(Vec::new()));
    }

    #[test]
    fn a_chain_of_cells_returning_to_a_record_on_it_is_refused() {
        let mut image = BuiltImage::new(BITS);
        let first = image.record(LEAF, HEADER_WORDS, &[]);
        let inner = Address(first.0 + HEADER_WORDS);
        let outer = Address(inner.0 + 3);
        assert_eq!(pair(&mut image, outer), inner);
        assert_eq!(pair(&mut image, inner), outer);
        assert_eq!(admit(&image, outer, shape, BITS), Err(ArenaError::Malformed { what: "child record address", word: outer.0 }), "the inner record names the outer one: a cycle");
        let own = Address(outer.0 + 3);
        assert_eq!(pair(&mut image, own), own);
        assert_eq!(admit(&image, own, shape, BITS), Err(ArenaError::Malformed { what: "child record address", word: own.0 }), "a record that names itself");
        let holders = image.open_chunk();
        image.open_chunk();
        let list = BuiltImage::address(holders, 0);
        let run = image.run(&[cell(first), cell(list)]);
        assert_eq!(image.record_in(holders, LIST, 3, &[(2, run)]), list);
        assert_eq!(admit(&image, list, shape, BITS), Err(ArenaError::Malformed { what: "child record address", word: list.0 }), "a list whose item names its holder");
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
