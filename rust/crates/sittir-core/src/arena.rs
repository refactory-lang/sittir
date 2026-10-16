//! Arena storage for records: fixed chunks of `u32` words that never move,
//! and a string table of UTF-8 bytes in chunks that never move either.

use std::collections::HashMap;
use std::fmt;

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

/// A record's or run's place in an arena: its chunk and its first word,
/// packed as `chunk << 20 | word`. Address 0 is no record.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct Address(pub u32);

impl Address {
    pub const NONE: Address = Address(0);

    pub fn new(chunk: u32, word: u32) -> Option<Address> {
        (chunk < MAX_CHUNKS && word < CHUNK_WORDS).then_some(Address(chunk << 20 | word))
    }

    pub fn chunk(self) -> u32 {
        self.0 >> 20
    }

    pub fn word(self) -> u32 {
        self.0 & (CHUNK_WORDS - 1)
    }
}

/// A string in the arena's table: its chunk, its first byte and its length.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct StringRef {
    pub chunk: u32,
    pub byte: u32,
    pub len: u32,
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
        }
    }
}

impl std::error::Error for ArenaError {}

/// One arena: word chunks for records and runs, and the string table.
#[derive(Debug)]
pub struct Arena {
    chunks: Vec<Vec<u32>>,
    /// The shared chunk records are appended to; an oversize run's chunk is
    /// never it.
    open: usize,
    strings: Vec<Vec<u8>>,
    interned: HashMap<Box<str>, StringRef>,
}

impl Default for Arena {
    fn default() -> Self {
        Self::new()
    }
}

impl Arena {
    /// An arena whose first word is reserved, so no record is at `Address::NONE`.
    pub fn new() -> Self {
        let mut first = Vec::with_capacity(FIRST_CHUNK_WORDS as usize);
        first.push(0);
        Self { chunks: vec![first], open: 0, strings: Vec::new(), interned: HashMap::new() }
    }

    /// `words` zeroed words, contiguous in one chunk, and their address.
    pub fn alloc(&mut self, words: u32) -> Result<Address, ArenaError> {
        if words > CHUNK_WORDS {
            let chunk = self.push_chunk(vec![0; words as usize])?;
            return Ok(Address(chunk << 20));
        }
        let open = &self.chunks[self.open];
        if open.len() + words as usize > open.capacity() {
            let capacity = (open.capacity() as u32).saturating_mul(2).clamp(FIRST_CHUNK_WORDS, CHUNK_WORDS).max(words);
            let chunk = self.push_chunk(Vec::with_capacity(capacity as usize))?;
            self.open = chunk as usize;
        }
        let chunk = &mut self.chunks[self.open];
        let word = chunk.len() as u32;
        chunk.resize(chunk.len() + words as usize, 0);
        Ok(Address((self.open as u32) << 20 | word))
    }

    fn push_chunk(&mut self, chunk: Vec<u32>) -> Result<u32, ArenaError> {
        let n = self.chunks.len() as u32;
        if n >= MAX_CHUNKS {
            return Err(ArenaError::Full);
        }
        self.chunks.push(chunk);
        Ok(n)
    }

    fn range(&self, at: Address, len: u32) -> Result<(usize, std::ops::Range<usize>), ArenaError> {
        let (chunk, word) = (at.chunk(), at.word());
        let refused = ArenaError::OutOfBounds { chunk, word, len };
        let written = self.chunks.get(chunk as usize).ok_or(refused.clone())?.len();
        let end = (word as usize).checked_add(len as usize).ok_or(refused.clone())?;
        if end > written {
            return Err(refused);
        }
        Ok((chunk as usize, word as usize..end))
    }

    /// The `len` words at `at`, all of them written.
    pub fn words(&self, at: Address, len: u32) -> Result<&[u32], ArenaError> {
        let (chunk, range) = self.range(at, len)?;
        Ok(&self.chunks[chunk][range])
    }

    pub fn words_mut(&mut self, at: Address, len: u32) -> Result<&mut [u32], ArenaError> {
        let (chunk, range) = self.range(at, len)?;
        Ok(&mut self.chunks[chunk][range])
    }

