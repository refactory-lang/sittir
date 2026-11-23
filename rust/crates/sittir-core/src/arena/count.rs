//! The counts of a built arena's entries. Every allocation in a word chunk
//! is an entry with a count: a record, a run, a side record or a link
//! record. The counts are kept beside the chunk, never in its words, in
//! native memory JavaScript's builders write when they place an entry and
//! native code decrements when it releases one.
//!
//! A word chunk's meta holds its live entries, its placed entries, a bitmap
//! with a bit set at each entry's first word, a rank directory, one `u16`
//! per 64 words, of the entries placed before that block, and the chunk's
//! counts, one byte per entry. An entry takes at least `ENTRY_MIN_WORDS`
//! words, so a chunk of `w` words holds at most `w / ENTRY_MIN_WORDS`
//! entries, and its meta is made at that size and never grows. An entry's
//! ordinal is its block's rank and the bits below it in the block; its count
//! is that ordinal's byte of the counts. A count byte keeps
//! `OWNED`, set while the handle a builder returned holds one of the counts,
//! and the count in its other bits, which saturates at `SATURATED` into the
//! arena's overflow map. A string chunk's meta is one `u32`: the cells that
//! name an entry in it.
//!
//! Every word of the meta and the counts is untrusted: a count that would go
//! below zero, or an address no entry starts at, refuses by name.

use std::sync::Arc;

use super::cell::{built_cells, flag, header_of, parsed_cell_walk, Cell, CellWord, ListCell, Lists, ParsedCell};
use super::memory::ChunkMem;
use super::side::{RunEntry, SideRecord};
use super::{Address, ArenaError, ArenaRead, BuiltChunk, BuiltChunks, RecordShape, ARENA_RELEASED};
use crate::types::KindId;

/// The flag of a count the handle a builder returned holds.
pub const OWNED: u8 = 0x80;
/// The count a count byte saturates at: the rest is in the overflow map.
pub const SATURATED: u8 = 0x7f;
/// The fewest words an entry of a word chunk takes: a record's header, or a
/// run's length and one item.
pub const ENTRY_MIN_WORDS: u32 = 2;
/// The bytes of a string chunk's meta: its cell count, then the bytes
/// builders wrote into it (`STRINGS_WRITTEN`).
pub const CELLS_META_BYTES: usize = 8;
/// The byte of a string chunk's meta the bytes builders wrote into it start
/// at: the one write position every builder appends at, native or JavaScript.
pub(super) const STRINGS_WRITTEN: usize = 4;
const META_HEAD: usize = 8;
const LIVE: usize = 0;
const PLACED: usize = 4;

/// The byte of a word chunk of `words` words' meta its counts start at,
/// past its head, two bitmap words and a rank per 64 words, padded to a word.
#[must_use]
pub fn counts_at(words: u32) -> usize {
    let blocks = words.div_ceil(64) as usize;
    META_HEAD + blocks * 8 + (blocks * 2).next_multiple_of(4)
}

/// The bytes a word chunk of `words` words keeps its meta in while it is
/// open: its head, bitmap and ranks, and a count for each entry it can hold.
/// A chunk past `CHUNK_WORDS` holds one run, so it has one count.
#[must_use]
pub fn meta_len(words: u32) -> usize {
    counts_at(words) + if words > super::CHUNK_WORDS { 1 } else { words.div_ceil(ENTRY_MIN_WORDS) as usize }
}

fn malformed(what: &'static str, word: u32) -> ArenaError {
    ArenaError::Malformed { what, word }
}

fn read_u32(bytes: &[u8], at: usize) -> u32 {
    let mut word = [0; 4];
    word.copy_from_slice(&bytes[at..at + 4]);
    u32::from_ne_bytes(word)
}

fn write_u32(bytes: &mut [u8], at: usize, value: u32) {
    bytes[at..at + 4].copy_from_slice(&value.to_ne_bytes());
}

/// The bytes builders wrote into the string chunk whose meta is `cells`.
pub(super) fn strings_written(cells: &ChunkMem<u8>) -> u32 {
    // SAFETY: the meta is read through the arena's borrow, inside one native
    // call, and no slice of it that writes is live.
    read_u32(unsafe { cells.slice() }, STRINGS_WRITTEN)
}

#[cfg(test)]
impl BuiltChunks {
    /// The cells naming an entry of the string chunk `chunk`; none for a
    /// chunk that holds no strings.
    pub(crate) fn text_count(&self, chunk: u32) -> Option<u32> {
        // SAFETY: as `strings_written`.
        self.strings_of(chunk).map(|(_, cells)| read_u32(unsafe { cells.slice() }, 0))
    }
}

/// A word chunk's meta, its counts included.
#[derive(Debug)]
pub(super) struct CountTable {
    meta: Arc<ChunkMem<u8>>,
    blocks: usize,
    counts: usize,
    ranked: usize,
}

impl CountTable {
    pub(super) fn new(words: u32) -> Self {
        Self { meta: ChunkMem::zeroed(meta_len(words)), blocks: words.div_ceil(64) as usize, counts: counts_at(words), ranked: 0 }
    }

    pub(super) fn meta(&self) -> &Arc<ChunkMem<u8>> {
        &self.meta
    }

    pub(super) fn byte_len(&self) -> usize {
        self.meta.byte_len()
    }

