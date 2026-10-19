//! Arena storage for records: fixed chunks of `u32` words that never move,
//! and a string table of UTF-8 bytes in chunks that never move either.
//!
//! [`cell`] encodes and decodes one slot's cell, [`side`] a record's side
//! record, and [`rows`] keeps a parsed tree's arena with its row index. The
//! record writer (`write_record`) writes a native node's records, children
//! before parents. A built record's trivia is outside the arena, in the
//! engine's store of written sides (`trivia_store`), and what a render's
//! prepare fills is in its overlay (`Prepared`).
//!
//! An arena only appends: no record is freed or moved, so an address names
//! one record for as long as the arena lives.

pub mod cell;
mod prepared;
pub mod rows;
mod view;
pub mod side;
mod write;

use std::collections::HashMap;
use std::fmt;

pub use cell::{Cell, ListCell, ParsedLink};
pub use prepared::{Prepared, PreparedNode, PreparedSlot};
pub use view::{RecordArenas, RecordCtx, RecordItems, RecordSlot, RecordView};
pub use write::{LayoutField, Link, Linked, RecordSink, WriteCell, capture_spans, captured_cell, coordinate_cell, leaf_cell, write_list, write_record};
pub use rows::TreeArena;
pub use side::{SideRecord, SideSlot, Sides};

/// A native node type's view over its records: a struct's is its
/// `…Record<'a>`, a choice's an enum over its variants' views, chosen by the
/// cell's kind. A cell's accessor names a child's view through the child's
/// native type, `<T as HasRecord>::Record<'a>`.
pub trait HasRecord {
    type Record<'a>
    where
        Self: 'a;
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

/// The words a shared chunk holds at most, and the bound on a word's index
/// within a packed address.
pub const CHUNK_WORDS: u32 = 1 << 20;
/// The chunks an arena holds at most: the bound a packed address leaves.
pub const MAX_CHUNKS: u32 = 1 << 12;
/// The words of an arena's first chunk; each later shared chunk doubles it,
/// up to `CHUNK_WORDS`.
const FIRST_CHUNK_WORDS: u32 = 1 << 10;
/// The bytes a shared string chunk holds; a longer string gets its own.
pub const STRING_CHUNK_BYTES: u32 = 1 << 16;
/// The bits of a packed address or string offset below its chunk.
const CHUNK_SHIFT: u32 = 20;

/// A record's or run's place in an arena: its chunk and its first word,
/// packed as `chunk << 20 | word`. Address 0 is no record.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct Address(pub u32);

impl Address {
    pub const NONE: Address = Address(0);

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
    /// `chunk << 20 | byte`. `None` when either is past what the packing holds.
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
    /// The arena holds `MAX_CHUNKS` chunks already.
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
}

impl fmt::Display for ArenaError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ArenaError::Full => write!(f, "the arena holds its {MAX_CHUNKS} chunks"),
            ArenaError::OutOfBounds { chunk, word, len } => {
                write!(f, "words {word}..{} of chunk {chunk} are past what the arena wrote", u64::from(*word) + u64::from(*len))
            }
            ArenaError::BadString(at) => {
                write!(f, "bytes {}..{} of string chunk {} are not a string the arena wrote", at.byte, u64::from(at.byte) + u64::from(at.len), at.chunk)
            }
            ArenaError::Malformed { what, word } => write!(f, "{what} {word} is not one a record writer writes"),
            ArenaError::UnknownSlot(key) => write!(f, "the layout names slot `{key}`, which has no stamped cell in its record"),
            ArenaError::Unwritable(what) => write!(f, "a record writer does not write {what}"),
        }
    }
}

impl std::error::Error for ArenaError {}

/// A chunk and the words it may hold: its storage is reserved for them up
/// front, so writing up to the limit never moves it.
#[derive(Debug)]
struct Chunk<T> {
    data: Vec<T>,
    limit: u32,
}

impl<T: Clone + Default> Chunk<T> {
    fn with_limit(limit: u32) -> Self {
        Self { data: Vec::with_capacity(limit as usize), limit }
    }

    #[allow(clippy::cast_possible_truncation, reason = "a chunk holds at most its u32 limit")]
    fn len(&self) -> u32 {
        self.data.len() as u32
    }

    fn room(&self) -> u32 {
        self.limit - self.len()
    }
}

