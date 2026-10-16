//! The walk a render makes over every slot before writing a byte: it checks
//! each coordinate against the tree it names, gives each list slot's gaps
//! the layout its source stores, and fills every unset spacing and flank
//! field from the resolved options. The context is an argument at every level;
//! nothing ambient carries the trees or the table.

use crate::options::{EdgeArm, Edged, Edges, ResolvedOptions, Side};
use crate::types::{KindId, SiteId};
use crate::render::{CoordinateError, SourceTable};
use crate::slot::{NodeCoordinate, SeamArm, SlotValue};

/// Everything a render reads that is not the transport itself.
pub struct RenderContext<'a> {
    pub options: &'a ResolvedOptions,
    pub sources: &'a dyn SourceTable,
    /// Where a recording render writes the line breaks it writes at each
    /// gap (`SpacingWriter::with_recording`); `None` on any other render.
    pub recording: Option<&'a std::cell::RefCell<crate::baseline::Baseline>>,
}

/// Fill a transport's unset base edges from its kind's edge row; an edge the wire already set keeps its arm.
pub fn prepare_edges<T: Edged + ?Sized>(t: &mut T, ctx: &RenderContext<'_>) {
    let kind = t.kind_id();
    let (before_arm, after_arm) = t.edge_arm_kinds(ctx);
    let edges = t.edges_mut();
    if edges.before.is_none() {
        edges.before = ctx.options.edge_arm(kind, Side::Before, None, before_arm).map(EdgeArm::from);
    }
    if edges.after.is_none() {
        edges.after = ctx.options.edge_arm(kind, Side::After, None, after_arm).map(EdgeArm::from);
    }
}

/// A slot that holds the token an edge's arm is chosen by: the arm among
/// `arms` the value is (a built value by its kind, a coordinate by the kind of
/// the node it names), or `None` when it holds none of them.
pub trait ArmOf {
    fn arm_among(&self, ctx: &RenderContext<'_>, arms: &[crate::options::ArmSite]) -> Option<KindId>;
}

impl<T: crate::view::KindOf, const ADJACENT: bool> ArmOf for SlotValue<T, ADJACENT> {
    fn arm_among(&self, ctx: &RenderContext<'_>, arms: &[crate::options::ArmSite]) -> Option<KindId> {
        match self {
            SlotValue::Coord(coord) => coord.kind_in(ctx.sources).filter(|kind| arms.iter().any(|a| a.arm == *kind)),
            SlotValue::Transport(t) => arms.iter().map(|a| a.arm).find(|kind| t.kind_in(&[*kind])),
        }
    }
}

impl<X: ArmOf> ArmOf for Option<X> {
    fn arm_among(&self, ctx: &RenderContext<'_>, arms: &[crate::options::ArmSite]) -> Option<KindId> {
        self.as_ref().and_then(|slot| slot.arm_among(ctx, arms))
    }
}

/// A rebuilt list's delimiter flags with its trailing flag as the list it
/// was rebuilt from (`TransportLayout::sides`) spells it, as a read list's
/// are its own: the trailing flag (2) is set iff that list's last child that
/// is not an extra is one of its `separators` (`SourceTable::last_list_child_kind`,
/// the list's own kind being `kind`). A list rebuilt from none, or a table
/// that cannot answer, takes `default`, the options table's. The leading
/// flag is always `default`'s.
pub fn source_trailing_delimiter<T>(layout: Option<&crate::layout::TransportLayout<T>>, kind: KindId, separators: &[KindId], default: u8, ctx: &RenderContext<'_>) -> u8 {
    let Some(source) = layout.and_then(|layout| layout.sides.as_ref()) else { return default };
    let Some(last) = ctx.sources.last_list_child_kind(source.tree, source.span, kind) else { return default };
    (default & !2) | if separators.contains(&last) { 2 } else { 0 }
}

/// The item at one end of a root's render, as the root's edge reads it: a
/// coordinate into its source, framed by its sides (`SourceTable::framed_span`),
/// bytes of a source (a root's inner entries read from its tree), a snapshot
/// node's geometry, or an item that was rebuilt and gives the edge nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EdgeItem<'a> {
    Coord(&'a crate::NodeCoordinate),
    Bytes { tree: crate::types::TreeId, span: crate::types::Span },
    Snapshot(SnapshotEdge),
    Rebuilt,
}

/// A child position of a root transport, read for the item at either end of
/// the render: `None` when the position holds nothing, otherwise the item
/// (`EdgeItem`).
pub trait EdgeItems {
    fn first_item(&self) -> Option<EdgeItem<'_>>;
    fn last_item(&self) -> Option<EdgeItem<'_>>;
}

impl<T: Prepare, const ADJACENT: bool> EdgeItems for SlotValue<T, ADJACENT> {
    fn first_item(&self) -> Option<EdgeItem<'_>> {
        Some(edge_item(self))
    }
    fn last_item(&self) -> Option<EdgeItem<'_>> {
        Some(edge_item(self))
    }
}

