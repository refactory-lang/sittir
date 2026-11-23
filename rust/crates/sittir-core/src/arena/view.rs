//! What a record's view reads through, and the slot and list views a node's
//! view hands out for its cells. A view renders after prepare, through shared
//! borrows of the arenas, the trees, the store of written sides and the
//! prepared overlay; every word it reads is bounds-checked, and a cell no
//! writer writes renders as a record refusal (`RenderError::Record`).

use super::{Address, ArenaRead, ArenaError, Cell, CellShape, CellWord, ListCell, Prepared, PreparedNode, Sides, StringRef};
use crate::layout::{list_units, render_framed, render_unit, BodyLayout, TriviaRole};
use crate::options::Edges;
use crate::render::{Render, RenderError, RenderResult, RenderSink, SourceTable};
use crate::slot::{ChangedEdges, CoordinateEdges, NodeIdOrCoordinate, NodeIdOrOwnedCoordinate};
use crate::trivia::{NodeTrivia, TriviaSeam};
use super::PrepPlace;
use crate::trivia_store::{Place, Site, TriviaStore};
use crate::types::{ItemIndex, KindId, NodeId, NodeIndex, Span};
use crate::view::{KindOf, KindTest, Slot};

/// The node a render's root record renders as: its own, for a parsed record
/// its source renders (`SourceTable::renders_as_source`), as a native read of
/// it renders; none for a built record, or a parsed one a write lies in,
/// which render through their views.
///
/// # Errors
///
/// `ArenaError::Malformed` for a root naming no arena of the render, or a
/// parsed record whose source the render does not hold.
pub fn source_root<T>(root: super::CellAt, built: &dyn ArenaRead, reads: Option<&dyn ArenaRead>, store: &TriviaStore<T>, sources: &dyn SourceTable, bits: u32) -> Result<Option<NodeIdOrCoordinate<'static>>, ArenaError> {
    let prepared = Prepared::new();
    let ctx = RecordCtx::of(root.node, built, reads, sources, store, &prepared, bits)?;
    let Some(row) = ctx.cell_row(root.cell)? else { return Ok(None) };
    let at = row.at(None);
    sources.source_of(at).ok_or(malformed("record source", row.id.address()))?;
    Ok(sources.renders_as_source(at).then_some(at))
}

/// Whether the parsed node `at` names, held by `cell`, renders through its
/// record rather than as its source bytes: a write lies in its range
/// (`SourceTable::edited_within`), or the render reads templates
/// (`SourceTable::reads_templates`) and the node has a record, read or not,
/// which a leaf and a unit never do.
#[must_use]
pub fn through_record(sources: &dyn SourceTable, at: NodeIdOrCoordinate<'_>, cell: Cell) -> bool {
    sources.edited_within(at) || (sources.reads_templates() && matches!(cell, Cell::Child { .. }))
}

/// What a record's view reads through: the arena its record is in and, for
/// a record a read left, a node of its source; the arena its links reach; the
/// render's sources, its store of written sides and its prepared overlay.
pub struct RecordCtx<'a, T> {
    arena: &'a dyn ArenaRead,
    node: Option<NodeId>,
    /// The built arena that holds the records reads left of their sources,
    /// when the render reaches one.
    reads: Option<&'a dyn ArenaRead>,
    sources: &'a dyn SourceTable,
    store: &'a TriviaStore<T>,
    prepared: &'a Prepared<T>,
    bits: u32,
}

impl<T> Clone for RecordCtx<'_, T> {
    fn clone(&self) -> Self {
        *self
    }
}

impl<T> Copy for RecordCtx<'_, T> {}

fn malformed(what: &'static str, word: u32) -> ArenaError {
    ArenaError::Malformed { what, word }
}

impl<'a, T> RecordCtx<'a, T> {
    /// The context of the built arena, its kind fields `bits` bits: the
    /// grammar's.
    #[must_use]
    pub fn built(arena: &'a dyn ArenaRead, reads: Option<&'a dyn ArenaRead>, sources: &'a dyn SourceTable, store: &'a TriviaStore<T>, prepared: &'a Prepared<T>, bits: u32) -> Self {
        Self { arena, node: None, reads, sources, store, prepared, bits }
    }

    /// The context of the records a read left of the source `node` lies in,
    /// in the arena of the records reads left (`reads`).
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` when the render reaches no such arena.
    pub fn parsed(node: NodeId, reads: Option<&'a dyn ArenaRead>, sources: &'a dyn SourceTable, store: &'a TriviaStore<T>, prepared: &'a Prepared<T>, bits: u32) -> Result<Self, ArenaError> {
        let arena = reads.ok_or(malformed("record source", node.address()))?;
        Ok(Self { arena, node: Some(node), reads, sources, store, prepared, bits })
    }

    /// The side record at `at`, the default for address 0.
    ///
    /// # Errors
    ///
    /// What reading the side record refuses.
    pub fn side(self, at: Address) -> Result<super::SideRecord, ArenaError> {
        if at == Address::NONE {
            return Ok(super::SideRecord::default());
        }
        super::SideRecord::read(self.arena, at)
    }

    /// The cell the built word `word` holds.
    fn built_cell(self, word: u32) -> Result<Cell, ArenaError> {
        Cell::decode_built(CellWord(word), self.arena, self.bits)
    }

    /// `cell`, which the record at `holder` holds at `word` and `item`,
    /// naming its node: a row of 1 is the holder's own node, any other row
    /// the node of that cell's site.
    fn named(self, holder: Address, word: u32, item: u32, cell: Cell) -> Result<Cell, ArenaError> {
        if self.node.is_none() {
            return Ok(cell);
        }
        let id = |row: NodeIndex| -> Result<NodeId, ArenaError> {
            match row.0 {
                0 => Err(malformed("cell row", 0)),
                1 => Ok(NodeId::record(super::node_record(self.arena, holder)?.0)),
                _ => Ok(NodeId::leaf(holder.0, word, item)),
            }
        };
        Ok(match cell {
            Cell::ParsedLeaf { kind, span, row } => Cell::NamedLeaf { kind, span, id: id(row)? },
            Cell::Unit { kind, row: Some(row) } => Cell::NamedUnit { kind, id: id(row)? },
            cell => cell,
        })
    }

    /// The context of the source `node` lies in, the built arena `built`
    /// for none.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` when the render reaches no arena of `node`.
    pub fn of(node: Option<NodeId>, built: &'a dyn ArenaRead, reads: Option<&'a dyn ArenaRead>, sources: &'a dyn SourceTable, store: &'a TriviaStore<T>, prepared: &'a Prepared<T>, bits: u32) -> Result<Self, ArenaError> {
        match node {
            None => Ok(Self::built(built, reads, sources, store, prepared, bits)),
            Some(node) => Self::parsed(node, reads, sources, store, prepared, bits),
        }
    }

