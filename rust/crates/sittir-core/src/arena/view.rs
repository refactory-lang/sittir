//! What a record's view reads through, and the slot and list views a node's
//! view hands out for its cells. A view renders after prepare, through shared
//! borrows of the arenas, the trees, the store of written sides and the
//! prepared overlay; every word it reads is bounds-checked, and a cell no
//! writer writes renders as a record refusal (`RenderError::Record`).

use super::{Address, Arena, ArenaError, Cell, ListCell, Prepared, PreparedNode, Sides, StringRef, TreeArena};
use crate::layout::{list_units, render_framed, render_unit, BodyLayout, TriviaRole};
use crate::options::Edges;
use crate::render::{Render, RenderError, RenderResult, RenderSink, SourceTable};
use crate::slot::{ChangedEdges, NodeCoordinate};
use crate::trivia::{NodeTrivia, TriviaSeam};
use super::PrepPlace;
use crate::trivia_store::{Place, Site, TriviaStore};
use crate::types::{ItemIndex, KindId, NodeIndex, Span, TreeId};
use crate::view::{KindOf, KindTest, Slot};

/// The coordinate a render's root record renders as: its row's, for a
/// parsed record its source renders (`SourceTable::renders_as_source`), as
/// a native read of that row renders; none for a built record, or a parsed
/// one a write lies in, which render through their views. An envelope's
/// content renders as the row it shares with its envelope: the same bytes.
///
/// # Errors
///
/// `ArenaError::Malformed` for a root naming no arena of the render, or a
/// parsed record whose side record names no row.
pub fn source_root<T>(root: super::CellAt, built: &Arena, arenas: &dyn RecordArenas, store: &TriviaStore<T>, sources: &dyn SourceTable) -> Result<Option<NodeCoordinate>, ArenaError> {
    let prepared = Prepared::new();
    let ctx = RecordCtx::of(root.tree, built, arenas, sources, store, &prepared)?;
    let Some(row) = ctx.stamped_row(root.cell)? else { return Ok(None) };
    let coord = ctx.row_coordinate(row)?;
    Ok(sources.renders_as_source(&coord).then_some(coord))
}

/// The parsed trees' arenas a render reaches: the arena and row index of each
/// tree a record names.
pub trait RecordArenas {
    fn tree(&self, tree: TreeId) -> Option<&TreeArena>;
}

