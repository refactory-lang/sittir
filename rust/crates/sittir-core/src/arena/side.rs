//! A record's side record: the layout facts beside its slots. Word 0 is a
//! mask of the fields present, and the fields follow in a fixed order:
//! `at`, `edges`, `span`, `sides`, `separator`, `slots`. `changed` is two
//! bits of the mask. It holds no trivia and no unit sides: a written side is
//! in the engine's store of written sides ([`crate::trivia_store`]), and a
//! parsed node's assigned sides in its tree's trivia table.

use super::{Address, Arena, ArenaError};
use crate::options::{EdgeArm, Edges};
use crate::points::{Point, PointSpan};
use crate::slot::ChangedEdges;
use crate::spacing::SeamStrength;
use crate::types::{KindId, NodeIndex, Span, TreeId};

mod mask {
    pub const AT: u32 = 1;
    pub const EDGES: u32 = 1 << 1;
    pub const SPAN: u32 = 1 << 2;
    pub const SIDES: u32 = 1 << 3;
    pub const CHANGED_LEADING: u32 = 1 << 4;
    pub const CHANGED_TRAILING: u32 = 1 << 5;
    pub const SEPARATOR: u32 = 1 << 6;
    pub const SLOTS: u32 = 1 << 7;
    pub const ALL: u32 = (1 << 8) - 1;
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

/// A list slot's stored layout, keyed by its cell's stamped word.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SideSlot {
    pub word: u32,
    pub before: Option<KindId>,
    pub after: Option<KindId>,
    pub separator: Option<KindId>,
    pub tokens: Vec<Option<KindId>>,
}

/// What a side record holds.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SideRecord {
    /// A parsed node's rows, `[index, end)`; the tree is the arena's.
    pub at: Option<(NodeIndex, NodeIndex)>,
    pub edges: Option<Edges>,
    pub span: Option<PointSpan>,
    pub sides: Option<Sides>,
    pub changed: ChangedEdges,
    pub separator: Option<KindId>,
    pub slots: Vec<SideSlot>,
}

/// The words of one slot entry: word, before, after, separator, and the
/// tokens run's address and length.
const SLOT_WORDS: u32 = 6;
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
    next: Address,
}

