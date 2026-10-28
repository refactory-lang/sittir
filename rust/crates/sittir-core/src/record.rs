//! What a record's cell must hold for each slot type: the check behind the
//! layout codegen stamps on a node's slots (`#[slot(word = …, …)]`).
//! Codegen is the one source of every word, width, form and bit; the derive
//! asserts, per slot, that the slot's type is stored as the forms stamped
//! for it in a cell of the stamped width, and computes nothing else.
//!
//! A derived interior node accepts a two-word text cell:
//!
//! ```
//! # const KIND: sittir_core::types::KindId = sittir_core::types::KindId(1);
//! #[derive(sittir_core::Node)]
//! #[node(kind = KIND, interior = "(?<value>.*)", words = 4, built_words = 3)]
//! struct Example {
//!     #[wire(key = "$_layout")]
//!     #[layout]
//!     layout: Option<Box<sittir_core::layout::NodeLayout<sittir_core::trivia::TriviaText>>>,
//!     #[wire(key = "_value")]
//!     #[slot(capture = "value", word = 2, width = 2, forms = 4, built = 2)]
//!     value: String,
//! }
//! ```
//!
//! The same derive refuses the field one word short of its form:
//!
//! ```compile_fail
//! # const KIND: sittir_core::types::KindId = sittir_core::types::KindId(1);
//! #[derive(sittir_core::Node)]
//! #[node(kind = KIND, interior = "(?<value>.*)", words = 4, built_words = 3)]
//! struct Example {
//!     #[wire(key = "$_layout")]
//!     #[layout]
//!     layout: Option<Box<sittir_core::layout::NodeLayout<sittir_core::trivia::TriviaText>>>,
//!     #[wire(key = "_value")]
//!     #[slot(capture = "value", word = 2, width = 1, forms = 4, built = 2)]
//!     value: String,
//! }
//! ```
//!
//! A slot cannot occupy either word of the record's header:
//!
//! ```compile_fail
//! # const KIND: sittir_core::types::KindId = sittir_core::types::KindId(1);
//! #[derive(sittir_core::Node)]
//! #[node(kind = KIND, interior = "(?<value>.*)", words = 4, built_words = 3)]
//! struct Example {
//!     #[wire(key = "$_layout")]
//!     #[layout]
//!     layout: Option<Box<sittir_core::layout::NodeLayout<sittir_core::trivia::TriviaText>>>,
//!     #[wire(key = "_value")]
//!     #[slot(capture = "value", word = 1, width = 2, forms = 4, built = 2)]
//!     value: String,
//! }
//! ```

use crate::{NonEmptyVec, SlotValue};

/// The kind id and side-record address preceding every record's slots.
pub const HEADER_WORDS: u32 = 2;

/// The bits a parsed record's header gives its kind: a whole `KindId`, with
/// no flags above it.
pub const PARSED_KIND_BITS: u32 = 16;

/// What a value of a node type is stored as in its holder's parsed record,
/// one bit for each way a value of it is held.
pub mod stored {
    /// A node with a record of its own.
    pub const RECORD: u8 = 1;
    /// A leaf, which has no record: its holder names it by its row and span.
    pub const LEAF: u8 = 2;
    /// A unit: a kind and the row it was read at.
    pub const UNIT: u8 = 4;
    /// A captured interior string: its span.
    pub const TEXT: u8 = 8;
    /// A choice's blank arm, which a read takes for an optional slot with no
    /// child.
    pub const BLANK: u8 = 16;
}

