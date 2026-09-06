//! Views: one `View` over any slot shape with the template's literal text
//! around it, one `ListView` over a slice with the separator parts, head and
//! tail spacing, and the list's own template.

use sittir_core::view::{ListView, View, NO_ITEMS};
use sittir_core::SlotValue;
use std::fmt;

struct Word(&'static str);
impl fmt::Display for Word {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.0)
    }
}

fn node(s: &'static str) -> SlotValue<Word> {
    SlotValue::Node(Word(s))
}

#[test]
fn a_present_optional_writes_prefix_value_suffix() {
    let slot = Some(node("T"));
    assert_eq!(View::new(&slot, "->{}").to_string(), "->T");
    assert_eq!(View::new(&slot, "{}").to_string(), "T");
    assert_eq!(View::new(&slot, "<{}>").to_string(), "<T>");
}

#[test]
fn a_missing_optional_writes_nothing_flanks_included() {
    let slot: Option<SlotValue<Word>> = None;
    assert_eq!(View::new(&slot, "->{}").to_string(), "");
}

#[test]
fn a_required_slot_is_display_on_its_own() {
    assert_eq!(node("x").to_string(), "x");
    assert_eq!(SlotValue::<Word>::Verbatim("raw".into()).to_string(), "raw");
}

#[test]
fn an_optional_reference_is_a_slot() {
    let owned = node("v");
    let slot: Option<&SlotValue<Word>> = Some(&owned);
    assert_eq!(View::new(slot, "={}").to_string(), "=v");
    let none: Option<&SlotValue<Word>> = None;
    assert_eq!(View::new(none, "={}").to_string(), "");
}

#[test]
fn a_boolean_writes_its_placeholder_free_template_when_true() {
    assert_eq!(View::new(&Some(true), "[^+*?]+").to_string(), "[^+*?]+");
    assert_eq!(View::new(&Some(false), "[^+*?]+").to_string(), "");
    assert_eq!(View::new(&None::<bool>, "[^+*?]+").to_string(), "");
}

#[test]
fn text_slots_write_their_text_even_when_empty() {
    assert_eq!(View::new(&Some(String::new()), "'{}'").to_string(), "''");
    assert_eq!(View::new(&Some("s".to_string()), "'{}'").to_string(), "'s'");
    assert_eq!(View::new(&None::<String>, "'{}'").to_string(), "");
    assert_eq!(View::new(&"t".to_string(), "{}").to_string(), "t");
}

#[test]
fn braces_are_escaped_as_in_write() {
    let slot = Some(node("b"));
    assert_eq!(View::new(&slot, "{{{}}}").to_string(), "{b}");
    assert_eq!(View::new(&slot, "{{}}{}").to_string(), "{}b");
    assert_eq!(View::new(&Some(true), "{{}}").to_string(), "{}");
}

#[test]
fn presence_follows_the_slot_shape() {
    assert!(View::new(&Some(node("x")), "{}").is_present());
    assert!(!View::new(&None::<SlotValue<Word>>, "{}").is_present());
    assert!(!View::new(&Some(false), "kw").is_present());
    assert!(View::new(&Some(true), "kw").is_present());
    let items = [node("a")];
    assert!(list(&items, "", "", "", false, false).is_present());
    assert!(!list(&[], "", "", "", false, false).is_present());
}

fn list<'a>(
    items: &'a [SlotValue<Word>],
    before: &'a str,
    token: &'a str,
    after: &'a str,
    leading: bool,
    trailing: bool,
) -> ListView<'a, SlotValue<Word>> {
    ListView {
        items,
        template: "{}",
        before,
        token,
        after,
        leading,
        trailing,
        head: "",
        tail: "",
    }
}

#[test]
fn between_items_writes_before_token_after() {
    let items = [node("a"), node("b"), node("c")];
    assert_eq!(list(&items, "", ",", " ", false, false).to_string(), "a, b, c");
    assert_eq!(list(&items, " ", "|", " ", false, false).to_string(), "a | b | c");
    assert_eq!(list(&items, "", "", "\n", false, false).to_string(), "a\nb\nc");
    assert_eq!(list(&items, "", "", "", false, false).to_string(), "abc");
}

#[test]
fn a_leading_flank_writes_token_then_after_only() {
    let items = [node("A"), node("B")];
    assert_eq!(list(&items, " ", "|", " ", true, false).to_string(), "| A | B");
    assert_eq!(list(&items, "", ",", "", true, false).to_string(), ",A,B");
}

#[test]
fn a_trailing_flank_writes_before_then_token_only() {
    let items = [node("a"), node("b")];
    assert_eq!(list(&items, "", ",", " ", false, true).to_string(), "a, b,");
    assert_eq!(list(&items, " ", "|", " ", false, true).to_string(), "a | b |");
}

#[test]
fn both_flanks_are_independent() {
    let items = [node("a")];
    assert_eq!(list(&items, "", ";", "", true, true).to_string(), ";a;");
    assert_eq!(list(&items, "", ",", " ", true, true).to_string(), ", a,");
}

#[test]
fn a_single_item_writes_no_separator() {
    let items = [node("only")];
    assert_eq!(list(&items, "", ",", " ", false, false).to_string(), "only");
}

#[test]
fn an_empty_list_writes_nothing_even_with_flanks_head_tail_and_template() {
    let items: [SlotValue<Word>; 0] = [];
    let view = ListView {
        items: &items,
        template: "in{}",
        before: "",
        token: ",",
        after: " ",
        leading: true,
        trailing: true,
        head: "\n",
        tail: "\n",
    };
    assert_eq!(view.to_string(), "");
    let none = ListView {
        items: NO_ITEMS,
        template: "in{}",
        before: "",
        token: ",",
        after: "",
        leading: false,
        trailing: false,
        head: "",
        tail: "",
    };
    assert_eq!(none.to_string(), "");
}

#[test]
fn template_is_outside_head_and_tail() {
    let items = [node("a"), node("b")];
    let view = ListView {
        items: &items,
        template: "{{{}}}",
        before: "",
        token: ",",
        after: "",
        leading: false,
        trailing: false,
        head: "\n",
        tail: "\n",
    };
    assert_eq!(view.to_string(), "{\na,b\n}");
}

#[test]
fn optional_elements_still_take_separators() {
    let items = [None, None, Some(node("a"))];
    let view = ListView {
        items: &items,
        template: "{}",
        before: "",
        token: ",",
        after: "",
        leading: false,
        trailing: false,
        head: "",
        tail: "",
    };
    assert_eq!(view.to_string(), ",,a");
}
