//! The tree queries the engine answers outside a read: the node a span and
//! kind name, the regions of a source that did not parse, and a list's last
//! child.

use sittir_core::engine::node_at_index;
use sittir_core::layout::LayoutWorkCounter;
use sittir_core::nodes::{Nodes, TreeNodes};
use sittir_core::read::{descendant_count, display_id, grammar_id};
use sittir_core::tree_sitter;
use sittir_core::KindId;
use sittir_core::types::{NodeIndex, Span};
use sittir_core::{ErrorRegion, ErrorRegionKind};

fn parse_tree(language: &tree_sitter::Language, source: &str) -> tree_sitter::Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(language).expect("set language");
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
        let mut by_span: HashMap<(u32, u32), Vec<tree_sitter::Node<'_>>> = HashMap::new();
        let mut cursor = tree.walk();
        let mut nodes = Vec::new();
        'walk: loop {
            let node = cursor.node();
            nodes.push(node);
            let Span { start, end } = Span::of(&node);
            by_span.entry((start, end)).or_default().push(node);
            if cursor.goto_first_child() {
                continue;
            }
            while !cursor.goto_next_sibling() {
                if !cursor.goto_parent() {
                    break 'walk;
                }
            }
        }
        let work = LayoutWorkCounter::default();
        let mut navigation = TreeNodes::new(&tree, source, &work);
        for node in &nodes {
            let span = Span::of(node);
            for kind in [grammar_id(node), display_id(node)] {
                let expected = by_span[&(span.start, span.end)]
                    .iter()
                    .find(|candidate| grammar_id(candidate) == kind || display_id(candidate) == kind)
                    .map(tree_sitter::Node::id);
                let found = node_at_span(&mut navigation, span, kind).and_then(|found| node_at_index(&tree, found.index)).map(|found| found.id());
                assert_eq!(found, expected, "{} at {}..{}", node.kind(), span.start, span.end);
            }
        }
    }
}

#[test]
fn a_clean_parse_has_no_error_regions() {
    assert_eq!(regions_of(&tree_sitter_python::LANGUAGE.into(), "def f():\n    pass\nx = 1\n"), [] as [sittir_core::ErrorRegion; 0]);
}

fn regions_of(language: &tree_sitter::Language, source: &str) -> Vec<ErrorRegion> {
    sittir_core::error_regions(&mut TreeNodes::new(&parse_tree(language, source), source, &LayoutWorkCounter::default()))
}

fn region(kind: ErrorRegionKind, start: u32, end: u32) -> ErrorRegion {
    ErrorRegion { kind, span: Span { start, end } }
}

#[test]
fn a_token_the_parser_inserted_is_an_empty_missing_region() {
    assert_eq!(
        regions_of(&tree_sitter_python::LANGUAGE.into(), "def f(:\n    pass\nx = 1\n"),
        vec![region(ErrorRegionKind::Missing, 6, 6)]
    );
}

#[test]
fn source_error_recovery_skipped_is_an_error_region() {
    assert_eq!(
        regions_of(&tree_sitter_rust::LANGUAGE.into(), "fn f() { let = 1; }\n"),
        vec![region(ErrorRegionKind::Error, 13, 14)]
    );
}

#[test]
fn an_error_inside_an_error_is_part_of_the_outer_region() {
    assert_eq!(
        regions_of(&tree_sitter_python::LANGUAGE.into(), "x = )\ny = (\n"),
        vec![region(ErrorRegionKind::Error, 0, 11)]
    );
}

/// Every node of a parse with a `MISSING` token and an `ERROR`, read back to
/// front and then front to back, answers whether it is `MISSING` and whether
/// it holds an error through the tree backer as the tree does.
#[test]
fn tree_nodes_answer_missing_and_error_holding_as_the_tree_does() {
    let source = "def f(:\n    pass\nx = )\n";
    let tree = parse_tree(&tree_sitter_python::LANGUAGE.into(), source);
    let work = LayoutWorkCounter::default();
    let mut nodes = TreeNodes::new(&tree, source, &work);
    let count = descendant_count(&tree.root_node());
    let (mut missing, mut holding) = (0, 0);
    for index in (0..count).rev().chain(0..count) {
        let at = NodeIndex::new(index);
        let node = node_at_index(&tree, at).expect("a node at every index");
        assert_eq!(nodes.missing(at), node.is_missing(), "whether {index} is MISSING");
        assert_eq!(nodes.holds_error(at), node.has_error() || node.is_error(), "whether {index} holds an error");
        missing += u32::from(node.is_missing());
        holding += u32::from(node.has_error() && !node.is_error() && !node.is_missing());
    }
    assert!(missing > 0 && holding > 0, "a MISSING token ({missing}) and nodes holding an error below them ({holding})");
}

/// A lone `ERROR` token, the bytes the lexer could not read, holds an error
/// through the tree backer, itself included, as every `ERROR` does, though
/// the tree charges its error to the `ERROR` around it (`Node::has_error`).
#[test]
fn a_lone_error_token_holds_an_error() {
    let source = "x = 1 $ 2\n";
    let tree = parse_tree(&tree_sitter_python::LANGUAGE.into(), source);
    let work = LayoutWorkCounter::default();
    let mut nodes = TreeNodes::new(&tree, source, &work);
    let lone: Vec<u32> = (0..descendant_count(&tree.root_node()))
        .filter(|&index| node_at_index(&tree, NodeIndex::new(index)).is_some_and(|node| node.is_error() && !node.has_error()))
        .collect();
    assert!(!lone.is_empty(), "a lone ERROR token");
    for index in lone {
        assert!(nodes.holds_error(NodeIndex::new(index)), "the lone ERROR token at {index} holds an error");
    }
}

/// The kind name of the last child, extras aside, of the list spelled `list` in `source`, its own kind `kind`.
fn last_list_child_of(source: &str, list: &str, kind: u16) -> Option<String> {
    let tree = parse_tree(&tree_sitter_rust::LANGUAGE.into(), source);
    let start = sittir_core::types::narrow(source.find(list).unwrap());
    let work = LayoutWorkCounter::default();
    let child = sittir_core::engine::last_list_child(&mut TreeNodes::new(&tree, source, &work), Span { start, end: start + sittir_core::types::narrow(list.len()) }, KindId(kind))?;
    node_at_index(&tree, child.index).map(|child| child.kind().to_string())
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
    let tree = parse_tree(&tree_sitter_rust::LANGUAGE.into(), source);
    let arguments = tree.root_node().descendant_for_byte_range(10, 17).unwrap();
    assert_eq!(arguments.kind(), "arguments");
    let work = LayoutWorkCounter::default();
    let last = sittir_core::engine::last_list_child(&mut TreeNodes::new(&tree, source, &work), Span { start: 10, end: 17 }, sittir_core::read::grammar_id(&arguments)).unwrap();
    assert_eq!(node_at_index(&tree, last.index).unwrap().kind(), ")");
}
