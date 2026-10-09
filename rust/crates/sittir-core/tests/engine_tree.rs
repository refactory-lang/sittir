//! The tree queries the engine answers outside a read: the node a span and
//! kind name, the regions of a source that did not parse, and a list's last
//! child.

use sittir_core::types::Span;
use sittir_core::{ErrorRegion, ErrorRegionKind};

fn parse_tree(language: tree_sitter::Language, source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&language).expect("set language");
    parser.parse(source, None).expect("parse succeeds")
}

/// Every node of a parse, asked for by its span and either kind it carries (the
/// grammar symbol that parsed it, or the kind it shows as), is the node a
/// pre-order walk meets first with that span and kind: the outermost one, and
/// among zero-width siblings at one byte the first. The sources hold
/// zero-width comment contents and aliased type identifiers.
#[test]
fn node_at_span_finds_the_first_node_a_pre_order_walk_meets_with_that_span_and_kind() {
    use sittir_core::engine::node_at_span;
    use std::collections::HashMap;
    let sources = [
        include_str!("../src/engine.rs"),
        "\n//!\n\n/*!*/\n\n//\n\n///\nlet x;\n",
        "fn f(\n    x: Foo,\n) -> Bar<T> {\n    let y: Baz = x;\n}\n",
    ];
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&tree_sitter_rust::LANGUAGE.into()).unwrap();
    for source in sources {
        let tree = parser.parse(source, None).unwrap();
        let mut by_span: HashMap<(usize, usize), Vec<tree_sitter::Node<'_>>> = HashMap::new();
        let mut cursor = tree.walk();
        let mut nodes = Vec::new();
        'walk: loop {
            let node = cursor.node();
            nodes.push(node);
            by_span.entry((node.start_byte(), node.end_byte())).or_default().push(node);
            if cursor.goto_first_child() {
                continue;
            }
            while !cursor.goto_next_sibling() {
                if !cursor.goto_parent() {
                    break 'walk;
                }
            }
        }
        for node in &nodes {
            for kind in [node.grammar_id(), node.kind_id()] {
                let expected = by_span[&(node.start_byte(), node.end_byte())]
                    .iter()
                    .find(|candidate| candidate.grammar_id() == kind || candidate.kind_id() == kind)
                    .map(|found| found.id());
                let found = node_at_span(&tree, node.start_byte(), node.end_byte(), kind).map(|found| found.id());
                assert_eq!(found, expected, "{} at {}..{}", node.kind(), node.start_byte(), node.end_byte());
            }
        }
    }
}

#[test]
fn a_clean_parse_has_no_error_regions() {
    let tree = parse_tree(tree_sitter_python::LANGUAGE.into(), "def f():\n    pass\nx = 1\n");
    assert!(sittir_core::error_regions(&tree).is_empty());
}

fn regions_of(language: tree_sitter::Language, source: &str) -> Vec<ErrorRegion> {
    sittir_core::error_regions(&parse_tree(language, source))
}

fn region(kind: ErrorRegionKind, start: u32, end: u32) -> ErrorRegion {
    ErrorRegion { kind, span: Span { start, end } }
}

#[test]
fn a_token_the_parser_inserted_is_an_empty_missing_region() {
    assert_eq!(
        regions_of(tree_sitter_python::LANGUAGE.into(), "def f(:\n    pass\nx = 1\n"),
        vec![region(ErrorRegionKind::Missing, 6, 6)]
    );
}

#[test]
fn source_error_recovery_skipped_is_an_error_region() {
    assert_eq!(
        regions_of(tree_sitter_rust::LANGUAGE.into(), "fn f() { let = 1; }\n"),
        vec![region(ErrorRegionKind::Error, 13, 14)]
    );
}

#[test]
fn an_error_inside_an_error_is_part_of_the_outer_region() {
    assert_eq!(
        regions_of(tree_sitter_python::LANGUAGE.into(), "x = )\ny = (\n"),
        vec![region(ErrorRegionKind::Error, 0, 11)]
    );
}

/// The kind name of the last child, extras aside, of the list spelled `list` in `source`, its own kind `kind`.
fn last_list_child_of(source: &str, list: &str, kind: u16) -> Option<String> {
    let tree = parse_tree(tree_sitter_rust::LANGUAGE.into(), source);
    let start = source.find(list).unwrap();
    sittir_core::engine::last_list_child(&tree, start, start + list.len(), kind).map(|child| child.kind().to_string())
}

#[test]
fn a_list_the_tree_holds_no_node_for_ends_in_its_holder_child_within_its_span() {
    assert_eq!(last_list_child_of("fn f() { g(1, 2,); }\n", "1, 2,", u16::MAX - 1).as_deref(), Some(","));
    assert_eq!(last_list_child_of("fn f() { g(1, 2); }\n", "1, 2", u16::MAX - 1).as_deref(), Some("integer_literal"));
}

#[test]
fn a_comment_in_a_list_span_is_not_its_last_child() {
    assert_eq!(last_list_child_of("fn f() { g(1, 2 // x,\n); }\n", "1, 2 // x,", u16::MAX - 1).as_deref(), Some("integer_literal"));
    assert_eq!(last_list_child_of("fn f() { g(1, 2, /* x */); }\n", "1, 2, /* x */", u16::MAX - 1).as_deref(), Some(","));
}

#[test]
fn a_single_item_list_spanning_its_item_ends_in_that_item() {
    assert_eq!(last_list_child_of("fn f() { g(12); }\n", "12", u16::MAX - 1).as_deref(), Some("integer_literal"));
}

#[test]
fn a_list_the_tree_holds_a_node_for_ends_in_that_node_child() {
    let source = "fn f() { g(1, 2,); }\n";
    let tree = parse_tree(tree_sitter_rust::LANGUAGE.into(), source);
    let arguments = tree.root_node().descendant_for_byte_range(10, 17).unwrap();
    assert_eq!(arguments.kind(), "arguments");
    let last = sittir_core::engine::last_list_child(&tree, 10, 17, arguments.grammar_id()).unwrap();
    assert_eq!(last.kind(), ")");
}
