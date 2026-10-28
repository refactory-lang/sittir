//! Arena storage for records: chunks of `u32` words, and a string table of
//! UTF-8 bytes in chunks. Every chunk is native memory, zeroed when it is
//! allocated, at one length for its life, and never moved, so JavaScript
//! reads a chunk in place through an external array buffer (`memory`).
//!
//! [`cell`] encodes and decodes one slot's cell, [`side`] a record's side
//! record, and [`rows`] keeps a parsed tree's arena with the records no cell
//! names; `reach` finds a parsed node's record through its cells. The
//! record writer (`write_record`) writes a native node's records, children
//! before parents. A built record's trivia is outside the arena, in the
//! engine's store of written sides (`trivia_store`), and what a render's
//! prepare fills is in its overlay (`Prepared`). An engine's built records
//! are in its `BuiltChunks`, which JavaScript's builders write.
//!
//! An arena only appends records: no record is freed or moved, so an address
//! names one record for as long as the arena lives. A parsed record's cell
//! that holds a coordinate is rewritten once, to name the record the first
//! read through it writes; nothing else in a written record changes.

mod admit;
mod borrowed;
mod built;
pub mod count;
#[cfg(test)]
mod built_image;
mod built_write;
pub mod cell;
pub mod hydrate;
pub mod memory;
mod parsed;
mod prep;
mod prepared;
mod reach;
pub mod rows;
mod view;
pub mod side;
mod small;
mod write;

use std::collections::HashMap;
use std::fmt;
use std::sync::Arc;

use crate::types::{KindId, TreeId};

pub use admit::{admit, CellShape, RecordCells, RecordShape};
pub use borrowed::{ArenaRead, BorrowedArena};
pub use built::render_record_entry;
pub use built_write::BuiltWriter;
pub use cell::{flag, header_of, kind_field, parsed_tag, with_kind, Cell, CellWord, ListCell, LINK_WORDS};
pub use hydrate::{hydrate_at, parsed_side, row_of as hydrated_row, Draft, HydrateError, HydrateNode, HydrateSlot, Hydrated, Hydration, Walk};
pub use memory::{ChunkMem, ChunkUnit};
pub use parsed::RecordGrammar;
pub use reach::{deepen, reach, read_cell};
pub use prep::{own_seat, prepare_root, record_snapshot_edge, record_source_separator, seat_through, view_kind_in, CellAt, HeldArenas, LayoutAt, PrepareRecord, RecordAt, RecordPrep, RecordTrees, SettingAt, SettingOf, SlotAt};
pub use prepared::{PrepPlace, Prepared, PreparedNode, PreparedSlot, SlotTokens};
pub use view::{built_leaf_place, linked_leaf_place, held_changed, leaf_place, place_of, record_of, row_of, source_root, ParsedRow, RecordArenas, RecordCtx, RecordItems, RecordLayout, RecordSlot, RecordView, VerbatimRecord};
pub use write::{LayoutField, Link, Linked, RecordSink, WriteCell, captured_cell, coordinate_cell, leaf_cell, write_list, write_record, write_slot};
pub use rows::TreeArena;
pub use side::{Row, SideRecord, SideSlot, Sides};

/// A native node type's view over its records: a struct's is its
/// `…Record<'a>`, a choice's an enum over its variants' views, chosen by the
/// cell's kind. A cell's accessor names a child's view through the child's
/// native type, `<T as HasRecord>::Record<'a>`.
pub trait HasRecord {
    type Record<'a>
    where
        Self: 'a;
}

/// A boxed node's view is its node's.
impl<N: HasRecord + ?Sized> HasRecord for Box<N> {
    type Record<'a>
        = N::Record<'a>
    where
        Self: 'a;
}

impl HasRecord for crate::verbatim::VerbatimNode {
    type Record<'a> = VerbatimRecord<'a>;
}

/// The entry of `entries` for the slot at `word`, by each entry's own word,
/// added from `new` when none is.
fn entry_by_word<S>(entries: &mut Vec<S>, word: u32, word_of: impl Fn(&S) -> u32, new: impl FnOnce() -> S) -> &mut S {
    let at = entries.iter().position(|entry| word_of(entry) == word).unwrap_or_else(|| {
        entries.push(new());
        entries.len() - 1
    });
    &mut entries[at]
}

