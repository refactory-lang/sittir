//! One slot's cell in a record: a tag word, then the words its form holds.
//! A decode bounds-checks every word against the cell's stamped width and
//! refuses any word no writer writes, so a malformed cell is an error, never
//! a read outside its record.

use super::{Address, Arena, ArenaError, StringRef};
use crate::slot::ChangedEdges;
use crate::types::{KindId, NodeIndex, Span, TreeId};

/// The tag word that opens each cell.
pub mod tag {
    pub const ABSENT: u32 = 0;
    pub const COORDINATE: u32 = 1;
    pub const PARSED_LEAF: u32 = 2;
    pub const CHILD: u32 = 3;
    pub const UNIT: u32 = 4;
    pub const BUILT_LEAF: u32 = 5;
}

/// What one cell holds.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Cell {
    /// The slot holds nothing.
    Absent,
    /// An untouched node of a parsed arena's tree: its row and byte span.
    /// A built record names an untouched parsed child by a `Child` cell
    /// instead, at a parsed record in that child's tree's arena.
    Coordinate { kind: KindId, index: NodeIndex, span: Span },
    /// A parsed leaf: its byte span in the tree's source and its row there,
    /// which keys its sides in the tree's trivia table. It has no record.
    ParsedLeaf { kind: KindId, span: Span, row: NodeIndex },
    /// A captured interior string of a parsed node: its byte span.
    ParsedText { span: Span },
    /// A child with a record of its own: in this cell's arena, or, `link`
    /// set, a parsed record in another tree's arena, which a built record
    /// names for an untouched parsed child.
    Child { kind: KindId, at: Address, link: Option<ParsedLink> },
    /// A unit, which carries no text. `KindId::BLANK` is a blank arm.
    Unit { kind: KindId },
    /// A built leaf: its text in the string table, and its own header-only
    /// record, the key its sides take in the built trivia table.
    BuiltLeaf { kind: KindId, text: StringRef, record: Address },
    /// A captured interior string of a built node: its text in the string table.
    BuiltText { text: StringRef },
}

/// A built record's link to an untouched parsed child: the tree whose arena
/// holds the child's record, and the edges whose neighbour the built holder
/// changed at this site. The site's fact is stamped here, never in the shared
/// parsed record, so two built parents sharing the child can differ; a built
/// child carries its own in its side record instead.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ParsedLink {
    pub tree: TreeId,
    pub changed: ChangedEdges,
}

fn malformed(what: &'static str, word: u32) -> ArenaError {
    ArenaError::Malformed { what, word }
}

fn kind(word: u32) -> Result<KindId, ArenaError> {
    u16::try_from(word).map(KindId).map_err(|_| malformed("cell kind", word))
}

/// A kind a leaf, child or coordinate names: never the blank kind, which
/// marks a captured string or a blank arm.
fn named_kind(word: u32) -> Result<KindId, ArenaError> {
    kind(word).and_then(|kind| if kind == KindId::BLANK { Err(malformed("cell kind", word)) } else { Ok(kind) })
}

fn span(start: u32, end: u32) -> Result<Span, ArenaError> {
    if start <= end { Ok(Span { start, end }) } else { Err(malformed("cell span end", end)) }
}

/// A child's link as two words: the tree plus one, or 0 for the cell's own
/// arena, then the changed edges, leading 1 and trailing 2.
fn link_words(link: Option<ParsedLink>) -> Result<[u32; 2], ArenaError> {
    let Some(ParsedLink { tree, changed }) = link else { return Ok([0, 0]) };
    let tree = tree.0.checked_add(1).ok_or(malformed("child record tree", tree.0))?;
    Ok([tree, u32::from(changed.leading) | u32::from(changed.trailing) << 1])
}

fn read_link(tree: u32, changed: u32) -> Result<Option<ParsedLink>, ArenaError> {
    match (tree.checked_sub(1), changed) {
        (None, 0) => Ok(None),
        (None, _) | (Some(_), 4..) => Err(malformed("child changed edges", changed)),
        (Some(tree), _) => Ok(Some(ParsedLink { tree: TreeId(tree), changed: ChangedEdges { leading: changed & 1 != 0, trailing: changed & 2 != 0 } })),
    }
}

fn record(word: u32) -> Result<Address, ArenaError> {
    if word == Address::NONE.0 { Err(malformed("cell record address", word)) } else { Ok(Address(word)) }
}