fn edge_item<T: Prepare, const ADJACENT: bool>(value: &SlotValue<T, ADJACENT>) -> EdgeItem<'_> {
    match value.coord() {
        Some(coord) => EdgeItem::Coord(coord),
        None => value.snapshot_edge().map_or(EdgeItem::Rebuilt, EdgeItem::Snapshot),
    }
}

impl<X: EdgeItems> EdgeItems for Option<X> {
    fn first_item(&self) -> Option<EdgeItem<'_>> {
        self.as_ref().and_then(X::first_item)
    }
    fn last_item(&self) -> Option<EdgeItem<'_>> {
        self.as_ref().and_then(X::last_item)
    }
}

/// The first edge item of a list: its first item that has one.
fn first_edge_item<X: EdgeItems>(items: &[X]) -> Option<EdgeItem<'_>> {
    items.iter().find_map(X::first_item)
}

/// The last edge item of a list: its last item that has one.
fn last_edge_item<X: EdgeItems>(items: &[X]) -> Option<EdgeItem<'_>> {
    items.iter().rev().find_map(X::last_item)
}

impl<X: EdgeItems> EdgeItems for Vec<X> {
    fn first_item(&self) -> Option<EdgeItem<'_>> {
        first_edge_item(self)
    }
    fn last_item(&self) -> Option<EdgeItem<'_>> {
        last_edge_item(self)
    }
}

impl<X: EdgeItems> EdgeItems for crate::NonEmptyVec<X> {
    fn first_item(&self) -> Option<EdgeItem<'_>> {
        first_edge_item(self)
    }
    fn last_item(&self) -> Option<EdgeItem<'_>> {
        last_edge_item(self)
    }
}

/// The item at one end of a root once its own trivia is counted: the end item
/// of its children, or its inner trivia (`Layout::inner_item`) when that
/// lies beyond it on `side` or the root has no children.
pub fn outermost<'a>(item: Option<EdgeItem<'a>>, inner: Option<EdgeItem<'a>>, side: Side) -> Option<EdgeItem<'a>> {
    match (item, inner) {
        (None, inner) => inner,
        (Some(EdgeItem::Snapshot(edge)), Some(EdgeItem::Snapshot(own))) => {
            let beyond = match side {
                Side::Before => own.span.start < edge.span.start,
                Side::After => own.span.end > edge.span.end,
            };
            Some(EdgeItem::Snapshot(if beyond { own } else { edge }))
        }
        (item, _) => item,
    }
}