    /// The context of the source `node` lies in, which a link from this one
    /// names.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` when the render reaches no arena of `node`.
    pub fn linked(self, node: NodeId) -> Result<Self, ArenaError> {
        Self::parsed(node, self.reads, self.sources, self.store, self.prepared, self.bits)
    }

    /// The context the record a child cell names at `at` is read in: the
    /// source of a record a read left, which a built record's cell names as
    /// it names a built one; else this one.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` when the render reaches no arena of the
    /// record.
    pub fn child(self, at: Address) -> Result<Self, ArenaError> {
        if self.node.is_none() && self.arena.read_record(at) {
            return self.linked(NodeId::record(at.0));
        }
        Ok(self)
    }

    #[must_use]
    pub fn arena(self) -> &'a dyn ArenaRead {
        self.arena
    }

    /// A node of the source a read's record lies in; `None` for the built
    /// arena.
    #[must_use]
    pub fn node(self) -> Option<NodeId> {
        self.node
    }

    /// The cell of the slot of shape `shape` in `words`, the words of the
    /// record at `at`: its stamped parsed cell, or in the built arena its
    /// one built word.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a stamp past the record's words, else
    /// what decoding the cell refuses.
    pub fn slot_cell(self, words: &[u32], at: Address, shape: CellShape) -> Result<Cell, ArenaError> {
        if self.node.is_none() {
            let word = *words.get(shape.built as usize).ok_or(malformed("cell word", shape.built))?;
            return self.built_cell(word);
        }
        let cell = words.get(shape.word as usize..(shape.word + shape.width) as usize).ok_or(malformed("cell word", shape.word))?;
        self.named(at, shape.word, 0, Cell::decode_parsed(cell, shape, self.bits)?)
    }

    /// The list of the slot of shape `shape` in `words`, and the words each
    /// of its items' cells takes.
    pub(super) fn slot_list(self, words: &[u32], shape: CellShape) -> Result<(ListCell, u32), ArenaError> {
        if self.node.is_none() {
            let word = *words.get(shape.built as usize).ok_or(malformed("cell word", shape.built))?;
            return Ok((ListCell::of_word(CellWord(word), self.arena)?, 1));
        }
        let word = *words.get(shape.word as usize).ok_or(malformed("cell word", shape.word))?;
        Ok((ListCell::of_word(CellWord(word), self.arena)?, shape.run.ok_or(malformed("list run width", shape.word))?))
    }

    /// The cell item `at` of a list slot of shape `shape` of the record at
    /// `holder` holds: its run's `item` words.
    pub(super) fn item_cell(self, item: &[u32], holder: Address, shape: CellShape, at: u32) -> Result<Cell, ArenaError> {
        if self.node.is_none() {
            return self.built_cell(*item.first().ok_or(malformed("cell width", 0))?);
        }
        self.named(holder, shape.word, at, Cell::decode_parsed(item, shape, self.bits)?)
    }

    #[must_use]
    pub fn sources(self) -> &'a dyn SourceTable {
        self.sources
    }

    #[must_use]
    pub fn store(self) -> &'a TriviaStore<T> {
        self.store
    }

    #[must_use]
    pub fn prepared(self) -> &'a Prepared<T> {
        self.prepared
    }

    /// The `len` words of the record at `at`.
    ///
    /// # Errors
    ///
    /// `ArenaError::OutOfBounds` for words the arena never wrote.
    pub fn words(self, at: Address, len: u32) -> Result<&'a [u32], ArenaError> {
        self.arena.words(at, len)
    }

    /// The string a built cell names in the string table.
    ///
    /// # Errors
    ///
    /// `ArenaError::BadString` for bytes the table never wrote as a string.
    pub fn string(self, at: StringRef) -> Result<&'a str, ArenaError> {
        self.arena.text(at)
    }

    /// The text a parsed cell's span names in its tree's source.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a built arena, a node the render holds no
    /// source of, or a span that is no character range of it.
    pub fn source_text(self, span: Span) -> Result<&'a str, ArenaError> {
        let node = self.node.ok_or(malformed("parsed span in a built record", span.start))?;
        let source: &'a str = self.sources.source_of(NodeIdOrCoordinate::of(node)).ok_or(malformed("record source", node.address()))?;
        source.get(span.range()).ok_or(malformed("cell span end", span.end))
    }

    /// The text a leaf's or a captured string's cell names.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` for a cell that names no text, else what
    /// reading it refuses.
    pub fn cell_text(self, cell: Cell) -> Result<&'a str, ArenaError> {
        match cell {
            Cell::ParsedLeaf { span, .. } | Cell::NamedLeaf { span, .. } | Cell::ParsedText { span } => self.source_text(span),
            Cell::BuiltLeaf { text, .. } | Cell::BuiltText { text } => self.string(text),
            Cell::ReadLeaf { name, span, .. } => self.linked(name)?.source_text(span),
            _ => Err(malformed("text cell", 0)),
        }
    }

    /// The parsed node `cell` names, whatever cell names it: a parsed leaf
    /// or unit, a link to a node a read left, or a parsed record, with the
    /// edges a child cell marks changed; `None` for a built value.
    ///
    /// # Errors
    ///
    /// What reading a child's record or reaching its arena refuses.
    pub fn cell_row(self, cell: Cell) -> Result<Option<ParsedRow>, ArenaError> {
        Ok(match cell {
            Cell::NamedLeaf { kind, id, .. } | Cell::NamedUnit { kind, id } => Some(ParsedRow { id, kind, changed: ChangedEdges::default() }),
            Cell::ReadLeaf { kind, name, changed, .. } => Some(ParsedRow { id: name, kind, changed }),
            Cell::Child { kind, at, changed } => {
                let Some(ctx) = self.parsed_child(at, kind)? else { return Ok(None) };
                row_of(ctx, at)?.map(|id| ParsedRow { id, kind, changed })
            }
            _ => None,
        })
    }

    /// The context a child cell's parsed record of `kind` is read in
    /// (`child`); `None` for a built record.
    fn parsed_child(self, at: Address, kind: KindId) -> Result<Option<Self>, ArenaError> {
        let ctx = self.child(at)?;
        if ctx.node.is_none() {
            return Ok(None);
        }
        record_of(ctx, at, crate::record::HEADER_WORDS, kind)?;
        Ok(Some(ctx))
    }

    /// The id of the node a read left at `place`; none for a built node.
    #[must_use]
    pub fn read_node(self, place: PrepPlace) -> Option<NodeId> {
        place.read_node(self.reads)
    }
}

