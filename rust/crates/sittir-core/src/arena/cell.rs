//! One slot's cell in a record. A parsed record's cell holds what its
//! slot's stamped forms leave open (`record::form`): a tag word only when the
//! slot holds more than one form, a kind only when it admits more than one.
//! A built record's cell is one word, an address
//! and the edges its site marks changed, whose form is the kind of chunk the
//! address lies in (`Cell::decode_built`). A decode bounds-checks every word
//! and refuses any word no writer writes, so a malformed cell is an error,
//! never a read outside its record.

use super::{Address, ArenaError, ArenaRead, CellShape, StringRef};
use crate::record::{form, tagged};
use crate::record::HEADER_WORDS;
use crate::slot::ChangedEdges;
use crate::types::{KindId, NodeIndex, Span, TreeId};

/// The flags a record header holds above its kind field.
pub mod flag {
    /// A link record: it names a parsed node of another tree.
    pub const LINK: u32 = 1;
}

/// A link record's words: its header, an empty side word, then the parsed
/// node's tree, row, subtree end, record (0 for none) and byte span.
pub const LINK_WORDS: u32 = 8;

/// The chunk-0 offset a built blank arm names: all ones, so the arm is apart
/// from word 0, an unset slot, and from every unit's kind.
pub const BLANK_UNIT: u32 = super::CHUNK_WORDS - 1;

/// The kind a packed kind field of `bits` bits in `word` holds: all-ones is
/// `ERROR`.
#[must_use]
pub fn kind_field(word: u32, bits: u32) -> KindId {
    let mask = (1u32 << bits) - 1;
    match word & mask {
        k if k == mask => KindId::ERROR,
        #[allow(clippy::cast_possible_truncation, reason = "a kind field is at most 16 bits")]
        k => KindId(k as u16),
    }
}

/// `kind` as a kind field of `bits` bits.
///
/// # Errors
///
/// `ArenaError::Malformed` for a kind the field cannot hold below all-ones.
pub fn with_kind(kind: KindId, bits: u32) -> Result<u32, ArenaError> {
    let mask = (1u32 << bits) - 1;
    match kind {
        KindId::ERROR => Ok(mask),
        kind if u32::from(kind.0) < mask => Ok(u32::from(kind.0)),
        kind => Err(malformed("kind field", u32::from(kind.0))),
    }
}

