//! Views: one `View` over any slot shape with the template's literal text
//! around it, one `ListView` over a slice with the separator parts, head and
//! tail spacing, and the list's own template.

use sittir_core::render::{render_to_string, Render, RenderResult, RenderSink, WhitespaceTable};
use sittir_core::spacing::WordMatcher;
use sittir_core::view::{ListView, View, NO_ITEMS};
use sittir_core::SlotValue;

const TIGHT: u16 = 1;
const SPACE: u16 = 2;
const NEWLINE: u16 = 3;
const BLANK: u16 = 4;
const INDENT: u16 = 5;
const DEDENT: u16 = 6;
fn text_of(kind: u16) -> &'static str {
    match kind {
        TIGHT => "",
        SPACE => " ",
        NEWLINE => "\n",
        BLANK => "\n\n",
        INDENT | DEDENT => "\n",
        _ => "",
    }
}
const TABLE: WhitespaceTable = WhitespaceTable {
    text_of,
    indent: INDENT,
    dedent: DEDENT,
};

fn rt(value: &dyn Render) -> String {
    render_to_string(value, WordMatcher::default_ident(), &TABLE, "    ").unwrap()
}

struct Word(&'static str);
impl Render for Word {
    fn render(&self, w: &mut dyn RenderSink) -> RenderResult {
        w.text(self.0)
    }
}

fn node(s: &'static str) -> SlotValue<Word> {
    SlotValue::Node(Word(s))
}

#[test]
fn a_present_optional_writes_prefix_value_suffix() {
    let slot = Some(node("T"));
    assert_eq!(rt(&View::new(&slot, "->{}")), "->T");
    assert_eq!(rt(&View::new(&slot, "{}")), "T");
    assert_eq!(rt(&View::new(&slot, "<{}>")), "<T>");
}

#[test]
fn a_missing_optional_writes_nothing_flanks_included() {
    let slot: Option<SlotValue<Word>> = None;
    assert_eq!(rt(&View::new(&slot, "->{}")), "");
}

#[test]
fn a_required_slot_is_render_on_its_own() {
    assert_eq!(rt(&node("x")), "x");
    assert_eq!(rt(&SlotValue::<Word>::Verbatim("raw".into())), "raw");
}

#[test]
fn an_optional_reference_is_a_slot() {
    let owned = node("v");
    let slot: Option<&SlotValue<Word>> = Some(&owned);
    assert_eq!(rt(&View::new(slot, "={}")), "=v");
    let none: Option<&SlotValue<Word>> = None;
    assert_eq!(rt(&View::new(none, "={}")), "");
}

#[test]
fn a_boolean_writes_its_placeholder_free_template_when_true() {
    assert_eq!(rt(&View::new(&Some(true), "[^+*?]+")), "[^+*?]+");
    assert_eq!(rt(&View::new(&Some(false), "[^+*?]+")), "");
    assert_eq!(rt(&View::new(&None::<bool>, "[^+*?]+")), "");
}

#[test]
fn text_slots_write_their_text_even_when_empty() {
    assert_eq!(rt(&View::new(&Some(String::new()), "'{}'")), "''");
    assert_eq!(rt(&View::new(&Some("s".to_string()), "'{}'")), "'s'");
    assert_eq!(rt(&View::new(&None::<String>, "'{}'")), "");
    assert_eq!(rt(&View::new(&"t".to_string(), "{}")), "t");
}

#[test]
fn braces_are_escaped_as_in_write() {
    let slot = Some(node("b"));
    assert_eq!(rt(&View::new(&slot, "{{{}}}")), "{b}");
    assert_eq!(rt(&View::new(&slot, "{{}}{}")), "{}b");
    assert_eq!(rt(&View::new(&Some(true), "{{}}")), "{}");
}

#[test]
fn presence_follows_the_slot_shape() {
    assert!(View::new(&Some(node("x")), "{}").is_present());
    assert!(!View::new(&None::<SlotValue<Word>>, "{}").is_present());
    assert!(!View::new(&Some(false), "kw").is_present());
    assert!(View::new(&Some(true), "kw").is_present());
    let items = [node("a")];
    assert!(list(&items, TIGHT, "", TIGHT, false, false).is_present());
    assert!(!list(&[], TIGHT, "", TIGHT, false, false).is_present());
}

fn list<'a>(
    items: &'a [SlotValue<Word>],
    before: u16,
    token: &'a str,
    after: u16,
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
        head: 0,
        tail: 0,
    }
}

