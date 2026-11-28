//! The native writer of a built arena: entries placed as JavaScript's
//! builders place them, in the chunks the store holds, each with its count.
//! The native record sink writes native nodes through it.

use std::sync::Arc;

use super::cell::{flag, with_kind, CellWord, ListCell, LINK_WORDS};
use super::count::OWNED;
use super::memory::{ChunkMem, ChunkUnit};
use super::{Address, ArenaError, BuiltChunks, CHUNK_WORDS};
use crate::types::{KindId, Span};

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

/// Writes a read's records into the chunk a built arena keeps open for its
/// reads: each entry reserved with a count of one and lent to be written in
/// place, a record the open chunk has no room for opening the next, and a
/// record past a chunk's words taking a chunk of its own. The builders' own
/// open chunk is left as it is.
pub struct ReadWriter<'a> {
    chunks: &'a mut BuiltChunks,
    spans: Vec<std::ops::Range<Address>>,
    open: Option<usize>,
    sourced: u32,
    read_side: Option<Address>,
    /// The records the walk wrote and no run names: what lay inside a unit.
    unwritten: Vec<Address>,
}

/// Where a read's writer took the words of a record.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Taken {
    Open,
    Opened,
    Own,
}

impl<'a> ReadWriter<'a> {
    /// A writer appending to the chunk `chunks` has open for reads.
    pub fn new(chunks: &'a mut BuiltChunks) -> Self {
        Self { chunks, spans: Vec::new(), open: None, sourced: 0, read_side: None, unwritten: Vec::new() }
    }

    /// The addresses the writer's records lie in, one range for each run of
    /// chunks it wrote in turn.
    #[must_use]
    pub fn spans(&self) -> Vec<std::ops::Range<Address>> {
        self.spans.clone()
    }

    /// One more side record the writer wrote names the read's source.
    pub fn names_source(&mut self) {
        self.sourced += 1;
    }

    /// The side record at `at` is the read's own: its spans and entry
    /// starts.
    pub fn keeps_read_side(&mut self, at: Address) {
        self.read_side = Some(at);
    }

    /// The chunks this writer writes into.
    pub fn chunks_mut(&mut self) -> &mut BuiltChunks {
        self.chunks
    }

    /// Ends the read whose source's entry is `source` and whose root's
    /// record is `root`: each side record that names the source holds a
    /// count of it in place of the read's own, and a count of the read's
    /// own side record, which the source names, so its spans and starts
    /// live as long as the source does; the root's one count is its
    /// handle's.
    ///
    /// # Errors
    ///
    /// What reaching the source's, the read's side record's or the root's
    /// count refuses.
    pub fn finish(self, source: Address, root: Option<Address>) -> Result<(), ArenaError> {
        self.chunks.hold_texts(source, self.sourced)?;
        if let Some(read) = self.read_side {
            self.chunks.name_read_side(source, read)?;
            self.chunks.hold_more(read, self.sourced)?;
            self.chunks.release(super::count::Held::Side(read), false)?;
        }
        for record in self.unwritten {
            self.chunks.release(super::count::Held::Record(record), false)?;
        }
        self.chunks.release(super::count::Held::Text(source), false)?;
        root.map_or(Ok(()), |root| self.chunks.hand_to_handle(root))
    }

    /// Gives back what a refused read placed: each entry it wrote, which no
    /// holder names yet, and the count `write_source` took of the source's
    /// entry `source`. Entries an earlier read placed in the same chunk stay;
    /// a chunk left with nothing live is freed.
    ///
    /// # Errors
    ///
    /// What reaching an entry's or the source's count refuses.
    pub fn abandon(self, source: Address) -> Result<(), ArenaError> {
        for span in self.spans {
            self.chunks.retire_placed(span)?;
        }
        self.chunks.release(super::count::Held::Text(source), false)
    }

    /// The record at `at` is named by no run, and is released once the
    /// read's counts are in (`ReadWriter::finish`).
    pub(crate) fn leaves_unwritten(&mut self, at: Address) {
        self.unwritten.push(at);
    }

