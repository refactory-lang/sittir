//! A record's side record: the layout facts beside its slots. Word 0 is a
//! mask of the fields present, and the fields follow in a fixed order:
//! `at` (kind, byte start, byte end), `edges`, `span`, `sides`, `delimiter`,
//! `separator_kind`, `flanks`, `slots`. `changed` is two bits of the mask.
//! The record's sides and its unit and leaf sites' are in a side record of
//! rows (`RowFields`) written over it, which names it.

use super::cell::CellWord;
use super::{Address, ArenaError, ArenaRead, RecordSpace};
use crate::options::{EdgeArm, Edges};
use crate::points::{Point, PointSpan};
use crate::slot::ChangedEdges;
use crate::spacing::SeamStrength;
use crate::trivia_table::TriviaSide;
use crate::types::{Delimiter, FieldId, KindId, NodeIndex, Span, TreeId};

/// The fields a reader of a record finds before a list's delimiters
/// setting, in the order the side record holds them after its mask word:
/// each one's mask bit and the words it takes, then the list settings a
/// builder writes, the delimiters and the chosen separator, one word each.
/// The addon exports them: JavaScript reads a parsed record's row and a
/// list's delimiters setting through them, and writes a built list's
/// settings and the edges a copied leaf's one holder changed, two flags
/// that take no words.
pub mod field {
    pub const AT: u32 = super::mask::AT;
    pub const AT_WORDS: u32 = 3;
    pub const EDGES: u32 = super::mask::EDGES;
    pub const EDGES_WORDS: u32 = 2;
    pub const SPAN: u32 = super::mask::SPAN;
    pub const SPAN_WORDS: u32 = 4;
    pub const SIDES: u32 = super::mask::SIDES;
    pub const SIDES_WORDS: u32 = 5;
    pub const CHANGED_LEADING: u32 = super::mask::CHANGED_LEADING;
    pub const CHANGED_TRAILING: u32 = super::mask::CHANGED_TRAILING;
    pub const DELIMITER: u32 = super::mask::DELIMITER;
    pub const SEPARATOR_KIND: u32 = super::mask::SEPARATOR_KIND;
    pub const LEADING: u32 = super::mask::LEADING;
    pub const TRAILING: u32 = super::mask::TRAILING;
    pub const INNER: u32 = super::mask::INNER;
    pub const SITES: u32 = super::mask::SITES;
    pub const SITE_WORDS: u32 = 2;
    pub const NEXT: u32 = super::mask::NEXT;
}

pub(crate) mod mask {
    pub const AT: u32 = 1;
    pub const EDGES: u32 = 1 << 1;
    pub const SPAN: u32 = 1 << 2;
    pub const SIDES: u32 = 1 << 3;
    pub const CHANGED_LEADING: u32 = 1 << 4;
    pub const CHANGED_TRAILING: u32 = 1 << 5;
    pub const SLOTS: u32 = 1 << 6;
    pub const DELIMITER: u32 = 1 << 7;
    pub const SEPARATOR_KIND: u32 = 1 << 8;
    pub const FLANKS: u32 = 1 << 9;
    pub const PARENT: u32 = 1 << 10;
    pub const NODE: u32 = 1 << 11;
    pub const SOURCE: u32 = 1 << 12;
    pub const DEPTH: u32 = 1 << 13;
    pub const RUN: u32 = 1 << 14;
    pub const SPANS: u32 = 1 << 15;
    pub const STARTS: u32 = 1 << 16;
    pub const CONTENT: u32 = 1 << 17;
    pub const HELD_BY_ERROR: u32 = 1 << 18;
    pub const LEADING: u32 = 1 << 19;
    pub const TRAILING: u32 = 1 << 20;
    pub const INNER: u32 = 1 << 21;
    pub const SITES: u32 = 1 << 22;
    pub const NEXT: u32 = 1 << 23;
    /// The fields of a side record of rows (`RowFields`), which holds no
    /// other field.
    pub const ROWS: u32 = LEADING | TRAILING | INNER | SITES | NEXT;
    pub const ALL: u32 = (1 << 24) - 1;
}

/// A side record of rows: the side record it was written over, which holds
/// the record's other side fields, and the record's rows, each the list cell
/// of a run of the cells a list holds (a record cell for a comment record,
/// a leaf entry's cell for a leaf comment, a unit cell for a layout member;
/// 0 for an empty row): its leading, trailing and inner rows, and the rows
/// of its unit and leaf sites, each by its key (`RowFields::site_key`), in
/// key order. It holds a count of each run it names and of the side record
/// under it, and nothing else, so a write of a row copies it alone.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RowFields {
    pub next: Option<Address>,
    pub leading: Option<CellWord>,
    pub trailing: Option<CellWord>,
    pub inner: Option<CellWord>,
    pub sites: Vec<(u32, CellWord)>,
}

impl RowFields {
    /// The bits of a site's key that hold its side, below its item.
    pub const SIDE_BITS: u32 = 1;

    /// The key of the `side` (0 leading, 1 trailing) of the unit or leaf at
    /// item `item` of the slot whose stamped word is `word`.
    #[must_use]
    pub const fn site_key(word: u32, item: u32, side: u32) -> u32 {
        ((word << crate::types::NodeId::ITEM_BITS) | item) << Self::SIDE_BITS | side
    }

    /// The slot word, the item and the side (0 leading, 1 trailing) a
    /// site's key holds (`site_key`).
    #[must_use]
    pub const fn site_of(key: u32) -> (u32, u32, u32) {
        let site = key >> Self::SIDE_BITS;
        (site >> crate::types::NodeId::ITEM_BITS, site & ((1 << crate::types::NodeId::ITEM_BITS) - 1), key & ((1 << Self::SIDE_BITS) - 1))
    }

