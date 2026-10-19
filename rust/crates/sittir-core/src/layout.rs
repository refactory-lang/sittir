//! `NodeLayout` — what a node carries beside its slots.
//!
//! A node's layout is the trivia it owns, its base edges, its list slots'
//! stored layout, where it came from (a read node's coordinate, a snapshot
//! node's span, the node a rebuilt node was rebuilt from) and the edges
//! whose neighbour a rebuild changed. The wire sends it as `$_layout`,
//! absent when the node has none. The edges never cross: the prepare walk
//! fills them. A node stores it boxed in an `Option`, so it costs a
//! payload one pointer, and reads it through `Layout`, so an absent layout
//! reads as an empty one.

use crate::options::{Edges, Side};
use crate::prepare::{Prepare, RenderContext};
use crate::render::{CoordinateError, Render, RenderResult, RenderSink};
use crate::slot::NodeCoordinate;
use crate::trivia::{Framing, NodeTrivia, TriviaSeam};
use crate::types::KindId;

#[derive(Debug, Clone, PartialEq)]
pub struct NodeLayout<T> {
    pub trivia: Option<NodeTrivia<T>>,
    pub edges: Option<Edges>,
    /// Where a read node came from: its own coordinate. The reader writes it
    /// for every native node it reads; a built node has none. No bytes render
    /// from it: JavaScript crosses an untouched node as this coordinate, and an
    /// edited one without it. The writer tells the node's own frames by it
    /// (`RenderSink::in_frame_of`).
    pub at: Option<NodeCoordinate>,
    /// Where a snapshot node lies: its span measured from the start of the
    /// native node that holds it. A snapshot node has no `at`; a read or built
    /// node has no span.
    pub span: Option<crate::points::PointSpan>,
    /// The node a built node was rebuilt from (`$_layout.sides`): each side
    /// the built node does not hold is that node's, as its tree's trivia table
    /// gives it, filled in at prepare. It names the built node's frame as
    /// `at` names a read node's.
    pub sides: Option<NodeCoordinate>,
    /// The edges whose neighbour a built holder changed (`$_layout.changed`):
    /// at prepare the node's sides there drop their layout runs and balance
    /// the depth of the runs they keep (`trivia::on_changed_edge`).
    pub changed: crate::slot::ChangedEdges,
    /// The sides of the node's unit children (`$_layout.units`), which a
    /// slot stores as a bare kind and so carry no layout of their own: each
    /// by its slot and its item in that slot (`UnitSides`). A read that seats
    /// sides fills it for each unit it reads inline; a rebuilt node's are the
    /// ones JavaScript carries from the node it was rebuilt from, at the items
    /// they moved to. The render frames each unit by them (`render_unit`).
    pub units: Vec<UnitSides<T>>,
    /// The layout of each of the node's list slots whose separator gaps the
    /// source spells apart from the options (`$_layout.slots`,
    /// `SlotLayout`). A read writes it; a rebuilt node takes the slots of the
    /// node it was rebuilt from (`sides`) at prepare.
    pub slots: Vec<SlotLayout>,
    /// The separator before the node as an item of a list slot, as a grammar
    /// id, where its source spells another than the one the slot renders
    /// (`$_layout.separator`, `ParsedTree::separator_before`). A read writes
    /// it; a node without a tree carries it as data.
    pub separator: Option<KindId>,
    /// The byte span in its tree's source of each of a token interior's
    /// captures, one per capture field at the index the derive stamps it
    /// (`None` where its group did not match). A read writes it; a built node
    /// has none. It never crosses: a record keeps each span in its capture's
    /// cell.
    pub captures: Vec<Option<crate::types::Span>>,
    /// The row of each unit child the read took inline, by its slot and its
    /// item there: a parsed record's unit cell names it, so the unit's sides
    /// key by its row as any parsed node's do. A read writes it; a built node
    /// has none. It never crosses.
    pub unit_rows: Vec<UnitRow>,
}

/// The row of one unit child a read took inline, by the slot that holds it
/// (its wire key) and its item in that slot.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UnitRow {
    pub slot: &'static str,
    pub item: crate::types::ItemIndex,
    pub row: crate::types::NodeIndex,
}

/// A list slot's layout: the class its separator gaps take before and after
/// the separator, and its separator token, each only where its occurrence's
/// source takes one apart from the options in effect when it was read. Every
/// separator gap of the slot, existing or inserted, renders it, below a
/// gap's own layout entry (`prepare::SlotTarget::fill_gaps`).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SlotLayout {
    /// The slot's wire key.
    pub slot: String,
    pub before: Option<KindId>,
    pub after: Option<KindId>,
    pub separator: Option<KindId>,
    /// The separator before each item, by its place in the slot, as a
    /// candidate kind of the list's separator, where its source spells
    /// another than the slot's (`prepare::SlotTarget::separators`). The
    /// prepare walk fills it; it never crosses.
    pub tokens: Vec<Option<KindId>>,
}

impl SlotLayout {
    /// Whether the layout stores anything.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.before.is_none() && self.after.is_none() && self.separator.is_none()
    }
}

