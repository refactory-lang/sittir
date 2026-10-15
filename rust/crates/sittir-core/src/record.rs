//! What a record's cell must hold for each slot type: the check behind the
//! layout codegen stamps on a transport's slots (`#[slot(word = …, …)]`).
//! Codegen is the one source of every word, width and bit; the derive
//! asserts, per slot, that the slot's type fits the cell stamped for it, and
//! computes nothing else.
//!
//! A derived interior transport accepts a four-word text cell:
//!
//! ```
//! # const KIND: sittir_core::types::KindId = sittir_core::types::KindId(1);
//! #[derive(sittir_core::Transport)]
//! #[transport(kind = KIND, interior = "(?<value>.*)", words = 6)]
//! struct Example {
//!     #[wire(key = "_value")]
//!     #[slot(capture = "value", word = 2, width = 4)]
//!     value: String,
//! }
//! ```
//!
//! The same derive refuses the field one word short of its type:
//!
//! ```compile_fail
//! # const KIND: sittir_core::types::KindId = sittir_core::types::KindId(1);
//! #[derive(sittir_core::Transport)]
//! #[transport(kind = KIND, interior = "(?<value>.*)", words = 6)]
//! struct Example {
//!     #[wire(key = "_value")]
//!     #[slot(capture = "value", word = 2, width = 3)]
//!     value: String,
//! }
//! ```
//!
//! A slot cannot occupy either word of the record's header:
//!
//! ```compile_fail
//! # const KIND: sittir_core::types::KindId = sittir_core::types::KindId(1);
//! #[derive(sittir_core::Transport)]
//! #[transport(kind = KIND, interior = "(?<value>.*)", words = 6)]
//! struct Example {
//!     #[wire(key = "_value")]
//!     #[slot(capture = "value", word = 1, width = 4)]
//!     value: String,
//! }
//! ```

use crate::{NonEmptyVec, SlotValue};

/// The kind id and side-record address preceding every record's slots.
pub const HEADER_WORDS: u32 = 2;

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
    const RUN: u32 = T::RUN;
    const PRESENCE: bool = T::PRESENCE;
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

    #[test]
    fn an_optional_cell_preserves_its_list_items_width() {
        assert!(fits_cell::<Option<Vec<SlotValue<()>>>>(2, 5));
        assert!(!fits_cell::<Option<Vec<SlotValue<()>>>>(2, 4));
    }
}
