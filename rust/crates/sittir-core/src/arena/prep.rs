//! Prepare over records: the walk a native prepare makes, made over a
//! record and the render's prepared overlay. A node's one prepare body runs
//! over its record's handles (`RecordAt`), which hold keys only and write the
//! overlay. A slot's handle takes each cell as a native slot takes its value:
//! a parsed node, whatever cell names it, as its row's coordinate (a native
//! `SlotValue::Coord`), and any other value through its type's
//! `PrepareRecord` (a native `SlotValue::Node`).

use std::borrow::Cow;
use std::marker::PhantomData;

use super::view::ParsedRow;
use super::{place_of, record_of, Address, PrepPlace, Arena, ArenaError, Cell, ListCell, Prepared, RecordArenas, RecordCtx, RecordSink, RecordView, TreeArena, WriteCell};
use crate::layout::{slot_entry, Layout, NodeLayout, SlotLayout, UnitSides};
use crate::options::{ArmSite, Edges, Side};
use crate::prepare::{
    coord_seat, coordinate_edges, fill_coordinate_gap, fill_gaps, fill_node_gap, fill_seats, seat_coordinate, seat_node, seat_read_node, seat_site, separators, unread, ArmOf, EdgeItem, EdgeItems, FromKindId, GapItems,
    LayoutTarget, Prepare, PresentItems, RenderContext, SeatItems, SeatSlot, Setting, SlotTarget, SnapshotEdge, UnitSlot,
};
use crate::record::HEADER_WORDS;
use crate::render::{CoordinateError, SourceTable};
use crate::slot::{ChangedEdges, NodeCoordinate, SeamArm};
use crate::trivia::{NodeTrivia, TriviaSeam};
use crate::trivia_store::{Place, Site, TriviaStore};
use crate::types::{Delimiter, ItemIndex, KindId, SiteId, TreeId};
use crate::view::KindOf;

/// A handle's marker: it holds keys only, and its operations take the
/// overlay `RecordPrep<'r, …>`.
type Marker<'r, A> = PhantomData<fn(&'r ()) -> A>;

fn malformed(what: &'static str, word: u32) -> ArenaError {
    ArenaError::Malformed { what, word }
}

/// The parsed trees' arenas a render's prepare reaches, which it writes: a
/// parsed node's record is written on its first read, and prepare reads a
/// node a write lies in.
pub trait RecordTrees: RecordArenas {
    fn tree_mut(&mut self, tree: TreeId) -> Option<&mut TreeArena>;
}

/// The arenas of a render's parsed trees, each held for the render.
pub struct HeldArenas<'t>(std::collections::HashMap<TreeId, std::sync::MutexGuard<'t, TreeArena>>);

impl<'t> HeldArenas<'t> {
    /// The arenas `trees` holds, each by its tree.
    pub fn of(trees: impl IntoIterator<Item = (TreeId, std::sync::MutexGuard<'t, TreeArena>)>) -> Self {
        Self(trees.into_iter().collect())
    }
}

impl RecordArenas for HeldArenas<'_> {
    fn tree(&self, tree: TreeId) -> Option<&TreeArena> {
        self.0.get(&tree).map(|arena| &**arena)
    }
}

impl RecordTrees for HeldArenas<'_> {
    fn tree_mut(&mut self, tree: TreeId) -> Option<&mut TreeArena> {
        self.0.get_mut(&tree).map(|arena| &mut **arena)
    }
}

/// The overlay a render of the root record `root`, of node type `N`, renders
/// with: the root prepared into a fresh one.
///
/// # Errors
///
/// What the root's prepare refuses.
pub fn prepare_root<T, N: PrepareRecord<T>>(trees: &mut dyn RecordTrees, built: &Arena, store: &TriviaStore<T>, root: CellAt, ctx: &RenderContext<'_>) -> Result<Prepared<T>, CoordinateError> {
    let mut prepared = Prepared::new();
    N::prepare_record(&mut RecordPrep::new(&mut prepared, trees, built, ctx.sources, store), root, ctx)?;
    Ok(prepared)
}

/// What a record's prepare reads and writes besides the record: the overlay
/// it fills and the parsed trees' arenas it may write a first read into,
/// beside the built arena, the render's trees and the store of written
/// sides, which it only reads.
pub struct RecordPrep<'r, T> {
    prepared: &'r mut Prepared<T>,
    trees: &'r mut dyn RecordTrees,
    built: &'r Arena,
    sources: &'r dyn SourceTable,
    store: &'r TriviaStore<T>,
}

