//! A source sets a list item apart only inside a holder whose bytes hold a
//! blank line, so a lookup routes the children of no other holder to find
//! the items set apart. A holder whose only blank line lies inside one of
//! its children is routed and sets none of its own items apart.

use sittir_core::engine::{claim_tree_id, Engine, EngineGrammar};
use sittir_core::layout_kinds::LayoutKinds;
use sittir_core::nodes::Nodes;
use sittir_core::slot::SlotValue;
use sittir_core::trivia::TriviaSeam;
use sittir_core::trivia_table::TriviaSide;
use sittir_core::types::{NodeIndex, Span};
use sittir_parity_tests::fixture_sources;

/// The items `name`'s fixtures set apart, each checked to lie in a holder
/// whose bytes hold a blank line.
fn items_set_apart<G: EngineGrammar + Copy>(grammar: G, options: fn() -> sittir_core::options::ResolvedOptions, name: &str) -> usize {
    let mut apart = 0;
    for source in fixture_sources(name) {
        let lines = sittir_core::points::LineTable::with_blank_rows(&source);
        let mut engine = Engine::new(grammar, options()).expect("an engine");
        let Ok(tree) = engine.parse(&source, claim_tree_id().expect("a tree id")) else { continue };
        let mut nodes = tree.nodes();
        let mut pending = vec![NodeIndex::ROOT];
        while let Some(index) = pending.pop() {
            let holder = nodes.kid(index);
            pending.extend(nodes.kids(index).iter().map(|kid| kid.index));
            let Some(routed) = grammar.slot_routes(&mut nodes, &holder) else { continue };
            let span = Span { start: holder.start, end: holder.end };
            for (item, set_apart) in sittir_core::list_slots::list_items(&routed, &source) {
                if set_apart.is_some() {
                    apart += 1;
                    assert_eq!(lines.holds_blank_line(span), Some(true), "{name}: item {item:?} of the holder at {span:?} in {source:?}");
                }
            }
        }
    }
    apart
}

#[test]
fn every_item_a_source_sets_apart_lies_in_a_holder_that_holds_a_blank_line() {
    let counts = [
        items_set_apart(sittir_rust::RustGrammar, sittir_rust::render::options::defaults, "rust"),
        items_set_apart(sittir_python::PythonGrammar, sittir_python::render::options::defaults, "python"),
        items_set_apart(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults, "typescript"),
        items_set_apart(sittir_scm::ScmGrammar, sittir_scm::render::options::defaults, "scm"),
        items_set_apart(sittir_regex::RegexGrammar, sittir_regex::render::options::defaults, "regex"),
    ];
    assert!(counts.iter().sum::<usize>() > 0, "the fixtures set items apart: {counts:?}");
}

/// The kind and text of each node of the rust `source` whose leading side,
/// as the tree's lookup gives it, opens with a blank line, in document order.
fn led_by_a_blank_line(source: &str) -> Vec<(&'static str, &str)> {
    let grammar = sittir_rust::RustGrammar;
    let mut engine = Engine::new(grammar, sittir_rust::render::options::defaults()).expect("an engine");
    let tree = engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse");
    let mut nodes = tree.nodes();
    let (mut pending, mut led) = (vec![NodeIndex::ROOT], Vec::new());
    while let Some(index) = pending.pop() {
        let kid = nodes.kid(index);
        pending.extend(nodes.kids(index).iter().map(|kid| kid.index));
        let leading = tree.trivia_side(index, TriviaSide::Leading);
        if leading.first().is_some_and(|entry| matches!(entry.value(), Some(SlotValue::Node(member)) if member.seam_gap() == Some(LayoutKinds::BLANKLINE))) {
            led.push((kid.start, sittir_rust::RustGrammar::kind_name(kid.grammar), &source[kid.start as usize..kid.end as usize]));
        }
    }
    led.sort_unstable();
    led.into_iter().map(|(_, kind, text)| (kind, text)).collect()
}

#[test]
fn a_holder_whose_blank_line_lies_in_a_nested_child_sets_none_of_its_own_items_apart() {
    assert_eq!(led_by_a_blank_line("fn f() {\n    a;\n\n    b;\n}\nfn g() {}\n"), [("expression_statement", "b;")]);
    assert_eq!(led_by_a_blank_line("fn f() {\n    a;\n\n    b;\n}\n\nfn g() {}\n"), [("expression_statement", "b;"), ("function_item", "fn g() {}")]);
}
