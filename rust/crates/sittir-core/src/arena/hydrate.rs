//! Direct hydration: a parsed node's record written from its tree as the
//! node's routing walk reaches each child, with no native node made first.
//! The derive writes each node type's walk (`HydrateNode`) beside its typed
//! read, through the same router; a slot's cells come from its stamps alone.
//!
//! A child with a record of its own is held by its coordinate. Within the
//! read's depth it also gets its record, published as its own walk ends; past
//! it, its row has none until a later read writes one. A bounded child, whose
//! slot stamps an embedded capacity, is written into its holder's record at
//! any depth, and its row's index names it there once its holder publishes,
//! unless the row holds a record already: then the embedded copy, which holds
//! the same words, is named by its holder alone. A leaf, a unit and a
//! captured string have no record and are held whole. So a record's words
//! depend on its row only, never on the depth it was read at.
//!
//! A record is a draft until its walk ends: its side record, its lists' runs
//! and its embedded children's are written then, with the record, so a
//! refused walk leaves nothing in the arena, and records published by the
//! walks of its children stay as they are.

use super::{Address, ArenaError, Cell, CellShape, ListCell, Row, SideRecord, TreeArena};
use crate::read::{Depth, Elided, ReadCtx, ReadError, ReadNode, ReadSlot, SlotSite};
use crate::record::{form, stored, Stored};
use crate::slot::SlotValue;
use crate::types::{KindId, NodeIndex, Span};
use crate::NonEmptyVec;
use tree_sitter::TreeCursor;

/// What a refused hydration names: the read's refusal, or the arena's.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum HydrateError {
    Read(ReadError),
    Arena(ArenaError),
}

impl From<ReadError> for HydrateError {
    fn from(error: ReadError) -> Self {
        Self::Read(error)
    }
}

impl From<ArenaError> for HydrateError {
    fn from(error: ArenaError) -> Self {
        Self::Arena(error)
    }
}

impl HydrateError {
    /// The refusal in words, naming kinds by `kind_name`.
    #[must_use]
    pub fn describe(&self, kind_name: &dyn Fn(KindId) -> &'static str) -> String {
        match self {
            Self::Read(error) => error.describe(kind_name),
            Self::Arena(error) => error.to_string(),
        }
    }
}

/// What a parsed child is held as in its holder's record.
#[derive(Debug)]
pub enum Hydrated {
    /// A node with a record, by its coordinate, or a leaf (`leaf`): its
    /// stored kind, its row and its byte span.
    Node { kind: KindId, row: NodeIndex, span: Span, leaf: bool },
    /// A unit and the row it was read at; the blank arm has none.
    Unit { kind: KindId, row: Option<NodeIndex> },
    /// A captured string.
    Text { span: Span },
    /// A bounded child's record, embedded in its holder's.
    Embedded(Draft),
}

impl Hydrated {
    /// The blank arm.
    pub const BLANK: Hydrated = Hydrated::Unit { kind: KindId::BLANK, row: None };

    fn cell(&self) -> Cell {
        match *self {
            Hydrated::Node { kind, row, span, leaf: false } => Cell::Coordinate { kind, index: row, span },
            Hydrated::Node { kind, row, span, leaf: true } => Cell::ParsedLeaf { kind, span, row },
            Hydrated::Unit { kind, row } => Cell::Unit { kind, row },
            Hydrated::Text { span } => Cell::ParsedText { span },
            Hydrated::Embedded(_) => Cell::Absent,
        }
    }
}

/// A record being written: its words, and what its walk's end writes with
/// it, each at its offset in the words: the side records of it and of its
/// embedded children, its lists' runs, and the rows it and its embedded
/// children are indexed by.
#[derive(Debug)]
pub struct Draft {
    words: Vec<u32>,
    bits: u32,
    sides: Vec<(u32, SideRecord)>,
    runs: Vec<(u32, Vec<u32>)>,
    rows: Vec<(u32, NodeIndex)>,
}

