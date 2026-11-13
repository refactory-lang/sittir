//! The native writer of a built arena: entries placed as JavaScript's
//! builders place them, in the chunks the store holds, each with its count.
//! The native record sink writes native nodes through it.

use std::sync::Arc;

use super::cell::{flag, with_kind, CellWord, ListCell, LINK_WORDS};
use super::count::OWNED;
use super::memory::{ChunkMem, ChunkUnit};
use super::{Address, ArenaError, BuiltChunks, CHUNK_WORDS, STRING_CHUNK_BYTES};
use crate::types::{KindId, NodeIndex, Span, TreeId};

/// The bytes of a leaf entry's head, its kind and its text's length.
const ENTRY_HEAD_BYTES: u32 = 4;

/// The chunk entries of one form are appended to.
struct Open<T: ChunkUnit> {
    chunk: u32,
    mem: Arc<ChunkMem<T>>,
    used: u32,
}

impl<T: ChunkUnit> Open<T> {
    fn fits(&self, len: u32) -> bool {
        self.used.checked_add(len).is_some_and(|end| end as usize <= self.mem.len())
    }
}

/// Writes a read's records into chunks of a built arena the read takes
/// whole: each entry reserved in the chunk the read has open, with a count
/// of one, and lent to be written in place. The builders' own open chunk is
/// left as it is.
pub struct ReadWriter<'a> {
    chunks: &'a mut BuiltChunks,
    /// The chunk the read has open, the words of it used, and its words.
    open: Option<(u32, u32, u32)>,
}

impl<'a> ReadWriter<'a> {
    /// A writer taking fresh chunks of `chunks`.
    pub fn new(chunks: &'a mut BuiltChunks) -> Self {
        Self { chunks, open: None }
    }
}

impl super::ArenaRead for ReadWriter<'_> {
    fn chunk(&self, n: u32) -> Option<&[u32]> {
        super::ArenaRead::chunk(&*self.chunks, n)
    }

    fn string_chunk(&self, n: u32) -> Option<&[u8]> {
        super::ArenaRead::string_chunk(&*self.chunks, n)
    }
}

impl super::RecordSpace for ReadWriter<'_> {
    fn kind_bits(&self) -> u32 {
        self.chunks.kind_bits
    }

    fn alloc(&mut self, words: u32) -> Result<Address, ArenaError> {
        let (chunk, used, len) = match self.open {
            Some((chunk, used, len)) if used.checked_add(words).is_some_and(|end| end <= len) => (chunk, used, len),
            _ => {
                let len = words.max(CHUNK_WORDS);
                (self.chunks.alloc_read_words(len)?, 0, len)
            }
        };
        let at = Address::new(chunk, used).ok_or(ArenaError::Full)?;
        self.open = Some((chunk, used + words, len));
        self.chunks.place(at, 1)?;
        Ok(at)
    }

    fn words_mut(&mut self, at: Address, len: u32) -> Result<&mut [u32], ArenaError> {
        let out = ArenaError::OutOfBounds { chunk: at.chunk(), word: at.word(), len };
        let mem = self.chunks.words_mem(at.chunk()).ok_or(out.clone())?;
        let (start, end) = (at.word() as usize, at.word() as usize + len as usize);
        if end > mem.len() {
            return Err(out);
        }
        // SAFETY: the writer holds the store's mutable borrow, so no other
        // slice of the chunk is live, and a native call runs no JavaScript.
        Ok(unsafe { &mut mem.slice_mut()[start..end] })
    }
}

/// Writes entries into a built arena's chunks: records, runs, side records
/// and link records into word chunks, leaf entries into string chunks.
pub struct BuiltWriter<'a> {
    chunks: &'a mut BuiltChunks,
    words: Option<Open<u32>>,
    bytes: Option<Open<u8>>,
}

impl<'a> BuiltWriter<'a> {
    /// A writer appending to fresh chunks of `chunks`.
    pub fn new(chunks: &'a mut BuiltChunks) -> Self {
        Self { chunks, words: None, bytes: None }
    }

    /// The header word of a record of `kind`, its flags `flags`.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a kind the arena's kind field does not hold.
    pub fn header(&self, kind: KindId, flags: u32) -> Result<u32, ArenaError> {
        let bits = self.chunks.kind_bits;
        Ok(with_kind(kind, bits)? | flags << bits)
    }