/// A root transport's edges read from its tree's own flanks: the bytes
/// before its first item and after its last, when that item is still a
/// coordinate (framed by its sides) or its inner entries' source bytes,
/// classified into the arm the edge site admits exactly as a
/// list gap is. A snapshot root reads the same gaps from geometry: from its
/// own start (`root`) to where its first item's render begins, leading trivia
/// included, and from where its last item's render ends to the root's end.
/// An edge item that was rebuilt, bytes that are not whitespace, or unplaced
/// trivia on that side leave that side unset for the options and the grammar
/// default.
pub fn root_flanks(
    first: Option<EdgeItem<'_>>,
    last: Option<EdgeItem<'_>>,
    root: Option<crate::points::PointSpan>,
    allowed_before: &[KindId],
    allowed_after: &[KindId],
    table: &crate::render::WhitespaceTable,
    ctx: &RenderContext<'_>,
) -> Edges {
    let flank = |item: Option<EdgeItem<'_>>, side: Side, allowed: &[KindId]| {
        let source_bytes = |tree: crate::types::TreeId, span: crate::types::Span| {
            let source = ctx.sources.source_of(tree)?;
            let bytes = match side {
                Side::Before => source.get(..span.start as usize)?,
                Side::After => source.get(span.end as usize..)?,
            };
            Some(std::borrow::Cow::Borrowed(bytes))
        };
        let text = match item? {
            EdgeItem::Coord(coord) => source_bytes(coord.tree, ctx.sources.framed_span(coord))?,
            EdgeItem::Bytes { tree, span } => source_bytes(tree, span)?,
            EdgeItem::Snapshot(edge) => {
                let root = root?;
                let outer = edge.outer(side)?;
                let gap = match side {
                    Side::Before => crate::classify::geometry_gap_text(&crate::points::PointSpan::at(root.start), &outer),
                    Side::After => crate::classify::geometry_gap_text(&outer, &crate::points::PointSpan::at(root.end)),
                };
                std::borrow::Cow::Owned(gap)
            }
            EdgeItem::Rebuilt => return None,
        };
        crate::classify::classify_whitespace(&text, allowed, table).map(|arm| EdgeArm { arm, strength: None, dedent: None })
    };
    Edges {
        before: flank(first, Side::Before, allowed_before),
        after: flank(last, Side::After, allowed_after),
    }
}

/// Fill a transport's unset base edges from `edges`; a side the wire already
/// set keeps its arm.
pub fn fill_edges<T: Edged + ?Sized>(t: &mut T, edges: Edges) {
    let own = t.edges_mut();
    own.before = own.before.or(edges.before);
    own.after = own.after.or(edges.after);
}

