//! One slot's cell in a record. A parsed record's cell holds what its
//! slot's stamped forms leave open (`record::form`): a tag word only when the
//! slot holds more than one form, a kind only when it admits more than one.
//! A built record's cell is one word, an address
//! and the edges its site marks changed, whose form is the kind of chunk the
//! address lies in (`Cell::decode_built`). A decode bounds-checks every word
//! and refuses any word no writer writes, so a malformed cell is an error,
//! never a read outside its record.

use super::{Address, ArenaError, ArenaRead, CellShape, RecordShape, StringRef};
use crate::layout_kinds::LayoutKinds;
use crate::record::{form, tagged};
use crate::record::HEADER_WORDS;
use crate::slot::ChangedEdges;
use crate::types::{KindId, NodeIndex, Span};

/// The flags a record header holds above its kind field.
pub mod flag {
    /// A link record: it names a parsed node of another tree.
    pub const LINK: u32 = 1;
    /// The bits the flags take above the kind field. The record's layout
    /// codes take the bits above them (`HeaderLayout`).
    pub const BITS: u32 = 1;
}

/// The layout a record's header word holds above its flags, each value a
/// `LayoutKinds::code`: up to three for its leading side, then one for its
/// trailing side. A built record's are the gap members at the head of each
/// side a write gave it, read before what the store's row holds for the
/// side (`TriviaStore`); a read's record's is the blank-line kind its parse
/// set the item after it apart with, as its trailing side's whole
/// (`Hydration::set_apart`).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct HeaderLayout {
    pub leading: [LayoutKinds; 3],
    pub trailing: LayoutKinds,
}

impl HeaderLayout {
    /// The layout `word`, a header whose kind field takes `bits` bits,
    /// holds.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a code past the widest layout kind.
    pub fn of(word: u32, bits: u32) -> Result<Self, ArenaError> {
        let codes = word >> (bits + flag::BITS);
        let at = |n: u32| {
            let code = (codes >> (n * LayoutKinds::CODE_BITS)) & ((1 << LayoutKinds::CODE_BITS) - 1);
            LayoutKinds::of_code(code).ok_or(malformed("header layout code", code))
        };
        Ok(Self { leading: [at(0)?, at(1)?, at(2)?], trailing: at(3)? })
    }

    /// `word`, a header whose kind field takes `bits` bits, holding this
    /// layout in place of its own.
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for a value that is not one layout kind, or
    /// codes past the header's 32 bits.
    pub fn onto(self, word: u32, bits: u32) -> Result<u32, ArenaError> {
        let shift = bits + flag::BITS;
        let values = [self.leading[0], self.leading[1], self.leading[2], self.trailing];
        let width = LayoutKinds::CODE_BITS * u32::try_from(values.len()).unwrap_or(u32::MAX);
        if shift + width > u32::BITS {
            return Err(ArenaError::Unwritable("a header whose kind field leaves no room for its layout codes"));
        }
        let codes = values.iter().enumerate().try_fold(0u32, |codes, (n, value)| {
            let code = value.code().ok_or(ArenaError::Unwritable("a header layout value of more than one kind"))?;
            Ok::<_, ArenaError>(codes | code << (u32::try_from(n).unwrap_or(u32::MAX) * LayoutKinds::CODE_BITS))
        })?;
        Ok((word & ((1 << shift) - 1)) | codes << shift)
    }

    /// The values this layout keeps for `side`, in order: three for the
    /// leading side, one for the trailing side, none for any other.
    #[must_use]
    pub fn side(&self, side: crate::trivia_table::TriviaSide) -> &[LayoutKinds] {
        match side {
            crate::trivia_table::TriviaSide::Leading => &self.leading,
            crate::trivia_table::TriviaSide::Trailing => std::slice::from_ref(&self.trailing),
            crate::trivia_table::TriviaSide::Inner => &[],
        }
    }

