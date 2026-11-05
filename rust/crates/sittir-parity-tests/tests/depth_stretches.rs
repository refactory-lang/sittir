//! The stretches a grammar's templates indent nest: two either lie apart or
//! one holds the other. The assignment measures each line's structural
//! indentation from the stretches open around it, each measured once as it
//! opens, so a grammar whose stretches crossed would give wrong widths.
//! Checked over every round-trip fixture source of the five grammars.

use sittir_core::engine::EngineGrammar;
use sittir_core::options::ResolvedOptions;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{load_fixtures, parsed, ParityFixture};

/// The stretches of every distinct round-trip fixture source of `name`,
/// each checked to lie inside the one open around it, if any: their count.
fn stretches_nest<G: EngineGrammar + Copy>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> usize {
    let mut sources: Vec<String> = load_fixtures(name)
        .into_iter()
        .filter_map(|fixture| match fixture {
            ParityFixture::RoundTrip(fixture) => Some(fixture.source_in),
            ParityFixture::Render { .. } => None,
        })
        .collect();
    sources.sort_unstable();
    sources.dedup();
    let mut checked = 0;
    for source in &sources {
        let tree = parsed(grammar, options(), source);
        let walk = sittir_core::trivia_table::walk(tree.tree().root_node(), NodeIndex::ROOT, source);
        let mut open: Vec<(u32, u32)> = Vec::new();
        for (start, end) in walk.depth_stretches(source, grammar.surface_kinds().depth) {
            while open.last().is_some_and(|&(_, close)| close <= start) {
                open.pop();
            }
            if let Some(&(outer_start, outer_end)) = open.last() {
                assert!(end <= outer_end, "{name}: the stretch {start}..{end} crosses the end of {outer_start}..{outer_end} in {source:?}");
            }
            open.push((start, end));
            checked += 1;
        }
    }
    checked
}

#[test]
fn every_fixture_source_s_depth_stretches_nest() {
    let counts = [
        ("python", stretches_nest("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults)),
        ("regex", stretches_nest("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults)),
        ("rust", stretches_nest("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults)),
        ("scm", stretches_nest("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults)),
        ("typescript", stretches_nest("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults)),
    ];
    eprintln!("stretches checked: {counts:?}");
    assert!(counts.iter().filter(|(_, count)| *count > 0).count() >= 3, "the grammars that declare depth regions have stretches: {counts:?}");
}