/// A parsed node as a cell names it: its id, the kind the cell names it as,
/// and the edges whose neighbour its holder changed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ParsedRow {
    pub id: NodeId,
    pub kind: KindId,
    pub changed: ChangedEdges,
}

impl ParsedRow {
    /// The node, between the seams `edges`.
    #[must_use]
    pub fn at(self, edges: Option<CoordinateEdges>) -> NodeIdOrCoordinate<'static> {
        NodeIdOrCoordinate::NodeId { id: self.id, edges, changed: self.changed }
    }
}

/// A record's layout as its render body reads it (`BodyLayout`), each fact
/// from where it is kept: what its prepare left in the overlay (its sides,
/// its units' sides, its slots' per-item separators), the edges the overlay
/// gives it at its site (`Prepared::edges`), the edges its site marks
/// changed, where its sides render without their layout runs, and where it
/// came from, which frames it: a parsed node's row, or the node a built node
/// was rebuilt from.
pub struct RecordLayout<'a, T> {
    ctx: RecordCtx<'a, T>,
    place: PrepPlace,
    node: Option<&'a PreparedNode<T>>,
    rebuilt_from: Option<Sides>,
    edges: Edges,
    changed: ChangedEdges,
}

impl<T> Clone for RecordLayout<'_, T> {
    fn clone(&self) -> Self {
        *self
    }
}

impl<T> Copy for RecordLayout<'_, T> {}

impl<'a, T> RecordLayout<'a, T> {
    /// The layout of the node at `place`, held at `site`: `stored` is the
    /// edges its record stores, `changed` the edges its site marks, and
    /// `rebuilt_from` the node its side record names it rebuilt from.
    #[must_use]
    pub fn new(ctx: RecordCtx<'a, T>, place: PrepPlace, site: Option<Site<PrepPlace>>, stored: Edges, changed: ChangedEdges, rebuilt_from: Option<Sides>) -> Self {
        let prepared = ctx.prepared;
        let node = prepared.node(place);
        Self { ctx, place, node, rebuilt_from, edges: prepared.edges(stored, site, node), changed }
    }

    #[must_use]
    pub fn context(&self) -> RecordCtx<'a, T> { self.ctx }

    #[must_use]
    pub fn place(&self) -> PrepPlace { self.place }

    /// The delimiters the record stores, else the ones prepare filled.
    #[must_use]
    pub fn delimiter(&self, stored: Option<crate::types::Delimiter>) -> Option<crate::types::Delimiter> {
        stored.or_else(|| self.node?.delimiter)
    }

    /// The separator the record stores, else the one prepare filled.
    #[must_use]
    pub fn separator_kind(&self, stored: Option<KindId>) -> Option<KindId> {
        stored.or_else(|| self.node?.separator_kind)
    }

    /// Separator spacing the record stores, else the spacing prepare filled.
    #[must_use]
    pub fn space(&self, word: u32, before: bool, stored: Option<KindId>) -> Option<KindId> {
        stored.or_else(|| {
            let slot = self.node?.slot(word)?;
            if before { slot.space_before } else { slot.space_after }
        })
    }

    /// Where a prepared node came from (`NodeLayout::at`, else
    /// `NodeLayout::sides`): a parsed node, an envelope's content's envelope,
    /// or the node a built node was rebuilt from.
    fn origin(self) -> Option<NodeIdOrOwnedCoordinate> {
        self.node?;
        match self.ctx.read_node(self.place) {
            Some(id) => Some(NodeIdOrOwnedCoordinate::NodeId(id)),
            None => self.rebuilt_from.map(Sides::at),
        }
    }

    fn trivia(self) -> Option<&'a NodeTrivia<T>> {
        self.node?.trivia.as_ref()
    }
}