    /// Whether the side record holds no row and names no side record.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        *self == RowFields::default()
    }

    /// Each row's list cell, the sites' among them, empty rows included.
    pub fn cells(&self) -> impl Iterator<Item = CellWord> + '_ {
        [self.leading, self.trailing, self.inner].into_iter().flatten().chain(self.sites.iter().map(|&(_, cell)| cell))
    }

    /// Whether it holds a row, `next` aside.
    #[must_use]
    pub fn holds_rows(&self) -> bool {
        self.cells().next().is_some()
    }

    /// The row of the record's own `side`.
    #[must_use]
    pub const fn side_row(&self, side: TriviaSide) -> Option<CellWord> {
        match side {
            TriviaSide::Leading => self.leading,
            TriviaSide::Trailing => self.trailing,
            TriviaSide::Inner => self.inner,
        }
    }

    /// The row of the record's own `side`, to set.
    pub fn side_row_mut(&mut self, side: TriviaSide) -> &mut Option<CellWord> {
        match side {
            TriviaSide::Leading => &mut self.leading,
            TriviaSide::Trailing => &mut self.trailing,
            TriviaSide::Inner => &mut self.inner,
        }
    }

    /// The row of the site whose key is `key` (`site_key`).
    #[must_use]
    pub fn site_row(&self, key: u32) -> Option<CellWord> {
        self.sites.binary_search_by_key(&key, |&(key, _)| key).ok().map(|n| self.sites[n].1)
    }

    /// The site whose key is `key` holds the row `cell`, or none, the sites
    /// kept in key order.
    pub fn set_site_row(&mut self, key: u32, cell: Option<CellWord>) {
        match (self.sites.binary_search_by_key(&key, |&(key, _)| key), cell) {
            (Ok(n), Some(cell)) => self.sites[n].1 = cell,
            (Ok(n), None) => {
                self.sites.remove(n);
            }
            (Err(n), Some(cell)) => self.sites.insert(n, (key, cell)),
            (Err(_), None) => {}
        }
    }

    /// The header word of the record at `at`, the side record its header
    /// names, and that side record's rows when it is a side record of rows
    /// (`of_side`): one lookup of the record's chunk for a record whose side
    /// record lies there and holds no rows.
    ///
    /// # Errors
    ///
    /// What reading the record's header and its side record refuses.
    pub fn of_record(arena: &dyn ArenaRead, at: Address) -> Result<(u32, Address, Option<RowFields>), ArenaError> {
        let (header, side, mask) = super::header_side_mask(arena, at)?;
        Ok((header, side, Self::of_side(arena, side, mask)?))
    }

    /// The rows of the side record at `side`, `mask` its mask when its
    /// caller read it: none for address 0 and for a side record of other
    /// fields, which `mask` tells without a read.
    ///
    /// # Errors
    ///
    /// What reading the side record refuses.
    pub fn of_side(arena: &dyn ArenaRead, side: Address, mask: Option<u32>) -> Result<Option<RowFields>, ArenaError> {
        if side == Address::NONE || mask.is_some_and(|mask| mask & mask::ROWS == 0) {
            return Ok(None);
        }
        Self::read(arena, side)
    }

    /// The cells of the row whose list cell is `cell`: none for an empty
    /// row.
    ///
    /// # Errors
    ///
    /// What reading the run refuses.
    pub fn row_cells(arena: &dyn ArenaRead, cell: CellWord) -> Result<impl Iterator<Item = CellWord> + '_, ArenaError> {
        Ok(super::ListCell::of_word(cell, arena)?.items(arena, 1)?.map(|item| CellWord(item[0])))
    }

    /// The row of `cells` placed in `chunks` as a run, held once by the
    /// cell answered; the empty row for none.
    ///
    /// # Errors
    ///
    /// What placing the run refuses.
    pub fn place_row(chunks: &mut super::BuiltChunks, cells: &[CellWord]) -> Result<CellWord, ArenaError> {
        if cells.is_empty() {
            return Ok(CellWord(0));
        }
        let mut words = Vec::with_capacity(cells.len() + 1);
        words.push(u32::try_from(cells.len()).map_err(|_| ArenaError::Full)?);
        words.extend(cells.iter().map(|cell| cell.0));
        super::ListCell::word(super::ReadWriter::new(chunks).push(&words)?)
    }

    /// The record at `at`, whose header names the side record `side` with
    /// the rows `old` (`of_record`), holds the rows `rows` in their place,
    /// each row new to it already placed and held once. A side record of
    /// rows names the side record it was written over, whose count word 1
    /// held. One held only by `at` and of the same fields is rewritten in
    /// place; any other is written anew, holding once more each run it
    /// keeps and the side record under it, and `at`'s count of the old one
    /// given back. A run the record no longer names is released.
    ///
    /// # Errors
    ///
    /// What reading or releasing the entries refuses, and what `words`
    /// refuses.
    pub fn write_over(chunks: &mut super::BuiltChunks, at: Address, side: Address, old: Option<&RowFields>, mut rows: RowFields) -> Result<(), ArenaError> {
        use super::count::Held;
        rows.next = match old {
            Some(old) => old.next,
            None => (side != Address::NONE).then_some(side),
        };
        let Some(old) = old else {
            if rows.holds_rows() {
                let new = super::ReadWriter::new(chunks).push(&rows.words()?)?;
                super::set_side_of(chunks, at, new)?;
            }
            return Ok(());
        };
        if !rows.holds_rows() {
            let under = rows.next.unwrap_or(Address::NONE);
            if under != Address::NONE {
                chunks.hold(under)?;
            }
            super::set_side_of(chunks, at, under)?;
            return chunks.release(Held::Side(side), false);
        }
        let words = rows.words()?;
        let same_fields = words.len() == old.words()?.len() && old.sites.iter().map(|&(key, _)| key).eq(rows.sites.iter().map(|&(key, _)| key)) && [old.leading, old.trailing, old.inner].map(|row| row.is_some()) == [rows.leading, rows.trailing, rows.inner].map(|row| row.is_some());
        if same_fields && chunks.count_of(side)? == 1 {
            let dropped: Vec<CellWord> = old.cells().zip(rows.cells()).filter(|&(was, now)| was != now && was.0 != 0).map(|(was, _)| was).collect();
            chunks.words_mut(side, u32::try_from(words.len()).map_err(|_| ArenaError::Full)?)?.copy_from_slice(&words);
            return chunks.release_batch(dropped.into_iter().map(|run| (Held::Run(run.address()), false)));
        }
        for kept in rows.cells().filter(|&cell| cell.0 != 0 && old.cells().any(|was| was == cell)) {
            chunks.hold(kept.address())?;
        }
        if let Some(next) = rows.next {
            chunks.hold(next)?;
        }
        let new = super::ReadWriter::new(chunks).push(&words)?;
        super::set_side_of(chunks, at, new)?;
        chunks.release(Held::Side(side), false)
    }

    /// The side record's words: its mask, then `next`, `leading`,
    /// `trailing`, `inner` and `sites` (a count, then each key and cell)
    /// where present.
    ///
    /// # Errors
    ///
    /// `ArenaError::Unwritable` for a side record that holds nothing or
    /// names address 0, `ArenaError::Malformed` for sites out of key order,
    /// and `ArenaError::Full` for a count past a word.
    pub fn words(&self) -> Result<Vec<u32>, ArenaError> {
        if self.is_empty() {
            return Err(ArenaError::Unwritable("a side record of rows that holds no row and names no side record"));
        }
        if self.next == Some(Address::NONE) {
            return Err(ArenaError::Unwritable("a side record of rows naming address 0"));
        }
        if let Some(pair) = self.sites.windows(2).find(|pair| pair[0].0 >= pair[1].0) {
            return Err(malformed("side record site key order", pair[1].0));
        }
        let mut words = vec![0];
        let mut flags = 0;
        if let Some(next) = self.next {
            flags |= mask::NEXT;
            words.push(next.0);
        }
        for (bit, row) in [(mask::LEADING, self.leading), (mask::TRAILING, self.trailing), (mask::INNER, self.inner)] {
            if let Some(cell) = row {
                flags |= bit;
                words.push(cell.0);
            }
        }
        if !self.sites.is_empty() {
            flags |= mask::SITES;
            words.push(u32::try_from(self.sites.len()).map_err(|_| ArenaError::Full)?);
            words.extend(self.sites.iter().flat_map(|&(key, cell)| [key, cell.0]));
        }
        words[0] = flags;
        Ok(words)
    }

    /// The side record of rows at `at`; `None` for a side record of other
    /// fields.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a mask that holds rows beside other
    /// fields, a row cell that marks changed edges, a `next` of address 0 or
    /// sites out of key order; and what reading its words refuses.
    pub fn read(arena: &dyn ArenaRead, at: Address) -> Result<Option<RowFields>, ArenaError> {
        let mut fields = Fields::of(arena, at);
        let [flags] = fields.array()?;
        Self::read_after(&mut fields, flags)
    }

    fn read_after(fields: &mut Fields<'_>, flags: u32) -> Result<Option<RowFields>, ArenaError> {
        if flags & mask::ROWS == 0 {
            return Ok(None);
        }
        if flags & !mask::ROWS != 0 {
            return Err(malformed("side record rows beside other fields", flags));
        }
        let mut rows = RowFields::default();
        if flags & mask::NEXT != 0 {
            let [next] = fields.array()?;
            if next == Address::NONE.0 {
                return Err(malformed("side record of rows next", next));
            }
            rows.next = Some(Address(next));
        }
        let row = |fields: &mut Fields<'_>| -> Result<CellWord, ArenaError> {
            let [cell] = fields.array()?;
            if cell & 3 != 0 {
                return Err(malformed("side record row cell", cell));
            }
            Ok(CellWord(cell))
        };
        for (bit, slot) in [(mask::LEADING, &mut rows.leading), (mask::TRAILING, &mut rows.trailing), (mask::INNER, &mut rows.inner)] {
            if flags & bit != 0 {
                *slot = Some(row(fields)?);
            }
        }
        if flags & mask::SITES != 0 {
            let [count] = fields.array()?;
            let words = fields.take(count.checked_mul(field::SITE_WORDS).filter(|&words| words != 0).ok_or(malformed("side record site count", count))?)?;
            let (pairs, _) = words.as_chunks::<{ field::SITE_WORDS as usize }>();
            for &[key, cell] in pairs {
                if cell & 3 != 0 {
                    return Err(malformed("side record row cell", cell));
                }
                if rows.sites.last().is_some_and(|&(last, _)| last >= key) {
                    return Err(malformed("side record site key order", key));
                }
                rows.sites.push((key, CellWord(cell)));
            }
        }
        Ok(Some(rows))
    }
}

/// The bits of a node's packed facts that hold its field id.
pub const FIELD_BITS: u32 = 9;