    /// The values this layout keeps for `side`, to write (`side`).
    pub fn side_mut(&mut self, side: crate::trivia_table::TriviaSide) -> &mut [LayoutKinds] {
        match side {
            crate::trivia_table::TriviaSide::Leading => &mut self.leading,
            crate::trivia_table::TriviaSide::Trailing => std::slice::from_mut(&mut self.trailing),
            crate::trivia_table::TriviaSide::Inner => &mut [],
        }
    }
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
/// `bits` bits; its layout codes above them are `HeaderLayout`'s.
#[must_use]
pub fn header_of(word: u32, bits: u32) -> (KindId, u32) {
    (kind_field(word, bits), (word >> bits) & ((1 << flag::BITS) - 1))
}

/// What one cell holds.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Cell {
    /// The slot holds nothing.
    Absent,
    /// A parsed leaf, which has no record: its byte span in its source and
    /// its row, which names its node. In a tree's arena the row is its
    /// descendant index; in records that outlive their tree it is 1 for its
    /// holder's own node, else two past the word its entry starts at in its
    /// holder's run.
    ParsedLeaf { kind: KindId, span: Span, row: NodeIndex },
    /// A captured interior string of a parsed node: its byte span.
    ParsedText { span: Span },
    /// A child with a record of its own: a built record, or a record a read
    /// left, which a built record names as it names a built one for an
    /// untouched parsed child. `changed` is the edges whose neighbour this
    /// holder changed: a fact of this site, held here and never in the
    /// child's record, so two holders of one record can differ.
    Child { kind: KindId, at: Address, changed: ChangedEdges },
    /// A unit, which carries no text. `KindId::BLANK` is a blank arm. A
    /// parsed unit names its row as a parsed leaf does; a built unit has
    /// none.
    Unit { kind: KindId, row: Option<NodeIndex> },
    /// A built leaf, which has no record: its text in the string table, and
    /// the edges whose neighbour this holder changed, a fact of this site as
    /// a child's are. Its sides are keyed by its site in the store.
    BuiltLeaf { kind: KindId, text: StringRef, changed: ChangedEdges },
    /// A parsed leaf as a render names it: `id` is its holder's own node for
    /// a leaf that shares it, else its holder's cell site.
    NamedLeaf { kind: KindId, span: Span, id: crate::types::NodeId },
    /// A parsed unit as a render names it, by `id` as `NamedLeaf` is.
    NamedUnit { kind: KindId, id: crate::types::NodeId },
    /// A node a read left with no record of its own, which a built record
    /// holds through the link record at `at`: the cell row `row` of the
    /// read's record at `holder` (1 for the content that shares the record's
    /// own row, the word its entry starts at in its run plus 2 otherwise),
    /// its byte span, whose
    /// text is its source's, and the edges whose neighbour this holder
    /// changed. Its sides are its row's.
    ReadLeaf { kind: KindId, at: Address, name: crate::types::NodeId, span: Span, changed: ChangedEdges },
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

    /// The address of what this cell names: a record, a run or a leaf
    /// entry, or in chunk 0 a unit's kind; address 0 for an unset cell.
    #[must_use]
    pub(crate) const fn address(self) -> Address {
        Address(self.0 >> 2)
    }

    /// The edges its site marks, as the word holds them: leading 1,
    /// trailing 2.
    #[must_use]
    pub(crate) const fn edges(self) -> u32 {
        self.0 & 3
    }
}

impl Cell {
    /// The kind a cell names: blank for captured text, none when absent.
    #[must_use]
    pub const fn kind(self) -> Option<KindId> {
        match self {
            Cell::Absent => None,
            Cell::ParsedText { .. } | Cell::BuiltText { .. } => Some(KindId::BLANK),
            Cell::ParsedLeaf { kind, .. } | Cell::Child { kind, .. } | Cell::Unit { kind, .. } | Cell::BuiltLeaf { kind, .. } | Cell::NamedLeaf { kind, .. } | Cell::NamedUnit { kind, .. } | Cell::ReadLeaf { kind, .. } => Some(kind),
        }
    }