/// What a record's view reads through: the arena its record is in and, for
/// a parsed arena, its tree; the trees' arenas its links reach; the render's
/// trees, its store of written sides and its prepared overlay.
pub struct RecordCtx<'a, T> {
    arena: &'a Arena,
    tree: Option<TreeId>,
    arenas: &'a dyn RecordArenas,
    sources: &'a dyn SourceTable,
    store: &'a TriviaStore<T>,
    prepared: &'a Prepared<T>,
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
    /// The context of the built arena.
    #[must_use]
    pub fn built(arena: &'a Arena, arenas: &'a dyn RecordArenas, sources: &'a dyn SourceTable, store: &'a TriviaStore<T>, prepared: &'a Prepared<T>) -> Self {
        Self { arena, tree: None, arenas, sources, store, prepared }
    }

    /// The context of `tree`'s arena.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` when the render reaches no arena of `tree`.
    pub fn parsed(tree: TreeId, arenas: &'a dyn RecordArenas, sources: &'a dyn SourceTable, store: &'a TriviaStore<T>, prepared: &'a Prepared<T>) -> Result<Self, ArenaError> {
        let arena = arenas.tree(tree).ok_or(malformed("record tree", tree.0))?.arena();
        Ok(Self { arena, tree: Some(tree), arenas, sources, store, prepared })
    }

    /// The context of `tree`'s arena, the built arena `built` for none.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` when the render reaches no arena of `tree`.
    pub fn of(tree: Option<TreeId>, built: &'a Arena, arenas: &'a dyn RecordArenas, sources: &'a dyn SourceTable, store: &'a TriviaStore<T>, prepared: &'a Prepared<T>) -> Result<Self, ArenaError> {
        match tree {
            None => Ok(Self::built(built, arenas, sources, store, prepared)),
            Some(tree) => Self::parsed(tree, arenas, sources, store, prepared),
        }
    }

    /// The context of `tree`'s arena, which a link from this one names.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` when the render reaches no arena of `tree`.
    pub fn linked(self, tree: TreeId) -> Result<Self, ArenaError> {
        Self::parsed(tree, self.arenas, self.sources, self.store, self.prepared)
    }

    #[must_use]
    pub fn arena(self) -> &'a Arena {
        self.arena
    }

    /// The tree of a parsed arena; `None` for the built arena.
    #[must_use]
    pub fn tree(self) -> Option<TreeId> {
        self.tree
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
    /// `ArenaError::Malformed` for a built arena, a tree the render holds no
    /// source of, or a span that is no character range of it.
    pub fn source_text(self, span: Span) -> Result<&'a str, ArenaError> {
        let tree = self.tree.ok_or(malformed("parsed span in a built record", span.start))?;
        let source: &'a str = self.sources.source_of(tree).ok_or(malformed("record tree", tree.0))?;
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
            Cell::ParsedLeaf { span, .. } | Cell::ParsedText { span } => self.source_text(span),
            Cell::BuiltLeaf { text, .. } | Cell::BuiltText { text } => self.string(text),
            _ => Err(malformed("text cell", 0)),
        }
    }

    /// The record of a parsed row its first read wrote.
    #[must_use]
    pub fn row_record(self, row: NodeIndex) -> Option<Address> {
        self.arenas.tree(self.tree?)?.record(row)
    }

    /// The parsed node `cell` names, whatever cell names it: the row of a
    /// coordinate, a parsed leaf or a parsed unit of this arena's tree, or
    /// the row of a parsed record, in this arena or in the tree a link names,
    /// with the edges a child cell marks changed; `None` for a built value.
    ///
    /// # Errors
    ///
    /// What reading a child's record or reaching a linked arena refuses.
    pub fn parsed_row(self, cell: Cell) -> Result<Option<ParsedRow>, ArenaError> {
        let here = |row, kind| self.tree.map(|tree| ParsedRow { tree, row, kind, changed: ChangedEdges::default() });
        Ok(match cell {
            Cell::Coordinate { kind, index, .. } => here(index, kind),
            Cell::ParsedLeaf { kind, row, .. } | Cell::Unit { kind, row: Some(row) } => here(row, kind),
            Cell::Child { kind, at, link, changed } => {
                let Some((ctx, side)) = self.child_side(at, kind, link)? else { return Ok(None) };
                match row_of(ctx, at, &side)? {
                    Some(Place::Row { tree, row }) => Some(ParsedRow { tree, row, kind, changed }),
                    _ => None,
                }
            }
            _ => None,
        })
    }

    /// The row a cell's parsed node is read at: `parsed_row`'s, and for an
    /// envelope's content, the row it shares with its envelope, which its
    /// side record stamps; `None` for a built value.
    ///
    /// # Errors
    ///
    /// What reading a child's record or reaching a linked arena refuses, and
    /// `ArenaError::Malformed` for a parsed record whose side record names no
    /// row.
    pub fn stamped_row(self, cell: Cell) -> Result<Option<ParsedRow>, ArenaError> {
        let Cell::Child { kind, at, link, changed } = cell else { return self.parsed_row(cell) };
        let Some((ctx, side)) = self.child_side(at, kind, link)? else { return Ok(None) };
        let row = side.at.ok_or(malformed("parsed record row", at.0))?.index;
        Ok(ctx.tree.map(|tree| ParsedRow { tree, row, kind, changed }))
    }

    /// The context a child cell's record is read in, its own arena or the
    /// tree its link names, and the record's side record; `None` for a built
    /// record.
    fn child_side(self, at: Address, kind: KindId, link: Option<TreeId>) -> Result<Option<(Self, super::SideRecord)>, ArenaError> {
        let ctx = match link {
            Some(tree) => self.linked(tree)?,
            None => self,
        };
        if ctx.tree.is_none() {
            return Ok(None);
        }
        let (_, side) = record_of(ctx, at, crate::record::HEADER_WORDS, kind)?;
        Ok(Some((ctx, side)))
    }

    /// The coordinate of the parsed node `row` names, as a read of its tree
    /// names it (`row_node`), with the edges it marks changed.
    ///
    /// # Errors
    ///
    /// What `row_node` refuses.
    pub fn row_coordinate(self, row: ParsedRow) -> Result<NodeCoordinate, ArenaError> {
        let writes = (row.changed != ChangedEdges::default()).then(|| Box::new(crate::slot::CoordinateWrites { changed: row.changed }));
        Ok(NodeCoordinate { writes, ..self.row_node(row.tree, row.row)? })
    }

    /// The coordinate of the node at `row` of `tree` a read of it names
    /// (`engine::row_coordinate`): a read node's own `at`.
    ///
    /// # Errors
    ///
    /// `ArenaError::Malformed` when the render holds no tree `tree`, or the
    /// tree has no node at `row`.
    pub fn row_node(self, tree: TreeId, row: NodeIndex) -> Result<NodeCoordinate, ArenaError> {
        let (live, read) = self.sources.read_ctx(tree).ok_or(malformed("record tree", tree.0))?;
        crate::engine::row_coordinate(live, &read, row).ok_or(malformed("record row", row.0))
    }
}