/// What a node's packed word holds: its grammar kind in its low 16 bits,
/// its field id above it, then its flags; the kind it is shown as follows
/// in a word of its own when it is an alias. A run entry with `RECORD` set
/// names a child's record, and holds nothing else but `SHARED`.
mod packed {
    pub const KIND_MASK: u32 = 0xffff;
    pub const FIELD_SHIFT: u32 = 16;
    pub const FIELD_MASK: u32 = (1 << super::FIELD_BITS) - 1;
    pub const ABUTS_NEXT: u32 = 1 << 25;
    pub const NAMED: u32 = 1 << 26;
    pub const EXTRA: u32 = 1 << 27;
    pub const MISSING: u32 = 1 << 28;
    pub const HOLDS_ERROR: u32 = 1 << 29;
    pub const ALIASED: u32 = 1 << 30;
    pub const RECORD: u32 = 1 << 31;
    pub const SHARED: u32 = 1;
}

/// What navigation reads of a parsed node besides its bytes: its kind in
/// the grammar, the field it fills in its parent, the kind the parser shows
/// it as when that is an alias, and whether it is named, an extra,
/// `MISSING`, or holds an error in its subtree.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NodeFacts {
    pub kind: KindId,
    pub field: Option<FieldId>,
    pub alias: Option<KindId>,
    pub named: bool,
    pub extra: bool,
    pub missing: bool,
    pub holds_error: bool,
    /// A token whose text ends in a line break, with the next token starting
    /// at its end.
    pub abuts_next: bool,
}

impl NodeFacts {
    /// The facts of `kid`, `missing` and `holds_error` as its tree answers.
    #[must_use]
    pub fn of(kid: &crate::nodes::Kid, missing: bool, holds_error: bool) -> Self {
        Self { kind: kid.grammar, field: kid.field, alias: (kid.display != kid.grammar).then_some(kid.display), named: kid.named, extra: kid.extra, missing, holds_error, abuts_next: false }
    }

    /// The kind the parser shows the node as.
    #[must_use]
    pub fn display(self) -> KindId {
        self.alias.unwrap_or(self.kind)
    }

    fn put(self, put: &mut dyn FnMut(u32)) -> Result<(), ArenaError> {
        put(self.word()?);
        if let Some(alias) = self.alias {
            put(u32::from(alias.0));
        }
        Ok(())
    }

    fn word(self) -> Result<u32, ArenaError> {
        let kind = u32::from(self.kind.0);
        let field = self.field.map_or(0, |field| u32::from(field.0));
        if field > packed::FIELD_MASK {
            return Err(malformed("node field id", field));
        }
        let flags = [(self.named, packed::NAMED), (self.extra, packed::EXTRA), (self.missing, packed::MISSING), (self.holds_error, packed::HOLDS_ERROR), (self.abuts_next, packed::ABUTS_NEXT), (self.alias.is_some(), packed::ALIASED)];
        Ok(flags.into_iter().filter(|&(set, _)| set).fold(kind | field << packed::FIELD_SHIFT, |word, (_, bit)| word | bit))
    }

    fn of_word(word: u32, alias: Option<KindId>) -> Self {
        let field = (word >> packed::FIELD_SHIFT) & packed::FIELD_MASK;
        Self {
            kind: KindId(u16::try_from(word & packed::KIND_MASK).unwrap_or(u16::MAX)),
            field: (field != 0).then(|| FieldId(u16::try_from(field).unwrap_or(u16::MAX))),
            alias,
            named: word & packed::NAMED != 0,
            extra: word & packed::EXTRA != 0,
            missing: word & packed::MISSING != 0,
            holds_error: word & packed::HOLDS_ERROR != 0,
            abuts_next: word & packed::ABUTS_NEXT != 0,
        }
    }
}

/// One entry of a parsed record's run of children, which holds them in
/// document order.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RunEntry {
    /// A child with a record of its own, which holds its facts. `shared`
    /// for a content read from its envelope's own node: it is no child of
    /// the node, and navigation passes over it.
    Record { at: Address, shared: bool },
    /// A node with no record: its facts and its bytes, and how many words
    /// of the run after it hold the entries inside it.
    Row { facts: NodeFacts, span: Span, inner: u32 },
}

/// The words a run entry takes: a record's two, a row's four, and one more
/// for a row shown as an alias.
pub const RUN_RECORD_WORDS: u32 = 2;
pub const RUN_ROW_WORDS: u32 = 4;

impl RunEntry {
    /// The words the entry takes in its run.
    #[must_use]
    pub fn words(self) -> u32 {
        match self {
            RunEntry::Record { .. } => RUN_RECORD_WORDS,
            RunEntry::Row { facts, .. } => RUN_ROW_WORDS + u32::from(facts.alias.is_some()),
        }
    }

    fn put(self, put: &mut dyn FnMut(u32)) -> Result<(), ArenaError> {
        match self {
            RunEntry::Record { at, shared } => {
                put(packed::RECORD | if shared { packed::SHARED } else { 0 });
                put(at.0);
            }
            RunEntry::Row { facts, span, inner } => {
                put(facts.word()?);
                put(span.start);
                put(span.end);
                put(inner);
                if let Some(alias) = facts.alias {
                    put(u32::from(alias.0));
                }
            }
        }
        Ok(())
    }

    /// The entry at the start of `words` and the words it takes.
    fn take(words: &[u32]) -> Result<(RunEntry, usize), ArenaError> {
        RUN_ENTRIES_DECODED.with(|decoded| decoded.set(decoded.get() + 1));
        let &first = words.first().ok_or(malformed("run entry", 0))?;
        if first & packed::RECORD != 0 {
            let &[_, at] = words.first_chunk::<2>().ok_or(malformed("run record entry", first))?;
            if first & !(packed::RECORD | packed::SHARED) != 0 || at == Address::NONE.0 {
                return Err(malformed("run record entry", first));
            }
            return Ok((RunEntry::Record { at: Address(at), shared: first & packed::SHARED != 0 }, RUN_RECORD_WORDS as usize));
        }
        let &[_, start, end, inner] = words.first_chunk::<4>().ok_or(malformed("run row", first))?;
        if start > end {
            return Err(malformed("run row span end", end));
        }
        let aliased = first & packed::ALIASED != 0;
        let alias = if aliased { Some(read_kind(*words.get(RUN_ROW_WORDS as usize).ok_or(malformed("run row alias", first))?)?) } else { None };
        let entry = RunEntry::Row { facts: NodeFacts::of_word(first, alias), span: Span { start, end }, inner };
        Ok((entry, RUN_ROW_WORDS as usize + usize::from(aliased)))
    }
}

/// What a parsed node's coordinate names besides its record: its kind and
/// its byte span, as its read stamped them, so a view of the record has its
/// whole coordinate from the record alone.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Row {
    pub kind: KindId,
    pub span: Span,
}

/// The node a built node was rebuilt from: its tree, its subtree's rows and
/// its byte span.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Sides {
    pub tree: TreeId,
    pub index: NodeIndex,
    pub end: NodeIndex,
    pub span: Span,
}

impl Sides {
    /// The node `name` names past a call, spanning `span`, as a side record
    /// keeps it where its records outlive its tree: its record where a tree
    /// is, its packed site where an index is, and no end.
    #[must_use]
    pub fn named(name: crate::types::NodeId, span: Span) -> Self {
        Self { tree: TreeId(name.address()), index: NodeIndex(name.packed_site()), end: NodeIndex(0), span }
    }

    /// The name these words hold (`named`); none for a tree's node, whose
    /// subtree end is past its index and so never 0.
    #[must_use]
    pub fn name(self) -> Option<crate::types::NodeId> {
        if self.end != NodeIndex(0) {
            return None;
        }
        crate::types::NodeId::of_packed(self.tree.0, self.index.0)
    }

    /// The node as a render names it: by its name, else by its coordinate
    /// in its tree.
    #[must_use]
    pub fn at(self) -> crate::slot::NodeIdOrOwnedCoordinate {
        self.name().map_or_else(|| crate::slot::NodeIdOrOwnedCoordinate::Coordinate(self.coordinate()), crate::slot::NodeIdOrOwnedCoordinate::NodeId)
    }

    /// The node's coordinate in its tree.
    #[must_use]
    pub fn coordinate(self) -> crate::slot::NodeCoordinate {
        crate::slot::NodeCoordinate::new(self.tree, self.index, self.end, self.span)
    }
}

/// A list slot's stored layout and its separator spacing settings, keyed by
/// its cell's stamped word.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SideSlot {
    pub word: u32,
    pub before: Option<KindId>,
    pub after: Option<KindId>,
    pub separator: Option<KindId>,
    /// The slot's `…_separator_space_before` setting.
    pub space_before: Option<KindId>,
    /// The slot's `…_separator_space` (`…_after`) setting.
    pub space_after: Option<KindId>,
}