/// The bits of a packed address or string offset below its chunk.
pub const CHUNK_SHIFT: u32 = 14;
pub use crate::record::PARSED_KIND_BITS;
/// The words a shared chunk holds at most, and the bound on a word's index
/// within a packed address.
pub const CHUNK_WORDS: u32 = 1 << CHUNK_SHIFT;
/// The chunks an arena holds at most: the bound a packed address leaves.
pub const MAX_CHUNKS: u32 = 1 << (32 - CHUNK_SHIFT);
/// The words of an arena's first chunk; each later shared chunk doubles it,
/// up to `CHUNK_WORDS`.
const FIRST_CHUNK_WORDS: u32 = 1 << 10;
/// The bytes a shared string chunk holds at most; a longer string gets its
/// own.
pub const STRING_CHUNK_BYTES: u32 = 1 << CHUNK_SHIFT;
/// The bytes of an arena's first string chunk; each later shared one
/// doubles it, up to `STRING_CHUNK_BYTES`.
const FIRST_STRING_BYTES: u32 = 1 << 10;
/// The elements one chunk holds at most, a part's own chunk included.
const MOST_CHUNK_UNITS: u32 = 1 << 28;

/// A record's or run's place in an arena: its chunk and its first word,
/// packed as `chunk << CHUNK_SHIFT | word`. Address 0 is no record.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct Address(pub u32);

impl Address {
    pub const NONE: Address = Address(0);

    /// This address, which names a record: every address but 0.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for address 0.
    pub fn record(self) -> Result<Address, ArenaError> {
        if self == Address::NONE {
            return Err(ArenaError::Malformed { what: "record address", word: 0 });
        }
        Ok(self)
    }

    #[must_use]
    pub fn new(chunk: u32, word: u32) -> Option<Address> {
        (chunk < MAX_CHUNKS && word < CHUNK_WORDS).then_some(Address(chunk << CHUNK_SHIFT | word))
    }

    #[must_use]
    pub fn chunk(self) -> u32 {
        self.0 >> CHUNK_SHIFT
    }

    #[must_use]
    pub fn word(self) -> u32 {
        self.0 & (CHUNK_WORDS - 1)
    }

    /// The address `n` words past this one, in the same chunk.
    #[must_use]
    pub fn offset(self, n: u32) -> Option<Address> {
        Address::new(self.chunk(), self.word().checked_add(n)?)
    }
}

/// A string in the arena's table: its chunk, its first byte and its length.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct StringRef {
    pub chunk: u32,
    pub byte: u32,
    pub len: u32,
}

impl StringRef {
    /// The chunk and first byte packed into one word, as a cell holds them:
    /// `chunk << CHUNK_SHIFT | byte`. `None` when either is past what the
    /// packing holds.
    #[must_use]
    pub fn offset(self) -> Option<u32> {
        (self.chunk < MAX_CHUNKS && self.byte < CHUNK_WORDS).then_some(self.chunk << CHUNK_SHIFT | self.byte)
    }

