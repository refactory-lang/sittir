//! Filter parity tests — assert Rust `upper` / `lower` / `joinby` output
//! matches what TS `@sittir/core` produces on the same inputs. Spec 012
//! T013. Table-driven so new cases land as rows, not whole test
//! functions.
//!
//! TS reference for `upper` / `lower` is the built-in
//! `String.prototype.toUpperCase()` / `.toLowerCase()` — ASCII cases
//! are identity; Unicode cases (German ß, Turkish dotless i, etc.)
//! should round-trip deterministically.
//!
//! TS reference for `joinby` is the Nunjucks-env filter family
//! (`join` / `joinWithTrailing` / `joinWithLeading` / `joinWithFlanks`
//! in `packages/core/src/templates/nunjucks-env.ts`) — this single
//! `joinby(sep, leading, trailing)` covers all four by parameterising
//! on the two bools the TS flank-detection resolves from
//! tree-sitter-attached metadata.
//!
//! Task 3 (renderable-native-views): `joinby` now returns
//! `Safe<Joined<'a>>` and `JoinSource` operates over `Renderable`-backed
//! views. The string-slice impls are gone; all call sites use `ListView`
//! constructed with `Renderable::Text(...)` items. The `joinWithTrailing`
//! / `joinWithLeading` / `joinWithFlanks` filters are now Askama
//! macro-generated structs called via the normal Askama call convention —
//! tests call them directly as `joinWithTrailing(&view, &values, sep)`.
//!
//! `tests/views.rs` was merged back into this file and deleted per the
//! Task 3 plan. The three view tests from that file now live at the
//! bottom of this module.

use sittir_core::filters::{joinby, lower, upper, FieldView, ListView, Renderable};

// ---------------------------------------------------------------------------
// Helpers — build a ListView from string literals for use in tests.
// ---------------------------------------------------------------------------