/// What a side record holds.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SideRecord {
    /// A parsed node's coordinate kind and byte span.
    pub at: Option<Row>,
    pub edges: Option<Edges>,
    pub span: Option<PointSpan>,
    pub sides: Option<Sides>,
    pub changed: ChangedEdges,
    /// A list's delimiters setting; an explicit empty set is `Some`.
    pub delimiter: Option<Delimiter>,
    /// A list's chosen separator setting, a builder's preference.
    pub separator_kind: Option<KindId>,
    /// A snapshot root's stamped flanks (`NodeLayout::flanks`).
    pub flanks: crate::layout_kinds::Flanks,
    pub slots: Vec<SideSlot>,
    /// A parsed node's parent's record; none for a source's root.
    pub parent: Option<Address>,
    /// Whether a parsed record is a content its parent's own node reads
    /// (`RunEntry::Record { shared: true }` in the parent's run): its node is
    /// its parent's. Navigation reads the parent only for such a record.
    pub content: bool,
    /// Whether a parsed record lies under an `ERROR`, whose interior no
    /// view names: navigation rooted at it is refused.
    pub held_by_error: bool,
    /// A parsed node's navigation facts.
    pub node: Option<NodeFacts>,
    /// The string chunk a parsed node's source is, which its bytes index.
    pub source: Option<u32>,
    /// The levels a parsed node's subtree opens net of those it closes.
    pub depth: i32,
    /// A parsed node's children, in document order.
    pub run: Vec<RunEntry>,
    /// A read's own side record: the addresses the read's records lie in, one range
    /// for each run of chunks its writer wrote in turn
    /// (`ReadWriter::spans`). Only `SideRecord::spans_at` reads them back;
    /// every other read leaves them where they lie.
    pub spans: Vec<std::ops::Range<Address>>,
    /// A read's own side record: the byte offsets, sorted, at which its parse placed a
    /// side or kept a header gap, each within the node that side is the
    /// side of; none for a read that does not keep them. Only
    /// `SideRecord::starts_at` reads them back.
    pub starts: Option<Vec<u32>>,
    /// The record's rows, from the side record of rows its word 1 names,
    /// whose `next` is the side record that holds the fields above. A
    /// write never writes them: they are a side record of their own
    /// (`RowFields::words`).
    pub rows: RowFields,
}

/// The words of one slot entry: word, before, after, separator and the two
/// spacing settings.
const SLOT_WORDS: u32 = 6;
/// An edge side's word marks a set side with this bit, so a blank arm with
/// no strength still differs from an unset side.
const EDGE_SET: u32 = 1 << 31;
/// A span's two addresses are stored with this bit, which no chunk number a
/// built arena gives reaches, so no word of a read's spans names a record
/// that a header could be read at.
const SPAN_WORD: u32 = 1 << 31;

fn malformed(what: &'static str, word: u32) -> ArenaError {
    ArenaError::Malformed { what, word }
}

/// An optional kind as one word, plus one so 0 is none.
fn optional_kind(kind: Option<KindId>) -> u32 {
    kind.map_or(0, |kind| u32::from(kind.0) + 1)
}

fn read_optional_kind(word: u32) -> Result<Option<KindId>, ArenaError> {
    match word {
        0 => Ok(None),
        _ => u16::try_from(word - 1).map(|kind| Some(KindId(kind))).map_err(|_| malformed("side record kind", word)),
    }
}

fn read_kind(word: u32) -> Result<KindId, ArenaError> {
    u16::try_from(word).map(KindId).map_err(|_| malformed("side record kind", word))
}

fn read_delimiter(word: u32) -> Result<Delimiter, ArenaError> {
    let every = Delimiter::LEADING.with(Delimiter::TRAILING);
    u8::try_from(word).ok().map(Delimiter).filter(|&set| set.without(every) == Delimiter::NONE).ok_or(malformed("side record delimiter", word))
}

/// One edge side as a word: the set bit, the strength plus one (0 when the
/// stamp has none) above the arm's kind.
fn edge_word(edge: Option<EdgeArm>) -> u32 {
    edge.map_or(0, |edge| EDGE_SET | edge.strength.map_or(0, |strength| u32::from(strength as u8) + 1) << 16 | u32::from(edge.arm.0))
}

fn read_edge(word: u32) -> Result<Option<EdgeArm>, ArenaError> {
    if word & EDGE_SET == 0 {
        return if word == 0 { Ok(None) } else { Err(malformed("side record edge", word)) };
    }
    let arm = KindId(u16::try_from(word & 0xffff).map_err(|_| malformed("side record edge", word))?);
    let strength = match (word & !EDGE_SET) >> 16 {
        0 => None,
        code => Some(u8::try_from(code - 1).ok().and_then(SeamStrength::from_code).ok_or(malformed("side record edge strength", code))?),
    };
    Ok(Some(EdgeArm { arm, strength }))
}

/// The words of a side record as it is read: a cursor over its fields.
struct Fields<'a> {
    arena: &'a dyn ArenaRead,
    at: Address,
    offset: u32,
    /// The written words of the record's chunk, from the record on.
    written: &'a [u32],
}

impl<'a> Fields<'a> {
    fn of(arena: &'a dyn ArenaRead, at: Address) -> Self {
        let written = arena.chunk(at.chunk()).and_then(|words| words.get(at.word() as usize..)).unwrap_or_default();
        Self { arena, at, offset: 0, written }
    }

    fn take(&mut self, n: u32) -> Result<&'a [u32], ArenaError> {
        let past = || ArenaError::OutOfBounds { chunk: self.at.chunk(), word: self.at.word().saturating_add(self.offset), len: n };
        let end = self.offset.checked_add(n).ok_or_else(past)?;
        let Some(words) = self.written.get(self.offset as usize..end as usize) else {
            self.arena.words(self.at, end)?;
            return Err(past());
        };
        self.offset = end;
        Ok(words)
    }

    fn array<const N: usize>(&mut self) -> Result<[u32; N], ArenaError> {
        let n = u32::try_from(N).map_err(|_| ArenaError::Full)?;
        let words = self.take(n)?;
        <[u32; N]>::try_from(words).map_err(|_| ArenaError::OutOfBounds { chunk: self.at.chunk(), word: self.at.word().saturating_add(self.offset), len: n })
    }
}

