use std::collections::HashMap;
use std::sync::Arc;

use sittir_core::classify::{classify_list_gaps, classify_whitespace, majority, split_gap};
use sittir_core::engine::encode_handle;
use sittir_core::render::{SourceTable, WhitespaceTable};
use sittir_core::types::Span;
use sittir_core::NodeCoordinate;

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
    dedent: DEDENT,
};
const ALL: &[u16] = &[TIGHT, SPACE, NEWLINE, BLANKLINE, INDENT, DEDENT];

struct Sources(HashMap<u32, Arc<str>>);
impl SourceTable for Sources {
    fn source_of(&self, tree_id: u32) -> Option<&Arc<str>> {
        self.0.get(&tree_id)
    }
}

fn coord(tree: u32, start: u32, end: u32) -> NodeCoordinate {
    NodeCoordinate::new(encode_handle(tree, 0), Span { start, end })
}

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
fn a_separated_gap_splits_around_its_outermost_tokens() {
    assert_eq!(split_gap(" , ", ","), Some((" ", " ")));
    assert_eq!(split_gap(",\n", ","), Some(("", "\n")));
    // A replaced item between two survivors leaves two separators in one gap;
    // the sides are the text outside them.
    assert_eq!(split_gap(",b,", ","), Some(("", "")));
    assert_eq!(split_gap(", b , ", ","), Some(("", " ")));
    assert_eq!(split_gap("\n", ","), None);
    assert_eq!(split_gap("\n\n", ""), Some(("\n\n", "")));
}

#[test]
fn majority_is_the_most_frequent_class_and_the_first_seen_wins_a_tie() {
    assert_eq!(majority([NEWLINE, BLANKLINE, NEWLINE]), Some(NEWLINE));
    assert_eq!(majority([BLANKLINE, NEWLINE]), Some(BLANKLINE));
    assert_eq!(majority([NEWLINE, BLANKLINE]), Some(NEWLINE));
    assert_eq!(majority([]), None);
}

#[test]
fn a_comma_list_takes_the_majority_of_its_gaps_per_side() {
    //            0123456789012
    let source = "f(a, b, c ,d)";
    let sources = Sources(HashMap::from([(1, Arc::from(source))]));
    let (a, b, c, d) = (
        coord(1, 2, 3),
        coord(1, 5, 6),
        coord(1, 8, 9),
        coord(1, 11, 12),
    );
    let items = [Some(&a), Some(&b), Some(&c), Some(&d)];
    // gaps: ", " -> ("", " ") | ", " -> ("", " ") | " ," -> (" ", "")
    // before: [TIGHT, TIGHT, SPACE] -> TIGHT ; after: [SPACE, SPACE, TIGHT] -> SPACE
    assert_eq!(
        classify_list_gaps(&items, &sources, ",", ALL, ALL, &TABLE),
        (Some(TIGHT), Some(SPACE))
    );
}

#[test]
fn a_replaced_item_is_measured_across_by_its_surviving_neighbours() {
    //            012345678
    let source = "f(a,b,c);";
    let sources = Sources(HashMap::from([(1, Arc::from(source))]));
    let (a, c) = (coord(1, 2, 3), coord(1, 6, 7));
    // `b` was replaced, so it carries no coordinate.
    let items = [Some(&a), None, Some(&c)];
    assert_eq!(
        classify_list_gaps(&items, &sources, ",", ALL, ALL, &TABLE),
        (Some(TIGHT), Some(TIGHT))
    );
}

#[test]
fn an_unseparated_repeat_classifies_the_whole_gap_on_one_side() {
    //            0 1 2 3 4 5 6 7 8 9 ...
    let source = "{\n  a;\n\n  b;\n  c;\n}";
    let sources = Sources(HashMap::from([(1, Arc::from(source))]));
    let (a, b, c) = (coord(1, 4, 6), coord(1, 10, 12), coord(1, 15, 17));
    let items = [Some(&a), Some(&b), Some(&c)];
    // gaps: "\n\n  " -> BLANKLINE | "\n  " -> NEWLINE ; tie broken by first seen
    assert_eq!(
        classify_list_gaps(&items, &sources, "", ALL, &[], &TABLE),
        (Some(BLANKLINE), None)
    );
}

#[test]
fn a_pair_that_is_not_two_ordered_coordinates_of_one_tree_contributes_nothing() {
    let sources = Sources(HashMap::from([
        (1, Arc::from("a, b")),
        (2, Arc::from("x,y")),
    ]));
    let (a, b, x) = (coord(1, 0, 1), coord(1, 3, 4), coord(2, 0, 1));
    assert_eq!(
        classify_list_gaps(&[Some(&b), Some(&a)], &sources, ",", ALL, ALL, &TABLE),
        (None, None)
    );
    assert_eq!(
        classify_list_gaps(&[Some(&a), Some(&x)], &sources, ",", ALL, ALL, &TABLE),
        (None, None)
    );
    assert_eq!(
        classify_list_gaps(&[Some(&a)], &sources, ",", ALL, ALL, &TABLE),
        (None, None)
    );
    assert_eq!(
        classify_list_gaps(&[], &sources, ",", ALL, ALL, &TABLE),
        (None, None)
    );
}
