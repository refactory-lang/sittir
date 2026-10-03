//! The walk a render makes over every slot before writing a byte: it checks
//! each coordinate against the tree it names, classifies the gaps between
//! still-parsed list items, and fills every unset spacing and flank field
//! from the resolved options. The context is an argument at every level;
//! nothing ambient carries the trees or the table.

use crate::options::{EdgeArm, Edged, Edges, ResolvedOptions, Side};
use crate::types::KindId;
use crate::render::{CoordinateError, SourceTable};
use crate::slot::SlotValue;

/// Everything a render reads that is not the transport itself.
pub struct RenderContext<'a> {
    pub options: &'a ResolvedOptions,
    pub sources: &'a dyn SourceTable,
}

/// Fill a transport's unset base edges from its kind's edge row; an edge the wire already set keeps its arm.
pub fn prepare_edges<T: Edged + ?Sized>(t: &mut T, ctx: &RenderContext<'_>) {
    let kind = t.kind_id();
    let edges = t.edges_mut();
    if edges.before.is_none() {
        edges.before = ctx.options.edge_arm(kind, Side::Before, None).map(EdgeArm::from);
    }
    if edges.after.is_none() {
        edges.after = ctx.options.edge_arm(kind, Side::After, None).map(EdgeArm::from);
    }
}

/// A child position of a root transport, read for the item at either end of
/// the render: `None` when the position holds nothing, otherwise the item's
/// coordinate, itself `None` when the item was rebuilt.
pub trait EdgeItems {
    fn first_item(&self) -> Option<Option<&crate::NodeCoordinate>>;
    fn last_item(&self) -> Option<Option<&crate::NodeCoordinate>>;
}

impl<T, const ADJACENT: bool> EdgeItems for SlotValue<T, ADJACENT> {
    fn first_item(&self) -> Option<Option<&crate::NodeCoordinate>> {
        Some(self.coord())
    }
    fn last_item(&self) -> Option<Option<&crate::NodeCoordinate>> {
        Some(self.coord())
    }
}

impl<X: EdgeItems> EdgeItems for Option<X> {
    fn first_item(&self) -> Option<Option<&crate::NodeCoordinate>> {
        self.as_ref().and_then(X::first_item)
    }
    fn last_item(&self) -> Option<Option<&crate::NodeCoordinate>> {
        self.as_ref().and_then(X::last_item)
    }
}

impl<X: EdgeItems> EdgeItems for Vec<X> {
    fn first_item(&self) -> Option<Option<&crate::NodeCoordinate>> {
        self.iter().find_map(X::first_item)
    }
    fn last_item(&self) -> Option<Option<&crate::NodeCoordinate>> {
        self.iter().rev().find_map(X::last_item)
    }
}

/// A root transport's edges read from its tree's own flanks: the bytes
/// before its first item and after its last, when that item is still a
/// coordinate, classified into the arm the edge site admits exactly as a
/// list gap is. An edge item that was rebuilt, one whose coordinate addresses
/// its text only, or bytes that are not whitespace, leave that side unset for
/// the options and the grammar default.
pub fn root_flanks(
    first: Option<Option<&crate::NodeCoordinate>>,
    last: Option<Option<&crate::NodeCoordinate>>,
    allowed_before: &[u16],
    allowed_after: &[u16],
    table: &crate::render::WhitespaceTable,
    ctx: &RenderContext<'_>,
) -> Edges {
    let flank = |coord: Option<&crate::NodeCoordinate>, side: Side, allowed: &[u16]| {
        let coord = coord.filter(|coord| coord.is_layout_evidence())?;
        let source = ctx.sources.source_of(coord.tree_id())?;
        let bytes = match side {
            Side::Before => source.get(..coord.span.start as usize)?,
            Side::After => source.get(coord.span.end as usize..)?,
        };
        crate::classify::classify_whitespace(bytes, allowed, table).map(|arm| EdgeArm { arm, strength: None })
    };
    Edges {
        before: flank(first.flatten(), Side::Before, allowed_before),
        after: flank(last.flatten(), Side::After, allowed_after),
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
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut Edges, usize)>;
}

impl<T: SeatTarget + ?Sized> SeatTarget for Box<T> {
    fn seat_target(&mut self, table: &[u16]) -> Option<(&mut Edges, usize)> {
        (**self).seat_target(table)
    }
}

/// The seated site of `kind` in a per-slot table indexed by kind id.
pub fn seat_site(table: &[u16], kind: KindId) -> Option<usize> {
    match table.get(kind.0 as usize) {
        Some(&site) if site != crate::options::NO_SITE => Some(site as usize),
        _ => None,
    }
}

