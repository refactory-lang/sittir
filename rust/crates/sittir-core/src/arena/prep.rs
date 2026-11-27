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
use super::{checked_record, place_of, Address, PrepPlace, ArenaRead, ArenaError, Cell, HydrateNode, Prepared, RecordCtx, RecordView};
use crate::layout::{merge_source_sides, slots_or_source, SlotLayout, UnitSides};
use crate::options::{ArmSite, Edges, Side};
use crate::delimiters::{DelimiterSlot, DelimiterToken, SetFacet, TokenFacts};
use super::HasRecord;
use crate::render::{Render, RenderResult, RenderSink};
use crate::prepare::{
    coord_seat, coordinate_edges, fill_coordinate_gap, fill_gaps, fill_node_gap, fill_seats, seat_coordinate, seat_node, seat_read_node, seat_site, ArmOf, EdgeItem, EdgeItems, FromKindId, GapItems,
    LayoutTarget, Prepare, PresentItems, RenderContext, RenderSlot, SeatItems, SeatSlot, Setting, SlotTarget, SnapshotEdge, UnitSlot,
};
use crate::record::HEADER_WORDS;
use crate::render::{RenderError, SourceTable};
use crate::slot::{NodeIdOrCoordinate, NodeIdOrOwnedCoordinate, SeamArm};
use crate::trivia::{NodeTrivia, TriviaSeam};
use crate::trivia_store::{Place, Site, TriviaStore};
use crate::types::{Delimiter, ItemIndex, KindId, NodeId, SiteId};
use crate::view::KindOf;

/// A handle's marker: it holds keys only, and its operations take the
/// overlay `RecordPrep<'r, …>`.
type Marker<'r, A> = PhantomData<fn(&'r ()) -> A>;

fn malformed(what: &'static str, word: u32) -> ArenaError {
    ArenaError::Malformed { what, word }
}

/// The overlay a render of the root record `root`, of node type `N`, renders
/// with: the root prepared into a fresh one.
///
/// # Errors
///
/// What the root's prepare refuses.
pub fn prepare_root<T, N: PrepareRecord<T> + super::RecordCells>(reads: Option<&dyn ArenaRead>, built: &dyn ArenaRead, store: &TriviaStore<T>, root: CellAt, ctx: &RenderContext<'_>, bits: u32) -> Result<Prepared<T>, RenderError> {
    let mut prepared = Prepared::new();
    N::prepare_record(&mut RecordPrep::new(&mut prepared, reads, built, ctx.sources, store, bits), root, ctx)?;
    Ok(prepared)
}

/// What a record's prepare reads and writes besides the record: the overlay
/// it fills, beside the built arena that holds the records reads left, the
/// built arena, the render's trees and the store of written sides, which
/// it only reads, and the bits the grammar's kind fields take.
pub struct RecordPrep<'r, T> {
    prepared: &'r mut Prepared<T>,
    reads: Option<&'r dyn ArenaRead>,
    built: &'r dyn ArenaRead,
    sources: &'r dyn SourceTable,
    store: &'r TriviaStore<T>,
    bits: u32,
}

impl<'r, T> RecordPrep<'r, T> {
    #[must_use]
    pub fn new(prepared: &'r mut Prepared<T>, reads: Option<&'r dyn ArenaRead>, built: &'r dyn ArenaRead, sources: &'r dyn SourceTable, store: &'r TriviaStore<T>, bits: u32) -> Self {
        Self { prepared, reads, built, sources, store, bits }
    }

    /// The view context of the source `node` lies in, the built arena for
    /// none, over the overlay as prepare has filled it so far.
    fn view(&self, node: Option<NodeId>) -> Result<RecordCtx<'_, T>, ArenaError> {
        RecordCtx::of(node, self.built, self.reads, self.sources, self.store, self.prepared, self.bits)
    }
}