    fn bytes(&mut self) -> &mut [u8] {
        // SAFETY: the table is reached only through its arena's mutable
        // borrow, inside one native call, and no other slice of the meta is
        // live.
        unsafe { self.meta.slice_mut() }
    }

    fn read(&self) -> &[u8] {
        // SAFETY: the table is reached through its arena's borrow, inside one
        // native call, and no mutable slice of the meta is live.
        unsafe { self.meta.slice() }
    }

    /// Moves the meta into one sized for the entries placed, now that no
    /// more are: its head, bitmap and ranks, then a count per entry. Answers
    /// the new meta when it is smaller.
    pub(super) fn seal(&mut self) -> Option<Arc<ChunkMem<u8>>> {
        let exact = self.counts + read_u32(self.read(), PLACED) as usize;
        if exact >= self.meta.len() {
            return None;
        }
        let meta = ChunkMem::zeroed(exact);
        // SAFETY: the new meta is not shared yet, and the old one is read
        // through the arena's borrow, inside one native call.
        unsafe { meta.slice_mut() }.copy_from_slice(&self.read()[..exact]);
        self.meta = Arc::clone(&meta);
        Some(meta)
    }

    pub(super) fn live(&self) -> u32 {
        read_u32(self.read(), LIVE)
    }

    fn set_live(&mut self, live: u32) {
        write_u32(self.bytes(), LIVE, live);
    }

    /// Places an entry starting at `word`, past every entry placed before
    /// it in the chunk, holding `count`: as a builder places one.
    fn place(&mut self, word: u32, count: u8) -> Result<(), ArenaError> {
        let block = (word / 64) as usize;
        if block >= self.blocks {
            return Err(malformed("entry address", word));
        }
        let blocks = self.blocks;
        let ranked = self.ranked;
        let counts = self.counts;
        let bytes = self.bytes();
        let ordinal = read_u32(bytes, PLACED);
        let rank = u16::try_from(ordinal).map_err(|_| malformed("entry ordinal", ordinal))?;
        if counts + ordinal as usize >= bytes.len() {
            return Err(malformed("entry ordinal", ordinal));
        }
        write_u32(bytes, PLACED, ordinal + 1);
        write_u32(bytes, LIVE, read_u32(bytes, LIVE) + 1);
        for at in (ranked..=block).map(|block| META_HEAD + blocks * 8 + block * 2) {
            bytes[at..at + 2].copy_from_slice(&rank.to_ne_bytes());
        }
        let at = META_HEAD + block * 8 + if word % 64 >= 32 { 4 } else { 0 };
        write_u32(bytes, at, read_u32(bytes, at) | 1 << (word % 32));
        self.ranked = self.ranked.max(block + 1);
        *self.count(word)? = count;
        Ok(())
    }

    /// The ordinal of the entry starting at `word`.
    fn ordinal(&self, word: u32) -> Result<u32, ArenaError> {
        let block = (word / 64) as usize;
        if block >= self.blocks {
            return Err(malformed("entry address", word));
        }
        let blocks = self.blocks;
        let bytes = self.read();
        let bits = u64::from(read_u32(bytes, META_HEAD + block * 8)) | u64::from(read_u32(bytes, META_HEAD + block * 8 + 4)) << 32;
        let bit = word % 64;
        if bits >> bit & 1 == 0 {
            return Err(malformed("entry start", word));
        }
        let rank_at = META_HEAD + blocks * 8 + block * 2;
        let rank = u32::from(u16::from_ne_bytes([bytes[rank_at], bytes[rank_at + 1]]));
        let ordinal = rank + (bits & ((1 << bit) - 1)).count_ones();
        if ordinal >= read_u32(bytes, PLACED) {
            return Err(malformed("entry ordinal", ordinal));
        }
        Ok(ordinal)
    }

    /// The count byte of the entry starting at `word`, read.
    pub(super) fn peek(&self, word: u32) -> Result<u8, ArenaError> {
        let ordinal = self.ordinal(word)?;
        self.read().get(self.counts + ordinal as usize).copied().ok_or(malformed("entry ordinal", ordinal))
    }

    /// The count byte of the entry starting at `word`.
    fn count(&mut self, word: u32) -> Result<&mut u8, ArenaError> {
        let ordinal = self.ordinal(word)?;
        let at = self.counts + ordinal as usize;
        self.bytes().get_mut(at).ok_or(malformed("entry ordinal", ordinal))
    }
}

/// The tags `Held::of` reads.
pub mod held {
    pub const RECORD: u32 = 0;
    pub const RUN: u32 = 1;
    pub const SIDE: u32 = 2;
    pub const TEXT: u32 = 3;
}

/// What a released count held, by what it is.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Held {
    /// A record, or a link record, which a cell names.
    Record(Address),
    /// A list's run, which a list cell names.
    Run(Address),
    /// A side record, which a record's second word names.
    Side(Address),
    /// A leaf entry, which a cell names: one count of its string chunk.
    Text(Address),
}

impl Held {
    /// What `tag` (`held`) names at `at`.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for any other tag.
    pub fn of(tag: u32, at: Address) -> Result<Held, ArenaError> {
        match tag {
            held::RECORD => Ok(Held::Record(at)),
            held::RUN => Ok(Held::Run(at)),
            held::SIDE => Ok(Held::Side(at)),
            held::TEXT => Ok(Held::Text(at)),
            _ => Err(malformed("held entry tag", tag)),
        }
    }