impl<'r, T> RecordPrep<'r, T> {
    #[must_use]
    pub fn new(prepared: &'r mut Prepared<T>, trees: &'r mut dyn RecordTrees, built: &'r Arena, sources: &'r dyn SourceTable, store: &'r TriviaStore<T>) -> Self {
        Self { prepared, trees, built, sources, store }
    }

    /// The view context of `tree`'s arena, the built arena for none, over
    /// the overlay as prepare has filled it so far.
    fn view(&self, tree: Option<TreeId>) -> Result<RecordCtx<'_, T>, ArenaError> {
        RecordCtx::of(tree, self.built, &*self.trees, self.sources, self.store, self.prepared)
    }

    /// The coordinate of the parsed node `row` names, read from the tree of
    /// the arena `tree`.
    fn row_coordinate(&self, tree: Option<TreeId>, row: ParsedRow) -> Result<NodeCoordinate, ArenaError> {
        self.view(tree)?.row_coordinate(row)
    }
}

/// A cell as prepare reaches it: the cell, the tree whose arena holds it
/// (none for the built arena), and the site its holder holds it at (none for
/// a root).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CellAt {
    pub cell: Cell,
    pub tree: Option<TreeId>,
    pub site: Option<Site<PrepPlace>>,
}

/// A native node type's prepare over its records, beside its `Prepare`: one
/// method for each thing native prepare asks of a `SlotValue::Node`. The
/// derive writes every impl.
pub trait PrepareRecord<T>: Sized {
    /// Whether a cell of `kind` is one this type is written as.
    fn claims(kind: KindId) -> bool;
    /// `Prepare::prepare`, over the value `at` names.
    ///
    /// # Errors
    ///
    /// The coordinate a value or a side holds that its tree refuses, or a
    /// record no writer writes (`CoordinateError::Record`).
    fn prepare_record(prep: &mut RecordPrep<'_, T>, at: CellAt, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>;
    /// Whether the value `cell` names takes a list gap's edges:
    /// `Prepare::gap_edges` is some.
    fn takes_gaps(cell: Cell) -> bool;
    /// `SeatTarget::seat_target`: the site whose edges the seat fills, the
    /// edges stored for the value there, and the seat.
    fn seat_record(prep: &RecordPrep<'_, T>, at: CellAt, table: &[Option<SiteId>], ctx: &RenderContext<'_>) -> Option<(Site<PrepPlace>, Edges, SiteId)>;
    /// `Prepare::source_separator`.
    fn source_separator(prep: &RecordPrep<'_, T>, at: CellAt, ctx: &RenderContext<'_>) -> Option<KindId>;
    /// `Prepare::snapshot_edge`.
    fn snapshot_edge(prep: &RecordPrep<'_, T>, at: CellAt) -> Option<SnapshotEdge>;
    /// `KindOf::kind_in`.
    fn kind_in(prep: &RecordPrep<'_, T>, at: CellAt, kinds: &[KindId]) -> bool;
}

impl<T, N: PrepareRecord<T>> PrepareRecord<T> for Box<N> {
    fn claims(kind: KindId) -> bool {
        N::claims(kind)
    }

    fn prepare_record(prep: &mut RecordPrep<'_, T>, at: CellAt, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        N::prepare_record(prep, at, ctx)
    }

    fn takes_gaps(cell: Cell) -> bool {
        N::takes_gaps(cell)
    }

    fn seat_record(prep: &RecordPrep<'_, T>, at: CellAt, table: &[Option<SiteId>], ctx: &RenderContext<'_>) -> Option<(Site<PrepPlace>, Edges, SiteId)> {
        N::seat_record(prep, at, table, ctx)
    }

    fn source_separator(prep: &RecordPrep<'_, T>, at: CellAt, ctx: &RenderContext<'_>) -> Option<KindId> {
        N::source_separator(prep, at, ctx)
    }

    fn snapshot_edge(prep: &RecordPrep<'_, T>, at: CellAt) -> Option<SnapshotEdge> {
        N::snapshot_edge(prep, at)
    }

    fn kind_in(prep: &RecordPrep<'_, T>, at: CellAt, kinds: &[KindId]) -> bool {
        N::kind_in(prep, at, kinds)
    }
}

/// Text a record holds as a slot's content or an `ERROR` node, which
/// prepare leaves as it is and no kind test asks.
impl<T> PrepareRecord<T> for crate::verbatim::VerbatimNode {
    fn claims(kind: KindId) -> bool {
        <super::VerbatimRecord<'_> as RecordView<'_, T>>::claims(kind)
    }

    fn prepare_record(_: &mut RecordPrep<'_, T>, _: CellAt, _: &RenderContext<'_>) -> Result<(), CoordinateError> {
        Ok(())
    }

    fn takes_gaps(_: Cell) -> bool {
        false
    }

    fn seat_record(_: &RecordPrep<'_, T>, _: CellAt, _: &[Option<SiteId>], _: &RenderContext<'_>) -> Option<(Site<PrepPlace>, Edges, SiteId)> {
        None
    }

    fn source_separator(_: &RecordPrep<'_, T>, _: CellAt, _: &RenderContext<'_>) -> Option<KindId> {
        None
    }

    fn snapshot_edge(_: &RecordPrep<'_, T>, _: CellAt) -> Option<SnapshotEdge> {
        None
    }

    fn kind_in(_: &RecordPrep<'_, T>, _: CellAt, _: &[KindId]) -> bool {
        false
    }
}

/// Where one record is, as its prepare body's handles name it.
#[derive(Debug, Clone, Copy)]
struct RecordKey {
    /// The tree whose arena holds the record; none for the built arena.
    tree: Option<TreeId>,
    /// The record; none for a parsed leaf, which has none.
    at: Option<Address>,
    place: PrepPlace,
    /// The edges whose neighbour the record's holder changed: its site's, or
    /// a root's own.
    changed: ChangedEdges,
    /// A parsed node's row.
    row: Option<ParsedRow>,
}

impl RecordKey {
    /// The key of the `kind` record or leaf `at` names.
    fn of<T>(prep: &RecordPrep<'_, T>, at: CellAt, kind: KindId) -> Result<Self, ArenaError> {
        let view = prep.view(at.tree)?;
        let row = view.parsed_row(at.cell)?;
        match at.cell {
            Cell::Child { kind: named, at: record, link, changed } if named == kind => {
                let view = match link {
                    Some(tree) => view.linked(tree)?,
                    None => view,
                };
                let (_, side) = record_of(view, record, HEADER_WORDS, kind)?;
                let place = place_of(view, record, &side, at.site)?;
                Ok(Self { tree: view.tree(), at: Some(record), place, changed: if at.site.is_some() { changed } else { side.changed }, row })
            }
            Cell::BuiltLeaf { kind: named, record, .. } if named == kind => {
                let (_, side) = record_of(view, record, HEADER_WORDS, kind)?;
                Ok(Self { tree: None, at: Some(record), place: Place::Record(record).into(), changed: side.changed, row: None })
            }
            Cell::ParsedLeaf { kind: named, row: leaf, .. } if named == kind => {
                let tree = view.tree().ok_or(malformed("parsed leaf in a built record", leaf.0))?;
                Ok(Self { tree: Some(tree), at: None, place: Place::Row { tree, row: leaf }.into(), changed: ChangedEdges::default(), row })
            }
            _ => Err(malformed("prepared cell", u32::from(kind.0))),
        }
    }

    /// The record's side record; the default for a parsed leaf.
    fn side<T>(&self, prep: &RecordPrep<'_, T>) -> Result<super::SideRecord, ArenaError> {
        let Some(record) = self.at else { return Ok(super::SideRecord::default()) };
        let view = prep.view(self.tree)?;
        let words = view.words(record, HEADER_WORDS)?;
        let kind = u16::try_from(words[0]).map(KindId).map_err(|_| malformed("record kind", words[0]))?;
        Ok(record_of(view, record, HEADER_WORDS, kind)?.1)
    }
}

/// The edges the record or leaf `at` names stores, which a holder's first
/// fill at its site starts from; none for a unit or a parsed node.
fn stored_edges<T>(prep: &RecordPrep<'_, T>, at: CellAt) -> Edges {
    let record = match at.cell {
        Cell::Child { kind, .. } | Cell::BuiltLeaf { kind, .. } => RecordKey::of(prep, at, kind).ok(),
        _ => None,
    };
    record.and_then(|key| key.side(prep).ok()).and_then(|side| side.edges).unwrap_or_default()
}

/// A record as its node's prepare body prepares it: keys only, the overlay
/// `RecordPrep` its every operation takes.
pub struct RecordAt<'r, T> {
    key: RecordKey,
    /// Each slot's wire key, by its stamped word.
    keys: fn(u32) -> Option<&'static str>,
    overlay: Marker<'r, T>,
}

impl<'r, T> RecordAt<'r, T> {
    /// The record of the `kind` node `at` names; `keys` gives each slot's
    /// wire key by its stamped word.
    ///
    /// # Errors
    ///
    /// `CoordinateError::Record` for a cell of another kind or a record no
    /// writer writes.
    pub fn of(prep: &RecordPrep<'r, T>, at: CellAt, kind: KindId, keys: fn(u32) -> Option<&'static str>) -> Result<Self, CoordinateError> {
        Ok(Self { key: RecordKey::of(prep, at, kind)?, keys, overlay: PhantomData })
    }

    /// The handle of the record's layout.
    #[must_use]
    pub fn layout(&self) -> LayoutAt<'r, T> {
        LayoutAt { key: self.key, keys: self.keys, overlay: PhantomData }
    }

    /// The handle of the slot of node type `N` whose cell is at `word`,
    /// `width` words wide, or a list of `run`-word item cells when `run` is
    /// some.
    #[must_use]
    pub fn slot<N>(&self, word: u32, width: u32, run: Option<u32>) -> SlotAt<'r, T, N> {
        SlotAt { key: self.key, word, width, run, node: PhantomData }
    }