/// Build a stack-local `ListView` from a fixed array of `Renderable::Text`
/// items. The caller must keep `items` alive for the lifetime of the view;
/// use this helper only inside a single test body.
macro_rules! text_view {
    ($sep:expr, $leading:expr, $trailing:expr, $( $s:expr ),* $(,)?) => {{
        let items: &[Renderable<'_>] = &[$( Renderable::Text($s) ),*];
        ListView { items, separator: $sep, leading: $leading, trailing: $trailing }
    }};
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
    // German ß uppercases to SS in JS .toUpperCase() on most engines
    // (stage-3 ECMAScript aligns with Unicode SpecialCasing.txt which
    // Rust's std also follows). The two engines agree here.
    assert_eq!(upper("straße").unwrap(), "STRASSE");
    assert_eq!(lower("STRASSE").unwrap(), "strasse");
}

#[test]
fn joinby_empty_input_produces_empty_output() {
    // filters.rs:58 — was: joinby(&[&str; 0], ...)
    // Now: ListView with empty items slice.
    let view = text_view!(", ", false, false,);
    assert_eq!(joinby(&view, ", ", false, false).unwrap().0.to_string(), "");
    // Flanks on empty input are suppressed — matches TS "flanks only
    // apply when there's content" semantics.
    assert_eq!(joinby(&view, ", ", true, true).unwrap().0.to_string(), "");
}

#[test]
fn joinby_plain_matches_ts_join() {
    // filters.rs:67 — was: joinby(&["a", "b", "c"], ...)
    let view = text_view!(", ", false, false, "a", "b", "c");
    assert_eq!(joinby(&view, ", ", false, false).unwrap().0.to_string(), "a, b, c");
    let view2 = text_view!("", false, false, "a", "b", "c");
    assert_eq!(joinby(&view2, "", false, false).unwrap().0.to_string(), "abc");
    let view3 = text_view!(" | ", false, false, "a", "b", "c");
    assert_eq!(joinby(&view3, " | ", false, false).unwrap().0.to_string(), "a | b | c");
}

#[test]
fn joinby_single_element_no_separator_needed() {
    // filters.rs:76 — was: joinby(&["only"], ...)
    let view = text_view!(", ", false, false, "only");
    assert_eq!(joinby(&view, ", ", false, false).unwrap().0.to_string(), "only");
    // Flanks still apply — a single element with trailing=true gets
    // the separator appended; matches TS joinWithTrailing.
    assert_eq!(joinby(&view, ", ", false, true).unwrap().0.to_string(), "only, ");
    assert_eq!(joinby(&view, ", ", true, false).unwrap().0.to_string(), ", only");
    assert_eq!(joinby(&view, ", ", true, true).unwrap().0.to_string(), ", only, ");
}

#[test]
fn joinby_trailing_matches_ts_joinWithTrailing() {
    // filters.rs:87 — was: joinby(&["a", "b"], ...)
    let view = text_view!(", ", false, false, "a", "b");
    assert_eq!(joinby(&view, ", ", false, true).unwrap().0.to_string(), "a, b, ");
    let view2 = text_view!(";", false, false, "a", "b");
    assert_eq!(joinby(&view2, ";", false, true).unwrap().0.to_string(), "a;b;");
}

#[test]
fn joinby_leading_matches_ts_joinWithLeading() {
    // filters.rs:94 — was: joinby(&["a", "b"], ...)
    let view = text_view!(", ", false, false, "a", "b");
    assert_eq!(joinby(&view, ", ", true, false).unwrap().0.to_string(), ", a, b");
}

#[test]
fn joinby_both_flanks_matches_ts_joinWithFlanks() {
    // filters.rs:100 — was: joinby(&["a", "b"], ...) / joinby(&["x", "y", "z"], ...)
    let view = text_view!(", ", false, false, "a", "b");
    assert_eq!(joinby(&view, ", ", true, true).unwrap().0.to_string(), ", a, b, ");
    let view3 = text_view!("|", false, false, "x", "y", "z");
    assert_eq!(joinby(&view3, "|", true, true).unwrap().0.to_string(), "|x|y|z|");
}

#[test]
fn joinby_preserves_empty_string_elements() {
    // filters.rs:117 — was: joinby(&["", "", "a"], ...)
    // A non-empty slice with empty-string elements still renders with
    // separators between them — matches TS `["","","a"].join(",") == ",,a"`.
    let view = text_view!(",", false, false, "", "", "a");
    assert_eq!(joinby(&view, ",", false, false).unwrap().0.to_string(), ",,a");
}

// -------------------------------------------------------------------
// Flank-aware filter wrappers — TS parity for joinWith{Trailing,Leading,Flanks}
// -------------------------------------------------------------------
//
// The TS Nunjucks env carries flank metadata as side-channel
// properties on the children array (`_leading_anon` /
// `_trailing_anon`). The filter compares against its `sep` arg and
// emits the flank only on a text match. The Rust filters mirror this
// via askama `Values` — `joinWithTrailing` reads `trailing_anon` from
// the per-render value bag, downcasts the `Option<String>` and
// compares with `sep`.
//
// Post-Task 3: `joinWithTrailing` / `joinWithLeading` / `joinWithFlanks`
// return `Safe<Joined<'a>>` — call sites use `.0.to_string()` to
// compare the rendered output.

use sittir_core::filters::{joinWithFlanks, joinWithLeading, joinWithTrailing, FlankValues};

#[test]
fn join_with_trailing_emits_flank_when_anon_text_matches_sep() {
    // filters.rs:140 — updated: &["a", "b"] → ListView
    let values = FlankValues {
        trailing_anon: Some(",".into()),
        ..FlankValues::default()
    };
    let view = text_view!(",", false, false, "a", "b");
    assert_eq!(joinWithTrailing(&view, &values, ",").unwrap().0.to_string(), "a,b,");
}

#[test]
fn join_with_trailing_skips_flank_when_anon_text_differs() {
    // `;`-anon flanking a `,`-joined list contributes nothing.
    // filters.rs:152 — updated: &["a", "b"] → ListView
    let values = FlankValues {
        trailing_anon: Some(";".into()),
        ..FlankValues::default()
    };
    let view = text_view!(",", false, false, "a", "b");
    assert_eq!(joinWithTrailing(&view, &values, ",").unwrap().0.to_string(), "a,b");
}

#[test]
fn join_with_trailing_skips_flank_when_anon_absent() {
    // Default ctx has trailing_anon: None — degrades to plain join.
    // filters.rs:162 — updated: &["a", "b"] → ListView
    let values = FlankValues::default();
    let view = text_view!(",", false, false, "a", "b");
    assert_eq!(joinWithTrailing(&view, &values, ",").unwrap().0.to_string(), "a,b");
}

#[test]
fn join_with_leading_mirrors_trailing_semantics() {
    // filters.rs:169 — updated: &["a", "b"] → ListView
    let values = FlankValues {
        leading_anon: Some(",".into()),
        ..FlankValues::default()
    };
    let view = text_view!(",", false, false, "a", "b");
    assert_eq!(joinWithLeading(&view, &values, ",").unwrap().0.to_string(), ",a,b");
}

#[test]
fn join_with_flanks_independent_per_side() {
    // Only one flank set — only that side emits.
    // filters.rs:179 — updated: &["a"] → ListView
    let values = FlankValues {
        trailing_anon: Some(",".into()),
        leading_anon: None,
    };
    let view = text_view!(",", false, false, "a");
    assert_eq!(joinWithFlanks(&view, &values, ",").unwrap().0.to_string(), "a,");
}

#[test]
fn join_with_flanks_both_sides_match() {
    // filters.rs:189 — updated: &["a", "b"] → ListView
    let values = FlankValues {
        trailing_anon: Some(",".into()),
        leading_anon: Some(",".into()),
    };
    let view = text_view!(",", false, false, "a", "b");
    assert_eq!(joinWithFlanks(&view, &values, ",").unwrap().0.to_string(), ",a,b,");
}

// -------------------------------------------------------------------
// Task 3 — new streaming joinby tests (must FAIL before reshape, PASS after)
// -------------------------------------------------------------------

#[test]
fn joinby_returns_streaming_safe_joined() {
    let items = [Renderable::Text("a"), Renderable::Text("b"), Renderable::Text("c")];
    let view = ListView { items: &items, separator: ", ", leading: false, trailing: false };
    let safe: askama::filters::Safe<sittir_core::filters::Joined<'_>> =
        joinby(&view, ", ", false, false).expect("joinby");
    assert_eq!(safe.0.to_string(), "a, b, c");
}

#[test]
fn joinby_with_flanks_streams_through_safe() {
    let items = [Renderable::Text("x")];
    let view = ListView { items: &items, separator: ";", leading: false, trailing: false };
    let safe = joinby(&view, ";", true, true).expect("joinby");
    assert_eq!(safe.0.to_string(), ";x;");
}

// -------------------------------------------------------------------
// Task 2 / views.rs tests — merged back from tests/views.rs (deleted)
// -------------------------------------------------------------------

#[test]
fn listview_holds_renderables() {
    let items = [Renderable::Text("foo"), Renderable::Text("bar")];
    let view = ListView { items: &items, separator: ", ", leading: false, trailing: false };
    assert_eq!(view.to_string(), "foo, bar");
}

#[test]
fn fieldview_one_holds_renderable() {
    let view = FieldView::One(Renderable::Text("hello"));
    assert_eq!(view.to_string(), "hello");
}

#[test]
fn fieldview_missing_renders_empty() {
    let view: FieldView<'_> = FieldView::Missing;
    assert_eq!(view.to_string(), "");
}
