//! `apply_edits` table-driven tests. Spec 012 T026.
//!
//! Covers: single edit, multiple non-overlapping edits, and the three
//! edge cases called out by data-model §3 — pure insertion
//! (`start == end`), append at `end == source.len()`, and whole-source
//! replace. Validation paths (out-of-range, reversed edit, UTF-8
//! boundary) are each asserted once.

use sittir_core::splice::{apply_edits, SpliceError};
use sittir_core::types::Edit;

/// Convenience: build an `Edit` from primitives.
fn edit(start: u32, end: u32, text: &str) -> Edit {
    Edit {
        start_pos: start,
        end_pos: end,
        inserted_text: text.to_string(),
    }
}

#[test]
fn single_edit_replaces_range() {
    let src = "hello world";
    let out = apply_edits(src, vec![edit(6, 11, "there")]).expect("applied");
    assert_eq!(out, "hello there");
}

#[test]
fn multiple_non_overlapping_edits_apply_descending() {
    // Edits supplied in ascending order; function must sort + apply
    // descending so earlier edits don't shift later offsets.
    let src = "a b c d";
    let edits = vec![
        edit(0, 1, "A"),
        edit(2, 3, "B"),
        edit(4, 5, "C"),
        edit(6, 7, "D"),
    ];
    let out = apply_edits(src, edits).expect("applied");
    assert_eq!(out, "A B C D");
}

#[test]
fn insert_at_start_equal_end_is_pure_insertion() {
    let src = "world";
    let out = apply_edits(src, vec![edit(0, 0, "hello ")]).expect("applied");
    assert_eq!(out, "hello world");
}

#[test]
fn append_at_source_len_is_pure_append() {
    let src = "hello";
    let len = src.len() as u32;
    let out = apply_edits(src, vec![edit(len, len, " world")]).expect("applied");
    assert_eq!(out, "hello world");
}

#[test]
fn whole_source_replace() {
    let src = "keep me? no.";
    let len = src.len() as u32;
    let out = apply_edits(src, vec![edit(0, len, "fresh")]).expect("applied");
    assert_eq!(out, "fresh");
}

#[test]
fn empty_edits_returns_source_unchanged() {
    let src = "nothing to do";
    let out = apply_edits(src, vec![]).expect("applied");
    assert_eq!(out, src);
}

#[test]
fn empty_source_append() {
    let out = apply_edits("", vec![edit(0, 0, "hi")]).expect("applied");
    assert_eq!(out, "hi");
}

#[test]
fn invalid_range_rejected() {
    let err = apply_edits("abc", vec![edit(2, 1, "x")]).expect_err("must reject");
    assert!(matches!(err, SpliceError::InvalidRange { start: 2, end: 1 }));
}

#[test]
fn out_of_bounds_end_rejected() {
    let err = apply_edits("abc", vec![edit(0, 99, "x")]).expect_err("must reject");
    assert!(matches!(
        err,
        SpliceError::OutOfBounds { end: 99, source_len: 3 }
    ));
}

#[test]
fn non_char_boundary_rejected() {
    // "é" is two bytes in UTF-8 (0xC3 0xA9). Splitting at byte 1 lands
    // mid-codepoint.
    let src = "é";
    assert_eq!(src.len(), 2);
    let err = apply_edits(src, vec![edit(1, 2, "x")]).expect_err("must reject");
    assert!(matches!(err, SpliceError::NonCharBoundary { .. }));
}

#[test]
fn multiple_inserts_at_same_offset_apply_in_order() {
    // Two pure insertions at offset 3 — tie-break: longer insertion
    // applies first (i.e. the edit with the larger end; both have
    // end == start here, so secondary sort degenerates to insertion
    // order — output is still well-defined).
    let src = "abcdef";
    let out = apply_edits(src, vec![edit(3, 3, "X"), edit(3, 3, "Y")]).expect("applied");
    // One edit replaces `""` with "X" or "Y" first; the other then
    // inserts before that. Either `abcXYdef` or `abcYXdef` is
    // acceptable — the guarantee is overlap-free edits produce
    // consistent output; same-offset inserts are a documented
    // consumer-owned tie (contracts/napi-api.md applyEdits §).
    assert!(
        out == "abcXYdef" || out == "abcYXdef",
        "unexpected output for same-offset inserts: {out}"
    );
}

#[test]
fn descending_and_ascending_supply_produce_identical_output() {
    // Supplying the same edits in different input orders must produce
    // byte-identical results — proves the internal sort is stable on
    // the relevant axis (start_pos desc).
    let src = "xxxxxxxx";
    let e1 = vec![edit(0, 1, "A"), edit(3, 4, "B"), edit(6, 7, "C")];
    let e2 = vec![edit(6, 7, "C"), edit(3, 4, "B"), edit(0, 1, "A")];
    let out1 = apply_edits(src, e1).expect("applied");
    let out2 = apply_edits(src, e2).expect("applied");
    assert_eq!(out1, out2);
    assert_eq!(out1, "AxxBxxCx");
}

#[test]
fn utf8_safe_replacement_through_multibyte_region() {
    let src = "hello, é world";
    // Replace "é " (bytes 7..10, "é" is 2 bytes + space) with "X ".
    let e_bytes = "é".len() as u32; // 2
    let start = 7u32;
    let end = start + e_bytes + 1;
    let out = apply_edits(src, vec![edit(start, end, "X ")]).expect("applied");
    assert_eq!(out, "hello, X world");
}