/// A parsed node as a cell names it: its tree, its row there, the kind the
/// cell names it as, and the edges whose neighbour its holder changed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ParsedRow {
    pub tree: TreeId,
    pub row: NodeIndex,
    pub kind: KindId,
    pub changed: ChangedEdges,
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
        Self { ctx, place, node: prepared.node(place), rebuilt_from, edges: prepared.edges(stored, site, place), changed }
    }

    /// Where a prepared node came from (`NodeLayout::at`, else
    /// `NodeLayout::sides`): a parsed node's row, an envelope's content's
    /// envelope's, or the node a built node was rebuilt from.
    fn origin(self) -> Result<Option<NodeCoordinate>, ArenaError> {
        if self.node.is_none() {
            return Ok(None);
        }
        match self.place.row() {
            Some((tree, row)) => self.ctx.row_node(tree, row).map(Some),
            None => Ok(self.rebuilt_from.map(Sides::coordinate)),
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
    /// What `body`, or a trivia entry, refuses, or `RenderError::Record`
    /// when its tree has no row the record names.
    pub fn render(self, kind: Option<KindId>, role: TriviaRole, w: &mut dyn RenderSink, body: impl FnOnce(&mut dyn RenderSink) -> RenderResult) -> RenderResult {
        let origin = self.origin().map_err(RenderError::Record)?;
        match self.trivia() {
            Some(trivia) if self.changed.leading || self.changed.trailing => {
                let mut trimmed = trivia.clone();
                trimmed.trim_changed(self.changed);
                render_framed(Some(&trimmed), self.edges, kind, origin.as_ref(), role, w, body)
            }
            trivia => render_framed(trivia, self.edges, kind, origin.as_ref(), role, w, body),
        }
    }
}

impl<'a, T: Render + TriviaSeam + std::fmt::Debug + 'a> BodyLayout<'a> for RecordLayout<'a, T> {
    fn edges(self) -> Edges {
        self.edges
    }

    fn render_unit(self, slot: &str, item: ItemIndex, w: &mut dyn RenderSink, body: impl FnOnce(&mut dyn RenderSink) -> RenderResult) -> RenderResult {
        render_unit(self.node.map_or(&[], |node| &node.units), slot, item, w, body)
    }

    fn slot_tokens(self, slot: &str) -> &'a [Option<KindId>] {
        self.node.and_then(|node| node.tokens(slot)).unwrap_or(&[])
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
}

/// A view built from the cell that names its value in a holder's record.
pub trait RecordView<'a, T>: Sized {
    /// Whether a cell of `kind` is one this view's type is written as: its
    /// own kind, a variant's, a member's, or blank text for verbatim text.
    fn claims(kind: KindId) -> bool;

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
    let words = ctx.words(at, len)?;
    if words[0] != u32::from(kind.0) {
        return Err(malformed("record kind", words[0]));
    }
    if ctx.tree.is_some_and(|tree| {
        ctx.arenas
            .tree(tree)
            .is_none_or(|arena| !arena.contains_record(at))
    }) {
        return Err(malformed("record address", at.0));
    }
    let side = if words[1] == Address::NONE.0 { super::SideRecord::default() } else { super::SideRecord::read(ctx.arena, Address(words[1]))? };
    Ok((words, side))
}