    /// `words` placed at a fresh address holding `count`.
    ///
    /// # Errors
    ///
    /// What the store refuses a new chunk for.
    pub fn place(&mut self, words: &[u32], count: u8) -> Result<Address, ArenaError> {
        let len = u32::try_from(words.len()).map_err(|_| ArenaError::Full)?;
        if !self.words.as_ref().is_some_and(|open| open.fits(len)) {
            let made = self.chunks.alloc_words(len.max(CHUNK_WORDS))?;
            self.words = Some(Open { chunk: made.chunk, mem: made.mem, used: 0 });
        }
        let open = self.words.as_mut().ok_or(ArenaError::Full)?;
        let word = open.used;
        open.used += len;
        // SAFETY: the writer holds the store's mutable borrow, so no slice of
        // the chunk is live, and a native call runs no JavaScript.
        let chunk = unsafe { open.mem.slice_mut() };
        chunk[word as usize..open.used as usize].copy_from_slice(words);
        let at = Address::new(open.chunk, word).ok_or(ArenaError::Full)?;
        self.chunks.place(at, count)?;
        Ok(at)
    }

    /// A record's words placed at a fresh address: held by its holder's
    /// cell, or, `owned`, by the handle its writer answers.
    ///
    /// # Errors
    ///
    /// As `place`.
    pub fn record(&mut self, words: &[u32], owned: bool) -> Result<Address, ArenaError> {
        self.place(words, if owned { OWNED | 1 } else { 1 })
    }

    /// The list cell of the run `[len, cells]`, held by the cell naming it;
    /// 0 for no items.
    ///
    /// # Errors
    ///
    /// As `place`.
    pub fn run(&mut self, cells: &[u32]) -> Result<CellWord, ArenaError> {
        if cells.is_empty() {
            return Ok(CellWord(0));
        }
        let mut words = Vec::with_capacity(cells.len() + 1);
        words.push(u32::try_from(cells.len()).map_err(|_| ArenaError::Full)?);
        words.extend_from_slice(cells);
        ListCell::word(self.place(&words, 1)?)
    }

    /// Holds the record at `at` once more, for a cell that names it, when a
    /// read left it: a built record names it as it names a built child.
    /// False, holding nothing, for any other address.
    ///
    /// # Errors
    ///
    /// What reaching the record's count refuses.
    pub fn hold_read(&mut self, at: Address) -> Result<bool, ArenaError> {
        if !super::ArenaRead::read_entry(&*self.chunks, at) {
            return Ok(false);
        }
        self.chunks.adopt(at)?;
        Ok(true)
    }

    /// The link record naming the parsed node of `kind` at `row` of `tree`,
    /// held by the cell naming it: its subtree's end, its record there and
    /// its byte span.
    ///
    /// # Errors
    ///
    /// As `header` and `place`.
    pub fn link(&mut self, kind: KindId, tree: TreeId, row: NodeIndex, end: NodeIndex, record: Address, span: Span) -> Result<Address, ArenaError> {
        let words = [self.header(kind, flag::LINK)?, 0, tree.0, row.0, end.0, record.0, span.start, span.end];
        debug_assert_eq!(words.len(), LINK_WORDS as usize);
        self.place(&words, 1)
    }

    /// The leaf entry of `kind` holding `text`, `[kind | len << bits]` then
    /// its UTF-8 bytes, held by the one cell naming it.
    ///
    /// # Errors
    ///
    /// `ArenaError::Full` for text past what an entry's length holds, and what
    /// the store refuses a new chunk for.
    pub fn entry(&mut self, kind: KindId, text: &str) -> Result<Address, ArenaError> {
        let bits = self.chunks.kind_bits;
        let len = u32::try_from(text.len()).ok().filter(|&len| len < 1 << (32 - bits)).ok_or(ArenaError::Full)?;
        let size = (ENTRY_HEAD_BYTES + len).next_multiple_of(4);
        if !self.bytes.as_ref().is_some_and(|open| open.fits(size)) {
            let made = self.chunks.alloc_bytes(size.max(STRING_CHUNK_BYTES))?;
            self.bytes = Some(Open { chunk: made.chunk, mem: made.mem, used: 0 });
        }
        let head = with_kind(kind, bits)? | len << bits;
        let open = self.bytes.as_mut().ok_or(ArenaError::Full)?;
        let byte = open.used;
        open.used += size;
        // SAFETY: as `place`.
        let chunk = unsafe { open.mem.slice_mut() };
        let start = byte as usize;
        chunk[start..start + ENTRY_HEAD_BYTES as usize].copy_from_slice(&head.to_ne_bytes());
        chunk[start + ENTRY_HEAD_BYTES as usize..start + (ENTRY_HEAD_BYTES + len) as usize].copy_from_slice(text.as_bytes());
        let at = Address::new(open.chunk, byte).ok_or(ArenaError::Full)?;
        self.chunks.hold_text(at)?;
        Ok(at)
    }
}