/// The index of the next chunk of `chunks`, while it stays below `MAX_CHUNKS`.
fn next_chunk<T>(chunks: &[Chunk<T>]) -> Result<u32, ArenaError> {
    u32::try_from(chunks.len()).ok().filter(|&n| n < MAX_CHUNKS).ok_or(ArenaError::Full)
}

/// One arena: word chunks for records and runs, and the string table.
#[derive(Debug)]
pub struct Arena {
    chunks: Vec<Chunk<u32>>,
    /// The shared chunk records are appended to; an oversize run's chunk is
    /// never it.
    open: u32,
    strings: Vec<Chunk<u8>>,
    interned: HashMap<Box<str>, StringRef>,
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
        let mut first = Chunk::with_limit(FIRST_CHUNK_WORDS);
        first.data.push(0);
        Self { chunks: vec![first], open: 0, strings: Vec::new(), interned: HashMap::new() }
    }

    /// `words` zeroed words, contiguous in one chunk, and their address.
    pub fn alloc(&mut self, words: u32) -> Result<Address, ArenaError> {
        if words > CHUNK_WORDS {
            let chunk = next_chunk(&self.chunks)?;
            let mut own = Chunk::with_limit(words);
            own.data.resize(words as usize, 0);
            self.chunks.push(own);
            return Ok(Address(chunk << CHUNK_SHIFT));
        }
        let open = &self.chunks[self.open as usize];
        if open.room() < words {
            let limit = open.limit.saturating_mul(2).clamp(FIRST_CHUNK_WORDS, CHUNK_WORDS).max(words);
            let chunk = next_chunk(&self.chunks)?;
            self.chunks.push(Chunk::with_limit(limit));
            self.open = chunk;
        }
        let chunk = &mut self.chunks[self.open as usize];
        let word = chunk.len();
        chunk.data.resize(chunk.data.len() + words as usize, 0);
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
        let (chunk, word) = (at.chunk(), at.word());
        let refused = || ArenaError::OutOfBounds { chunk, word, len };
        let written = self.chunks.get(chunk as usize).ok_or_else(refused)?.len();
        let end = word.checked_add(len).filter(|&end| end <= written).ok_or_else(refused)?;
        Ok((chunk as usize, word as usize..end as usize))
    }

    /// The `len` words at `at`, all of them written.
    pub fn words(&self, at: Address, len: u32) -> Result<&[u32], ArenaError> {
        let (chunk, range) = self.range(at, len)?;
        Ok(&self.chunks[chunk].data[range])
    }

    pub fn words_mut(&mut self, at: Address, len: u32) -> Result<&mut [u32], ArenaError> {
        let (chunk, range) = self.range(at, len)?;
        Ok(&mut self.chunks[chunk].data[range])
    }

    pub fn word(&self, at: Address) -> Result<u32, ArenaError> {
        self.words(at, 1).map(|words| words[0])
    }

    /// Chunk `n`'s written words.
    #[must_use]
    pub fn chunk(&self, n: u32) -> Option<&[u32]> {
        self.chunks.get(n as usize).map(|chunk| chunk.data.as_slice())
    }

    /// `text` in the string table, written once however often it is stored.
    pub fn intern(&mut self, text: &str) -> Result<StringRef, ArenaError> {
        if let Some(&at) = self.interned.get(text) {
            return Ok(at);
        }
        let len = u32::try_from(text.len()).map_err(|_| ArenaError::Full)?;
        let shared = len <= STRING_CHUNK_BYTES;
        let chunk = match self.strings.last() {
            Some(last) if shared && last.limit == STRING_CHUNK_BYTES && last.room() >= len => next_chunk(&self.strings)? - 1,
            _ => {
                let chunk = next_chunk(&self.strings)?;
                self.strings.push(Chunk::with_limit(if shared { STRING_CHUNK_BYTES } else { len }));
                chunk
            }
        };
        let bytes = &mut self.strings[chunk as usize];
        let at = StringRef { chunk, byte: bytes.len(), len };
        bytes.data.extend_from_slice(text.as_bytes());
        self.interned.insert(text.into(), at);
        Ok(at)
    }

    /// The string at `at`.
    pub fn text(&self, at: StringRef) -> Result<&str, ArenaError> {
        let refused = || ArenaError::BadString(at);
        let bytes = &self.strings.get(at.chunk as usize).ok_or_else(refused)?.data;
        let end = at.byte.checked_add(at.len).ok_or_else(refused)?;
        let slice = bytes.get(at.byte as usize..end as usize).ok_or_else(refused)?;
        std::str::from_utf8(slice).map_err(|_| refused())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

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
