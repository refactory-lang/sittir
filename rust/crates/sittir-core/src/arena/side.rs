//! A record's side record: the layout facts beside its slots. Word 0 is a
//! mask of the fields present, and the fields follow in a fixed order:
//! `at` (index, end, byte start, byte end), `edges`, `span`, `sides`, `separator`, `delimiter`,
//! `separator_kind`, `flanks`, `slots`. `changed` is two bits of the mask. It holds no trivia and no unit sides: a written side is
//! in the engine's store of written sides ([`crate::trivia_store`]), and a
//! parsed node's assigned sides in its tree's trivia table.

use super::{Address, Arena, ArenaError};
use crate::options::{EdgeArm, Edges};
use crate::points::{Point, PointSpan};
use crate::slot::ChangedEdges;
use crate::spacing::SeamStrength;
use crate::types::{Delimiter, KindId, NodeIndex, Span, TreeId};

/// The fields a reader of a record finds before a list's delimiters
/// setting, in the order the side record holds them after its mask word:
/// each one's mask bit and the words it takes. The addon exports them, and
/// JavaScript reads a parsed record's row and a list's delimiters setting
/// through them.
pub mod field {
    pub const AT: u32 = super::mask::AT;
    pub const AT_WORDS: u32 = 4;
    pub const EDGES: u32 = super::mask::EDGES;
    pub const EDGES_WORDS: u32 = 2;
    pub const SPAN: u32 = super::mask::SPAN;
    pub const SPAN_WORDS: u32 = 4;
    pub const SIDES: u32 = super::mask::SIDES;
    pub const SIDES_WORDS: u32 = 5;
    pub const SEPARATOR: u32 = super::mask::SEPARATOR;
    pub const SEPARATOR_WORDS: u32 = 1;
    pub const DELIMITER: u32 = super::mask::DELIMITER;
}

mod mask {
    pub const AT: u32 = 1;
    pub const EDGES: u32 = 1 << 1;
    pub const SPAN: u32 = 1 << 2;
    pub const SIDES: u32 = 1 << 3;
    pub const CHANGED_LEADING: u32 = 1 << 4;
    pub const CHANGED_TRAILING: u32 = 1 << 5;
    pub const SEPARATOR: u32 = 1 << 6;
    pub const SLOTS: u32 = 1 << 7;
    pub const DELIMITER: u32 = 1 << 8;
    pub const SEPARATOR_KIND: u32 = 1 << 9;
    pub const FLANKS: u32 = 1 << 10;
    pub const ALL: u32 = (1 << 11) - 1;
}

/// A parsed node's place in the tree its arena is: its subtree's rows,
/// `[index, end)`, and its byte span, as its read stamped them, so a view
/// of the record has its whole coordinate from the record alone.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Row {
    pub index: NodeIndex,
    pub end: NodeIndex,
    pub span: Span,
}

/// The node a built node was rebuilt from: its tree, its subtree's rows and
/// its byte span.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Sides {
    pub tree: TreeId,
    pub index: NodeIndex,
    pub end: NodeIndex,
    pub span: Span,
}

impl Sides {
    /// The node's coordinate in its tree.
    #[must_use]
    pub fn coordinate(self) -> crate::slot::NodeCoordinate {
        crate::slot::NodeCoordinate::new(self.tree, self.index, self.end, self.span)
    }
}

/// A list slot's stored layout and its separator spacing settings, keyed by
/// its cell's stamped word.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SideSlot {
    pub word: u32,
    pub before: Option<KindId>,
    pub after: Option<KindId>,
    pub separator: Option<KindId>,
    /// The slot's `…_separator_space_before` setting.
    pub space_before: Option<KindId>,
    /// The slot's `…_separator_space` (`…_after`) setting.
    pub space_after: Option<KindId>,
    pub tokens: Vec<Option<KindId>>,
}

/// What a side record holds.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SideRecord {
    /// A parsed node's rows and byte span; the tree is the arena's.
    pub at: Option<Row>,
    pub edges: Option<Edges>,
    pub span: Option<PointSpan>,
    pub sides: Option<Sides>,
    pub changed: ChangedEdges,
    pub separator: Option<KindId>,
    /// A list's delimiters setting; an explicit empty set is `Some`.
    pub delimiter: Option<Delimiter>,
    /// A list's chosen separator setting, a builder's preference.
    pub separator_kind: Option<KindId>,
    /// A snapshot root's stamped flanks (`NodeLayout::flanks`).
    pub flanks: crate::layout_kinds::Flanks,
    pub slots: Vec<SideSlot>,
}