    /// The handle of one of the record's print settings.
    #[must_use]
    pub fn setting<V>(&self, setting: SettingOf) -> SettingAt<'r, T, V> {
        SettingAt { place: self.key.place, setting, overlay: PhantomData }
    }
}

/// A record's layout, as its prepare body prepares and reads it: the layout
/// a native node of the record would hold, rebuilt into the overlay.
pub struct LayoutAt<'r, T> {
    key: RecordKey,
    keys: fn(u32) -> Option<&'static str>,
    overlay: Marker<'r, T>,
}

/// The layout a native node of the record `key` names holds before its
/// prepare. A parsed node's sides, slot layouts and separator are its row's,
/// as a read of it seats them; an envelope's content keeps only its own
/// coordinate, as a read content does, its row's layout being its
/// envelope's; a built node's are its side record's and the store's, `keys`
/// naming each slot's wire key by its word. Its changed edges
/// are left out: the render trims its sides at the edges its site marks.
fn rebuild<T: Clone + 'static>(prep: &RecordPrep<'_, T>, key: &RecordKey, keys: fn(u32) -> Option<&'static str>) -> Result<NodeLayout<T>, ArenaError> {
    let side = key.side(prep)?;
    let sides = side.sides.map(|from| NodeCoordinate::new(from.tree, from.index, from.end, from.span));
    if let PrepPlace::Content(Site { holder: Place::Row { tree, row }, .. }) = key.place {
        return Ok(NodeLayout { at: Some(prep.view(key.tree)?.row_node(tree, row)?), ..NodeLayout::default() });
    }
    if let Some(row) = key.row {
        let at = prep.view(key.tree)?.row_node(row.tree, row.row)?;
        return Ok(NodeLayout {
            trivia: prep.sources.sides(&at).and_then(|sides| sides.into_any().downcast::<NodeTrivia<T>>().ok()).map(|trivia| *trivia),
            slots: prep.sources.slot_layouts(&at),
            separator: prep.sources.separator_before(&at),
            at: Some(at),
            span: side.span,
            sides,
            ..NodeLayout::default()
        });
    }
    let (PrepPlace::Stored(Place::Record(record)), Some(_)) = (key.place, key.at) else { return Err(malformed("record place", 0)) };
    let key_of = |word: u32| keys(word).ok_or(malformed("slot word", word));
    let units = prep.store.units(record).into_iter().map(|(word, item, trivia)| Ok(UnitSides { slot: key_of(word)?.to_owned(), item, trivia })).collect::<Result<_, ArenaError>>()?;
    let slots = side
        .slots
        .iter()
        .filter(|slot| slot.before.is_some() || slot.after.is_some() || slot.separator.is_some() || !slot.tokens.is_empty())
        .map(|slot| Ok(SlotLayout { slot: key_of(slot.word)?.to_owned(), before: slot.before, after: slot.after, separator: slot.separator, tokens: slot.tokens.clone() }))
        .collect::<Result<_, ArenaError>>()?;
    Ok(NodeLayout { trivia: prep.store.sides(Place::Record(record)), span: side.span, sides, units, slots, separator: side.separator, ..NodeLayout::default() })
}

