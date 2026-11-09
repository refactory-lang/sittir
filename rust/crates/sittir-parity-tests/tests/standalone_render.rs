//! A parsed node rendered on its own writes what it contributes to its
//! tree's render: its span, and, in source order, every entry (an extra, an
//! `ERROR` or a layout member) a side of it or of a node below it holds
//! outside that span; an ancestor's token between them is the ancestor's.
//! A layout run spans its whole gap, entries other sides hold included, so
//! it adds nothing. Compared without whitespace, on every node of each
//! grammar's fixtures that holds such an entry, and on a declaration whose
//! parser-inserted `;` leaves an `ERROR` past its end on its declarator's
//! side.

use sittir_core::engine::EngineGrammar;
use sittir_core::tree_sitter;
use sittir_core::trivia_table::{Assigned, TriviaSide};
use sittir_core::types::{NodeIndex, Span};
use sittir_parity_tests::PlacedTrivia;

fn squeezed(text: &str) -> String {
    text.chars().filter(|c| !c.is_whitespace()).collect()
}

/// Each node of `tree` below the root, by index, with its span and the
/// entries the sides of its subtree hold outside it, in preorder.
fn outside_entries<G: EngineGrammar>(grammar: &G, tree: &tree_sitter::Tree, source: &str) -> Vec<(NodeIndex, Span, Vec<Span>)> {
    fn visit(placed: &PlacedTrivia, spans: &[Span], node: tree_sitter::Node<'_>, index: &mut u32, out: &mut Vec<(NodeIndex, Span, Vec<Span>)>) -> Vec<Span> {
        let at = NodeIndex::new(*index);
        *index += 1;
        let span = Span::of(&node);
        let mut held = Vec::new();
        for side in [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner] {
            for entry in placed.side(at, side) {
                if let Assigned::Extra(entry) | Assigned::Error(entry) | Assigned::Member(entry) = *entry {
                    held.push(spans[entry.0 as usize]);
                }
            }
        }
        let slot = out.len();
        out.push((at, span, Vec::new()));
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            held.extend(visit(placed, spans, child, index, out));
        }
        held.retain(|entry| entry.end <= span.start || entry.start >= span.end);
        held.sort_unstable_by_key(|entry| (entry.start, entry.end));
        out[slot].2.clone_from(&held);
        held
    }
    let placed = PlacedTrivia::of(tree, source, grammar.surface_kinds(), 4);
    let mut spans = Vec::new();
    let mut cursor = tree.walk();
    'walk: loop {
        spans.push(Span::of(&cursor.node()));
        if cursor.goto_first_child() {
            continue;
        }
        while !cursor.goto_next_sibling() {
            if !cursor.goto_parent() {
                break 'walk;
            }
        }
    }
    let mut out = Vec::new();
    visit(&placed, &spans, tree.root_node(), &mut 0, &mut out);
    out.retain(|(.., outside)| !outside.is_empty());
    out.retain(|&(at, ..)| at != NodeIndex::ROOT);
    out
}

macro_rules! standalone_mismatches {
    ($krate:ident, $grammar:expr, $sources:expr) => {{
        let mut checked = 0;
        let mut mismatches = Vec::new();
        for source in $sources {
            let tree = sittir_parity_tests::parsed($grammar, $krate::render::options::defaults(), &source);
            let options = $krate::render::options::defaults();
            let seating = tree.seating();
            let ctx = seating.ctx();
            let mut cursor = tree.tree().walk();
            for (at, span, outside) in outside_entries(&$grammar, tree.tree(), &source) {
                checked += 1;
                sittir_core::read::goto(&mut cursor, at);
                let coord = ctx.coordinate(&cursor.node(), at);
                let rctx = sittir_core::prepare::RenderContext::new(&options, &seating);
                let rendered = $krate::render::render_node_parts(sittir_core::SlotValue::Coord(coord), &rctx, None).expect("a render").1;
                let text = |at: &Span| &source[at.start as usize..at.end as usize];
                let before = outside.iter().filter(|entry| entry.end <= span.start).map(text);
                let after = outside.iter().filter(|entry| entry.start >= span.end).map(text);
                let expected: String = before.chain([text(&span)]).chain(after).collect();
                if squeezed(&rendered) != squeezed(&expected) {
                    mismatches.push(format!("{source:?} node {} {}: {rendered:?}, contributes {expected:?}", at.0, cursor.node().kind()));
                }
            }
        }
        (checked, mismatches)
    }};
}

#[test]
fn a_parsed_node_rendered_alone_writes_what_it_contributes_to_its_tree() {
    let results = [
        ("python", standalone_mismatches!(sittir_python, sittir_python::PythonGrammar, sittir_parity_tests::fixture_sources("python"))),
        ("regex", standalone_mismatches!(sittir_regex, sittir_regex::RegexGrammar, sittir_parity_tests::fixture_sources("regex"))),
        ("rust", standalone_mismatches!(sittir_rust, sittir_rust::RustGrammar, sittir_parity_tests::fixture_sources("rust"))),
        ("scm", standalone_mismatches!(sittir_scm, sittir_scm::ScmGrammar, sittir_parity_tests::fixture_sources("scm"))),
        ("typescript", standalone_mismatches!(sittir_typescript, sittir_typescript::TypeScriptGrammar, sittir_parity_tests::fixture_sources("typescript"))),
    ];
    for (grammar, (checked, mismatches)) in &results {
        eprintln!("{grammar}: {checked} nodes hold an entry outside their span");
        assert!(mismatches.is_empty(), "{grammar}: {mismatches:#?}");
    }
}

#[test]
fn a_declaration_renders_the_error_its_declarator_holds_past_the_parser_inserted_semicolon() {
    let (checked, mismatches) = standalone_mismatches!(sittir_typescript, sittir_typescript::TypeScriptGrammar, ["let x: import('a')();".to_string()]);
    assert_eq!((checked, mismatches), (2, Vec::<String>::new()));
}