/// How much of a parsed tree's layout it stores apart from the options in
/// effect when it was read (`ParsedTree::stored_layout`).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct StoredLayout {
    /// The runs of whitespace a side stores as a member.
    pub deviations: u32,
    /// The list slots that store a layout (`SlotLayout`).
    pub slots: u32,
    /// The items that store their own separator (`NodeLayout::separator`).
    pub separators: u32,
}

/// The work a parsed tree's layout reads have done so far, counted where it
/// is done (`ParsedTree::layout_work`): a diagnostic, so a growth test
/// compares counts, never times.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct LayoutWork {
    /// The nodes the region-depth walks entered (`ParsedTree::region_depth`).
    pub region_nodes: u32,
    /// The items the sibling lookups visited (`ParsedTree::siblings`).
    pub sibling_items: u32,
}

/// The running counts behind [`LayoutWork`], kept on the tree.
#[derive(Debug, Default)]
pub struct LayoutWorkCounter {
    region_nodes: std::sync::atomic::AtomicU64,
    sibling_items: std::sync::atomic::AtomicU64,
}

impl LayoutWorkCounter {
    pub fn region_nodes(&self, n: usize) {
        self.region_nodes.fetch_add(n as u64, std::sync::atomic::Ordering::Relaxed);
    }

    pub fn sibling_items(&self, n: usize) {
        self.sibling_items.fetch_add(n as u64, std::sync::atomic::Ordering::Relaxed);
    }

    pub fn counts(&self) -> LayoutWork {
        let read = |count: &std::sync::atomic::AtomicU64| u32::try_from(count.load(std::sync::atomic::Ordering::Relaxed)).unwrap_or(u32::MAX);
        LayoutWork { region_nodes: read(&self.region_nodes), sibling_items: read(&self.sibling_items) }
    }
}

/// The layout `layout` holds for the list slot `slot`.
#[must_use]
pub fn slot_layout<'a, T>(layout: Option<&'a NodeLayout<T>>, slot: &str) -> Option<&'a SlotLayout> {
    layout?.slots.iter().find(|entry| entry.slot == slot)
}

/// The entry for the list slot `slot` in `layout`, made with the layout when
/// either is absent.
pub fn slot_entry<'a, T>(layout: &'a mut Option<Box<NodeLayout<T>>>, slot: &str) -> &'a mut SlotLayout {
    let slots = &mut layout.get_or_insert_with(Default::default).slots;
    let at = if let Some(at) = slots.iter().position(|entry| entry.slot == slot) { at } else {
        slots.push(SlotLayout { slot: slot.to_string(), ..SlotLayout::default() });
        slots.len() - 1
    };
    &mut slots[at]
}

/// Each item's own separator in the list slot `slot`, by its place
/// (`SlotLayout::tokens`); empty where none differs from the slot's.
#[must_use]
pub fn slot_tokens<'a, T>(layout: Option<&'a NodeLayout<T>>, slot: &str) -> &'a [Option<KindId>] {
    slot_layout(layout, slot).map_or(&[], |entry| &entry.tokens)
}

/// The separator a node's source spells before it as a list item where it
/// is not the slot's: the one it carries (`NodeLayout::separator`), else,
/// while its neighbour before is still its source's, the one its source
/// stores (its own coordinate, or the node it was rebuilt from).
#[must_use]
pub fn source_separator<T>(layout: Option<&NodeLayout<T>>, ctx: &RenderContext<'_>) -> Option<KindId> {
    let layout = layout?;
    layout.separator.or_else(|| {
        if layout.changed.leading {
            return None;
        }
        ctx.sources.separator_before(layout.at.as_ref().or(layout.sides.as_ref())?)
    })
}

/// The sides of one unit child, by the slot that holds it (its wire key) and
/// its item in that slot, 0 for a slot holding one value.
#[derive(Debug, Clone, PartialEq)]
pub struct UnitSides<T> {
    pub slot: String,
    pub item: crate::types::ItemIndex,
    pub trivia: NodeTrivia<T>,
}

/// The sides `layout` holds for the unit at item `item` of the slot `slot`.
#[must_use]
pub fn unit_sides<'a, T>(layout: Option<&'a NodeLayout<T>>, slot: &str, item: crate::types::ItemIndex) -> Option<&'a NodeTrivia<T>> {
    layout?.units.iter().find(|unit| unit.slot == slot && unit.item == item).map(|unit| &unit.trivia)
}

/// Writes the value at item `item` of the slot `slot` (`body`) framed by the
/// sides `layout` holds for it when it is a unit (`unit_sides`), as a
/// coordinate is framed by its node's (`render_framed`).
pub fn render_unit<T: Render + TriviaSeam>(
    layout: Option<&NodeLayout<T>>,
    slot: &str,
    item: crate::types::ItemIndex,
    w: &mut dyn RenderSink,
    body: impl FnOnce(&mut dyn RenderSink) -> RenderResult,
) -> RenderResult {
    match unit_sides(layout, slot, item) {
        Some(trivia) => render_framed(Some(trivia), Edges::default(), None, None, TriviaRole::Owner, w, body),
        None => body(w),
    }
}

impl<T: Render + TriviaSeam + std::fmt::Debug> crate::view::UnitFrames for NodeLayout<T> {
    fn frame_unit(&self, slot: &str, item: crate::types::ItemIndex, w: &mut dyn RenderSink, body: &mut dyn FnMut(&mut dyn RenderSink) -> RenderResult) -> RenderResult {
        render_unit(Some(self), slot, item, w, body)
    }
}