impl SideRecord {
    /// Whether the record holds nothing, so its record names no side record.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        *self == SideRecord::default()
    }

    /// Writes the side record through `place`, which places words at a fresh
    /// address, and answers its address:
    /// `Address::NONE` when it holds nothing.
    pub fn write(&self, place: &mut dyn FnMut(&[u32]) -> Result<Address, ArenaError>) -> Result<Address, ArenaError> {
        if self.is_empty() {
            return Ok(Address::NONE);
        }
        let mut words = vec![0];
        let flags = self.fields(&mut |word| words.push(word))?;
        words[0] = flags;
        place(&words)
    }

    /// Writes the side record in place in `arena`, and answers its address:
    /// `Address::NONE` when it holds nothing.
    pub fn write_in(&self, arena: &mut dyn RecordSpace) -> Result<Address, ArenaError> {
        if self.is_empty() {
            return Ok(Address::NONE);
        }
        let mut len = 1;
        self.fields(&mut |_| len += 1)?;
        let at = arena.alloc(len)?;
        let out = arena.words_mut(at, len)?;
        let mut n = 1;
        let flags = self.fields(&mut |word| {
            out[n] = word;
            n += 1;
        })?;
        out[0] = flags;
        Ok(at)
    }

    /// Hands `put` each word after the flags word, in field order, and
    /// answers the flags word.
    fn fields(&self, put: &mut dyn FnMut(u32)) -> Result<u32, ArenaError> {
        if !self.rows.is_empty() {
            return Err(ArenaError::Unwritable("a side record's rows, which are a side record of their own"));
        }
        let mut flags = 0;
        let mut words = |words: &[u32]| words.iter().for_each(|&word| put(word));
        if let Some(Row { kind, span }) = self.at {
            flags |= mask::AT;
            words(&[u32::from(kind.0), span.start, span.end]);
        }
        if let Some(edges) = self.edges {
            flags |= mask::EDGES;
            words(&[edge_word(edges.before), edge_word(edges.after)]);
        }
        if let Some(PointSpan { start, end }) = self.span {
            flags |= mask::SPAN;
            words(&[start.row, start.column, end.row, end.column]);
        }
        if let Some(sides) = self.sides {
            flags |= mask::SIDES;
            words(&[sides.tree.0, sides.index.0, sides.end.0, sides.span.start, sides.span.end]);
        }
        if self.changed.leading {
            flags |= mask::CHANGED_LEADING;
        }
        if self.changed.trailing {
            flags |= mask::CHANGED_TRAILING;
        }
        if self.content {
            flags |= mask::CONTENT;
        }
        if self.held_by_error {
            flags |= mask::HELD_BY_ERROR;
        }
        if let Some(delimiter) = self.delimiter {
            flags |= mask::DELIMITER;
            words(&[u32::from(delimiter.0)]);
        }
        if let Some(kind) = self.separator_kind {
            flags |= mask::SEPARATOR_KIND;
            words(&[u32::from(kind.0)]);
        }
        if !self.flanks.is_none() {
            flags |= mask::FLANKS;
            words(&[self.flanks.word()]);
        }
        if !self.slots.is_empty() {
            flags |= mask::SLOTS;
            words(&[u32::try_from(self.slots.len()).map_err(|_| ArenaError::Full)?]);
            for slot in &self.slots {
                words(&[
                    slot.word,
                    optional_kind(slot.before),
                    optional_kind(slot.after),
                    optional_kind(slot.separator),
                    optional_kind(slot.space_before),
                    optional_kind(slot.space_after),
                ]);
            }
        }
        if let Some(parent) = self.parent {
            flags |= mask::PARENT;
            words(&[parent.0]);
        }
        if let Some(node) = self.node {
            flags |= mask::NODE;
            node.put(&mut |word| words(&[word]))?;
        }
        if let Some(source) = self.source {
            flags |= mask::SOURCE;
            words(&[source]);
        }
        if self.depth != 0 {
            flags |= mask::DEPTH;
            words(&[self.depth.cast_unsigned()]);
        }
        if !self.run.is_empty() {
            flags |= mask::RUN;
            let mut len = 0u32;
            for entry in &self.run {
                entry.put(&mut |_| len += 1)?;
            }
            words(&[len]);
            for entry in &self.run {
                entry.put(&mut |word| words(&[word]))?;
            }
        }
        if !self.spans.is_empty() {
            flags |= mask::SPANS;
            words(&[u32::try_from(self.spans.len()).map_err(|_| ArenaError::Full)?]);
            for span in &self.spans {
                words(&[span.start.0 | SPAN_WORD, span.end.0 | SPAN_WORD]);
            }
        }
        if let Some(starts) = &self.starts {
            flags |= mask::STARTS;
            words(&[u32::try_from(starts.len()).map_err(|_| ArenaError::Full)?]);
            words(starts);
        }
        Ok(flags)
    }

    /// The side record at `at`, its spans left empty; an empty one at
    /// `Address::NONE`.
    pub fn read(arena: &dyn ArenaRead, at: Address) -> Result<SideRecord, ArenaError> {
        Self::read_parts(arena, at, true, true).map(|(record, _)| record)
    }

    /// The side record at `at` with its slots, its run left where it lies
    /// and its spans left empty: what a render of a record reads.
    pub(crate) fn read_slots(arena: &dyn ArenaRead, at: Address) -> Result<SideRecord, ArenaError> {
        Self::read_parts(arena, at, true, false).map(|(record, _)| record)
    }

    /// The side record at `at` without its lists, its slots, its run and its
    /// spans left empty, and where its run lies: what naming a node and
    /// finding its parent read.
    pub(super) fn read_facts(arena: &dyn ArenaRead, at: Address) -> Result<(SideRecord, Option<RunAt>), ArenaError> {
        Self::read_parts(arena, at, false, false).map(|(record, found)| (record, found.run))
    }

    /// `read_facts` into `self`, which is empty, where the record is kept.
    pub(super) fn read_facts_into(&mut self, arena: &dyn ArenaRead, at: Address) -> Result<Option<RunAt>, ArenaError> {
        self.read_into(arena, at, false, false).map(|found| found.run)
    }

    /// The spans the side record at `at` holds (`SideRecord::spans`); none
    /// at `Address::NONE`.
    pub(super) fn spans_at(arena: &dyn ArenaRead, at: Address) -> Result<Vec<std::ops::Range<Address>>, ArenaError> {
        Self::read_parts(arena, at, false, false)?.1.spans.map_or(Ok(Vec::new()), |spans| spans.spans(arena))
    }

    /// The starts the side record at `at` holds (`SideRecord::starts`);
    /// none at `Address::NONE`.
    pub(super) fn starts_at(arena: &dyn ArenaRead, at: Address) -> Result<Option<&[u32]>, ArenaError> {
        Self::read_parts(arena, at, false, false)?.1.starts.map(|starts| starts.starts(arena)).transpose()
    }

    fn read_parts(arena: &dyn ArenaRead, at: Address, slots: bool, entries: bool) -> Result<(SideRecord, ListsAt), ArenaError> {
        let mut record = SideRecord::default();
        let found = record.read_into(arena, at, slots, entries)?;
        Ok((record, found))
    }

    /// Reads the side record at `at` into `self`, which is empty.
    fn read_into(&mut self, arena: &dyn ArenaRead, at: Address, slots: bool, entries: bool) -> Result<ListsAt, ArenaError> {
        if at == Address::NONE {
            return Ok(ListsAt::default());
        }
        let record = self;
        let mut fields = Fields::of(arena, at);
        let [flags] = fields.array()?;
        if flags & !mask::ALL != 0 || flags == 0 {
            return Err(malformed("side record mask", flags));
        }
        if let Some(rows) = RowFields::read_after(&mut fields, flags)? {
            let found = match rows.next {
                Some(next) => record.read_into(arena, next, slots, entries)?,
                None => ListsAt::default(),
            };
            if !record.rows.is_empty() {
                return Err(malformed("side record of rows over another", flags));
            }
            record.rows = rows;
            return Ok(found);
        }
        let has = |bit: u32| flags & bit != 0;
        record.changed = ChangedEdges { leading: has(mask::CHANGED_LEADING), trailing: has(mask::CHANGED_TRAILING) };
        record.content = has(mask::CONTENT);
        record.held_by_error = has(mask::HELD_BY_ERROR);
        if has(mask::AT) {
            let [kind, start, end]: [u32; field::AT_WORDS as usize] = fields.array()?;
            if start > end {
                return Err(malformed("side record span end", end));
            }
            record.at = Some(Row { kind: read_kind(kind)?, span: Span { start, end } });
        }
        if has(mask::EDGES) {
            let [before, after]: [u32; field::EDGES_WORDS as usize] = fields.array()?;
            record.edges = Some(Edges { before: read_edge(before)?, after: read_edge(after)? });
        }
        if has(mask::SPAN) {
            let [start_row, start_column, end_row, end_column]: [u32; field::SPAN_WORDS as usize] = fields.array()?;
            record.span = Some(PointSpan { start: Point { row: start_row, column: start_column }, end: Point { row: end_row, column: end_column } });
        }
        if has(mask::SIDES) {
            let [tree, index, end, start, stop]: [u32; field::SIDES_WORDS as usize] = fields.array()?;
            if start > stop {
                return Err(malformed("side record span end", stop));
            }
            record.sides = Some(Sides { tree: TreeId(tree), index: NodeIndex(index), end: NodeIndex(end), span: Span { start, end: stop } });
        }
        if has(mask::DELIMITER) {
            let [delimiter] = fields.array()?;
            record.delimiter = Some(read_delimiter(delimiter)?);
        }
        if has(mask::SEPARATOR_KIND) {
            let [kind] = fields.array()?;
            record.separator_kind = Some(read_kind(kind)?);
        }
        if has(mask::FLANKS) {
            let [word] = fields.array()?;
            record.flanks = crate::layout_kinds::Flanks::of_word(word).filter(|flanks| !flanks.is_none()).ok_or(malformed("side record flanks", word))?;
        }
        if has(mask::SLOTS) {
            let [count] = fields.array()?;
            let held = fields.take(count.checked_mul(SLOT_WORDS).ok_or(malformed("side record slot count", count))?)?;
            let (held, _) = held.as_chunks::<{ SLOT_WORDS as usize }>();
            record.slots = held[..if slots { held.len() } else { 0 }]
                .iter()
                .map(|&[word, before, after, separator, space_before, space_after]| {
                    Ok(SideSlot {
                        word,
                        before: read_optional_kind(before)?,
                        after: read_optional_kind(after)?,
                        separator: read_optional_kind(separator)?,
                        space_before: read_optional_kind(space_before)?,
                        space_after: read_optional_kind(space_after)?,
                    })
                })
                .collect::<Result<_, _>>()?;
        }
        if has(mask::PARENT) {
            let [parent] = fields.array()?;
            if parent == Address::NONE.0 {
                return Err(malformed("side record parent", parent));
            }
            record.parent = Some(Address(parent));
        }
        if has(mask::NODE) {
            let [word] = fields.array()?;
            if word & packed::RECORD != 0 {
                return Err(malformed("side record node", word));
            }
            let alias = if word & packed::ALIASED != 0 {
                let [alias] = fields.array()?;
                Some(read_kind(alias)?)
            } else {
                None
            };
            record.node = Some(NodeFacts::of_word(word, alias));
        }
        if has(mask::SOURCE) {
            let [source] = fields.array()?;
            record.source = Some(source);
        }
        if has(mask::DEPTH) {
            let [depth] = fields.array()?;
            if depth == 0 {
                return Err(malformed("side record depth", depth));
            }
            record.depth = depth.cast_signed();
        }
        let mut found = ListsAt::default();
        if has(mask::RUN) {
            let [len] = fields.array()?;
            let run = RunAt { at: at.offset(fields.offset).ok_or(malformed("side record run", len))?, len };
            if fields.take(len)?.is_empty() {
                return Err(malformed("side record run", len));
            }
            if entries {
                record.run = run.entries(arena)?;
            }
            found.run = Some(run);
        }
        if has(mask::SPANS) {
            let [len] = fields.array()?;
            let words = len.checked_mul(2).filter(|&words| words != 0).ok_or(malformed("side record spans", len))?;
            let start = fields.offset;
            fields.take(words)?;
            found.spans = Some(SpansAt { record: at, start, end: fields.offset });
        }
        if has(mask::STARTS) {
            let [len] = fields.array()?;
            let start = fields.offset;
            fields.take(len)?;
            found.starts = Some(StartsAt { record: at, start, end: fields.offset });
        }
        Ok(found)
    }
}