/// The kind and the flags of a record header word whose kind field takes
/// `bits` bits.
#[must_use]
pub fn header_of(word: u32, bits: u32) -> (KindId, u32) {
    (kind_field(word, bits), word >> bits)
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
    /// set, a parsed record in that tree's arena, which a built record names
    /// for an untouched parsed child. `changed` is the edges whose neighbour
    /// this holder changed: a fact of this site, held here and never in the
    /// child's record, so two holders of one record can differ.
    Child { kind: KindId, at: Address, link: Option<TreeId>, changed: ChangedEdges },
    /// A unit, which carries no text. `KindId::BLANK` is a blank arm. A
    /// parsed unit names its row, which keys its sides as any parsed node's
    /// row does; a built unit has none.
    Unit { kind: KindId, row: Option<NodeIndex> },
    /// A built leaf, which has no record: its text in the string table, and
    /// the edges whose neighbour this holder changed, a fact of this site as
    /// a child's are. Its sides are keyed by its site in the store.
    BuiltLeaf { kind: KindId, text: StringRef, changed: ChangedEdges },
    /// A parsed node with no record a built record holds, through the link
    /// record at `at`: its tree, row, subtree end and byte span, whose text
    /// is its source's, and the edges whose neighbour this holder changed.
    /// Its sides are its row's.
    LinkedLeaf { kind: KindId, at: Address, tree: TreeId, row: NodeIndex, end: NodeIndex, span: Span, changed: ChangedEdges },
    /// A captured interior string of a built node: its text in the string table.
    BuiltText { text: StringRef },
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

/// A site's changed edges as one word: leading 1 and trailing 2.
fn changed_word(changed: ChangedEdges) -> u32 {
    u32::from(changed.leading) | u32::from(changed.trailing) << 1
}

fn read_changed(word: u32) -> Result<ChangedEdges, ArenaError> {
    if word >= 4 {
        return Err(malformed("child changed edges", word));
    }
    Ok(ChangedEdges { leading: word & 1 != 0, trailing: word & 2 != 0 })
}

fn record(word: u32) -> Result<Address, ArenaError> {
    if word == Address::NONE.0 { Err(malformed("cell record address", word)) } else { Ok(Address(word)) }
}

/// One cell of a built record, as its one word holds it
/// (`Cell::decode_built`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(transparent)]
pub struct CellWord(pub u32);

impl CellWord {
    /// The built cell naming the entry at `at`, a record, a run or a leaf
    /// entry, with the edges `changed` its site marks.
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for address 0 or one past what a cell holds.
    pub fn of(at: Address, changed: ChangedEdges) -> Result<CellWord, ArenaError> {
        if at.0 >> 30 != 0 || at == Address::NONE {
            return Err(ArenaError::Unwritable("an address past what a built cell holds"));
        }
        Ok(CellWord(at.0 << 2 | changed_word(changed)))
    }

    /// The built cell of a unit of `kind`: its kind as an address in chunk 0,
    /// and the blank arm the reserved offset (`BLANK_UNIT`).
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for a kind at or past the reserved offset.
    pub fn unit(kind: KindId) -> Result<CellWord, ArenaError> {
        if kind == KindId::BLANK {
            return Ok(CellWord(BLANK_UNIT << 2));
        }
        if u32::from(kind.0) >= BLANK_UNIT {
            return Err(ArenaError::Unwritable("a unit kind past what a built cell holds"));
        }
        Ok(CellWord(u32::from(kind.0) << 2))
    }
}

impl Cell {
    /// The cell, as one the record at `holder` holds: a writer writes a
    /// record's children before it, so a record a cell names in the
    /// holder's own arena lies below the holder. A cell that names one at
    /// or past it is refused, so no chain of cells returns to a record it
    /// left. A linked child is in another arena, which this leaves alone.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a cell naming a record of the arena that
    /// is not below `holder`.
    pub fn below(self, holder: Address) -> Result<Cell, ArenaError> {
        match self {
            Cell::Child { at, link: None, .. } | Cell::LinkedLeaf { at, .. } if at >= holder => Err(malformed("child record address", at.0)),
            cell => Ok(cell),
        }
    }

    /// The kind a cell names: blank for captured text, none when absent.
    #[must_use]
    pub const fn kind(self) -> Option<KindId> {
        match self {
            Cell::Absent => None,
            Cell::ParsedText { .. } | Cell::BuiltText { .. } => Some(KindId::BLANK),
            Cell::Coordinate { kind, .. } | Cell::ParsedLeaf { kind, .. } | Cell::Child { kind, .. } | Cell::Unit { kind, .. } | Cell::BuiltLeaf { kind, .. } | Cell::LinkedLeaf { kind, .. } => Some(kind),
        }
    }

    /// The cell a built record's cell `word` names in `arena`: absent for
    /// word 0, an unset slot; a unit for an address in chunk 0, whose word is
    /// the unit's kind, the blank arm at `BLANK_UNIT`; a record in a word chunk, a link record naming a parsed node's
    /// record (`Child` with its tree) or, with none, the node itself
    /// (`LinkedLeaf`); a leaf entry in a string chunk, `[kind | length]` then
    /// its UTF-8 bytes, a blank kind for captured text.
    ///
    /// # Errors
    ///
    /// `ArenaError::OutOfBounds` for an address in no chunk, or words or
    /// bytes past what the arena wrote; `ArenaError::Malformed` for any word
    /// no writer writes.
    pub fn decode_built(CellWord(word): CellWord, arena: &dyn ArenaRead, bits: u32) -> Result<Cell, ArenaError> {
        if word == 0 {
            return Ok(Cell::Absent);
        }
        let edges = word & 3;
        let changed = read_changed(edges)?;
        let at = Address(word >> 2);
        if at.chunk() == 0 {
            if edges != 0 {
                return Err(malformed("unit cell edges", word));
            }
            if at.word() == BLANK_UNIT {
                return Ok(Cell::Unit { kind: KindId::BLANK, row: None });
            }
            return Ok(Cell::Unit { kind: named_kind(at.word())?, row: None });
        }
        if arena.chunk(at.chunk()).is_some() {
            let header = arena.words(at, HEADER_WORDS)?;
            return match header_of(header[0], bits) {
                (KindId::BLANK, _) => Err(malformed("cell kind", header[0])),
                (kind, 0) => Ok(Cell::Child { kind, at, link: None, changed }),
                (kind, flag::LINK) => linked(arena, at, kind, changed),
                (_, flags) => Err(malformed("record flags", flags)),
            };
        }
        let Some(bytes) = arena.string_chunk(at.chunk()) else {
            return Err(ArenaError::OutOfBounds { chunk: at.chunk(), word: at.word(), len: 1 });
        };
        let byte = at.word();
        if !byte.is_multiple_of(4) {
            return Err(malformed("leaf entry offset", byte));
        }
        let head: [u8; 4] = bytes.get(byte as usize..byte as usize + 4).and_then(|head| head.try_into().ok()).ok_or(ArenaError::OutOfBounds { chunk: at.chunk(), word: byte, len: 4 })?;
        let entry = u32::from_ne_bytes(head);
        let text = StringRef { chunk: at.chunk(), byte: byte + 4, len: entry >> bits };
        match kind_field(entry, bits) {
            KindId::BLANK if edges == 0 => Ok(Cell::BuiltText { text }),
            KindId::BLANK => Err(malformed("text cell edges", word)),
            kind => Ok(Cell::BuiltLeaf { kind, text, changed }),
        }
    }
}

/// The tag word a parsed cell of more than one form opens with
/// (`record::tagged`).
pub mod parsed_tag {
    pub const ABSENT: u32 = 0;
    pub const NODE: u32 = 1;
    pub const UNIT: u32 = 2;
    pub const TEXT: u32 = 3;
    pub const INLINE: u32 = 4;
}

const PARSED_FORMS: [(u32, u8); 4] = [(parsed_tag::NODE, form::NODE), (parsed_tag::UNIT, form::UNIT), (parsed_tag::TEXT, form::TEXT), (parsed_tag::INLINE, form::INLINE)];

impl CellShape {
    /// `kind` with `x` above it in one word, the kind in the low `bits`
    /// bits. `x` is a child's row, never 0: the root has no holder.
    fn pack(kind: KindId, x: u32, bits: u32) -> Result<u32, ArenaError> {
        if x == 0 {
            return Err(malformed("a child's row", 0));
        }
        if kind == KindId::ERROR || kind == KindId::BLANK {
            return Err(malformed("cell kind", u32::from(kind.0)));
        }
        if x >> (32 - bits) != 0 {
            return Err(ArenaError::Unwritable("a row past what a parsed cell packs beside its kind"));
        }
        Ok(with_kind(kind, bits)? | x << bits)
    }

    /// The kind and the value above it a word packed by `pack` holds.
    fn unpack(word: u32, bits: u32) -> Result<(KindId, u32), ArenaError> {
        let (kind, x) = (kind_field(word, bits), word >> bits);
        if kind == KindId::ERROR || kind == KindId::BLANK {
            return Err(malformed("cell kind", word));
        }
        if x == 0 {
            return Err(malformed("a child's row", word));
        }
        Ok((kind, x))
    }

    /// The words of a parsed cell of this slot that its form's payload starts
    /// at: past the tag word when the slot holds more than one form.
    #[must_use]
    pub fn payload_start(self) -> usize {
        usize::from(tagged(self.forms))
    }
}

fn end_word(span: Span, leaf: bool) -> Result<u32, ArenaError> {
    if span.end & form::LEAF != 0 || span.start > span.end {
        return Err(ArenaError::Unwritable("a span past what a parsed cell holds"));
    }
    Ok(if leaf { span.end | form::LEAF } else { span.end })
}

impl Cell {
    /// Writes the cell into `out`, the words of a parsed record's slot of
    /// shape `shape` (its stamped width, or for a list item its run's),
    /// kinds packed in `bits` bits, zeroing the words its form leaves unused.
    /// An embedded record is copied in by its writer (`inline_payload`).
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for a form the slot does not hold, a value no
    /// parsed record holds, or a kind other than the slot's stamped one;
    /// `ArenaError::Malformed` for a row of 0 or a kind no field holds.
    pub fn encode_parsed(self, out: &mut [u32], shape: CellShape, bits: u32) -> Result<(), ArenaError> {
        let (form, payload): (u8, &[u32]) = match self {
            Cell::Absent if shape.forms & form::BLANK != 0 => return Err(ArenaError::Unwritable("an absent value in a slot that admits a blank arm")),
            Cell::Absent => {
                out.fill(0);
                return Ok(());
            }
            Cell::Coordinate { kind, index, span } => (form::NODE, &[CellShape::pack(kind, index.0, bits)?, span.start, end_word(span, false)?]),
            Cell::ParsedLeaf { kind, span, row } => (form::NODE, &[CellShape::pack(kind, row.0, bits)?, span.start, end_word(span, true)?]),
            Cell::Unit { kind: KindId::BLANK, row: None } if shape.forms & form::BLANK != 0 => (form::UNIT, &[0]),
            Cell::Unit { kind, row: Some(row) } => (form::UNIT, &[CellShape::pack(kind, row.0, bits)?]),
            Cell::ParsedText { span } => (form::TEXT, &[span.start.checked_add(1).ok_or(ArenaError::Unwritable("a span past what a parsed cell holds"))?, end_word(span, false)?]),
            _ => return Err(ArenaError::Unwritable("a value no parsed record holds")),
        };
        if shape.forms & form == 0 {
            return Err(ArenaError::Unwritable("a form its slot does not hold"));
        }
        let start = shape.payload_start();
        let used = out.get_mut(start..start + payload.len()).ok_or(malformed("cell width", u32::try_from(payload.len()).unwrap_or(u32::MAX)))?;
        used.copy_from_slice(payload);
        out[..start].fill(0);
        out[start + payload.len()..].fill(0);
        if start == 1 {
            out[0] = parsed_tag_of(form);
        }
        Ok(())
    }

    /// The words of `out`, a parsed record's slot of shape `shape`, a bounded
    /// child's embedded record is written into, tagged as one when the slot
    /// holds more than one form.
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for a slot that holds no embedded record, and
    /// `ArenaError::Malformed` for one narrower than its stamped capacity.
    pub fn inline_payload(out: &mut [u32], shape: CellShape) -> Result<&mut [u32], ArenaError> {
        if shape.forms & form::INLINE == 0 {
            return Err(ArenaError::Unwritable("an embedded record in a slot that holds none"));
        }
        let start = shape.payload_start();
        let end = start + shape.inline as usize;
        if out.len() < end || shape.inline < HEADER_WORDS {
            return Err(malformed("inline cell width", shape.inline));
        }
        out.fill(0);
        if start == 1 {
            out[0] = parsed_tag::INLINE;
        }
        Ok(&mut out[start..end])
    }

    /// The cell in `words`, the words of a parsed record's slot of shape
    /// `shape` at `at` (its stamped width, or for a list item its run's),
    /// kinds packed in `bits` bits. An embedded record is a `Child` at its
    /// header's address.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for words no parsed writer writes, a cell
    /// narrower than its form, or an embedded record past its capacity.
    pub fn decode_parsed(words: &[u32], at: Address, shape: CellShape, bits: u32) -> Result<Cell, ArenaError> {
        let start = shape.payload_start();
        let &first = words.first().ok_or(malformed("cell width", 0))?;
        let form = if start == 1 {
            if first == parsed_tag::ABSENT {
                return absent(words);
            }
            let form = PARSED_FORMS.iter().find(|(tag, _)| *tag == first).map(|(_, form)| *form).ok_or(malformed("cell tag", first))?;
            if shape.forms & form == 0 {
                return Err(malformed("cell form", first));
            }
            form
        } else {
            shape.forms & form::ALL
        };
        let payload = &words[start..];
        let field = |n: usize| payload.get(n).copied().ok_or(malformed("cell width", u32::try_from(words.len()).unwrap_or(u32::MAX)));
        match form {
            form::UNIT if field(0)? == 0 && shape.forms & form::BLANK != 0 => Ok(Cell::Unit { kind: KindId::BLANK, row: None }),
            _ if start == 0 && first == 0 => absent(words),
            form::NODE => {
                let (kind, row) = CellShape::unpack(field(0)?, bits)?;
                let end = field(2)?;
                let span = span(field(1)?, end & !form::LEAF)?;
                Ok(if end & form::LEAF == 0 { Cell::Coordinate { kind, index: NodeIndex(row), span } } else { Cell::ParsedLeaf { kind, span, row: NodeIndex(row) } })
            }
            form::UNIT => {
                let (kind, row) = CellShape::unpack(field(0)?, bits)?;
                Ok(Cell::Unit { kind, row: Some(NodeIndex(row)) })
            }
            form::TEXT => {
                let start = field(0)?.checked_sub(1).ok_or(malformed("text cell start", 0))?;
                let end = field(1)?;
                if end & form::LEAF != 0 {
                    return Err(malformed("cell span end", end));
                }
                Ok(Cell::ParsedText { span: span(start, end)? })
            }
            form::INLINE => {
                if shape.inline < HEADER_WORDS || payload.len() < shape.inline as usize || at == Address::NONE {
                    return Err(malformed("inline cell width", shape.inline));
                }
                let (kind, flags) = header_of(field(0)?, bits);
                if flags != 0 || kind == KindId::BLANK || kind == KindId::ERROR {
                    return Err(malformed("inline record header", field(0)?));
                }
                let at = at.offset(u32::try_from(start).unwrap_or(0)).ok_or(malformed("inline record address", at.0))?;
                Ok(Cell::Child { kind, at, link: None, changed: ChangedEdges::default() })
            }
            _ => Err(malformed("cell forms", u32::from(shape.forms))),
        }
    }
}

fn parsed_tag_of(form: u8) -> u32 {
    PARSED_FORMS.iter().find(|(_, of)| *of == form).map_or(parsed_tag::ABSENT, |(tag, _)| *tag)
}

/// An absent parsed cell: every word of it zero.
fn absent(words: &[u32]) -> Result<Cell, ArenaError> {
    match words.iter().find(|word| **word != 0) {
        None => Ok(Cell::Absent),
        Some(&word) => Err(malformed("absent cell", word)),
    }
}

/// The cell the link record at `at` of `kind` names, with the edges its
/// holder's cell marks.
fn linked(arena: &dyn ArenaRead, at: Address, kind: KindId, changed: ChangedEdges) -> Result<Cell, ArenaError> {
    let words = arena.words(at, LINK_WORDS)?;
    if words[1] != 0 {
        return Err(malformed("link record side", words[1]));
    }
    let tree = TreeId(words[2]);
    match words[5] {
        0 => Ok(Cell::LinkedLeaf { kind, at, tree, row: NodeIndex(words[3]), end: NodeIndex(words[4]), span: span(words[6], words[7])?, changed }),
        parsed => Ok(Cell::Child { kind, at: record(parsed)?, link: Some(tree), changed }),
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
    pub const EMPTY: ListCell = ListCell { run: Address::NONE, len: 0 };

    /// The one word a list cell holds for the run at `run`, whose first word
    /// is the list's length: the run's address above two zero bits.
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for an address past what a list cell holds.
    pub fn word(run: Address) -> Result<CellWord, ArenaError> {
        CellWord::of(run, ChangedEdges::default())
    }

    /// The list a list cell `word` names in `arena`: its run's address,
    /// whose first word is the list's length, each item's cell after it (a
    /// built record's one word, a parsed record's its slot's run); word 0
    /// for an empty list.
    ///
    /// # Errors
    ///
    /// What reading the run's length refuses, and `ArenaError::Malformed` for
    /// changed edges on a list cell, a run of no items, or one that names no
    /// word after its length.
    pub fn of_word(CellWord(word): CellWord, arena: &dyn ArenaRead) -> Result<ListCell, ArenaError> {
        if word == 0 {
            return Ok(ListCell::EMPTY);
        }
        if word & 3 != 0 {
            return Err(malformed("list cell edges", word));
        }
        let run = Address(word >> 2);
        let len = arena.word(run)?;
        if len == 0 {
            return Err(malformed("list length", len));
        }
        Ok(ListCell { run: run.offset(1).ok_or(malformed("list run address", run.0))?, len })
    }
    /// Each item's `item_width` words, read from the run in `arena`.
    pub fn items(self, arena: &dyn ArenaRead, item_width: u32) -> Result<std::slice::ChunksExact<'_, u32>, ArenaError> {
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
    use crate::arena::built_image::{built_cell, BuiltImage};

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
            Cell::Child { kind: KindId(14), at: record, link: None, changed: ChangedEdges::default() },
            Cell::Child { kind: KindId(14), at: record, link: None, changed: ChangedEdges { leading: false, trailing: true } },
            Cell::Child { kind: KindId(14), at: record, link: Some(TreeId(0)), changed: ChangedEdges::default() },
            Cell::Child { kind: KindId(14), at: record, link: Some(TreeId(9)), changed: ChangedEdges { leading: true, trailing: false } },
            Cell::Child { kind: KindId(14), at: record, link: Some(TreeId(9)), changed: ChangedEdges { leading: true, trailing: true } },
            Cell::Unit { kind: KindId(15), row: None },
            Cell::Unit { kind: KindId(15), row: Some(NodeIndex(0)) },
            Cell::Unit { kind: KindId(15), row: Some(NodeIndex(42)) },
            Cell::Unit { kind: KindId::BLANK, row: None },
            Cell::BuiltLeaf { kind: KindId(16), text, changed: ChangedEdges::default() },
            Cell::BuiltLeaf { kind: KindId(16), text, changed: ChangedEdges { leading: true, trailing: false } },
            Cell::BuiltLeaf { kind: KindId::ERROR, text, changed: ChangedEdges::default() },
            Cell::BuiltText { text },
        ]
    }

    /// `cell-forms.json`, the fixture the TypeScript cell decoder is pinned
    /// to: each entry's cell, as its fields name it.
    fn fixture_cell(entry: &serde_json::Value) -> Cell {
        let n = |key: &str| fixture_number(entry, key);
        let kind = || KindId(u16::try_from(n("kind")).expect("a kind"));
        let span = || Span { start: n("start"), end: n("end") };
        let row = || entry["row"].as_u64().map(|row| NodeIndex(u32::try_from(row).expect("a row")));
        let text = || StringRef::from_offset(n("offset"), n("len"));
        let changed = || fixture_changed(entry);
        match entry["form"].as_str().expect("a form") {
            "absent" => Cell::Absent,
            "coordinate" => Cell::Coordinate { kind: kind(), index: NodeIndex(n("index")), span: span() },
            "parsedLeaf" => Cell::ParsedLeaf { kind: kind(), span: span(), row: NodeIndex(n("row")) },
            "parsedText" => Cell::ParsedText { span: span() },
            "child" => Cell::Child {
                kind: kind(),
                at: Address(n("at")),
                link: entry["link"].as_u64().map(|tree| TreeId(u32::try_from(tree).expect("a tree"))),
                changed: changed(),
            },
            "unit" => Cell::Unit { kind: kind(), row: row() },
            "builtLeaf" => Cell::BuiltLeaf { kind: kind(), text: text(), changed: changed() },
            "builtText" => Cell::BuiltText { text: text() },
            other => panic!("no cell form {other}"),
        }
    }

    /// An entry of the fixture's built section: its cell, whose text is
    /// the entry at `offset`, as the built decoder reads it.
    fn built_fixture_cell(entry: &serde_json::Value) -> Cell {
        let n = |key: &str| fixture_number(entry, key);
        let kind = || KindId(u16::try_from(n("kind")).expect("a kind"));
        let text = || {
            let entry = Address(n("offset"));
            StringRef { chunk: entry.chunk(), byte: entry.word() + 4, len: n("len") }
        };
        match entry["form"].as_str().expect("a form") {
            "linkedLeaf" => Cell::LinkedLeaf {
                kind: kind(),
                at: Address(n("at")),
                tree: TreeId(n("tree")),
                row: NodeIndex(n("row")),
                end: NodeIndex(n("end")),
                span: Span { start: n("start"), end: n("spanEnd") },
                changed: fixture_changed(entry),
            },
            "builtLeaf" => Cell::BuiltLeaf { kind: kind(), text: text(), changed: fixture_changed(entry) },
            "builtText" => Cell::BuiltText { text: text() },
            _ => fixture_cell(entry),
        }
    }

    fn fixture_changed(entry: &serde_json::Value) -> ChangedEdges {
        ChangedEdges { leading: entry["leading"].as_bool().expect("leading"), trailing: entry["trailing"].as_bool().expect("trailing") }
    }

    fn fixture_numbers<T: TryFrom<u64>>(entry: &serde_json::Value, key: &str) -> Vec<T> {
        let number = |value: &serde_json::Value| T::try_from(value.as_u64().unwrap_or_else(|| panic!("a number in {key}"))).unwrap_or_else(|_| panic!("a {key} number in range"));
        entry[key].as_array().unwrap_or_else(|| panic!("{key} in {entry}")).iter().map(number).collect()
    }

    fn fixture_words(entry: &serde_json::Value) -> Vec<u32> {
        fixture_numbers(entry, "words")
    }

    #[test]
    fn every_form_is_written_as_the_shared_fixture_holds_it() {
        let fixture: serde_json::Value = serde_json::from_str(include_str!("cell-forms.json")).expect("the fixture parses");
        let cells = fixture["cells"].as_array().expect("cells");
        assert_eq!(fixture["inlineHeaderWords"].as_u64(), Some(u64::from(INLINE_HEADER_WORDS)));
        for entry in fixture["inlines"].as_array().expect("inline cells") {
            let cell = Cell::Child {
                kind: KindId(u16::try_from(fixture_number(entry, "kind")).expect("a kind")),
                at: Address(fixture_number(entry, "at")), link: None,
                changed: ChangedEdges { leading: entry["leading"].as_bool().expect("leading"), trailing: entry["trailing"].as_bool().expect("trailing") },
            };
            assert_eq!(Cell::decode_slot(&fixture_words(entry), Address(fixture_number(entry, "address")), fixture_number(entry, "capacity")), Ok(cell));
        }
        let mut forms = std::collections::HashSet::new();
        for entry in cells {
            let cell = fixture_cell(entry);
            let words = fixture_words(entry);
            let mut written = vec![9; cell.width() as usize];
            cell.encode(&mut written).expect("it fits");
            assert_eq!(written, words, "{entry}");
            assert_eq!(Cell::decode(&words), Ok(cell), "{entry}");
            forms.insert(std::mem::discriminant(&cell));
        }
        let mut arena = Arena::new();
        let every: std::collections::HashSet<_> = every_form(&mut arena).iter().map(std::mem::discriminant).collect();
        assert_eq!(forms.len(), every.len(), "the fixture holds every form");
        for entry in fixture["lists"].as_array().expect("lists") {
            let list = ListCell { run: Address(fixture_number(entry, "run")), len: fixture_number(entry, "len") };
            let mut written = [9; 2];
            list.encode(&mut written).expect("it fits");
            assert_eq!(written.to_vec(), fixture_words(entry), "{entry}");
            assert_eq!(ListCell::decode(&written), Ok(list), "{entry}");
        }
        for entry in fixture["addresses"].as_array().expect("addresses") {
            let address = Address::new(fixture_number(entry, "chunk"), fixture_number(entry, "word")).expect("in range");
            assert_eq!(address.0, fixture_number(entry, "address"), "{entry}");
        }
    }

    fn fixture_number(entry: &serde_json::Value, key: &str) -> u32 {
        u32::try_from(entry[key].as_u64().unwrap_or_else(|| panic!("{key} in {entry}"))).expect("a word")
    }

    #[test]
    fn every_built_form_is_decoded_as_the_shared_fixture_holds_it() {
        let fixture: serde_json::Value = serde_json::from_str(include_str!("cell-forms.json")).expect("the fixture parses");
        let built = &fixture["built"];
        assert_eq!(built["linkFlag"].as_u64(), Some(u64::from(flag::LINK)));
        assert_eq!(built["linkWords"].as_u64(), Some(u64::from(LINK_WORDS)));
        let mut image = BuiltImage::new(fixture_number(built, "kindBits"));
        let name = image.entry(KindId(16), "name");
        let text = image.entry(KindId::BLANK, "ab");
        image.entry(KindId::ERROR, "?");
        let record = image.record(KindId(14), 3, &[(2, built_cell(name, ChangedEdges { leading: true, trailing: false }))]);
        image.link(KindId(14), TreeId(3), NodeIndex(7), NodeIndex(9), Address(5000), Span { start: 2, end: 9 });
        image.link(KindId(16), TreeId(3), NodeIndex(8), NodeIndex(9), Address::NONE, Span { start: 4, end: 8 });
        image.run(&[built_cell(record, ChangedEdges::default()), built_cell(text, ChangedEdges::default())]);
        for chunk in built["chunks"].as_array().expect("chunks") {
            let n = fixture_number(chunk, "chunk");
            if chunk.get("words").is_some() {
                assert_eq!(image.chunk(n).map(<[u32]>::to_vec), Some(fixture_numbers(chunk, "words")), "{chunk}");
            } else {
                assert_eq!(image.string_chunk(n).map(<[u8]>::to_vec), Some(fixture_numbers(chunk, "bytes")), "{chunk}");
            }
        }
        for entry in built["cells"].as_array().expect("cells") {
            assert_eq!(Cell::decode_built(CellWord(fixture_number(entry, "word")), &image), Ok(built_fixture_cell(entry)), "{entry}");
        }
        for entry in built["lists"].as_array().expect("lists") {
            let list = ListCell { run: Address(fixture_number(entry, "run")), len: fixture_number(entry, "len") };
            assert_eq!(ListCell::of_word(CellWord(fixture_number(entry, "word")), &image), Ok(list), "{entry}");
        }
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
        let changed = |trailing| ChangedEdges { leading: false, trailing };
        Cell::Child { kind: KindId(3), at: Address(6), link: Some(TreeId(0)), changed: changed(false) }.encode(&mut words).expect("it fits");
        assert_eq!(words, [tag::CHILD, 3, 6, 1, 0], "tree 0 is one, apart from the cell's own arena");
        Cell::Child { kind: KindId(3), at: Address(6), link: Some(TreeId(4)), changed: changed(true) }.encode(&mut words).expect("it fits");
        assert_eq!(words, [tag::CHILD, 3, 6, 5, 2]);
        Cell::Child { kind: KindId(3), at: Address(6), link: None, changed: changed(true) }.encode(&mut words).expect("it fits");
        assert_eq!(words, [tag::CHILD, 3, 6, 0, 2], "a child of this arena holds its site's edges too");
        assert!(Cell::Child { kind: KindId(3), at: Address(6), link: None, changed: changed(false) }.encode(&mut [0; 4]).is_err(), "a child takes five words");
    }

    #[test]
    fn a_blank_arm_is_a_unit_apart_from_absent() {
        let mut words = [7; 5];
        Cell::Unit { kind: KindId::BLANK, row: None }.encode(&mut words).expect("it fits");
        assert_eq!(words, [tag::UNIT, 0, 0, 0, 0]);
        assert_ne!(Cell::decode(&words), Ok(Cell::Absent));
    }

    #[test]
    fn a_parsed_unit_names_its_row_and_a_blank_arm_names_none() {
        let mut words = [7; 5];
        Cell::Unit { kind: KindId(3), row: Some(NodeIndex(0)) }.encode(&mut words).expect("it fits");
        assert_eq!(words, [tag::UNIT, 3, 1, 0, 0], "row 0 is one, apart from a built unit's none");
        Cell::Unit { kind: KindId(3), row: None }.encode(&mut words).expect("it fits");
        assert_eq!(words, [tag::UNIT, 3, 0, 0, 0]);
        assert!(Cell::Unit { kind: KindId::BLANK, row: Some(NodeIndex(2)) }.encode(&mut words).is_err());
        assert!(Cell::Unit { kind: KindId(3), row: Some(NodeIndex(u32::MAX)) }.encode(&mut words).is_err());
        assert!(Cell::decode(&[tag::UNIT, 0, 3, 0, 0]).is_err(), "a blank arm is no node, so it has no row");
        assert!(Cell::Unit { kind: KindId(3), row: None }.encode(&mut [0; 2]).is_err(), "a unit takes three words");
    }

    #[test]
    fn a_leaf_child_or_coordinate_of_the_blank_kind_is_refused() {
        let span = Span { start: 0, end: 0 };
        let mut words = [0; 5];
        for cell in [
            Cell::Coordinate { kind: KindId::BLANK, index: NodeIndex(1), span },
            Cell::Child { kind: KindId::BLANK, at: Address(4), link: None, changed: ChangedEdges::default() },
            Cell::Child { kind: KindId(2), at: Address::NONE, link: None, changed: ChangedEdges::default() },
            Cell::Child { kind: KindId(2), at: Address(4), link: Some(TreeId(u32::MAX)), changed: ChangedEdges::default() },
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

    #[test]
    fn a_cell_names_only_records_below_its_holder_in_its_own_arena() {
        let child = |at: u32, link| Cell::Child { kind: KindId(9), at: Address(at), link, changed: ChangedEdges::default() };
        let holder = Address(10);
        assert_eq!(child(4, None).below(holder), Ok(child(4, None)));
        for at in [10, 11] {
            assert_eq!(child(at, None).below(holder), Err(ArenaError::Malformed { what: "child record address", word: at }), "a record at or past its holder was not written before it");
        }
        assert_eq!(child(40, Some(TreeId(2))).below(holder), Ok(child(40, Some(TreeId(2)))), "a linked child is in another arena");
        let leaf = |at: u32| Cell::LinkedLeaf { kind: KindId(9), at: Address(at), tree: TreeId(1), row: NodeIndex(2), end: NodeIndex(3), span: Span { start: 0, end: 1 }, changed: ChangedEdges::default() };
        assert!(leaf(3).below(holder).is_ok());
        assert!(leaf(12).below(holder).is_err());
        let built = Cell::BuiltLeaf { kind: KindId(9), text: StringRef { chunk: 0, byte: 0, len: 1 }, changed: ChangedEdges::default() };
        assert_eq!(built.below(holder), Ok(built), "a built leaf names no record");
        assert_eq!(Cell::Absent.below(holder), Ok(Cell::Absent));
    }
}