impl Draft {
    /// The cell `value` of the slot of shape `shape`; `None` is absent.
    ///
    /// # Errors
    ///
    /// What encoding the cell refuses, or an embedded record past the
    /// slot's capacity.
    pub fn cell(&mut self, shape: CellShape, value: Option<Hydrated>) -> Result<(), HydrateError> {
        let start = shape.word as usize;
        let out = self.words.get_mut(start..start + shape.width as usize).ok_or(ArenaError::Malformed { what: "cell word", word: shape.word })?;
        match value {
            Some(Hydrated::Embedded(child)) => {
                let payload = Cell::inline_payload(out, shape)?;
                payload.get_mut(..child.words.len()).ok_or(ArenaError::Malformed { what: "inline cell width", word: shape.inline })?.copy_from_slice(&child.words);
                let at = shape.word + u32::try_from(shape.payload_start()).unwrap_or(0);
                self.sides.extend(child.sides.into_iter().map(|(offset, side)| (offset + at, side)));
                self.runs.extend(child.runs.into_iter().map(|(offset, run)| (offset + at, run)));
                self.rows.extend(child.rows.into_iter().map(|(offset, row)| (offset + at, row)));
                Ok(())
            }
            value => Ok(value.map_or(Cell::Absent, |value| value.cell()).encode_parsed(out, shape, self.bits)?),
        }
    }

    /// The list of the slot of shape `shape`, its items `items`, a `None`
    /// item absent: its one word, naming the run of item cells the walk's end
    /// writes.
    ///
    /// # Errors
    ///
    /// What encoding an item refuses.
    pub fn list(&mut self, shape: CellShape, items: impl ExactSizeIterator<Item = Option<Hydrated>>) -> Result<(), HydrateError> {
        let len = u32::try_from(items.len()).map_err(|_| ArenaError::Full)?;
        if len == 0 {
            return Ok(());
        }
        let width = shape.run.ok_or(ArenaError::Malformed { what: "list run width", word: shape.word })? as usize;
        let mut run = vec![0; 1 + items.len() * width];
        run[0] = len;
        for (item, out) in items.zip(run[1..].chunks_exact_mut(width)) {
            match item {
                Some(Hydrated::Embedded(_)) => return Err(ArenaError::Unwritable("an embedded record in a list").into()),
                item => item.map_or(Cell::Absent, |item| item.cell()).encode_parsed(out, shape, self.bits)?,
            }
        }
        self.runs.push((shape.word, run));
        Ok(())
    }

    /// Sets the presence bit `bit` of word `word` when `present`.
    pub fn flag(&mut self, word: u32, bit: u32, present: bool) {
        if let Some(at) = self.words.get_mut(word as usize) {
            *at |= u32::from(present) << bit;
        }
    }
}

/// Where a hydration writes: the tree's arena and row index. A hydration
/// that reaches past what is recorded (`hydrating`) walks a row that holds a
/// record already, for the children it reaches, and writes nothing for it.
pub struct Hydration<'a> {
    tree: &'a mut TreeArena,
    hydrating: bool,
}

/// What a walk does for a node with a record of its own.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Walk {
    /// Nothing: its holder holds its coordinate.
    Skip,
    /// Writes its record.
    Write,
}

impl<'a> Hydration<'a> {
    /// A hydration of `tree`'s records; `hydrating` walks rows that hold a
    /// record already for the children within the depth.
    pub fn new(tree: &'a mut TreeArena, hydrating: bool) -> Self {
        Self { tree, hydrating }
    }

    /// Whether the walk of a node with a record at `row`, read at `depth`
    /// (`None` past the read's depth), embedded in its holder's record when
    /// `inline`, writes its record.
    #[must_use]
    pub fn walk(&self, row: NodeIndex, depth: Option<Depth>, inline: bool) -> Walk {
        match depth {
            _ if inline => Walk::Write,
            Some(_) if self.hydrating || self.tree.record(row).is_none() => Walk::Write,
            _ => Walk::Skip,
        }
    }

    /// The draft of a record of `kind`, `words` words, its header written.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a record narrower than its header or a
    /// kind its arena's kind field cannot hold.
    pub fn draft(&self, kind: KindId, words: u32) -> Result<Draft, HydrateError> {
        if words < crate::record::HEADER_WORDS || kind == KindId::BLANK || kind == KindId::ERROR {
            return Err(ArenaError::Malformed { what: "record header", word: u32::from(kind.0) }.into());
        }
        let bits = self.tree.arena().kind_bits();
        let mut draft = Draft { words: vec![0; words as usize], bits, sides: Vec::new(), runs: Vec::new(), rows: Vec::new() };
        draft.words[0] = super::with_kind(kind, bits)?;
        Ok(draft)
    }

    /// Ends the walk of the record `draft` at `row`, whose side record is
    /// `side`: embedded in its holder (`inline`), or published with its
    /// row's index entry, and what its holder holds, `held`, answered. A row
    /// that holds a record already keeps it, and the draft is dropped.
    ///
    /// # Errors
    ///
    /// What the arena refuses.
    pub fn finish(&mut self, mut draft: Draft, side: SideRecord, row: NodeIndex, inline: bool, held: Hydrated) -> Result<Hydrated, HydrateError> {
        draft.sides.push((0, side));
        draft.rows.push((0, row));
        if inline {
            return Ok(Hydrated::Embedded(draft));
        }
        if self.tree.record(row).is_none() {
            self.publish(draft)?;
        }
        Ok(held)
    }

