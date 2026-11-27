use super::{word_range, Address, ArenaError, StringRef, MAX_CHUNKS};
use crate::record::HEADER_WORDS;
use crate::types::KindId;

/// Bounds-checked reads shared by native-owned and call-borrowed arena storage.
pub trait ArenaRead {
    /// The written words in chunk `n`.
    fn chunk(&self, n: u32) -> Option<&[u32]>;

    /// The written UTF-8 bytes in string chunk `n`.
    fn string_chunk(&self, n: u32) -> Option<&[u8]>;

    /// Whether the entry at `at` holds no count: released, though its chunk
    /// lives. An arena that counts no entry releases none.
    fn released(&self, at: Address) -> bool {
        let _ = at;
        false
    }

    /// Whether chunk `n` is one a read took for its records, which it alone
    /// writes. An arena no read writes into answers false.
    fn read_chunk(&self, n: u32) -> bool {
        let _ = n;
        false
    }

    /// Whether `at` lies in a chunk a read wrote (`read_chunk`): where a
    /// record a read left is, its own entry or one embedded in its
    /// holder's.
    fn read_record(&self, at: Address) -> bool {
        self.read_chunk(at.chunk())
    }

    /// Whether `at` is where a read wrote an entry of its records
    /// (`read_chunk`).
    fn read_entry(&self, at: Address) -> bool {
        let _ = at;
        false
    }

    /// Whether chunk `n` was freed: every entry in it was released. An
    /// arena that frees no chunk answers false.
    fn freed(&self, n: u32) -> bool {
        let _ = n;
        false
    }

    /// The `len` written words at `at`, within one chunk.
    fn words(&self, at: Address, len: u32) -> Result<&[u32], ArenaError> {
        let words = self.chunk(at.chunk()).ok_or_else(|| {
            if self.freed(at.chunk()) { ArenaError::Released(at) } else { ArenaError::OutOfBounds { chunk: at.chunk(), word: at.word(), len } }
        })?;
        Ok(&words[word_range(at, len, words.len())?])
    }

    /// The written word at `at`.
    fn word(&self, at: Address) -> Result<u32, ArenaError> {
        self.words(at, 1).map(|words| words[0])
    }