impl<T: Render + TriviaSeam + Clone> RecordLayout<'_, T> {
    /// Writes a node of `kind` between its layout, as `NodeLayout::render`
    /// writes a native node.
    ///
    /// # Errors
    ///
    /// What `body`, or a trivia entry, refuses.
    pub fn render(self, kind: Option<KindId>, role: TriviaRole, w: &mut dyn RenderSink, body: impl FnOnce(&mut dyn RenderSink) -> RenderResult) -> RenderResult {
        let origin = self.origin();
        let origin = origin.as_ref().map(NodeIdOrOwnedCoordinate::at);
        crate::stack::grown(|| match self.trivia() {
            Some(trivia) if self.changed.leading || self.changed.trailing => {
                let mut trimmed = trivia.clone();
                trimmed.trim_changed(self.changed);
                render_framed(Some(&trimmed), self.edges, kind, origin, role, w, body)
            }
            trivia => render_framed(trivia, self.edges, kind, origin, role, w, body),
        })
    }
}

impl<'a, T: Render + TriviaSeam + std::fmt::Debug + 'a> BodyLayout<'a> for RecordLayout<'a, T> {
    fn edges(self) -> Edges {
        self.edges
    }

    fn render_unit(self, slot: &str, item: ItemIndex, w: &mut dyn RenderSink, body: impl FnOnce(&mut dyn RenderSink) -> RenderResult) -> RenderResult {
        render_unit(self.node.map_or(&[], |node| &node.units), slot, item, w, body)
    }

    fn list_units(self, slot: &'a str) -> Option<(&'a str, &'a dyn crate::view::UnitFrames)> {
        list_units(self.node.map(|node| &node.units), slot)
    }

    fn render_inner(self, w: &mut dyn RenderSink) -> RenderResult {
        crate::trivia::render_inner(self.trivia(), w)
    }

    fn has_inner(self) -> bool {
        crate::trivia::has_inner(self.trivia())
    }

    fn read(self) -> bool {
        self.ctx.read_node(self.place).is_some()
    }
}

/// A view built from the cell that names its value in a holder's record.
pub trait RecordView<'a, T>: Sized {
    /// Whether a cell of `kind` is one this view's type is written as: its
    /// own kind, a variant's, a member's, or blank text for verbatim text.
    fn claims(kind: KindId) -> bool;

    /// Whether a cell of `kind` is a record this view reads: `claims`, and
    /// the envelope kinds the record is written under where a list is shown
    /// as them. A choice dispatches by `claims`, never by this.
    #[must_use]
    fn accepts(kind: KindId) -> bool {
        Self::claims(kind)
    }

    /// The view of the value `cell` names, at `site` in its holder; a root
    /// has none.
    ///
    /// # Errors
    ///
    /// `ArenaError` for a cell this view's type is never written as, or a
    /// record of it that no writer writes.
    fn from_cell(ctx: RecordCtx<'a, T>, cell: Cell, site: Option<Site<PrepPlace>>) -> Result<Self, ArenaError>;
}

/// What a node's view reads first from its record: its words, checked to
/// be `len` and to name `kind` in its header, and its side record.
///
/// # Errors
///
/// What reading the words or the side record refuses, or
/// `ArenaError::Malformed` for a header of another kind or a parsed address
/// the native writer never allocated as a record.
pub fn record_of<T>(ctx: RecordCtx<'_, T>, at: Address, len: u32, kind: KindId) -> Result<(&[u32], super::SideRecord), ArenaError> {
    let found = ctx.arena.header_kind(at, ctx.bits)?;
    if found != kind {
        return Err(malformed("record kind", u32::from(found.0)));
    }
    let words = ctx.words(at, len)?;
    #[cfg(debug_assertions)]
    if ctx.node.is_none() && ctx.arena.released(at) {
        return Err(malformed("released record", at.0));
    }
    if ctx.node.is_some() && !ctx.arena.read_chunk(at.chunk()) {
        return Err(malformed("record address", at.0));
    }
    Ok((words, ctx.side(super::side_of(ctx.arena, at)?)?))
}

/// The cells of the parsed record at `at` in `arena`, as its kind's shape,
/// read from `shape`, lays them out: each slot's, a list slot's each
/// item's, with its slot's shape and its item there, a cell naming a row as
/// its record holds it.
///
/// # Errors
///
/// What reading the record or decoding a cell refuses, and
/// `ArenaError::Malformed` for a kind `shape` writes no record of.
pub(super) fn parsed_cells(arena: &dyn ArenaRead, at: Address, shape: fn(KindId) -> Option<super::RecordShape>, bits: u32) -> Result<Vec<(CellShape, u32, Cell)>, ArenaError> {
    let kind = arena.header_kind(at, bits)?;
    let record = shape(kind).ok_or(malformed("record shape", u32::from(kind.0)))?;
    let mut cells = Vec::new();
    super::cell::parsed_cell_walk(arena, at, record, bits, |walked| {
        if let super::cell::ParsedCell::Cell(shape, n, cell) = walked {
            cells.push((shape, n, cell));
        }
        Ok(())
    })?;
    Ok(cells)
}

/// The id of the node of the parsed record at `at`: the record's own, or an
/// envelope's for its content; none for a built record.
///
/// # Errors
///
/// What reading the record's side record refuses.
pub fn row_of<T>(ctx: RecordCtx<'_, T>, at: Address) -> Result<Option<NodeId>, ArenaError> {
    if ctx.node.is_none() {
        return Ok(None);
    }
    Ok(Some(NodeId::record(super::node_record(ctx.arena, at)?.0)))
}

/// The place of the record at `at`: a parsed record's node (`row_of`), or a
/// built record's address.
///
/// # Errors
///
/// What reading the record's side record refuses.
pub fn place_of<T>(ctx: RecordCtx<'_, T>, at: Address) -> Result<PrepPlace, ArenaError> {
    Ok(row_of(ctx, at)?.map_or_else(|| Place::record(at), Place::Node).into())
}