    /// The record of `words` words at `at` among the writer's spans, as
    /// `taken`: in the chunk open for reads, the open span goes on; in a
    /// chunk opened for reads, it goes on when that chunk is the next
    /// number after the one it left, whose rest no read writes again; in a
    /// chunk of its own, it is a span of its own, the open chunk staying
    /// open. A span ends where its last chunk's addresses do at most.
    fn note(&mut self, at: Address, words: u32, taken: Taken) {
        let end = Address(at.0 + words.min(CHUNK_WORDS - at.word()));
        let goes_on = self.open.filter(|&open| match taken {
            Taken::Open => self.spans[open].end == at,
            Taken::Opened => Address(self.spans[open].end.0 - 1).chunk() + 1 == at.chunk(),
            Taken::Own => false,
        });
        if let Some(open) = goes_on {
            self.spans[open].end = end;
        } else {
            if taken != Taken::Own {
                self.open = Some(self.spans.len());
            }
            self.spans.push(at..end);
        }
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
        let (at, taken) = match self.chunks.reads {
            _ if words > CHUNK_WORDS => (Address::new(self.chunks.alloc_read_words(words)?, 0), Taken::Own),
            Some((chunk, used)) if used + words <= CHUNK_WORDS => {
                self.chunks.reads = Some((chunk, used + words));
                (Address::new(chunk, used), Taken::Open)
            }
            _ => {
                let chunk = self.chunks.alloc_read_words(CHUNK_WORDS)?;
                self.chunks.reads = Some((chunk, words));
                (Address::new(chunk, 0), Taken::Opened)
            }
        };
        let at = at.ok_or(ArenaError::Full)?;
        self.note(at, words, taken);
        self.chunks.place(at, 1)?;
        Ok(at)
    }

    fn words_mut(&mut self, at: Address, len: u32) -> Result<&mut [u32], ArenaError> {
        self.chunks.words_mut(at, len)
    }
}

/// Writes entries into a built arena's chunks: records, runs, side records
/// and link records into word chunks, leaf entries into string chunks.
pub struct BuiltWriter<'a> {
    chunks: &'a mut BuiltChunks,
    words: Option<Open<u32>>,
}

impl BuiltWriter<'_> {
    /// The chunks this writer writes into.
    pub fn chunks_mut(&mut self) -> &mut BuiltChunks {
        self.chunks
    }
}

impl super::ArenaRead for BuiltWriter<'_> {
    fn chunk(&self, n: u32) -> Option<&[u32]> {
        super::ArenaRead::chunk(&*self.chunks, n)
    }

    fn string_chunk(&self, n: u32) -> Option<&[u8]> {
        super::ArenaRead::string_chunk(&*self.chunks, n)
    }

    fn released(&self, at: Address) -> bool {
        super::ArenaRead::released(&*self.chunks, at)
    }

    fn read_chunk(&self, n: u32) -> bool {
        super::ArenaRead::read_chunk(&*self.chunks, n)
    }

    fn read_entry(&self, at: Address) -> bool {
        super::ArenaRead::read_entry(&*self.chunks, at)
    }

    fn freed(&self, n: u32) -> bool {
        super::ArenaRead::freed(&*self.chunks, n)
    }
}

impl<'a> BuiltWriter<'a> {
    /// A writer appending records to fresh word chunks of `chunks`, and leaf
    /// entries to its open string chunk, past what any builder wrote there.
    pub fn new(chunks: &'a mut BuiltChunks) -> Self {
        Self { chunks, words: None }
    }

    /// The bits the arena's kind fields take.
    #[must_use]
    pub fn kind_bits(&self) -> u32 {
        self.chunks.kind_bits
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
            self.chunks.refuse_native_open()?;
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
        self.chunks.hold(at)?;
        Ok(true)
    }