    /// The kind the header of the record at `at` names, its kind field
    /// `bits` bits: the grammar's. Refuses address 0, which names no record,
    /// a header past the written words, and a header with flags, a link
    /// record's, which names a node of another tree.
    fn header_kind(&self, at: Address, bits: u32) -> Result<KindId, ArenaError> {
        kind_in(self.words(at.record()?, HEADER_WORDS)?, bits)
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

/// The address of the side record of the record at `at`: its header's
/// second word.
///
/// # Errors
///
/// `ArenaError::Malformed` for address 0, which names no record, and what
/// reading a header past the written words refuses.
pub(crate) fn side_of(arena: &dyn ArenaRead, at: Address) -> Result<Address, ArenaError> {
    Ok(side_in(arena.words(at.record()?, HEADER_WORDS)?))
}

/// The header word of the record at `at`, the address of its side record
/// (`side_of`), and that side record's mask when it lies in the record's
/// chunk, all from one lookup of the chunk.
///
/// # Errors
///
/// As `side_of`.
pub(crate) fn header_side_mask(arena: &dyn ArenaRead, at: Address) -> Result<(u32, Address, Option<u32>), ArenaError> {
    let at = at.record()?;
    let words = arena.chunk(at.chunk()).ok_or_else(|| if arena.freed(at.chunk()) { ArenaError::Released(at) } else { ArenaError::OutOfBounds { chunk: at.chunk(), word: at.word(), len: HEADER_WORDS } })?;
    let header = &words[word_range(at, HEADER_WORDS, words.len())?];
    let side = side_in(header);
    let mask = if side != Address::NONE && side.chunk() == at.chunk() { words.get(side.word() as usize).copied() } else { None };
    Ok((header_word(header), side, mask))
}

/// Names `side` as the side record of the record at `at`, written through
/// `space`: its header's second word (`side_of`).
///
/// # Errors
///
/// As `side_of`.
pub(crate) fn set_side_of(space: &mut dyn super::RecordSpace, at: Address, side: Address) -> Result<(), ArenaError> {
    space.words_mut(at.record()?, HEADER_WORDS)?[1] = side.0;
    Ok(())
}

/// The `len` words of the record at `at`, `len` at least its header's,
/// with the kind its header names (`header_kind`) and the address of its
/// side record (`side_of`), from one read of its words.
///
/// # Errors
///
/// What `header_kind` refuses, and what reading `len` words past the
/// written words refuses.
pub(crate) fn record_words(arena: &dyn ArenaRead, at: Address, len: u32, bits: u32) -> Result<(KindId, Address, &[u32]), ArenaError> {
    let words = arena.words(at.record()?, len.max(HEADER_WORDS))?;
    Ok((kind_in(words, bits)?, side_in(words), words))
}

/// The kind the record header `header` names, its kind field `bits` bits;
/// refuses a header with flags.
fn kind_in(header: &[u32], bits: u32) -> Result<KindId, ArenaError> {
    let word = header_word(header);
    match super::cell::header_of(word, bits) {
        (kind, 0) => Ok(kind),
        _ => Err(ArenaError::Malformed { what: "record kind", word }),
    }
}

/// The header word of the record header `header`: its kind, flags and
/// layout codes.
pub(crate) fn header_word(header: &[u32]) -> u32 {
    header[0]
}

/// The address of the side record the record header `header` names.
fn side_in(header: &[u32]) -> Address {
    Address(header[1])
}

/// Rewrites, through `change`, the layout a record's header word keeps
/// (`HeaderLayout`), `header` that word as `words_mut(at, 1)` lends it, its
/// kind field `bits` bits; the kind and flags stay.
///
/// # Errors
///
/// `ArenaError::Malformed` for no header word, and what reading or writing
/// its layout refuses.
pub(crate) fn rewrite_layout<R>(header: &mut [u32], bits: u32, change: impl FnOnce(&mut super::cell::HeaderLayout) -> R) -> Result<R, ArenaError> {
    let word = header.first_mut().ok_or(ArenaError::Malformed { what: "record header", word: 0 })?;
    let mut layout = super::cell::HeaderLayout::of(*word, bits)?;
    let changed = change(&mut layout);
    *word = layout.onto(*word, bits)?;
    Ok(changed)
}

/// Record and string chunks borrowed for one synchronous call. The owner must
/// exclude concurrent writes while these slices are borrowed. Word and
/// string chunks share one numbering, so each table holds an empty slice at
/// the other's numbers: an empty slice is no chunk.
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
        self.chunks.get(n as usize).copied().filter(|chunk| !chunk.is_empty())
    }

    fn string_chunk(&self, n: u32) -> Option<&[u8]> {
        self.strings.get(n as usize).copied().filter(|chunk| !chunk.is_empty())
    }
}

#[cfg(test)]
mod tests {
    use super::{side_of, BorrowedArena};
    use crate::arena::{Address, ArenaError};

    #[test]
    fn a_records_side_record_is_its_second_header_word() {
        let record = [7, 41, 0];
        let chunks: [&[u32]; 2] = [&[], &record];
        let arena = BorrowedArena::new(&chunks, &[]).expect("addressable chunks");
        assert_eq!(side_of(&arena, Address::new(1, 0).expect("an address")).expect("a header"), Address(41));
    }

    #[test]
    fn address_0_and_a_header_past_the_written_words_name_no_side_record() {
        let short = [7];
        let chunks: [&[u32]; 2] = [&[], &short];
        let arena = BorrowedArena::new(&chunks, &[]).expect("addressable chunks");
        assert!(matches!(side_of(&arena, Address::NONE), Err(ArenaError::Malformed { what: "record address", .. })));
        assert!(matches!(side_of(&arena, Address::new(1, 0).expect("an address")), Err(ArenaError::OutOfBounds { .. })));
    }
}