/// A cell as prepare reaches it: the cell, a node of the source whose
/// records hold it (none for the built arena), and the site its holder holds
/// it at (none for a root).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CellAt {
    pub cell: Cell,
    pub node: Option<NodeId>,
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
    fn prepare_record(prep: &mut RecordPrep<'_, T>, at: CellAt, ctx: &RenderContext<'_>) -> Result<(), RenderError>;
    /// Whether the value `cell` names takes a list gap's edges:
    /// `Prepare::gap_edges` is some.
    fn takes_gaps(cell: Cell) -> bool;
    /// `SeatTarget::seat_target`: the site whose edges the seat fills, the
    /// edges stored for the value there, and the seat.
    fn seat_record(prep: &RecordPrep<'_, T>, at: CellAt, table: &[Option<SiteId>], ctx: &RenderContext<'_>) -> Option<(Site<PrepPlace>, Edges, SiteId)>;
    /// `Prepare::snapshot_edge`.
    fn snapshot_edge(prep: &RecordPrep<'_, T>, at: CellAt) -> Option<SnapshotEdge>;
    /// `KindOf::kind_in`.
    fn kind_in(prep: &RecordPrep<'_, T>, at: CellAt, kinds: &[KindId]) -> bool;
    /// The storage key of the slot whose cell a record of `kind` holds at
    /// `word`, `None` for any other word or kind.
    fn slot_key(kind: KindId, word: u32) -> Option<&'static str>;
    /// The word a record of `kind` holds the cell of the slot `key` at,
    /// `None` for any other slot or kind. The inverse of `slot_key`.
    fn slot_word(kind: KindId, key: &str) -> Option<u32>;
}

impl<T, N: PrepareRecord<T>> PrepareRecord<T> for Box<N> {
    fn claims(kind: KindId) -> bool {
        N::claims(kind)
    }

    fn prepare_record(prep: &mut RecordPrep<'_, T>, at: CellAt, ctx: &RenderContext<'_>) -> Result<(), RenderError> {
        N::prepare_record(prep, at, ctx)
    }

    fn takes_gaps(cell: Cell) -> bool {
        N::takes_gaps(cell)
    }

    fn seat_record(prep: &RecordPrep<'_, T>, at: CellAt, table: &[Option<SiteId>], ctx: &RenderContext<'_>) -> Option<(Site<PrepPlace>, Edges, SiteId)> {
        N::seat_record(prep, at, table, ctx)
    }

    fn snapshot_edge(prep: &RecordPrep<'_, T>, at: CellAt) -> Option<SnapshotEdge> {
        N::snapshot_edge(prep, at)
    }

    fn kind_in(prep: &RecordPrep<'_, T>, at: CellAt, kinds: &[KindId]) -> bool {
        N::kind_in(prep, at, kinds)
    }

    fn slot_key(kind: KindId, word: u32) -> Option<&'static str> {
        N::slot_key(kind, word)
    }

    fn slot_word(kind: KindId, key: &str) -> Option<u32> {
        N::slot_word(kind, key)
    }
}

/// Text a record holds as a slot's content or an `ERROR` node, which
/// prepare leaves as it is and no kind test asks.
impl<T> PrepareRecord<T> for crate::verbatim::VerbatimNode {
    fn claims(kind: KindId) -> bool {
        <super::VerbatimRecord<'_> as RecordView<'_, T>>::claims(kind)
    }

    fn prepare_record(_: &mut RecordPrep<'_, T>, _: CellAt, _: &RenderContext<'_>) -> Result<(), RenderError> {
        Ok(())
    }

    fn takes_gaps(_: Cell) -> bool {
        false
    }

    fn seat_record(_: &RecordPrep<'_, T>, _: CellAt, _: &[Option<SiteId>], _: &RenderContext<'_>) -> Option<(Site<PrepPlace>, Edges, SiteId)> {
        None
    }

    fn snapshot_edge(_: &RecordPrep<'_, T>, _: CellAt) -> Option<SnapshotEdge> {
        None
    }

    fn kind_in(_: &RecordPrep<'_, T>, _: CellAt, _: &[KindId]) -> bool {
        false
    }

    fn slot_key(_: KindId, _: u32) -> Option<&'static str> {
        None
    }

    fn slot_word(_: KindId, _: &str) -> Option<u32> {
        None
    }
}

/// Where one record is, as its prepare body's handles name it.
#[derive(Debug, Clone, Copy)]
struct RecordKey {
    /// A node of the source whose records hold it; none for the built arena.
    node: Option<NodeId>,
    /// The record; none for a parsed leaf, which has none.
    at: Option<Address>,
    side_at: Address,
    /// The record's header word, as its key read it; 0 for no record.
    header: u32,
    place: PrepPlace,
}

impl RecordKey {
    /// The key of the record or leaf `at` names, of a kind `claims` claims.
    fn of<T>(prep: &RecordPrep<'_, T>, at: CellAt, claims: impl Fn(KindId) -> bool) -> Result<Self, ArenaError> {
        let view = prep.view(at.node)?;
        match at.cell {
            Cell::Child { kind, at: record, .. } if claims(kind) => {
                let view = view.child(record)?;
                let (words, side_at) = checked_record(view, record, HEADER_WORDS, kind)?;
                let place = place_of(view, record)?;
                Ok(Self { node: view.node(), at: Some(record), side_at, header: super::header_word(words), place })
            }
            Cell::BuiltLeaf { kind, .. } if claims(kind) => Ok(Self { node: None, at: None, side_at: Address::NONE, header: 0, place: super::built_leaf_place(at.site)? }),
            Cell::ReadLeaf { kind, at: record, name, .. } if claims(kind) => {
                Ok(Self { node: None, at: Some(record), side_at: Address::NONE, header: 0, place: super::linked_leaf_place(view, record, name, at.site)? })
            }
            Cell::NamedLeaf { kind, id, .. } if claims(kind) => {
                let place = super::leaf_place(view, id, at.site)?;
                Ok(Self { node: view.node(), at: None, side_at: Address::NONE, header: 0, place })
            }
            cell => Err(malformed("prepared cell", cell.kind().map_or(0, |kind| u32::from(kind.0)))),
        }
    }

    /// The record's side record; the default for a parsed leaf.
    fn side<T>(&self, prep: &RecordPrep<'_, T>) -> Result<super::SideRecord, ArenaError> {
        if self.side_at == Address::NONE { return Ok(super::SideRecord::default()) }
        prep.view(self.node)?.side(self.side_at)
    }

