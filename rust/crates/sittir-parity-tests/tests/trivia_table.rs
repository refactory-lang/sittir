//! The trivia placement: each gap's entries go to a side of the owner's
//! child beside the gap, held to tree-sitter's trees in three grammars.

use sittir_core::trivia_table::{is_empty, Assigned, TriviaSide};
use sittir_core::engine::EngineGrammar;
use sittir_core::read::goto;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::PlacedTrivia;
use sittir_core::tree_sitter::{Language, Node, Parser, Tree};

fn parse(language: &Language, source: &str) -> Tree {
    let mut parser = Parser::new();
    parser.set_language(language).unwrap();
    parser.parse(source, None).unwrap()
}

/// The descendant index of the first node, in pre-order, of `kind` whose text is `text`.
fn index_of(tree: &Tree, source: &str, kind: &str, text: &str) -> NodeIndex {
    let mut cursor = tree.walk();
    loop {
        let node: Node<'_> = cursor.node();
        if node.kind() == kind && &source[sittir_core::types::Span::of(&node).range()] == text {
            return sittir_core::read::index_of(&cursor);
        }
        if cursor.goto_first_child() {
            continue;
        }
        loop {
            if cursor.goto_next_sibling() {
                break;
            }
            assert!(cursor.goto_parent(), "no {kind} reading {text:?}");
        }
    }
}

struct Case {
    tree: Tree,
    source: &'static str,
    table: PlacedTrivia,
}

impl Case {
    fn new<G: EngineGrammar>((language, grammar): (Language, G), source: &'static str) -> Self {
        let tree = parse(&language, source);
        let table = PlacedTrivia::of(&tree, source, grammar);
        Case { tree, source, table }
    }

    fn at(&self, kind: &str, text: &str) -> NodeIndex {
        index_of(&self.tree, self.source, kind, text)
    }

    /// The entries of `side` of the node at `index`.
    fn entries(&self, index: NodeIndex, side: TriviaSide) -> Vec<Assigned> {
        self.table.side(index, side).to_vec()
    }

    /// Asserts the entry `comment` (of `comment_kind`) is the only extra of `side` of the node `owner` (of `kind`).
    fn holds(&self, kind: &str, owner: &str, side: TriviaSide, comment_kind: &str, comment: &str) {
        let entry = self.at(comment_kind, comment);
        assert_eq!(self.entries(self.at(kind, owner), side), [Assigned::Extra(entry)], "{side:?} of {kind} {owner:?}");
    }

}

use TriviaSide::{Inner, Leading, Trailing};

fn rust() -> (Language, sittir_rust::RustGrammar) {
    (sittir_rust::language(), sittir_rust::RustGrammar)
}
fn typescript() -> (Language, sittir_typescript::TypeScriptGrammar) {
    (sittir_typescript::language(), sittir_typescript::TypeScriptGrammar)
}
fn python() -> (Language, sittir_python::PythonGrammar) {
    (sittir_python::language(), sittir_python::PythonGrammar)
}

#[test]
fn a_comment_before_the_first_item_leads_it_and_one_after_the_last_trails_it() {
    let case = Case::new(rust(), "// a\nfn f() {}\n// b\n");
    case.holds("function_item", "fn f() {}", Leading, "line_comment", "// a");
    case.holds("function_item", "fn f() {}", Trailing, "line_comment", "// b");
}

#[test]
fn a_source_of_comments_only_is_the_roots_inner() {
    let case = Case::new(rust(), "\n\n// only\n\n");
    assert_eq!(case.entries(NodeIndex::ROOT, Inner), [Assigned::Extra(case.at("line_comment", "// only"))]);
    let case = Case::new(python(), "\n# only\n");
    assert_eq!(case.entries(NodeIndex::ROOT, Inner), [Assigned::Extra(case.at("comment", "# only"))]);
}

#[test]
fn a_comment_before_a_separator_trails_the_item_before_it() {
    let case = Case::new(rust(), "fn f() { [a /* x */, b]; }\n");
    case.holds("identifier", "a", Trailing, "block_comment", "/* x */");
}

#[test]
fn a_comment_after_a_separator_leads_the_item_after_it() {
    let case = Case::new(rust(), "fn f() { [a, /* y */ b]; }\n");
    case.holds("identifier", "b", Leading, "block_comment", "/* y */");
}

#[test]
fn a_comment_between_a_trailing_separator_and_the_closer_trails_the_last_item() {
    let case = Case::new(typescript(), "x = [a, b, // c\n];\n");
    case.holds("identifier", "b", Trailing, "comment_line", "// c");
    assert_eq!(case.table.unowned(), []);
}

#[test]
fn a_comment_after_a_trailing_separator_trails_the_list_node_holding_the_separator() {
    let case = Case::new(rust(), "fn f() { [a, b, // c\n]; }\n");
    case.holds("array_expression_list_elements", "a, b,", Trailing, "line_comment", "// c");
    let case = Case::new(python(), "x = [a, b, # c\n]\n");
    case.holds("collection_elements", "a, b,", Trailing, "comment", "# c");
    assert_eq!(case.table.unowned(), []);
}