/// The element a seated sibling gap belongs to: the node itself when its kind
/// has a seat in `table`, or, for a wrapper that is not itself seated, the
/// seated node it holds. Answers the base edges to fill and the site to read.
pub trait SeatTarget {
    fn seat_target(&mut self, table: &[Option<SiteId>], ctx: &RenderContext<'_>) -> Option<(&mut Edges, SiteId)>;
}

impl<T: SeatTarget + ?Sized> SeatTarget for Box<T> {
    fn seat_target(&mut self, table: &[Option<SiteId>], ctx: &RenderContext<'_>) -> Option<(&mut Edges, SiteId)> {
        (**self).seat_target(table, ctx)
    }
}

/// The seated site in `table` of the node a coordinate names: its own
/// kind's, else that of the node it holds through the wrappers it is
/// (`SourceTable::seat_through`), as a wrapper transport seats through its
/// content.
pub fn coord_seat(coord: &crate::slot::NodeCoordinate, table: &[Option<SiteId>], ctx: &RenderContext<'_>) -> Option<SiteId> {
    let seat = |kind| seat_site(table, kind);
    coord.kind_in(ctx.sources).and_then(seat).or_else(|| ctx.sources.seat_through(coord, ctx.options.seat_wrappers, &seat))
}

/// The seated site of `kind` in a per-slot table indexed by kind id.
pub fn seat_site(table: &[Option<SiteId>], kind: KindId) -> Option<SiteId> {
    table.get(kind.index()).copied().flatten()
}

/// Give every gap between two present items of a list slot the classes its
/// stored layout holds (`layout::SlotLayout`): the side before the
/// separator onto the earlier item's `after` edge, the side after it onto
/// the later item's `before` edge, at slot strength (`SEAM_SLOT`), so no
/// option replaces them and a gap's own layout entry does. An edge already
/// set keeps its arm. An absent item renders nothing, so it neither takes a
/// gap nor parts two.
pub fn fill_slot_gaps<'i, T: Prepare + 'i, const ADJACENT: bool>(
    items: impl Iterator<Item = Option<&'i mut SlotValue<T, ADJACENT>>>,
    slot: Option<&crate::layout::SlotLayout>,
) {
    let Some(slot) = slot.filter(|slot| slot.before.is_some() || slot.after.is_some()) else { return };
    let mut present: Vec<&'i mut SlotValue<T, ADJACENT>> = items.flatten().collect();
    for index in 1..present.len() {
        if let Some(arm) = slot.before {
            set_gap_edge(present[index - 1], Side::After, arm);
        }
        if let Some(arm) = slot.after {
            set_gap_edge(present[index], Side::Before, arm);
        }
    }
}

/// Give a list slot each item's own separator where its source spells
/// another than the slot's (`Prepare::source_separator`), as the candidate
/// kind `kind_of` maps it to (the list's `separator_kind_of`), on the slot's
/// entry by the item's place (`layout::SlotLayout::tokens`). The first item
/// has no separator before it; nothing is stored when no item has one.
pub fn fill_slot_separators<'i, T: Prepare + 'i, L, const ADJACENT: bool>(
    layout: &mut Option<Box<crate::layout::TransportLayout<L>>>,
    slot: &str,
    items: impl Iterator<Item = Option<&'i SlotValue<T, ADJACENT>>>,
    kind_of: fn(KindId) -> Option<KindId>,
    ctx: &RenderContext<'_>,
) {
    let tokens: Vec<Option<KindId>> = items.enumerate().map(|(at, item)| item.filter(|_| at > 0)?.source_separator(ctx).and_then(kind_of)).collect();
    if tokens.iter().any(Option::is_some) {
        crate::layout::slot_entry(layout, slot).tokens = tokens;
    }
}

fn set_gap_edge<T: Prepare, const ADJACENT: bool>(item: &mut SlotValue<T, ADJACENT>, side: Side, arm: KindId) {
    let seam = SeamArm { arm, strength: crate::spacing::SEAM_SLOT, dedent: false };
    match item {
        SlotValue::Coord(coord) => {
            let edges = coord.edges.get_or_insert(crate::slot::CoordinateEdges { before: None, after: None });
            match side {
                Side::Before => edges.before.get_or_insert(seam),
                Side::After => edges.after.get_or_insert(seam),
            };
        }
        SlotValue::Transport(t) => {
            if let Some(edges) = t.gap_edges() {
                match side {
                    Side::Before => edges.before.get_or_insert(EdgeArm::from(seam)),
                    Side::After => edges.after.get_or_insert(EdgeArm::from(seam)),
                };
            }
        }
    }
}

/// Fill the gap after every present element but the last present one from
/// the slot's seat table: a seated element's base `after` edge takes its
/// seat's resolved arm and strength unless something already set it, the wire
/// or the slot's stored layout (`fill_slot_gaps`, which runs first). An absent
/// element renders nothing, so it neither takes a gap nor counts as the
/// sibling that makes the gap before it.
pub fn fill_seated_gaps<'i, T: SeatTarget + 'i, const ADJACENT: bool>(
    items: impl Iterator<Item = Option<&'i mut SlotValue<T, ADJACENT>>>,
    table: &[Option<SiteId>],
    ctx: &RenderContext<'_>,
) {
    let present: Vec<&'i mut SlotValue<T, ADJACENT>> = items.flatten().collect();
    let last = present.len().saturating_sub(1);
    for item in present.into_iter().take(last) {
        match item {
            SlotValue::Transport(t) => {
                if let Some((edges, site)) = t.seat_target(table, ctx) {
                    edges.after.get_or_insert(EdgeArm::from(ctx.options.site_arm(site)));
                }
            }
            SlotValue::Coord(coord) => {
                if let Some(site) = coord_seat(coord, table, ctx) {
                    let edges = coord.edges.get_or_insert(crate::slot::CoordinateEdges { before: None, after: None });
                    edges.after.get_or_insert(ctx.options.site_arm(site));
                }
            }
        }
    }
}

/// Where a snapshot item lies and how far trivia leads or trails it: what a
/// root's edges and a list's gaps read in place of source bytes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SnapshotEdge {
    pub span: crate::points::PointSpan,
    pub leading: TriviaReach,
    pub trailing: TriviaReach,
}

