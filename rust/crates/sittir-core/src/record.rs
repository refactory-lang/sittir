//! What a record's cell must hold for each slot type: the check behind the
//! layout codegen stamps on a transport's slots (`#[slot(word = …, …)]`).
//! Codegen is the one source of every word, width and bit; the derive
//! asserts, per slot, that the slot's type fits the cell stamped for it, and
//! computes nothing else.
//!
//! A field one word short of its type does not build:
//!
//! ```compile_fail
//! const _: () = assert!(
//!     sittir_core::record::fits_cell::<sittir_core::SlotValue<()>>(4, 0),
//!     "Example.field: its type needs more than its stamped record cell"
//! );
//! ```

use crate::{NonEmptyVec, SlotValue};

/// The cell a field type needs in a record.
pub trait RecordCell {
    /// The words of the narrowest cell that holds every value of the type.
    const WIDTH: u32;
    /// For a list, the words each item's cell takes in the list's run.
    const RUN: u32 = 0;
    /// Whether the type is a keyword's presence, held as one bit and no cell.
    const PRESENCE: bool = false;
}

impl RecordCell for bool {
    const WIDTH: u32 = 0;
    const PRESENCE: bool = true;
}

/// A leaf's text: tag, kind, and a byte span in the source or an offset and
/// length in the arena's string table.
impl RecordCell for String {
    const WIDTH: u32 = 4;
}

/// A child: tag, kind, then a coordinate's index and byte span, a child
/// record's address, or nothing for a unit.
impl<T, const ADJACENT: bool> RecordCell for SlotValue<T, ADJACENT> {
    const WIDTH: u32 = 5;
}

/// Absent is tag 0 of the inner cell.
impl<T: RecordCell> RecordCell for Option<T> {
    const WIDTH: u32 = T::WIDTH;
    const PRESENCE: bool = T::PRESENCE;
}

impl<T: RecordCell> RecordCell for Box<T> {
    const WIDTH: u32 = T::WIDTH;
}

/// A list: the offset and length of its run of item cells.
impl<T: RecordCell> RecordCell for Vec<T> {
    const WIDTH: u32 = 2;
    const RUN: u32 = T::WIDTH;
}

impl<T: RecordCell> RecordCell for NonEmptyVec<T> {
    const WIDTH: u32 = 2;
    const RUN: u32 = T::WIDTH;
}

/// Whether `T` fits a cell of `width` words whose list run, if any, is `run`
/// words an item.
pub const fn fits_cell<T: RecordCell>(width: u32, run: u32) -> bool {
    !T::PRESENCE && T::WIDTH <= width && T::RUN <= run
}

/// Whether `T` is a presence, which a stamped bit holds.
pub const fn fits_bit<T: RecordCell>() -> bool {
    T::PRESENCE
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{NonEmptyVec, SlotValue};

    #[test]
    fn a_slot_value_takes_a_five_word_cell_and_refuses_four() {
        assert!(fits_cell::<SlotValue<()>>(5, 0));
        assert!(fits_cell::<Option<SlotValue<Box<()>>>>(5, 0));
        assert!(!fits_cell::<SlotValue<()>>(4, 0));
    }

    #[test]
    fn text_takes_four_words() {
        assert!(fits_cell::<String>(4, 0));
        assert!(fits_cell::<Option<String>>(4, 0));
        assert!(!fits_cell::<String>(3, 0));
    }

    #[test]
    fn a_list_takes_two_words_and_a_run_as_wide_as_its_item() {
        assert!(fits_cell::<Vec<SlotValue<()>>>(2, 5));
        assert!(fits_cell::<NonEmptyVec<Option<SlotValue<()>>>>(2, 5));
        assert!(!fits_cell::<Vec<SlotValue<()>>>(2, 4));
        assert!(!fits_cell::<Vec<SlotValue<()>>>(1, 5));
    }

    #[test]
    fn a_presence_is_a_bit_never_a_cell() {
        assert!(fits_bit::<bool>());
        assert!(!fits_cell::<bool>(5, 0));
        assert!(!fits_bit::<SlotValue<()>>());
    }
}