impl<T> LayoutAt<'_, T> {
    /// What `read` answers of the layout prepare left for the record.
    fn read<'p, R>(&self, prep: &'p RecordPrep<'_, T>, read: impl FnOnce(&'p Option<Box<NodeLayout<T>>>) -> Option<R>) -> Option<R> {
        prep.prepared.node(self.key.place).and_then(|node| read(&node.layout))
    }
}

impl<'r, T: Prepare + TriviaSeam + Clone + 'static> LayoutTarget<RecordPrep<'r, T>> for LayoutAt<'r, T> {
    fn prepare(&mut self, prep: &mut RecordPrep<'r, T>, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        let mut layout = Some(Box::new(rebuild(prep, &self.key, self.keys)?));
        Prepare::prepare(&mut layout, ctx)?;
        prep.prepared.node_mut(self.key.place).layout = layout;
        Ok(())
    }

    fn edges_mut<'s>(&'s mut self, prep: &'s mut RecordPrep<'r, T>) -> &'s mut Edges {
        &mut prep.prepared.node_mut(self.key.place).edges
    }

    fn set_slot_tokens(&mut self, prep: &mut RecordPrep<'r, T>, slot: &str, tokens: Vec<Option<KindId>>) {
        slot_entry(&mut prep.prepared.node_mut(self.key.place).layout, slot).tokens = tokens;
    }

    fn slot(&self, prep: &RecordPrep<'r, T>, slot: &str) -> Option<Cow<'_, SlotLayout>> {
        self.read(prep, |layout| Layout::slot(layout, slot).cloned()).map(Cow::Owned)
    }

    fn sides(&self, prep: &RecordPrep<'r, T>) -> Option<Cow<'_, NodeCoordinate>> {
        self.read(prep, |layout| Layout::sides(layout).cloned()).map(Cow::Owned)
    }

    fn snapshot_edge(&self, prep: &RecordPrep<'r, T>) -> Option<SnapshotEdge> {
        self.read(prep, Layout::snapshot_edge)
    }

    fn inner_item(&self, prep: &RecordPrep<'r, T>) -> Option<EdgeItem<'_>> {
        self.read(prep, |layout| Layout::inner_item(layout).map(EdgeItem::into_owned))
    }
}

/// One slot of a record, as its prepare body prepares it: the record's key,
/// the slot's stamped word and width, and its items' width for a list.
pub struct SlotAt<'r, T, N> {
    key: RecordKey,
    word: u32,
    width: u32,
    run: Option<u32>,
    node: Marker<'r, (T, N)>,
}

/// One present item of a slot: its cell, its site, and its row when it names
/// a parsed node.
#[derive(Debug, Clone, Copy)]
struct Item {
    at: CellAt,
    site: Site<PrepPlace>,
    row: Option<ParsedRow>,
}

impl<T, N> SlotAt<'_, T, N> {
    /// The slot's items, by item, an absent one `None`. An unset single slot
    /// holds the unit its prepare defaulted it to, when it took one.
    fn items(&self, prep: &RecordPrep<'_, T>) -> Result<Vec<Option<Item>>, ArenaError> {
        let view = prep.view(self.key.tree)?;
        let at = self.key.at.and_then(|at| at.offset(self.word)).ok_or(malformed("slot word", self.word))?;
        let place = self.key.place;
        let item = |cell: Cell, item: u32| -> Result<Option<Item>, ArenaError> {
            let site = Site { holder: place, word: self.word, item: ItemIndex(item) };
            let cell = match cell {
                Cell::Absent => match prep.prepared.node(place).and_then(|node| node.slot(self.word)).and_then(|slot| slot.unit) {
                    Some(kind) if self.run.is_none() => Cell::Unit { kind, row: None },
                    _ => return Ok(None),
                },
                cell => cell,
            };
            let at = CellAt { cell, tree: self.key.tree, site: Some(site) };
            Ok(Some(Item { at, site, row: view.parsed_row(cell)? }))
        };
        match self.run {
            None => Ok(vec![item(Cell::decode(view.words(at, self.width)?)?, 0)?]),
            Some(run) => {
                let list = ListCell::decode(view.words(at, ListCell::WIDTH)?)?;
                list.items(view.arena(), run)?.zip(0..).map(|(words, at)| item(Cell::decode(words)?, at)).collect()
            }
        }
    }

    fn present(&self, prep: &RecordPrep<'_, T>) -> Vec<Item> {
        self.items(prep).map_or_else(|_| Vec::new(), |items| items.into_iter().flatten().collect())
    }
}