/// A list slot's unit frames, for its `ListView`: the slot `slot` of
/// `layout`, when the node has a layout.
#[must_use]
pub fn list_units<'a, T: Render + TriviaSeam + std::fmt::Debug + 'a>(layout: Option<&'a NodeLayout<T>>, slot: &'a str) -> Option<(&'a str, &'a dyn crate::view::UnitFrames)> {
    layout.map(|layout| (slot, layout as &dyn crate::view::UnitFrames))
}

/// What a generated render body reads from its node's layout: its edges, a
/// unit child framed by its sides, and a list slot's per-item separators and
/// unit frames. A native node answers from its `NodeLayout`; a record view
/// answers from its side record.
pub trait BodyLayout<'a>: Copy {
    fn edges(self) -> Edges;

    /// `render_unit`.
    fn render_unit(
        self,
        slot: &str,
        item: crate::types::ItemIndex,
        w: &mut dyn RenderSink,
        body: impl FnOnce(&mut dyn RenderSink) -> RenderResult,
    ) -> RenderResult;

    /// `slot_tokens`.
    fn slot_tokens(self, slot: &str) -> &'a [Option<KindId>];

    /// `list_units`.
    fn list_units(self, slot: &'a str) -> Option<(&'a str, &'a dyn crate::view::UnitFrames)>;

    /// `trivia::render_inner`: the node's inner trivia, at its inner gap.
    fn render_inner(self, w: &mut dyn RenderSink) -> RenderResult;

    /// `trivia::has_inner`.
    fn has_inner(self) -> bool;
}

impl<'a, T: Render + TriviaSeam + std::fmt::Debug + 'a> BodyLayout<'a> for Option<&'a NodeLayout<T>> {
    fn edges(self) -> Edges {
        self.and_then(|layout| layout.edges).unwrap_or(Edges::NONE)
    }

    fn render_unit(
        self,
        slot: &str,
        item: crate::types::ItemIndex,
        w: &mut dyn RenderSink,
        body: impl FnOnce(&mut dyn RenderSink) -> RenderResult,
    ) -> RenderResult {
        render_unit(self, slot, item, w, body)
    }

    fn slot_tokens(self, slot: &str) -> &'a [Option<KindId>] {
        slot_tokens(self, slot)
    }

    fn list_units(self, slot: &'a str) -> Option<(&'a str, &'a dyn crate::view::UnitFrames)> {
        list_units(self, slot)
    }

    fn render_inner(self, w: &mut dyn RenderSink) -> RenderResult {
        crate::trivia::render_inner(self.and_then(|layout| layout.trivia.as_ref()), w)
    }

    fn has_inner(self) -> bool {
        crate::trivia::has_inner(self.and_then(|layout| layout.trivia.as_ref()))
    }
}

impl<T> Default for NodeLayout<T> {
    fn default() -> Self {
        Self {
            trivia: None,
            edges: None,
            at: None,
            span: None,
            sides: None,
            changed: crate::slot::ChangedEdges { leading: false, trailing: false },
            units: Vec::new(),
            slots: Vec::new(),
            separator: None,
            captures: Vec::new(),
            unit_rows: Vec::new(),
        }
    }
}

/// The part a node plays in seating held trivia. An owner seats the trailing
/// entries an earlier owner held, before it renders and again after; an
/// anonymous token is counted among the tokens between an owner and its
/// same-line trailing entries, so the held entries stay held past it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TriviaRole {
    Owner,
    Token,
}

/// A node's layout as its struct stores it.
pub trait Layout {
    type Trivia;
    fn trivia(&self) -> Option<&NodeTrivia<Self::Trivia>>;
    fn edges(&self) -> &Edges;
    fn edges_mut(&mut self) -> &mut Edges;
    /// The stored layout of the node's list slot `slot` (`SlotLayout`).
    fn slot(&self, slot: &str) -> Option<&SlotLayout>;
    /// The node a built node was rebuilt from (`NodeLayout::sides`).
    fn sides(&self) -> Option<&crate::slot::NodeCoordinate>;
    /// Where a snapshot node lies, and how far its leading and trailing
    /// trivia reach (`NodeLayout::span`).
    fn snapshot_edge(&self) -> Option<crate::prepare::SnapshotEdge>;
    /// Where a node's inner trivia lies, as one item spanning all of its
    /// entries but its layout runs: the source bytes they span when each is a
    /// coordinate into one tree, a snapshot's geometry when each carries one,
    /// `None` with no inner trivia, and `Rebuilt` otherwise.
    fn inner_item(&self) -> Option<crate::prepare::EdgeItem<'_>>;
}

impl<T: Prepare + TriviaSeam> Layout for Option<Box<NodeLayout<T>>> {
    type Trivia = T;

    fn trivia(&self) -> Option<&NodeTrivia<T>> {
        self.as_ref()?.trivia.as_ref()
    }

    fn edges(&self) -> &Edges {
        self.as_ref()
            .and_then(|layout| layout.edges.as_ref())
            .unwrap_or(&Edges::NONE)
    }

