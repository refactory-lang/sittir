use sittir_core::classify::classify_whitespace;

use sittir_core::render::WhitespaceTable;

const TIGHT: u16 = 167;
const SPACE: u16 = 168;
const NEWLINE: u16 = 169;
const BLANKLINE: u16 = 170;
const INDENT: u16 = 171;
const DEDENT: u16 = 172;

fn text_of(kind: u16) -> &'static str {
    match kind {
        TIGHT => "",
        SPACE => " ",
        NEWLINE | INDENT | DEDENT => "\n",
        BLANKLINE => "\n\n",
        _ => "",
    }
}
const TABLE: WhitespaceTable = WhitespaceTable {
    text_of,
    indent: INDENT,
    dedent: DEDENT, leaf_edges: &[], gaps: &[(1, 167), (2, 168), (8, 169), (16, 170)]
};
const ALL: &[u16] = &[TIGHT, SPACE, NEWLINE, BLANKLINE, INDENT, DEDENT];



#[test]
fn whitespace_classifies_by_seam_rank_and_never_to_a_depth_arm() {
    assert_eq!(classify_whitespace("", ALL, &TABLE), Some(TIGHT));
    assert_eq!(classify_whitespace("  \t", ALL, &TABLE), Some(SPACE));
    assert_eq!(classify_whitespace("\n", ALL, &TABLE), Some(NEWLINE));
    assert_eq!(classify_whitespace("\n    ", ALL, &TABLE), Some(NEWLINE));
    assert_eq!(classify_whitespace("\n\n", ALL, &TABLE), Some(BLANKLINE));
    // Wider than anything admitted: the widest admitted arm below it.
    assert_eq!(
        classify_whitespace("\n\n\n\n", ALL, &TABLE),
        Some(BLANKLINE)
    );
    assert_eq!(
        classify_whitespace("\n\n", &[TIGHT, NEWLINE], &TABLE),
        Some(NEWLINE)
    );
    // The depth arms spell "\n" too, and are still never a gap's class.
    assert_eq!(classify_whitespace("\n", &[INDENT, DEDENT], &TABLE), None);
}

#[test]
fn text_that_is_not_whitespace_has_no_class() {
    assert_eq!(classify_whitespace("b", ALL, &TABLE), None);
    assert_eq!(classify_whitespace(" x ", ALL, &TABLE), None);
}

#[test]
fn a_carriage_return_is_a_line_break_whatever_its_spelling() {
    assert_eq!(classify_whitespace("\r\n", ALL, &TABLE), Some(NEWLINE));
    assert_eq!(classify_whitespace("\r\n\r\n", ALL, &TABLE), Some(BLANKLINE));
    assert_eq!(classify_whitespace("\r", ALL, &TABLE), Some(NEWLINE));
    assert_eq!(classify_whitespace("\r\r", ALL, &TABLE), Some(BLANKLINE));
    assert_eq!(classify_whitespace("\r\n    ", ALL, &TABLE), Some(NEWLINE));
}

use sittir_core::classify::{geometry_gap_sides, geometry_gap_text};
use sittir_core::points::{Point, PointSpan};

const fn s(r0: u32, c0: u32, r1: u32, c1: u32) -> PointSpan {
    PointSpan { start: Point { row: r0, column: c0 }, end: Point { row: r1, column: c1 } }
}

#[test]
fn a_same_row_gap_is_its_columns() {
    assert_eq!(geometry_gap_text(&s(0, 0, 0, 1), &s(0, 2, 0, 3)), " ");
    assert_eq!(geometry_gap_text(&s(0, 0, 0, 1), &s(0, 1, 0, 2)), "");
}

#[test]
fn a_gap_across_rows_is_a_break_per_row_and_the_next_rows_indentation() {
    assert_eq!(geometry_gap_text(&s(0, 0, 0, 3), &s(2, 4, 2, 5)), "\n\n    ");
}

#[test]
fn a_gap_across_a_crlf_row_is_one_break() {
    // "a\r\nb": `a` ends at column 1, before the `\r`; `b` starts on row 1.
    assert_eq!(geometry_gap_text(&s(0, 0, 0, 1), &s(1, 0, 1, 1)), "\n");
}

#[test]
fn a_span_ending_with_its_line_break_ends_on_the_row_it_closes() {
    assert_eq!(geometry_gap_text(&s(0, 0, 1, 0), &s(1, 0, 1, 1)), "\n");
}

#[test]
fn a_gap_after_a_multi_byte_char_counts_bytes() {
    // "é = 1": `é` is two bytes, and `=` starts at byte column 3.
    assert_eq!(geometry_gap_text(&s(0, 0, 0, 2), &s(0, 3, 0, 4)), " ");
}

#[test]
fn a_separator_sits_against_the_earlier_item() {
    // "a, b": the separator's column is the gap's first.
    assert_eq!(geometry_gap_sides(&s(0, 0, 0, 1), &s(0, 3, 0, 4), ","), (String::new(), " ".to_owned()));
    // "a,\n  b": across rows, the whole gap follows the separator.
    assert_eq!(geometry_gap_sides(&s(0, 0, 0, 1), &s(1, 2, 1, 3), ","), (String::new(), "\n  ".to_owned()));
    // With no separator the whole gap is the side before.
    assert_eq!(geometry_gap_sides(&s(0, 0, 0, 1), &s(0, 3, 0, 4), ""), ("  ".to_owned(), String::new()));
}