/// The edge item a slot item gives a root's edge: a parsed node's
/// coordinate, else its type's snapshot geometry, else nothing to read.
fn edge_item<T, N: PrepareRecord<T>>(prep: &RecordPrep<'_, T>, item: Item) -> EdgeItem<'static> {
    match item.row {
        Some(row) => prep.row_coordinate(item.at.tree, row).map_or(EdgeItem::Rebuilt, |coord| EdgeItem::Coord(Cow::Owned(coord))),
        None => N::snapshot_edge(prep, item.at).map_or(EdgeItem::Rebuilt, EdgeItem::Snapshot),
    }
}

impl<'r, T, N: PrepareRecord<T>> EdgeItems<RecordPrep<'r, T>> for SlotAt<'r, T, N> {
    fn first_item(&self, prep: &RecordPrep<'r, T>) -> Option<EdgeItem<'_>> {
        self.present(prep).first().map(|&item| edge_item::<T, N>(prep, item))
    }

    fn last_item(&self, prep: &RecordPrep<'r, T>) -> Option<EdgeItem<'_>> {
        self.present(prep).last().map(|&item| edge_item::<T, N>(prep, item))
    }
}

impl<'r, T, N: PrepareRecord<T>> ArmOf<RecordPrep<'r, T>> for SlotAt<'r, T, N> {
    fn arm_among(&self, prep: &RecordPrep<'r, T>, ctx: &RenderContext<'_>, arms: &[ArmSite]) -> Option<KindId> {
        let item = *self.present(prep).first()?;
        match item.row {
            Some(row) => prep.row_coordinate(item.at.tree, row).ok()?.kind_in(ctx.sources).filter(|kind| arms.iter().any(|arm| arm.arm == *kind)),
            None => arms.iter().map(|arm| arm.arm).find(|kind| N::kind_in(prep, item.at, &[*kind])),
        }
    }
}

/// Prepares one slot item as a native slot prepares its value: a parsed node
/// that holds no write takes its kind's edges at its site; one a write lies
/// in prepares its record, as a native node read from it is prepared, with
/// the seams its holder seated on it; any other value prepares through its
/// type.
fn prepare_item<T: Clone + 'static, N: PrepareRecord<T> + Prepare + WriteCell<T>>(prep: &mut RecordPrep<'_, T>, item: Item, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
    let Some(row) = item.row else { return N::prepare_record(prep, item.at, ctx) };
    let coord = prep.row_coordinate(item.at.tree, row)?;
    coord.resolve(ctx.sources)?;
    if ctx.sources.edited_within(&coord) {
        if let Some(record) = edited_record::<T, N>(prep, item, &coord, ctx)? {
            if let Some(seated) = prep.prepared.coordinate_edges(item.site) {
                if N::takes_gaps(record.cell) {
                    let stored = stored_edges(prep, record);
                    seat_read_node(prep.prepared.site_edges_mut(item.site, stored), seated);
                }
            }
            return N::prepare_record(prep, record, ctx);
        }
    }
    let edges = coordinate_edges(&coord, prep.prepared.coordinate_edges(item.site), ctx);
    prep.prepared.set_coordinate_edges(item.site, edges);
    Ok(())
}