    /// The sides writes gave the node at `place` (`TriviaStore::sides`),
    /// the record's header read from the key and `rows` its side record's
    /// rows when `place` is the record's.
    fn stored_sides<T: Clone + crate::trivia::FromTriviaText>(&self, prep: &RecordPrep<'_, T>, place: Place, rows: &super::RowFields) -> Result<Option<NodeTrivia<T>>, ArenaError> {
        match self.at {
            Some(at) if place.as_record() == Some(at) => prep.store.sides_under(place, self.header, rows, prep.built),
            _ => prep.store.sides(place, prep.built),
        }
    }
}

/// The edges the record or leaf `at` names stores, which a holder's first
/// fill at its site starts from; none for a unit or a parsed node.
fn stored_edges<T>(prep: &RecordPrep<'_, T>, at: CellAt) -> Edges {
    let record = match at.cell {
        Cell::Child { kind, .. } | Cell::ReadLeaf { kind, .. } => RecordKey::of(prep, at, |named| named == kind).ok(),
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
    /// The record `at` names, of a kind `claims` claims; `keys` gives each
    /// slot's wire key by its stamped word.
    ///
    /// # Errors
    ///
    /// `CoordinateError::Record` for a cell of another kind or a record no
    /// writer writes.
    pub fn of(prep: &RecordPrep<'r, T>, at: CellAt, claims: fn(KindId) -> bool, keys: fn(u32) -> Option<&'static str>) -> Result<Self, RenderError> {
        Ok(Self { key: RecordKey::of(prep, at, claims)?, keys, overlay: PhantomData })
    }

    /// The handle of the record's layout.
    #[must_use]
    pub fn layout(&self) -> LayoutAt<'r, T> {
        LayoutAt { key: self.key, keys: self.keys, overlay: PhantomData }
    }

    /// The handle of the slot of node type `N` whose cell is stamped
    /// `shape`.
    #[must_use]
    pub fn slot<N, const ADJACENT: bool>(&self, shape: super::CellShape) -> SlotAt<'r, T, N, ADJACENT> {
        SlotAt { key: self.key, shape, node: PhantomData }
    }

    /// The handle of one of the record's print settings.
    #[must_use]
    pub fn setting<V>(&self, setting: SettingOf) -> SettingAt<'r, T, V> {
        SettingAt { key: self.key, setting, overlay: PhantomData }
    }
}

/// A node's own sides, and its unit children's by slot and item.
type OwnSides<T> = (Option<NodeTrivia<T>>, Vec<UnitSides<T>>);

/// The sides of the parsed node `at` names, as the render's sources seat
/// them over the arenas prepare holds.
fn source_sides<T: 'static>(prep: &RecordPrep<'_, T>, at: NodeIdOrCoordinate<'_>) -> Option<NodeTrivia<T>> {
    prep.sources.sides(at).and_then(|sides| sides.into_any().downcast::<NodeTrivia<T>>().ok()).map(|trivia| *trivia)
}

/// `trivia`, sides its store holds, each record a read left marked to render
/// as its source while its node does (`SourceTable::renders_as_source`), as
/// a read's own sides give it.
fn read_entries<T>(prep: &RecordPrep<'_, T>, trivia: Option<NodeTrivia<T>>) -> Result<Option<NodeTrivia<T>>, ArenaError> {
    let Some(mut trivia) = trivia else { return Ok(None) };
    let view = prep.view(None)?;
    for entries in [&mut trivia.leading, &mut trivia.trailing, &mut trivia.inner].into_iter().flatten() {
        for entry in entries.iter_mut() {
            let crate::trivia::TriviaEntry::Record(record) = entry else { continue };
            let cell = Cell::Child { kind: record.record.kind, at: record.record.at, changed: crate::slot::ChangedEdges::default() };
            let Some(row) = view.cell_row(cell)? else { continue };
            let at = row.at(None);
            if prep.sources.renders_as_source(at) {
                let span = at.span(prep.sources).ok_or(malformed("record source", record.record.at.0))?;
                let source = super::RunNodes::source_of(view.arena(), record.record.at)?;
                record.as_source = Some(crate::trivia::SourceEntry { span, source, edges: None });
            }
        }
    }
    Ok(Some(trivia))
}

/// A record's layout, as its prepare body prepares and reads it. Each fact
/// is read where it is kept, as a native node of the record holds it after
/// its prepare: where it came from, from its tree; its stored slot layouts
/// and the node it was rebuilt from, from its side record or its tree. What
/// prepare makes of it (its sides prepared, its slots' per-item separators)
/// goes to the overlay. An envelope's content has none of these: its row's
/// layout is its envelope's.
pub struct LayoutAt<'r, T> {
    key: RecordKey,
    keys: fn(u32) -> Option<&'static str>,
    overlay: Marker<'r, T>,
}

impl<T: Clone + crate::trivia::FromTriviaText + 'static> LayoutAt<'_, T> {
    fn enveloped(&self) -> bool {
        matches!(self.key.place, PrepPlace::Content(_))
    }