    fn at(self) -> Address {
        match self {
            Held::Record(at) | Held::Run(at) | Held::Side(at) | Held::Text(at) => at,
        }
    }
}

impl BuiltChunks {
    fn table(&mut self, chunk: u32) -> Result<&mut CountTable, ArenaError> {
        match self.chunks.get_mut(chunk as usize) {
            Some(Some(BuiltChunk::Words { counts, .. })) => Ok(counts),
            _ => Err(ArenaError::OutOfBounds { chunk, word: 0, len: 1 }),
        }
    }

    /// Places an entry starting at `at` holding `count`, as a builder places
    /// one: past every entry placed before it in its chunk.
    ///
    /// # Errors
    ///
    /// `ArenaError::OutOfBounds` for a chunk that holds no records, and
    /// `ArenaError::Malformed` for an address past the chunk.
    pub(super) fn place(&mut self, at: Address, count: u8) -> Result<(), ArenaError> {
        self.table(at.chunk())?.place(at.word(), count)
    }

    /// One more cell naming an entry of the string chunk `at` lies in.
    ///
    /// # Errors
    ///
    /// `ArenaError::OutOfBounds` for a chunk that holds no strings.
    pub(crate) fn hold_text(&mut self, at: Address) -> Result<(), ArenaError> {
        self.hold_texts(at, 1)
    }

    /// `more` cells more naming an entry of the string chunk `at` lies in.
    ///
    /// # Errors
    ///
    /// As `hold_text`.
    pub(crate) fn hold_texts(&mut self, at: Address, more: u32) -> Result<(), ArenaError> {
        let Some(Some(BuiltChunk::Bytes { cells, .. })) = self.chunks.get(at.chunk() as usize) else {
            return Err(ArenaError::OutOfBounds { chunk: at.chunk(), word: at.word(), len: 1 });
        };
        // SAFETY: the meta is reached through the arena's mutable borrow,
        // inside one native call, and no other slice of it is live.
        let bytes = unsafe { cells.slice_mut() };
        write_u32(bytes, 0, read_u32(bytes, 0) + more);
        Ok(())
    }

    /// The memory and the meta of the string chunk `chunk`.
    pub(super) fn strings_of(&self, chunk: u32) -> Option<(&ChunkMem<u8>, &ChunkMem<u8>)> {
        match self.chunks.get(chunk as usize) {
            Some(Some(BuiltChunk::Bytes { mem, cells })) => Some((&**mem, &**cells)),
            _ => None,
        }
    }

    /// Reserves `size` bytes of the string chunk `chunk` past those builders
    /// wrote into it, and answers the byte they start at.
    ///
    /// # Errors
    ///
    /// `ArenaError::OutOfBounds` for a chunk that holds no strings, and
    /// `ArenaError::Full` for bytes past its end.
    pub(super) fn reserve_strings(&mut self, chunk: u32, size: u32) -> Result<u32, ArenaError> {
        let (mem, cells) = self.strings_of(chunk).ok_or(ArenaError::OutOfBounds { chunk, word: 0, len: size })?;
        // SAFETY: as `hold_text`.
        let bytes = unsafe { cells.slice_mut() };
        let byte = read_u32(bytes, STRINGS_WRITTEN);
        let end = byte.checked_add(size).filter(|&end| end as usize <= mem.len()).ok_or(ArenaError::Full)?;
        write_u32(bytes, STRINGS_WRITTEN, end);
        Ok(byte)
    }

    /// `more` counts more of the entry at `at`, whose count byte saturated.
    ///
    /// # Errors
    ///
    /// What reaching its count refuses, and `ArenaError::Malformed` for a
    /// count that has not saturated.
    pub fn bump(&mut self, at: Address, more: u32) -> Result<(), ArenaError> {
        let byte = *self.table(at.chunk())?.count(at.word())?;
        if byte & SATURATED != SATURATED {
            return Err(malformed("unsaturated count", u32::from(byte)));
        }
        *self.overflow.entry(at.0).or_insert(0) += more;
        Ok(())
    }

    /// The count byte of the entry at `at`, for debug checks on access.
    ///
    /// # Errors
    ///
    /// What reaching its count refuses.
    pub fn count_of(&mut self, at: Address) -> Result<u8, ArenaError> {
        self.table(at.chunk())?.count(at.word()).map(|byte| *byte)
    }

    /// Gives the one count of the record at `at` to the handle that names
    /// it (`OWNED`): what a parse does with its root's.
    ///
    /// # Errors
    ///
    /// What reaching its count refuses, and `ArenaError::Malformed` for a
    /// record held other than once.
    pub(crate) fn hand_to_handle(&mut self, at: Address) -> Result<(), ArenaError> {
        let byte = self.table(at.chunk())?.count(at.word())?;
        if *byte != 1 {
            return Err(malformed("record held other than once", u32::from(*byte)));
        }
        *byte |= OWNED;
        Ok(())
    }