/// The cell a parsed item renders from when a write lies in its rows: a
/// record, leaf or unit cell is its own; a coordinate's is its row's
/// record, written on this first read when no read wrote it. `None` when
/// the item's type reads nothing (`Prepare::read_coordinate`).
fn edited_record<T: Clone + 'static, N: Prepare + WriteCell<T>>(prep: &mut RecordPrep<'_, T>, item: Item, coord: &NodeCoordinate, ctx: &RenderContext<'_>) -> Result<Option<CellAt>, CoordinateError> {
    let Cell::Coordinate { kind, .. } = item.at.cell else { return Ok(Some(item.at)) };
    let tree = coord.tree;
    let child = |at| CellAt { cell: Cell::Child { kind, at, link: None, changed: ChangedEdges::default() }, tree: Some(tree), site: item.at.site };
    if let Some(record) = prep.trees.tree(tree).and_then(|arena| arena.record(coord.index)) {
        return Ok(Some(child(record)));
    }
    let Some((live, read)) = ctx.sources.read_ctx(tree) else { return Ok(None) };
    let mut read = crate::read::ReadCtx { sides: None, changed: None, ..read };
    let node = match N::read_coordinate(live, &mut read, coord.index) {
        None => return Ok(None),
        Some(read) => read.map_err(|error| unread(coord, &error))?,
    };
    let arena = prep.trees.tree_mut(tree).ok_or(malformed("record tree", tree.0))?;
    let cell = node.write_cell(&mut RecordSink::parsed(tree, arena))?;
    Ok(Some(CellAt { cell, ..item.at }))
}