/// The place of the parsed leaf `id` names, held at `site`: its own, unless
/// its holder is that same node. Envelope and content share one node, whose
/// sides are the envelope's, so such a leaf is its envelope's content, and
/// its place is its cell's site in its envelope, as `place_of` places a
/// record's content.
///
/// # Errors
///
/// `ArenaError::Malformed` for a parsed leaf in a built record.
pub fn leaf_place<T>(ctx: RecordCtx<'_, T>, id: NodeId, site: Option<Site<PrepPlace>>) -> Result<PrepPlace, ArenaError> {
    if ctx.node.is_none() {
        return Err(malformed("parsed leaf in a built record", id.address()));
    }
    match site {
        Some(Site { holder: PrepPlace::Stored(holder), word, item }) if holder == Place::Node(id) => Ok(PrepPlace::Content(Site { holder, word, item })),
        _ => Ok(Place::Node(id).into()),
    }
}

/// The place of the linked leaf whose link record is `record`, naming the
/// parsed node `leaf`, held at `site`: its holder's content when the holder
/// was rebuilt from the node the leaf names, since an envelope and its
/// content share one node and that node's sides are the envelope's; else its
/// link record.
///
/// # Errors
///
/// What reading the holder's header and side record refuses.
pub fn linked_leaf_place<T>(ctx: RecordCtx<'_, T>, record: Address, leaf: NodeId, site: Option<Site<PrepPlace>>) -> Result<PrepPlace, ArenaError> {
    let own: PrepPlace = Place::record(record).into();
    let Some(Site { holder: PrepPlace::Stored(holder), word, item }) = site else { return Ok(own) };
    let Some(at) = holder.as_record() else { return Ok(own) };
    let rebuilt_from = ctx.side(super::side_of(ctx.arena, at)?)?.sides.and_then(Sides::name);
    Ok(match rebuilt_from {
        Some(from) if ctx.sources.same_node(from, leaf) => PrepPlace::Content(Site { holder, word, item }),
        _ => own,
    })
}

/// The edges whose neighbour changed for a record a cell holds: the ones
/// its holder's cell marks, at a site; as a render root, the ones the render
/// call marks with the ones its side record keeps.
#[must_use]
pub fn held_changed(site: bool, cell: ChangedEdges, side: &super::SideRecord) -> ChangedEdges {
    if site { cell } else { cell.or(side.changed) }
}

/// The place of a built leaf held at `site`: its site in its holder's
/// record, or, for a root, which has no site, `Place::RootLeaf`, whose sides
/// the render is given.
///
/// # Errors
///
/// `ArenaError::Malformed` for a site whose holder is no built record.
pub fn built_leaf_place(site: Option<Site<PrepPlace>>) -> Result<PrepPlace, ArenaError> {
    match site {
        None => Ok(Place::RootLeaf.into()),
        Some(Site { holder: PrepPlace::Stored(holder), word, item }) => match holder.as_record() {
            Some(holder) => Ok(Place::site(Site { holder, word, item }).into()),
            None => Err(malformed("built leaf holder", 0)),
        },
        Some(_) => Err(malformed("built leaf holder", 0)),
    }
}

/// Text that is a slot's content with no kind of its own, or an `ERROR`
/// node's text with its kind, as a record holds it (`VerbatimNode`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct VerbatimRecord<'a> {
    pub text: &'a str,
    pub kind: KindId,
}

impl<'a, T> RecordView<'a, T> for VerbatimRecord<'a> {
    fn claims(kind: KindId) -> bool {
        kind == KindId::BLANK || kind == KindId::ERROR
    }

    fn from_cell(ctx: RecordCtx<'a, T>, cell: Cell, _: Option<Site<PrepPlace>>) -> Result<Self, ArenaError> {
        match cell {
            Cell::BuiltText { text } => Ok(Self { text: ctx.string(text)?, kind: KindId::BLANK }),
            Cell::BuiltLeaf { kind: KindId::ERROR, text, .. } => Ok(Self { text: ctx.string(text)?, kind: KindId::ERROR }),
            _ => Err(malformed("verbatim cell", 0)),
        }
    }
}

impl Render for VerbatimRecord<'_> {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        w.text(self.text)
    }
}

/// What one slot's cell holds, as its view reads it.
enum SlotCell<V> {
    Absent,
    /// A parsed node, whatever cell names it: its row, and the cell.
    Parsed(ParsedRow, Cell),
    /// A built value's view.
    View(V),
    /// A parsed unit its holder's cell names by its kind alone, and the view
    /// that writes its kind's text.
    Unit(KindId, V),
    Refused(ArenaError),
}

/// One slot position of a record, as a view hands it out: what its cell holds,
/// decoded when it is read. `ADJACENT` is the slot's own, as on `SlotValue`.
pub struct RecordSlot<'a, T, V, const ADJACENT: bool = false> {
    ctx: RecordCtx<'a, T>,
    site: Site<PrepPlace>,
    key: &'static str,
    cell: SlotCell<V>,
}