    /// Where a parsed node came from (`NodeLayout::at`): its own node.
    fn at(&self, prep: &RecordPrep<'_, T>) -> Result<Option<NodeIdOrCoordinate<'static>>, ArenaError> {
        Ok(prep.view(self.key.node)?.read_node(self.key.place).map(NodeIdOrCoordinate::of))
    }

    /// The node the record was rebuilt from (`NodeLayout::sides`).
    fn rebuilt_from(&self, prep: &RecordPrep<'_, T>) -> Result<Option<NodeIdOrOwnedCoordinate>, ArenaError> {
        if self.enveloped() {
            return Ok(None);
        }
        Ok(self.key.side(prep)?.sides.map(super::Sides::at))
    }

    /// The layouts its list slots store (`NodeLayout::slots`): a parsed
    /// node's row's, a built node's side record's, `keys` naming each slot by
    /// its word; else, when it stores none, the node it was rebuilt from's.
    fn stored_slots(&self, prep: &RecordPrep<'_, T>) -> Result<Vec<SlotLayout>, ArenaError> {
        if self.enveloped() {
            return Ok(Vec::new());
        }
        let own = if let Some(at) = self.at(prep)? {
            prep.sources.slot_layouts(at)
        } else {
            let key_of = |word: u32| (self.keys)(word).ok_or(malformed("slot word", word));
            let side = self.key.side(prep)?;
            side.slots
                .iter()
                .filter(|slot| slot.before.is_some() || slot.after.is_some() || slot.separator.is_some())
                .map(|slot| Ok(SlotLayout { slot: key_of(slot.word)?.to_owned(), before: slot.before, after: slot.after, separator: slot.separator }))
                .collect::<Result<_, ArenaError>>()?
        };
        Ok(slots_or_source(own, self.rebuilt_from(prep)?.as_ref().map(NodeIdOrOwnedCoordinate::at), prep.sources))
    }

    /// Its own sides and its units' sides as a read or a write left them:
    /// a parsed node's from its tree, a built node's from the store. Each
    /// side it holds none of is the one of the node it was rebuilt from.
    fn own_sides(&self, prep: &RecordPrep<'_, T>) -> Result<OwnSides<T>, ArenaError> {
        if self.enveloped() {
            return Ok((None, Vec::new()));
        }
        let side = self.key.side(prep)?;
        let units = |id: crate::types::NodeId| -> Result<Vec<UnitSides<T>>, ArenaError> {
            let key_of = |word: u32| (self.keys)(word).ok_or(malformed("slot word", word));
            let holder = Address(id.address());
            let units = if self.key.at == Some(holder) { prep.store.units_in(holder, &side.rows, prep.built)? } else { prep.store.units(holder, prep.built)? };
            units.into_iter().map(|(word, item, trivia)| Ok(UnitSides { slot: key_of(word)?.to_owned(), item, trivia })).collect()
        };
        let (mut trivia, units) = match (self.at(prep)?, self.key.place) {
            (Some(at), PrepPlace::Stored(Place::Node(id))) if id.site().is_none() => (source_sides(prep, at), units(id)?),
            (Some(at), _) => (source_sides(prep, at), Vec::new()),
            (None, PrepPlace::Stored(place @ Place::Node(id))) if id.site().is_none() => (read_entries(prep, self.key.stored_sides(prep, place, &side.rows)?)?, units(id)?),
            (None, PrepPlace::Stored(place @ (Place::Node(_) | Place::RootLeaf))) => (read_entries(prep, self.key.stored_sides(prep, place, &side.rows)?)?, Vec::new()),
            _ => return Err(malformed("record place", 0)),
        };
        merge_source_sides(&mut trivia, side.sides.map(super::Sides::at).as_ref().map(NodeIdOrOwnedCoordinate::at), prep.sources);
        Ok((trivia, units))
    }

    /// The span a snapshot node lies at (`NodeLayout::span`).
    fn span(&self, prep: &RecordPrep<'_, T>) -> Option<crate::points::PointSpan> {
        if self.enveloped() {
            return None;
        }
        self.key.side(prep).ok()?.span
    }

    /// The sides prepare left for the record.
    fn prepared<'p>(&self, prep: &'p RecordPrep<'_, T>) -> Option<&'p NodeTrivia<T>> {
        prep.prepared.node(self.key.place)?.trivia.as_ref()
    }
}

impl<'r, T: Prepare + TriviaSeam + Clone + crate::trivia::FromTriviaText + 'static> LayoutTarget<RecordPrep<'r, T>> for LayoutAt<'r, T> {
    /// Prepares its sides and its units' sides into the overlay.
    fn prepare(&mut self, prep: &mut RecordPrep<'r, T>, ctx: &RenderContext<'_>) -> Result<(), RenderError> {
        let (mut trivia, mut units) = self.own_sides(prep)?;
        for unit in &mut units {
            unit.trivia.prepare(ctx)?;
        }
        trivia.prepare(ctx)?;
        let node = prep.prepared.node_mut(self.key.place);
        node.trivia = trivia;
        node.units = units;
        Ok(())
    }

