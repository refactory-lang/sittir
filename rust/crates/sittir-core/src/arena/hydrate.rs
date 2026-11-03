//! Direct hydration: a parsed node's record written from its tree as the
//! node's routing walk reaches each child, with no native node made first.
//! The derive writes each node type's walk (`HydrateNode`) beside its typed
//! read, through the same router; a slot's cells come from its stamps alone.
//!
//! A child with a record of its own is held by its record's address within
//! the read's depth, its record published as its own walk ends, and past it
//! by its coordinate, until the first read through that cell writes the
//! record and rewrites the cell to name it. A bounded child, whose slot
//! stamps an embedded capacity, is written into its holder's record at any
//! depth. A leaf, a unit and a captured string have no record and are held
//! whole. A walk writes only nodes its holder's cell names, and a holder's
//! walk is the one walk that does, so a tree holds one record per row.
//!
//! A record is written in place: its walk reserves its words in one chunk
//! when it starts, and writes each cell there as its slot closes. A list's
//! run is reserved when its slot closes, its length known then; a bounded
//! child's walk writes its record into its holder's cell; a side record is
//! written when its record's walk ends. A refused walk leaves the arena as
//! it found it (`hydrate_at`), the records its children's walks wrote
//! included.

use super::{Address, ArenaError, Cell, CellShape, ListCell, Row, SideRecord, TreeArena};
use crate::read::{Depth, Elided, ReadCtx, ReadError, ReadNode, ReadSlot, SlotSite};
use crate::record::{stored, Stored, HEADER_WORDS};
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
    /// A node whose record its walk published: its stored kind and record.
    Record { kind: KindId, at: Address },
    /// A unit and the row it was read at; the blank arm has none.
    Unit { kind: KindId, row: Option<NodeIndex> },
    /// A captured string.
    Text { span: Span },
    /// A bounded child's record, which its walk wrote into its holder's
    /// cell.
    Embedded,
}

impl Hydrated {
    /// The blank arm.
    pub const BLANK: Hydrated = Hydrated::Unit { kind: KindId::BLANK, row: None };

    fn cell(&self) -> Result<Cell, ArenaError> {
        Ok(match *self {
            Hydrated::Node { kind, row, span, leaf: false } => Cell::Coordinate { kind, index: row, span },
            Hydrated::Node { kind, row, span, leaf: true } => Cell::ParsedLeaf { kind, span, row },
            Hydrated::Record { kind, at } => Cell::Child { kind, at, link: None, changed: crate::slot::ChangedEdges::default() },
            Hydrated::Unit { kind, row } => Cell::Unit { kind, row },
            Hydrated::Text { span } => Cell::ParsedText { span },
            Hydrated::Embedded => return Err(ArenaError::Unwritable("an embedded record outside its holder's cell")),
        })
    }
}

/// A record its walk writes in place: where its words are, reserved when
/// the walk started or in its holder's cell, and how many.
#[derive(Debug, Clone, Copy)]
pub struct Draft {
    at: Address,
    words: u32,
}

impl Draft {
    /// Where the `width` words from word `word` of the record lie.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for words past the record's.
    fn place(self, word: u32, width: u32) -> Result<Address, ArenaError> {
        let malformed = ArenaError::Malformed { what: "cell word", word };
        if word.checked_add(width).is_none_or(|end| end > self.words) {
            return Err(malformed);
        }
        self.at.offset(word).ok_or(malformed)
    }
}

/// Where a bounded child's walk writes its record: the payload of its
/// holder's cell, and the words it holds.
#[derive(Debug, Clone, Copy)]
pub struct Embed {
    at: Address,
    words: u32,
}

