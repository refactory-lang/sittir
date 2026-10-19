use sittir_core::KindId;
use sittir_core::classify::classify_whitespace;

use sittir_core::render::WhitespaceTable;

const TIGHT: KindId = KindId(167);
const SPACE: KindId = KindId(168);
const NEWLINE: KindId = KindId(169);
const BLANKLINE: KindId = KindId(170);
const INDENT: KindId = KindId(171);
const DEDENT: KindId = KindId(172);

fn text_of(kind: KindId) -> &'static str {
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
    dedent: DEDENT, leaf_edges: &[], gaps: &[(1, KindId(167)), (2, KindId(168)), (8, KindId(169)), (16, KindId(170))]
};
const ALL: &[KindId] = &[TIGHT, SPACE, NEWLINE, BLANKLINE, INDENT, DEDENT];



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
fn a_run_spelled_as_an_arm_is_that_arm_before_any_other_of_its_rank() {
    const TAB: KindId = KindId(173);
    fn with_tab(kind: KindId) -> &'static str {
        if kind == TAB { "\t" } else { text_of(kind) }
    }
    let table = WhitespaceTable { text_of: with_tab, ..TABLE };
    assert_eq!(classify_whitespace("\t", &[TIGHT, SPACE, TAB], &table), Some(TAB));
    assert_eq!(classify_whitespace(" ", &[TIGHT, SPACE, TAB], &table), Some(SPACE));
    assert_eq!(classify_whitespace("  \t", &[TIGHT, SPACE, TAB], &table), Some(SPACE));
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

use sittir_core::classify::{classify_gap, geometry_gap, GeometryGap};
use sittir_core::points::{Point, PointSpan};

const fn s(r0: u32, c0: u32, r1: u32, c1: u32) -> PointSpan {
    PointSpan { start: Point { row: r0, column: c0 }, end: Point { row: r1, column: c1 } }
}

#[test]
fn a_same_row_gap_is_its_columns() {
    assert_eq!(geometry_gap(&s(0, 0, 0, 1), &s(0, 2, 0, 3)), GeometryGap { breaks: 0, spaces: 1 });
    assert_eq!(geometry_gap(&s(0, 0, 0, 1), &s(0, 1, 0, 2)), GeometryGap { breaks: 0, spaces: 0 });
}

#[test]
fn a_gap_across_rows_is_a_break_per_row_and_the_next_rows_indentation() {
    assert_eq!(geometry_gap(&s(0, 0, 0, 3), &s(2, 4, 2, 5)), GeometryGap { breaks: 2, spaces: 4 });
}

#[test]
fn a_gap_across_a_crlf_row_is_one_break() {
    // "a\r\nb": `a` ends at column 1, before the `\r`; `b` starts on row 1.
    assert_eq!(geometry_gap(&s(0, 0, 0, 1), &s(1, 0, 1, 1)), GeometryGap { breaks: 1, spaces: 0 });
}

#[test]
fn a_span_ending_with_its_line_break_ends_on_the_row_it_closes() {
    assert_eq!(geometry_gap(&s(0, 0, 1, 0), &s(1, 0, 1, 1)), GeometryGap { breaks: 1, spaces: 0 });
}

#[test]
fn a_gap_after_a_multi_byte_char_counts_bytes() {
    // "é = 1": `é` is two bytes, and `=` starts at byte column 3.
    assert_eq!(geometry_gap(&s(0, 0, 0, 2), &s(0, 3, 0, 4)), GeometryGap { breaks: 0, spaces: 1 });
}

#[test]
fn a_geometry_gap_classifies_as_its_text_does() {
    let gaps = [(0, 0), (0, 1), (0, 4), (1, 0), (1, 4), (2, 0), (2, 8), (3, 0), (9, 2)];
    for (breaks, spaces) in gaps {
        let gap = GeometryGap { breaks, spaces };
        let text = "\n".repeat(breaks as usize) + &" ".repeat(spaces as usize);
        assert_eq!(classify_gap(gap, ALL, &TABLE), classify_whitespace(&text, ALL, &TABLE), "{gap:?}");
    }
}

#[test]
fn a_gap_of_any_size_classifies_from_its_counts() {
    let widest = GeometryGap { breaks: u32::MAX, spaces: u32::MAX };
    assert_eq!(classify_gap(widest, ALL, &TABLE), classify_whitespace("\n\n\n\n", ALL, &TABLE), "the widest admitted arm below it");
    assert_eq!(classify_gap(GeometryGap { breaks: 0, spaces: u32::MAX }, ALL, &TABLE), classify_whitespace("  ", ALL, &TABLE));
}
