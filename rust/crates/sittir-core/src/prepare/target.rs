//! The places a node's prepare body writes, one trait for each kind of place.
//! A generated body is generic over its node's prepare trait (a handle per
//! place), so one body prepares a native node, whose handles borrow its
//! fields, and a record, whose handles write the render's prepared overlay.
//! Each trait here is implemented for the field types a native node holds,
//! and for a mutable borrow of any type that implements it.

use super::{fill_seated_gaps, fill_slot_gaps, slot_separators, EdgeItems, Prepare, RenderContext, SeatTarget};
use crate::layout::{Layout, NodeLayout, SlotLayout};
use crate::render::CoordinateError;
use crate::slot::SlotValue;
use crate::trivia::TriviaSeam;
use crate::types::{KindId, SiteId};

/// A node's layout as its prepare writes it: prepared in place, and given a
/// list slot's per-item separators (`SlotLayout::tokens`).
pub trait LayoutTarget: Layout {
    /// Prepare the layout (`Prepare for NodeLayout`).
    ///
    /// # Errors
    ///
    /// The coordinate a trivia entry or a unit's side holds that its tree
    /// refuses.
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>;
    /// Store `tokens` as the per-item separators of list slot `slot`.
    fn set_slot_tokens(&mut self, slot: &str, tokens: Vec<Option<KindId>>);
}

impl<T: Prepare + TriviaSeam + 'static> LayoutTarget for Option<Box<NodeLayout<T>>> {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        Prepare::prepare(self, ctx)
    }

    fn set_slot_tokens(&mut self, slot: &str, tokens: Vec<Option<KindId>>) {
        crate::layout::slot_entry(self, slot).tokens = tokens;
    }
}

impl<L: LayoutTarget + ?Sized> LayoutTarget for &mut L {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        (**self).prepare(ctx)
    }

    fn set_slot_tokens(&mut self, slot: &str, tokens: Vec<Option<KindId>>) {
        (**self).set_slot_tokens(slot, tokens);
    }
}

/// A slot as its holder's prepare writes it: its values prepared, the gaps
/// between its present items given its stored layout, and its items' own
/// separators read. A single slot is a slot of at most one item.
pub trait SlotTarget: EdgeItems {
    /// Prepare every value the slot holds.
    ///
    /// # Errors
    ///
    /// The coordinate a value holds that its tree refuses.
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError>;
    /// Give the gaps between the slot's present items the classes its stored
    /// layout holds (`prepare::fill_slot_gaps`).
    fn fill_gaps(&mut self, slot: Option<&SlotLayout>);
    /// The slot's items' own separators (`prepare::slot_separators`).
    fn separators(&self, kind_of: fn(KindId) -> Option<KindId>, ctx: &RenderContext<'_>) -> Option<Vec<Option<KindId>>>;
}

/// A slot whose gaps a seat table fills (`prepare::fill_seated_gaps`): its
/// items' elements are seated (`SeatTarget`).
pub trait SeatSlot {
    /// Fill the gap after each present item but the last from `table`.
    fn fill_seats(&mut self, table: &[Option<SiteId>], ctx: &RenderContext<'_>);
}

/// An optional slot that holds a unit its option site chooses: unset, it
/// takes the unit of the kind its site's arm names, when one has that kind.
pub trait UnitSlot {
    fn fill_unit(&mut self, kind: KindId);
}

/// A print setting a builder may set: unset, it takes the value prepare
/// resolves.
pub trait Setting<V> {
    fn fill(&mut self, value: V);
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
        impl<T: Prepare, const ADJACENT: bool> SlotTarget for $ty {
            fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
                Prepare::prepare(self, ctx)
            }

            fn fill_gaps(&mut self, slot: Option<&SlotLayout>) {
                let $s = self;
                fill_slot_gaps($items_mut, slot);
            }

            fn separators(&self, kind_of: fn(KindId) -> Option<KindId>, ctx: &RenderContext<'_>) -> Option<Vec<Option<KindId>>> {
                let $r = self;
                slot_separators($items, kind_of, ctx)
            }
        }

        impl<T: Prepare + SeatTarget, const ADJACENT: bool> SeatSlot for $ty {
            fn fill_seats(&mut self, table: &[Option<SiteId>], ctx: &RenderContext<'_>) {
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

impl<S: SlotTarget + ?Sized> SlotTarget for &mut S {
    fn prepare(&mut self, ctx: &RenderContext<'_>) -> Result<(), CoordinateError> {
        (**self).prepare(ctx)
    }

    fn fill_gaps(&mut self, slot: Option<&SlotLayout>) {
        (**self).fill_gaps(slot);
    }

    fn separators(&self, kind_of: fn(KindId) -> Option<KindId>, ctx: &RenderContext<'_>) -> Option<Vec<Option<KindId>>> {
        (**self).separators(kind_of, ctx)
    }
}

impl<S: SeatSlot + ?Sized> SeatSlot for &mut S {
    fn fill_seats(&mut self, table: &[Option<SiteId>], ctx: &RenderContext<'_>) {
        (**self).fill_seats(table, ctx);
    }
}

impl<T: FromKindId, const ADJACENT: bool> UnitSlot for Option<SlotValue<T, ADJACENT>> {
    fn fill_unit(&mut self, kind: KindId) {
        if self.is_none() {
            *self = T::from_kind_id(kind).map(SlotValue::Node);
        }
    }
}

impl<S: UnitSlot + ?Sized> UnitSlot for &mut S {
    fn fill_unit(&mut self, kind: KindId) {
        (**self).fill_unit(kind);
    }
}

impl<V> Setting<V> for Option<V> {
    fn fill(&mut self, value: V) {
        self.get_or_insert(value);
    }
}

impl<V, S: Setting<V> + ?Sized> Setting<V> for &mut S {
    fn fill(&mut self, value: V) {
        (**self).fill(value);
    }
}
