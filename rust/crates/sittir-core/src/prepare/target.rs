//! The places a node's prepare body writes, one trait for each kind of place.
//! A generated body is generic over its node's prepare trait (a handle per
//! place), so one body prepares a native node, whose handles borrow its
//! fields, and a record, whose handles write the render's prepared overlay.
//! Every operation, a read as well as a write, takes the overlay `O` the
//! prepare trait names: `()` for a native node, written in place. Each trait here is implemented for the
//! field types a native node holds, and for a mutable borrow of any type
//! that implements it.

use std::borrow::Cow;

use super::{fill_seated_gaps, fill_slot_gaps, slot_separators, EdgeItem, EdgeItems, Prepare, RenderContext, SeatTarget, SnapshotEdge};
use crate::layout::{Layout, NodeLayout, SlotLayout};
use crate::options::Edges;
use crate::render::CoordinateError;
use crate::slot::{NodeCoordinate, SlotValue};
use crate::trivia::TriviaSeam;
use crate::types::{KindId, SiteId};

/// A node's layout as its prepare reads and writes it: prepared, its edges
/// filled, and given a list slot's per-item separators (`SlotLayout::tokens`).
/// A read takes the overlay too, and its answer borrows from the layout
/// alone: a native layout lends what it holds, and a record's answers an
/// owned copy of what the overlay holds.
pub trait LayoutTarget<O> {
    /// Prepare the layout (`Prepare for NodeLayout`).
    ///
    /// # Errors
    ///
    /// The coordinate a trivia entry or a unit's side holds that its tree
    /// refuses.
    fn prepare(&mut self, overlay: &mut O, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>;
    /// The node's own edges, for prepare to fill.
    fn edges_mut<'s>(&'s mut self, overlay: &'s mut O) -> &'s mut Edges;
    /// Store `tokens` as the per-item separators of list slot `slot`.
    fn set_slot_tokens(&mut self, overlay: &mut O, slot: &str, tokens: Vec<Option<KindId>>);
    /// The stored layout of the node's list slot `slot` (`Layout::slot`).
    fn slot(&self, overlay: &O, slot: &str) -> Option<Cow<'_, SlotLayout>>;
    /// The node a built node was rebuilt from (`Layout::sides`).
    fn sides(&self, overlay: &O) -> Option<Cow<'_, NodeCoordinate>>;
    /// `Layout::snapshot_edge`.
    fn snapshot_edge(&self, overlay: &O) -> Option<SnapshotEdge>;
    /// `Layout::inner_item`.
    fn inner_item(&self, overlay: &O) -> Option<EdgeItem<'_>>;
}

impl<T: Prepare + TriviaSeam + 'static> LayoutTarget<()> for Option<Box<NodeLayout<T>>> {
    fn prepare(&mut self, (): &mut (), ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        Prepare::prepare(self, ctx)
    }

    fn edges_mut<'s>(&'s mut self, (): &'s mut ()) -> &'s mut Edges {
        Layout::edges_mut(self)
    }

    fn set_slot_tokens(&mut self, (): &mut (), slot: &str, tokens: Vec<Option<KindId>>) {
        crate::layout::slot_entry(self, slot).tokens = tokens;
    }

    fn slot(&self, (): &(), slot: &str) -> Option<Cow<'_, SlotLayout>> {
        Layout::slot(self, slot).map(Cow::Borrowed)
    }

    fn sides(&self, (): &()) -> Option<Cow<'_, NodeCoordinate>> {
        Layout::sides(self).map(Cow::Borrowed)
    }

    fn snapshot_edge(&self, (): &()) -> Option<SnapshotEdge> {
        Layout::snapshot_edge(self)
    }

    fn inner_item(&self, (): &()) -> Option<EdgeItem<'_>> {
        Layout::inner_item(self)
    }
}

impl<O, L: LayoutTarget<O> + ?Sized> LayoutTarget<O> for &mut L {
    fn prepare(&mut self, overlay: &mut O, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        (**self).prepare(overlay, ctx)
    }

    fn edges_mut<'s>(&'s mut self, overlay: &'s mut O) -> &'s mut Edges {
        (**self).edges_mut(overlay)
    }

    fn set_slot_tokens(&mut self, overlay: &mut O, slot: &str, tokens: Vec<Option<KindId>>) {
        (**self).set_slot_tokens(overlay, slot, tokens);
    }

    fn slot(&self, overlay: &O, slot: &str) -> Option<Cow<'_, SlotLayout>> {
        (**self).slot(overlay, slot)
    }

    fn sides(&self, overlay: &O) -> Option<Cow<'_, NodeCoordinate>> {
        (**self).sides(overlay)
    }

    fn snapshot_edge(&self, overlay: &O) -> Option<SnapshotEdge> {
        (**self).snapshot_edge(overlay)
    }

    fn inner_item(&self, overlay: &O) -> Option<EdgeItem<'_>> {
        (**self).inner_item(overlay)
    }
}