/// How far a snapshot item's trivia on one side reaches beyond the item.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TriviaReach {
    /// No trivia on that side.
    Bare,
    /// Trivia whose outer end (the first leading entry's start, the last
    /// trailing entry's end) lies at this point.
    To(crate::points::Point),
    /// Trivia whose outer entry has no geometry: it was written, not read.
    Unplaced,
}

impl SnapshotEdge {
    /// What a gap on `side` is measured from: the item's own span when no
    /// trivia lies on that side, the point its trivia reaches otherwise, and
    /// `None` when that trivia is unplaced.
    fn outer(&self, side: Side) -> Option<crate::points::PointSpan> {
        match if side == Side::Before { self.leading } else { self.trailing } {
            TriviaReach::Bare => Some(self.span),
            TriviaReach::To(point) => Some(crate::points::PointSpan::at(point)),
            TriviaReach::Unplaced => None,
        }
    }
}

pub trait Prepare {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>;

    /// Where this value lies, when it is a snapshot node (`TransportLayout::span`).
    fn snapshot_edge(&self) -> Option<SnapshotEdge> {
        None
    }

    /// The base edges a list gap beside this value is written on: its own.
    fn gap_edges(&mut self) -> Option<&mut Edges> {
        None
    }

    /// The separator this value's source spells before it as a list item,
    /// as a grammar id, where it is not the one its slot renders
    /// (`layout::source_separator`).
    fn source_separator(&self, ctx: &RenderContext<'_>) -> Option<KindId> {
        let _ = ctx;
        None
    }

    /// The node at descendant `index` of `tree` read one level into this
    /// type (`read::read_coordinate`), when the type reads; `None` for a
    /// value no read produces.
    fn read_coordinate(tree: &tree_sitter::Tree, ctx: &crate::read::ReadCtx<'_>, index: u32) -> Option<Result<Self, crate::read::ReadError>>
    where
        Self: Sized,
    {
        let _ = (tree, ctx, index);
        None
    }
}

impl<T: Prepare, const ADJACENT: bool> Prepare for SlotValue<T, ADJACENT> {
    /// A coordinate is checked here and its slice discarded: the render is
    /// refused before a byte is written rather than part way through, and
    /// the sink re-resolves at write time against the same table. A
    /// coordinate whose range holds a write is read one level into its
    /// transport (`read_coordinate`), which renders from its template, and
    /// prepared as one. Otherwise it takes its kind's edges: its stamped
    /// kind's, or, for a display kind with no edge row of its own, its
    /// grammar kind's, the kind its transport renders by.
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        match self {
            SlotValue::Coord(coord) => {
                coord.resolve(ctx.sources)?;
                if let Some(mut transport) = read_edited::<T>(coord, ctx)? {
                    if let (Some(seated), Some(edges)) = (coord.edges, transport.gap_edges()) {
                        if seated.before.is_some() {
                            edges.before = seated.before.map(EdgeArm::from);
                        }
                        if seated.after.is_some() {
                            edges.after = seated.after.map(EdgeArm::from);
                        }
                    }
                    transport.prepare(ctx)?;
                    *self = SlotValue::Transport(transport);
                    return Ok(());
                }
                let seated = coord.edges;
                coord.edges = [coord.kind, ctx.sources.kind_of(coord)].into_iter().flatten().find_map(|kind| ctx.options.edge_arms(kind));
                if let Some(seated) = seated {
                    let edges = coord.edges.get_or_insert(crate::slot::CoordinateEdges { before: None, after: None });
                    if seated.before.is_some() {
                        edges.before = seated.before;
                    }
                    if seated.after.is_some() {
                        edges.after = seated.after;
                    }
                }
                Ok(())
            }
            SlotValue::Transport(t) => t.prepare(ctx),
        }
    }