/// The forms a parsed cell holds, as a slot's `forms` stamp spells them,
/// with the words each takes. A cell opens with a tag word only when its slot
/// holds more than one form (`tagged`); an absent slot is then its absent
/// tag, else an all-zero cell, since no present form's first word is zero.
pub mod form {
    /// A parsed node by its row and span: a node with a record, by its
    /// coordinate, or a leaf. `[kind | row << bits, start, end | LEAF]`; a
    /// child's row is never 0.
    pub const NODE: u8 = 1;
    /// A unit: `[kind | row << bits]`; the blank arm is 0.
    pub const UNIT: u8 = 2;
    /// A captured string: `[start + 1, end]`.
    pub const TEXT: u8 = 4;
    /// A bounded child's record, embedded: its header (whose kind is never
    /// 0), its side word and its cells, in the slot's `inline` words.
    pub const INLINE: u8 = 8;
    /// Not a form: the slot admits a choice's blank arm, which a read takes
    /// for no child, so it never holds absent, and a tagless unit cell of 0
    /// is that arm.
    pub const BLANK: u8 = 16;
    /// The bits that name forms, `BLANK` left out.
    pub const ALL: u8 = NODE | UNIT | TEXT | INLINE;

    /// The words a `NODE` cell takes.
    pub const NODE_WORDS: u32 = 3;
    /// The words a `UNIT` cell takes.
    pub const UNIT_WORDS: u32 = 1;
    /// The words a `TEXT` cell takes.
    pub const TEXT_WORDS: u32 = 2;
    /// The bit a `NODE` cell's span end carries for a leaf.
    pub const LEAF: u32 = 1 << 31;
}

/// The forms a slot holds whose values are stored as `stored`, a bounded
/// child's record embedded when `inline`.
#[must_use]
pub const fn forms_of(stored: u8, inline: bool) -> u8 {
    let mut forms = 0;
    if stored & stored::RECORD != 0 {
        forms |= if inline { form::INLINE } else { form::NODE };
    }
    if stored & stored::LEAF != 0 {
        forms |= form::NODE;
    }
    if stored & stored::UNIT != 0 {
        forms |= form::UNIT;
    }
    if stored & stored::TEXT != 0 {
        forms |= form::TEXT;
    }
    if stored & stored::BLANK != 0 {
        forms |= form::UNIT | form::BLANK;
    }
    forms
}

/// Whether a cell of `forms` opens with a tag word.
#[must_use]
pub const fn tagged(forms: u8) -> bool {
    (forms & form::ALL).count_ones() > 1
}

/// The words a cell of `forms` takes, an embedded record taking `inline`.
#[must_use]
pub const fn parsed_width(forms: u8, inline: u32) -> u32 {
    let mut widest = 0;
    if forms & form::NODE != 0 && form::NODE_WORDS > widest {
        widest = form::NODE_WORDS;
    }
    if forms & form::UNIT != 0 && form::UNIT_WORDS > widest {
        widest = form::UNIT_WORDS;
    }
    if forms & form::TEXT != 0 && form::TEXT_WORDS > widest {
        widest = form::TEXT_WORDS;
    }
    if forms & form::INLINE != 0 && inline > widest {
        widest = inline;
    }
    if tagged(forms) { widest + 1 } else { widest }
}

/// What a node type's values are stored as (`stored`). The derive writes
/// every node type's.
pub trait Stored {
    const STORED: u8;
}

impl<T: Stored + ?Sized> Stored for Box<T> {
    const STORED: u8 = T::STORED;
}

/// An `ERROR` node is trivia of its tree, never a parsed record's value.
impl Stored for crate::verbatim::VerbatimNode {
    const STORED: u8 = 0;
}

/// The cell a field type needs in a record.
pub trait RecordCell {
    /// What a value, or a list's item, is stored as (`stored`).
    const STORED: u8;
    /// Whether the type is a list, held as one word naming its run.
    const LIST: bool = false;
    /// Whether the type is a keyword's presence, held as one bit and no cell.
    const PRESENCE: bool = false;
}

impl RecordCell for bool {
    const STORED: u8 = 0;
    const PRESENCE: bool = true;
}

/// A captured interior string.
impl RecordCell for String {
    const STORED: u8 = stored::TEXT;
}

impl<T: Stored, const ADJACENT: bool> RecordCell for SlotValue<T, ADJACENT> {
    const STORED: u8 = T::STORED;
}

/// Absent is the cell no present form writes.
impl<T: RecordCell> RecordCell for Option<T> {
    const STORED: u8 = T::STORED;
    const LIST: bool = T::LIST;
    const PRESENCE: bool = T::PRESENCE;
}