    fn edges_mut(&mut self) -> &mut Edges {
        self.get_or_insert_with(Default::default)
            .edges
            .get_or_insert_with(Default::default)
    }

    fn slot(&self, slot: &str) -> Option<&SlotLayout> {
        slot_layout(self.as_deref(), slot)
    }

    fn sides(&self) -> Option<&crate::slot::NodeCoordinate> {
        self.as_ref()?.sides.as_ref()
    }

    fn snapshot_edge(&self) -> Option<crate::prepare::SnapshotEdge> {
        use crate::prepare::TriviaReach;
        let layout = self.as_ref()?;
        let trivia = layout.trivia.as_ref();
        let reach = |entry: Option<&crate::trivia::TriviaEntry<T>>, end: fn(crate::points::PointSpan) -> crate::points::Point| match entry {
            None => TriviaReach::Bare,
            Some(entry) => entry.value.snapshot_edge().map_or(TriviaReach::Unplaced, |edge| TriviaReach::To(end(edge.span))),
        };
        Some(crate::prepare::SnapshotEdge {
            span: layout.span?,
            leading: reach(trivia.and_then(|trivia| trivia.leading.as_ref()?.first()), |span| span.start),
            trailing: reach(trivia.and_then(|trivia| trivia.trailing.as_ref()?.last()), |span| span.end),
        })
    }

    fn inner_item(&self) -> Option<crate::prepare::EdgeItem<'_>> {
        use crate::prepare::{EdgeItem, SnapshotEdge, TriviaReach};
        let entries: Vec<_> = self.as_ref()?.trivia.as_ref()?.inner.as_ref()?.iter().filter(|entry| !entry.is_layout()).collect();
        let first = entries.first()?;
        if let Some(coord) = first.value.coord() {
            let mut span = coord.span;
            for entry in &entries {
                let Some(next) = entry.value.coord().filter(|next| next.tree == coord.tree) else { return Some(EdgeItem::Rebuilt) };
                span = crate::types::Span { start: span.start.min(next.span.start), end: span.end.max(next.span.end) };
            }
            return Some(EdgeItem::Bytes { tree: coord.tree, span });
        }
        let mut extent: Option<crate::points::PointSpan> = None;
        for entry in entries {
            let Some(edge) = entry.value.snapshot_edge() else { return Some(EdgeItem::Rebuilt) };
            extent = Some(extent.map_or(edge.span, |span| crate::points::PointSpan {
                start: span.start.min(edge.span.start),
                end: span.end.max(edge.span.end),
            }));
        }
        extent.map(|span| EdgeItem::Snapshot(SnapshotEdge { span, leading: TriviaReach::Bare, trailing: TriviaReach::Bare }))
    }
}

/// A prepare's handle on a layout (`prepare::LayoutTarget`) reads it as the
/// layout it borrows.
impl<L: Layout + ?Sized> Layout for &mut L {
    type Trivia = L::Trivia;

    fn trivia(&self) -> Option<&NodeTrivia<Self::Trivia>> {
        (**self).trivia()
    }

    fn edges(&self) -> &Edges {
        (**self).edges()
    }

    fn edges_mut(&mut self) -> &mut Edges {
        (**self).edges_mut()
    }

    fn slot(&self, slot: &str) -> Option<&SlotLayout> {
        (**self).slot(slot)
    }

    fn sides(&self) -> Option<&crate::slot::NodeCoordinate> {
        (**self).sides()
    }

    fn snapshot_edge(&self) -> Option<crate::prepare::SnapshotEdge> {
        (**self).snapshot_edge()
    }

    fn inner_item(&self) -> Option<crate::prepare::EdgeItem<'_>> {
        (**self).inner_item()
    }
}

impl<T: Render + TriviaSeam> NodeLayout<T> {
    /// Writes a node of `kind` between its layout: `render_framed` over its
    /// trivia and base edges.
    pub fn render(
        layout: Option<&Self>,
        kind: Option<KindId>,
        role: TriviaRole,
        w: &mut dyn RenderSink,
        body: impl FnOnce(&mut dyn RenderSink) -> RenderResult,
    ) -> RenderResult {
        let trivia = layout.and_then(|layout| layout.trivia.as_ref());
        let edges = layout.and_then(|layout| layout.edges).unwrap_or_default();
        let origin = layout.and_then(|layout| layout.at.as_ref().or(layout.sides.as_ref()));
        render_framed(trivia, edges, kind, origin, role, w, body)
    }
}