/// A slot as its holder's prepare writes it: its values prepared, the gaps
/// between its present items given its stored layout, and its items' own
/// separators read. A single slot is a slot of at most one item.
pub trait SlotTarget<O>: EdgeItems<O> {
    /// Prepare every value the slot holds.
    ///
    /// # Errors
    ///
    /// The coordinate a value holds that its tree refuses.
    fn prepare(&mut self, overlay: &mut O, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>;
    /// Give the gaps between the slot's present items the classes its stored
    /// layout holds (`prepare::fill_slot_gaps`).
    fn fill_gaps(&mut self, overlay: &mut O, slot: Option<&SlotLayout>);
    /// The slot's items' own separators (`prepare::slot_separators`).
    fn separators(&self, overlay: &O, kind_of: fn(KindId) -> Option<KindId>, ctx: &RenderContext<'_>) -> Option<Vec<Option<KindId>>>;
}

/// A slot whose gaps a seat table fills (`prepare::fill_seated_gaps`): its
/// items' elements are seated (`SeatTarget`).
pub trait SeatSlot<O> {
    /// Fill the gap after each present item but the last from `table`.
    fn fill_seats(&mut self, overlay: &mut O, table: &[Option<SiteId>], ctx: &RenderContext<'_>);
}

/// An optional slot that holds a unit its option site chooses: unset, it
/// takes the unit of the kind its site's arm names, when one has that kind.
pub trait UnitSlot<O> {
    fn fill_unit(&mut self, overlay: &mut O, kind: KindId);
}

/// A print setting a builder may set: unset, it takes the value prepare
/// resolves.
pub trait Setting<V, O> {
    fn fill(&mut self, overlay: &mut O, value: V);
    /// Whether a builder set it: the value the node holds before prepare
    /// fills it.
    fn chosen(&self, overlay: &O) -> bool;
}

/// A choice of units, each built from the kind id it claims.
pub trait FromKindId: Sized {
    /// The unit `id` claims, or `None` when no unit claims it.
    fn from_kind_id(id: KindId) -> Option<Self>;
}

/// `SlotTarget` and `SeatSlot` for one field type that holds slot values,
/// by the values it holds, present or absent, mutably and shared.
macro_rules! slot_target {
    ($ty:ty, |$s:ident| $items_mut:expr, |$r:ident| $items:expr) => {
        impl<T: Prepare, const ADJACENT: bool> SlotTarget<()> for $ty {
            fn prepare(&mut self, (): &mut (), ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
                Prepare::prepare(self, ctx)
            }

            fn fill_gaps(&mut self, (): &mut (), slot: Option<&SlotLayout>) {
                let $s = self;
                fill_slot_gaps($items_mut, slot);
            }

            fn separators(&self, (): &(), kind_of: fn(KindId) -> Option<KindId>, ctx: &RenderContext<'_>) -> Option<Vec<Option<KindId>>> {
                let $r = self;
                slot_separators($items, kind_of, ctx)
            }
        }

        impl<T: Prepare + SeatTarget, const ADJACENT: bool> SeatSlot<()> for $ty {
            fn fill_seats(&mut self, (): &mut (), table: &[Option<SiteId>], ctx: &RenderContext<'_>) {
                let $s = self;
                fill_seated_gaps($items_mut, table, ctx);
            }
        }
    };
}

slot_target!(SlotValue<T, ADJACENT>, |s| std::iter::once(Some(s)), |s| std::iter::once(Some(s)));
slot_target!(Option<SlotValue<T, ADJACENT>>, |s| std::iter::once(s.as_mut()), |s| std::iter::once(s.as_ref()));
slot_target!(Vec<SlotValue<T, ADJACENT>>, |s| s.iter_mut().map(Some), |s| s.iter().map(Some));
slot_target!(Vec<Option<SlotValue<T, ADJACENT>>>, |s| s.iter_mut().map(Option::as_mut), |s| s.iter().map(Option::as_ref));
slot_target!(crate::NonEmptyVec<SlotValue<T, ADJACENT>>, |s| s.iter_mut().map(Some), |s| s.iter().map(Some));
slot_target!(crate::NonEmptyVec<Option<SlotValue<T, ADJACENT>>>, |s| s.iter_mut().map(Option::as_mut), |s| s.iter().map(Option::as_ref));

impl<O, S: SlotTarget<O> + ?Sized> SlotTarget<O> for &mut S {
    fn prepare(&mut self, overlay: &mut O, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        (**self).prepare(overlay, ctx)
    }

    fn fill_gaps(&mut self, overlay: &mut O, slot: Option<&SlotLayout>) {
        (**self).fill_gaps(overlay, slot);
    }

    fn separators(&self, overlay: &O, kind_of: fn(KindId) -> Option<KindId>, ctx: &RenderContext<'_>) -> Option<Vec<Option<KindId>>> {
        (**self).separators(overlay, kind_of, ctx)
    }
}

impl<O, S: SeatSlot<O> + ?Sized> SeatSlot<O> for &mut S {
    fn fill_seats(&mut self, overlay: &mut O, table: &[Option<SiteId>], ctx: &RenderContext<'_>) {
        (**self).fill_seats(overlay, table, ctx);
    }
}

impl<T: FromKindId, const ADJACENT: bool> UnitSlot<()> for Option<SlotValue<T, ADJACENT>> {
    fn fill_unit(&mut self, (): &mut (), kind: KindId) {
        if self.is_none() {
            *self = T::from_kind_id(kind).map(SlotValue::Node);
        }
    }
}

impl<O, S: UnitSlot<O> + ?Sized> UnitSlot<O> for &mut S {
    fn fill_unit(&mut self, overlay: &mut O, kind: KindId) {
        (**self).fill_unit(overlay, kind);
    }
}

impl<V> Setting<V, ()> for Option<V> {
    fn fill(&mut self, (): &mut (), value: V) {
        self.get_or_insert(value);
    }

    fn chosen(&self, (): &()) -> bool {
        self.is_some()
    }
}

impl<V, O, S: Setting<V, O> + ?Sized> Setting<V, O> for &mut S {
    fn fill(&mut self, overlay: &mut O, value: V) {
        (**self).fill(overlay, value);
    }

    fn chosen(&self, overlay: &O) -> bool {
        (**self).chosen(overlay)
    }
}
