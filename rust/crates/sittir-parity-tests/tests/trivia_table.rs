//! The trivia table's assignment: each gap's entries go to a side of the
//! owner's child beside the gap, held to tree-sitter's trees in three grammars.

use sittir_core::trivia_table::{is_empty, Assigned, SurfaceKinds, TriviaSide, TriviaTable};
use tree_sitter::{Language, Node, Parser, Tree};

fn parse(language: &Language, source: &str) -> Tree {
    let mut parser = Parser::new();
    parser.set_language(language).unwrap();
    parser.parse(source, None).unwrap()
}

/// The descendant index of the first node, in pre-order, of `kind` whose text is `text`.
fn index_of(tree: &Tree, source: &str, kind: &str, text: &str) -> u32 {
    let mut cursor = tree.walk();
    loop {
        let node: Node<'_> = cursor.node();
        if node.kind() == kind && &source[node.byte_range()] == text {
            return cursor.descendant_index() as u32;
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
    table: TriviaTable,
}

impl Case {
    fn new((language, kinds): Grammar, source: &'static str) -> Self {
        let tree = parse(&language, source);
        let table = TriviaTable::assign(&tree, source, kinds, 4);
        Case { tree, source, table }
    }

    fn at(&self, kind: &str, text: &str) -> u32 {
        index_of(&self.tree, self.source, kind, text)
    }

    /// The extras and `ERROR`s of `side` of the node at `index`, without its layout runs.
    fn entries(&self, index: u32, side: TriviaSide) -> Vec<Assigned> {
        self.table.side(index, side).iter().copied().filter(|entry| !matches!(entry, Assigned::Layout { .. } | Assigned::Depth(_))).collect()
    }

    /// Asserts the entry `comment` (of `comment_kind`) is the only extra of `side` of the node `owner` (of `kind`).
    fn holds(&self, kind: &str, owner: &str, side: TriviaSide, comment_kind: &str, comment: &str) {
        let entry = self.at(comment_kind, comment);
        assert_eq!(self.entries(self.at(kind, owner), side), [Assigned::Extra(entry)], "{side:?} of {kind} {owner:?}");
    }

    /// The layout runs of every side, as source text.
    fn layout(&self) -> Vec<(u32, TriviaSide, &str)> {
        let mut runs = Vec::new();
        for index in 0..self.tree.root_node().descendant_count() as u32 {
            for side in [Leading, Trailing, Inner] {
                for entry in self.table.side(index, side) {
                    if let Assigned::Layout { start, end, .. } = *entry {
                        runs.push((index, side, &self.source[start as usize..end as usize]));
                    }
                }
            }
        }
        runs
    }
}

use TriviaSide::{Inner, Leading, Trailing};

/// A grammar's language and its surface kinds.
type Grammar = (Language, SurfaceKinds);

fn rust() -> Grammar {
    (sittir_rust::language(), sittir_rust::render::kind_ids::SURFACE_KINDS)
}
fn typescript() -> Grammar {
    (sittir_typescript::language(), sittir_typescript::render::kind_ids::SURFACE_KINDS)
}
fn python() -> Grammar {
    (sittir_python::language(), sittir_python::render::kind_ids::SURFACE_KINDS)
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
    assert_eq!(case.entries(0, Inner), [Assigned::Extra(case.at("line_comment", "// only"))]);
    let case = Case::new(python(), "\n# only\n");
    assert_eq!(case.entries(0, Inner), [Assigned::Extra(case.at("comment", "# only"))]);
}

#[test]
fn a_comment_before_a_separator_trails_the_item_before_it() {
    let case = Case::new(rust(), "fn f() { [a /* x */, b]; }\n");
    case.holds("attributed_argument", "a", Trailing, "block_comment", "/* x */");
}

#[test]
fn a_comment_after_a_separator_leads_the_item_after_it() {
    let case = Case::new(rust(), "fn f() { [a, /* y */ b]; }\n");
    case.holds("attributed_argument", "b", Leading, "block_comment", "/* y */");
}

#[test]
fn a_comment_between_a_trailing_separator_and_the_closer_is_unowned() {
    let case = Case::new(typescript(), "x = [a, b, // c\n];\n");
    assert_eq!(case.table.unowned(), [case.at("comment_line", "// c")]);
}

#[test]
fn a_comment_after_a_trailing_separator_trails_the_list_node_holding_the_separator() {
    let case = Case::new(rust(), "fn f() { [a, b, // c\n]; }\n");
    case.holds("arguments_elements", "a, b,", Trailing, "line_comment", "// c");
    let case = Case::new(python(), "x = [a, b, # c\n]\n");
    case.holds("collection_elements", "a, b,", Trailing, "comment", "# c");
    assert!(case.table.unowned().is_empty());
}

#[test]
fn a_comment_on_a_statements_line_trails_the_statement_not_the_call() {
    let case = Case::new(rust(), "fn f() {\n    s1(); // x\n    // y\n    s2();\n}\n");
    case.holds("expression_statement", "s1();", Trailing, "line_comment", "// x");
    case.holds("expression_statement", "s2();", Leading, "line_comment", "// y");
    assert_eq!(case.table.side(case.at("call_expression", "s1()"), Trailing), []);
}

#[test]
fn python_newline_text_is_layout_and_never_an_entry() {
    let case = Case::new(python(), "x = 1  # c\ny = 2\n");
    case.holds("expression_statement", "x = 1", Trailing, "comment", "# c");
    assert_eq!(case.table.side(case.at("simple_statements", "y = 2"), Leading), [Assigned::Layout { start: 10, end: 11, owner: 0, depth: 0 }]);
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
fn a_layout_run_at_a_lists_edge_stays_on_the_list() {
    let case = Case::new(python(), "x = [\n    a,\n    b,\n]\n");
    assert_eq!(case.table.side(case.at("identifier", "a"), Leading), []);
    assert!(matches!(case.table.side(case.at("collection_elements", "a,\n    b,"), Leading), [Assigned::Layout { .. }]));
}

#[test]
fn a_comment_before_an_automatic_semicolon_trails_the_expression() {
    let case = Case::new(typescript(), "a // c\nb\n");
    case.holds("identifier", "a", Trailing, "comment_line", "// c");
}

#[test]
fn a_childless_nodes_comment_is_its_inner() {
    let case = Case::new(rust(), "fn f() { /* c */ }\n");
    case.holds("block", "{ /* c */ }", Inner, "block_comment", "/* c */");
}

#[test]
fn a_comment_between_two_of_a_for_statements_own_tokens_is_unowned() {
    let case = Case::new(typescript(), "for /* c */ (;;) {}\n");
    assert_eq!(case.table.unowned(), [case.at("comment_block", "/* c */")]);
}

#[test]
fn a_comment_after_a_blocks_last_statement_trails_it() {
    let case = Case::new(python(), "if a:\n    b\n    # c\nd\n");
    case.holds("simple_statements", "b", Trailing, "comment", "# c");
    assert_eq!(case.table.side(case.at("block", "b\n    # c"), Inner), []);
}

#[test]
fn the_outer_node_takes_the_side() {
    let case = Case::new(rust(), "// c\npub fn f() {}\n");
    case.holds("function_item", "pub fn f() {}", Leading, "line_comment", "// c");
    assert_eq!(case.table.side(case.at("visibility_modifier", "pub"), Leading), []);
}

#[test]
fn a_line_break_run_is_layout_on_the_side_its_gap_goes_to() {
    let case = Case::new(rust(), "fn f() {}\n\nfn g() {}\n");
    let g = case.at("function_item", "fn g() {}");
    assert_eq!(case.table.side(g, Leading), [Assigned::Layout { start: 9, end: 11, owner: 0, depth: 0 }]);
}

#[test]
fn a_one_line_block_stores_no_layout() {
    let case = Case::new(rust(), "fn f() { a(); b(); }\n");
    let f = case.at("function_item", "fn f() { a(); b(); }");
    assert_eq!(case.layout(), [(f, Trailing, "\n")]);
}

#[test]
fn every_extra_of_the_probe_inputs_lands_in_one_side_or_is_unowned() {
    for name in ["engine.rs", "spacing.rs"] {
        let path = format!("{}/../../../docs/superpowers/probes/2026-10-01-shared-arena/transport/inputs/{name}", env!("CARGO_MANIFEST_DIR"));
        let source: &'static str = Box::leak(std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}")).into_boxed_str());
        let case = Case::new(rust(), source);
        let mut placed: Vec<u32> = case.table.unowned().to_vec();
        for index in 0..case.tree.root_node().descendant_count() as u32 {
            for side in [Leading, Trailing, Inner] {
                placed.extend(case.entries(index, side).into_iter().map(|entry| match entry {
                    Assigned::Extra(at) | Assigned::Error(at) | Assigned::Member(at) => at,
                    Assigned::Layout { .. } | Assigned::Depth(_) => unreachable!(),
                }));
            }
        }
        placed.sort_unstable();
        let mut extras = Vec::new();
        let mut cursor = case.tree.walk();
        for index in 0..case.tree.root_node().descendant_count() {
            cursor.goto_descendant(index);
            if cursor.node().is_extra() || cursor.node().is_error() {
                extras.push(index as u32);
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
    assert!(case.table.unowned().is_empty());
}

#[test]
fn a_node_is_empty_when_no_child_has_width() {
    for (source, block, empty) in [("function f() {\n}\n", "{\n}", true), ("function f() {\n  ;\n}\n", "{\n  ;\n}", false)] {
        let case = Case::new(typescript(), source);
        let mut cursor = case.tree.walk();
        cursor.goto_descendant(case.at("statement_block", block) as usize);
        assert_eq!(is_empty(&cursor.node()), empty, "{source:?}");
    }
}

#[test]
fn the_run_between_a_leading_entry_and_its_owner_is_on_the_entrys_side() {
    let source = "interface I {\n  /** d */\n  x: number;\n}\n";
    let case = Case::new(typescript(), source);
    let member = case.at("property_signature", "x: number");
    let side = case.table.side(member, Leading);
    let after = source.find("*/").unwrap() as u32 + 2;
    assert!(matches!(side.first(), Some(Assigned::Extra(_))), "{side:?}");
    assert!(side.iter().any(|entry| matches!(*entry, Assigned::Layout { start, .. } if start == after)), "{side:?}");
}

impl Case {
    /// The depth members of `side` of the node at `index`: each run's, then each restore's, in order.
    fn depths(&self, index: u32, side: TriviaSide) -> Vec<i32> {
        self.table
            .side(index, side)
            .iter()
            .filter_map(|entry| match *entry {
                Assigned::Layout { depth, .. } | Assigned::Depth(depth) => Some(depth),
                _ => None,
            })
            .collect()
    }
}

#[test]
fn a_continuation_opens_one_level_and_its_owner_restores_it_inside_its_span() {
    let case = Case::new(typescript(), "foo(a,\n    b,\n    c);\nnext;\n");
    assert_eq!(case.depths(case.at("identifier", "b"), Leading), [1], "the run after `a,` opens a level");
    assert_eq!(case.depths(case.at("identifier", "c"), Leading), [0], "the run after `b,` stays on it");
    assert_eq!(case.depths(case.at("identifier", "c"), Trailing), [-1], "the owner restores it before its `)`");
    assert_eq!(case.depths(case.at("expression_statement", "next;"), Leading), [0], "the next statement sits at the template's depth");
}

#[test]
fn a_python_continuation_one_level_in_carries_one_indent() {
    let case = Case::new(python(), "x = foo(1,\n    2)\n");
    assert_eq!(case.depths(case.at("integer_decimal_plain", "2"), Leading), [1]);
}

#[test]
fn a_paren_aligned_continuation_normalizes_to_whole_levels() {
    let case = Case::new(python(), "x = foo(1,\n        2)\nyy = foo(1,\n          2)\n");
    let twos: Vec<u32> = (0..case.tree.root_node().descendant_count() as u32)
        .filter(|&at| {
            let mut cursor = case.tree.walk();
            cursor.goto_descendant(at as usize);
            cursor.node().kind() == "integer_decimal_plain" && cursor.node().utf8_text(case.source.as_bytes()).ok() == Some("2")
        })
        .collect();
    assert_eq!(twos.iter().map(|&at| case.depths(at, Leading)).collect::<Vec<_>>(), [[2], [2]], "eight and ten spaces are two levels of four");
}

#[test]
fn a_run_below_its_structural_level_dedents_and_its_owner_restores_it() {
    let case = Case::new(python(), "def f():\n    x = (1,\n2)\n    y\n");
    let two = case.at("integer_decimal_plain", "2");
    assert_eq!(case.depths(two, Leading), [-1], "the line sits a level below the block body");
    assert_eq!(case.depths(two, Trailing), [1], "the tuple restores it");
    assert_eq!(case.depths(case.at("simple_statements", "y"), Leading), [0]);
}

#[test]
fn excess_that_runs_to_a_nodes_end_is_restored_on_its_last_childs_trailing_side() {
    let case = Case::new(typescript(), "const x = a +\n    b;\nnext;\n");
    let b = case.at("identifier", "b");
    assert_eq!(case.depths(b, Leading), [1]);
    assert_eq!(case.depths(b, Trailing), [-1]);
}

#[test]
fn a_block_body_is_structural_and_carries_no_depth_members() {
    let case = Case::new(rust(), "fn f() {\n    a();\n    b();\n}\n");
    for statement in ["a();", "b();"] {
        assert_eq!(case.depths(case.at("expression_statement", statement), Leading), [0], "{statement}");
    }
    let case = Case::new(python(), "def f():\n    a\n    b\nc\n");
    assert_eq!(case.depths(case.at("block", "a\n    b"), Leading), [0], "the run before the body");
    for statement in ["b", "c"] {
        assert_eq!(case.depths(case.at("simple_statements", statement), Leading), [0], "{statement}");
    }
}


#[test]
fn a_body_indented_by_any_width_is_structural() {
    let case = Case::new(python(), "if a:\n  if b:\n     c\n");
    let runs: Vec<i32> = (0..case.tree.root_node().descendant_count() as u32)
        .flat_map(|at| [Leading, Trailing, Inner].map(|side| case.depths(at, side)))
        .flatten()
        .collect();
    assert_eq!(runs, [0, 0, 0], "each body's first line sets its block's indentation");
}


#[test]
fn a_comment_in_an_empty_block_sits_at_the_blocks_level() {
    let case = Case::new(rust(), "fn f() {\n    // TODO\n}\n");
    let block = case.at("block", "{\n    // TODO\n}");
    assert_eq!(case.depths(block, Inner), [0, 0]);
}