#[test]
fn between_items_writes_before_token_after() {
    let items = [node("a"), node("b"), node("c")];
    assert_eq!(
        rt(&list(&items, TIGHT, ",", SPACE, false, false)),
        "a, b, c"
    );
    assert_eq!(
        rt(&list(&items, SPACE, "|", SPACE, false, false)),
        "a | b | c"
    );
    assert_eq!(
        rt(&list(&items, TIGHT, "", NEWLINE, false, false)),
        "a\nb\nc"
    );
    // "a"/"b"/"c" are each their own token with no separator: the writer
    // still inserts the lexically required space at that word/word seam.
    assert_eq!(rt(&list(&items, TIGHT, "", TIGHT, false, false)), "a b c");
}

#[test]
fn a_leading_flank_writes_token_then_after_only() {
    let items = [node("A"), node("B")];
    assert_eq!(
        rt(&list(&items, SPACE, "|", SPACE, true, false)),
        "| A | B"
    );
    assert_eq!(rt(&list(&items, TIGHT, ",", TIGHT, true, false)), ",A,B");
}

#[test]
fn a_trailing_flank_writes_before_then_token_only() {
    let items = [node("a"), node("b")];
    assert_eq!(rt(&list(&items, TIGHT, ",", SPACE, false, true)), "a, b,");
    assert_eq!(
        rt(&list(&items, SPACE, "|", SPACE, false, true)),
        "a | b |"
    );
}

#[test]
fn both_flanks_are_independent() {
    let items = [node("a")];
    assert_eq!(rt(&list(&items, TIGHT, ";", TIGHT, true, true)), ";a;");
    assert_eq!(rt(&list(&items, TIGHT, ",", SPACE, true, true)), ", a,");
}

#[test]
fn a_single_item_writes_no_separator() {
    let items = [node("only")];
    assert_eq!(rt(&list(&items, TIGHT, ",", SPACE, false, false)), "only");
}

#[test]
fn an_empty_list_writes_nothing_even_with_flanks_head_tail_and_template() {
    let items: [SlotValue<Word>; 0] = [];
    let view = ListView {
        items: &items,
        template: "in{}",
        before: TIGHT,
        token: ",",
        after: SPACE,
        leading: true,
        trailing: true,
        head: NEWLINE,
        tail: NEWLINE,
    };
    assert_eq!(rt(&view), "");
    let none = ListView {
        items: NO_ITEMS,
        template: "in{}",
        before: TIGHT,
        token: ",",
        after: TIGHT,
        leading: false,
        trailing: false,
        head: 0,
        tail: 0,
    };
    assert_eq!(rt(&none), "");
}

#[test]
fn template_is_outside_head_and_tail() {
    let items = [node("a"), node("b")];
    let view = ListView {
        items: &items,
        template: "{{{}}}",
        before: TIGHT,
        token: ",",
        after: TIGHT,
        leading: false,
        trailing: false,
        head: NEWLINE,
        tail: NEWLINE,
    };
    assert_eq!(rt(&view), "{\na,b\n}");
}

#[test]
fn optional_elements_still_take_separators() {
    let items = [None, None, Some(node("a"))];
    let view = ListView {
        items: &items,
        template: "{}",
        before: TIGHT,
        token: ",",
        after: TIGHT,
        leading: false,
        trailing: false,
        head: 0,
        tail: 0,
    };
    assert_eq!(rt(&view), ",,a");
}