/// The row of the parsed record at `at` whose side record is `side`, when
/// the row's index names it; none for a built record and for an envelope's
/// content, which shares its envelope's row.
///
/// # Errors
///
/// `ArenaError::Malformed` for a parsed record whose side record names no row.
pub fn row_of<T>(ctx: RecordCtx<'_, T>, at: Address, side: &super::SideRecord) -> Result<Option<Place>, ArenaError> {
    let Some(tree) = ctx.tree else { return Ok(None) };
    let row = side.at.ok_or(malformed("parsed record row", at.0))?.index;
    Ok((ctx.row_record(row) == Some(at)).then_some(Place::Row { tree, row }))
}

/// The place of the record at `at` whose side record is `side`, held at
/// `site`: a parsed record's row (`row_of`), a built record's address, or,
/// for an envelope's content, its cell's site in its envelope.
///
/// # Errors
///
/// `ArenaError::Malformed` for a parsed record whose side record names no
/// row, or a content held by no envelope with a place in the store.
pub fn place_of<T>(ctx: RecordCtx<'_, T>, at: Address, side: &super::SideRecord, site: Option<Site<PrepPlace>>) -> Result<PrepPlace, ArenaError> {
    if ctx.tree.is_none() {
        return Ok(Place::Record(at).into());
    }
    if let Some(row) = row_of(ctx, at, side)? {
        return Ok(row.into());
    }
    match site {
        Some(Site { holder: PrepPlace::Stored(holder), word, item }) => Ok(PrepPlace::Content(Site { holder, word, item })),
        _ => Err(malformed("enveloped content with no envelope", at.0)),
    }
}

/// The place of the parsed leaf at `row` of `ctx`'s tree, held at `site`:
/// its row, unless a record names that row. Envelope and content share one
/// row, and the row's record is the outermost, so such a leaf is the content
/// of the envelope that record is, and its place is its cell's site in its
/// envelope, as `place_of` places a record's content.
///
/// # Errors
///
/// `ArenaError::Malformed` for a parsed leaf in a built record.
pub fn leaf_place<T>(ctx: RecordCtx<'_, T>, row: NodeIndex, site: Option<Site<PrepPlace>>) -> Result<PrepPlace, ArenaError> {
    let tree = ctx.tree.ok_or(malformed("parsed leaf in a built record", row.0))?;
    match site {
        Some(Site { holder: PrepPlace::Stored(holder), word, item }) if ctx.row_record(row).is_some() => Ok(PrepPlace::Content(Site { holder, word, item })),
        _ => Ok(Place::Row { tree, row }.into()),
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
    Refused(ArenaError),
}

/// One slot position of a record, as a view hands it out: what its cell holds,
/// decoded when it is read. `ADJACENT` is the slot's own, as on `SlotValue`.
pub struct RecordSlot<'a, T, V, const ADJACENT: bool = false> {
    ctx: RecordCtx<'a, T>,
    site: Site<PrepPlace>,
    cell: SlotCell<V>,
}

impl<'a, T, V: RecordView<'a, T>, const ADJACENT: bool> RecordSlot<'a, T, V, ADJACENT> {
    /// The slot at `site` whose cell is `words`. An unset single slot holds
    /// the unit its prepare defaulted it to, when it took one.
    #[must_use]
    pub fn of(ctx: RecordCtx<'a, T>, site: Site<PrepPlace>, words: &[u32]) -> Self {
        let cell = match Cell::decode(words) {
            Ok(Cell::Absent) => match ctx.prepared.node(site.holder).and_then(|node| node.slot(site.word)).and_then(|slot| slot.unit) {
                Some(kind) => Self::cell(ctx, site, Cell::Unit { kind, row: None }),
                None => SlotCell::Absent,
            },
            Ok(Cell::Coordinate { index, .. }) if ctx.tree.is_none() => SlotCell::Refused(malformed("coordinate in a built record", index.0)),
            Ok(cell) => Self::cell(ctx, site, cell),
            Err(refused) => SlotCell::Refused(refused),
        };
        Self { ctx, site, cell }
    }

    fn cell(ctx: RecordCtx<'a, T>, site: Site<PrepPlace>, cell: Cell) -> SlotCell<V> {
        match ctx.parsed_row(cell) {
            Ok(Some(row)) => SlotCell::Parsed(row, cell),
            Ok(None) => V::from_cell(ctx, cell, Some(site)).map_or_else(SlotCell::Refused, SlotCell::View),
            Err(refused) => SlotCell::Refused(refused),
        }
    }

    /// The parsed node's coordinate, between the seams its prepare gave it.
    fn coordinate(&self, row: ParsedRow) -> Result<NodeCoordinate, ArenaError> {
        Ok(NodeCoordinate { edges: self.ctx.prepared.coordinate_edges(self.site), ..self.ctx.row_coordinate(row)? })
    }

    /// The view a parsed node renders through when a write lies in its rows:
    /// its cell's, or, for a coordinate, its row's record's.
    fn edited(&self, row: ParsedRow, cell: Cell) -> Result<V, ArenaError> {
        let cell = match cell {
            Cell::Coordinate { kind, index, .. } => Cell::Child { kind, at: self.ctx.row_record(index).ok_or(malformed("edited coordinate record", index.0))?, link: None, changed: row.changed },
            cell => cell,
        };
        V::from_cell(self.ctx, cell, Some(self.site))
    }
}