    /// Holds the record at `at` once more for a holder that takes the handle
    /// naming it: moves the count that handle holds (`OWNED`), a builder's
    /// or a parse's root's, else takes one more (`hold`).
    ///
    /// # Errors
    ///
    /// As `hold`.
    pub fn adopt(&mut self, at: Address) -> Result<(), ArenaError> {
        let byte = self.table(at.chunk())?.count(at.word())?;
        if *byte & OWNED != 0 {
            *byte &= !OWNED;
            return Ok(());
        }
        self.hold(at)
    }

    /// Takes one more count of the record at `at` for a holder that only
    /// names it, leaving any count the handle naming it holds with that
    /// handle.
    ///
    /// # Errors
    ///
    /// What reaching its count refuses, and `ArenaError::Malformed` for a
    /// record whose count is gone.
    pub fn hold(&mut self, at: Address) -> Result<(), ArenaError> {
        self.hold_more(at, 1)
    }

    /// Takes `more` counts more of the record at `at`, as `hold` takes one:
    /// past the count byte's saturation, in the overflow.
    ///
    /// # Errors
    ///
    /// As `hold`.
    pub(crate) fn hold_more(&mut self, at: Address, more: u32) -> Result<(), ArenaError> {
        let byte = self.table(at.chunk())?.count(at.word())?;
        let count = u32::from(*byte & SATURATED);
        if count == 0 {
            return Err(malformed("released record", at.0));
        }
        let room = u32::from(SATURATED) - count;
        let into_byte = more.min(room);
        *byte += u8::try_from(into_byte).map_err(|_| malformed("count", at.0))?;
        if more > into_byte {
            *self.overflow.entry(at.0).or_insert(0) += more - into_byte;
        }
        Ok(())
    }

    /// Releases a count of `held`: with `owned`, the count the handle that
    /// names it holds, a builder's or a parse's root's, a no-op when it
    /// holds none or its chunk was freed. An entry whose count reaches zero releases what it holds,
    /// on an explicit stack: a record each entry its cells name, the cells'
    /// string chunks, its side record, and the records and leaf entries its
    /// sides in the store name, which `sides` drops and answers, each
    /// released as a cell naming it is; a parsed record, as its kind's shape
    /// lays out its cells, also its lists' runs and each record its side
    /// record's run names that no cell of it names; a link record the
    /// record it names a node of; a side record the source it names and the
    /// record its sides name. A sealed chunk left
    /// with no live entry is freed, a chunk a read wrote as a built one.
    ///
    /// # Errors
    ///
    /// `ARENA_RELEASED` once released; `ArenaError::Malformed` for a count
    /// below zero, an address no entry starts at, and a record whose kind
    /// has no shape; and what reading the entries refuses.
    pub fn release(&mut self, held: Held, owned: bool, sides: &mut dyn FnMut(Address) -> Vec<Address>) -> Result<(), ArenaError> {
        if self.released {
            return Err(ARENA_RELEASED);
        }
        let mut stack = Vec::new();
        if let Held::Text(at) = held {
            return self.drop_cell(at, &mut stack);
        }
        if owned {
            if self.freed(held.at().chunk()) {
                return Ok(());
            }
            let byte = self.table(held.at().chunk())?.count(held.at().word())?;
            if *byte & OWNED == 0 {
                return Ok(());
            }
            *byte &= !OWNED;
        }
        self.drop_count(held, &mut stack)?;
        while let Some(dead) = stack.pop() {
            self.release_held(dead, &mut stack, sides)?;
        }
        Ok(())
    }

    fn drop_count(&mut self, held: Held, stack: &mut Vec<Held>) -> Result<(), ArenaError> {
        if self.drop_one(held.at())? {
            stack.push(held);
        }
        Ok(())
    }

    /// Drops one count of the entry at `at`: true when it was the last.
    fn drop_one(&mut self, at: Address) -> Result<bool, ArenaError> {
        let byte = self.table(at.chunk())?.count(at.word())?;
        let count = *byte & SATURATED;
        if count == 0 {
            return Err(malformed("released count", at.0));
        }
        if count == SATURATED {
            if let Some(more) = self.overflow.get_mut(&at.0) {
                *more -= 1;
                if *more == 0 {
                    self.overflow.remove(&at.0);
                }
                return Ok(false);
            }
        }
        let byte = self.table(at.chunk())?.count(at.word())?;
        *byte -= 1;
        Ok(*byte & SATURATED == 0)
    }

    /// Drops the count of the entry at `at` its one holder holds, an entry
    /// whose items its holder releases: a parsed record's list run.
    fn retire(&mut self, at: Address) -> Result<(), ArenaError> {
        if self.drop_one(at)? {
            self.dead(at)?;
        }
        Ok(())
    }

    fn drop_cell(&mut self, at: Address, stack: &mut Vec<Held>) -> Result<(), ArenaError> {
        if at.chunk() == 0 {
            return Ok(());
        }
        match self.chunks.get_mut(at.chunk() as usize) {
            Some(Some(BuiltChunk::Words { .. })) => self.drop_count(Held::Record(at), stack),
            Some(Some(BuiltChunk::Bytes { cells, .. })) => {
                // SAFETY: as `CountTable::bytes`.
                let bytes = unsafe { cells.slice_mut() };
                let count = read_u32(bytes, 0);
                if count == 0 {
                    return Err(malformed("released string count", at.chunk()));
                }
                write_u32(bytes, 0, count - 1);
                if count == 1 {
                    self.seal_check(at.chunk());
                }
                Ok(())
            }
            _ => Err(ArenaError::OutOfBounds { chunk: at.chunk(), word: at.word(), len: 1 }),
        }
    }