impl Cell {
    /// The kind a cell names: blank for captured text, none when absent.
    #[must_use]
    pub const fn kind(self) -> Option<KindId> {
        match self {
            Cell::Absent => None,
            Cell::ParsedText { .. } | Cell::BuiltText { .. } => Some(KindId::BLANK),
            Cell::Coordinate { kind, .. } | Cell::ParsedLeaf { kind, .. } | Cell::Child { kind, .. } | Cell::Unit { kind } | Cell::BuiltLeaf { kind, .. } => Some(kind),
        }
    }

    /// The words this form takes.
    #[must_use]
    pub const fn width(self) -> u32 {
        match self {
            Cell::Absent => 1,
            Cell::Unit { .. } => 2,
            Cell::ParsedText { .. } | Cell::BuiltText { .. } => 4,
            Cell::Coordinate { .. } | Cell::ParsedLeaf { .. } | Cell::Child { .. } | Cell::BuiltLeaf { .. } => 5,
        }
    }

    /// Writes the cell into `out`, the slot's stamped words, zeroing the
    /// words its form leaves unused.
    pub fn encode(self, out: &mut [u32]) -> Result<(), ArenaError> {
        let width = self.width();
        let room = u32::try_from(out.len()).unwrap_or(u32::MAX);
        if room < width {
            return Err(malformed("cell width", room));
        }
        let text_words = |text: StringRef| text.offset().map(|offset| [offset, text.len]).ok_or(malformed("string table offset", text.byte));
        let named = |kind: KindId| if kind == KindId::BLANK { Err(malformed("cell kind", 0)) } else { Ok(u32::from(kind.0)) };
        let words: [u32; 5] = match self {
            Cell::Absent => [tag::ABSENT, 0, 0, 0, 0],
            Cell::Coordinate { kind, index, span } => [tag::COORDINATE, named(kind)?, index.0, span.start, span.end],
            Cell::ParsedLeaf { kind, span, row } => [tag::PARSED_LEAF, named(kind)?, span.start, span.end, row.0],
            Cell::ParsedText { span } => [tag::PARSED_LEAF, 0, span.start, span.end, 0],
            Cell::Child { kind, at, link } => {
                let [tree, changed] = link_words(link)?;
                [tag::CHILD, named(kind)?, record(at.0)?.0, tree, changed]
            }
            Cell::Unit { kind } => [tag::UNIT, u32::from(kind.0), 0, 0, 0],
            Cell::BuiltLeaf { kind, text, record: at } => {
                let [offset, len] = text_words(text)?;
                [tag::BUILT_LEAF, named(kind)?, offset, len, record(at.0)?.0]
            }
            Cell::BuiltText { text } => {
                let [offset, len] = text_words(text)?;
                [tag::BUILT_LEAF, 0, offset, len, 0]
            }
        };
        let (used, rest) = out.split_at_mut(width as usize);
        used.copy_from_slice(&words[..width as usize]);
        rest.fill(0);
        Ok(())
    }

    /// The cell in `words`, the slot's stamped words.
    pub fn decode(words: &[u32]) -> Result<Cell, ArenaError> {
        let &tag = words.first().ok_or(malformed("cell width", 0))?;
        let field = |n: usize| words.get(n).copied().ok_or(malformed("cell tag", tag));
        match tag {
            tag::ABSENT => Ok(Cell::Absent),
            tag::COORDINATE => Ok(Cell::Coordinate { kind: named_kind(field(1)?)?, index: NodeIndex(field(2)?), span: span(field(3)?, field(4)?)? }),
            tag::PARSED_LEAF => {
                let span = span(field(2)?, field(3)?)?;
                match kind(field(1)?)? {
                    KindId::BLANK => Ok(Cell::ParsedText { span }),
                    kind => Ok(Cell::ParsedLeaf { kind, span, row: NodeIndex(field(4)?) }),
                }
            }
            tag::CHILD => Ok(Cell::Child { kind: named_kind(field(1)?)?, at: record(field(2)?)?, link: read_link(field(3)?, field(4)?)? }),
            tag::UNIT => Ok(Cell::Unit { kind: kind(field(1)?)? }),
            tag::BUILT_LEAF => {
                let text = StringRef::from_offset(field(2)?, field(3)?);
                match kind(field(1)?)? {
                    KindId::BLANK => Ok(Cell::BuiltText { text }),
                    kind => Ok(Cell::BuiltLeaf { kind, text, record: record(field(4)?)? }),
                }
            }
            _ => Err(malformed("cell tag", tag)),
        }
    }
}

/// A list slot's cell: the address of its run of item cells and the items
/// in it. An empty list has no run.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ListCell {
    pub run: Address,
    pub len: u32,
}

impl ListCell {
    pub const WIDTH: u32 = 2;
    pub const EMPTY: ListCell = ListCell { run: Address::NONE, len: 0 };

