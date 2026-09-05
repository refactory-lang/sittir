//! Filter tests — `upper` / `lower` parity with the TypeScript
//! `String.prototype.toUpperCase()` / `.toLowerCase()`, and the list
//! writer: `Joined` composes a separator from three parts and owns the
//! flank rule (between items: before + token + after; leading flank:
//! token + after; trailing flank: before + token).

use sittir_core::filters::{lower, upper, Joined, ListNonterminalView, NonterminalView, Renderable};

fn joined(items: &[Renderable<'_>], before: &str, token: &str, after: &str, leading: bool, trailing: bool) -> String {
    Joined {
        items,
        before,
        token,
        after,
        leading,
        trailing,
        head: "",
        tail: "",
    }
    .to_string()
}

#[test]
fn upper_ascii_matches_ts() {
    let cases = [
        ("", ""),
        ("hello", "HELLO"),
        ("HELLO", "HELLO"),
        ("Hello, World!", "HELLO, WORLD!"),
        ("camelCase", "CAMELCASE"),
    ];
    for (input, expected) in cases {
        assert_eq!(upper(input).unwrap(), expected, "upper({input:?}) mismatch");
    }
}

#[test]
fn lower_ascii_matches_ts() {
    let cases = [
        ("", ""),
        ("HELLO", "hello"),
        ("hello", "hello"),
        ("Hello, World!", "hello, world!"),
        ("CamelCase", "camelcase"),
    ];
    for (input, expected) in cases {
        assert_eq!(lower(input).unwrap(), expected, "lower({input:?}) mismatch");
    }
}

#[test]
fn upper_lower_unicode_matches_ts() {
    assert_eq!(upper("straße").unwrap(), "STRASSE");
    assert_eq!(lower("STRASSE").unwrap(), "strasse");
}

#[test]
fn between_items_writes_before_token_after() {
    let items = [Renderable::Text("a"), Renderable::Text("b"), Renderable::Text("c")];
    assert_eq!(joined(&items, "", ",", " ", false, false), "a, b, c");
    assert_eq!(joined(&items, " ", "|", " ", false, false), "a | b | c");
    assert_eq!(joined(&items, "", "", "\n", false, false), "a\nb\nc");
    assert_eq!(joined(&items, "", "", "", false, false), "abc");
}

#[test]
fn a_leading_flank_writes_token_then_after_only() {
    let items = [Renderable::Text("A"), Renderable::Text("B")];
    assert_eq!(joined(&items, " ", "|", " ", true, false), "| A | B");
    assert_eq!(joined(&items, "", ",", "", true, false), ",A,B");
}

#[test]
fn a_trailing_flank_writes_before_then_token_only() {
    let items = [Renderable::Text("a"), Renderable::Text("b")];
    assert_eq!(joined(&items, "", ",", " ", false, true), "a, b,");
    assert_eq!(joined(&items, " ", "|", " ", false, true), "a | b |");
}

#[test]
fn both_flanks_are_independent() {
    let items = [Renderable::Text("a")];
    assert_eq!(joined(&items, "", ";", "", true, true), ";a;");
    assert_eq!(joined(&items, "", ",", " ", true, true), ", a,");
}

#[test]
fn a_single_item_writes_no_separator() {
    let items = [Renderable::Text("only")];
    assert_eq!(joined(&items, "", ",", " ", false, false), "only");
}

#[test]
fn an_empty_list_writes_nothing_even_with_flanks() {
    let items: [Renderable<'_>; 0] = [];
    assert_eq!(joined(&items, "", ",", " ", true, true), "");
}

#[test]
fn empty_string_items_still_take_separators() {
    let items = [Renderable::Text(""), Renderable::Text(""), Renderable::Text("a")];
    assert_eq!(joined(&items, "", ",", "", false, false), ",,a");
}

#[test]
fn listview_renders_through_the_same_writer() {
    let items = [Renderable::Text("foo"), Renderable::Text("bar")];
    let view = ListNonterminalView {
        items: &items,
        before: "",
        token: ",",
        after: " ",
        leading: false,
        trailing: true,
        head: "",
        tail: "",
    };
    assert_eq!(view.to_string(), "foo, bar,");
}

#[test]
fn fieldview_one_holds_renderable() {
    let view = NonterminalView::One(Renderable::Text("hello"));
    assert_eq!(view.to_string(), "hello");
}

#[test]
fn fieldview_missing_renders_empty() {
    let view: NonterminalView<'_> = NonterminalView::Missing;
    assert_eq!(view.to_string(), "");
}