    fn release_held(&mut self, held: Held, stack: &mut Vec<Held>, sides: &mut dyn FnMut(Address) -> Vec<Address>) -> Result<(), ArenaError> {
        match held {
            Held::Record(at) => {
                let header = self.word(at)?;
                match header_of(header, self.kind_bits) {
                    (_, flag::LINK) => {
                        let holder = self.word(at.offset(2).ok_or(malformed("link record", at.0))?)?;
                        self.drop_cell(Address(holder), stack)?;
                    }
                    (kind, 0) if self.read_chunk(at.chunk()) => self.release_parsed(at, kind, stack, sides)?,
                    (kind, 0) => self.release_record(at, kind, stack, sides)?,
                    (_, flags) => return Err(malformed("record flags", flags)),
                }
            }
            Held::Run(at) => {
                let items: Vec<CellWord> = ListCell::of_run(at, self)?.items(self, 1)?.map(|item| CellWord(item[0])).collect();
                for item in items {
                    self.drop_cell(item.address(), stack)?;
                }
            }
            Held::Side(at) => {
                let (side, _) = SideRecord::read_facts(self, at)?;
                if let Some(source) = side.source {
                    if let Some(read) = super::source::Source::read_side_of(self, Address(source))? {
                        self.drop_count(Held::Side(read), stack)?;
                    }
                    self.drop_cell(Address(source), stack)?;
                }
                if let Some(sides) = side.sides {
                    self.drop_cell(Address(sides.tree.0), stack)?;
                }
            }
            Held::Text(at) => return Err(malformed("text entry on the release stack", at.0)),
        }
        self.dead(held.at())
    }

    /// One fewer live entry in the chunk `at` lies in, an entry whose count
    /// reached zero; a sealed chunk left with none is freed.
    fn dead(&mut self, at: Address) -> Result<(), ArenaError> {
        let table = self.table(at.chunk())?;
        let live = table.live();
        if live == 0 {
            return Err(malformed("released live count", at.chunk()));
        }
        table.set_live(live - 1);
        if live == 1 {
            self.seal_check(at.chunk());
        }
        Ok(())
    }

    fn release_record(&mut self, at: Address, kind: KindId, stack: &mut Vec<Held>, sides: &mut dyn FnMut(Address) -> Vec<Address>) -> Result<(), ArenaError> {
        let shape: RecordShape = (self.shape)(kind).ok_or(malformed("released record kind", u32::from(kind.0)))?;
        let mut cells = Vec::with_capacity(shape.cells.len());
        built_cells(self, at, shape, Lists::Runs, |cell, _, word| {
            cells.push((cell.run.is_some(), word));
            Ok(())
        })?;
        let side = super::borrowed::side_of(self, at)?;
        if side != Address::NONE {
            self.drop_count(Held::Side(side), stack)?;
        }
        for (list, word) in cells {
            match (list, word) {
                (true, CellWord(0)) => {}
                (true, run) => self.drop_count(Held::Run(run.address()), stack)?,
                (false, cell) => self.drop_cell(cell.address(), stack)?,
            }
        }
        for entry in sides(at) {
            self.drop_cell(entry, stack)?;
        }
        Ok(())
    }

    fn release_parsed(&mut self, at: Address, kind: KindId, stack: &mut Vec<Held>, sides: &mut dyn FnMut(Address) -> Vec<Address>) -> Result<(), ArenaError> {
        let shape: RecordShape = (self.shape)(kind).ok_or(malformed("released record kind", u32::from(kind.0)))?;
        let (mut named, mut runs) = (Vec::new(), Vec::new());
        parsed_cell_walk(self, at, shape, self.kind_bits, |walked| {
            match walked {
                ParsedCell::Run(run) => runs.push(run),
                ParsedCell::Cell(_, _, Cell::Child { at, .. }) => named.push(at),
                ParsedCell::Cell(..) => {}
            }
            Ok(())
        })?;
        named.sort_unstable();
        let side = super::borrowed::side_of(self, at)?;
        let run = if side == Address::NONE { None } else { SideRecord::read_facts(self, side)?.1 };
        let unnamed: Vec<Address> = match run {
            Some(run) => run.entries(self)?.into_iter().filter_map(|entry| match entry {
                RunEntry::Record { at, .. } if named.binary_search(&at).is_err() => Some(at),
                _ => None,
            }).collect(),
            None => Vec::new(),
        };
        for run in runs {
            self.retire(run)?;
        }
        for child in named.into_iter().chain(unnamed) {
            self.drop_count(Held::Record(child), stack)?;
        }
        if side != Address::NONE {
            self.drop_count(Held::Side(side), stack)?;
        }
        for entry in sides(at) {
            self.drop_cell(entry, stack)?;
        }
        Ok(())
    }