/// A slot's present items as the gap and seat fills write them.
struct Fills<'p, 'r, T, N> {
    prep: &'p mut RecordPrep<'r, T>,
    items: Vec<Item>,
    node: PhantomData<fn() -> N>,
}

impl<T, N> PresentItems for Fills<'_, '_, T, N> {
    fn present(&self) -> usize {
        self.items.len()
    }
}

impl<T, N: PrepareRecord<T>> GapItems for Fills<'_, '_, T, N> {
    fn fill_gap(&mut self, at: usize, side: Side, seam: SeamArm) {
        let item = self.items[at];
        if item.row.is_some() {
            fill_coordinate_gap(self.prep.prepared.coordinate_edges_mut(item.site), side, seam);
        } else if N::takes_gaps(item.at.cell) {
            let stored = stored_edges(self.prep, item.at);
            fill_node_gap(self.prep.prepared.site_edges_mut(item.site, stored), side, seam);
        }
    }
}

impl<T, N: PrepareRecord<T>> SeatItems for Fills<'_, '_, T, N> {
    fn fill_seat(&mut self, at: usize, table: &[Option<SiteId>], ctx: &RenderContext<'_>) {
        let item = self.items[at];
        match item.row {
            Some(row) => {
                let Some(seat) = self.prep.row_coordinate(item.at.tree, row).ok().and_then(|coord| coord_seat(&coord, table, ctx)) else { return };
                seat_coordinate(self.prep.prepared.coordinate_edges_mut(item.site), seat, ctx);
            }
            None => {
                if let Some((site, stored, seat)) = N::seat_record(self.prep, item.at, table, ctx) {
                    seat_node(self.prep.prepared.site_edges_mut(site, stored), seat, ctx);
                }
            }
        }
    }
}

impl<'r, T: Clone + 'static, N: PrepareRecord<T> + Prepare + WriteCell<T>> SlotTarget<RecordPrep<'r, T>> for SlotAt<'r, T, N> {
    fn prepare(&mut self, prep: &mut RecordPrep<'r, T>, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        for item in self.items(prep)?.into_iter().flatten() {
            prepare_item::<T, N>(prep, item, ctx)?;
        }
        Ok(())
    }

    fn fill_gaps(&mut self, prep: &mut RecordPrep<'r, T>, slot: Option<&SlotLayout>) {
        let items = self.present(prep);
        fill_gaps(&mut Fills::<T, N> { prep, items, node: PhantomData }, slot);
    }

    fn separators(&self, prep: &RecordPrep<'r, T>, kind_of: fn(KindId) -> Option<KindId>, ctx: &RenderContext<'_>) -> Option<Vec<Option<KindId>>> {
        let items = self.items(prep).ok()?;
        let separator = |item: Item| match item.row {
            Some(row) if row.changed.leading => None,
            Some(row) => prep.row_coordinate(item.at.tree, row).ok().and_then(|coord| ctx.sources.separator_before(&coord)),
            None => <N as PrepareRecord<T>>::source_separator(prep, item.at, ctx),
        };
        separators(items.into_iter().map(|item| item.map(separator)), kind_of)
    }
}

impl<'r, T, N: PrepareRecord<T>> SeatSlot<RecordPrep<'r, T>> for SlotAt<'r, T, N> {
    fn fill_seats(&mut self, prep: &mut RecordPrep<'r, T>, table: &[Option<SiteId>], ctx: &RenderContext<'_>) {
        let items = self.present(prep);
        fill_seats(&mut Fills::<T, N> { prep, items, node: PhantomData }, table, ctx);
    }
}

impl<'r, T, N: FromKindId> UnitSlot<RecordPrep<'r, T>> for SlotAt<'r, T, N> {
    fn fill_unit(&mut self, prep: &mut RecordPrep<'r, T>, kind: KindId) {
        let unset = self.items(prep).is_ok_and(|items| items.iter().all(Option::is_none));
        if unset && N::from_kind_id(kind).is_some() {
            prep.prepared.node_mut(self.key.place).slot_mut(self.word).unit = Some(kind);
        }
    }
}

/// Which print setting of a record a handle fills.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SettingOf {
    Delimiter,
    SeparatorKind,
    /// The separator spacing of the list slot at `word`, before the
    /// separator or after it.
    Space { word: u32, before: bool },
}