/// Writes a node of `kind` between its trivia and base edges. An owner first
/// seats the trailing trivia an earlier owner held; then the node's leading entries,
/// the body, and its trailing entries render. Before the leading entries
/// and after the body the sink is handed each side of the node's stamped
/// base edges (`RenderSink::unsited_edge`), which writes a stamp only where
/// the kind has no edge site of its own, so a list gap's source class or a
/// seat on a leaf item renders although no template writes that edge.
/// After the body the sink is told the kind was written
/// (`RenderSink::end_line_after`), so a line-terminated kind holds its line
/// end before any trailing entry renders, and an owner seats what its
/// children held, so held trivia never passes a token outside its parent. A
/// folded coordinate with outside trivia renders through it too, its slice as
/// the body.
pub fn render_framed<F: Framing + ?Sized>(
    trivia: Option<&F>,
    edges: Edges,
    kind: Option<KindId>,
    origin: Option<&NodeCoordinate>,
    role: TriviaRole,
    w: &mut dyn RenderSink,
    body: impl FnOnce(&mut dyn RenderSink) -> RenderResult,
) -> RenderResult {
    if role == TriviaRole::Owner {
        w.seat_trailing()?;
    }
    if let Some(kind) = kind {
        w.unsited_edge(kind, Side::Before, edges.before);
    }
    if let Some(trivia) = trivia {
        trivia.frame_leading(w)?;
    }
    w.open_frame(origin);
    let line_terminated = kind.is_some_and(|kind| w.kind_has(kind, crate::options::KindFlags::LINE_TERMINATED));
    let outer = line_terminated.then(|| w.swallow_cr(true));
    body(w)?;
    if let Some(outer) = outer {
        w.swallow_cr(outer);
    }
    w.close_frame();
    if let Some(kind) = kind {
        w.unsited_edge(kind, Side::After, edges.after);
        w.end_line_after(kind);
    }
    if role == TriviaRole::Owner {
        w.seat_trailing()?;
    }
    if let Some(trivia) = trivia {
        trivia.frame_trailing(w)?;
    }
    Ok(())
}

