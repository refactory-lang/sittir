//! A read's source text in a built arena's string chunks: one whole string
//! an entry, with what the read found of the source beside it. An entry is
//! `[len][found]`, the text's bytes padded to a word, then what the read
//! inferred of the render options: `found` holds the bytes of that after the
//! text, and its top bit whether the source spells every line break `\n`.
//! An entry names no record: a source's nodes are found from a record that
//! names the entry.
//! Small sources share a chunk the arena keeps open for them; a source too
//! long for one takes a chunk of its own. A record names its source by its
//! entry's address.

use super::{Address, ArenaError, ArenaRead, BuiltChunk, BuiltChunks, ChunkMem, STRING_CHUNK_BYTES};
use crate::options::InferredOptions;
use crate::types::{KindId, SiteId};

const HEAD_BYTES: u32 = 8;
const BREAKS_LF: u32 = 1 << 31;

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
    pub inferred: InferredOptions,
}

fn inferred_bytes(inferred: &InferredOptions) -> Vec<u8> {
    let mut out = Vec::new();
    let word = |out: &mut Vec<u8>, word: u32| out.extend_from_slice(&word.to_le_bytes());
    match &inferred.indent {
        Some(indent) => {
            word(&mut out, crate::types::narrow(indent.len()) + 1);
            out.extend_from_slice(indent.as_bytes());
            out.resize(out.len().next_multiple_of(4), 0);
        }
        None => word(&mut out, 0),
    }
    word(&mut out, crate::types::narrow(inferred.edges.len()));
    for &(site, kind) in &inferred.edges {
        word(&mut out, u32::from(site.0));
        word(&mut out, u32::from(kind.0));
    }
    out
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
        let (len, found) = (words.word()?, words.word()?);
        let text = std::str::from_utf8(&words.take(padded(len) as usize)?[..len as usize]).map_err(|_| malformed("source text", at))?;
        let mut words = Words { bytes: words.take((found & !BREAKS_LF) as usize)?, at };
        let indent = match words.word()? {
            0 => None,
            held => {
                let len = held - 1;
                Some(std::str::from_utf8(&words.take(padded(len) as usize)?[..len as usize]).map_err(|_| malformed("source indent", at))?.to_owned())
            }
        };
        let edges = (0..words.word()?)
            .map(|_| {
                let (site, kind) = (words.word()?, words.word()?);
                let narrow = |word: u32| u16::try_from(word).map_err(|_| malformed("source edge", at));
                Ok((SiteId(narrow(site)?), KindId(narrow(kind)?)))
            })
            .collect::<Result<_, ArenaError>>()?;
        Ok(Source { text, breaks_lf: found & BREAKS_LF != 0, inferred: InferredOptions { indent, edges } })
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
        let inferred = inferred_bytes(&source.inferred);
        let len = u32::try_from(source.text.len()).map_err(|_| ArenaError::Full)?;
        let found = u32::try_from(inferred.len()).ok().filter(|found| found & BREAKS_LF == 0).ok_or(ArenaError::Full)?;
        let size = HEAD_BYTES.checked_add(padded(len)).and_then(|size| size.checked_add(found)).ok_or(ArenaError::Full)?;
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
        out[4..8].copy_from_slice(&(found | if source.breaks_lf { BREAKS_LF } else { 0 }).to_le_bytes());
        let text = HEAD_BYTES as usize;
        out[text..text + len as usize].copy_from_slice(source.text.as_bytes());
        out[(HEAD_BYTES + padded(len)) as usize..].copy_from_slice(&inferred);
        Ok(at)
    }

    fn alloc_read_bytes(&mut self, len: u32) -> Result<u32, ArenaError> {
        let chunk = self.number(len)?;
        self.chunks[chunk as usize] = Some(BuiltChunk::Bytes { mem: ChunkMem::zeroed(len as usize), cells: ChunkMem::zeroed(super::count::CELLS_META_BYTES) });
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
        let plain = Source { text: "fn f() {}\n", breaks_lf: true, inferred: InferredOptions::default() };
        let found = Source { text: "a\r\n\tb é", breaks_lf: false, inferred: InferredOptions { indent: Some("\t".to_owned()), edges: vec![(SiteId(3), KindId(40)), (SiteId(9), KindId::BLANK)] } };
        let (first, second) = (arena.write_source(&plain).expect("room"), arena.write_source(&found).expect("room"));
        assert_eq!(first.chunk(), second.chunk(), "two small sources share a chunk");
        assert_ne!(first, second);
        assert_eq!(Source::read(&arena, first), Ok(plain));
        assert_eq!(Source::read(&arena, second), Ok(found));
    }

    #[test]
    fn a_source_too_long_for_a_shared_chunk_takes_its_own() {
        let mut arena = chunks();
        let small = Source { text: "x", breaks_lf: true, inferred: InferredOptions::default() };
        let text = "y".repeat(STRING_CHUNK_BYTES as usize);
        let long = Source { text: &text, breaks_lf: true, inferred: InferredOptions::default() };
        let (first, own, after) = (arena.write_source(&small).expect("room"), arena.write_source(&long).expect("room"), arena.write_source(&small).expect("room"));
        assert_ne!(own.chunk(), first.chunk());
        assert_eq!(own.word(), 0);
        assert_eq!(after.chunk(), first.chunk(), "the shared chunk stays open past a long source");
        assert_eq!(Source::read(&arena, own).map(|source| source.text.len()), Ok(text.len()));
    }

    #[test]
    fn an_address_no_source_is_at_is_refused() {
        let mut arena = chunks();
        let at = arena.write_source(&Source { text: "x", breaks_lf: true, inferred: InferredOptions::default() }).expect("room");
        assert!(Source::read(&arena, Address::new(at.chunk() + 1, 0).expect("an address")).is_err());
        assert!(Source::read(&arena, Address::new(at.chunk(), STRING_CHUNK_BYTES - 8).expect("an address")).is_err(), "zeroed bytes hold no entry");
    }
}
