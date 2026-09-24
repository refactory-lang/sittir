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
/// seat's resolved arm and strength unless the wire already set it. A coordinate is skipped; an
/// absent element renders nothing, so it neither takes a gap nor counts as
/// the sibling that makes the gap before it.
pub fn fill_seated_gaps<'i, T: SeatTarget + 'i, const ADJACENT: bool>(
    items: impl Iterator<Item = Option<&'i mut SlotValue<T, ADJACENT>>>,
    table: &[u16],
    ctx: &RenderContext<'_>,
) {
    let mut present: Vec<&'i mut SlotValue<T, ADJACENT>> = items.flatten().collect();
    present.pop();
    for item in present {
        let SlotValue::Transport(t) = item else { continue };
        if let Some((edges, site)) = t.seat_target(table) {
            edges.after.get_or_insert(EdgeArm::from(ctx.options.spacing[site]));
        }
    }
}

pub trait Prepare {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>;
}

impl<T: Prepare, const ADJACENT: bool> Prepare for SlotValue<T, ADJACENT> {
    /// A coordinate is checked here and its slice discarded: the render is
    /// refused before a byte is written rather than part way through, and
    /// the sink re-resolves at write time against the same table.
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        match self {
            SlotValue::Coord(coord) => {
                coord.resolve(ctx.sources)?;
                coord.edges = ctx
                    .sources
                    .kind_of(coord)
                    .and_then(|kind| ctx.options.edge_arms(kind));
                Ok(())
            }
            SlotValue::Transport(t) => t.prepare(ctx),
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
}

impl<T: Prepare + ?Sized> Prepare for Box<T> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        (**self).prepare(ctx)
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