/// One print setting of a record: the overlay's fill, below what the record
/// stores.
pub struct SettingAt<'r, T, V> {
    place: PrepPlace,
    setting: SettingOf,
    overlay: Marker<'r, (T, V)>,
}

impl<'r, T> Setting<Delimiter, RecordPrep<'r, T>> for SettingAt<'r, T, Delimiter> {
    fn fill(&mut self, prep: &mut RecordPrep<'r, T>, value: Delimiter) {
        prep.prepared.node_mut(self.place).delimiter.get_or_insert(value);
    }
}

impl<'r, T> Setting<KindId, RecordPrep<'r, T>> for SettingAt<'r, T, KindId> {
    fn fill(&mut self, prep: &mut RecordPrep<'r, T>, value: KindId) {
        let node = prep.prepared.node_mut(self.place);
        match self.setting {
            SettingOf::SeparatorKind => node.separator_kind.get_or_insert(value),
            SettingOf::Space { word, before: true } => node.slot_mut(word).space_before.get_or_insert(value),
            SettingOf::Space { word, before: false } => node.slot_mut(word).space_after.get_or_insert(value),
            SettingOf::Delimiter => return,
        };
    }
}

/// A record's seat by its own kind: the site in `table` of `kind`, the
/// record `at` names held at its site, and the edges it stores there.
#[must_use]
pub fn own_seat<T>(prep: &RecordPrep<'_, T>, at: CellAt, kind: KindId, table: &[Option<SiteId>]) -> Option<(Site<PrepPlace>, Edges, SiteId)> {
    let seat = seat_site(table, kind)?;
    Some((at.site?, stored_edges(prep, at), seat))
}

/// A wrapper record's seat through its content (`SeatTarget` of a wrapper):
/// the content at the `width`-word slot at `word`, of node type `C`. A parsed
/// content's seat (`coord_seat`) fills the wrapper's own edges; a built
/// one's is its type's.
#[must_use]
pub fn seat_through<T, C: PrepareRecord<T>>(prep: &RecordPrep<'_, T>, at: CellAt, kind: KindId, word: u32, width: u32, table: &[Option<SiteId>], ctx: &RenderContext<'_>) -> Option<(Site<PrepPlace>, Edges, SiteId)> {
    let key = RecordKey::of(prep, at, kind).ok()?;
    let slot = SlotAt::<T, C> { key, word, width, run: None, node: PhantomData };
    let content = *slot.present(prep).first()?;
    match content.row {
        Some(row) => {
            let seat = coord_seat(&prep.row_coordinate(content.at.tree, row).ok()?, table, ctx)?;
            Some((at.site?, stored_edges(prep, at), seat))
        }
        None => C::seat_record(prep, content.at, table, ctx),
    }
}

/// A built record's own separator before it (`layout::source_separator`):
/// the one it stores, else, while its neighbour before is still its
/// source's, the one before the node it was rebuilt from.
#[must_use]
pub fn record_source_separator<T>(prep: &RecordPrep<'_, T>, at: CellAt, kind: KindId, ctx: &RenderContext<'_>) -> Option<KindId> {
    let key = RecordKey::of(prep, at, kind).ok()?;
    let side = key.side(prep).ok()?;
    side.separator.or_else(|| {
        if key.changed.leading {
            return None;
        }
        let from = side.sides?;
        ctx.sources.separator_before(&NodeCoordinate::new(from.tree, from.index, from.end, from.span))
    })
}

/// A built record's snapshot geometry (`Layout::snapshot_edge`), from its
/// layout as a holder reads it before the record's own prepare.
#[must_use]
pub fn record_snapshot_edge<T: Prepare + TriviaSeam + Clone + 'static>(prep: &RecordPrep<'_, T>, at: CellAt, kind: KindId) -> Option<SnapshotEdge> {
    let key = RecordKey::of(prep, at, kind).ok()?;
    let side = key.side(prep).ok()?;
    let layout = Some(Box::new(NodeLayout { span: side.span, trivia: key.place.stored().and_then(|place| prep.store.sides(place)), ..NodeLayout::default() }));
    Layout::snapshot_edge(&layout)
}

/// `KindOf::kind_in` of the value `at` names, read through its view `V`.
#[must_use]
pub fn view_kind_in<'p, T, V: RecordView<'p, T> + KindOf>(prep: &'p RecordPrep<'_, T>, at: CellAt, kinds: &[KindId]) -> bool {
    prep.view(at.tree).and_then(|ctx| V::from_cell(ctx, at.cell, at.site)).is_ok_and(|view| view.kind_in(kinds))
}