impl<'a> Fields<'a> {
    fn take(&mut self, n: u32) -> Result<&'a [u32], ArenaError> {
        let words = self.arena.words(self.next, n)?;
        self.next = self.next.offset(n).ok_or(ArenaError::OutOfBounds { chunk: self.next.chunk(), word: self.next.word(), len: n })?;
        Ok(words)
    }

    fn array<const N: usize>(&mut self) -> Result<[u32; N], ArenaError> {
        let n = u32::try_from(N).map_err(|_| ArenaError::Full)?;
        let words = self.take(n)?;
        <[u32; N]>::try_from(words).map_err(|_| ArenaError::OutOfBounds { chunk: self.next.chunk(), word: self.next.word(), len: n })
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
        if let Some((index, end)) = self.at {
            flags |= mask::AT;
            words.extend([index.0, end.0]);
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
        if !self.slots.is_empty() {
            flags |= mask::SLOTS;
            words.push(u32::try_from(self.slots.len()).map_err(|_| ArenaError::Full)?);
            for slot in &self.slots {
                let tokens: Vec<u32> = slot.tokens.iter().copied().map(optional_kind).collect();
                let (run, len) = if tokens.is_empty() { (Address::NONE, 0) } else { (arena.push(&tokens)?, u32::try_from(tokens.len()).map_err(|_| ArenaError::Full)?) };
                words.extend([slot.word, optional_kind(slot.before), optional_kind(slot.after), optional_kind(slot.separator), run.0, len]);
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
        let mut fields = Fields { arena, next: at };
        let [flags] = fields.array()?;
        if flags & !mask::ALL != 0 || flags == 0 {
            return Err(malformed("side record mask", flags));
        }
        let has = |bit: u32| flags & bit != 0;
        let mut record = SideRecord { changed: ChangedEdges { leading: has(mask::CHANGED_LEADING), trailing: has(mask::CHANGED_TRAILING) }, ..SideRecord::default() };
        if has(mask::AT) {
            let [index, end] = fields.array()?;
            record.at = Some((NodeIndex(index), NodeIndex(end)));
        }
        if has(mask::EDGES) {
            let [before, after] = fields.array()?;
            record.edges = Some(Edges { before: read_edge(before)?, after: read_edge(after)? });
        }
        if has(mask::SPAN) {
            let [start_row, start_column, end_row, end_column] = fields.array()?;
            record.span = Some(PointSpan { start: Point { row: start_row, column: start_column }, end: Point { row: end_row, column: end_column } });
        }
        if has(mask::SIDES) {
            let [tree, index, end, start, stop] = fields.array()?;
            if start > stop {
                return Err(malformed("side record span end", stop));
            }
            record.sides = Some(Sides { tree: TreeId(tree), index: NodeIndex(index), end: NodeIndex(end), span: Span { start, end: stop } });
        }
        if has(mask::SEPARATOR) {
            let [separator] = fields.array()?;
            record.separator = Some(read_kind(separator)?);
        }
        if has(mask::SLOTS) {
            let [count] = fields.array()?;
            let entries = fields.take(count.checked_mul(SLOT_WORDS).ok_or(malformed("side record slot count", count))?)?;
            let (entries, _) = entries.as_chunks::<{ SLOT_WORDS as usize }>();
            record.slots = entries
                .iter()
                .map(|&[word, before, after, separator, run, len]| {
                    let tokens = match (run, len) {
                        (0, 0) => Vec::new(),
                        (0, _) => return Err(malformed("side record tokens address", run)),
                        _ => arena.words(Address(run), len)?.iter().map(|&token| read_optional_kind(token)).collect::<Result<_, _>>()?,
                    };
                    Ok(SideSlot { word, before: read_optional_kind(before)?, after: read_optional_kind(after)?, separator: read_optional_kind(separator)?, tokens })
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
            at: Some((NodeIndex(4), NodeIndex(9))),
            edges: Some(Edges {
                before: Some(EdgeArm { arm: KindId::BLANK, strength: None }),
                after: Some(EdgeArm { arm: KindId(31), strength: Some(SeamStrength::Trivia) }),
            }),
            span: Some(PointSpan { start: Point { row: 1, column: 2 }, end: Point { row: 3, column: 0 } }),
            sides: Some(Sides { tree: TreeId(2), index: NodeIndex(5), end: NodeIndex(6), span: Span { start: 10, end: 14 } }),
            changed: ChangedEdges { leading: true, trailing: false },
            separator: Some(KindId(7)),
            slots: vec![
                SideSlot { word: 2, before: Some(KindId::BLANK), after: None, separator: Some(KindId(8)), tokens: vec![None, Some(KindId(8)), Some(KindId::BLANK)] },
                SideSlot { word: 7, ..SideSlot::default() },
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
            SideRecord { slots: whole.slots, ..SideRecord::default() },
        ];
        let mut arena = Arena::new();
        for record in alone {
            let at = record.write(&mut arena).expect("room");
            assert_ne!(at, Address::NONE);
            assert_eq!(SideRecord::read(&arena, at), Ok(record));
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
            vec![1 << 8],
            vec![mask::AT],
            vec![mask::EDGES, 5, 0],
            vec![mask::EDGES, EDGE_SET | 9 << 16, 0],
            vec![mask::SIDES, 1, 2, 3, 9, 4],
            vec![mask::SEPARATOR, 70_000],
            vec![mask::SLOTS, u32::MAX],
            vec![mask::SLOTS, 1, 2, 0, 0, 0, 0, 3],
            vec![mask::SLOTS, 1, 2, 70_002, 0, 0, 0, 0],
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
