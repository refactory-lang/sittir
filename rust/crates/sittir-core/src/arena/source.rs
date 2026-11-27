//! A read's source text in a built arena's string chunks: one whole string
//! an entry. An entry is `[len][found][read]` then the text's bytes padded
//! to a word: `found`'s top bit is whether the source spells every line
//! break `\n`, and the bit below it is set in every entry a writer wrote, so
//! zeroed bytes hold none; `read` is the address of the read's own side
//! record, holding its spans and entry starts (`SideRecord::spans`,
//! `SideRecord::starts`), 0 for none, which its read names once it has
//! placed every side (`name_read_side`).
//! An entry names no record: a source's nodes are found from a record that
//! names the entry.
//! Small sources share a chunk the arena keeps open for them; a source too
//! long for one takes a chunk of its own. A record names its source by its
//! entry's address.

use super::{Address, ArenaError, ArenaRead, BuiltChunk, BuiltChunks, ChunkMem, STRING_CHUNK_BYTES};

const HEAD_BYTES: u32 = 12;
const READ_SIDE_BYTE: usize = 8;
const BREAKS_LF: u32 = 1 << 31;
const WRITTEN: u32 = 1 << 30;

fn malformed(what: &'static str, at: Address) -> ArenaError {
    ArenaError::Malformed { what, word: at.0 }
}

fn padded(len: u32) -> u32 {
    len.next_multiple_of(4)
}

/// A source as its entry holds it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Source<'a> {
    pub text: &'a str,
    pub breaks_lf: bool,
}

struct Words<'a> {
    bytes: &'a [u8],
    at: Address,
}

impl<'a> Words<'a> {
    fn take(&mut self, len: usize) -> Result<&'a [u8], ArenaError> {
        let (taken, rest) = self.bytes.split_at_checked(len).ok_or(malformed("source entry", self.at))?;
        self.bytes = rest;
        Ok(taken)
    }

    fn word(&mut self) -> Result<u32, ArenaError> {
        let bytes = self.take(4)?;
        Ok(u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]))
    }
}

impl<'a> Source<'a> {
    /// The source whose entry is at `at` in `arena`.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for an address no source entry is at, or an
    /// entry no writer writes.
    pub fn read(arena: &'a dyn ArenaRead, at: Address) -> Result<Source<'a>, ArenaError> {
        let chunk = arena.string_chunk(at.chunk()).ok_or(malformed("source chunk", at))?;
        let mut words = Words { bytes: chunk.get(at.word() as usize..).ok_or(malformed("source entry", at))?, at };
        let (len, found, _) = (words.word()?, words.word()?, words.word()?);
        if found & !BREAKS_LF != WRITTEN {
            return Err(malformed("source entry", at));
        }
        let text = std::str::from_utf8(&words.take(padded(len) as usize)?[..len as usize]).map_err(|_| malformed("source text", at))?;
        Ok(Source { text, breaks_lf: found & BREAKS_LF != 0 })
    }

    /// The own side record of the read whose source's entry is at `at`;
    /// none for a read that names none.
    ///
    /// # Errors
    ///
    /// As `read`.
    pub fn read_side_of(arena: &dyn ArenaRead, at: Address) -> Result<Option<Address>, ArenaError> {
        let chunk = arena.string_chunk(at.chunk()).ok_or(malformed("source chunk", at))?;
        let mut words = Words { bytes: chunk.get(at.word() as usize..).ok_or(malformed("source entry", at))?, at };
        let (_, found, read) = (words.word()?, words.word()?, words.word()?);
        if found & !BREAKS_LF != WRITTEN {
            return Err(malformed("source entry", at));
        }
        Ok((read != 0).then_some(Address(read)))
    }
}

impl BuiltChunks {
    fn bytes_mem(&self, chunk: u32) -> Option<&ChunkMem<u8>> {
        match self.chunks.get(chunk as usize) {
            Some(Some(BuiltChunk::Bytes { mem, .. })) => Some(mem),
            _ => None,
        }
    }

