//! An arena parse leaves no tree: `Engine::parse_records` reads the whole
//! tree into the engine's built arena in one walk and drops it, and what is
//! left answers for the source. The source reads back from its entry, and
//! navigation over the records alone (`RunNodes`) finds every node the
//! parser made, in built storage many parses share.
#![cfg(feature = "arena")]

use sittir_core::arena::source::Source;
use sittir_core::arena::{HydrateNode, RunNodes, LINK_WORDS};
use sittir_core::engine::{Engine, EngineGrammar};
use sittir_core::nodes::{Nodes, Step, Visit};
use sittir_core::options::ResolvedOptions;
use sittir_core::read::descendant_count;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{fixture_sources, parsed};

/// How many nodes the records of `source` hold, parsed by `engine` as `N`;
/// 0 for a source that parses to an `ERROR` alone.
fn nodes_left<G: EngineGrammar, N: HydrateNode>(name: &str, engine: &mut Engine<G>, source: &str) -> u32 {
    let parse = engine.parse_records::<N>(source).unwrap_or_else(|refusal| panic!("{name} {source:?}: {refusal}"));
    let built = engine.written().built();
    let entry = Source::read(&*built, parse.source).unwrap_or_else(|refusal| panic!("{name} {source:?}: its source entry: {refusal}"));
    assert_eq!(entry.text, source, "{name}: the source reads back from its entry");
    assert_eq!(entry.breaks_lf, !source.contains('\r'), "{name} {source:?}");
    let Some(root) = parse.root else { return 0 };
    let mut nodes = RunNodes::new(&*built, entry.text, root).unwrap_or_else(|refusal| panic!("{name} {source:?}: its root: {refusal}"));
    let mut met = 0;
    nodes.walk(NodeIndex::ROOT, &mut |step, _| {
        met += u32::from(step == Step::Meet);
        Visit::Enter
    });
    assert_eq!(nodes.refused(), None, "{name} {source:?}");
    met
}

fn every_fixture_is_left_whole<G: EngineGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> u32 {
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let sources = fixture_sources(name);
    assert!(!sources.is_empty(), "{name} has fixtures");
    let mut nodes = 0;
    for source in &sources {
        let tree = parsed(grammar, options(), source);
        let root = tree.tree().root_node();
        let left = nodes_left::<G, N>(name, &mut engine, source);
        if !root.is_error() {
            assert_eq!(left, descendant_count(&root), "{name} {source:?}: every node the parser made is in the records");
        }
        nodes += left;
    }
    nodes
}

#[test]
fn a_parse_leaves_its_source_and_every_node_in_built_storage() {
    let left = [
        ("python", every_fixture_is_left_whole::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults)),
        ("regex", every_fixture_is_left_whole::<_, sittir_regex::render::AnyNode>("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults)),
        ("rust", every_fixture_is_left_whole::<_, sittir_rust::render::AnyNode>("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults)),
        ("scm", every_fixture_is_left_whole::<_, sittir_scm::render::AnyNode>("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults)),
        ("typescript", every_fixture_is_left_whole::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults)),
    ];
    for (name, nodes) in left {
        assert!(nodes > 0, "{name} left nodes");
    }
}

const NESTED: usize = 10_000;

fn nested(before: &str, after: &str) -> String {
    format!("{before}{}1{}{after}", "(".repeat(NESTED), ")".repeat(NESTED))
}

#[test]
fn a_deeply_nested_source_is_read_whole_at_parse() {
    let rust = nodes_left::<_, sittir_rust::render::AnyNode>("rust", &mut Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine"), &nested("fn f() {\n    let x = ", ";\n}\n"));
    let typescript = nodes_left::<_, sittir_typescript::render::AnyNode>(
        "typescript",
        &mut Engine::new(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults()).expect("an engine"),
        &nested("let x = ", ";\n"),
    );
    let python = nodes_left::<_, sittir_python::render::AnyNode>("python", &mut Engine::new(sittir_python::PythonGrammar, sittir_python::render::options::defaults()).expect("an engine"), &nested("x = ", "\n"));
    for (name, nodes) in [("rust", rust), ("typescript", typescript), ("python", python)] {
        assert!(nodes as usize > NESTED, "{name}: {nodes} nodes for {NESTED} levels");
    }
}

#[test]
fn a_link_record_takes_eight_words() {
    assert_eq!(LINK_WORDS, 8);
}