    /// The cell a built record's cell `word` names in `arena`: absent for
    /// word 0, an unset slot; a unit for an address in chunk 0, whose word is
    /// the unit's kind, the blank arm at `BLANK_UNIT`; a record in a word chunk, a link record naming a parsed node's
    /// record (`Child` with its tree) or, with none, the node itself
    /// (`ReadLeaf`); a leaf entry in a string chunk, `[kind | length]` then
    /// its UTF-8 bytes, a blank kind for captured text.
    ///
    /// # Errors
    ///
    /// `ArenaError::OutOfBounds` for an address in no chunk, or words or
    /// bytes past what the arena wrote; `ArenaError::Malformed` for any word
    /// no writer writes.
    pub fn decode_built(cell: CellWord, arena: &dyn ArenaRead, bits: u32) -> Result<Cell, ArenaError> {
        let CellWord(word) = cell;
        if word == 0 {
            return Ok(Cell::Absent);
        }
        let edges = cell.edges();
        let changed = read_changed(edges)?;
        let at = cell.address();
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
                (kind, 0) => Ok(Cell::Child { kind, at, changed }),
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
}

const PARSED_FORMS: [(u32, u8); 3] = [(parsed_tag::NODE, form::NODE), (parsed_tag::UNIT, form::UNIT), (parsed_tag::TEXT, form::TEXT)];

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

fn end_word(span: Span) -> Result<u32, ArenaError> {
    if span.start > span.end {
        return Err(ArenaError::Unwritable("a span that ends before it starts"));
    }
    Ok(span.end)
}

impl Cell {
    /// Writes the cell into `out`, the words of a parsed record's slot of
    /// shape `shape` (its stamped width, or for a list item its run's),
    /// kinds packed in `bits` bits, zeroing the words its form leaves unused.
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
            Cell::ParsedLeaf { kind, span, row } => (form::NODE, &[CellShape::pack(kind, row.0, bits)?, span.start, end_word(span)?]),
            Cell::Child { kind, at, changed } if changed == ChangedEdges::default() => (form::NODE, &[record_kind(kind, bits)?, record(at.0)?.0, 0]),
            Cell::Unit { kind: KindId::BLANK, row: None } if shape.forms & form::BLANK != 0 => (form::UNIT, &[0]),
            Cell::Unit { kind, row: Some(row) } => (form::UNIT, &[CellShape::pack(kind, row.0, bits)?]),
            Cell::Unit { kind, row: None } => (form::UNIT, &[record_kind(kind, bits)?]),
            Cell::ParsedText { span } => (form::TEXT, &[span.start.checked_add(1).ok_or(ArenaError::Unwritable("a span past what a parsed cell holds"))?, end_word(span)?]),
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

    /// The cell in `words`, the words of a parsed record's slot of shape
    /// `shape` (its stamped width, or for a list item its run's), kinds
    /// packed in `bits` bits.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for words no parsed writer writes, or a cell
    /// narrower than its form.
    pub fn decode_parsed(words: &[u32], shape: CellShape, bits: u32) -> Result<Cell, ArenaError> {
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
            form::NODE if field(0)? >> bits == 0 => parsed_record(field(0)?, field(1)?, field(2)?, bits),
            form::NODE => {
                let (kind, row) = CellShape::unpack(field(0)?, bits)?;
                Ok(Cell::ParsedLeaf { kind, span: span(field(1)?, field(2)?)?, row: NodeIndex(row) })
            }
            form::UNIT if field(0)? >> bits == 0 => {
                let kind = kind_field(field(0)?, bits);
                if kind == KindId::BLANK || kind == KindId::ERROR {
                    return Err(malformed("cell kind", field(0)?));
                }
                Ok(Cell::Unit { kind, row: None })
            }
            form::UNIT => {
                let (kind, row) = CellShape::unpack(field(0)?, bits)?;
                Ok(Cell::Unit { kind, row: Some(NodeIndex(row)) })
            }
            form::TEXT => {
                let start = field(0)?.checked_sub(1).ok_or(malformed("text cell start", 0))?;
                Ok(Cell::ParsedText { span: span(start, field(1)?)? })
            }
            _ => Err(malformed("cell forms", u32::from(shape.forms))),
        }
    }
}