    fn snapshot_edge(&self) -> Option<SnapshotEdge> {
        match self {
            SlotValue::Transport(t) => t.snapshot_edge(),
            SlotValue::Coord(_) => None,
        }
    }

    /// A coordinate's is its source's, while its neighbour before is still
    /// its source's.
    fn source_separator(&self, ctx: &RenderContext<'_>) -> Option<KindId> {
        match self {
            SlotValue::Transport(t) => t.source_separator(ctx),
            SlotValue::Coord(coord) if coord.writes.as_ref().is_some_and(|writes| writes.changed.leading) => None,
            SlotValue::Coord(coord) => ctx.sources.separator_before(coord),
        }
    }
}

/// The node a coordinate names, read one level into `T` when a write lies in
/// its range (`SourceTable::edited_within`), its changed edges carried into
/// the read (`ReadCtx::with_changed`); `None` when no write lies there, or
/// when `T` reads nothing.
fn read_edited<T: Prepare>(coord: &NodeCoordinate, ctx: &RenderContext<'_>) -> Result<Option<T>, CoordinateError> {
    if !ctx.sources.edited_within(coord) {
        return Ok(None);
    }
    let Some((tree, read)) = ctx.sources.read_ctx(coord.tree) else { return Ok(None) };
    let read = read.with_changed(coord.index, coord.changed());
    match T::read_coordinate(tree, &read, coord.index) {
        None => Ok(None),
        Some(Ok(transport)) => Ok(Some(transport)),
        Some(Err(error)) => Err(CoordinateError::Unread { handle: coord.handle(), detail: format!("{error:?}") }),
    }
}

/// Prepare every item of a list.
fn prepare_items<T: Prepare>(items: &mut [T], ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
    items.iter_mut().try_for_each(|item| item.prepare(ctx))
}

impl<T: Prepare> Prepare for Vec<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        prepare_items(self, ctx)
    }
}

impl<T: Prepare> Prepare for crate::NonEmptyVec<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        prepare_items(self, ctx)
    }
}

impl<T: Prepare> Prepare for Option<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        match self {
            Some(item) => item.prepare(ctx),
            None => Ok(()),
        }
    }

    fn snapshot_edge(&self) -> Option<SnapshotEdge> {
        self.as_ref()?.snapshot_edge()
    }

    fn gap_edges(&mut self) -> Option<&mut Edges> {
        self.as_mut()?.gap_edges()
    }

    fn source_separator(&self, ctx: &RenderContext<'_>) -> Option<KindId> {
        self.as_ref()?.source_separator(ctx)
    }
}

impl<T: Prepare> Prepare for Box<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        (**self).prepare(ctx)
    }

    fn read_coordinate(tree: &tree_sitter::Tree, ctx: &crate::read::ReadCtx<'_>, index: u32) -> Option<Result<Self, crate::read::ReadError>> {
        T::read_coordinate(tree, ctx, index).map(|read| read.map(Box::new))
    }

    fn snapshot_edge(&self) -> Option<SnapshotEdge> {
        (**self).snapshot_edge()
    }

    fn gap_edges(&mut self) -> Option<&mut Edges> {
        (**self).gap_edges()
    }

    fn source_separator(&self, ctx: &RenderContext<'_>) -> Option<KindId> {
        (**self).source_separator(ctx)
    }
}