/// The words of one slot entry: word, before, after, separator, the two
/// spacing settings, and the tokens run's address and length.
const SLOT_WORDS: u32 = 8;
/// An edge side's word marks a set side with this bit, so a blank arm with
/// no strength still differs from an unset side.
const EDGE_SET: u32 = 1 << 31;

fn malformed(what: &'static str, word: u32) -> ArenaError {
    ArenaError::Malformed { what, word }
}

/// An optional kind as one word, plus one so 0 is none.
fn optional_kind(kind: Option<KindId>) -> u32 {
    kind.map_or(0, |kind| u32::from(kind.0) + 1)
}

fn read_optional_kind(word: u32) -> Result<Option<KindId>, ArenaError> {
    match word {
        0 => Ok(None),
        _ => u16::try_from(word - 1).map(|kind| Some(KindId(kind))).map_err(|_| malformed("side record kind", word)),
    }
}

fn read_kind(word: u32) -> Result<KindId, ArenaError> {
    u16::try_from(word).map(KindId).map_err(|_| malformed("side record kind", word))
}

fn read_delimiter(word: u32) -> Result<Delimiter, ArenaError> {
    let every = Delimiter::LEADING.with(Delimiter::TRAILING);
    u8::try_from(word).ok().map(Delimiter).filter(|&set| set.without(every) == Delimiter::NONE).ok_or(malformed("side record delimiter", word))
}

/// One edge side as a word: the set bit, the strength plus one (0 when the
/// stamp has none) above the arm's kind.
fn edge_word(edge: Option<EdgeArm>) -> u32 {
    edge.map_or(0, |edge| EDGE_SET | edge.strength.map_or(0, |strength| u32::from(strength as u8) + 1) << 16 | u32::from(edge.arm.0))
}

fn read_edge(word: u32) -> Result<Option<EdgeArm>, ArenaError> {
    if word & EDGE_SET == 0 {
        return if word == 0 { Ok(None) } else { Err(malformed("side record edge", word)) };
    }
    let arm = KindId(u16::try_from(word & 0xffff).map_err(|_| malformed("side record edge", word))?);
    let strength = match (word & !EDGE_SET) >> 16 {
        0 => None,
        code => Some(u8::try_from(code - 1).ok().and_then(SeamStrength::from_code).ok_or(malformed("side record edge strength", code))?),
    };
    Ok(Some(EdgeArm { arm, strength }))
}

/// The words of a side record as it is read: a cursor over its fields.
struct Fields<'a> {
    arena: &'a Arena,
    at: Address,
    offset: u32,
}

impl<'a> Fields<'a> {
    fn take(&mut self, n: u32) -> Result<&'a [u32], ArenaError> {
        let end = self.offset.checked_add(n).ok_or(ArenaError::OutOfBounds { chunk: self.at.chunk(), word: self.at.word().saturating_add(self.offset), len: n })?;
        let words = &self.arena.words(self.at, end)?[self.offset as usize..];
        self.offset = end;
        Ok(words)
    }

    fn array<const N: usize>(&mut self) -> Result<[u32; N], ArenaError> {
        let n = u32::try_from(N).map_err(|_| ArenaError::Full)?;
        let words = self.take(n)?;
        <[u32; N]>::try_from(words).map_err(|_| ArenaError::OutOfBounds { chunk: self.at.chunk(), word: self.at.word().saturating_add(self.offset), len: n })
    }
}