/// Where a side record's lists lie, as a read of its facts finds them.
#[derive(Default)]
struct ListsAt {
    run: Option<RunAt>,
    spans: Option<SpansAt>,
    starts: Option<StartsAt>,
}

/// Where a side record's spans lie: the record, and the words of it they
/// take, two for each span. They follow the record's run, which can take a
/// chunk of its own, so they are named from the record's first word.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct SpansAt {
    record: Address,
    start: u32,
    end: u32,
}

impl SpansAt {
    /// The spans, each refused unless both its words carry the span bit and
    /// it starts before it ends.
    fn spans(self, arena: &dyn ArenaRead) -> Result<Vec<std::ops::Range<Address>>, ArenaError> {
        let words = arena.words(self.record, self.end)?.get(self.start as usize..).ok_or(ArenaError::OutOfBounds { chunk: self.record.chunk(), word: self.record.word(), len: self.end })?;
        let (spans, _) = words.as_chunks::<2>();
        spans
            .iter()
            .map(|&[start, end]| {
                if start & end & SPAN_WORD == 0 || start >= end {
                    return Err(malformed("side record span", end));
                }
                Ok(Address(start & !SPAN_WORD)..Address(end & !SPAN_WORD))
            })
            .collect()
    }
}

/// Where a side record's starts lie, as `SpansAt` names its spans.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct StartsAt {
    record: Address,
    start: u32,
    end: u32,
}

impl StartsAt {
    /// The starts, each refused unless it is past the one before.
    fn starts(self, arena: &dyn ArenaRead) -> Result<&[u32], ArenaError> {
        let words = arena.words(self.record, self.end)?.get(self.start as usize..).ok_or(ArenaError::OutOfBounds { chunk: self.record.chunk(), word: self.record.word(), len: self.end })?;
        if let Some(pair) = words.windows(2).find(|pair| pair[0] >= pair[1]) {
            return Err(malformed("side record starts", pair[1]));
        }
        Ok(words)
    }
}

/// The entry starts of the read whose source's entry is at `source`: the
/// read's own side record holds them (`Source::read_side_of`,
/// `SideRecord::starts`); none for a read that kept none.
///
/// # Errors
///
/// What reading the source's entry and that side record refuses.
pub fn read_entry_starts(arena: &dyn ArenaRead, source: Address) -> Result<Option<&[u32]>, ArenaError> {
    super::source::Source::read_side_of(arena, source)?.map_or(Ok(None), |read| SideRecord::starts_at(arena, read))
}

/// The spans of the read whose source's entry is at `source`: the
/// addresses the read's records lie in, which the read's own side record
/// holds (`Source::read_side_of`, `SideRecord::spans`); none for a read
/// that names no side record.
///
/// # Errors
///
/// What reading the source's entry and that side record refuses.
pub fn read_spans(arena: &dyn ArenaRead, source: Address) -> Result<Vec<std::ops::Range<Address>>, ArenaError> {
    super::source::Source::read_side_of(arena, source)?.map_or(Ok(Vec::new()), |read| SideRecord::spans_at(arena, read))
}

thread_local! {
    static RUN_ENTRIES_DECODED: std::cell::Cell<u64> = const { std::cell::Cell::new(0) };
}

/// The run entries this thread has decoded: a diagnostic, so a test counts
/// the entries a call decodes, never times them.
#[must_use]
pub fn run_entries_decoded() -> u64 {
    RUN_ENTRIES_DECODED.with(std::cell::Cell::get)
}

/// Where a side record's run lies: its first word and its words.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) struct RunAt {
    at: Address,
    len: u32,
}

impl RunAt {
    /// The run's entries, in document order.
    pub(super) fn entries(self, arena: &dyn ArenaRead) -> Result<Vec<RunEntry>, ArenaError> {
        self.in_place(arena)?.collect()
    }

    /// Whether the run's first entry is a shared content, read from the
    /// entry's flag word alone.
    pub(super) fn starts_shared(self, arena: &dyn ArenaRead) -> Result<bool, ArenaError> {
        let &first = arena.words(self.at, self.len)?.first().ok_or(malformed("run entry", 0))?;
        Ok(first & packed::RECORD != 0 && first & packed::SHARED != 0)
    }

    /// The run's entries, in document order, each decoded as it is reached.
    pub(super) fn in_place(self, arena: &dyn ArenaRead) -> Result<RunEntries<'_>, ArenaError> {
        Ok(RunEntries { words: arena.words(self.at, self.len)?, word: 0 })
    }
}

/// A run's entries from one of them on, read in place.
#[derive(Debug, Clone, Default)]
pub(super) struct RunEntries<'a> {
    words: &'a [u32],
    word: u32,
}

impl<'a> RunEntries<'a> {
    /// The word of the run the next entry starts at.
    pub(super) fn word(&self) -> u32 {
        self.word
    }

    /// These entries from the entry starting at word `word` of the run.
    pub(super) fn at_word(self, word: u32) -> Option<RunEntries<'a>> {
        Some(RunEntries { words: self.words.get(word.checked_sub(self.word)? as usize..)?, word })
    }

    /// Passes over the next `words` words; false for a run that ends first.
    pub(super) fn pass_words(&mut self, words: u32) -> bool {
        let Some(rest) = self.words.get(words as usize..) else { return false };
        self.words = rest;
        self.word += words;
        true
    }
}

