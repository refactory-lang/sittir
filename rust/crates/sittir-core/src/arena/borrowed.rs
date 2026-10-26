use super::{word_range, Address, ArenaError, StringRef, MAX_CHUNKS};
use crate::record::HEADER_WORDS;
use crate::types::KindId;

/// Bounds-checked reads shared by native-owned and call-borrowed arena storage.
pub trait ArenaRead {
    /// The written words in chunk `n`.
    fn chunk(&self, n: u32) -> Option<&[u32]>;

    /// The written UTF-8 bytes in string chunk `n`.
    fn string_chunk(&self, n: u32) -> Option<&[u8]>;

    /// The `len` written words at `at`, within one chunk.
    fn words(&self, at: Address, len: u32) -> Result<&[u32], ArenaError> {
        let words = self.chunk(at.chunk()).ok_or(ArenaError::OutOfBounds { chunk: at.chunk(), word: at.word(), len })?;
        Ok(&words[word_range(at, len, words.len())?])
    }

    /// The written word at `at`.
    fn word(&self, at: Address) -> Result<u32, ArenaError> {
        self.words(at, 1).map(|words| words[0])
    }

    /// The kind the header of the record at `at` names. Refuses address 0,
    /// which names no record, a header past the written words, and a kind
    /// word wider than a kind.
    fn header_kind(&self, at: Address) -> Result<KindId, ArenaError> {
        let word = self.words(at.record()?, HEADER_WORDS)?[0];
        u16::try_from(word).map(KindId).map_err(|_| ArenaError::Malformed { what: "record kind", word })
    }

    /// A string reference checked for bounds and UTF-8 on this read.
    fn text(&self, at: StringRef) -> Result<&str, ArenaError> {
        let refused = || ArenaError::BadString(at);
        let bytes = self.string_chunk(at.chunk).ok_or_else(refused)?;
        let end = at.byte.checked_add(at.len).ok_or_else(refused)?;
        let slice = bytes.get(at.byte as usize..end as usize).ok_or_else(refused)?;
        std::str::from_utf8(slice).map_err(|_| refused())
    }
}

/// Record and string chunks borrowed for one synchronous call. The owner must
/// exclude concurrent writes while these slices are borrowed.
#[derive(Debug, Clone, Copy)]
pub struct BorrowedArena<'a> {
    chunks: &'a [&'a [u32]],
    strings: &'a [&'a [u8]],
}

impl<'a> BorrowedArena<'a> {
    /// Borrow addressable chunk tables without copying their payloads.
    pub fn new(chunks: &'a [&'a [u32]], strings: &'a [&'a [u8]]) -> Result<Self, ArenaError> {
        if chunks.len() > MAX_CHUNKS as usize || strings.len() > MAX_CHUNKS as usize {
            return Err(ArenaError::Full);
        }
        Ok(Self { chunks, strings })
    }
}

impl ArenaRead for BorrowedArena<'_> {
    fn chunk(&self, n: u32) -> Option<&[u32]> {
        self.chunks.get(n as usize).copied()
    }

    fn string_chunk(&self, n: u32) -> Option<&[u8]> {
        self.strings.get(n as usize).copied()
    }
}
