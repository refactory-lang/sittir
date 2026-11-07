//! A region alone and inside the whole tree's record agree: every run of
//! whitespace a side takes measures the same in its region's record as in
//! the whole tree's full-depth one, over every source the grammars'
//! round-trip fixtures read, their `ERROR`s included.

use sittir_core::baseline::Tally;
use sittir_core::engine::EngineGrammar;
use sittir_core::options::ResolvedOptions;
use sittir_parity_tests::{load_fixtures, on_deep_stack, parsed, ParityFixture};

/// Each distinct source the grammar's round-trip fixtures read.
fn sources(grammar: &str) -> std::collections::BTreeSet<String> {
    load_fixtures(grammar)
        .into_iter()
        .filter_map(|fixture| match fixture {
            ParityFixture::RoundTrip(fixture) => Some(fixture.source_in),
            ParityFixture::Render { .. } => None,
        })
        .collect()
}

/// The sources of `grammar` where a run measures one way in its region and
/// another in the whole tree's record, each measure on a fresh parse, with
/// the runs measured in all.
fn disagreeing<G: EngineGrammar>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> (Vec<String>, usize) {
    let parse = |source: &str| parsed(grammar, options(), source);
    let mut runs = 0;
    let disagree = sources(name)
        .into_iter()
        .filter(|source| {
            let (Ok(regions), Ok(whole)) = (parse(source).baseline_runs(false), parse(source).baseline_runs(true)) else {
                return false;
            };
            runs += regions.len();
            regions.iter().zip(&whole).any(|((_, region), (_, whole))| region.map(Tally::spelling) != whole.map(Tally::spelling))
        })
        .collect();
    (disagree, runs)
}

fn agrees<G: EngineGrammar + Send + 'static>(name: &'static str, grammar: G, options: fn() -> ResolvedOptions) {
    let (disagree, runs) = on_deep_stack(move || disagreeing(name, grammar, options));
    assert_ne!(runs, 0, "{name}: the fixtures have runs");
    assert_eq!(disagree, Vec::<String>::new(), "{name}: {} sources measure a run differently in its region and in the whole tree", disagree.len());
}

#[test]
fn every_python_run_measures_alike_in_its_region_and_the_whole_tree() {
    agrees("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults);
}

#[test]
fn every_regex_run_measures_alike_in_its_region_and_the_whole_tree() {
    agrees("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults);
}

#[test]
fn every_rust_run_measures_alike_in_its_region_and_the_whole_tree() {
    agrees("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults);
}

#[test]
fn every_scm_run_measures_alike_in_its_region_and_the_whole_tree() {
    agrees("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults);
}

#[test]
fn every_typescript_run_measures_alike_in_its_region_and_the_whole_tree() {
    agrees("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults);
}