    /// The link record naming the node of `kind` that `name` names, a node
    /// a read left with no record of its own, held by the cell naming it and
    /// holding its holder's record once more:
    /// its holder, then the word and item of its site, both 0 for its
    /// holder's own node, and its byte span.
    ///
    /// # Errors
    ///
    /// As `header` and `place`.
    pub fn link(&mut self, kind: KindId, name: crate::types::NodeId, span: Span) -> Result<Address, ArenaError> {
        let [word, item] = name.site().unwrap_or([0, 0]);
        let words = [self.header(kind, flag::LINK)?, 0, name.address(), word, item, 0, span.start, span.end];
        debug_assert_eq!(words.len(), LINK_WORDS as usize);
        self.hold_read(Address(name.address()))?;
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
        let head = with_kind(kind, bits)? | len << bits;
        if self.chunks.open_strings_with_room(size).is_none() {
            self.chunks.refuse_native_open()?;
        }
        let open = self.chunks.open_strings(size)?;
        let byte = self.chunks.reserve_strings(open.chunk, size)?;
        // SAFETY: as `place`.
        let out = unsafe { open.mem.slice_mut() };
        let start = byte as usize;
        out[start..start + ENTRY_HEAD_BYTES as usize].copy_from_slice(&head.to_ne_bytes());
        out[start + ENTRY_HEAD_BYTES as usize..start + (ENTRY_HEAD_BYTES + len) as usize].copy_from_slice(text.as_bytes());
        let at = Address::new(open.chunk, byte).ok_or(ArenaError::Full)?;
        self.chunks.hold_text(at)?;
        Ok(at)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::arena::cell::Cell;
    use crate::arena::count::{strings_written, STRINGS_WRITTEN};
    use crate::arena::{ArenaRead, FIRST_STRING_BYTES, STRING_CHUNK_BYTES};
    use crate::slot::ChangedEdges;

    const BITS: u32 = 9;
    const NAME: KindId = KindId(16);

    fn store() -> BuiltChunks {
        BuiltChunks::new(BITS, |_| None)
    }

    fn written(chunks: &BuiltChunks, chunk: u32) -> u32 {
        strings_written(chunks.strings_of(chunk).expect("a string chunk").1)
    }

    fn length(chunks: &BuiltChunks, chunk: u32) -> usize {
        chunks.strings_of(chunk).expect("a string chunk").0.len()
    }

    fn write_as_javascript(chunks: &BuiltChunks, chunk: u32, kind: KindId, text: &str) -> Address {
        let byte = written(chunks, chunk);
        let len = u32::try_from(text.len()).expect("a short text");
        let size = (ENTRY_HEAD_BYTES + len).next_multiple_of(4);
        let (mem, meta) = chunks.strings_of(chunk).expect("a string chunk");
        // SAFETY: the test holds the only references to the chunk.
        let (mem, meta) = unsafe { (mem.slice_mut(), meta.slice_mut()) };
        let start = byte as usize;
        mem[start..start + 4].copy_from_slice(&(with_kind(kind, BITS).expect("a kind") | len << BITS).to_ne_bytes());
        mem[start + 4..start + 4 + text.len()].copy_from_slice(text.as_bytes());
        meta[STRINGS_WRITTEN..STRINGS_WRITTEN + 4].copy_from_slice(&(byte + size).to_ne_bytes());
        Address::new(chunk, byte).expect("an address")
    }

    fn text_at(chunks: &BuiltChunks, at: Address) -> (KindId, String) {
        let cell = CellWord::of(at, ChangedEdges::default()).expect("a cell word");
        match Cell::decode_built(cell, chunks, BITS).expect("a leaf entry") {
            Cell::BuiltLeaf { kind, text, .. } => (kind, chunks.text(text).expect("its text").to_owned()),
            other => panic!("not a leaf entry: {other:?}"),
        }
    }

    #[test]
    fn the_open_string_chunk_is_answered_while_its_written_bytes_leave_room() {
        let mut chunks = store();
        let first = chunks.open_strings(8).expect("a chunk").chunk;
        assert_eq!(length(&chunks, first), FIRST_STRING_BYTES as usize);
        write_as_javascript(&chunks, first, NAME, "abcd");
        assert_eq!(chunks.open_strings(8).expect("the open chunk").chunk, first);
        write_as_javascript(&chunks, first, NAME, &"x".repeat(FIRST_STRING_BYTES as usize - 16));
        assert_eq!(written(&chunks, first), FIRST_STRING_BYTES - 4);
        let next = chunks.open_strings(8).expect("the next chunk").chunk;
        assert_ne!(next, first);
        assert_eq!(length(&chunks, next), 2 * FIRST_STRING_BYTES as usize);
        let own = chunks.open_strings(STRING_CHUNK_BYTES + 4).expect("a chunk of its own").chunk;
        assert_eq!(length(&chunks, own), (STRING_CHUNK_BYTES + 4) as usize);
        assert_eq!(chunks.open_strings(8).expect("the open chunk").chunk, next, "a chunk of its own leaves the open one open");
    }

    #[test]
    fn a_native_entry_lands_past_what_javascript_wrote_and_javascript_appends_past_it() {
        let mut chunks = store();
        let open = chunks.open_strings(8).expect("a chunk").chunk;
        let javascript = write_as_javascript(&chunks, open, NAME, "js");
        chunks.hold_text(javascript).expect("held");
        let native = BuiltWriter::new(&mut chunks).entry(NAME, "native").expect("written");
        assert_eq!(native, Address::new(open, 8).expect("an address"));
        assert_eq!(chunks.open_strings(8).expect("the open chunk").chunk, open);
        let after = write_as_javascript(&chunks, open, NAME, "after");
        assert_eq!(after, Address::new(open, 20).expect("an address"));
        assert_eq!(text_at(&chunks, javascript), (NAME, "js".to_owned()));
        assert_eq!(text_at(&chunks, native), (NAME, "native".to_owned()));
        assert_eq!(text_at(&chunks, after), (NAME, "after".to_owned()));
    }

    #[test]
    fn on_an_arena_whose_builder_chunks_javascript_opens_the_native_writer_writes_in_an_open_chunk_and_refuses_to_open_one() {
        let mut chunks = store();
        chunks.open_builder_chunks_in_javascript();
        let refusal = Err(ArenaError::Unwritable("a native write opens no builder chunk on an arena whose builder chunks JavaScript opens"));
        assert_eq!(BuiltWriter::new(&mut chunks).entry(NAME, "native"), refusal, "no string chunk is open");
        assert_eq!(BuiltWriter::new(&mut chunks).place(&[1, 2], 1), refusal, "the writer has no words chunk open");
        let open = chunks.open_strings(8).expect("a chunk JavaScript asks for").chunk;
        let native = BuiltWriter::new(&mut chunks).entry(NAME, "native").expect("written in the open chunk");
        assert_eq!(native.chunk(), open);
        write_as_javascript(&chunks, open, NAME, &"x".repeat(FIRST_STRING_BYTES as usize - 16));
        assert_eq!(written(&chunks, open), FIRST_STRING_BYTES, "JavaScript filled it");
        assert_eq!(BuiltWriter::new(&mut chunks).entry(NAME, "full"), refusal, "the open chunk is full");
        assert_eq!(chunks.open_strings(8).map(|made| made.chunk == open), Ok(false), "JavaScript's own request opens the next");
    }

    #[test]
    fn on_an_arena_rust_alone_writes_the_native_writer_opens_the_chunks_it_writes_in() {
        let mut chunks = store();
        let entry = BuiltWriter::new(&mut chunks).entry(NAME, "native").expect("written in a chunk it opened");
        assert_eq!(text_at(&chunks, entry), (NAME, "native".to_owned()));
        let record = BuiltWriter::new(&mut chunks).place(&[1, 2], 1).expect("placed in a chunk it opened");
        assert_ne!(record.chunk(), entry.chunk());
    }

    fn past(at: Address, words: u32) -> Address {
        Address(at.0 + words)
    }

    #[test]
    fn a_read_s_records_in_its_chunk_and_the_next_number_are_one_span() {
        use crate::arena::RecordSpace;
        let mut chunks = store();
        let earlier = ReadWriter::new(&mut chunks).alloc(4).expect("an earlier read's record");
        let mut read = ReadWriter::new(&mut chunks);
        let first = read.alloc(6).expect("a record");
        let filling = read.alloc(CHUNK_WORDS - 10).expect("a record filling the chunk");
        let next = read.alloc(6).expect("a record in the next number");
        assert_eq!((first, filling.chunk(), next.chunk()), (past(earlier, 4), first.chunk(), first.chunk() + 1));
        assert_eq!(read.spans(), vec![first..past(next, 6)], "from the read's first record, past the earlier read's, to its last word");
    }

    #[test]
    fn a_chunk_numbered_between_two_of_a_read_s_chunks_parts_its_spans() {
        use crate::arena::RecordSpace;
        let mut chunks = store();
        let earlier = ReadWriter::new(&mut chunks).alloc(4).expect("an earlier read's record");
        let built = chunks.alloc_words(16).expect("a builder's chunk").chunk;
        let mut read = ReadWriter::new(&mut chunks);
        let first = read.alloc(6).expect("a record in the open chunk");
        let second = read.alloc(CHUNK_WORDS).expect("a record taking a new chunk");
        assert_eq!((first.chunk(), second.chunk()), (earlier.chunk(), built + 1));
        assert_eq!(read.spans(), vec![first..past(first, 6), second..past(second, CHUNK_WORDS)]);
        let inside = Address::new(built, 0).expect("an address");
        assert!(!read.spans().iter().any(|span| span.contains(&inside)), "no span holds the builder's chunk");
    }

    #[test]
    fn a_record_wider_than_a_chunk_is_a_span_of_its_own_and_the_read_writes_on_where_it_was() {
        use crate::arena::RecordSpace;
        let mut chunks = store();
        let mut read = ReadWriter::new(&mut chunks);
        let first = read.alloc(6).expect("a record");
        let wide = read.alloc(CHUNK_WORDS + 1).expect("a record of its own chunk");
        let after = read.alloc(6).expect("a record after it");
        assert_eq!((wide.word(), after), (0, past(first, 6)));
        let spans = read.spans();
        assert_eq!(spans, vec![first..past(after, 6), wide..past(wide, CHUNK_WORDS)], "the wide record's span ends where its chunk's addresses do");
        let next = ReadWriter::new(&mut chunks).alloc(6).expect("the next read's record");
        assert!(!spans.iter().any(|span| span.contains(&next)), "the next read writes on past the read's spans");
    }

    #[test]
    fn a_read_on_a_reused_lower_number_starts_a_span_there() {
        use crate::arena::RecordSpace;
        let mut chunks = store();
        let freed = chunks.alloc_words(16).expect("a builder's chunk").chunk;
        let mut read = ReadWriter::new(&mut chunks);
        let first = read.alloc(CHUNK_WORDS).expect("a full chunk");
        let lower = Address::new(freed, 0).expect("an address");
        read.note(lower, 6, Taken::Opened);
        assert_eq!(read.spans(), vec![first..past(first, CHUNK_WORDS), lower..past(lower, 6)], "a chunk numbered below the last is not the next number");
    }
}
