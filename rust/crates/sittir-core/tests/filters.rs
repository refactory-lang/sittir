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

use sittir_core::filters::{joinby, lower, upper};

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
        assert_eq!(
            upper(input).unwrap(),
            expected,
            "upper({input:?}) mismatch"
        );
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
        assert_eq!(
            lower(input).unwrap(),
            expected,
            "lower({input:?}) mismatch"
        );
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
    let empty: [&str; 0] = [];
    assert_eq!(joinby(&empty, ", ", false, false).unwrap(), "");
    // Flanks on empty input are suppressed — matches TS "flanks only
    // apply when there's content" semantics.
    assert_eq!(joinby(&empty, ", ", true, true).unwrap(), "");
}

#[test]
fn joinby_plain_matches_ts_join() {
    // TS: value.join(sep)
    let xs = ["a", "b", "c"];
    assert_eq!(joinby(&xs, ", ", false, false).unwrap(), "a, b, c");
    assert_eq!(joinby(&xs, "", false, false).unwrap(), "abc");
    assert_eq!(joinby(&xs, " | ", false, false).unwrap(), "a | b | c");
}

#[test]
fn joinby_single_element_no_separator_needed() {
    let xs = ["only"];
    assert_eq!(joinby(&xs, ", ", false, false).unwrap(), "only");
    // Flanks still apply — a single element with trailing=true gets
    // the separator appended; matches TS joinWithTrailing.
    assert_eq!(joinby(&xs, ", ", false, true).unwrap(), "only, ");
    assert_eq!(joinby(&xs, ", ", true, false).unwrap(), ", only");
    assert_eq!(joinby(&xs, ", ", true, true).unwrap(), ", only, ");
}

#[test]
fn joinby_trailing_matches_ts_joinWithTrailing() {
    // TS: arr.join(sep) + (trailing ? sep : "")
    let xs = ["a", "b"];
    assert_eq!(joinby(&xs, ", ", false, true).unwrap(), "a, b, ");
    assert_eq!(joinby(&xs, ";", false, true).unwrap(), "a;b;");
}

#[test]
fn joinby_leading_matches_ts_joinWithLeading() {
    // TS: (leading ? sep : "") + arr.join(sep)
    let xs = ["a", "b"];
    assert_eq!(joinby(&xs, ", ", true, false).unwrap(), ", a, b");
}

#[test]
fn joinby_both_flanks_matches_ts_joinWithFlanks() {
    let xs = ["a", "b"];
    assert_eq!(joinby(&xs, ", ", true, true).unwrap(), ", a, b, ");
    let xs3 = ["x", "y", "z"];
    assert_eq!(joinby(&xs3, "|", true, true).unwrap(), "|x|y|z|");
}

#[test]
fn joinby_accepts_owned_strings_too() {
    // AsRef<str> — templates usually pass Vec<String>.
    let xs: Vec<String> = vec!["alpha".into(), "beta".into(), "gamma".into()];
    assert_eq!(joinby(&xs, "+", false, false).unwrap(), "alpha+beta+gamma");
}

#[test]
fn joinby_preserves_empty_string_elements() {
    // A non-empty slice with empty-string elements still renders with
    // separators between them — matches TS `["","","a"].join(",") ==
    // ",,a"`.
    let xs = ["", "", "a"];
    assert_eq!(joinby(&xs, ",", false, false).unwrap(), ",,a");
}