/// Fill the gap after every present element but the last present one from
/// the slot's seat table: a seated element's base `after` edge takes its
/// seat's resolved arm and strength unless the wire already set it. A
/// coordinate takes its seat the same way, except when the element after it
/// is a coordinate and `separated` marks the pair's source gap as classified
/// into the slot's own site: that gap is the source's. An absent element
/// renders nothing, so it neither takes a gap nor counts as the sibling that
/// makes the gap before it.
pub fn fill_seated_gaps<'i, T: SeatTarget + 'i, const ADJACENT: bool>(
    items: impl Iterator<Item = Option<&'i mut SlotValue<T, ADJACENT>>>,
    table: &[u16],
    separated: &[bool],
    ctx: &RenderContext<'_>,
) {
    let present: Vec<(usize, &'i mut SlotValue<T, ADJACENT>)> =
        items.enumerate().filter_map(|(index, item)| item.map(|value| (index, value))).collect();
    let source_follows: Vec<bool> = present
        .windows(2)
        .map(|pair| pair[1].1.coord().is_some() && separated.get(pair[0].0).copied().unwrap_or(false))
        .collect();
    for ((_, item), source_follows) in present.into_iter().zip(source_follows) {
        match item {
            SlotValue::Transport(t) => {
                if let Some((edges, site)) = t.seat_target(table) {
                    edges.after.get_or_insert(EdgeArm::from(ctx.options.spacing[site]));
                }
            }
            SlotValue::Coord(coord) if !source_follows => {
                if let Some(site) = coord.kind_in(ctx.sources).and_then(|kind| seat_site(table, kind)) {
                    let edges = coord.edges.get_or_insert(crate::slot::CoordinateEdges { before: None, after: None });
                    edges.after.get_or_insert(ctx.options.spacing[site]);
                }
            }
            SlotValue::Coord(_) => {}
        }
    }
}

pub trait Prepare {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>;

    /// The whitespace run this value's leading trivia opens with: the gap it
    /// keeps toward the item before it. None for a coordinate, and for a
    /// value whose leading trivia is empty or opens with a comment.
    fn leading_seam(&self) -> Option<&str> {
        None
    }
}

impl<T: Prepare, const ADJACENT: bool> Prepare for SlotValue<T, ADJACENT> {
    /// A coordinate is checked here and its slice discarded: the render is
    /// refused before a byte is written rather than part way through, and
    /// the sink re-resolves at write time against the same table.
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        match self {
            SlotValue::Coord(coord) => {
                coord.resolve(ctx.sources)?;
                let seated = coord.edges.and_then(|edges| edges.after);
                coord.edges = coord.kind_in(ctx.sources).and_then(|kind| ctx.options.edge_arms(kind));
                if let Some(after) = seated {
                    coord.edges.get_or_insert(crate::slot::CoordinateEdges { before: None, after: None }).after = Some(after);
                }
                Ok(())
            }
            SlotValue::Transport(t) => t.prepare(ctx),
        }
    }

    fn leading_seam(&self) -> Option<&str> {
        match self {
            SlotValue::Transport(t) => t.leading_seam(),
            SlotValue::Coord(_) => None,
        }
    }
}

impl<T: Prepare> Prepare for Vec<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        self.iter_mut().try_for_each(|item| item.prepare(ctx))
    }
}

impl<T: Prepare> Prepare for Option<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        match self {
            Some(item) => item.prepare(ctx),
            None => Ok(()),
        }
    }

    fn leading_seam(&self) -> Option<&str> {
        self.as_ref()?.leading_seam()
    }
}

impl<T: Prepare + ?Sized> Prepare for Box<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        (**self).prepare(ctx)
    }

    fn leading_seam(&self) -> Option<&str> {
        (**self).leading_seam()
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
    use super::root_flanks;
    use crate::classify::classify_list_gaps;
    use crate::engine::encode_handle;
    use crate::options::ResolvedOptions;
    use crate::render::{SourceTable, WhitespaceTable};
    use crate::RenderContext;
    use crate::slot::NodeCoordinate;
    use crate::types::Span;
    use std::collections::HashMap;
    use std::sync::Arc;

    struct Sources(HashMap<u32, Arc<str>>);
    impl SourceTable for Sources {
        fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
            self.0.get(&tree_id)
        }
    }

    const TIGHT: u16 = 0;
    const NEWLINE: u16 = 1;

    fn text_of(arm: u16) -> &'static str {
        if arm == NEWLINE {
            "\n"
        } else {
            ""
        }
    }

    const TABLE: WhitespaceTable = WhitespaceTable {
        text_of,
        indent: 7,
        dedent: 8,
    };

    fn coordinate(start: u32, end: u32, text_only: bool) -> NodeCoordinate {
        NodeCoordinate {
            text_only,
            ..NodeCoordinate::new(encode_handle(3, 0), Span { start, end })
        }
    }

    fn before_flank(first: &NodeCoordinate, source: &str) -> Option<u16> {
        let sources = Sources(HashMap::from([(3, Arc::from(source))]));
        let options = ResolvedOptions::default();
        let ctx = RenderContext {
            options: &options,
            sources: &sources,
        };
        root_flanks(Some(Some(first)), None, &[TIGHT, NEWLINE], &[TIGHT, NEWLINE], &TABLE, &ctx)
            .before
            .map(|edge| edge.arm)
    }

    #[test]
    fn a_tree_addressed_edge_item_gives_the_root_its_source_flank() {
        assert_eq!(before_flank(&coordinate(1, 4, false), "\n#!\n"), Some(NEWLINE));
    }

    #[test]
    fn an_edge_item_that_addresses_its_text_only_gives_the_root_no_flank() {
        assert_eq!(before_flank(&coordinate(1, 4, true), "\n#!\n"), None);
    }

    fn separated(second_text_only: bool) -> bool {
        let sources = Sources(HashMap::from([(3, Arc::from("a,b"))]));
        let first = coordinate(0, 1, false);
        let second = coordinate(2, 3, second_text_only);
        classify_list_gaps(
            &[crate::classify::GapItem { coord: Some(&first), held: None }, crate::classify::GapItem { coord: Some(&second), held: None }],
            &sources,
            ",",
            &[TIGHT],
            &[TIGHT],
            &TABLE,
        )
        .separated[0]
    }

    #[test]
    fn a_gap_between_tree_addressed_items_is_a_source_separator() {
        assert!(separated(false));
    }

    #[test]
    fn a_gap_beside_an_item_that_addresses_its_text_only_is_not() {
        assert!(!separated(true));
    }
}