impl<'a, T, V: RecordView<'a, T> + Render, const ADJACENT: bool> Render for RecordSlot<'a, T, V, ADJACENT> {
    /// A parsed node renders as its source, unless a write set a side in its
    /// rows: then it renders through its record, which its prepare wrote
    /// when no read had.
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        match &self.cell {
            SlotCell::Absent => Err(RenderError::Record(malformed("required slot cell", 0))),
            SlotCell::View(view) => view.render(w),
            SlotCell::Refused(refused) => Err(RenderError::Record(refused.clone())),
            &SlotCell::Parsed(row, cell) => {
                let coord = self.coordinate(row).map_err(RenderError::Record)?;
                if !self.ctx.sources.edited_within(&coord) {
                    return crate::slot::write_coordinate(&coord, ADJACENT, w);
                }
                self.edited(row, cell).map_err(RenderError::Record)?.render(w)
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
            SlotCell::View(view) => view.kind_in(kinds),
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
    word: u32,
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
    /// The list of `holder`'s slot at `word`, whose cell is `words` and
    /// whose items take `run` words each.
    ///
    /// # Errors
    ///
    /// What decoding the list's cell or reaching its run refuses.
    pub fn of(ctx: RecordCtx<'a, T>, holder: PrepPlace, word: u32, run: u32, words: &[u32]) -> Result<Self, ArenaError> {
        let list = ListCell::decode(words)?;
        let _run = list.items(ctx.arena, run)?;
        Ok(Self { ctx, holder, word, run, list, view: std::marker::PhantomData })
    }
}

impl<'a, T, V: RecordView<'a, T> + Render, const ADJACENT: bool> crate::view::SlotItems for RecordItems<'a, T, V, ADJACENT> {
    type Item = RecordSlot<'a, T, V, ADJACENT>;

    fn count(&self) -> usize {
        self.list.len as usize
    }

    fn item(&self, index: usize) -> Option<Self::Item> {
        let item = u32::try_from(index).ok().filter(|&item| item < self.list.len)?;
        let at = self.list.run.offset(item.checked_mul(self.run)?)?;
        let site = Site { holder: self.holder, word: self.word, item: ItemIndex(item) };
        Some(match self.ctx.arena.words(at, self.run) {
            Ok(words) => RecordSlot::of(self.ctx, site, words),
            Err(refused) => RecordSlot { ctx: self.ctx, site, cell: SlotCell::Refused(refused) },
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
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

    struct NoTrees;
    impl RecordArenas for NoTrees {
        fn tree(&self, _: TreeId) -> Option<&TreeArena> {
            None
        }
    }

    struct Sources(HashMap<TreeId, Arc<str>>);
    impl SourceTable for Sources {
        fn source_of(&self, tree: TreeId) -> Option<&Arc<str>> {
            self.0.get(&tree)
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
        Site { holder: Place::Record(Address(1)).into(), word: 2, item: ItemIndex(item) }
    }

    fn cell(cell: Cell) -> [u32; 5] {
        let mut words = [0; 5];
        cell.encode(&mut words).expect("it fits");
        words
    }

    struct Fixture {
        arena: Arena,
        sources: Sources,
        store: TriviaStore<TriviaText>,
        prepared: Prepared<TriviaText>,
    }

    impl Fixture {
        fn new() -> Self {
            Self { arena: Arena::new(), sources: Sources(HashMap::new()), store: TriviaStore::new(), prepared: Prepared::new() }
        }

        fn ctx(&self) -> RecordCtx<'_, TriviaText> {
            RecordCtx::built(&self.arena, &NoTrees, &self.sources, &self.store, &self.prepared)
        }
    }

    type WordSlot<'a> = RecordSlot<'a, TriviaText, Word<'a>>;

    #[test]
    fn a_slot_renders_its_cell_s_view_and_an_absent_one_writes_nothing() {
        let mut fixture = Fixture::new();
        let text = fixture.arena.intern("name").expect("room");
        let ctx = fixture.ctx();
        let present = WordSlot::of(ctx, site(0), &cell(Cell::BuiltText { text }));
        assert!(present.is_present());
        assert_eq!(rendered(&present).expect("rendered"), "name");
        let absent = WordSlot::of(ctx, site(0), &cell(Cell::Absent));
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
        let refused = WordSlot::of(ctx, site(0), &[99, 0, 0, 0, 0]);
        assert!(matches!(rendered(&refused), Err(RenderError::Record(ArenaError::Malformed { what: "cell tag", word: 99 }))));
        let absent = WordSlot::of(ctx, site(0), &cell(Cell::Absent));
        assert!(matches!(rendered(&absent), Err(RenderError::Record(ArenaError::Malformed { what: "required slot cell", .. }))));
        let coordinate = WordSlot::of(ctx, site(0), &cell(Cell::Coordinate { kind: WORD, index: NodeIndex(3), span: Span { start: 0, end: 1 } }));
        assert!(matches!(rendered(&coordinate), Err(RenderError::Record(ArenaError::Malformed { what: "coordinate in a built record", .. }))), "a built record names a parsed node by a link, never by its row");
    }

    #[test]
    fn a_list_hands_out_each_item_s_slot_at_its_site() {
        let mut fixture = Fixture::new();
        let cells = ["a", "b"].map(|text| Cell::BuiltText { text: fixture.arena.intern(text).expect("room") });
        let list = ListCell::write(&mut fixture.arena, 5, &cells).expect("written");
        let mut words = [0; 2];
        list.encode(&mut words).expect("it fits");
        let items = RecordItems::<TriviaText, Word<'_>>::of(fixture.ctx(), Place::Record(Address(1)).into(), 2, 5, &words).expect("a list");
        assert_eq!(items.count(), 2);
        assert_eq!(rendered(&items.item(1).expect("an item")).expect("rendered"), "b");
        assert_eq!(items.item(1).expect("an item").site, site(1));
        assert!(items.item(2).is_none());
    }

    #[test]
    fn a_list_whose_run_the_arena_never_wrote_is_refused_with_its_holder() {
        let fixture = Fixture::new();
        let words = [Address::new(3, 0).expect("in range").0, 2];
        assert!(matches!(RecordItems::<TriviaText, Word<'_>>::of(fixture.ctx(), Place::Record(Address(1)).into(), 2, 5, &words), Err(ArenaError::OutOfBounds { .. })));
    }

    #[test]
    fn a_parsed_span_reads_its_tree_s_source_and_a_built_arena_has_none() {
        let mut fixture = Fixture::new();
        fixture.sources.0.insert(TreeId(4), Arc::from("let x = 1;"));
        let ctx = fixture.ctx();
        assert!(matches!(ctx.source_text(Span { start: 4, end: 5 }), Err(ArenaError::Malformed { what: "parsed span in a built record", .. })));
        let parsed = RecordCtx { tree: Some(TreeId(4)), ..ctx };
        assert_eq!(parsed.cell_text(Cell::ParsedLeaf { kind: WORD, span: Span { start: 4, end: 5 }, row: NodeIndex(2) }), Ok("x"));
        assert!(matches!(parsed.source_text(Span { start: 4, end: 40 }), Err(ArenaError::Malformed { what: "cell span end", .. })));
    }
}