impl<'a, T, V: RecordView<'a, T>, const ADJACENT: bool> RecordSlot<'a, T, V, ADJACENT> {
    /// The slot at `site` of shape `shape` in `words`, the words of the
    /// record at `at` (`RecordCtx::slot_cell`).
    #[must_use]
    pub fn of_shape(ctx: RecordCtx<'a, T>, site: Site<PrepPlace>, words: &[u32], at: Address, shape: CellShape) -> Self {
        Self::of_cell(ctx, site, shape.key, ctx.slot_cell(words, at, shape))
    }

    /// The slot at `site` that holds `cell`, a record the holder's own cell
    /// names: an envelope over a list has no cell of its own for its content.
    #[must_use]
    pub fn of_record_cell(ctx: RecordCtx<'a, T>, site: Site<PrepPlace>, key: &'static str, cell: Cell) -> Self {
        Self::of_cell(ctx, site, key, Ok(cell))
    }

    /// The slot at `site` whose cell decoded as `decoded`. An unset single
    /// slot holds the unit its prepare defaulted it to, when it took one.
    fn of_cell(ctx: RecordCtx<'a, T>, site: Site<PrepPlace>, key: &'static str, decoded: Result<Cell, ArenaError>) -> Self {
        let cell = match decoded {
            Ok(Cell::Absent) => match ctx.prepared.node(site.holder).and_then(|node| node.slot(site.word)).and_then(|slot| slot.unit) {
                Some(kind) => V::from_cell(ctx, Cell::Unit { kind, row: None }, Some(site)).map_or_else(SlotCell::Refused, SlotCell::View),
                None => SlotCell::Absent,
            },
            Ok(cell) => Self::cell(ctx, site, cell),
            Err(refused) => SlotCell::Refused(refused),
        };
        Self { ctx, site, key, cell }
    }

    fn cell(ctx: RecordCtx<'a, T>, site: Site<PrepPlace>, cell: Cell) -> SlotCell<V> {
        match ctx.cell_row(cell) {
            Ok(Some(row)) => SlotCell::Parsed(row, cell),
            Ok(None) => V::from_cell(ctx, cell, Some(site)).map_or_else(SlotCell::Refused, |view| match cell {
                Cell::Unit { kind, row: None } if ctx.node.is_some() && kind != KindId::BLANK => SlotCell::Unit(kind, view),
                _ => SlotCell::View(view),
            }),
            Err(refused) => SlotCell::Refused(refused),
        }
    }

    /// The parsed node, between the seams its prepare gave it.
    fn at(&self, row: ParsedRow) -> NodeIdOrCoordinate<'static> {
        row.at(self.ctx.prepared.coordinate_edges(self.site))
    }

    /// The view a parsed node renders through when a write lies in its rows:
    /// its cell's, which names its record once its prepare wrote it.
    fn edited(&self, cell: Cell) -> Result<V, ArenaError> {
        V::from_cell(self.ctx, cell, Some(self.site))
    }
}

impl<'a, T, V: RecordView<'a, T> + Render, const ADJACENT: bool> Render for RecordSlot<'a, T, V, ADJACENT> {
    /// A parsed node renders as its source, unless it renders through its
    /// record (`through_record`) or prepare gave it a derived delimiter
    /// facet: then it renders through its record, which its prepare wrote
    /// when no read had.
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        match &self.cell {
            SlotCell::Absent => Err(RenderError::Record(ArenaError::MissingField(self.key))),
            SlotCell::View(view) => view.render(w),
            SlotCell::Unit(_, view) if self.ctx.prepared.facet(self.site).is_some() => view.render(w),
            SlotCell::Unit(kind, view) => crate::slot::write_parsed_unit(*kind, self.ctx.prepared.coordinate_edges(self.site), ADJACENT, w, |w| view.render(w)),
            SlotCell::Refused(refused) => Err(RenderError::Record(refused.clone())),
            &SlotCell::Parsed(row, cell) => {
                let at = self.at(row);
                if !through_record(self.ctx.sources, at, cell) && self.ctx.prepared.facet(self.site).is_none() {
                    return crate::slot::write_coordinate(at, ADJACENT, w);
                }
                self.edited(cell).map_err(RenderError::Record)?.render(w)
            }
        }
    }
}

impl<'a, T, V: RecordView<'a, T> + Render, const ADJACENT: bool> Slot for RecordSlot<'a, T, V, ADJACENT> {
    fn write_slot(&self, prefix: &str, suffix: &str, w: &mut dyn RenderSink) -> RenderResult {
        if matches!(self.cell, SlotCell::Absent) {
            return Ok(());
        }
        crate::view::write_literal(prefix, w)?;
        self.render(w)?;
        crate::view::write_literal(suffix, w)
    }

    fn is_present(&self) -> bool {
        !matches!(self.cell, SlotCell::Absent)
    }
}

impl<T, V: KindOf, const ADJACENT: bool> KindTest for RecordSlot<'_, T, V, ADJACENT> {
    fn kind_in(&self, _: &dyn RenderSink, kinds: &[KindId]) -> bool {
        match &self.cell {
            SlotCell::Parsed(row, _) => kinds.contains(&row.kind),
            SlotCell::View(view) | SlotCell::Unit(_, view) => view.kind_in(kinds),
            SlotCell::Absent | SlotCell::Refused(_) => false,
        }
    }
}

/// A list slot of a record, as a view hands it out: its run of item cells,
/// each viewed as a slot when it is read. Its holder's view checked the run
/// lies inside the arena when it was built.
pub struct RecordItems<'a, T, V, const ADJACENT: bool = false> {
    ctx: RecordCtx<'a, T>,
    holder: PrepPlace,
    record: Address,
    shape: CellShape,
    run: u32,
    list: ListCell,
    view: std::marker::PhantomData<fn() -> V>,
}

impl<T, V, const ADJACENT: bool> Clone for RecordItems<'_, T, V, ADJACENT> {
    fn clone(&self) -> Self {
        *self
    }
}

impl<T, V, const ADJACENT: bool> Copy for RecordItems<'_, T, V, ADJACENT> {}

impl<'a, T, V, const ADJACENT: bool> RecordItems<'a, T, V, ADJACENT> {
    /// The list of `holder`'s slot of shape `shape` in `words`, its
    /// record's words.
    ///
    /// # Errors
    ///
    /// What decoding the list's cell or reaching its run refuses.
    pub fn of_shape(ctx: RecordCtx<'a, T>, holder: PrepPlace, record: Address, words: &[u32], shape: CellShape) -> Result<Self, ArenaError> {
        let (list, run) = ctx.slot_list(words, shape)?;
        let _run = list.items(ctx.arena, run)?;
        Ok(Self { ctx, holder, record, shape, run, list, view: std::marker::PhantomData })
    }