    fn edges_mut<'s>(&'s mut self, prep: &'s mut RecordPrep<'r, T>) -> &'s mut Edges {
        &mut prep.prepared.node_mut(self.key.place).edges
    }

    /// Its stored layout.
    fn slot(&self, prep: &RecordPrep<'r, T>, slot: &str) -> Option<Cow<'_, SlotLayout>> {
        self.stored_slots(prep).ok()?.into_iter().find(|entry| entry.slot == slot).map(Cow::Owned)
    }

    fn sides(&self, prep: &RecordPrep<'r, T>) -> Option<NodeIdOrOwnedCoordinate> {
        self.rebuilt_from(prep).ok()?
    }

    fn snapshot_edge(&self, prep: &RecordPrep<'r, T>) -> Option<SnapshotEdge> {
        crate::layout::snapshot_edge(self.span(prep), self.prepared(prep))
    }

    fn inner_item(&self, prep: &RecordPrep<'r, T>) -> Option<EdgeItem<'_>> {
        crate::layout::inner_item(self.prepared(prep))
    }

    fn flanks(&self, prep: &RecordPrep<'r, T>) -> crate::layout_kinds::Flanks {
        if self.enveloped() {
            return crate::layout_kinds::Flanks::default();
        }
        self.key.side(prep).map_or_else(|_| crate::layout_kinds::Flanks::default(), |side| side.flanks)
    }
}


/// One slot of a record, as its prepare body prepares it: the record's key
/// and the slot's stamped cell.
pub struct SlotAt<'r, T, N, const ADJACENT: bool = false> {
    key: RecordKey,
    shape: super::CellShape,
    node: Marker<'r, (T, N)>,
}

/// One present item of a slot: its cell, its site, and its row when it names
/// a parsed node.
#[derive(Debug, Clone, Copy)]
struct Item {
    at: CellAt,
    site: Site<PrepPlace>,
    row: Option<ParsedRow>,
    /// The kind of a parsed unit its cell names with no row: it takes a
    /// coordinate's edges.
    unit: Option<KindId>,
}

/// Scalar slots stay inline. Lists keep owned scratch so preparation can append to parsed arenas.
enum Items<T> {
    Empty,
    One([T; 1]),
    Many(Vec<T>),
}

impl<T> std::ops::Deref for Items<T> {
    type Target = [T];

    fn deref(&self) -> &[T] {
        match self {
            Self::Empty => &[],
            Self::One(item) => item,
            Self::Many(items) => items,
        }
    }
}

impl<T> IntoIterator for Items<T> {
    type Item = T;
    type IntoIter = std::iter::Chain<std::option::IntoIter<T>, std::vec::IntoIter<T>>;

    fn into_iter(self) -> Self::IntoIter {
        let (one, many) = match self {
            Self::Empty => (None, Vec::new()),
            Self::One([item]) => (Some(item), Vec::new()),
            Self::Many(items) => (None, items),
        };
        one.into_iter().chain(many)
    }
}

impl<T, N, const ADJACENT: bool> SlotAt<'_, T, N, ADJACENT> {
    /// The slot's items, by item, an absent one `None`. An unset single slot
    /// holds the unit its prepare defaulted it to, when it took one.
    fn items(&self, prep: &RecordPrep<'_, T>) -> Result<Items<Option<Item>>, ArenaError> {
        let view = prep.view(self.key.node)?;
        let word = self.shape.word;
        let record = self.key.at.ok_or(malformed("slot word", word))?;
        let reach = if view.node().is_none() { self.shape.built + 1 } else { word + self.shape.width };
        let words = view.words(record, reach)?;
        let place = self.key.place;
        let item = |cell: Cell, item: u32| -> Result<Option<Item>, ArenaError> {
            let site = Site { holder: place, word, item: ItemIndex(item) };
            let unit = match cell {
                Cell::Unit { kind, row: None } if view.node().is_some() && kind != KindId::BLANK => Some(kind),
                _ => None,
            };
            let cell = match cell {
                Cell::Absent => match prep.prepared.node(place).and_then(|node| node.slot(word)).and_then(|slot| slot.unit) {
                    Some(kind) if self.shape.run.is_none() => Cell::Unit { kind, row: None },
                    _ => return Ok(None),
                },
                cell => cell,
            };
            let at = CellAt { cell, node: self.key.node, site: Some(site) };
            Ok(Some(Item { at, site, row: view.cell_row(cell)?, unit }))
        };
        if self.shape.run.is_none() {
            return Ok(Items::One([item(view.slot_cell(words, record, self.shape)?, 0)?]));
        }
        let (list, run) = view.slot_list(words, self.shape)?;
        list.items(view.arena(), run)?
            .zip(0..)
            .map(|(words, at)| item(view.item_cell(words, record, self.shape, at)?, at))
            .collect::<Result<_, _>>()
            .map(Items::Many)
    }

    fn present(&self, prep: &RecordPrep<'_, T>) -> Items<Item> {
        match self.items(prep) {
            Ok(Items::One([Some(item)])) => Items::One([item]),
            Ok(Items::Many(items)) => Items::Many(items.into_iter().flatten().collect()),
            _ => Items::Empty,
        }
    }
}