    /// Writes `source` as one entry and answers its address: in the chunk
    /// the arena keeps open for sources when it fits there, else in a chunk
    /// of its own. The chunk the builders write is left as it is.
    ///
    /// # Errors
    ///
    /// `ArenaError::Full` for a source past what a chunk holds, and what the
    /// arena refuses a new chunk for.
    pub fn write_source(&mut self, source: &Source<'_>) -> Result<Address, ArenaError> {
        let len = u32::try_from(source.text.len()).map_err(|_| ArenaError::Full)?;
        let size = HEAD_BYTES.checked_add(padded(len)).ok_or(ArenaError::Full)?;
        let (chunk, byte) = match self.sources {
            _ if size > STRING_CHUNK_BYTES => (self.alloc_read_bytes(size)?, 0),
            Some((chunk, used)) if used + size <= STRING_CHUNK_BYTES => {
                self.sources = Some((chunk, used + size));
                (chunk, used)
            }
            _ => {
                let chunk = self.alloc_read_bytes(STRING_CHUNK_BYTES)?;
                self.sources = Some((chunk, size));
                (chunk, 0)
            }
        };
        let at = Address::new(chunk, byte).ok_or(ArenaError::Full)?;
        self.hold_text(at)?;
        let mem = self.bytes_mem(chunk).ok_or(ArenaError::Full)?;
        // SAFETY: the arena's mutable borrow is held, so no other slice of
        // the chunk is live, and a native call runs no JavaScript.
        let out = unsafe { &mut mem.slice_mut()[byte as usize..(byte + size) as usize] };
        out[..4].copy_from_slice(&len.to_le_bytes());
        out[4..8].copy_from_slice(&(WRITTEN | if source.breaks_lf { BREAKS_LF } else { 0 }).to_le_bytes());
        out[8..12].copy_from_slice(&0u32.to_le_bytes());
        let text = HEAD_BYTES as usize;
        out[text..text + len as usize].copy_from_slice(source.text.as_bytes());
        Ok(at)
    }

    /// Names the side record at `read` as the own side record of the read
    /// whose source's entry is at `source` (`Source::read_side_of`).
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for an address no source entry is at.
    pub fn name_read_side(&mut self, source: Address, read: Address) -> Result<(), ArenaError> {
        Source::read(self, source)?;
        let mem = self.bytes_mem(source.chunk()).ok_or(malformed("source chunk", source))?;
        let byte = source.word() as usize + READ_SIDE_BYTE;
        // SAFETY: as `write_source`.
        let out = unsafe { &mut mem.slice_mut()[byte..byte + 4] };
        out.copy_from_slice(&read.0.to_le_bytes());
        Ok(())
    }

    fn alloc_read_bytes(&mut self, len: u32) -> Result<u32, ArenaError> {
        let chunk = self.number(len)?;
        self.put(chunk, BuiltChunk::Bytes { mem: ChunkMem::zeroed(len as usize), cells: ChunkMem::zeroed(super::count::CELLS_META_BYTES) });
        Ok(chunk)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn chunks() -> BuiltChunks {
        BuiltChunks::new(crate::record::PARSED_KIND_BITS, |_| None)
    }

    #[test]
    fn a_source_reads_back_as_written_and_small_sources_share_a_chunk() {
        let mut arena = chunks();
        let plain = Source { text: "fn f() {}\n", breaks_lf: true };
        let found = Source { text: "a\r\n\tb é", breaks_lf: false };
        let (first, second) = (arena.write_source(&plain).expect("room"), arena.write_source(&found).expect("room"));
        assert_eq!(first.chunk(), second.chunk(), "two small sources share a chunk");
        assert_ne!(first, second);
        assert_eq!(Source::read(&arena, first), Ok(plain));
        assert_eq!(Source::read(&arena, second), Ok(found));
    }

    #[test]
    fn a_source_too_long_for_a_shared_chunk_takes_its_own() {
        let mut arena = chunks();
        let small = Source { text: "x", breaks_lf: true };
        let text = "y".repeat(STRING_CHUNK_BYTES as usize);
        let long = Source { text: &text, breaks_lf: true };
        let (first, own, after) = (arena.write_source(&small).expect("room"), arena.write_source(&long).expect("room"), arena.write_source(&small).expect("room"));
        assert_ne!(own.chunk(), first.chunk());
        assert_eq!(own.word(), 0);
        assert_eq!(after.chunk(), first.chunk(), "the shared chunk stays open past a long source");
        assert_eq!(Source::read(&arena, own).map(|source| source.text.len()), Ok(text.len()));
    }

    #[test]
    fn a_source_is_written_after_the_last_one_of_the_open_chunk_is_released() {
        let mut arena = chunks();
        let source = Source { text: "fn f() {}\n", breaks_lf: true };
        let first = arena.write_source(&source).expect("room");
        arena.release(crate::arena::count::Held::Text(first), false).expect("the source's one count");
        let second = arena.write_source(&source).expect("a chunk to write in");
        assert_eq!(Source::read(&arena, second), Ok(source));
    }

    #[test]
    fn an_address_no_source_is_at_is_refused() {
        let mut arena = chunks();
        let at = arena.write_source(&Source { text: "x", breaks_lf: true }).expect("room");
        assert!(Source::read(&arena, Address::new(at.chunk() + 1, 0).expect("an address")).is_err());
        assert!(Source::read(&arena, Address::new(at.chunk(), STRING_CHUNK_BYTES - 8).expect("an address")).is_err(), "zeroed bytes hold no entry");
    }
}