/// A node cell that names its record: `[kind, address, 0]`. Its row field is
/// 0, which no child's row is, and its address is never 0, which no record
/// is at, so it is apart from a coordinate, a leaf and an absent cell.
fn parsed_record(first: u32, at: u32, end: u32, bits: u32) -> Result<Cell, ArenaError> {
    let kind = kind_field(first, bits);
    if kind == KindId::BLANK || kind == KindId::ERROR || end != 0 {
        return Err(malformed("parsed record cell", first));
    }
    Ok(Cell::Child { kind, at: record(at)?, changed: ChangedEdges::default() })
}

/// The first word of a node cell naming a record of `kind`.
fn record_kind(kind: KindId, bits: u32) -> Result<u32, ArenaError> {
    if kind == KindId::BLANK || kind == KindId::ERROR {
        return Err(malformed("cell kind", u32::from(kind.0)));
    }
    with_kind(kind, bits)
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
    if words[5] != 0 {
        return Err(malformed("link record", words[5]));
    }
    let holder = record(words[2])?.0;
    let name = match words[3] {
        0 => crate::types::NodeId::record(holder),
        word => crate::types::NodeId::try_leaf(holder, word, words[4]).ok_or(malformed("link site", word))?,
    };
    Ok(Cell::ReadLeaf { kind, at, name, span: span(words[6], words[7])?, changed })
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
    pub fn of_word(cell: CellWord, arena: &dyn ArenaRead) -> Result<ListCell, ArenaError> {
        match run_of(cell)? {
            None => Ok(ListCell::EMPTY),
            Some(run) => Self::of_run(run, arena),
        }
    }

    /// The list whose run starts at `run` in `arena`, its first word the
    /// list's length.
    ///
    /// # Errors
    ///
    /// What reading the run's length refuses, and `ArenaError::Malformed` for
    /// a run of no items, or one that names no word after its length.
    pub(super) fn of_run(run: Address, arena: &dyn ArenaRead) -> Result<ListCell, ArenaError> {
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

/// The run a list cell names, none for an empty list.
fn run_of(cell: CellWord) -> Result<Option<Address>, ArenaError> {
    match cell {
        CellWord(0) => Ok(None),
        cell if cell.edges() != 0 => Err(malformed("list cell edges", cell.0)),
        cell => Ok(Some(cell.address())),
    }
}

/// What a walk over a built record's cells visits for a list slot.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum Lists {
    /// Each item's cell in its run.
    Items,
    /// The list cell naming its run, word 0 for an empty list, its edges
    /// checked as `ListCell::of_word` checks them.
    Runs,
}

/// Visits each cell of the built record at `at`, of shape `record`, with its
/// slot's shape, its item and its word, undecoded: a slot's one word as item
/// 0, and a list slot's as `lists` says.
///
/// # Errors
///
/// What reading the record or a run refuses, and `ArenaError::Malformed`
/// for a cell word past the record or a list cell `ListCell::of_word`
/// refuses; and what `visit` refuses.
pub(super) fn built_cells(arena: &dyn ArenaRead, at: Address, record: RecordShape, lists: Lists, mut visit: impl FnMut(CellShape, u32, CellWord) -> Result<(), ArenaError>) -> Result<(), ArenaError> {
    let words = arena.words(at, record.built_words.max(HEADER_WORDS))?;
    for &shape in record.cells {
        let word = CellWord(*words.get(shape.built as usize).ok_or(malformed("cell word", shape.built))?);
        if shape.run.is_none() {
            visit(shape, 0, word)?;
            continue;
        }
        if lists == Lists::Runs {
            run_of(word)?;
            visit(shape, 0, word)?;
            continue;
        }
        for (item, n) in ListCell::of_word(word, arena)?.items(arena, 1)?.zip(0..) {
            visit(shape, n, CellWord(item[0]))?;
        }
    }
    Ok(())
}

/// What a walk over a parsed record's cells visits: each cell, decoded,
/// with its slot's shape and its item, and each list slot's run, at the
/// entry its list cell names, its length word.
#[derive(Debug, Clone, Copy)]
pub(super) enum ParsedCell {
    Cell(CellShape, u32, Cell),
    Run(Address),
}

/// Visits each cell of the parsed record at `at`, of shape `record`, its
/// kind field `bits` bits: a slot's one cell as item 0, and a list slot's
/// run, then each of its items' cells.
///
/// # Errors
///
/// What reading the record or a run or decoding a cell refuses, and
/// `ArenaError::Malformed` for a cell word past the record; and what
/// `visit` refuses.
pub(super) fn parsed_cell_walk(arena: &dyn ArenaRead, at: Address, record: RecordShape, bits: u32, mut visit: impl FnMut(ParsedCell) -> Result<(), ArenaError>) -> Result<(), ArenaError> {
    let words = arena.words(at, record.words.max(HEADER_WORDS))?;
    for &shape in record.cells {
        if let Some(width) = shape.run {
            let word = CellWord(*words.get(shape.word as usize).ok_or(malformed("cell word", shape.word))?);
            if let Some(run) = run_of(word)? {
                visit(ParsedCell::Run(run))?;
            }
            for (item, n) in ListCell::of_word(word, arena)?.items(arena, width)?.zip(0..) {
                visit(ParsedCell::Cell(shape, n, Cell::decode_parsed(item, shape, bits)?))?;
            }
        } else {
            let cell = words.get(shape.word as usize..(shape.word + shape.width) as usize).ok_or(malformed("cell word", shape.word))?;
            visit(ParsedCell::Cell(shape, 0, Cell::decode_parsed(cell, shape, bits)?))?;
        }
    }
    Ok(())
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
    use crate::arena::Arena;

    const BITS: u32 = 9;

    #[test]
    fn a_cell_words_address_and_edges_read_back_as_it_was_made() {
        let at = Address::new(3, 40).expect("an address");
        let leading = CellWord::of(at, ChangedEdges { leading: true, trailing: false }).expect("a cell");
        assert_eq!((leading.address(), leading.edges()), (at, 1));
        let both = CellWord::of(at, ChangedEdges { leading: true, trailing: true }).expect("a cell");
        assert_eq!((both.address(), both.edges()), (at, 3));
        let unit = CellWord::unit(KindId(5)).expect("a unit");
        assert_eq!((unit.address(), unit.edges()), (Address(5), 0));
        assert_eq!((CellWord(0).address(), CellWord(0).edges()), (Address::NONE, 0));
    }

    #[test]
    fn a_built_records_cells_are_walked_a_list_slots_as_its_items_or_as_the_cell_naming_its_run() {
        const CELLS: &[CellShape] = &[
            CellShape { word: 2, width: 3, run: None, forms: form::NODE, built: 2, key: "_child", ..CellShape::BARE },
            CellShape { word: 5, width: 1, run: Some(3), forms: form::NODE, built: 3, key: "_items", ..CellShape::BARE },
            CellShape { word: 6, width: 3, run: None, forms: form::NODE, built: 4, key: "_unset", ..CellShape::BARE },
        ];
        let record = RecordShape { words: 9, built_words: 5, cells: CELLS, ..RecordShape::BARE };
        let mut image = BuiltImage::new(BITS);
        let leaf = image.record(KindId(6), HEADER_WORDS, &[]);
        let child = built_cell(leaf, ChangedEdges { leading: true, trailing: false });
        let items = [built_cell(leaf, ChangedEdges::default()), built_cell(leaf, ChangedEdges { leading: false, trailing: true })];
        let run = image.run(&items);
        let full = image.record(KindId(5), 5, &[(2, child), (3, run)]);
        let empty = image.record(KindId(5), 5, &[(2, child)]);
        let walk = |at: Address, lists: Lists| {
            let mut cells = Vec::new();
            built_cells(&image, at, record, lists, |shape, item, word| {
                cells.push((shape.key, item, word.0));
                Ok(())
            })
            .expect("a walk");
            cells
        };
        assert_eq!(walk(full, Lists::Items), vec![("_child", 0, child), ("_items", 0, items[0]), ("_items", 1, items[1]), ("_unset", 0, 0)]);
        assert_eq!(walk(full, Lists::Runs), vec![("_child", 0, child), ("_items", 0, run), ("_unset", 0, 0)]);
        assert_eq!(walk(empty, Lists::Items), vec![("_child", 0, child), ("_unset", 0, 0)], "an empty list has no items");
        assert_eq!(walk(empty, Lists::Runs), vec![("_child", 0, child), ("_items", 0, 0), ("_unset", 0, 0)], "and its cell is word 0");
    }

    #[test]
    fn a_run_is_read_from_its_address_as_from_the_list_cell_naming_it() {
        let mut image = BuiltImage::new(BITS);
        let leaf = image.record(KindId(6), HEADER_WORDS, &[]);
        let run = image.run(&[built_cell(leaf, ChangedEdges::default())]);
        assert_eq!(ListCell::of_run(CellWord(run).address(), &image), ListCell::of_word(CellWord(run), &image));
        let empty = BuiltImage::words(&mut image, &[0, 0]);
        assert_eq!(ListCell::of_run(empty, &image), Err(malformed("list length", 0)));
    }

    fn shape(forms: u8, width: u32) -> CellShape {
        CellShape { word: 0, width, run: None, forms, built: 0, key: "_slot", ..CellShape::BARE }
    }

    /// `cell-forms.json`, the fixture the TypeScript cell decoder is pinned
    /// to: each entry's cell, as its fields name it.
    fn fixture_cell(entry: &serde_json::Value) -> Cell {
        let n = |key: &str| fixture_number(entry, key);
        let kind = || KindId(u16::try_from(n("kind")).expect("a kind"));
        let span = || Span { start: n("start"), end: n("end") };
        let row = || entry["row"].as_u64().map(|row| NodeIndex(u32::try_from(row).expect("a row")));
        match entry["form"].as_str().expect("a form") {
            "absent" => Cell::Absent,
            "parsedLeaf" => Cell::ParsedLeaf { kind: kind(), span: span(), row: NodeIndex(n("row")) },
            "parsedText" => Cell::ParsedText { span: span() },
            "child" => Cell::Child {
                kind: kind(),
                at: Address(n("at")),
                changed: fixture_changed(entry),
            },
            "unit" => Cell::Unit { kind: kind(), row: row() },
            other => panic!("no cell form {other}"),
        }
    }

    /// The shape of a parsed fixture entry's slot: its forms, as wide as
    /// its words.
    fn parsed_shape(entry: &serde_json::Value) -> CellShape {
        shape(u8::try_from(fixture_number(entry, "forms")).expect("forms"), u32::try_from(fixture_words(entry).len()).expect("a width"))
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
            "linkedLeaf" => Cell::ReadLeaf {
                kind: kind(),
                at: Address(n("at")),
                name: match entry["site"].as_array().map(|site| [0, 1].map(|at| u32::try_from(site[at].as_u64().expect("a site number")).expect("a site number"))) {
                    Some([word, item]) => crate::types::NodeId::leaf(n("holder"), word, item),
                    None => crate::types::NodeId::record(n("holder")),
                },
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
    fn every_parsed_form_is_written_and_read_as_the_shared_fixture_holds_it() {
        let fixture: serde_json::Value = serde_json::from_str(include_str!("cell-forms.json")).expect("the fixture parses");
        let parsed = &fixture["parsed"];
        let bits = fixture_number(parsed, "kindBits");
        let cells = parsed["cells"].as_array().expect("cells");
        for entry in cells {
            let (shape, words, cell) = (parsed_shape(entry), fixture_words(entry), fixture_cell(entry));
            assert_eq!(Cell::decode_parsed(&words, shape, bits), Ok(cell), "{entry}");
            let mut written = vec![9; words.len()];
            cell.encode_parsed(&mut written, shape, bits).expect("it fits");
            assert_eq!(written, words, "{entry}");
        }
        let forms: std::collections::BTreeSet<&str> = cells.iter().map(|entry| entry["form"].as_str().expect("a form")).collect();
        assert_eq!(forms, ["absent", "child", "parsedLeaf", "parsedText", "unit"].into(), "the fixture holds every parsed form");
    }

    #[test]
    fn every_address_packs_as_the_shared_fixture_holds_it() {
        let fixture: serde_json::Value = serde_json::from_str(include_str!("cell-forms.json")).expect("the fixture parses");
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
        let bits = fixture_number(built, "kindBits");
        let mut image = BuiltImage::new(bits);
        let name = image.entry(KindId(16), "name");
        let text = image.entry(KindId::BLANK, "ab");
        image.entry(KindId::ERROR, "?");
        let record = image.record(KindId(14), 3, &[(2, built_cell(name, ChangedEdges { leading: true, trailing: false }))]);
        image.link(KindId(14), crate::types::NodeId::leaf(5000, 3, 2), Span { start: 2, end: 9 });
        image.link(KindId(16), crate::types::NodeId::record(5000), Span { start: 4, end: 8 });
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
            assert_eq!(Cell::decode_built(CellWord(fixture_number(entry, "word")), &image, bits), Ok(built_fixture_cell(entry)), "{entry}");
        }
        for entry in built["lists"].as_array().expect("lists") {
            let list = ListCell { run: Address(fixture_number(entry, "run")), len: fixture_number(entry, "len") };
            assert_eq!(ListCell::of_word(CellWord(fixture_number(entry, "word")), &image), Ok(list), "{entry}");
        }
    }

    #[test]
    fn a_blank_arm_is_a_unit_of_zero_and_its_slot_never_holds_absent() {
        let blank = shape(form::UNIT | form::BLANK, 1);
        let mut words = [7];
        Cell::Unit { kind: KindId::BLANK, row: None }.encode_parsed(&mut words, blank, BITS).expect("it fits");
        assert_eq!(words, [0]);
        assert_eq!(Cell::decode_parsed(&words, blank, BITS), Ok(Cell::Unit { kind: KindId::BLANK, row: None }));
        assert_eq!(Cell::Absent.encode_parsed(&mut words, blank, BITS), Err(ArenaError::Unwritable("an absent value in a slot that admits a blank arm")));
        assert_eq!(Cell::decode_parsed(&[0], shape(form::UNIT, 1), BITS), Ok(Cell::Absent), "without a blank arm, zero is absent");
    }

    #[test]
    fn a_parsed_cell_packs_its_kind_beside_a_row_and_refuses_one_past_the_bits_left() {
        let unit = shape(form::UNIT, 1);
        let mut words = [0];
        let at_row = |row| Cell::Unit { kind: KindId(3), row: Some(NodeIndex(row)) };
        assert_eq!(at_row(0).encode_parsed(&mut words, unit, BITS), Err(ArenaError::Malformed { what: "a child's row", word: 0 }));
        assert_eq!(at_row(1 << (32 - BITS)).encode_parsed(&mut words, unit, BITS), Err(ArenaError::Unwritable("a row past what a parsed cell packs beside its kind")));
        at_row((1 << (32 - BITS)) - 1).encode_parsed(&mut words, unit, BITS).expect("the last row fits");
        assert_eq!(Cell::decode_parsed(&words, unit, BITS), Ok(at_row((1 << (32 - BITS)) - 1)));
        assert!(Cell::Unit { kind: KindId::ERROR, row: Some(NodeIndex(1)) }.encode_parsed(&mut words, unit, BITS).is_err());
    }

    #[test]
    fn a_parsed_unit_may_hold_its_kind_alone() {
        let unit = shape(form::UNIT, 1);
        let mut words = [0];
        Cell::Unit { kind: KindId(3), row: None }.encode_parsed(&mut words, unit, BITS).expect("it fits");
        assert_eq!(words, [3]);
        assert_eq!(Cell::decode_parsed(&words, unit, BITS), Ok(Cell::Unit { kind: KindId(3), row: None }));
        assert!(Cell::Unit { kind: KindId::ERROR, row: None }.encode_parsed(&mut words, unit, BITS).is_err());
        assert!(Cell::decode_parsed(&[u32::from(KindId::ERROR.0)], unit, BITS).is_err());
    }

    #[test]
    fn a_value_its_slot_does_not_hold_is_refused() {
        let node = shape(form::NODE, 3);
        let mut words = [0; 3];
        let span = Span { start: 0, end: 1 };
        assert_eq!(Cell::ParsedText { span }.encode_parsed(&mut words, node, BITS), Err(ArenaError::Unwritable("a form its slot does not hold")));
        let text = StringRef { chunk: 1, byte: 4, len: 1 };
        assert_eq!(Cell::BuiltText { text }.encode_parsed(&mut words, node, BITS), Err(ArenaError::Unwritable("a value no parsed record holds")));
        for cell in [
            Cell::ParsedLeaf { kind: KindId::BLANK, span, row: NodeIndex(1) },
            Cell::ParsedLeaf { kind: KindId(3), span: Span { start: 2, end: 1 }, row: NodeIndex(1) },
            Cell::Child { kind: KindId::BLANK, at: Address(4), changed: ChangedEdges::default() },
            Cell::Child { kind: KindId(2), at: Address::NONE, changed: ChangedEdges::default() },
                Cell::Child { kind: KindId(2), at: Address(4), changed: ChangedEdges { leading: true, trailing: false } },
        ] {
            assert!(cell.encode_parsed(&mut words, node, BITS).is_err(), "{cell:?}");
        }
        assert!(Cell::ParsedLeaf { kind: KindId(3), span, row: NodeIndex(1) }.encode_parsed(&mut [0; 2], node, BITS).is_err(), "a node takes three words");
    }

    #[test]
    fn a_cell_no_writer_writes_is_refused() {
        let node = shape(form::NODE, 3);
        let tagged = shape(form::NODE | form::TEXT, 4);
        for (words, shape) in [
            (vec![], node),
            (vec![0, 5, 0], node),
            (vec![3 | 1 << BITS, 0], node),
            (vec![u32::MAX, 0, 0], node),
            (vec![3, 0, 0], node),
            (vec![3 | 1 << BITS, 2, 1], node),
            (vec![7, 0, 0, 0], tagged),
            (vec![parsed_tag::UNIT, 0, 0, 0], tagged),
            (vec![parsed_tag::TEXT, 0, 1, 0], tagged),
            (vec![parsed_tag::ABSENT, 0, 1, 0], tagged),
        ] {
            assert!(Cell::decode_parsed(&words, shape, BITS).is_err(), "{words:?}");
        }
    }

    #[test]
    fn a_list_reads_its_run_of_item_cells_back() {
        let node = shape(form::NODE, 3);
        let items = [
            Cell::ParsedLeaf { kind: KindId(12), span: Span { start: 3, end: 7 }, row: NodeIndex(40) },
            Cell::ParsedLeaf { kind: KindId(13), span: Span { start: 8, end: 9 }, row: NodeIndex(41) },
        ];
        let mut run = vec![2];
        for item in items {
            let mut cell = [0; 3];
            item.encode_parsed(&mut cell, node, BITS).expect("it fits");
            run.extend(cell);
        }
        let mut arena = Arena::new();
        let at = arena.push(&run).expect("room");
        let list = ListCell::of_word(ListCell::word(at).expect("a list cell"), &arena).expect("a list");
        assert_eq!(list, ListCell { run: at.offset(1).expect("its first item"), len: 2 });
        let read: Vec<Cell> = list.items(&arena, 3).expect("its run").map(|item| Cell::decode_parsed(item, node, BITS).expect("an item")).collect();
        assert_eq!(read, items);
    }

    #[test]
    fn an_empty_list_has_no_run() {
        let arena = Arena::new();
        assert_eq!(ListCell::of_word(CellWord(0), &arena), Ok(ListCell::EMPTY));
        assert_eq!(ListCell::EMPTY.items(&arena, 3).expect("no run").len(), 0);
    }

    #[test]
    fn a_list_cell_no_writer_writes_is_refused() {
        let mut arena = Arena::new();
        let empty = arena.push(&[0]).expect("room");
        assert!(ListCell::of_word(CellWord(empty.0 << 2 | 1), &arena).is_err(), "a list cell marks no changed edges");
        assert!(ListCell::of_word(ListCell::word(empty).expect("a list cell"), &arena).is_err(), "a run of no items");
        assert!(ListCell { run: Address(1), len: 1_000 }.items(&arena, 3).is_err());
        assert!(ListCell { run: Address(1), len: u32::MAX }.items(&arena, 3).is_err());
        assert!(ListCell { run: Address(1), len: 1 }.items(&arena, 0).is_err());
    }
}