    /// Writes `items` as a run of `item_width`-word cells, and the list's cell.
    pub fn write(arena: &mut Arena, item_width: u32, items: &[Cell]) -> Result<ListCell, ArenaError> {
        if items.is_empty() {
            return Ok(ListCell::EMPTY);
        }
        let len = u32::try_from(items.len()).map_err(|_| ArenaError::Full)?;
        let total = run_words(len, item_width)?;
        let run = arena.alloc(total)?;
        let words = arena.words_mut(run, total)?;
        for (item, out) in items.iter().zip(words.chunks_exact_mut(item_width as usize)) {
            item.encode(out)?;
        }
        Ok(ListCell { run, len })
    }

    pub fn encode(self, out: &mut [u32]) -> Result<(), ArenaError> {
        let out = out.get_mut(..2).ok_or(malformed("cell width", 0))?;
        out.copy_from_slice(&[self.run.0, self.len]);
        Ok(())
    }

    pub fn decode(words: &[u32]) -> Result<ListCell, ArenaError> {
        let [run, len] = *words.get(..2).ok_or(malformed("cell width", 0))? else {
            return Err(malformed("cell width", 0));
        };
        match (run == Address::NONE.0, len == 0) {
            (true, true) => Ok(ListCell::EMPTY),
            (false, false) => Ok(ListCell { run: Address(run), len }),
            (true, false) => Err(malformed("list run address", run)),
            (false, true) => Err(malformed("list length", len)),
        }
    }

    /// Each item's `item_width` words, read from the run in `arena`.
    pub fn items(self, arena: &Arena, item_width: u32) -> Result<std::slice::ChunksExact<'_, u32>, ArenaError> {
        if self.len == 0 {
            return Ok([].chunks_exact(item_width.max(1) as usize));
        }
        let total = run_words(self.len, item_width)?;
        Ok(arena.words(self.run, total)?.chunks_exact(item_width as usize))
    }
}