/// Where a hydration writes: the tree's arena.
pub struct Hydration<'a> {
    tree: &'a mut TreeArena,
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
    /// A hydration of `tree`'s records.
    pub fn new(tree: &'a mut TreeArena) -> Self {
        Self { tree }
    }

    /// Whether the walk of a node with a record, read at `depth` (`None` past
    /// the read's depth), embedded in its holder's cell at `inline`, writes
    /// its record.
    #[must_use]
    pub fn walk(&self, depth: Option<Depth>, inline: Option<Embed>) -> Walk {
        if inline.is_some() || depth.is_some() { Walk::Write } else { Walk::Skip }
    }

    /// Where the bounded child the slot of shape `shape` of `holder` holds
    /// writes its record: its cell's payload, `None` for a slot that embeds
    /// no record.
    ///
    /// # Errors
    ///
    /// What `Cell::inline_payload` refuses, and a cell past its holder's
    /// words.
    pub fn embed(&self, holder: Draft, shape: CellShape) -> Result<Option<Embed>, HydrateError> {
        if shape.forms & crate::record::form::INLINE == 0 {
            return Ok(None);
        }
        let cell = holder.place(shape.word, shape.width)?;
        let payload = Cell::inline_payload(self.tree.arena().words(cell, shape.width)?, shape)?;
        let at = cell.offset(u32::try_from(payload.start).map_err(|_| ArenaError::Full)?).ok_or(ArenaError::Malformed { what: "inline record address", word: shape.word })?;
        Ok(Some(Embed { at, words: shape.inline }))
    }

    /// The record of `kind`, `words` words, its header written: reserved in
    /// one chunk, or in its holder's cell at `inline`.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a record narrower than its header, wider
    /// than the cell it is embedded in, or of a kind its arena's kind field
    /// cannot hold; and what the arena refuses.
    pub fn draft(&mut self, kind: KindId, words: u32, inline: Option<Embed>) -> Result<Draft, HydrateError> {
        if words < HEADER_WORDS || kind == KindId::BLANK || kind == KindId::ERROR {
            return Err(ArenaError::Malformed { what: "record header", word: u32::from(kind.0) }.into());
        }
        let header = super::with_kind(kind, self.tree.arena().kind_bits())?;
        let at = match inline {
            Some(embed) if words > embed.words => return Err(ArenaError::Malformed { what: "inline cell width", word: embed.words }.into()),
            Some(embed) => embed.at,
            None => self.tree.arena_mut().alloc(words)?,
        };
        self.tree.arena_mut().words_mut(at, 1)?[0] = header;
        Ok(Draft { at, words })
    }

    /// Writes the cell of the slot of shape `shape` of `draft`: `value`,
    /// `None` absent.
    ///
    /// # Errors
    ///
    /// What encoding the cell refuses, and a cell past the record's words.
    pub fn cell(&mut self, draft: Draft, shape: CellShape, value: Option<Hydrated>) -> Result<(), HydrateError> {
        let bits = self.tree.arena().kind_bits();
        let out = self.tree.arena_mut().words_mut(draft.place(shape.word, shape.width)?, shape.width)?;
        match value {
            Some(Hydrated::Embedded) => Cell::inline_tag(out, shape)?,
            value => value.map_or(Ok(Cell::Absent), |value| value.cell())?.encode_parsed(out, shape, bits)?,
        }
        Ok(())
    }

    /// Writes the list of the slot of shape `shape` of `draft`, its items
    /// `items`, a `None` item absent: their run, reserved now its length is
    /// known, and the one word naming it.
    ///
    /// # Errors
    ///
    /// What encoding an item refuses, a cell past the record's words, and
    /// what the arena refuses.
    pub fn list(&mut self, draft: Draft, shape: CellShape, items: impl ExactSizeIterator<Item = Option<Hydrated>>) -> Result<(), HydrateError> {
        let len = u32::try_from(items.len()).map_err(|_| ArenaError::Full)?;
        if len == 0 {
            return Ok(());
        }
        let width = shape.run.ok_or(ArenaError::Malformed { what: "list run width", word: shape.word })?;
        let words = len.checked_mul(width).and_then(|cells| cells.checked_add(1)).ok_or(ArenaError::Full)?;
        let cell = draft.place(shape.word, 1)?;
        let bits = self.tree.arena().kind_bits();
        let arena = self.tree.arena_mut();
        let run = arena.alloc(words)?;
        let out = arena.words_mut(run, words)?;
        out[0] = len;
        for (item, out) in items.zip(out[1..].chunks_exact_mut(width as usize)) {
            item.map_or(Ok(Cell::Absent), |item| item.cell())?.encode_parsed(out, shape, bits)?;
        }
        arena.words_mut(cell, 1)?[0] = ListCell::word(run)?.0;
        Ok(())
    }

    /// Sets the presence bit `bit` of word `word` of `draft` when `present`.
    ///
    /// # Errors
    ///
    /// A word past the record's.
    pub fn flag(&mut self, draft: Draft, word: u32, bit: u32, present: bool) -> Result<(), HydrateError> {
        if present {
            self.tree.arena_mut().words_mut(draft.place(word, 1)?, 1)?[0] |= 1 << bit;
        }
        Ok(())
    }

    /// Ends the walk of the record `draft` of `kind`: writes its side record
    /// `side`, and answers what its holder holds, the record, or, written in
    /// its holder's cell at `inline`, that cell's embedded record.
    ///
    /// # Errors
    ///
    /// What the arena refuses.
    pub fn finish(&mut self, draft: Draft, side: &SideRecord, kind: KindId, inline: Option<Embed>) -> Result<Hydrated, HydrateError> {
        let side = side.write_in(self.tree.arena_mut())?;
        if side != Address::NONE {
            self.tree.arena_mut().words_mut(draft.place(1, 1)?, 1)?[0] = side.0;
        }
        self.tree.keep_record(draft.at);
        Ok(if inline.is_some() { Hydrated::Embedded } else { Hydrated::Record { kind, at: draft.at } })
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
/// in its holder's record, its own record written as its walk goes when it
/// has one. `depth` is the levels the read reaches from the node, `None` past
/// them; `inline` is where in its holder's cell its record is written. The
/// derive writes every impl. The cursor ends where it started.
pub trait HydrateNode: ReadNode + Stored {
    /// # Errors
    ///
    /// What the node's read refuses, by the same router, and what the arena
    /// refuses.
    fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, inline: Option<Embed>) -> Result<Hydrated, HydrateError>;
}