impl<T: RecordCell> RecordCell for Vec<T> {
    const STORED: u8 = T::STORED;
    const LIST: bool = true;
}

impl<T: RecordCell> RecordCell for NonEmptyVec<T> {
    const STORED: u8 = T::STORED;
    const LIST: bool = true;
}

/// Whether `T` is held in a cell of `forms` and `width` words, a bounded
/// child's record embedded in `inline` of them, or for a list in one word
/// naming a run of `run`-word item cells.
#[must_use]
pub const fn fits_cell<T: RecordCell>(forms: u8, width: u32, run: u32, inline: u32) -> bool {
    if T::PRESENCE {
        return false;
    }
    if T::LIST {
        return inline == 0 && width == 1 && forms == forms_of(T::STORED, false) && run == parsed_width(forms, 0);
    }
    run == 0 && forms == forms_of(T::STORED, inline > 0) && width == parsed_width(forms, inline)
}

/// Whether `T` is a presence, which a stamped bit holds.
#[must_use]
pub const fn fits_bit<T: RecordCell>() -> bool {
    T::PRESENCE
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{NonEmptyVec, SlotValue};

    struct Branch;
    impl Stored for Branch {
        const STORED: u8 = stored::RECORD;
    }

    struct Leaf;
    impl Stored for Leaf {
        const STORED: u8 = stored::LEAF;
    }

    struct Choice;
    impl Stored for Choice {
        const STORED: u8 = stored::RECORD | stored::LEAF | stored::UNIT | stored::BLANK;
    }

    #[test]
    fn a_child_with_a_record_or_a_leaf_takes_a_three_word_node_cell() {
        assert!(fits_cell::<SlotValue<Branch>>(form::NODE, 3, 0, 0));
        assert!(fits_cell::<Option<SlotValue<Box<Leaf>>>>(form::NODE, 3, 0, 0));
        assert!(!fits_cell::<SlotValue<Branch>>(form::NODE, 4, 0, 0));
        assert!(!fits_cell::<SlotValue<Branch>>(form::UNIT, 3, 0, 0));
    }

    #[test]
    fn a_bounded_child_is_embedded_in_its_capacity() {
        assert!(fits_cell::<SlotValue<Branch>>(form::INLINE, 6, 0, 6));
        assert!(!fits_cell::<SlotValue<Branch>>(form::NODE, 6, 0, 6));
    }

    #[test]
    fn a_slot_of_more_than_one_form_opens_with_a_tag() {
        let forms = forms_of(Choice::STORED, false);
        assert_eq!(forms, form::NODE | form::UNIT | form::BLANK);
        assert!(tagged(forms));
        assert!(fits_cell::<SlotValue<Choice>>(forms, 4, 0, 0));
        assert!(!tagged(form::UNIT | form::BLANK));
    }

    #[test]
    fn text_takes_two_words() {
        assert!(fits_cell::<String>(form::TEXT, 2, 0, 0));
        assert!(fits_cell::<Option<String>>(form::TEXT, 2, 0, 0));
        assert!(!fits_cell::<String>(form::TEXT, 1, 0, 0));
    }

    #[test]
    fn a_list_takes_one_word_and_a_run_as_wide_as_its_item() {
        assert!(fits_cell::<Vec<SlotValue<Branch>>>(form::NODE, 1, 3, 0));
        assert!(fits_cell::<NonEmptyVec<Option<SlotValue<Leaf>>>>(form::NODE, 1, 3, 0));
        assert!(!fits_cell::<Vec<SlotValue<Branch>>>(form::NODE, 1, 2, 0));
        assert!(!fits_cell::<Vec<SlotValue<Branch>>>(form::NODE, 2, 3, 0));
    }

    #[test]
    fn a_presence_is_a_bit_never_a_cell() {
        assert!(fits_bit::<bool>());
        assert!(!fits_cell::<bool>(form::NODE, 3, 0, 0));
        assert!(!fits_bit::<SlotValue<Branch>>());
    }
}
