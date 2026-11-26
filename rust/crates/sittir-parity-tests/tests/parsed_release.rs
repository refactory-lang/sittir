//! A parsed root is released as a built one is: its handle's count drops,
//! and every entry the parse left with it, its source included, is released
//! with it, each by its one holder. Every fixture source of every grammar,
//! parsed and its root released, leaves the arena as it was before the
//! parse, and a second release of the root does nothing.
#![cfg(feature = "arena")]

use sittir_core::arena::count::Held;
use sittir_core::arena::HydrateNode;
use sittir_core::engine::{Engine, EngineGrammar};
use sittir_core::options::ResolvedOptions;
use sittir_parity_tests::fixture_sources;

fn every_parse_is_released_whole<G: EngineGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> usize {
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let sources = fixture_sources(name);
    assert!(!sources.is_empty(), "{name} has fixtures");
    let mut kept = Vec::new();
    for source in &sources {
        let before = engine.written().built().allocated_bytes();
        let parse = engine.parse_records::<N>(source).unwrap_or_else(|refusal| panic!("{name} {source:?}: {refusal}"));
        let Some(root) = parse.root else { continue };
        engine.written().release(Held::Record(root), true).unwrap_or_else(|refusal| panic!("{name} {source:?}: releasing its root: {refusal}"));
        engine.written().release(Held::Record(root), true).unwrap_or_else(|refusal| panic!("{name} {source:?}: releasing its root again: {refusal}"));
        let after = engine.written().built().allocated_bytes();
        if after != before {
            kept.push(format!("{source:?}: {before} bytes before the parse, {after} after its root's release"));
        }
    }
    assert!(kept.is_empty(), "{name}: {} sources keep entries past their root's release:\n{}", kept.len(), kept.iter().take(8).cloned().collect::<Vec<_>>().join("\n"));
    sources.len()
}

#[test]
fn releasing_a_parsed_root_releases_every_entry_its_parse_left() {
    let released = [
        ("python", every_parse_is_released_whole::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults)),
        ("regex", every_parse_is_released_whole::<_, sittir_regex::render::AnyNode>("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults)),
        ("rust", every_parse_is_released_whole::<_, sittir_rust::render::AnyNode>("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults)),
        ("scm", every_parse_is_released_whole::<_, sittir_scm::render::AnyNode>("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults)),
        ("typescript", every_parse_is_released_whole::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults)),
    ];
    for (name, sources) in released {
        assert!(sources > 0, "{name}");
    }
}