impl<T: HydrateNode> HydrateNode for Box<T> {
    fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, inline: Option<Embed>) -> Result<Hydrated, HydrateError> {
        T::hydrate(cursor, ctx, depth, records, inline)
    }
}

/// The child the cursor is on, as the slot of shape `shape` of `holder`
/// holds it, within a holder read at `depth`.
fn hydrate_value<T: HydrateNode>(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<Hydrated, HydrateError> {
    let inline = records.embed(holder, shape)?;
    T::hydrate(cursor, ctx, depth.and_then(Depth::below), records, inline)
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
    /// Takes the child the cursor is on into `held`, for the slot of shape
    /// `shape` of the record `holder`.
    ///
    /// # Errors
    ///
    /// A second child of a single slot, and what the child's hydration
    /// refuses.
    #[allow(clippy::too_many_arguments, reason = "the walk's state, the slot and its holder, each passed once")]
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError>;
    fn separator_held(held: &mut Self::Held, tagged: bool) {
        let _ = (held, tagged);
    }
    /// Writes the cell of the slot of shape `shape` of the record `holder`
    /// from what `held` took.
    ///
    /// # Errors
    ///
    /// A required slot with no child, and what writing its cell refuses.
    fn finish_held(held: Self::Held, at: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError>;
}

impl<T: HydrateNode, const A: bool> HydrateSlot for SlotValue<T, A> {
    type Held = Option<Hydrated>;
    fn held() -> Self::Held {
        None
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError> {
        one(held, at, || hydrate_value::<T>(cursor, ctx, depth, records, shape, holder))
    }
    fn finish_held(held: Self::Held, at: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        let value = held.ok_or_else(|| missing(at))?;
        records.cell(holder, shape, Some(value))
    }
}

/// With no child, the type's blank arm if it has one, as the typed read
/// takes it, else absent.
impl<T: HydrateNode, const A: bool> HydrateSlot for Option<SlotValue<T, A>> {
    type Held = Option<Hydrated>;
    fn held() -> Self::Held {
        None
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError> {
        one(held, at, || hydrate_value::<T>(cursor, ctx, depth, records, shape, holder))
    }
    fn finish_held(held: Self::Held, _: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        let value = held.or_else(|| (T::STORED & stored::BLANK != 0).then_some(Hydrated::BLANK));
        records.cell(holder, shape, value)
    }
}

impl<T: HydrateNode, const A: bool> HydrateSlot for Vec<SlotValue<T, A>> {
    type Held = Vec<Hydrated>;
    fn held() -> Self::Held {
        Vec::new()
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, _: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError> {
        held.push(hydrate_value::<T>(cursor, ctx, depth, records, shape, holder)?);
        Ok(())
    }
    fn finish_held(held: Self::Held, _: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        records.list(holder, shape, held.into_iter().map(Some))
    }
}

impl<T: HydrateNode, const A: bool> HydrateSlot for NonEmptyVec<SlotValue<T, A>> {
    type Held = Vec<Hydrated>;
    fn held() -> Self::Held {
        Vec::new()
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError> {
        <Vec<SlotValue<T, A>> as HydrateSlot>::take_held(held, cursor, ctx, depth, at, records, shape, holder)
    }
    fn finish_held(held: Self::Held, at: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        if held.is_empty() {
            return Err(missing(at));
        }
        records.list(holder, shape, held.into_iter().map(Some))
    }
}

impl<T: HydrateNode, const A: bool> HydrateSlot for Vec<Option<SlotValue<T, A>>> {
    type Held = Elided<Hydrated>;
    fn held() -> Self::Held {
        Elided::default()
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, _: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError> {
        held.push(hydrate_value::<T>(cursor, ctx, depth, records, shape, holder)?);
        Ok(())
    }
    fn separator_held(held: &mut Self::Held, tagged: bool) {
        held.separator(tagged);
    }
    fn finish_held(held: Self::Held, _: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        records.list(holder, shape, held.positions().into_iter())
    }
}

impl<T: HydrateNode, const A: bool> HydrateSlot for NonEmptyVec<Option<SlotValue<T, A>>> {
    type Held = Elided<Hydrated>;
    fn held() -> Self::Held {
        Elided::default()
    }
    fn take_held(held: &mut Self::Held, cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, at: SlotSite, records: &mut Hydration<'_>, shape: CellShape, holder: Draft) -> Result<(), HydrateError> {
        <Vec<Option<SlotValue<T, A>>> as HydrateSlot>::take_held(held, cursor, ctx, depth, at, records, shape, holder)
    }
    fn separator_held(held: &mut Self::Held, tagged: bool) {
        held.separator(tagged);
    }
    fn finish_held(held: Self::Held, at: SlotSite, shape: CellShape, holder: Draft, records: &mut Hydration<'_>) -> Result<(), HydrateError> {
        let positions = held.positions();
        if positions.is_empty() {
            return Err(missing(at));
        }
        records.list(holder, shape, positions.into_iter())
    }
}

/// The record of the node at `index` of `tree`'s cursor, which has none yet,
/// read `depth` levels down into `N` as its walk writes it: `None` for a node
/// with no record, a leaf or a unit. A refused walk leaves the tree's arena
/// as it found it: the words, chunks and record starts it and its children's
/// walks wrote are dropped. The walk is a read of its own: the node at
/// `index` is where it starts (`ReadCtx::begin_read`).
///
/// # Errors
///
/// What the hydration refuses.
pub fn hydrate_at<N: HydrateNode>(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, index: NodeIndex, depth: Depth, records: &mut Hydration<'_>) -> Result<Option<Address>, HydrateError> {
    crate::read::goto(cursor, index);
    ctx.begin_read();
    let mark = records.tree.mark();
    match N::hydrate(cursor, ctx, Some(depth), records, None) {
        Ok(Hydrated::Record { at, .. }) => Ok(Some(at)),
        Ok(_) => Ok(None),
        Err(refusal) => {
            records.tree.rewind(mark);
            Err(refusal)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::read::{grammar_id, index_of};
    use crate::record::{form, PARSED_KIND_BITS};
    use crate::types::TreeId;

    const fn shape(word: u32, width: u32, run: Option<u32>, inline: u32, forms: u8) -> CellShape {
        CellShape { word, width, run, inline, forms, built: 0, key: "" }
    }

    /// An identifier, its record written in its holder's cell.
    struct Name;
    /// A function item: its name's record in its first cell, and its
    /// parameters and body by coordinate in a list.
    struct Item;
    /// A source file: a list of its items' records, refused once they are
    /// all written when `REFUSE`.
    struct File<const REFUSE: bool>;

    macro_rules! toys {
        ($([$($generic:tt)*] $ty:ty),*) => {$(
            impl<$($generic)*> ReadNode for $ty {
                fn admits(_: KindId, _: KindId) -> bool {
                    true
                }
                fn takes_tagged(_: KindId, _: KindId, _: bool) -> bool {
                    true
                }
                fn read(cursor: &mut TreeCursor<'_>, _: &mut ReadCtx<'_>, _: Depth) -> Result<Self, ReadError> {
                    Err(ReadError::Unadmitted { kind: grammar_id(&cursor.node()), index: index_of(cursor) })
                }
            }
            impl<$($generic)*> Stored for $ty {
                const STORED: u8 = stored::RECORD;
            }
        )*};
    }

    toys!([] Name, [] Item, [const REFUSE: bool] File<REFUSE>);

    const NAME: CellShape = shape(2, 2, None, 2, form::INLINE);
    const PARTS: CellShape = shape(4, 1, Some(3), 0, form::NODE);
    const ITEMS: CellShape = shape(2, 1, Some(3), 0, form::NODE);

    impl HydrateNode for Name {
        fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, _: Option<Depth>, records: &mut Hydration<'_>, inline: Option<Embed>) -> Result<Hydrated, HydrateError> {
            let (row, kind) = (row_of(cursor, ctx), grammar_id(&cursor.node()));
            let draft = records.draft(kind, 2, inline)?;
            records.finish(draft, &parsed_side(row, None), kind, inline)
        }
    }

    impl HydrateNode for Item {
        fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, _: Option<Depth>, records: &mut Hydration<'_>, inline: Option<Embed>) -> Result<Hydrated, HydrateError> {
            let (row, kind) = (row_of(cursor, ctx), grammar_id(&cursor.node()));
            let draft = records.draft(kind, 5, inline)?;
            let (mut name, mut parts) = (None, Vec::new());
            cursor.goto_first_child();
            loop {
                let node = cursor.node();
                match node.kind() {
                    "identifier" => {
                        let embed = records.embed(draft, NAME)?;
                        name = Some(Name::hydrate(cursor, ctx, None, records, embed)?);
                    }
                    "parameters" | "block" => parts.push(Some(Hydrated::Node { kind: grammar_id(&node), row: index_of(cursor), span: Span::of(&node), leaf: false })),
                    _ => {}
                }
                if !cursor.goto_next_sibling() {
                    break;
                }
            }
            cursor.goto_parent();
            records.cell(draft, NAME, name)?;
            records.list(draft, PARTS, parts.into_iter())?;
            records.finish(draft, &parsed_side(row, None), kind, inline)
        }
    }

    impl<const REFUSE: bool> HydrateNode for File<REFUSE> {
        fn hydrate(cursor: &mut TreeCursor<'_>, ctx: &mut ReadCtx<'_>, depth: Option<Depth>, records: &mut Hydration<'_>, inline: Option<Embed>) -> Result<Hydrated, HydrateError> {
            let (row, kind) = (row_of(cursor, ctx), grammar_id(&cursor.node()));
            let draft = records.draft(kind, 3, inline)?;
            let mut items = Vec::new();
            cursor.goto_first_child();
            loop {
                items.push(Some(Item::hydrate(cursor, ctx, depth, records, None)?));
                if !cursor.goto_next_sibling() {
                    break;
                }
            }
            cursor.goto_parent();
            records.list(draft, ITEMS, items.into_iter())?;
            if REFUSE {
                return Err(ReadError::Overfull { kind, slot: "items", index: row.index }.into());
            }
            records.finish(draft, &parsed_side(row, None), kind, inline)
        }
    }

    #[test]
    fn a_refused_walk_leaves_the_arena_as_it_found_it_its_children_s_records_included() {
        let source = "fn a() {}\nfn b(x: u8) {}\n";
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(&tree_sitter_rust::LANGUAGE.into()).expect("the rust grammar");
        let tree = parser.parse(source, None).expect("a parse");
        let rows = crate::read::descendant_count(&tree.root_node());
        let mut ctx = ReadCtx::new(source, TreeId(1), |_| false);
        let mut cursor = tree.walk();
        cursor.goto_first_child();
        let item = index_of(&cursor);

        let mut whole = TreeArena::new(PARSED_KIND_BITS, rows);
        let file = hydrate_at::<File<false>>(&mut tree.walk(), &mut ctx, NodeIndex::ROOT, Depth::All, &mut Hydration::new(&mut whole)).expect("a walk").expect("a record");
        let starts = whole.snapshot().records;
        assert_eq!(starts.len(), 5, "the file's record, each item's, and each name's in its item's cell");
        assert!(starts.contains(&file));

        let mut arena = TreeArena::new(PARSED_KIND_BITS, rows);
        let kept = hydrate_at::<Item>(&mut tree.walk(), &mut ctx, item, Depth::ONE, &mut Hydration::new(&mut arena)).expect("a walk").expect("a record");
        arena.hold(item, kept).expect("the row had none");
        let before = arena.snapshot();
        let refused = hydrate_at::<File<true>>(&mut tree.walk(), &mut ctx, NodeIndex::ROOT, Depth::All, &mut Hydration::new(&mut arena));
        assert!(matches!(refused, Err(HydrateError::Read(ReadError::Overfull { .. }))), "{refused:?}");
        assert_eq!(arena.snapshot(), before, "no word, chunk, record start or held row past where the walk started");
        assert_eq!(arena.held(item), Some(kept), "the walk that stood keeps its record");
        assert!(hydrate_at::<File<false>>(&mut tree.walk(), &mut ctx, NodeIndex::ROOT, Depth::All, &mut Hydration::new(&mut arena)).expect("a walk").is_some());
    }
}
