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