    /// Whether the record at `from` reaches the record at `target` through
    /// its cells, `from` itself included. A read's record is not walked: its
    /// cells name only records of its own tree.
    ///
    /// # Errors
    ///
    /// What reading the records refuses.
    pub fn reaches(&self, from: Address, target: Address) -> Result<bool, ArenaError> {
        let mut stack = vec![from];
        let mut seen = std::collections::HashSet::new();
        while let Some(at) = stack.pop() {
            if at == target {
                return Ok(true);
            }
            if !seen.insert(at) || self.read_chunk(at.chunk()) {
                continue;
            }
            let (kind, flags) = header_of(self.word(at)?, self.kind_bits);
            if flags != 0 {
                continue;
            }
            let shape = (self.shape)(kind).ok_or(malformed("record kind", u32::from(kind.0)))?;
            built_cells(self, at, shape, Lists::Items, |_, _, word| {
                let at = word.address();
                if at.chunk() != 0 && self.chunk(at.chunk()).is_some() {
                    stack.push(at);
                }
                Ok(())
            })?;
        }
        Ok(false)
    }

    /// Frees chunk `chunk` when it is sealed and holds nothing live.
    pub(super) fn seal_check(&mut self, chunk: u32) {
        if self.open.contains(&Some(chunk)) {
            return;
        }
        let dead = match self.chunks.get_mut(chunk as usize) {
            Some(Some(BuiltChunk::Words { counts, .. })) => counts.live() == 0,
            Some(Some(BuiltChunk::Bytes { cells, .. })) => {
                // SAFETY: as `CountTable::bytes`.
                read_u32(unsafe { cells.slice() }, 0) == 0
            }
            _ => false,
        };
        if dead {
            self.drop_chunk(chunk);
            if self.sources.is_some_and(|(open, _)| open == chunk) {
                self.sources = None;
            }
            if self.reads.is_some_and(|(open, _)| open == chunk) {
                self.reads = None;
            }
            self.overflow.retain(|&at, _| Address(at).chunk() != chunk);
            self.free.push_back(chunk);
            self.freed.push(chunk);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::arena::cell::with_kind;
    use crate::arena::{CellShape, ChunkMem};
    use crate::record::form;

    const PAIR: KindId = KindId(5);
    const LEAF: KindId = KindId(6);
    const BITS: u32 = 9;

    fn shape(kind: KindId) -> Option<RecordShape> {
        const CELLS: &[CellShape] = &[
            CellShape { word: 2, width: 3, run: None, forms: form::NODE, built: 2, key: "_child" },
            CellShape { word: 5, width: 1, run: Some(3), forms: form::NODE, built: 3, key: "_items" },
        ];
        match kind {
            PAIR => Some(RecordShape { words: 6, built_words: 4, cells: CELLS, ..RecordShape::BARE }),
            LEAF => Some(RecordShape { words: 2, built_words: 2, cells: &[], ..RecordShape::BARE }),
            _ => None,
        }
    }

    /// A built arena JavaScript's builders would write: entries placed in
    /// order in one open words chunk, each with its count.
    struct Builder {
        arena: BuiltChunks,
        chunk: u32,
        mem: Arc<ChunkMem<u32>>,
        used: u32,
        ranked: usize,
    }

    impl Builder {
        fn new() -> Self {
            let mut arena = BuiltChunks::new(BITS, shape);
            let made = arena.alloc_words(1024).expect("a chunk");
            Self { arena, chunk: made.chunk, mem: made.mem, used: 0, ranked: 0 }
        }

        fn place(&mut self, words: &[u32], count: u8) -> Address {
            let word = self.used;
            self.used += u32::try_from(words.len()).expect("a length");
            // SAFETY: no other slice of the chunk is live in a test.
            let chunk = unsafe { self.mem.slice_mut() };
            chunk[word as usize..self.used as usize].copy_from_slice(words);
            let table = self.arena.table(self.chunk).expect("a words chunk");
            let blocks = table.blocks;
            let bytes = table.bytes();
            let ordinal = read_u32(bytes, PLACED);
            write_u32(bytes, PLACED, ordinal + 1);
            let live = read_u32(bytes, LIVE);
            write_u32(bytes, LIVE, live + 1);
            let block = (word / 64) as usize;
            while self.ranked <= block {
                let at = META_HEAD + blocks * 8 + self.ranked * 2;
                bytes[at..at + 2].copy_from_slice(&u16::try_from(ordinal).expect("an ordinal").to_ne_bytes());
                self.ranked += 1;
            }
            let at = META_HEAD + block * 8 + if word % 64 >= 32 { 4 } else { 0 };
            let bits = read_u32(bytes, at) | 1 << (word % 32);
            write_u32(bytes, at, bits);
            let entry = Address::new(self.chunk, word).expect("an address");
            *self.arena.table(self.chunk).expect("a words chunk").count(word).expect("its count") = count;
            entry
        }

        fn leaf(&mut self) -> Address {
            self.place(&[with_kind(LEAF, BITS).expect("a kind"), 0], OWNED | 1)
        }

        fn pair(&mut self, child: Address, list: Address) -> Address {
            for held in [child, list] {
                if held != Address::NONE && self.arena.chunk(held.chunk()).is_some() && list != held {
                    self.arena.adopt(held).expect("held");
                }
            }
            let list = if list == Address::NONE { 0 } else { list.0 << 2 };
            self.place(&[with_kind(PAIR, BITS).expect("a kind"), 0, child.0 << 2, list], OWNED | 1)
        }

        fn run(&mut self, items: &[Address]) -> Address {
            for &item in items {
                self.arena.adopt(item).expect("held");
            }
            let mut words = vec![u32::try_from(items.len()).expect("a length")];
            words.extend(items.iter().map(|item| item.0 << 2));
            self.place(&words, 1)
        }

        fn release(&mut self, at: Address, owned: bool) -> Result<(), ArenaError> {
            self.arena.release(Held::Record(at), owned, &mut |_| Vec::new())
        }
    }

    #[test]
    fn releasing_a_root_releases_what_only_it_held_and_keeps_what_another_holds() {
        let mut built = Builder::new();
        let (only, shared) = (built.leaf(), built.leaf());
        let first = built.pair(only, Address::NONE);
        let list = built.run(&[shared]);
        let second = built.pair(shared, list);
        built.release(first, true).expect("released");
        assert!(built.arena.released(first) && built.arena.released(only), "the root and the leaf only it held");
        assert!(!built.arena.released(shared), "the second root still holds the shared leaf, through its cell and its list");
        built.release(second, true).expect("released");
        assert!([second, list, shared].into_iter().all(|at| built.arena.released(at)));
    }

    #[test]
    fn releasing_a_root_drops_its_count_of_a_read_s_record_and_the_read_s_own_count_frees_it() {
        use crate::arena::{ReadWriter, RecordSpace};
        let mut built = Builder::new();
        let read = ReadWriter::new(&mut built.arena).push(&[with_kind(LEAF, BITS).expect("a kind"), 0]).expect("a read's record");
        let root = built.pair(read, Address::NONE);
        built.release(root, true).expect("released");
        assert!(built.arena.released(root) && !built.arena.released(read), "the read still holds its record");
        built.release(read, false).expect("the read's count");
        assert!(built.arena.take_freed().contains(&read.chunk()), "the read's chunk, left with nothing live, is freed");
    }

    #[test]
    fn a_later_read_writes_on_in_the_chunk_the_read_before_it_left_open() {
        use crate::arena::{ReadWriter, RecordSpace, CHUNK_WORDS};
        let mut arena = BuiltChunks::new(BITS, shape);
        let first = ReadWriter::new(&mut arena).alloc(6).expect("a record");
        let second = ReadWriter::new(&mut arena).alloc(6).expect("a record");
        assert_eq!((second.chunk(), second.word()), (first.chunk(), first.word() + 6), "the second read's record follows the first's");
        let whole = ReadWriter::new(&mut arena).alloc(CHUNK_WORDS).expect("a record");
        assert_ne!(whole.chunk(), first.chunk(), "a record the open chunk has no room for takes the next");
        assert!(arena.read_chunk(first.chunk()) && arena.read_chunk(whole.chunk()));
    }

    #[test]
    fn a_released_read_s_record_releases_the_records_its_cells_name() {
        use crate::arena::{ReadWriter, RecordSpace};
        let mut built = Builder::new();
        let mut reads = ReadWriter::new(&mut built.arena);
        let child = reads.push(&[with_kind(LEAF, BITS).expect("a kind"), 0]).expect("a read's record");
        let parsed = reads.push(&[with_kind(PAIR, BITS).expect("a kind"), 0, with_kind(LEAF, BITS).expect("a kind"), child.0, 0, 0]).expect("a read's record");
        built.release(parsed, false).expect("released");
        assert!(built.arena.take_freed().contains(&parsed.chunk()), "the record, the child its cell names, and with them the chunk");
    }

    #[test]
    fn a_released_record_drops_what_its_sides_name_as_a_cell_naming_it_does() {
        let mut built = Builder::new();
        let side = built.leaf();
        built.arena.adopt(side).expect("the side holds it");
        let text = crate::arena::BuiltWriter::new(&mut built.arena).entry(LEAF, "// a").expect("a leaf entry");
        let read = crate::arena::RecordSpace::push(&mut crate::arena::ReadWriter::new(&mut built.arena), &[with_kind(LEAF, BITS).expect("a kind"), 0]).expect("a read's record");
        built.arena.adopt(read).expect("the side holds it");
        let root = built.leaf();
        built.arena.release(Held::Record(root), true, &mut |at| if at == root { vec![side, text, read] } else { Vec::new() }).expect("released");
        assert!(built.arena.released(root) && built.arena.released(side), "a record a side names");
        assert_eq!(built.arena.text_count(text.chunk()), Some(0), "a leaf entry a side names gives back its string count");
        assert_eq!(built.arena.count_of(read), Ok(1), "a read's record a side names gives back the side's count");
    }

    #[test]
    fn a_handle_that_holds_no_count_releases_nothing_and_a_count_below_zero_refuses() {
        let mut built = Builder::new();
        let leaf = built.leaf();
        let root = built.pair(leaf, Address::NONE);
        built.release(leaf, true).expect("a moved handle holds no count");
        assert!(!built.arena.released(leaf));
        built.release(root, true).expect("released");
        assert_eq!(built.release(leaf, false), Err(malformed("released count", leaf.0)));
    }

    #[test]
    fn a_saturated_count_spends_its_overflow_first() {
        let mut built = Builder::new();
        let leaf = built.leaf();
        built.arena.adopt(leaf).expect("moved");
        *built.arena.table(built.chunk).expect("a table").count(leaf.word()).expect("its count") = SATURATED;
        built.arena.bump(leaf, 2).expect("bumped");
        built.release(leaf, false).expect("the overflow");
        built.release(leaf, false).expect("the overflow's second");
        assert_eq!(built.arena.count_of(leaf), Ok(SATURATED));
        built.release(leaf, false).expect("the byte");
        assert_eq!(built.arena.count_of(leaf), Ok(SATURATED - 1));
    }

    #[test]
    fn a_sealed_chunk_left_with_nothing_live_is_freed_and_its_number_comes_back_last() {
        let mut built = Builder::new();
        let leaf = built.leaf();
        let first = built.chunk;
        built.arena.alloc_words(1024).expect("a second chunk seals the first");
        assert!(built.arena.take_freed().is_empty(), "the first still holds the leaf");
        built.release(leaf, true).expect("released");
        assert_eq!(built.arena.take_freed(), vec![first]);
        assert!(built.arena.chunk(first).is_none());
        assert_eq!(built.arena.free.front(), Some(&first));
    }

    #[test]
    fn the_bytes_the_chunks_take_are_kept_as_reads_and_builds_take_seal_and_free_them() {
        use crate::arena::source::Source;
        use crate::arena::{ReadWriter, RecordSpace, CHUNK_WORDS, STRING_CHUNK_BYTES};
        fn kept(arena: &BuiltChunks, after: &str) {
            assert_eq!(arena.allocated_bytes(), arena.chunks.iter().flatten().map(BuiltChunk::byte_len).sum::<usize>(), "after {after}");
        }
        let mut built = Builder::new();
        let first = built.chunk;
        let leaf = built.leaf();
        kept(&built.arena, "a build's chunk");
        ReadWriter::new(&mut built.arena).alloc(6).expect("a read's record");
        kept(&built.arena, "a read's record");
        ReadWriter::new(&mut built.arena).alloc(CHUNK_WORDS + 1).expect("a read's record wider than a chunk");
        kept(&built.arena, "a read's record wider than a chunk");
        built.arena.write_source(&Source { text: "fn f() {}\n", breaks_lf: true }).expect("a read's source");
        kept(&built.arena, "a read's source");
        built.arena.write_source(&Source { text: &"x".repeat(STRING_CHUNK_BYTES as usize), breaks_lf: true }).expect("a source wider than a chunk");
        kept(&built.arena, "a source wider than a chunk");
        let unsealed = built.arena.chunks[first as usize].as_ref().map(BuiltChunk::byte_len);
        built.arena.alloc_words(1024).expect("a second chunk seals the first");
        assert!(built.arena.chunks[first as usize].as_ref().map(BuiltChunk::byte_len) < unsealed, "the seal sizes the first chunk's meta for its one entry");
        kept(&built.arena, "a seal");
        built.release(leaf, true).expect("released");
        assert_eq!(built.arena.take_freed(), vec![first]);
        kept(&built.arena, "a chunk freed");
        built.arena.open_strings(8).expect("a builder's string chunk");
        kept(&built.arena, "a builder's string chunk");
        let total = built.arena.allocated_bytes();
        assert_eq!(built.arena.release_all(), total);
        assert_eq!(built.arena.allocated_bytes(), 0);
    }

    #[test]
    fn a_released_link_record_drops_its_count_of_its_holder_s_record() {
        use crate::arena::{ReadWriter, RecordSpace};
        let mut built = Builder::new();
        let holder = ReadWriter::new(&mut built.arena).push(&[with_kind(LEAF, BITS).expect("a kind"), 0]).expect("a read's record");
        built.arena.adopt(holder).expect("the link holds it");
        let link = built.place(&[with_kind(LEAF, BITS).expect("a kind") | flag::LINK << BITS, 0, holder.0, 1, 2, 0, 0, 3], 1);
        built.release(link, false).expect("released");
        assert_eq!(built.arena.count_of(holder), Ok(1), "the read still holds it");
    }

    #[test]
    fn a_read_s_record_a_built_record_names_is_not_walked_as_a_built_one() {
        use crate::arena::{ReadWriter, RecordSpace};
        let mut built = Builder::new();
        let target = built.leaf();
        let mut reads = ReadWriter::new(&mut built.arena);
        let child = reads.push(&[with_kind(LEAF, BITS).expect("a kind"), 0]).expect("a read's record");
        let parsed = reads.push(&[with_kind(PAIR, BITS).expect("a kind"), 0, with_kind(LEAF, BITS).expect("a kind"), child.0, 0, 0]).expect("a read's record");
        let root = built.place(&[with_kind(PAIR, BITS).expect("a kind"), 0, parsed.0 << 2, 0], OWNED | 1);
        assert_eq!(built.arena.reaches(root, target), Ok(false), "a read's record names only records of its own tree");
        assert_eq!(built.arena.reaches(root, parsed), Ok(true));
    }

    #[test]
    fn a_record_reaches_what_its_cells_and_lists_name() {
        let mut built = Builder::new();
        let (child, item) = (built.leaf(), built.leaf());
        let list = built.run(&[item]);
        let root = built.pair(child, list);
        assert_eq!(built.arena.reaches(root, item), Ok(true));
        assert_eq!(built.arena.reaches(child, root), Ok(false));
    }
}