impl SideRecord {
    /// Whether the record holds nothing, so its record names no side record.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        *self == SideRecord::default()
    }

    /// Writes the side record, its slots' token runs first, and its address:
    /// `Address::NONE` when it holds nothing.
    pub fn write(&self, arena: &mut Arena) -> Result<Address, ArenaError> {
        if self.is_empty() {
            return Ok(Address::NONE);
        }
        let mut flags = 0;
        let mut words = vec![0];
        if let Some(Row { index, end, span }) = self.at {
            flags |= mask::AT;
            words.extend([index.0, end.0, span.start, span.end]);
        }
        if let Some(edges) = self.edges {
            flags |= mask::EDGES;
            words.extend([edge_word(edges.before), edge_word(edges.after)]);
        }
        if let Some(PointSpan { start, end }) = self.span {
            flags |= mask::SPAN;
            words.extend([start.row, start.column, end.row, end.column]);
        }
        if let Some(sides) = self.sides {
            flags |= mask::SIDES;
            words.extend([sides.tree.0, sides.index.0, sides.end.0, sides.span.start, sides.span.end]);
        }
        if self.changed.leading {
            flags |= mask::CHANGED_LEADING;
        }
        if self.changed.trailing {
            flags |= mask::CHANGED_TRAILING;
        }
        if let Some(separator) = self.separator {
            flags |= mask::SEPARATOR;
            words.push(u32::from(separator.0));
        }
        if let Some(delimiter) = self.delimiter {
            flags |= mask::DELIMITER;
            words.push(u32::from(delimiter.0));
        }
        if let Some(kind) = self.separator_kind {
            flags |= mask::SEPARATOR_KIND;
            words.push(u32::from(kind.0));
        }
        if !self.flanks.is_none() {
            flags |= mask::FLANKS;
            words.push(self.flanks.word());
        }
        if !self.slots.is_empty() {
            flags |= mask::SLOTS;
            words.push(u32::try_from(self.slots.len()).map_err(|_| ArenaError::Full)?);
            for slot in &self.slots {
                let tokens: Vec<u32> = slot.tokens.iter().copied().map(optional_kind).collect();
                let (run, len) = if tokens.is_empty() { (Address::NONE, 0) } else { (arena.push(&tokens)?, u32::try_from(tokens.len()).map_err(|_| ArenaError::Full)?) };
                words.extend([
                    slot.word,
                    optional_kind(slot.before),
                    optional_kind(slot.after),
                    optional_kind(slot.separator),
                    optional_kind(slot.space_before),
                    optional_kind(slot.space_after),
                    run.0,
                    len,
                ]);
            }
        }
        words[0] = flags;
        arena.push(&words)
    }

    /// The side record at `at`; an empty one at `Address::NONE`.
    pub fn read(arena: &Arena, at: Address) -> Result<SideRecord, ArenaError> {
        if at == Address::NONE {
            return Ok(SideRecord::default());
        }
        let mut fields = Fields { arena, at, offset: 0 };
        let [flags] = fields.array()?;
        if flags & !mask::ALL != 0 || flags == 0 {
            return Err(malformed("side record mask", flags));
        }
        let has = |bit: u32| flags & bit != 0;
        let mut record = SideRecord { changed: ChangedEdges { leading: has(mask::CHANGED_LEADING), trailing: has(mask::CHANGED_TRAILING) }, ..SideRecord::default() };
        if has(mask::AT) {
            let [index, end, start, end_byte]: [u32; field::AT_WORDS as usize] = fields.array()?;
            if start > end_byte {
                return Err(malformed("side record span end", end_byte));
            }
            record.at = Some(Row { index: NodeIndex(index), end: NodeIndex(end), span: Span { start, end: end_byte } });
        }
        if has(mask::EDGES) {
            let [before, after]: [u32; field::EDGES_WORDS as usize] = fields.array()?;
            record.edges = Some(Edges { before: read_edge(before)?, after: read_edge(after)? });
        }
        if has(mask::SPAN) {
            let [start_row, start_column, end_row, end_column]: [u32; field::SPAN_WORDS as usize] = fields.array()?;
            record.span = Some(PointSpan { start: Point { row: start_row, column: start_column }, end: Point { row: end_row, column: end_column } });
        }
        if has(mask::SIDES) {
            let [tree, index, end, start, stop]: [u32; field::SIDES_WORDS as usize] = fields.array()?;
            if start > stop {
                return Err(malformed("side record span end", stop));
            }
            record.sides = Some(Sides { tree: TreeId(tree), index: NodeIndex(index), end: NodeIndex(end), span: Span { start, end: stop } });
        }
        if has(mask::SEPARATOR) {
            let [separator]: [u32; field::SEPARATOR_WORDS as usize] = fields.array()?;
            record.separator = Some(read_kind(separator)?);
        }
        if has(mask::DELIMITER) {
            let [delimiter] = fields.array()?;
            record.delimiter = Some(read_delimiter(delimiter)?);
        }
        if has(mask::SEPARATOR_KIND) {
            let [kind] = fields.array()?;
            record.separator_kind = Some(read_kind(kind)?);
        }
        if has(mask::FLANKS) {
            let [word] = fields.array()?;
            record.flanks = crate::layout_kinds::Flanks::of_word(word).filter(|flanks| !flanks.is_none()).ok_or(malformed("side record flanks", word))?;
        }
        if has(mask::SLOTS) {
            let [count] = fields.array()?;
            let entries = fields.take(count.checked_mul(SLOT_WORDS).ok_or(malformed("side record slot count", count))?)?;
            let (entries, _) = entries.as_chunks::<{ SLOT_WORDS as usize }>();
            record.slots = entries
                .iter()
                .map(|&[word, before, after, separator, space_before, space_after, run, len]| {
                    let tokens = match (run, len) {
                        (0, 0) => Vec::new(),
                        (0, _) => return Err(malformed("side record tokens address", run)),
                        _ => arena.words(Address(run), len)?.iter().map(|&token| read_optional_kind(token)).collect::<Result<_, _>>()?,
                    };
                    Ok(SideSlot {
                        word,
                        before: read_optional_kind(before)?,
                        after: read_optional_kind(after)?,
                        separator: read_optional_kind(separator)?,
                        space_before: read_optional_kind(space_before)?,
                        space_after: read_optional_kind(space_after)?,
                        tokens,
                    })
                })
                .collect::<Result<_, _>>()?;
        }
        Ok(record)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn full() -> SideRecord {
        SideRecord {
            at: Some(Row { index: NodeIndex(4), end: NodeIndex(9), span: Span { start: 3, end: 8 } }),
            edges: Some(Edges {
                before: Some(EdgeArm { arm: KindId::BLANK, strength: None }),
                after: Some(EdgeArm { arm: KindId(31), strength: Some(SeamStrength::Trivia) }),
            }),
            span: Some(PointSpan { start: Point { row: 1, column: 2 }, end: Point { row: 3, column: 0 } }),
            sides: Some(Sides { tree: TreeId(2), index: NodeIndex(5), end: NodeIndex(6), span: Span { start: 10, end: 14 } }),
            changed: ChangedEdges { leading: true, trailing: false },
            separator: Some(KindId(7)),
            delimiter: Some(Delimiter::TRAILING),
            separator_kind: Some(KindId(12)),
            flanks: crate::layout_kinds::Flanks { before: crate::layout_kinds::LayoutKinds::NEWLINE, after: crate::layout_kinds::LayoutKinds::NONE },
            slots: vec![
                SideSlot {
                    word: 2,
                    before: Some(KindId::BLANK),
                    after: None,
                    separator: Some(KindId(8)),
                    space_before: None,
                    space_after: Some(KindId(3)),
                    tokens: vec![None, Some(KindId(8)), Some(KindId::BLANK)],
                },
                SideSlot { word: 7, ..SideSlot::default() },
                SideSlot { word: 9, space_before: Some(KindId::BLANK), ..SideSlot::default() },
            ],
        }
    }

    #[test]
    fn a_side_record_reads_back_as_written() {
        let mut arena = Arena::new();
        let record = full();
        let at = record.write(&mut arena).expect("room");
        assert_eq!(SideRecord::read(&arena, at), Ok(record));
    }

    #[test]
    fn a_side_record_ending_at_the_packed_word_boundary_reads_back() {
        let mut arena = Arena::new();
        arena.alloc(crate::arena::CHUNK_WORDS).expect("a full chunk");
        arena.alloc(crate::arena::CHUNK_WORDS - 2).expect("leave two words");
        let record = SideRecord { separator: Some(KindId(7)), ..SideRecord::default() };
        let at = record.write(&mut arena).expect("room");
        assert_eq!(at.word(), crate::arena::CHUNK_WORDS - 2);
        assert_eq!(SideRecord::read(&arena, at), Ok(record));
    }

    #[test]
    fn each_field_alone_reads_back_as_written() {
        let whole = full();
        let alone = [
            SideRecord { at: whole.at, ..SideRecord::default() },
            SideRecord { edges: whole.edges, ..SideRecord::default() },
            SideRecord { edges: Some(Edges::NONE), ..SideRecord::default() },
            SideRecord { span: whole.span, ..SideRecord::default() },
            SideRecord { sides: whole.sides, ..SideRecord::default() },
            SideRecord { changed: ChangedEdges { leading: false, trailing: true }, ..SideRecord::default() },
            SideRecord { separator: whole.separator, ..SideRecord::default() },
            SideRecord { delimiter: whole.delimiter, ..SideRecord::default() },
            SideRecord { delimiter: Some(Delimiter::NONE), ..SideRecord::default() },
            SideRecord { separator_kind: whole.separator_kind, ..SideRecord::default() },
            SideRecord { flanks: whole.flanks, ..SideRecord::default() },
            SideRecord { slots: whole.slots, ..SideRecord::default() },
        ];
        let mut arena = Arena::new();
        for record in alone {
            let at = record.write(&mut arena).expect("room");
            assert_ne!(at, Address::NONE);
            assert_eq!(SideRecord::read(&arena, at), Ok(record));
        }
    }

    /// The side records `cell-forms.json` pins the TypeScript side reader
    /// to: each one's words as the codec writes them.
    #[test]
    fn the_shared_fixture_s_side_records_are_written_as_it_holds_them() {
        let fixture: serde_json::Value = serde_json::from_str(include_str!("cell-forms.json")).expect("the fixture parses");
        let words_of = |n: usize| -> Vec<u32> {
            fixture["sides"][n]["words"].as_array().expect("words").iter().map(|word| u32::try_from(word.as_u64().expect("a word")).expect("a word")).collect()
        };
        let every = SideRecord {
            at: Some(Row { index: NodeIndex(4), end: NodeIndex(9), span: Span { start: 3, end: 8 } }),
            edges: Some(Edges { before: None, after: Some(EdgeArm { arm: KindId(31), strength: None }) }),
            span: Some(PointSpan { start: Point { row: 1, column: 2 }, end: Point { row: 3, column: 0 } }),
            sides: Some(Sides { tree: TreeId(2), index: NodeIndex(5), end: NodeIndex(6), span: Span { start: 10, end: 14 } }),
            separator: Some(KindId(7)),
            delimiter: Some(Delimiter::TRAILING),
            ..SideRecord::default()
        };
        let row = every.at;
        for (n, record) in [every, SideRecord { delimiter: Some(Delimiter::NONE), ..SideRecord::default() }, SideRecord { at: row, ..SideRecord::default() }].into_iter().enumerate() {
            let mut arena = Arena::new();
            let at = record.write(&mut arena).expect("room");
            let expected = words_of(n);
            let len = u32::try_from(expected.len()).expect("a length");
            assert_eq!(arena.words(at, len).expect("its words"), expected.as_slice(), "side {n}");
            assert_eq!(SideRecord::read(&arena, at), Ok(record), "side {n}");
        }
    }

    #[test]
    fn an_empty_side_record_is_no_record() {
        let mut arena = Arena::new();
        assert_eq!(SideRecord::default().write(&mut arena), Ok(Address::NONE));
        assert_eq!(SideRecord::read(&arena, Address::NONE), Ok(SideRecord::default()));
    }

    #[test]
    fn a_side_record_no_writer_writes_is_refused() {
        let mut arena = Arena::new();
        for words in [
            vec![0],
            vec![1 << 11],
            vec![mask::FLANKS, 0],
            vec![mask::FLANKS, 3],
            vec![mask::FLANKS, 1 << 16],
            vec![mask::AT],
            vec![mask::AT, 1, 2, 3],
            vec![mask::AT, 1, 2, 9, 4],
            vec![mask::EDGES, 5, 0],
            vec![mask::EDGES, EDGE_SET | 9 << 16, 0],
            vec![mask::SIDES, 1, 2, 3, 9, 4],
            vec![mask::SEPARATOR, 70_000],
            vec![mask::DELIMITER, 4],
            vec![mask::DELIMITER],
            vec![mask::SEPARATOR_KIND, 70_000],
            vec![mask::SLOTS, u32::MAX],
            vec![mask::SLOTS, 1, 2, 0, 0, 0, 0, 0, 0, 3],
            vec![mask::SLOTS, 1, 2, 70_002, 0, 0, 0, 0, 0, 0],
            vec![mask::SLOTS, 1, 2, 0, 0, 0, 0, 70_002, 0, 0],
        ] {
            let at = arena.push(&words).expect("room");
            assert!(SideRecord::read(&arena, at).is_err(), "{words:?}");
        }
        assert!(SideRecord::read(&arena, Address::new(40, 0).expect("in range")).is_err());
    }

    #[test]
    fn every_strength_reads_back() {
        for code in 0..=4 {
            let strength = SeamStrength::from_code(code).expect("a strength");
            let edge = Some(EdgeArm { arm: KindId(3), strength: Some(strength) });
            assert_eq!(read_edge(edge_word(edge)), Ok(edge));
        }
        assert_eq!(SeamStrength::from_code(5), None);
    }
}