    fn publish(&mut self, draft: Draft) -> Result<Address, HydrateError> {
        let Draft { mut words, sides, runs, rows, .. } = draft;
        for (offset, side) in sides {
            if !side.is_empty() {
                words[offset as usize + 1] = side.write(self.tree.arena_mut())?.0;
            }
        }
        for (offset, run) in runs {
            let at = self.tree.arena_mut().push(&run)?;
            words[offset as usize] = ListCell::word(at)?.0;
        }
        let at = self.tree.push_record(&words)?;
        for (offset, row) in rows {
            let record = at.offset(offset).ok_or(ArenaError::Malformed { what: "inline record address", word: offset })?;
            if offset != 0 {
                self.tree.keep_inline(record);
            }
            if self.tree.record(row).is_none() {
                self.tree.index(row, record)?;
            }
        }
        Ok(at)
    }
}

/// The side record of a parsed record read at `row`: where it came from,
/// and a list's delimiters.
#[must_use]
pub fn parsed_side(row: Row, delimiter: Option<crate::types::Delimiter>) -> SideRecord {
    SideRecord { at: Some(row), delimiter, ..SideRecord::default() }
}

/// The row the node the cursor is on was read at, with its subtree's end and
/// its span: the whole source for the root, as a read's coordinate names it.
#[must_use]
pub fn row_of(cursor: &TreeCursor<'_>, ctx: &ReadCtx<'_>) -> Row {
    let index = crate::read::index_of(cursor);
    let node = cursor.node();
    let span = if index == NodeIndex::ROOT { Span::whole(ctx.source) } else { Span::of(&node) };
    Row { index, end: index + crate::read::descendant_count(&node), span }
}

/// A node type's direct hydration: what the node the cursor is on is held as
/// in its holder's record, its own record written as its walk ends when it
/// has one. `depth` is the levels the read reaches from the node, `None` past
/// them; `inline` embeds its record in its holder's. The derive writes every
/// impl. The cursor ends where it started.
pub trait HydrateNode: ReadNode + Stored {
    /// # Errors
    ///
    /// What the node's read refuses, by the same router, and what the arena
    /// refuses.
    fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, inline: bool) -> Result<Hydrated, HydrateError>;
}

impl<T: HydrateNode> HydrateNode for Box<T> {
    fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, inline: bool) -> Result<Hydrated, HydrateError> {
        T::hydrate(cursor, ctx, depth, records, inline)
    }
}

/// The child the cursor is on, as the slot of shape `shape` holds it,
/// within a holder read at `depth`.
fn hydrate_value<T: HydrateNode>(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, shape: CellShape) -> Result<Hydrated, HydrateError> {
    T::hydrate(cursor, ctx, depth.and_then(Depth::below), records, shape.forms & form::INLINE != 0)
}

fn one(acc: &mut Option<Hydrated>, at: SlotSite, value: impl FnOnce() -> Result<Hydrated, HydrateError>) -> Result<(), HydrateError> {
    if acc.is_some() {
        return Err(ReadError::Overfull { kind: at.kind, slot: at.slot, index: at.index }.into());
    }
    *acc = Some(value()?);
    Ok(())
}

fn missing(at: SlotSite) -> HydrateError {
    ReadError::Missing { kind: at.kind, slot: at.slot, index: at.index }.into()
}

/// How a slot's field type holds the children its walk routes to it in a
/// parsed record, as `ReadSlot` holds them in a native node.
pub trait HydrateSlot: ReadSlot {
    type Held;
    fn held() -> Self::Held;
    /// # Errors
    ///
    /// A second child of a single slot, and what the child's hydration
    /// refuses.
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape) -> Result<(), HydrateError>;
    fn separator_held(held: &mut Self::Held, tagged: bool) {
        let _ = (held, tagged);
    }
    /// # Errors
    ///
    /// A required slot with no child, and what writing its cell refuses.
    fn finish_held(held: Self::Held, at: SlotSite, shape: CellShape, draft: &mut Draft) -> Result<(), HydrateError>;
}