    /// The list, refused when it holds no item: a `repeat1` slot of
    /// `owner`.
    ///
    /// # Errors
    ///
    /// `EmptyList` when the list holds no item.
    pub fn non_empty(self, owner: &'static str) -> Result<Self, ArenaError> {
        if self.list.len == 0 {
            return Err(ArenaError::EmptyList { owner, key: self.shape.key });
        }
        Ok(self)
    }
}

impl<'a, T, V: RecordView<'a, T> + Render, const ADJACENT: bool> crate::view::SlotItems for RecordItems<'a, T, V, ADJACENT> {
    type Item = RecordSlot<'a, T, V, ADJACENT>;

    fn count(&self) -> usize {
        self.list.len as usize
    }

    fn item(&self, index: usize) -> Option<Self::Item> {
        let item = u32::try_from(index).ok().filter(|&item| item < self.list.len)?;
        let site = Site { holder: self.holder, word: self.shape.word, item: ItemIndex(item) };
        Some(match self.list.items(self.ctx.arena, self.run) {
            Ok(mut items) => RecordSlot::of_cell(self.ctx, site, self.shape.key, self.ctx.item_cell(items.nth(index)?, self.record, self.shape, item)),
            Err(refused) => RecordSlot { ctx: self.ctx, site, key: self.shape.key, cell: SlotCell::Refused(refused) },
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::arena::built_image::{built_cell, unit_cell, BuiltImage};
    use crate::render::{render_to_string, WhitespaceTable};
    use crate::spacing::WordMatcher;
    use crate::trivia::TriviaText;
    use crate::view::SlotItems;
    use std::collections::HashMap;
    use std::sync::Arc;

    const WORD: KindId = KindId(7);

    /// A leaf's view, as the derive writes one: its text, from any text cell.
    #[derive(Clone, Copy)]
    struct Word<'a>(&'a str);

    impl<'a, T> RecordView<'a, T> for Word<'a> {
        fn claims(kind: KindId) -> bool {
            kind == WORD
        }

        fn from_cell(ctx: RecordCtx<'a, T>, cell: Cell, _: Option<Site<PrepPlace>>) -> Result<Self, ArenaError> {
            ctx.cell_text(cell).map(Word)
        }
    }

    impl Render for Word<'_> {
        fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
            w.text(self.0)
        }
    }

    impl KindOf for Word<'_> {
        fn kind_in(&self, kinds: &[KindId]) -> bool {
            kinds.contains(&WORD)
        }
    }


    struct Sources(HashMap<NodeId, Arc<str>>);
    impl SourceTable for Sources {
        fn source_of(&self, at: NodeIdOrCoordinate<'_>) -> Option<&str> {
            let NodeIdOrCoordinate::NodeId { id, .. } = at else { return None };
            self.0.get(&id).map(|source| &**source)
        }
    }

    fn text_of(_: KindId) -> &'static str {
        ""
    }
    const TABLE: WhitespaceTable = WhitespaceTable { text_of, indent: KindId(0), dedent: KindId(0), leaf_edges: &[], gaps: &[] };

    fn rendered(value: &dyn Render) -> Result<String, RenderError> {
        render_to_string(value, WordMatcher::default_ident(), &TABLE, "    ")
    }

    fn site(item: u32) -> Site<PrepPlace> {
        Site { holder: Place::record(Address(1)).into(), word: 2, item: ItemIndex(item) }
    }

    const SLOT: CellShape = CellShape { word: 2, width: 3, run: None, forms: crate::record::form::NODE, built: 2, key: "_slot", ..CellShape::BARE };
    const LIST: CellShape = CellShape { word: 2, width: 1, run: Some(3), forms: crate::record::form::NODE, built: 2, key: "_items", ..CellShape::BARE };

    fn holding(cell: u32) -> [u32; 3] {
        [0, 0, cell]
    }

    struct Fixture {
        arena: BuiltImage,
        sources: Sources,
        store: TriviaStore<TriviaText>,
        prepared: Prepared<TriviaText>,
    }

    impl Fixture {
        fn new() -> Self {
            Self { arena: BuiltImage::new(9), sources: Sources(HashMap::new()), store: TriviaStore::new(), prepared: Prepared::new() }
        }

        fn ctx(&self) -> RecordCtx<'_, TriviaText> {
            RecordCtx::built(&self.arena, None, &self.sources, &self.store, &self.prepared, 9)
        }
    }

    type WordSlot<'a> = RecordSlot<'a, TriviaText, Word<'a>>;

    const SHOWN: KindId = KindId(8);

    struct Shown;

    impl<'a, T> RecordView<'a, T> for Shown {
        fn claims(kind: KindId) -> bool {
            kind == WORD
        }

        fn accepts(kind: KindId) -> bool {
            kind == WORD || kind == SHOWN
        }

        fn from_cell(_: RecordCtx<'a, T>, _: Cell, _: Option<Site<PrepPlace>>) -> Result<Self, ArenaError> {
            Ok(Self)
        }
    }

    #[test]
    fn a_view_accepts_what_it_claims_unless_it_widens_the_envelopes_it_is_shown_as() {
        assert!(<Word<'_> as RecordView<'_, TriviaText>>::accepts(WORD));
        assert!(!<Word<'_> as RecordView<'_, TriviaText>>::accepts(SHOWN));
        assert!(<Shown as RecordView<'_, TriviaText>>::accepts(SHOWN));
        assert!(!<Shown as RecordView<'_, TriviaText>>::claims(SHOWN));
        assert!(<Shown as RecordView<'_, TriviaText>>::claims(WORD));
    }

    #[test]
    fn a_layout_keeps_prepared_defaults_below_stored_settings() {
        let mut fixture = Fixture::new();
        let place = PrepPlace::Stored(Place::record(Address(1)));
        let node = fixture.prepared.node_mut(place);
        node.separator_kind = Some(KindId(7));
        node.slot_mut(2).space_before = Some(KindId(8));
        node.slot_mut(2).space_after = Some(KindId(9));
        let layout = RecordLayout::new(fixture.ctx(), place, None, Edges::default(), ChangedEdges::default(), None);
        assert_eq!(layout.separator_kind(None), Some(KindId(7)));
        assert_eq!(layout.separator_kind(Some(KindId(17))), Some(KindId(17)));
        assert_eq!(layout.space(2, true, None), Some(KindId(8)));
        assert_eq!(layout.space(2, false, None), Some(KindId(9)));
        assert_eq!(layout.space(2, true, Some(KindId(18))), Some(KindId(18)));
        assert_eq!(layout.space(3, false, None), None);
    }

    #[test]
    fn a_slot_renders_its_cell_s_view_and_an_absent_one_writes_nothing() {
        let mut fixture = Fixture::new();
        let text = fixture.arena.entry(KindId::BLANK, "name");
        let ctx = fixture.ctx();
        let present = WordSlot::of_shape(ctx, site(0), &holding(built_cell(text, ChangedEdges::default())), Address(1), SLOT);
        assert!(present.is_present());
        assert_eq!(rendered(&present).expect("rendered"), "name");
        let absent = WordSlot::of_shape(ctx, site(0), &holding(0), Address(1), SLOT);
        assert!(!absent.is_present());
        let mut out = String::new();
        let mut w = crate::spacing::SpacingWriter::new(&mut out, WordMatcher::default_ident()).with_table(&TABLE);
        assert!(present.kind_in(&w, &[WORD]));
        assert!(!absent.kind_in(&w, &[WORD]));
        absent.write_slot("(", ")", &mut w).expect("nothing to write");
        w.finish().expect("finished");
        assert_eq!(out, "");
    }

    #[test]
    fn a_cell_no_writer_writes_and_a_required_slot_read_absent_refuse_to_render() {
        let fixture = Fixture::new();
        let ctx = fixture.ctx();
        let edged = unit_cell(WORD) | 1;
        let refused = WordSlot::of_shape(ctx, site(0), &holding(edged), Address(1), SLOT);
        assert!(matches!(rendered(&refused), Err(RenderError::Record(ArenaError::Malformed { what: "unit cell edges", word })) if word == edged));
        let absent = WordSlot::of_shape(ctx, site(0), &holding(0), Address(1), SLOT);
        assert!(matches!(rendered(&absent), Err(RenderError::Record(ArenaError::MissingField("_slot")))));
    }

    #[test]
    fn a_list_hands_out_each_item_s_slot_at_its_site() {
        let mut fixture = Fixture::new();
        let cells = ["a", "b"].map(|text| built_cell(fixture.arena.entry(KindId::BLANK, text), ChangedEdges::default()));
        let list = fixture.arena.run(&cells);
        let items = RecordItems::<TriviaText, Word<'_>>::of_shape(fixture.ctx(), Place::record(Address(1)).into(), Address(1), &holding(list), LIST).expect("a list");
        assert_eq!(items.count(), 2);
        assert_eq!(rendered(&items.item(1).expect("an item")).expect("rendered"), "b");
        assert_eq!(items.item(1).expect("an item").site, site(1));
        assert!(items.item(2).is_none());
    }

    #[test]
    fn a_list_run_past_the_packed_word_boundary_keeps_all_its_items() {
        let mut fixture = Fixture::new();
        let text = built_cell(fixture.arena.entry(KindId::BLANK, "x"), ChangedEdges::default());
        let len = crate::arena::CHUNK_WORDS + 2;
        let list = fixture.arena.run(&vec![text; len as usize]);
        let items = RecordItems::<TriviaText, Word<'_>>::of_shape(fixture.ctx(), Place::record(Address(1)).into(), Address(1), &holding(list), LIST).expect("a list");
        assert_eq!(items.count(), len as usize);
        for index in [0, len / 2, len - 1] {
            let item = items.item(index as usize).expect("an item in the oversized run");
            assert_eq!(rendered(&item).expect("rendered"), "x");
            assert_eq!(item.site, site(index));
        }
        assert_eq!((0..items.count()).filter_map(|index| items.item(index)).count(), len as usize);
        assert!(items.item(len as usize).is_none());
    }

    #[test]
    fn a_list_whose_run_the_arena_never_wrote_is_refused_with_its_holder() {
        let fixture = Fixture::new();
        let list = Address::new(3, 0).expect("in range").0 << 2;
        assert!(matches!(RecordItems::<TriviaText, Word<'_>>::of_shape(fixture.ctx(), Place::record(Address(1)).into(), Address(1), &holding(list), LIST), Err(ArenaError::OutOfBounds { .. })));
    }

    #[test]
    fn a_parsed_span_reads_its_tree_s_source_and_a_built_arena_has_none() {
        let mut fixture = Fixture::new();
        fixture.sources.0.insert(NodeId::record(4), Arc::from("let x = 1;"));
        let ctx = fixture.ctx();
        assert!(matches!(ctx.source_text(Span { start: 4, end: 5 }), Err(ArenaError::Malformed { what: "parsed span in a built record", .. })));
        let parsed = RecordCtx { node: Some(NodeId::record(4)), ..ctx };
        assert_eq!(parsed.cell_text(Cell::ParsedLeaf { kind: WORD, span: Span { start: 4, end: 5 }, row: NodeIndex(2) }), Ok("x"));
        assert!(matches!(parsed.source_text(Span { start: 4, end: 40 }), Err(ArenaError::Malformed { what: "cell span end", .. })));
    }
}