impl<T: Prepare + TriviaSeam + 'static> Prepare for NodeLayout<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        if let Some(source) = self.sides.as_ref().and_then(|coord| ctx.sources.sides(coord)) {
            if let Ok(source) = source.into_any().downcast::<NodeTrivia<T>>() {
                let own = self.trivia.get_or_insert_with(Default::default);
                own.leading = own.leading.take().or(source.leading);
                own.trailing = own.trailing.take().or(source.trailing);
                own.inner = own.inner.take().or(source.inner);
            }
        }
        if self.slots.is_empty() {
            if let Some(coord) = self.sides.as_ref() {
                self.slots = ctx.sources.slot_layouts(coord);
            }
        }
        let changed = std::mem::take(&mut self.changed);
        if let Some(trivia) = self.trivia.as_mut() {
            trivia.trim_changed(changed);
        }
        for unit in &mut self.units {
            unit.trivia.prepare(ctx)?;
        }
        self.trivia.prepare(ctx)
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue + crate::trivia::HasTrivia> ::napi::bindgen_prelude::FromNapiValue for Box<NodeLayout<T>>
{
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
        Ok(Box::new(unsafe { NodeLayout::from_napi_value(env, napi_val)? }))
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue> ::napi::bindgen_prelude::ToNapiValue for Box<NodeLayout<T>> {
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe { NodeLayout::to_napi_value(env, *val) }
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue + crate::trivia::HasTrivia> ::napi::bindgen_prelude::FromNapiValue
    for NodeLayout<T>
{
    unsafe fn from_napi_value(
        env: ::napi::sys::napi_env,
        napi_val: ::napi::sys::napi_value,
    ) -> ::napi::Result<Self> {
        use crate::boundary::property;
        // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
        unsafe {
            Ok(Self {
                trivia: property(env, napi_val, c"trivia")?,
                edges: None,
                at: match property::<::napi::bindgen_prelude::Object>(env, napi_val, c"at")? {
                    Some(at) => Some(
                        crate::slot::coordinate_from_napi(env, ::napi::JsValue::raw(&at))?
                            .ok_or_else(|| ::napi::Error::from_reason("$_layout.at carries no $treeHandle"))?,
                    ),
                    None => None,
                },
                span: property(env, napi_val, c"span")?,
                changed: property(env, napi_val, c"changed")?.unwrap_or_default(),
                sides: match property::<::napi::bindgen_prelude::Object>(env, napi_val, c"sides")? {
                    Some(sides) => Some(
                        crate::slot::coordinate_from_napi(env, ::napi::JsValue::raw(&sides))?
                            .ok_or_else(|| ::napi::Error::from_reason("$_layout.sides carries no $treeHandle"))?,
                    ),
                    None => None,
                },
                units: property(env, napi_val, c"units")?.unwrap_or_default(),
                slots: property(env, napi_val, c"slots")?.unwrap_or_default(),
                separator: property(env, napi_val, c"separator")?,
                captures: Vec::new(),
                unit_rows: Vec::new(),
            })
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::FromNapiValue + crate::trivia::HasTrivia> ::napi::bindgen_prelude::FromNapiValue for UnitSides<T> {
    /// `{ slot, item, leading?, trailing?, inner? }`.
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        use crate::boundary::property;
        // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
        unsafe {
            Ok(Self {
                slot: property(env, napi_val, c"slot")?.ok_or_else(|| ::napi::Error::from_reason("a unit's sides name its slot"))?,
                item: property(env, napi_val, c"item")?.unwrap_or(crate::types::ItemIndex(0)),
                trivia: NodeTrivia::from_napi_value(env, napi_val)?,
            })
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue> ::napi::bindgen_prelude::ToNapiValue for UnitSides<T> {
    /// `{ slot, item, leading?, trailing?, inner? }`, each side only when present.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with_present, present};
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe {
            object_with_present(env, &[
                present(env, c"slot", Some(val.slot))?,
                present(env, c"item", Some(val.item))?,
                present(env, c"leading", val.trivia.leading)?,
                present(env, c"trailing", val.trivia.trailing)?,
                present(env, c"inner", val.trivia.inner)?,
            ])
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::FromNapiValue for SlotLayout {
    /// `{ slot, before?, after?, separator? }`.
    unsafe fn from_napi_value(env: ::napi::sys::napi_env, napi_val: ::napi::sys::napi_value) -> ::napi::Result<Self> {
        use crate::boundary::property;
        // SAFETY: napi calls `from_napi_value` with `napi_val` live in `env`.
        unsafe {
            Ok(Self {
                slot: property(env, napi_val, c"slot")?.ok_or_else(|| ::napi::Error::from_reason("a slot's layout names its slot"))?,
                before: property(env, napi_val, c"before")?,
                after: property(env, napi_val, c"after")?,
                separator: property(env, napi_val, c"separator")?,
                tokens: Vec::new(),
            })
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for SlotLayout {
    /// `{ slot, before?, after?, separator? }`, each class only when present.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with_present, present};
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe {
            object_with_present(env, &[
                present(env, c"slot", Some(val.slot))?,
                present(env, c"before", val.before)?,
                present(env, c"after", val.after)?,
                present(env, c"separator", val.separator)?,
            ])
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for LayoutWork {
    /// `{ regionNodes, siblingItems }`.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with_present, present};
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe {
            object_with_present(env, &[
                present(env, c"regionNodes", Some(val.region_nodes))?,
                present(env, c"siblingItems", Some(val.sibling_items))?,
            ])
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl ::napi::bindgen_prelude::ToNapiValue for StoredLayout {
    /// `{ deviations, slots, separators }`.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with_present, present};
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe {
            object_with_present(env, &[
                present(env, c"deviations", Some(val.deviations))?,
                present(env, c"slots", Some(val.slots))?,
                present(env, c"separators", Some(val.separators))?,
            ])
        }
    }
}

#[cfg(feature = "napi-bindings")]
impl<T: ::napi::bindgen_prelude::ToNapiValue> ::napi::bindgen_prelude::ToNapiValue for NodeLayout<T> {
    /// `{ trivia?, at?, span?, units?, slots?, separator? }`, each only when present: what a read writes.
    /// The edges never cross back.
    unsafe fn to_napi_value(env: ::napi::sys::napi_env, val: Self) -> ::napi::Result<::napi::sys::napi_value> {
        use crate::boundary::{object_with_present, present, present_with};
        // SAFETY: napi calls `to_napi_value` with a live `env`, and every value encoded here is created in it.
        unsafe {
            object_with_present(env, &[
                present(env, c"trivia", val.trivia)?,
                present_with(c"at", val.at, |at| crate::slot::coordinate_to_napi(env, &at))?,
                present(env, c"span", val.span)?,
                present(env, c"units", (!val.units.is_empty()).then_some(val.units))?,
                present(env, c"slots", (!val.slots.is_empty()).then_some(val.slots))?,
                present(env, c"separator", val.separator)?,
            ])
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::spacing::SeamStrength;
    use crate::types::KindId;
    use super::{NodeLayout, TriviaRole};
    use crate::render::{Render, RenderResult, RenderSink};
    use crate::slot::SlotValue;
    use crate::trivia::{NodeTrivia, TriviaEntry};

    /// A trivia entry that writes its text and then its after edge, as a
    /// comment kind's template does: a line comment's edge breaks the line,
    /// a block comment's is a space. `"\n"` and `" "` are layout entries, a
    /// line break and a space. The render protocol is under test, not any
    /// grammar's comment template.
    #[derive(Debug, Clone, PartialEq)]
    struct MockTrivia(String);

    crate::refuse_napi_codec!(MockTrivia);

    impl crate::trivia::TriviaSeam for MockTrivia {
        fn seam_gap(&self) -> Option<(crate::layout_kinds::LayoutKinds, Option<&str>)> {
            match self.0.as_str() {
                "\n" => Some((crate::layout_kinds::LayoutKinds::NEWLINE, None)),
                " " => Some((crate::layout_kinds::LayoutKinds::SPACE, None)),
                _ => None,
            }
        }
    }

    impl crate::prepare::Prepare for MockTrivia {
        fn prepare(&mut self, _: &crate::prepare::RenderContext<'_>) -> Result<(), crate::render::CoordinateError> {
            Ok(())
        }
    }

    impl Render for MockTrivia {
        fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
            w.text(&self.0)?;
            if self.0.starts_with("/*") {
                w.seam(crate::layout_kinds::LayoutKinds::SPACE);
            } else {
                w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
                w.hold_line_end(crate::render::LineHold::Terminated);
            }
            Ok(())
        }
    }

    struct MockNode {
        text: &'static str,
        layout: Option<Box<NodeLayout<MockTrivia>>>,
    }

    impl Render for MockNode {
        fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
            NodeLayout::render(self.layout.as_deref(), Some(crate::types::KindId(9)), TriviaRole::Owner, w, |w| {
                w.text(self.text)
            })
        }
    }

    fn entry(text: &str) -> TriviaEntry<MockTrivia> {
        TriviaEntry::new(SlotValue::Node(MockTrivia(text.to_string())))
    }

    /// Leading entries each on its own line: a line break after each, as the
    /// table lays them out, unless the entry's span ends its line.
    fn leading(texts: &[&str]) -> Vec<TriviaEntry<MockTrivia>> {
        texts.iter().flat_map(|t| std::iter::once(entry(t)).chain((!t.ends_with('\n')).then(|| entry("\n")))).collect()
    }

    /// Trailing entries on the owner's line (`same_line`), or each on a line
    /// of its own, after a line break.
    fn trailing(texts: &[&str], same_line: bool) -> Vec<TriviaEntry<MockTrivia>> {
        texts.iter().flat_map(|t| (!same_line).then(|| entry("\n")).into_iter().chain(std::iter::once(entry(t)))).collect()
    }

    fn owner(text: &'static str, leading_texts: &[&str], trailing_texts: &[&str], same_line: bool) -> MockNode {
        MockNode {
            text,
            layout: Some(Box::new(NodeLayout {
                trivia: Some(NodeTrivia { leading: Some(leading(leading_texts)), trailing: Some(trailing(trailing_texts, same_line)), inner: None }),
                ..Default::default()
            })),
        }
    }

    fn bare(text: &'static str) -> MockNode {
        MockNode { text, layout: None }
    }

    fn render_with(f: impl FnOnce(&mut dyn RenderSink) -> RenderResult) -> String {
        let mut s = String::new();
        let mut w = crate::spacing::SpacingWriter::new(&mut s, crate::spacing::WordMatcher::default_ident());
        f(&mut w).unwrap();
        w.finish().unwrap();
        s
    }

    fn render(t: &MockNode) -> String {
        render_with(|w| t.render(w))
    }

    #[test]
    fn a_coordinate_renders_between_its_sides_as_a_node_does() {
        struct Sources(std::sync::Arc<str>);
        impl crate::render::SourceTable for Sources {
            fn source_of(&self, tree_id: crate::types::TreeId) -> Option<&std::sync::Arc<str>> {
                (tree_id == crate::types::TreeId(1)).then_some(&self.0)
            }
            fn sides(&self, _: &crate::slot::NodeCoordinate) -> Option<Box<dyn crate::trivia::FramedTrivia>> {
                Some(Box::new(NodeTrivia { leading: Some(leading(&["// top"])), trailing: Some(trailing(&["// bottom"], false)), inner: None }))
            }
        }
        let sources = Sources(std::sync::Arc::from("CONTENT"));
        let framed: SlotValue<MockTrivia> = SlotValue::Coord(crate::slot::NodeCoordinate::new(crate::types::TreeId(1), crate::types::NodeIndex(0), crate::types::NodeIndex(1), crate::types::Span { start: 0, end: 7 }));
        let mut out = String::new();
        let mut w = crate::spacing::SpacingWriter::new(&mut out, crate::spacing::WordMatcher::default_ident()).with_sources(&sources);
        framed.render(&mut w).unwrap();
        w.finish().unwrap();
        assert_eq!(out, render(&owner("CONTENT", &["// top"], &["// bottom"], false)));
    }

    #[test]
    fn a_trailing_side_of_whitespace_alone_holds_its_gap_against_a_template_break() {
        let owner = MockNode {
            text: "x;",
            layout: Some(Box::new(NodeLayout { trivia: Some(NodeTrivia { leading: None, trailing: Some(vec![entry(" ")]), inner: None }), ..Default::default() })),
        };
        let out = render_with(|w| {
            owner.render(w)?;
            w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
            w.text("}")
        });
        assert_eq!(out, "x; }");
    }

    #[test]
    fn a_node_with_no_layout_renders_its_body() {
        assert_eq!(render(&bare("CONTENT")), "CONTENT");
    }

    #[test]
    fn a_stamped_edge_of_a_kind_with_no_edge_site_is_written_around_the_node() {
        use crate::options::{EdgeArm, Edges};
        const TIGHT: KindId = KindId(1);
        const SPACE: KindId = KindId(2);
        fn text_of(kind: KindId) -> &'static str {
            if kind == SPACE {
                " "
            } else {
                ""
            }
        }
        const TABLE: crate::render::WhitespaceTable = crate::render::WhitespaceTable { text_of, indent: KindId(0), dedent: KindId(0) , leaf_edges: &[], gaps: &[(1, KindId(1)), (2, KindId(2))]};
        let tight = Some(EdgeArm { arm: TIGHT, strength: Some(SeamStrength::Trivia) });
        let edged = |text, edges| MockNode {
            text,
            layout: Some(Box::new(NodeLayout { edges: Some(edges), ..Default::default() })),
        };
        let first = edged("a", Edges { before: None, after: tight });
        let second = edged("b", Edges { before: tight, after: None });
        let mut out = String::new();
        let mut w = crate::spacing::SpacingWriter::new(&mut out, crate::spacing::WordMatcher::default_ident()).with_table(&TABLE);
        first.render(&mut w).unwrap();
        w.site_with(SPACE, SeamStrength::Declared);
        w.text(",").unwrap();
        w.site_with(SPACE, SeamStrength::Declared);
        second.render(&mut w).unwrap();
        w.finish().unwrap();
        assert_eq!(out, "a,b");
    }

    #[test]
    fn leading_entries_render_before_the_node() {
        assert_eq!(render(&owner("CONTENT", &["// hello"], &[], false)), "// hello\nCONTENT");
    }

    #[test]
    fn trailing_entries_render_after_the_node() {
        assert_eq!(render(&owner("CONTENT", &[], &["// end"], false)), "CONTENT\n// end\n");
    }

    #[test]
    fn leading_and_trailing_entries_surround_the_node() {
        assert_eq!(
            render(&owner("CONTENT", &["// top"], &["// bottom"], false)),
            "// top\nCONTENT\n// bottom\n"
        );
    }

    #[test]
    fn several_leading_entries_each_take_a_line() {
        assert_eq!(
            render(&owner("CONTENT", &["// line 1", "// line 2"], &[], false)),
            "// line 1\n// line 2\nCONTENT"
        );
    }

    #[test]
    fn several_trailing_entries_each_take_a_line() {
        assert_eq!(
            render(&owner("CONTENT", &[], &["// end 1", "// end 2"], false)),
            "CONTENT\n// end 1\n// end 2\n"
        );
    }

    #[test]
    fn empty_trivia_renders_the_body_alone() {
        assert_eq!(render(&owner("CONTENT", &[], &[], false)), "CONTENT");
    }

    #[test]
    fn a_same_line_line_comment_keeps_one_line_break_before_the_seam_that_follows() {
        let statement = owner("a;", &[], &["// note"], true);
        let text = render_with(|w| {
            statement.render(w)?;
            w.seam(crate::layout_kinds::LayoutKinds::NEWLINE);
            w.text("}")
        });
        assert_eq!(text, "a; // note\n}");
    }

    #[test]
    fn a_same_line_trailing_entry_seats_right_after_its_owner() {
        let two = owner("2", &[], &["# two"], true);
        let text = render_with(|w| {
            w.text("{")?;
            two.render(w)?;
            w.text("}")
        });
        assert_eq!(text, "{2 # two\n}");
    }

    #[test]
    fn a_line_comment_whose_span_ends_its_line_breaks_once() {
        assert_eq!(
            render(&owner("CONTENT", &["//! a\n", "//! b\n"], &[], false)),
            "//! a\n//! b\nCONTENT"
        );
    }

    #[test]
    fn a_standalone_render_keeps_a_line_comment_break_and_drops_a_block_comment_space() {
        assert_eq!(render(&owner("a;", &[], &["// end"], true)), "a; // end\n");
        assert_eq!(render(&owner("a;", &[], &["/* end */"], true)), "a; /* end */");
    }

    /// What a render body reads from its node's layout, through the one
    /// trait a record's side record will answer too.
    #[test]
    fn a_body_reads_edges_slot_tokens_and_units_through_its_layout() {
        use super::{BodyLayout, SlotLayout};
        use crate::options::{EdgeArm, Edges};

        let none: Option<&NodeLayout<MockTrivia>> = None;
        assert_eq!(none.edges(), Edges::NONE);
        assert_eq!(none.slot_tokens("_items"), []);
        assert!(none.list_units("_items").is_none());
        let mut out = String::new();
        let mut w = crate::spacing::SpacingWriter::new(&mut out, crate::spacing::WordMatcher::default_ident());
        none.render_unit("_items", crate::types::ItemIndex(0), &mut w, |w| w.text("x")).unwrap();
        w.finish().unwrap();
        assert_eq!(out, "x");

        let edges = Edges { before: Some(EdgeArm { arm: KindId(3), strength: None }), after: None };
        let layout = NodeLayout::<MockTrivia> {
            edges: Some(edges),
            slots: vec![SlotLayout { slot: "_items".into(), tokens: vec![None, Some(KindId(7))], ..SlotLayout::default() }],
            ..NodeLayout::default()
        };
        let some = Some(&layout);
        assert_eq!(some.edges(), edges);
        assert_eq!(some.slot_tokens("_items"), &[None, Some(KindId(7))]);
        assert_eq!(some.slot_tokens("_other"), []);
        assert_eq!(some.list_units("_items").map(|(slot, _)| slot), Some("_items"));
    }

    #[test]
    fn a_body_reads_inner_trivia_through_its_layout() {
        use super::BodyLayout;

        let none: Option<&NodeLayout<MockTrivia>> = None;
        assert!(!none.has_inner());
        let layout = NodeLayout::<MockTrivia> {
            trivia: Some(NodeTrivia { inner: Some(vec![entry("/* a */")]), ..NodeTrivia::default() }),
            ..NodeLayout::default()
        };
        assert!(Some(&layout).has_inner());
        let written = |render: &dyn Fn(&mut dyn RenderSink) -> RenderResult| {
            let mut out = String::new();
            let mut w = crate::spacing::SpacingWriter::new(&mut out, crate::spacing::WordMatcher::default_ident());
            render(&mut w).unwrap();
            w.finish().unwrap();
            out
        };
        assert_eq!(written(&|w| none.render_inner(w)), "");
        let through_trait = written(&|w| Some(&layout).render_inner(w));
        assert!(through_trait.starts_with("/* a */"));
        assert_eq!(through_trait, written(&|w| crate::trivia::render_inner(layout.trivia.as_ref(), w)));
    }
}