#[test]
fn a_comment_on_a_statements_line_trails_the_statement_not_the_call() {
    let case = Case::new(rust(), "fn f() {\n    s1(); // x\n    // y\n    s2();\n}\n");
    case.holds("expression_statement", "s1();", Trailing, "line_comment", "// x");
    case.holds("expression_statement", "s2();", Leading, "line_comment", "// y");
    assert_eq!(case.entries(case.at("call_expression", "s1()"), Trailing), []);
}

#[test]
fn python_newline_text_is_never_an_entry() {
    let case = Case::new(python(), "x = 1  # c\ny = 2\n");
    case.holds("expression_statement", "x = 1", Trailing, "comment", "# c");
    assert_eq!(case.table.side(case.at("simple_statements", "y = 2"), Leading), []);
}

#[test]
fn a_list_node_passes_its_side_to_the_item_ending_where_it_does() {
    let case = Case::new(python(), "def f():\n    a()  # t\n");
    case.holds("expression_statement", "a()", Trailing, "comment", "# t");
    assert_eq!(case.entries(case.at("simple_statements_elements", "a()"), Trailing), []);
}

#[test]
fn a_list_node_keeps_the_side_its_unit_item_would_take() {
    let case = Case::new(python(), "def f():\n    pass  # t\n");
    case.holds("simple_statements_elements", "pass", Trailing, "comment", "# t");
}

#[test]
fn a_comment_before_an_automatic_semicolon_trails_the_expression() {
    let comment = "/* c\n*/";
    let case = Case::new(typescript(), "a /* c\n*/\nb\n");
    case.holds("identifier", "a", Trailing, "comment_block", comment);
}

#[test]
fn a_same_line_comment_after_an_automatic_semicolon_trails_the_statement() {
    let case = Case::new(typescript(), "a // c\nb\n");
    case.holds("expression_statement", "a", Trailing, "comment_line", "// c");
}

#[test]
fn a_childless_nodes_comment_is_its_inner() {
    let case = Case::new(rust(), "fn f() { /* c */ }\n");
    case.holds("block", "{ /* c */ }", Inner, "block_comment", "/* c */");
}

#[test]
fn a_comment_between_two_of_a_for_statements_own_tokens_leads_its_next_child() {
    let case = Case::new(typescript(), "for /* c */ (;;) {}\n");
    case.holds("empty_statement", ";", Leading, "comment_block", "/* c */");
    assert_eq!(case.table.unowned(), []);
}

#[test]
fn a_comment_after_a_blocks_last_statement_trails_it() {
    let case = Case::new(python(), "if a:\n    b\n    # c\nd\n");
    case.holds("simple_statements", "b", Trailing, "comment", "# c");
    assert_eq!(case.table.side(case.at("block_statement", "b\n    # c"), Inner), []);
}

#[test]
fn the_outer_node_takes_the_side() {
    let case = Case::new(rust(), "// c\npub fn f() {}\n");
    case.holds("function_item", "pub fn f() {}", Leading, "line_comment", "// c");
    assert_eq!(case.table.side(case.at("visibility_modifier", "pub"), Leading), []);
}

#[test]
fn every_extra_of_the_probe_inputs_lands_in_one_side() {
    for name in ["engine.rs", "spacing.rs"] {
        let path = format!("{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{name}", env!("CARGO_MANIFEST_DIR"));
        let source: &'static str = Box::leak(std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}")).into_boxed_str());
        let case = Case::new(rust(), source);
        let mut placed: Vec<NodeIndex> = case.table.unowned();
        for index in (0..sittir_core::read::descendant_count(&case.tree.root_node())).map(NodeIndex::new) {
            for side in [Leading, Trailing, Inner] {
                placed.extend(case.entries(index, side).into_iter().map(Assigned::index));
            }
        }
        placed.sort_unstable();
        let mut extras = Vec::new();
        let mut cursor = case.tree.walk();
        for index in (0..sittir_core::read::descendant_count(&case.tree.root_node())).map(NodeIndex::new) {
            goto(&mut cursor, index);
            if cursor.node().is_extra() || cursor.node().is_error() {
                extras.push(index);
            }
        }
        assert!(!extras.is_empty(), "{name} has comments");
        assert_eq!(placed, extras, "{name}");
    }
}

#[test]
fn a_zero_width_child_holds_no_side() {
    let case = Case::new(typescript(), "function f() {\n  // c\n}\n");
    case.holds("statement_block", "{\n  // c\n}", Inner, "comment_line", "// c");
    assert_eq!(case.table.unowned(), []);
}

#[test]
fn a_node_is_empty_when_no_child_has_width() {
    for (source, block, empty) in [("function f() {\n}\n", "{\n}", true), ("function f() {\n  ;\n}\n", "{\n  ;\n}", false)] {
        let case = Case::new(typescript(), source);
        let work = sittir_core::layout::LayoutWorkCounter::default();
        let mut nodes = sittir_core::nodes::TreeNodes::new(&case.tree, case.source, &work);
        assert_eq!(is_empty(&mut nodes, case.at("statement_block", block), &|_| false), empty, "{source:?}");
    }
}