macro_rules! inert {
    ($($t:ty),*) => {$(
        impl Prepare for $t {
            fn prepare(&mut self, _: &RenderContext<'_>) -> Result<(), CoordinateError> { Ok(()) }
        }
    )*};
}
inert!(String, bool, u8, u16);

#[cfg(test)]
mod tests {
    use crate::types::KindId;
    use super::root_flanks;
    use crate::options::ResolvedOptions;
    use crate::render::{SourceTable, WhitespaceTable};
    use crate::RenderContext;
    use crate::slot::NodeCoordinate;
    use crate::types::Span;
    use std::collections::HashMap;
    use std::sync::Arc;

    struct Sources(HashMap<crate::types::TreeId, Arc<str>>);
    impl SourceTable for Sources {
        fn source_of(&self, tree_id: crate::types::TreeId) -> Option<&Arc<str>> {
            self.0.get(&tree_id)
        }
    }

    const TIGHT: KindId = KindId(0);
    const NEWLINE: KindId = KindId(1);

    fn text_of(arm: KindId) -> &'static str {
        if arm == NEWLINE {
            "\n"
        } else {
            ""
        }
    }

    const TABLE: WhitespaceTable = WhitespaceTable {
        text_of,
        indent: KindId(7),
        dedent: KindId(8), leaf_edges: &[], gaps: &[(8, KindId(1))]
    };

    fn coordinate(start: u32, end: u32) -> NodeCoordinate {
        NodeCoordinate::new(crate::types::TreeId(3), 0, 1, Span { start, end })
    }

    fn before_flank(first: &NodeCoordinate, source: &str) -> Option<KindId> {
        let sources = Sources(HashMap::from([(crate::types::TreeId(3), Arc::from(source))]));
        let options = ResolvedOptions::default();
        let ctx = RenderContext {
            options: &options,
            sources: &sources,
            recording: None,
        };
        root_flanks(Some(super::EdgeItem::Coord(first)), None, None, &[TIGHT, NEWLINE], &[TIGHT, NEWLINE], &TABLE, &ctx)
            .before
            .map(|edge| edge.arm)
    }

    #[test]
    fn a_tree_addressed_edge_item_gives_the_root_its_source_flank() {
        assert_eq!(before_flank(&coordinate(1, 4), "\n#!\n"), Some(NEWLINE));
    }

    const COMMA: KindId = KindId(9);
    const ITEM: KindId = KindId(4);

    /// A table that holds trees: the list a flank names ends in a child of kind `last`, or the table cannot answer.
    struct ListTrees(Option<KindId>);
    impl SourceTable for ListTrees {
        fn source_of(&self, _: crate::types::TreeId) -> Option<&Arc<str>> {
            None
        }
        fn last_list_child_kind(&self, _: crate::types::TreeId, _: Span, _: crate::types::KindId) -> Option<crate::types::KindId> {
            self.0
        }
    }

    /// The delimiter a list rebuilt from one whose source ends in a child of kind `last` (rebuilt from none when not `rebuilt`) takes over the options default `default`.
    fn trailing(last: Option<KindId>, rebuilt: bool, default: u8) -> u8 {
        let sources = ListTrees(last);
        let options = ResolvedOptions::default();
        let ctx = RenderContext { options: &options, sources: &sources, recording: None };
        let layout = crate::layout::TransportLayout::<String> { sides: rebuilt.then(|| coordinate(2, 7)), ..Default::default() };
        super::source_trailing_delimiter(Some(&layout), crate::types::KindId(1), &[COMMA], default, &ctx)
    }

    #[test]
    fn a_rebuilt_list_keeps_its_sources_trailing_separator() {
        assert_eq!(trailing(Some(COMMA), true, 0), 2);
    }

    #[test]
    fn a_rebuilt_list_whose_source_has_no_trailing_separator_clears_a_trailing_default() {
        assert_eq!(trailing(Some(ITEM), true, 2), 0);
    }

    #[test]
    fn a_list_rebuilt_from_none_or_a_table_with_no_tree_takes_the_options_default() {
        assert_eq!(trailing(Some(COMMA), false, 0), 0);
        assert_eq!(trailing(None, true, 2), 2);
    }

    #[test]
    fn the_leading_flag_always_comes_from_the_options_default() {
        assert_eq!(trailing(Some(COMMA), true, 1), 3);
        assert_eq!(trailing(Some(ITEM), true, 3), 1);
    }
}