fn run_words(len: u32, item_width: u32) -> Result<u32, ArenaError> {
    if item_width == 0 {
        return Err(malformed("list item width", 0));
    }
    len.checked_mul(item_width).ok_or(malformed("list length", len))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn round_trip(cell: Cell, width: u32) -> Cell {
        let mut words = vec![9; width as usize];
        cell.encode(&mut words).expect("it fits");
        Cell::decode(&words).expect("it decodes")
    }

    fn every_form(arena: &mut Arena) -> Vec<Cell> {
        let text = arena.intern("name").expect("room");
        let record = arena.alloc(2).expect("room");
        let span = Span { start: 3, end: 7 };
        vec![
            Cell::Absent,
            Cell::Coordinate { kind: KindId(12), index: NodeIndex(40), span },
            Cell::ParsedLeaf { kind: KindId(13), span, row: NodeIndex(41) },
            Cell::ParsedText { span },
            Cell::Child { kind: KindId(14), at: record, link: None },
            Cell::Child { kind: KindId(14), at: record, link: Some(ParsedLink { tree: TreeId(0), changed: ChangedEdges::default() }) },
            Cell::Child { kind: KindId(14), at: record, link: Some(ParsedLink { tree: TreeId(9), changed: ChangedEdges { leading: true, trailing: false } }) },
            Cell::Child { kind: KindId(14), at: record, link: Some(ParsedLink { tree: TreeId(9), changed: ChangedEdges { leading: true, trailing: true } }) },
            Cell::Unit { kind: KindId(15) },
            Cell::Unit { kind: KindId::BLANK },
            Cell::BuiltLeaf { kind: KindId(16), text, record },
            Cell::BuiltLeaf { kind: KindId::ERROR, text, record },
            Cell::BuiltText { text },
        ]
    }

    #[test]
    fn every_form_reads_back_as_written() {
        let mut arena = Arena::new();
        for cell in every_form(&mut arena) {
            assert_eq!(round_trip(cell, 5), cell);
            assert_eq!(round_trip(cell, cell.width()), cell);
        }
    }

    #[test]
    fn a_captured_string_fits_four_words_and_a_leaf_needs_five() {
        let span = Span { start: 0, end: 2 };
        assert_eq!(Cell::ParsedText { span }.width(), <String as crate::record::RecordCell>::WIDTH);
        let mut four = [0; 4];
        assert!(Cell::ParsedLeaf { kind: KindId(3), span, row: NodeIndex(1) }.encode(&mut four).is_err());
        four.copy_from_slice(&[tag::PARSED_LEAF, 3, 0, 2]);
        assert!(Cell::decode(&four).is_err(), "a leaf's row is past a four-word cell");
    }

    #[test]
    fn a_child_names_its_record_s_tree_and_the_site_s_changed_edges() {
        let mut words = [7; 5];
        let link = |tree, trailing| Some(ParsedLink { tree: TreeId(tree), changed: ChangedEdges { leading: false, trailing } });
        Cell::Child { kind: KindId(3), at: Address(6), link: link(0, false) }.encode(&mut words).expect("it fits");
        assert_eq!(words, [tag::CHILD, 3, 6, 1, 0], "tree 0 is one, apart from the cell's own arena");
        Cell::Child { kind: KindId(3), at: Address(6), link: link(4, true) }.encode(&mut words).expect("it fits");
        assert_eq!(words, [tag::CHILD, 3, 6, 5, 2]);
        Cell::Child { kind: KindId(3), at: Address(6), link: None }.encode(&mut words).expect("it fits");
        assert_eq!(words, [tag::CHILD, 3, 6, 0, 0]);
        assert!(Cell::Child { kind: KindId(3), at: Address(6), link: None }.encode(&mut [0; 4]).is_err(), "a child takes five words");
    }

    #[test]
    fn a_blank_arm_is_a_unit_apart_from_absent() {
        let mut words = [7; 5];
        Cell::Unit { kind: KindId::BLANK }.encode(&mut words).expect("it fits");
        assert_eq!(words, [tag::UNIT, 0, 0, 0, 0]);
        assert_ne!(Cell::decode(&words), Ok(Cell::Absent));
    }

    #[test]
    fn a_leaf_child_or_coordinate_of_the_blank_kind_is_refused() {
        let span = Span { start: 0, end: 0 };
        let mut words = [0; 5];
        for cell in [
            Cell::Coordinate { kind: KindId::BLANK, index: NodeIndex(1), span },
            Cell::Child { kind: KindId::BLANK, at: Address(4), link: None },
            Cell::Child { kind: KindId(2), at: Address::NONE, link: None },
            Cell::Child { kind: KindId(2), at: Address(4), link: Some(ParsedLink { tree: TreeId(u32::MAX), changed: ChangedEdges::default() }) },
        ] {
            assert!(cell.encode(&mut words).is_err(), "{cell:?}");
        }
        for words in [[tag::COORDINATE, 0, 1, 0, 0], [tag::CHILD, 0, 4, 0, 0], [tag::CHILD, 2, 0, 0, 0]] {
            assert!(Cell::decode(&words).is_err(), "{words:?}");
        }
    }

    #[test]
    fn a_cell_no_writer_writes_is_refused() {
        for words in [
            vec![],
            vec![6, 0, 0, 0, 0],
            vec![u32::MAX, 0, 0, 0, 0],
            vec![tag::COORDINATE, 70_000, 1, 0, 0],
            vec![tag::COORDINATE, 2, 1, 9, 3],
            vec![tag::CHILD, 2],
            vec![tag::CHILD, 2, 4],
            vec![tag::CHILD, 2, 4, 0],
            vec![tag::CHILD, 2, 4, 0, 1],
            vec![tag::CHILD, 2, 4, 3, 4],
            vec![tag::UNIT],
        ] {
            assert!(Cell::decode(&words).is_err(), "{words:?}");
        }
    }

    #[test]
    fn a_list_reads_its_run_back() {
        let mut arena = Arena::new();
        let items = every_form(&mut arena);
        let list = ListCell::write(&mut arena, 5, &items).expect("room");
        let mut words = [0; 2];
        list.encode(&mut words).expect("it fits");
        let read = ListCell::decode(&words).expect("it decodes");
        let cells: Vec<Cell> = read.items(&arena, 5).expect("its run").map(|item| Cell::decode(item).expect("each item")).collect();
        assert_eq!(cells, items);
    }

    #[test]
    fn an_empty_list_has_no_run() {
        let mut arena = Arena::new();
        let list = ListCell::write(&mut arena, 5, &[]).expect("room");
        assert_eq!(list, ListCell::EMPTY);
        assert_eq!(list.items(&arena, 5).expect("no run").len(), 0);
    }

    #[test]
    fn a_list_cell_no_writer_writes_is_refused() {
        let arena = Arena::new();
        assert!(ListCell::decode(&[0, 3]).is_err());
        assert!(ListCell::decode(&[5, 0]).is_err());
        assert!(ListCell::decode(&[5]).is_err());
        let past = ListCell { run: Address(1), len: 1_000 };
        assert!(past.items(&arena, 5).is_err());
        assert!(ListCell { run: Address(1), len: u32::MAX }.items(&arena, 5).is_err());
        assert!(ListCell { run: Address(1), len: 1 }.items(&arena, 0).is_err());
    }
}
