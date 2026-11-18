//! A source sets a list item apart only inside a holder whose bytes hold a
//! blank line, so a lookup routes the children of no other holder to find
//! the items set apart.

use sittir_core::engine::{claim_tree_id, Engine, EngineGrammar};
use sittir_core::nodes::Nodes;
use sittir_core::types::{NodeIndex, Span};
use sittir_parity_tests::fixture_sources;

/// The items `name`'s fixtures set apart, each checked to lie in a holder
/// whose bytes hold a blank line.
fn items_set_apart<G: EngineGrammar + Copy>(grammar: G, options: fn() -> sittir_core::options::ResolvedOptions, name: &str) -> usize {
    let mut apart = 0;
    for source in fixture_sources(name) {
        let lines = sittir_core::points::LineTable::new(&source);
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
                if set_apart {
                    apart += 1;
                    assert!(lines.holds_blank_line(span), "{name}: item {item:?} of the holder at {span:?} in {source:?}");
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