/// The edge item a slot item gives a root's edge: a parsed node's
/// coordinate, else its type's snapshot geometry, else nothing to read.
fn edge_item<T, N: PrepareRecord<T>>(prep: &RecordPrep<'_, T>, item: Item) -> EdgeItem<'static> {
    match (item.row, item.unit, item.at.node) {
        (Some(row), ..) => EdgeItem::Node(row.id),
        (None, Some(_), Some(node)) => unit_edge(prep, node),
        _ => N::snapshot_edge(prep, item.at).map_or(EdgeItem::Rebuilt, EdgeItem::Snapshot),
    }
}

/// The edge item a parsed unit gives the root of `node`'s source: a unit has
/// no span, and what lies past it to the source's edge is that edge's
/// whitespace, so the item is the source between its outer whitespace.
fn unit_edge<T>(prep: &RecordPrep<'_, T>, node: NodeId) -> EdgeItem<'static> {
    let Some(source) = prep.sources.source_of(NodeIdOrCoordinate::of(node)) else { return EdgeItem::Rebuilt };
    let span = crate::types::Span { start: crate::types::narrow(source.len() - source.trim_start().len()), end: crate::types::narrow(source.trim_end().len()) };
    EdgeItem::Bytes { node: crate::slot::NodeIdOrOwnedCoordinate::NodeId(node), span }
}

impl<'r, T, N: PrepareRecord<T>, const ADJACENT: bool> EdgeItems<RecordPrep<'r, T>> for SlotAt<'r, T, N, ADJACENT> {
    fn first_item(&self, prep: &RecordPrep<'r, T>) -> Option<EdgeItem<'_>> {
        self.present(prep).first().map(|&item| edge_item::<T, N>(prep, item))
    }

    fn last_item(&self, prep: &RecordPrep<'r, T>) -> Option<EdgeItem<'_>> {
        self.present(prep).last().map(|&item| edge_item::<T, N>(prep, item))
    }
}

impl<'r, T, N: PrepareRecord<T>, const ADJACENT: bool> ArmOf<RecordPrep<'r, T>> for SlotAt<'r, T, N, ADJACENT> {
    fn arm_among(&self, prep: &RecordPrep<'r, T>, ctx: &RenderContext<'_>, arms: &[ArmSite]) -> Option<KindId> {
        let item = *self.present(prep).first()?;
        match item.row {
            Some(row) => row.at(None).kind_in(ctx.sources).filter(|kind| arms.iter().any(|arm| arm.arm == *kind)),
            None => arms.iter().map(|arm| arm.arm).find(|kind| N::kind_in(prep, item.at, &[*kind])),
        }
    }
}

/// Prepares one slot item as a native slot prepares its value: a parsed node
/// that renders as its source takes its kind's edges at its site; one that
/// renders through its record (`view::through_record`) prepares its record,
/// as a native node read from it is prepared, with the seams its holder
/// seated on it; any other value prepares through its type.
fn prepare_item<T: Clone + 'static, N: PrepareRecord<T> + Prepare + HydrateNode>(prep: &mut RecordPrep<'_, T>, item: Item, ctx: &RenderContext<'_>) -> Result<(), RenderError> {
    crate::stack::grown(|| prepare_item_in_place::<T, N>(prep, item, ctx))
}

fn prepare_item_in_place<T: Clone + 'static, N: PrepareRecord<T> + Prepare + HydrateNode>(prep: &mut RecordPrep<'_, T>, item: Item, ctx: &RenderContext<'_>) -> Result<(), RenderError> {
    if let Some(kind) = item.unit {
        let edges = crate::prepare::unit_coordinate_edges(kind, prep.prepared.coordinate_edges(item.site), ctx);
        prep.prepared.set_coordinate_edges(item.site, edges);
        return Ok(());
    }
    let Some(row) = item.row else { return N::prepare_record(prep, item.at, ctx) };
    let at = row.at(None);
    at.resolve(ctx.sources)?;
    if super::view::through_record(ctx.sources, at, item.at.cell) {
        let record = item.at;
        if let Some(seated) = prep.prepared.coordinate_edges(item.site) {
            if N::takes_gaps(record.cell) {
                let stored = stored_edges(prep, record);
                seat_read_node(prep.prepared.site_edges_mut(item.site, stored), seated);
            }
        }
        return N::prepare_record(prep, record, ctx);
    }
    let edges = coordinate_edges(at, prep.prepared.coordinate_edges(item.site), ctx);
    prep.prepared.set_coordinate_edges(item.site, edges);
    Ok(())
}