impl Iterator for RunEntries<'_> {
    type Item = Result<RunEntry, ArenaError>;

    fn next(&mut self) -> Option<Self::Item> {
        if self.words.is_empty() {
            return None;
        }
        Some(RunEntry::take(self.words).map(|(entry, taken)| {
            self.words = &self.words[taken..];
            self.word += crate::types::narrow(taken);
            entry
        }).inspect_err(|_| self.words = &[]))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::arena::Arena;

    fn plain(kind: u16) -> NodeFacts {
        NodeFacts { kind: KindId(kind), field: None, alias: None, named: false, extra: false, missing: false, holds_error: false, abuts_next: false }
    }

    fn full() -> SideRecord {
        SideRecord {
            at: Some(Row { kind: KindId(4), span: Span { start: 3, end: 8 } }),
            edges: Some(Edges {
                before: Some(EdgeArm { arm: KindId::BLANK, strength: None }),
                after: Some(EdgeArm { arm: KindId(31), strength: Some(SeamStrength::Trivia) }),
            }),
            span: Some(PointSpan { start: Point { row: 1, column: 2 }, end: Point { row: 3, column: 0 } }),
            sides: Some(Sides { tree: TreeId(2), index: NodeIndex(5), end: NodeIndex(6), span: Span { start: 10, end: 14 } }),
            changed: ChangedEdges { leading: true, trailing: false },
            delimiter: Some(Delimiter::TRAILING),
            separator_kind: Some(KindId(12)),
            flanks: crate::layout_kinds::Flanks { before: crate::layout_kinds::LayoutKinds::NEWLINE, after: crate::layout_kinds::LayoutKinds::NONE },
            slots: vec![
                SideSlot {
                    word: 2,
                    before: Some(KindId::BLANK),
                    after: None,
                    separator: Some(KindId(8)),
                    space_before: None,
                    space_after: Some(KindId(3)),
                },
                SideSlot { word: 7, ..SideSlot::default() },
                SideSlot { word: 9, space_before: Some(KindId::BLANK), ..SideSlot::default() },
            ],
            parent: Some(Address(77)),
            content: true,
            held_by_error: true,
            node: Some(NodeFacts { kind: KindId(39), field: Some(FieldId(9)), alias: Some(KindId(40)), named: true, extra: false, missing: false, holds_error: true, abuts_next: false }),
            source: Some(3),
            depth: -2,
            run: vec![
                RunEntry::Row { facts: plain(5), span: Span { start: 3, end: 4 }, inner: 0 },
                RunEntry::Record { at: Address(90), shared: false },
                RunEntry::Row { facts: NodeFacts { kind: KindId(6), field: Some(FieldId(1)), alias: Some(KindId(8)), named: true, extra: true, missing: true, holds_error: true, abuts_next: false }, span: Span { start: 6, end: 6 }, inner: 1 },
                RunEntry::Row { facts: NodeFacts { named: true, ..plain(7) }, span: Span { start: 6, end: 6 }, inner: 0 },
                RunEntry::Record { at: Address(96), shared: true },
            ],
            spans: vec![Address(5)..Address(40), Address(3 << crate::arena::CHUNK_SHIFT)..Address(5 << crate::arena::CHUNK_SHIFT)],
            starts: Some(vec![0, 4, 11]),
            rows: RowFields::default(),
        }
    }

    #[test]
    fn a_side_record_reads_back_as_written() {
        let mut arena = Arena::new();
        let record = full();
        let at = record.write(&mut |words| arena.push(words)).expect("room");
        assert_eq!(SideRecord::read(&arena, at), Ok(SideRecord { spans: Vec::new(), starts: None, ..record.clone() }), "a read leaves the spans and the starts where they lie");
        assert_eq!(SideRecord::spans_at(&arena, at), Ok(record.spans));
        assert_eq!(SideRecord::starts_at(&arena, at), Ok(record.starts.as_deref()));
    }

    #[test]
    fn a_side_record_of_rows_reads_as_its_rows_over_the_fields_of_the_side_record_under_it() {
        let mut arena = Arena::new();
        let under = full().write(&mut |words| arena.push(words)).expect("room");
        let rows = RowFields { next: Some(under), leading: Some(CellWord(8 << 2)), inner: Some(CellWord(0)), sites: vec![(RowFields::site_key(2, 0, 0), CellWord(9 << 2)), (RowFields::site_key(2, 0, 1), CellWord(10 << 2))], ..RowFields::default() };
        let at = arena.push(&rows.words().expect("its words")).expect("room");
        assert_eq!(SideRecord::read(&arena, at), Ok(SideRecord { rows: rows.clone(), ..SideRecord::read(&arena, under).expect("the side record under it") }));
        let (facts, run) = SideRecord::read_facts(&arena, at).expect("its facts");
        assert_eq!(run, SideRecord::read_facts(&arena, under).expect("its facts").1, "its run lies where the side record under it holds it");
        assert_eq!(facts.rows, rows);
        assert_eq!(RowFields::read(&arena, under), Ok(None), "a side record of other fields holds no rows");
        let alone = RowFields { trailing: Some(CellWord(0)), ..RowFields::default() };
        let at = arena.push(&alone.words().expect("its words")).expect("room");
        assert_eq!(SideRecord::read(&arena, at), Ok(SideRecord { rows: alone, ..SideRecord::default() }), "a side record of rows naming none stands alone");
    }

    #[test]
    fn a_side_record_of_rows_beside_other_fields_over_another_or_out_of_key_order_is_refused() {
        let mut arena = Arena::new();
        let under = arena.push(&[mask::SEPARATOR_KIND, 7]).expect("room");
        let rows = arena.push(&RowFields { next: Some(under), leading: Some(CellWord(0)), ..RowFields::default() }.words().expect("its words")).expect("room");
        for words in [vec![mask::LEADING | mask::SEPARATOR_KIND, 0, 7], vec![mask::NEXT, rows.0], vec![mask::NEXT, 0], vec![mask::LEADING, 1], vec![mask::SITES, 2, 4, 0, 2, 0], vec![mask::SITES, 0]] {
            let at = arena.push(&words).expect("room");
            assert!(matches!(SideRecord::read(&arena, at), Err(ArenaError::Malformed { .. })), "{words:?}");
        }
        assert!(RowFields { sites: vec![(4, CellWord(0)), (2, CellWord(0))], ..RowFields::default() }.words().is_err(), "sites out of key order");
        assert!(RowFields::default().words().is_err(), "a side record of rows that holds nothing");
        assert!(SideRecord { rows: RowFields { leading: Some(CellWord(0)), ..RowFields::default() }, ..SideRecord::default() }.write(&mut |words| arena.push(words)).is_err(), "rows are a side record of their own");
    }

    #[test]
    fn a_side_record_written_in_place_holds_the_words_a_placed_one_does() {
        let (mut placed, mut in_place) = (Arena::new(), Arena::new());
        let record = full();
        let at = record.write(&mut |words| placed.push(words)).expect("room");
        assert_eq!(record.write_in(&mut in_place), Ok(at), "the record at the same words");
        assert_eq!(in_place.chunk(0), placed.chunk(0));
        assert_eq!(SideRecord::default().write_in(&mut in_place), Ok(Address::NONE));
    }

    #[test]
    fn a_read_of_its_facts_leaves_the_lists_where_they_lie() {
        let mut arena = Arena::new();
        let record = full();
        let at = record.write(&mut |words| arena.push(words)).expect("room");
        let (facts, run) = SideRecord::read_facts(&arena, at).expect("its facts");
        let entries = record.run.clone();
        assert_eq!(facts, SideRecord { slots: Vec::new(), run: Vec::new(), spans: Vec::new(), starts: None, ..record });
        let run = run.expect("a run");
        assert_eq!(run.entries(&arena), Ok(entries));
        assert_eq!(SideRecord::read_facts(&arena, Address::NONE), Ok((SideRecord::default(), None)));
    }

    #[test]
    fn a_side_record_ending_at_the_packed_word_boundary_reads_back() {
        let mut arena = Arena::new();
        arena.alloc(crate::arena::CHUNK_WORDS).expect("a full chunk");
        arena.alloc(crate::arena::CHUNK_WORDS - 2).expect("leave two words");
        let record = SideRecord { separator_kind: Some(KindId(7)), ..SideRecord::default() };
        let at = record.write(&mut |words| arena.push(words)).expect("room");
        assert_eq!(at.word(), crate::arena::CHUNK_WORDS - 2);
        assert_eq!(SideRecord::read(&arena, at), Ok(record));
    }

    #[test]
    fn each_field_alone_reads_back_as_written() {
        let whole = full();
        let alone = [
            SideRecord { at: whole.at, ..SideRecord::default() },
            SideRecord { edges: whole.edges, ..SideRecord::default() },
            SideRecord { edges: Some(Edges::NONE), ..SideRecord::default() },
            SideRecord { span: whole.span, ..SideRecord::default() },
            SideRecord { sides: whole.sides, ..SideRecord::default() },
            SideRecord { changed: ChangedEdges { leading: false, trailing: true }, ..SideRecord::default() },
            SideRecord { delimiter: whole.delimiter, ..SideRecord::default() },
            SideRecord { delimiter: Some(Delimiter::NONE), ..SideRecord::default() },
            SideRecord { separator_kind: whole.separator_kind, ..SideRecord::default() },
            SideRecord { flanks: whole.flanks, ..SideRecord::default() },
            SideRecord { slots: whole.slots, ..SideRecord::default() },
            SideRecord { parent: whole.parent, ..SideRecord::default() },
            SideRecord { content: true, ..SideRecord::default() },
            SideRecord { held_by_error: true, ..SideRecord::default() },
            SideRecord { node: whole.node, ..SideRecord::default() },
            SideRecord { node: Some(plain(0)), ..SideRecord::default() },
            SideRecord { source: whole.source, ..SideRecord::default() },
            SideRecord { depth: 3, ..SideRecord::default() },
            SideRecord { run: whole.run, ..SideRecord::default() },
            SideRecord { spans: whole.spans, ..SideRecord::default() },
            SideRecord { starts: whole.starts, ..SideRecord::default() },
            SideRecord { starts: Some(Vec::new()), ..SideRecord::default() },
        ];
        let mut arena = Arena::new();
        for record in alone {
            let at = record.write(&mut |words| arena.push(words)).expect("room");
            assert_ne!(at, Address::NONE);
            assert_eq!(SideRecord::read(&arena, at), Ok(SideRecord { spans: Vec::new(), starts: None, ..record.clone() }));
            assert_eq!(SideRecord::spans_at(&arena, at), Ok(record.spans));
            assert_eq!(SideRecord::starts_at(&arena, at), Ok(record.starts.as_deref()));
        }
    }

    #[test]
    fn only_starts_at_reads_the_starts_and_refuses_them_out_of_order() {
        let mut arena = Arena::new();
        for words in [vec![mask::STARTS, 2, 4, 4], vec![mask::STARTS, 2, 9, 3]] {
            let at = arena.push(&words).expect("room");
            assert_eq!(SideRecord::read(&arena, at), Ok(SideRecord::default()), "{words:?}: a read steps over the starts");
            assert!(SideRecord::starts_at(&arena, at).is_err(), "{words:?}");
        }
        let at = arena.push(&[mask::STARTS, 3]).expect("room");
        assert!(SideRecord::starts_at(&arena, at).is_err(), "a count past the record's words");
    }

    /// The side records `cell-forms.json` pins the TypeScript side reader
    /// to: each one's words as the codec writes them.
    #[test]
    fn the_shared_fixture_s_side_records_are_written_as_it_holds_them() {
        let fixture: serde_json::Value = serde_json::from_str(include_str!("cell-forms.json")).expect("the fixture parses");
        let words_of = |n: usize| -> Vec<u32> {
            fixture["sides"][n]["words"].as_array().expect("words").iter().map(|word| u32::try_from(word.as_u64().expect("a word")).expect("a word")).collect()
        };
        let every = SideRecord {
            at: Some(Row { kind: KindId(4), span: Span { start: 3, end: 8 } }),
            edges: Some(Edges { before: None, after: Some(EdgeArm { arm: KindId(31), strength: None }) }),
            span: Some(PointSpan { start: Point { row: 1, column: 2 }, end: Point { row: 3, column: 0 } }),
            sides: Some(Sides { tree: TreeId(2), index: NodeIndex(5), end: NodeIndex(6), span: Span { start: 10, end: 14 } }),
            delimiter: Some(Delimiter::TRAILING),
            ..SideRecord::default()
        };
        let row = every.at;
        for (n, record) in [every, SideRecord { delimiter: Some(Delimiter::NONE), ..SideRecord::default() }, SideRecord { at: row, ..SideRecord::default() }].into_iter().enumerate() {
            let mut arena = Arena::new();
            let at = record.write(&mut |words| arena.push(words)).expect("room");
            let expected = words_of(n);
            let len = u32::try_from(expected.len()).expect("a length");
            assert_eq!(arena.words(at, len).expect("its words"), expected.as_slice(), "side {n}");
            assert_eq!(SideRecord::read(&arena, at), Ok(record), "side {n}");
        }
    }

    #[test]
    fn no_word_of_a_read_s_spans_names_a_chunk() {
        let mut arena = Arena::new();
        let root = Address::new(2, 0).expect("an address");
        let record = SideRecord { spans: vec![root..Address(root.0 + 105)], ..SideRecord::default() };
        let at = record.write(&mut |words| arena.push(words)).expect("room");
        let words = arena.words(at, 4).expect("its words");
        assert_eq!(words[1], 1, "one span");
        assert!(words[2..].iter().all(|&word| Address(word).chunk() >= crate::arena::MAX_BUILT_CHUNKS), "{words:?}: a span's address word names no record a header could be read at");
        assert_eq!(SideRecord::spans_at(&arena, at), Ok(record.spans));
    }

    #[test]
    fn the_spans_after_a_run_wider_than_a_chunk_read_back() {
        let record = SideRecord {
            run: (1..=crate::arena::CHUNK_WORDS).map(|word| RunEntry::Record { at: Address(word), shared: false }).collect(),
            spans: vec![Address(5)..Address(40)],
            ..SideRecord::default()
        };
        let mut arena = Arena::new();
        let at = record.write(&mut |words| arena.push(words)).expect("room");
        assert_eq!(SideRecord::read(&arena, at), Ok(SideRecord { spans: Vec::new(), starts: None, ..record.clone() }));
        assert_eq!(SideRecord::spans_at(&arena, at), Ok(record.spans));
    }

    #[test]
    fn only_spans_at_reads_a_span_and_refuses_a_malformed_one() {
        let mut arena = Arena::new();
        for words in [vec![mask::SPANS, 1, 5, 9], vec![mask::SPANS, 1, SPAN_WORD | 9, 4], vec![mask::SPANS, 1, SPAN_WORD | 9, SPAN_WORD | 4], vec![mask::SPANS, 1, SPAN_WORD | 9, SPAN_WORD | 9]] {
            let at = arena.push(&words).expect("room");
            assert_eq!(SideRecord::read(&arena, at), Ok(SideRecord::default()), "{words:?}: a read steps over the spans");
            assert!(SideRecord::read_facts(&arena, at).is_ok(), "{words:?}");
            assert!(SideRecord::read_facts(&arena, at).is_ok(), "{words:?}");
            assert!(SideRecord::spans_at(&arena, at).is_err(), "{words:?}");
        }
    }

    #[test]
    fn a_span_count_past_the_record_s_words_is_refused_by_every_read() {
        let mut arena = Arena::new();
        for words in [vec![mask::SPANS, 2, SPAN_WORD | 1, SPAN_WORD | 2], vec![mask::SPANS, 1_000], vec![mask::SPANS, u32::MAX]] {
            let at = arena.push(&words).expect("room");
            assert!(SideRecord::read(&arena, at).is_err(), "{words:?}");
            assert!(SideRecord::read_facts(&arena, at).is_err(), "{words:?}");
            assert!(SideRecord::read_facts(&arena, at).is_err(), "{words:?}");
            assert!(SideRecord::spans_at(&arena, at).is_err(), "{words:?}");
        }
    }

    #[test]
    fn an_empty_side_record_is_no_record() {
        let mut arena = Arena::new();
        assert_eq!(SideRecord::default().write(&mut |words| arena.push(words)), Ok(Address::NONE));
        assert_eq!(SideRecord::read(&arena, Address::NONE), Ok(SideRecord::default()));
    }

    #[test]
    fn a_side_record_no_writer_writes_is_refused() {
        let mut arena = Arena::new();
        for words in [
            vec![0],
            vec![1 << 11],
            vec![mask::FLANKS, 0],
            vec![mask::FLANKS, 3],
            vec![mask::FLANKS, 1 << 16],
            vec![mask::AT],
            vec![mask::AT, 1, 2],
            vec![mask::AT, 1, 9, 4],
            vec![mask::AT, 70_000, 1, 2],
            vec![mask::EDGES, 5, 0],
            vec![mask::EDGES, EDGE_SET | 9 << 16, 0],
            vec![mask::SIDES, 1, 2, 3, 9, 4],
            vec![mask::DELIMITER, 4],
            vec![mask::DELIMITER],
            vec![mask::SEPARATOR_KIND, 70_000],
            vec![mask::SLOTS, u32::MAX],
            vec![mask::SLOTS, 1, 2, 70_002, 0, 0, 0, 0],
            vec![mask::SLOTS, 1, 2, 0, 0, 0, 0, 70_002],
            vec![mask::SPANS],
            vec![mask::SPANS, 0],
        ] {
            let at = arena.push(&words).expect("room");
            assert!(SideRecord::read(&arena, at).is_err(), "{words:?}");
        }
        assert!(SideRecord::read(&arena, Address::new(40, 0).expect("in range")).is_err());
    }

    #[test]
    fn every_strength_reads_back() {
        for code in 0..=4 {
            let strength = SeamStrength::from_code(code).expect("a strength");
            let edge = Some(EdgeArm { arm: KindId(3), strength: Some(strength) });
            assert_eq!(read_edge(edge_word(edge)), Ok(edge));
        }
        assert_eq!(SeamStrength::from_code(5), None);
    }
}