    /// The string a cell's offset and length words name.
    #[must_use]
    pub fn from_offset(offset: u32, len: u32) -> StringRef {
        StringRef { chunk: offset >> CHUNK_SHIFT, byte: offset & (CHUNK_WORDS - 1), len }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ArenaError {
    /// The arena holds `MAX_CHUNKS` chunks already, or a chunk was asked
    /// for at more elements than one holds.
    Full,
    /// Words `[word, word + len)` of `chunk` are not all written.
    OutOfBounds { chunk: u32, word: u32, len: u32 },
    /// Bytes `[byte, byte + len)` of string chunk `chunk` are not all written,
    /// or do not hold UTF-8 on character boundaries.
    BadString(StringRef),
    /// A word no writer writes there: `what` names the field, `word` holds it.
    Malformed { what: &'static str, word: u32 },
    /// A node's layout names a list slot, by its wire key, that has no
    /// stamped cell in the node's record.
    UnknownSlot(Box<str>),
    /// A value no record holds: `what` names it.
    Unwritable(&'static str),
    /// A record of kind `kind` read where a value of the choice `owner` is
    /// read, which decodes no node of that kind.
    UnknownKind { kind: crate::types::KindId, owner: &'static str },
    /// A read at `at`, whose chunk was freed once every entry in it was
    /// released.
    Released(Address),
}

/// A record entry whose arena, or the store that holds its sides, is gone.
pub const ARENA_RELEASED: ArenaError = ArenaError::Unwritable("the arena that built a side's record was released");

impl fmt::Display for ArenaError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ArenaError::Full => write!(f, "the arena holds its {MAX_CHUNKS} chunks, or a chunk past {MOST_CHUNK_UNITS} elements was asked for"),
            ArenaError::OutOfBounds { chunk, word, len } => {
                write!(f, "words {word}..{} of chunk {chunk} are past what the arena wrote", u64::from(*word) + u64::from(*len))
            }
            ArenaError::BadString(at) => {
                write!(f, "bytes {}..{} of string chunk {} are not a string the arena wrote", at.byte, u64::from(at.byte) + u64::from(at.len), at.chunk)
            }
            ArenaError::Malformed { what, word } => write!(f, "{what} {word} is not one a record writer writes"),
            ArenaError::UnknownSlot(key) => write!(f, "the layout names slot `{key}`, which has no stamped cell in its record"),
            ArenaError::Unwritable(what) => write!(f, "a record writer does not write {what}"),
            ArenaError::UnknownKind { kind, owner } => f.write_str(&crate::boundary::unknown_kind(*kind, owner)),
            ArenaError::Released(at) => write!(f, "the node at {} was released: the chunk its record was in is freed", at.0),
        }
    }
}

impl std::error::Error for ArenaError {}

/// A chunk of an arena native code writes, and the elements written of it.
#[derive(Debug)]
struct Chunk<T: ChunkUnit> {
    mem: Arc<ChunkMem<T>>,
    written: u32,
}

impl<T: ChunkUnit> Chunk<T> {
    fn with_limit(limit: u32) -> Self {
        Self { mem: ChunkMem::zeroed(limit as usize), written: 0 }
    }

    #[allow(clippy::cast_possible_truncation, reason = "a chunk holds at most MOST_CHUNK_UNITS elements")]
    fn limit(&self) -> u32 {
        self.mem.len() as u32
    }

    fn room(&self) -> u32 {
        self.limit() - self.written
    }

    fn written(&self) -> &[T] {
        // SAFETY: the arena's shared borrow is held for the slice's life,
        // and a native call runs no JavaScript.
        unsafe { &self.mem.slice()[..self.written as usize] }
    }

    fn written_mut(&mut self) -> &mut [T] {
        // SAFETY: the arena's mutable borrow is held for the slice's life,
        // and a native call runs no JavaScript.
        unsafe { &mut self.mem.slice_mut()[..self.written as usize] }
    }

    /// `n` more elements written, zeroed, and where they start.
    fn extend(&mut self, n: u32) -> u32 {
        let start = self.written;
        self.written += n;
        self.written_mut()[start as usize..].fill(T::default());
        start
    }
}

/// The index of the next chunk of `chunks`, while it stays below `MAX_CHUNKS`.
fn next_chunk<T>(chunks: &[T]) -> Result<u32, ArenaError> {
    u32::try_from(chunks.len()).ok().filter(|&n| n < MAX_CHUNKS).ok_or(ArenaError::Full)
}

fn word_range(at: Address, len: u32, written: usize) -> Result<std::ops::Range<usize>, ArenaError> {
    let word = at.word();
    let end = word.checked_add(len).filter(|&end| end as usize <= written).ok_or(ArenaError::OutOfBounds { chunk: at.chunk(), word, len })?;
    Ok(word as usize..end as usize)
}

/// The limit of the shared chunk after one of `last` elements: double it,
/// from `first` up to `cap`, and never less than `least`.
fn next_limit(last: Option<u32>, first: u32, cap: u32, least: u32) -> u32 {
    last.map_or(first, |last| last.saturating_mul(2)).clamp(first, cap).max(least)
}

/// One arena native code writes: word chunks for records and runs, and the
/// string table.
#[derive(Debug)]
pub struct Arena {
    chunks: Vec<Chunk<u32>>,
    /// The shared chunk records are appended to; an oversize run's chunk is
    /// never it.
    open: u32,
    strings: Vec<Chunk<u8>>,
    /// The shared string chunk strings are appended to, once one is.
    open_strings: Option<u32>,
    interned: HashMap<Box<str>, StringRef>,
    kind_bits: u32,
}

impl Default for Arena {
    fn default() -> Self {
        Self::new()
    }
}

impl Arena {
    /// An arena whose first word is reserved, so no record is at `Address::NONE`.
    #[must_use]
    pub fn new() -> Self {
        Self::with_kind_bits(PARSED_KIND_BITS)
    }

    /// An arena whose kind fields take `kind_bits` bits, its first word
    /// reserved as `new`'s is.
    #[must_use]
    pub fn with_kind_bits(kind_bits: u32) -> Self {
        let mut first = Chunk::with_limit(FIRST_CHUNK_WORDS);
        first.extend(1);
        Self { chunks: vec![first], open: 0, strings: Vec::new(), open_strings: None, interned: HashMap::new(), kind_bits }
    }

    /// The bits the kind fields this arena writes take.
    #[must_use]
    pub fn kind_bits(&self) -> u32 {
        self.kind_bits
    }

    /// `words` zeroed words, contiguous in one chunk, and their address.
    pub fn alloc(&mut self, words: u32) -> Result<Address, ArenaError> {
        if words > MOST_CHUNK_UNITS {
            return Err(ArenaError::Full);
        }
        if words > CHUNK_WORDS {
            let chunk = next_chunk(&self.chunks)?;
            let mut own = Chunk::with_limit(words);
            own.extend(words);
            self.chunks.push(own);
            return Ok(Address(chunk << CHUNK_SHIFT));
        }
        if self.chunks[self.open as usize].room() < words {
            let limit = next_limit(Some(self.chunks[self.open as usize].limit()), FIRST_CHUNK_WORDS, CHUNK_WORDS, words);
            let chunk = next_chunk(&self.chunks)?;
            self.chunks.push(Chunk::with_limit(limit));
            self.open = chunk;
        }
        let word = self.chunks[self.open as usize].extend(words);
        Ok(Address(self.open << CHUNK_SHIFT | word))
    }

    /// `words` written at a fresh address.
    pub fn push(&mut self, words: &[u32]) -> Result<Address, ArenaError> {
        let len = u32::try_from(words.len()).map_err(|_| ArenaError::Full)?;
        let at = self.alloc(len)?;
        self.words_mut(at, len)?.copy_from_slice(words);
        Ok(at)
    }

    fn range(&self, at: Address, len: u32) -> Result<(usize, std::ops::Range<usize>), ArenaError> {
        let chunk = at.chunk() as usize;
        let words = self.chunks.get(chunk).ok_or(ArenaError::OutOfBounds { chunk: at.chunk(), word: at.word(), len })?;
        Ok((chunk, word_range(at, len, words.written as usize)?))
    }

    /// The `len` words at `at`, all of them written.
    pub fn words(&self, at: Address, len: u32) -> Result<&[u32], ArenaError> {
        ArenaRead::words(self, at, len)
    }

    pub fn words_mut(&mut self, at: Address, len: u32) -> Result<&mut [u32], ArenaError> {
        let (chunk, range) = self.range(at, len)?;
        Ok(&mut self.chunks[chunk].written_mut()[range])
    }

    pub fn word(&self, at: Address) -> Result<u32, ArenaError> {
        ArenaRead::word(self, at)
    }

    /// Chunk `n`'s written words.
    #[must_use]
    pub fn chunk(&self, n: u32) -> Option<&[u32]> {
        self.chunks.get(n as usize).map(Chunk::written)
    }

    /// Chunk `n`'s storage, every word of it, written or not, to share with a
    /// buffer JavaScript reads it through.
    #[must_use]
    pub fn chunk_memory(&self, n: u32) -> Option<Arc<ChunkMem<u32>>> {
        self.chunks.get(n as usize).map(|chunk| Arc::clone(&chunk.mem))
    }

    /// The bytes every chunk of the arena takes, words and strings.
    #[must_use]
    pub fn allocated_bytes(&self) -> usize {
        self.chunks.iter().map(|chunk| chunk.mem.byte_len()).chain(self.strings.iter().map(|chunk| chunk.mem.byte_len())).sum()
    }

    /// `text` in the string table, written once however often it is stored.
    pub fn intern(&mut self, text: &str) -> Result<StringRef, ArenaError> {
        if let Some(&at) = self.interned.get(text) {
            return Ok(at);
        }
        let len = u32::try_from(text.len()).map_err(|_| ArenaError::Full)?;
        if len > MOST_CHUNK_UNITS {
            return Err(ArenaError::Full);
        }
        let chunk = if len > STRING_CHUNK_BYTES {
            let chunk = next_chunk(&self.strings)?;
            self.strings.push(Chunk::with_limit(len));
            chunk
        } else {
            match self.open_strings {
                Some(open) if self.strings[open as usize].room() >= len => open,
                open => {
                    let limit = next_limit(open.map(|open| self.strings[open as usize].limit()), FIRST_STRING_BYTES, STRING_CHUNK_BYTES, len);
                    let chunk = next_chunk(&self.strings)?;
                    self.strings.push(Chunk::with_limit(limit));
                    self.open_strings = Some(chunk);
                    chunk
                }
            }
        };
        let bytes = &mut self.strings[chunk as usize];
        let byte = bytes.extend(len);
        bytes.written_mut()[byte as usize..].copy_from_slice(text.as_bytes());
        let at = StringRef { chunk, byte, len };
        self.interned.insert(text.into(), at);
        Ok(at)
    }

    /// The string at `at`.
    pub fn text(&self, at: StringRef) -> Result<&str, ArenaError> {
        ArenaRead::text(self, at)
    }
}

impl ArenaRead for Arena {
    fn chunk(&self, n: u32) -> Option<&[u32]> {
        self.chunk(n)
    }

    fn string_chunk(&self, n: u32) -> Option<&[u8]> {
        self.strings.get(n as usize).map(Chunk::written)
    }
}

/// One chunk of an engine's built arena: words, with the counts of the
/// entries placed in them, or UTF-8 bytes, with the count of the cells that
/// name an entry in them.
#[derive(Debug)]
enum BuiltChunk {
    Words { mem: Arc<ChunkMem<u32>>, counts: count::CountTable },
    Bytes { mem: Arc<ChunkMem<u8>>, cells: Arc<ChunkMem<u8>> },
}

impl BuiltChunk {
    fn byte_len(&self) -> usize {
        match self {
            BuiltChunk::Words { mem, counts } => mem.byte_len() + counts.byte_len(),
            BuiltChunk::Bytes { mem, cells } => mem.byte_len() + cells.byte_len(),
        }
    }
}

/// The most chunks a built arena holds: a built cell keeps 16 bits for its
/// chunk.
pub const MAX_BUILT_CHUNKS: u32 = 1 << 16;

/// A chunk a built arena made: its number, its memory and its meta
/// (`count`).
#[derive(Debug)]
pub struct NewChunk<T: ChunkUnit> {
    pub chunk: u32,
    pub mem: Arc<ChunkMem<T>>,
    pub meta: Arc<ChunkMem<u8>>,
}

/// The record shape of a kind, the grammar's (`RecordGrammar::shape`).
pub type ShapeOf = fn(KindId) -> Option<RecordShape>;

/// The chunks of an engine's built arena: native memory JavaScript's
/// builders ask for one chunk at a time and write records and leaf entries
/// into through external array buffers, with each chunk's counts beside it
/// (`count`). Word and string chunks take their numbers from one count, so a
/// built cell's chunk tells its form; chunk 0 is none, since a cell in it is
/// a unit. A freed chunk's number comes back only once every number has been
/// handed out. The latest chunk of each form up to `CHUNK_WORDS` units is
/// open, and builders append to it; a chunk is freed once it is sealed and
/// holds nothing live. Native code reads every element of a chunk, so an
/// element no builder wrote reads as zero, and every word is untrusted.
#[derive(Debug)]
pub struct BuiltChunks {
    chunks: Vec<Option<BuiltChunk>>,
    kind_bits: u32,
    shape: ShapeOf,
    released: bool,
    open: [Option<u32>; 2],
    free: std::collections::VecDeque<u32>,
    freed: Vec<u32>,
    trees: Vec<TreeId>,
    overflow: HashMap<u32, u32>,
}

impl BuiltChunks {
    /// An arena whose kind fields take `kind_bits` bits and whose records'
    /// shapes are `shape`'s: the grammar's stamps.
    #[must_use]
    pub fn new(kind_bits: u32, shape: ShapeOf) -> Self {
        Self { chunks: vec![None], kind_bits, shape, released: false, open: [None; 2], free: std::collections::VecDeque::new(), freed: Vec::new(), trees: Vec::new(), overflow: HashMap::new() }
    }

    /// A new words chunk of `len` words, zeroed: its number, its memory and
    /// its meta (`count`).
    ///
    /// # Errors
    ///
    /// `ARENA_RELEASED` once released, and `ArenaError::Full` for an empty
    /// chunk, one past `MOST_CHUNK_UNITS` words, or a chunk past every
    /// number a built cell names.
    pub fn alloc_words(&mut self, len: u32) -> Result<NewChunk<u32>, ArenaError> {
        let chunk = self.number(len)?;
        let mem = ChunkMem::zeroed(len as usize);
        let counts = count::CountTable::new(len);
        let meta = Arc::clone(counts.meta());
        self.chunks[chunk as usize] = Some(BuiltChunk::Words { mem: Arc::clone(&mem), counts });
        self.opened(0, chunk, len <= CHUNK_WORDS);
        Ok(NewChunk { chunk, mem, meta })
    }

    /// A new string chunk of `len` bytes, zeroed: its number, its memory
    /// and its meta, its cell count.
    ///
    /// # Errors
    ///
    /// As `alloc_words`.
    pub fn alloc_bytes(&mut self, len: u32) -> Result<NewChunk<u8>, ArenaError> {
        let chunk = self.number(len)?;
        let mem = ChunkMem::zeroed(len as usize);
        let meta = ChunkMem::zeroed(count::CELLS_META_BYTES);
        self.chunks[chunk as usize] = Some(BuiltChunk::Bytes { mem: Arc::clone(&mem), cells: Arc::clone(&meta) });
        self.opened(1, chunk, len <= STRING_CHUNK_BYTES);
        Ok(NewChunk { chunk, mem, meta })
    }

    fn number(&mut self, len: u32) -> Result<u32, ArenaError> {
        if self.released {
            return Err(ARENA_RELEASED);
        }
        if len == 0 || len > MOST_CHUNK_UNITS {
            return Err(ArenaError::Full);
        }
        match u32::try_from(self.chunks.len()).ok().filter(|&n| n < MAX_BUILT_CHUNKS) {
            Some(chunk) => {
                self.chunks.push(None);
                Ok(chunk)
            }
            None => self.free.pop_front().ok_or(ArenaError::Full),
        }
    }

    fn opened(&mut self, form: usize, chunk: u32, shared: bool) {
        if !shared {
            return;
        }
        if let Some(sealed) = self.open[form].replace(chunk) {
            self.seal_check(sealed);
        }
    }

    /// The numbers of the chunks freed since the last call, whose buffers
    /// are to be detached.
    pub fn take_freed(&mut self) -> Vec<u32> {
        std::mem::take(&mut self.freed)
    }

    /// The tree of each link record and side record released since the
    /// last call, once per record.
    pub fn take_trees(&mut self) -> Vec<TreeId> {
        std::mem::take(&mut self.trees)
    }

    /// Lets go of every chunk, and answers the bytes they took: a record of
    /// the arena renders no more. A buffer over a chunk keeps its memory
    /// until it is collected.
    pub fn release_all(&mut self) -> usize {
        self.released = true;
        let bytes = self.allocated_bytes();
        self.chunks.clear();
        self.overflow.clear();
        bytes
    }

    /// The bytes every chunk takes, its counts included.
    #[must_use]
    pub fn allocated_bytes(&self) -> usize {
        self.chunks.iter().flatten().map(BuiltChunk::byte_len).sum()
    }

    /// The bytes the chunks' counts take: their meta, the counts included.
    #[must_use]
    pub fn count_bytes(&self) -> usize {
        self.chunks
            .iter()
            .flatten()
            .map(|chunk| match chunk {
                BuiltChunk::Words { counts, .. } => counts.byte_len(),
                BuiltChunk::Bytes { cells, .. } => cells.byte_len(),
            })
            .sum()
    }

    /// The chunks, for one call to read.
    ///
    /// # Errors
    ///
    /// `ARENA_RELEASED` once released.
    pub fn readable(&self) -> Result<&Self, ArenaError> {
        if self.released { Err(ARENA_RELEASED) } else { Ok(self) }
    }
}

impl ArenaRead for BuiltChunks {
    fn chunk(&self, n: u32) -> Option<&[u32]> {
        match self.chunks.get(n as usize)? {
            // SAFETY: the store's shared borrow is held for the slice's life;
            // native code writes a built chunk only through the store's
            // mutable borrow (`BuiltWriter`), and a native call runs no
            // JavaScript.
            Some(BuiltChunk::Words { mem, .. }) => Some(unsafe { mem.slice() }),
            _ => None,
        }
    }

    fn string_chunk(&self, n: u32) -> Option<&[u8]> {
        match self.chunks.get(n as usize)? {
            // SAFETY: as `chunk`.
            Some(BuiltChunk::Bytes { mem, .. }) => Some(unsafe { mem.slice() }),
            _ => None,
        }
    }

    fn released(&self, at: Address) -> bool {
        match self.chunks.get(at.chunk() as usize) {
            Some(Some(BuiltChunk::Words { counts, .. })) => counts.peek(at.word()).is_ok_and(|byte| byte == 0),
            _ => false,
        }
    }

    fn freed(&self, n: u32) -> bool {
        n != 0 && matches!(self.chunks.get(n as usize), Some(None))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn borrowed_words_and_utf8_use_the_callers_storage() {
        let first = [0, 7, 11];
        let second = [13, 17];
        let text = "λ🦀".as_bytes();
        let chunks = [first.as_slice(), second.as_slice()];
        let strings = [text];
        let arena = BorrowedArena::new(&chunks, &strings).expect("addressable chunks");
        let at = Address::new(0, 1).expect("address");
        let read = arena.words(at, 2).expect("written words");
        assert_eq!(read, &[7, 11]);
        assert!(std::ptr::eq(read.as_ptr(), first[1..].as_ptr()));
        assert_eq!(arena.word(Address::new(1, 1).expect("address")).expect("word"), 17);
        let value = arena.text(StringRef { chunk: 0, byte: 0, len: 6 }).expect("utf8");
        assert_eq!(value, "λ🦀");
        assert!(std::ptr::eq(value.as_ptr(), text.as_ptr()));
    }

    #[test]
    fn borrowed_storage_checks_written_bounds_and_utf8_on_every_read() {
        let words = [0, 3];
        let invalid_utf8 = [0xff];
        let chunks = [words.as_slice()];
        let strings = [invalid_utf8.as_slice(), "λ".as_bytes()];
        let arena = BorrowedArena::new(&chunks, &strings).expect("addressable chunks");
        assert!(arena.words(Address::new(0, 1).expect("address"), 2).is_err());
        assert!(arena.words(Address::new(1, 0).expect("address"), 1).is_err());
        assert!(arena.words(Address::new(0, 1).expect("address"), u32::MAX).is_err());
        for at in [
            StringRef { chunk: 0, byte: 0, len: 1 },
            StringRef { chunk: 1, byte: 0, len: 1 },
            StringRef { chunk: 1, byte: 1, len: 1 },
            StringRef { chunk: 1, byte: u32::MAX, len: 2 },
            StringRef { chunk: 2, byte: 0, len: 0 },
        ] {
            assert!(arena.text(at).is_err(), "{at:?}");
        }
        let too_many = vec![&[][..]; MAX_CHUNKS as usize + 1];
        assert!(BorrowedArena::new(&too_many, &[]).is_err());
        assert!(BorrowedArena::new(&[], &too_many.iter().map(|_| &[][..]).collect::<Vec<&[u8]>>()).is_err());
    }

    #[test]
    fn the_first_record_never_takes_the_reserved_address() {
        let mut arena = Arena::new();
        let at = arena.alloc(3).expect("room");
        assert_ne!(at, Address::NONE);
        assert_eq!(Address::NONE.0, 0);
    }

    #[test]
    fn an_address_packs_its_chunk_and_word() {
        let at = Address::new(3, 17).expect("in range");
        assert_eq!((at.chunk(), at.word()), (3, 17));
        assert!(Address::new(MAX_CHUNKS, 0).is_none());
        assert!(Address::new(0, CHUNK_WORDS).is_none());
        assert_eq!(at.offset(2), Address::new(3, 19));
        assert!(Address::new(3, CHUNK_WORDS - 1).expect("in range").offset(1).is_none());
    }

    #[test]
    fn no_address_is_handed_out_twice() {
        let mut arena = Arena::new();
        let mut seen = std::collections::HashSet::new();
        for words in [1, 3, 700, 2, CHUNK_WORDS + 1, 5, CHUNK_WORDS / 2, 4] {
            for _ in 0..40 {
                let at = arena.alloc(words).expect("room");
                assert!(seen.insert(at), "{at:?} handed out again");
            }
        }
    }

    #[test]
    fn a_record_is_read_back_as_written() {
        let mut arena = Arena::new();
        let at = arena.push(&[7, 8, 9]).expect("room");
        assert_eq!(arena.words(at, 3).expect("its words"), &[7, 8, 9]);
        assert_eq!(arena.word(at.offset(2).expect("in range")), Ok(9));
    }

    #[test]
    fn no_record_straddles_a_chunk_and_a_chunk_never_moves() {
        let mut arena = Arena::new();
        let first = arena.alloc(4).expect("room");
        let before = arena.chunk(first.chunk()).expect("its chunk").as_ptr();
        let mut last = first;
        for _ in 0..2_000 {
            last = arena.alloc(5).expect("room");
            let written = u32::try_from(arena.chunk(last.chunk()).expect("its chunk").len()).expect("a chunk's length");
            assert!(last.word() + 5 <= written);
        }
        assert!(last.chunk() > first.chunk(), "the arena grew past its first chunk");
        assert_eq!(arena.chunk(first.chunk()).expect("its chunk").as_ptr(), before);
    }

    #[test]
    fn no_shared_chunk_writes_past_a_packed_word() {
        let mut arena = Arena::new();
        for _ in 0..3 {
            let at = arena.alloc(CHUNK_WORDS / 2).expect("room");
            assert!(at.word() + CHUNK_WORDS / 2 <= CHUNK_WORDS);
        }
    }

    #[test]
    fn a_read_past_what_was_written_is_refused() {
        let mut arena = Arena::new();
        let at = arena.alloc(2).expect("room");
        assert!(arena.words(at, 3).is_err());
        assert!(arena.word(Address::new(9, 0).expect("in range")).is_err());
        assert!(arena.words(Address::new(at.chunk(), CHUNK_WORDS - 1).expect("in range"), 4).is_err());
        assert!(arena.words(at, u32::MAX).is_err());
    }

    #[test]
    fn a_run_longer_than_a_chunk_gets_a_chunk_of_its_own() {
        let mut arena = Arena::new();
        let small = arena.alloc(3).expect("room");
        let long = CHUNK_WORDS + 7;
        let at = arena.alloc(long).expect("its own chunk");
        assert_eq!(at.word(), 0);
        assert_ne!(at.chunk(), small.chunk());
        assert_eq!(arena.chunk(at.chunk()).expect("its chunk").len(), long as usize);
        arena.words_mut(at, long).expect("its words")[long as usize - 1] = 5;
        assert_eq!(arena.words(at, long).expect("its words")[long as usize - 1], 5);
        let after = arena.alloc(2).expect("room");
        assert_ne!(after.chunk(), at.chunk(), "nothing shares an oversize run's chunk");
    }

    #[test]
    fn a_string_is_stored_once_and_read_back() {
        let mut arena = Arena::new();
        let first = arena.intern("héllo").expect("room");
        let again = arena.intern("héllo").expect("room");
        assert_eq!(first, again);
        assert_eq!(arena.text(first), Ok("héllo"));
        let other = arena.intern("").expect("room");
        assert_eq!(arena.text(other), Ok(""));
    }

    #[test]
    fn a_string_longer_than_a_string_chunk_gets_its_own() {
        let mut arena = Arena::new();
        let long = "x".repeat(STRING_CHUNK_BYTES as usize + 3);
        let at = arena.intern(&long).expect("room");
        assert_eq!(arena.text(at), Ok(long.as_str()));
        let short = arena.intern("y").expect("room");
        assert_eq!(arena.text(short), Ok("y"));
        assert_ne!(short.chunk, at.chunk, "nothing shares an oversize string's chunk");
    }

    #[test]
    fn every_string_packs_into_a_cell_offset() {
        let mut arena = Arena::new();
        let long = "z".repeat(STRING_CHUNK_BYTES as usize * 3);
        for text in ["a", long.as_str(), "b"] {
            let at = arena.intern(text).expect("room");
            let offset = at.offset().expect("a packed offset");
            assert_eq!(StringRef::from_offset(offset, at.len), at);
        }
    }

    #[test]
    fn a_string_reference_past_the_table_is_refused() {
        let arena = Arena::new();
        assert!(arena.text(StringRef { chunk: 4, byte: 0, len: 1 }).is_err());
        assert!(arena.text(StringRef { chunk: 0, byte: u32::MAX, len: 2 }).is_err());
    }
}
