//! A built arena image a test writes, in the form JavaScript's builders
//! write one: word and string chunks numbered from one count from 1, records
//! and link records in word chunks, leaf entries in string chunks.

use super::cell::{flag, with_kind, LINK_WORDS};
use super::{Address, ArenaRead, CHUNK_WORDS};
use crate::slot::ChangedEdges;
use crate::types::{KindId, NodeIndex, Span, TreeId};

enum ImageChunk {
    Words(Vec<u32>),
    Bytes(Vec<u8>),
}

/// A built arena whose chunks a test appends to.
pub(crate) struct BuiltImage {
    chunks: Vec<Option<ImageChunk>>,
    kind_bits: u32,
}

impl BuiltImage {
    pub(crate) fn new(kind_bits: u32) -> Self {
        Self { chunks: vec![None], kind_bits }
    }

    fn header(&self, kind: KindId, high: u32) -> u32 {
        with_kind(kind, self.kind_bits).expect("a kind the width holds") | high << self.kind_bits
    }

    pub(crate) fn address(chunk: usize, offset: usize) -> Address {
        Address::new(u32::try_from(chunk).expect("a chunk number"), u32::try_from(offset).expect("an offset")).expect("an address")
    }

    /// A new word chunk holding no words yet, which `record_in` writes to by
    /// its number whatever chunks are opened after it.
    pub(crate) fn open_chunk(&mut self) -> usize {
        self.chunks.push(Some(ImageChunk::Words(Vec::new())));
        self.chunks.len() - 1
    }

    /// `words` at the end of the last word chunk, or in a chunk of their own
    /// when the last chunk is a string chunk or has no room.
    pub(crate) fn words(&mut self, words: &[u32]) -> Address {
        let fits = matches!(self.chunks.last(), Some(Some(ImageChunk::Words(last))) if last.len() + words.len() <= CHUNK_WORDS as usize);
        let chunk = if fits { self.chunks.len() - 1 } else { self.open_chunk() };
        self.words_in(chunk, words)
    }

    /// `words` at the end of word chunk `chunk`.
    fn words_in(&mut self, chunk: usize, words: &[u32]) -> Address {
        let Some(Some(ImageChunk::Words(held))) = self.chunks.get_mut(chunk) else { panic!("chunk {chunk} is no word chunk") };
        let at = Self::address(chunk, held.len());
        held.extend_from_slice(words);
        at
    }

    /// A leaf entry of `kind` holding `text`, `KindId::BLANK` for a text
    /// slot's.
    pub(crate) fn entry(&mut self, kind: KindId, text: &str) -> Address {
        self.entry_claiming(kind, u32::try_from(text.len()).expect("a text length"), text)
    }

    /// A leaf entry of `kind` whose header claims `len` bytes, holding
    /// `text`.
    pub(crate) fn entry_claiming(&mut self, kind: KindId, len: u32, text: &str) -> Address {
        let mut bytes = self.header(kind, len).to_ne_bytes().to_vec();
        bytes.extend_from_slice(text.as_bytes());
        bytes.resize(bytes.len().next_multiple_of(4), 0);
        let n = self.chunks.len() - 1;
        if let Some(Some(ImageChunk::Bytes(last))) = self.chunks.last_mut() {
            let at = Self::address(n, last.len());
            last.extend_from_slice(&bytes);
            return at;
        }
        self.chunks.push(Some(ImageChunk::Bytes(bytes)));
        Self::address(self.chunks.len() - 1, 0)
    }

    /// A record of `kind` `words` long, its cells at their built words.
    pub(crate) fn record(&mut self, kind: KindId, words: u32, cells: &[(u32, u32)]) -> Address {
        let image = self.record_words(kind, words, cells);
        self.words(&image)
    }

    /// A record as `record` writes it, at the end of word chunk `chunk`.
    pub(crate) fn record_in(&mut self, chunk: usize, kind: KindId, words: u32, cells: &[(u32, u32)]) -> Address {
        let image = self.record_words(kind, words, cells);
        self.words_in(chunk, &image)
    }

    fn record_words(&self, kind: KindId, words: u32, cells: &[(u32, u32)]) -> Vec<u32> {
        let mut image = vec![0; words as usize];
        image[0] = self.header(kind, 0);
        for &(word, cell) in cells {
            image[word as usize] = cell;
        }
        image
    }

    /// The link record of the parsed node at `row` of `tree`, whose record
    /// is `record`, `Address::NONE` for a node without one.
    pub(crate) fn link(&mut self, kind: KindId, tree: TreeId, row: NodeIndex, end: NodeIndex, record: Address, span: Span) -> Address {
        let words: [u32; LINK_WORDS as usize] = [self.header(kind, flag::LINK), 0, tree.0, row.0, end.0, record.0, span.start, span.end];
        self.words(&words)
    }

    /// The list cell of a run holding `items`, in a chunk of its own when it
    /// does not fit the last one.
    pub(crate) fn run(&mut self, items: &[u32]) -> u32 {
        let mut run = vec![u32::try_from(items.len()).expect("a list length")];
        run.extend_from_slice(items);
        if run.len() > CHUNK_WORDS as usize {
            self.chunks.push(Some(ImageChunk::Words(run)));
            return Self::address(self.chunks.len() - 1, 0).0 << 2;
        }
        self.words(&run).0 << 2
    }
}

/// The built cell naming `at`, with the edges `changed`.
pub(crate) fn built_cell(at: Address, changed: ChangedEdges) -> u32 {
    at.0 << 2 | u32::from(changed.leading) | u32::from(changed.trailing) << 1
}

/// The built cell of a unit of `kind`.
pub(crate) fn unit_cell(kind: KindId) -> u32 {
    u32::from(kind.0) << 2
}

impl ArenaRead for BuiltImage {
    fn chunk(&self, n: u32) -> Option<&[u32]> {
        match self.chunks.get(n as usize)? {
            Some(ImageChunk::Words(words)) => Some(words),
            _ => None,
        }
    }

    fn string_chunk(&self, n: u32) -> Option<&[u8]> {
        match self.chunks.get(n as usize)? {
            Some(ImageChunk::Bytes(bytes)) => Some(bytes),
            _ => None,
        }
    }
}