impl<T: HydrateNode, const A: bool> HydrateSlot for SlotValue<T, A> {
    type Held = Option<Hydrated>;
    fn held() -> Self::Held {
        None
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape) -> Result<(), HydrateError> {
        one(held, at, || hydrate_value::<T>(cursor, ctx, depth, records, shape))
    }
    fn finish_held(held: Self::Held, at: SlotSite, shape: CellShape, draft: &mut Draft) -> Result<(), HydrateError> {
        let value = held.ok_or_else(|| missing(at))?;
        draft.cell(shape, Some(value))
    }
}

/// With no child, the type's blank arm if it has one, as the typed read
/// takes it, else absent.
impl<T: HydrateNode, const A: bool> HydrateSlot for Option<SlotValue<T, A>> {
    type Held = Option<Hydrated>;
    fn held() -> Self::Held {
        None
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape) -> Result<(), HydrateError> {
        one(held, at, || hydrate_value::<T>(cursor, ctx, depth, records, shape))
    }
    fn finish_held(held: Self::Held, _: SlotSite, shape: CellShape, draft: &mut Draft) -> Result<(), HydrateError> {
        let value = held.or_else(|| (T::STORED & stored::BLANK != 0).then_some(Hydrated::BLANK));
        draft.cell(shape, value)
    }
}

impl<T: HydrateNode, const A: bool> HydrateSlot for Vec<SlotValue<T, A>> {
    type Held = Vec<Hydrated>;
    fn held() -> Self::Held {
        Vec::new()
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, _: SlotSite, records: &mut Hydration<'_>, shape: CellShape) -> Result<(), HydrateError> {
        held.push(hydrate_value::<T>(cursor, ctx, depth, records, shape)?);
        Ok(())
    }
    fn finish_held(held: Self::Held, _: SlotSite, shape: CellShape, draft: &mut Draft) -> Result<(), HydrateError> {
        draft.list(shape, held.into_iter().map(Some))
    }
}

impl<T: HydrateNode, const A: bool> HydrateSlot for NonEmptyVec<SlotValue<T, A>> {
    type Held = Vec<Hydrated>;
    fn held() -> Self::Held {
        Vec::new()
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape) -> Result<(), HydrateError> {
        <Vec<SlotValue<T, A>> as HydrateSlot>::take_held(held, cursor, ctx, depth, at, records, shape)
    }
    fn finish_held(held: Self::Held, at: SlotSite, shape: CellShape, draft: &mut Draft) -> Result<(), HydrateError> {
        if held.is_empty() {
            return Err(missing(at));
        }
        draft.list(shape, held.into_iter().map(Some))
    }
}

impl<T: HydrateNode, const A: bool> HydrateSlot for Vec<Option<SlotValue<T, A>>> {
    type Held = Elided<Hydrated>;
    fn held() -> Self::Held {
        Elided::default()
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, _: SlotSite, records: &mut Hydration<'_>, shape: CellShape) -> Result<(), HydrateError> {
        held.push(hydrate_value::<T>(cursor, ctx, depth, records, shape)?);
        Ok(())
    }
    fn separator_held(held: &mut Self::Held, tagged: bool) {
        held.separator(tagged);
    }
    fn finish_held(held: Self::Held, _: SlotSite, shape: CellShape, draft: &mut Draft) -> Result<(), HydrateError> {
        draft.list(shape, held.positions().into_iter())
    }
}

impl<T: HydrateNode, const A: bool> HydrateSlot for NonEmptyVec<Option<SlotValue<T, A>>> {
    type Held = Elided<Hydrated>;
    fn held() -> Self::Held {
        Elided::default()
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape) -> Result<(), HydrateError> {
        <Vec<Option<SlotValue<T, A>>> as HydrateSlot>::take_held(held, cursor, ctx, depth, at, records, shape)
    }
    fn separator_held(held: &mut Self::Held, tagged: bool) {
        held.separator(tagged);
    }
    fn finish_held(held: Self::Held, at: SlotSite, shape: CellShape, draft: &mut Draft) -> Result<(), HydrateError> {
        let positions = held.positions();
        if positions.is_empty() {
            return Err(missing(at));
        }
        draft.list(shape, positions.into_iter())
    }
}

/// The record of the node at `index` of `tree`'s cursor, read `depth` levels
/// down into `N` as its walk writes it, and the record its row holds after:
/// `None` for a node with no record, a leaf or a unit.
///
/// # Errors
///
/// What the hydration refuses.
pub fn hydrate_at<N: HydrateNode>(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, index: NodeIndex, depth: Depth, records: &mut Hydration<'_>) -> Result<Option<Address>, HydrateError> {
    crate::read::goto(cursor, index);
    N::hydrate(cursor, ctx, Some(depth), records, false)?;
    Ok(records.tree.record(index))
}