/// A slot's present items as the gap and seat fills write them.
struct Fills<'p, 'r, T, N> {
    prep: &'p mut RecordPrep<'r, T>,
    items: Items<Item>,
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
        if item.row.is_some() || item.unit.is_some() {
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
        if let Some(kind) = item.unit {
            if let Some(seat) = seat_site(table, kind) {
                seat_coordinate(self.prep.prepared.coordinate_edges_mut(item.site), seat, ctx);
            }
            return;
        }
        match item.row {
            Some(row) => {
                let Some(seat) = coord_seat(row.at(None), table, ctx) else { return };
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

impl<'r, T: Clone + 'static, N: PrepareRecord<T> + Prepare + HydrateNode, const ADJACENT: bool> SlotTarget<RecordPrep<'r, T>> for SlotAt<'r, T, N, ADJACENT> {
    fn prepare(&mut self, prep: &mut RecordPrep<'r, T>, ctx: &RenderContext<'_>) -> Result<(), RenderError> {
        for item in self.items(prep)?.into_iter().flatten() {
            prepare_item::<T, N>(prep, item, ctx)?;
        }
        Ok(())
    }

    fn fill_gaps(&mut self, prep: &mut RecordPrep<'r, T>, slot: Option<&SlotLayout>) {
        let items = self.present(prep);
        fill_gaps(&mut Fills::<T, N> { prep, items, node: PhantomData }, slot);
    }
}

impl<'r, T, N: PrepareRecord<T>, const ADJACENT: bool> SeatSlot<RecordPrep<'r, T>> for SlotAt<'r, T, N, ADJACENT> {
    fn fill_seats(&mut self, prep: &mut RecordPrep<'r, T>, table: &[Option<SiteId>], ctx: &RenderContext<'_>) {
        let items = self.present(prep);
        fill_seats(&mut Fills::<T, N> { prep, items, node: PhantomData }, table, ctx);
    }
}

impl<'r, T, N: FromKindId, const ADJACENT: bool> UnitSlot<RecordPrep<'r, T>> for SlotAt<'r, T, N, ADJACENT> {
    fn fill_unit(&mut self, prep: &mut RecordPrep<'r, T>, kind: KindId) {
        let unset = self.items(prep).is_ok_and(|items| items.iter().all(Option::is_none));
        if unset && N::from_kind_id(kind).is_some() {
            prep.prepared.node_mut(self.key.place).slot_mut(self.shape.word).unit = Some(kind);
        }
    }
}

impl<T, N, const ADJACENT: bool> SlotAt<'_, T, N, ADJACENT> {
    /// The slot's one present item, when it holds one.
    fn sole(&self, prep: &RecordPrep<'_, T>) -> Option<Item> {
        match self.present(prep) {
            Items::One([item]) => Some(item),
            _ => None,
        }
    }

    /// A parsed item, between the seams its prepare gave it.
    fn node_at(prep: &RecordPrep<'_, T>, item: Item, row: ParsedRow) -> NodeIdOrCoordinate<'static> {
        row.at(prep.prepared.coordinate_edges(item.site))
    }
}

impl<'r, T: Clone + 'static, N, const ADJACENT: bool> DelimiterSlot<RecordPrep<'r, T>> for SlotAt<'r, T, N, ADJACENT>
where
    N: SetFacet + PrepareRecord<T> + HydrateNode + HasRecord,
    for<'a> N::Record<'a>: RecordView<'a, T> + DelimiterToken,
{
    /// A token is read through its view, which renders the facet prepare
    /// gave its site.
    fn token(&self, prep: &RecordPrep<'r, T>, _: &RenderContext<'_>) -> Option<TokenFacts> {
        let item = self.sole(prep)?;
        <N::Record<'_> as RecordView<'_, T>>::from_cell(prep.view(item.at.node).ok()?, item.at.cell, Some(item.site)).ok().map(|view| TokenFacts::of(&view))
    }

    /// The overlay holds the facet at the token's site. A parsed token the
    /// facet changes renders through its record, which is prepared here.
    fn set_facet(&mut self, prep: &mut RecordPrep<'r, T>, facet: &str, ctx: &RenderContext<'_>) -> Result<(), RenderError> {
        let Some(item) = self.sole(prep) else { return Ok(()) };
        if self.token(prep, ctx).is_some_and(|token| token.facet.as_deref() == Some(facet)) {
            return Ok(());
        }
        if item.row.is_some() {
            N::prepare_record(prep, item.at, ctx)?;
        }
        prep.prepared.set_facet(item.site, facet.to_owned());
        Ok(())
    }
}

impl<'r, T, N, const ADJACENT: bool> RenderSlot<RecordPrep<'r, T>> for SlotAt<'r, T, N, ADJACENT>
where
    N: HasRecord,
    for<'a> N::Record<'a>: RecordView<'a, T> + Render,
{
    /// Each present item as its holder's view renders it (`RecordSlot`): a
    /// parsed node as its source unless it renders through its record
    /// (`view::through_record`) or a derived facet lies in it, any other
    /// value through its view.
    fn render_slot(&self, prep: &RecordPrep<'r, T>, ctx: &RenderContext<'_>, w: &mut dyn RenderSink) -> RenderResult {
        let items = self.items(prep).map_err(RenderError::Record)?;
        for item in items.into_iter().flatten() {
            if let Some(row) = item.row {
                let at = Self::node_at(prep, item, row);
                if !super::view::through_record(ctx.sources, at, item.at.cell) && prep.prepared.facet(item.site).is_none() {
                    crate::slot::write_coordinate(at, ADJACENT, w)?;
                    continue;
                }
            }
            let view = prep.view(item.at.node).map_err(RenderError::Record)?;
            <N::Record<'_> as RecordView<'_, T>>::from_cell(view, item.at.cell, Some(item.site)).map_err(RenderError::Record)?.render(w)?;
        }
        Ok(())
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
    key: RecordKey,
    setting: SettingOf,
    overlay: Marker<'r, (T, V)>,
}

impl<'r, T> Setting<Delimiter, RecordPrep<'r, T>> for SettingAt<'r, T, Delimiter> {
    fn fill(&mut self, prep: &mut RecordPrep<'r, T>, value: Delimiter) {
        prep.prepared.node_mut(self.key.place).delimiter.get_or_insert(value);
    }

    /// The setting the record stores.
    fn chosen(&self, prep: &RecordPrep<'r, T>) -> bool {
        self.key.side(prep).is_ok_and(|side| side.delimiter.is_some())
    }
}

impl<'r, T> Setting<KindId, RecordPrep<'r, T>> for SettingAt<'r, T, KindId> {
    fn fill(&mut self, prep: &mut RecordPrep<'r, T>, value: KindId) {
        let node = prep.prepared.node_mut(self.key.place);
        match self.setting {
            SettingOf::SeparatorKind => node.separator_kind.get_or_insert(value),
            SettingOf::Space { word, before: true } => node.slot_mut(word).space_before.get_or_insert(value),
            SettingOf::Space { word, before: false } => node.slot_mut(word).space_after.get_or_insert(value),
            SettingOf::Delimiter => return,
        };
    }

    /// The setting the record stores.
    fn chosen(&self, prep: &RecordPrep<'r, T>) -> bool {
        self.key.side(prep).is_ok_and(|side| match self.setting {
            SettingOf::SeparatorKind => side.separator_kind.is_some(),
            SettingOf::Space { word, before } => side.slots.iter().any(|slot| slot.word == word && if before { slot.space_before.is_some() } else { slot.space_after.is_some() }),
            SettingOf::Delimiter => false,
        })
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
pub fn seat_through<T, C: PrepareRecord<T>>(prep: &RecordPrep<'_, T>, at: CellAt, claims: fn(KindId) -> bool, cell: super::CellShape, table: &[Option<SiteId>], ctx: &RenderContext<'_>) -> Option<(Site<PrepPlace>, Edges, SiteId)> {
    if cell.run.is_some() { return None; }
    let key = RecordKey::of(prep, at, claims).ok()?;
    let slot = SlotAt::<T, C> { key, shape: cell, node: PhantomData };
    let content = *slot.present(prep).first()?;
    match content.row {
        Some(row) => {
            let seat = coord_seat(row.at(None), table, ctx)?;
            Some((at.site?, stored_edges(prep, at), seat))
        }
        None => C::seat_record(prep, content.at, table, ctx),
    }
}

/// A built record's snapshot geometry (`Layout::snapshot_edge`), from its
/// span and its stored sides, as a holder reads them before the record's own
/// prepare.
#[must_use]
pub fn record_snapshot_edge<T: Prepare + Clone + crate::trivia::FromTriviaText>(prep: &RecordPrep<'_, T>, at: CellAt, claims: fn(KindId) -> bool) -> Option<SnapshotEdge> {
    let key = RecordKey::of(prep, at, claims).ok()?;
    let side = key.side(prep).ok()?;
    crate::layout::snapshot_edge(side.span, key.place.stored().and_then(|place| key.stored_sides(prep, place, &side.rows).ok().flatten()).as_ref())
}

/// `KindOf::kind_in` of the value `at` names, read through its view `V`.
#[must_use]
pub fn view_kind_in<'p, T, V: RecordView<'p, T> + KindOf>(prep: &'p RecordPrep<'_, T>, at: CellAt, kinds: &[KindId]) -> bool {
    prep.view(at.node).and_then(|ctx| V::from_cell(ctx, at.cell, at.site)).is_ok_and(|view| view.kind_in(kinds))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::arena::Arena;
    use std::cell::Cell as Counter;

    struct CountedArena {
        arena: Arena,
        reads: Counter<usize>,
    }

    impl ArenaRead for CountedArena {
        fn chunk(&self, index: u32) -> Option<&[u32]> {
            self.reads.set(self.reads.get() + 1);
            self.arena.chunk(index)
        }

        fn string_chunk(&self, index: u32) -> Option<&[u8]> {
            self.arena.string_chunk(index)
        }
    }

    struct NoSources;

    impl SourceTable for NoSources {
        fn source_of(&self, _: NodeIdOrCoordinate<'_>) -> Option<&str> { None }
    }

    #[test]
    fn a_validated_key_without_side_data_does_not_reread_its_header() {
        let kind = KindId(7);
        let mut arena = Arena::new();
        let at = arena.push(&[u32::from(kind.0), 0]).expect("room");
        let arena = CountedArena { arena, reads: Counter::new(0) };
        let mut prepared = Prepared::<()>::new();
        let store = TriviaStore::new();
        let prep = RecordPrep::new(&mut prepared, None, &arena, &NoSources, &store, crate::record::PARSED_KIND_BITS);
        let key = RecordKey::of(&prep, CellAt {
            cell: Cell::Child { kind, at, changed: crate::slot::ChangedEdges::default() },
            node: None,
            site: None,
        }, |named| named == kind).expect("valid record");
        let reads = arena.reads.get();
        assert_eq!(key.side(&prep).expect("empty side"), super::super::SideRecord::default());
        assert_eq!(arena.reads.get(), reads);
    }
}