    pub fn word(&self, at: Address) -> Result<u32, ArenaError> {
        self.words(at, 1).map(|words| words[0])
    }

    /// Chunk `n`'s written words.
    pub fn chunk(&self, n: u32) -> Option<&[u32]> {
        self.chunks.get(n as usize).map(Vec::as_slice)
    }

    /// `text` in the string table, written once however often it is stored.
    pub fn intern(&mut self, text: &str) -> Result<StringRef, ArenaError> {
        if let Some(&at) = self.interned.get(text) {
            return Ok(at);
        }
        let len = u32::try_from(text.len()).map_err(|_| ArenaError::Full)?;
        let fits = |chunk: &Vec<u8>| chunk.len() + text.len() <= chunk.capacity();
        let chunk = match self.strings.last() {
            Some(last) if len <= STRING_CHUNK_BYTES && fits(last) => self.strings.len() - 1,
            _ => {
                if self.strings.len() as u32 >= MAX_CHUNKS {
                    return Err(ArenaError::Full);
                }
                self.strings.push(Vec::with_capacity(len.max(STRING_CHUNK_BYTES) as usize));
                self.strings.len() - 1
            }
        };
        let bytes = &mut self.strings[chunk];
        let at = StringRef { chunk: chunk as u32, byte: bytes.len() as u32, len };
        bytes.extend_from_slice(text.as_bytes());
        self.interned.insert(text.into(), at);
        Ok(at)
    }

    /// The string at `at`.
    pub fn text(&self, at: StringRef) -> Result<&str, ArenaError> {
        let bytes = self.strings.get(at.chunk as usize).ok_or(ArenaError::BadString(at))?;
        let end = (at.byte as usize).checked_add(at.len as usize).ok_or(ArenaError::BadString(at))?;
        let slice = bytes.get(at.byte as usize..end).ok_or(ArenaError::BadString(at))?;
        std::str::from_utf8(slice).map_err(|_| ArenaError::BadString(at))
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
    }

    #[test]
    fn a_record_is_read_back_as_written() {
        let mut arena = Arena::new();
        let at = arena.alloc(3).expect("room");
        arena.words_mut(at, 3).expect("its words").copy_from_slice(&[7, 8, 9]);
        assert_eq!(arena.words(at, 3).expect("its words"), &[7, 8, 9]);
        assert_eq!(arena.word(Address::new(at.chunk(), at.word() + 2).expect("in range")), Ok(9));
    }

    #[test]
    fn no_record_straddles_a_chunk_and_a_chunk_never_moves() {
        let mut arena = Arena::new();
        let first = arena.alloc(4).expect("room");
        let before = arena.chunk(first.chunk()).expect("its chunk").as_ptr();
        let mut last = first;
        for _ in 0..2_000 {
            last = arena.alloc(5).expect("room");
            assert!(last.word() + 5 <= arena.chunk(last.chunk()).expect("its chunk").len() as u32);
        }
        assert!(last.chunk() > first.chunk(), "the arena grew past its first chunk");
        assert_eq!(arena.chunk(first.chunk()).expect("its chunk").as_ptr(), before);
    }

    #[test]
    fn a_read_past_what_was_written_is_refused() {
        let mut arena = Arena::new();
        let at = arena.alloc(2).expect("room");
        assert!(arena.words(at, 3).is_err());
        assert!(arena.word(Address::new(9, 0).expect("in range")).is_err());
        assert!(arena.words(Address::new(at.chunk(), CHUNK_WORDS - 1).expect("in range"), 4).is_err());
    }

    #[test]
    fn a_run_longer_than_a_chunk_gets_a_chunk_of_its_own() {
        let mut arena = Arena::new();
        let small = arena.alloc(3).expect("room");
        let long = CHUNK_WORDS + 7;
        let at = arena.alloc(long).expect("its own chunk");
        assert_eq!(at.word(), 0);
        assert_ne!(at.chunk(), small.chunk());
        assert_eq!(arena.chunk(at.chunk()).expect("its chunk").len() as u32, long);
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
    }

    #[test]
    fn a_string_reference_past_the_table_is_refused() {
        let arena = Arena::new();
        assert!(arena.text(StringRef { chunk: 4, byte: 0, len: 1 }).is_err());
    }
}
