//! A parse places its extras: for every node of every fixture, the extras
//! the engine's side store holds for a side of the node, right after an
//! arena parse and before anything reads a side, are the ones the tree's
//! placement assigns that side, in order.
#![cfg(feature = "arena")]

use sittir_core::arena::HydrateNode;
use sittir_core::engine::{Engine, ParsedTree};
use sittir_core::nodes::Nodes;
use sittir_core::options::ResolvedOptions;
use sittir_core::read::SideEntry;
use sittir_core::slot::SlotValue;
use sittir_core::trivia::TriviaEntry;
use sittir_core::trivia_store::Place;
use sittir_core::trivia_table::TriviaSide;
use sittir_core::types::{KindId, NodeIndex, Span};
use sittir_parity_tests::{fixture_sources, parsed};

type Extras = Vec<(KindId, Span)>;

fn extra_of<T>(entry: &TriviaEntry<T>) -> Option<(KindId, Span)> {
    match entry {
        TriviaEntry::Value(SlotValue::Coord(coord)) => Some((coord.kind?, coord.span)),
        _ => None,
    }
}

/// The nodes of `source` whose extras the parse placed apart from the
/// tree's placement, and how many extras the tree's placement assigns.
fn placed_apart<G: sittir_core::arena::RecordGrammar, N: HydrateNode>(grammar: G, options: fn() -> ResolvedOptions, source: &str) -> (Vec<String>, usize) {
    let tree = parsed(grammar, options(), source);
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let Some(root) = engine.parse_records::<N>(source).expect("a parse").root else { return (Vec::new(), 0) };
    let built = engine.written().built();
    let records = ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
    let (mut ours, mut theirs) = (records.nodes(), tree.nodes());
    let (mut apart, mut assigned) = (Vec::new(), 0);
    let mut pending = vec![(NodeIndex::ROOT, NodeIndex::ROOT)];
    while let Some((run, row)) = pending.pop() {
        for side in [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner] {
            let kept: Extras = tree
                .side_entries(row, side, false)
                .iter()
                .filter_map(|entry| match entry {
                    SideEntry::Source { entry, .. } => extra_of(entry),
                    _ => None,
                })
                .collect();
            let placed: Extras = records
                .place(run)
                .and_then(|place| match place {
                    Place::Read { tree, site } => engine.written().side(Place::Placed { tree, site }, side),
                    _ => None,
                })
                .unwrap_or_default()
                .iter()
                .filter_map(extra_of)
                .collect();
            assigned += kept.len();
            if placed != kept {
                let kid = theirs.kid(row);
                apart.push(format!("{}..{} {} {side:?}: parse placed {placed:?}, the tree's placement {kept:?}", kid.start, kid.end, grammar.kind_name(kid.grammar)));
            }
        }
        let (met, kept) = (ours.kids(run), theirs.kids(row));
        pending.extend(met.iter().zip(kept.iter()).map(|(met, kept)| (met.index, kept.index)));
    }
    (apart, assigned)
}

fn fixtures_apart<G: sittir_core::arena::RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> (Vec<String>, usize) {
    fixture_sources(name).iter().fold((Vec::new(), 0), |(mut apart, assigned), source| {
        let (found, extras) = placed_apart::<G, N>(grammar, options, source);
        apart.extend(found.into_iter().next().map(|first| format!("{name} {source:?}: {first}")));
        (apart, assigned + extras)
    })
}

#[test]
fn a_parse_places_each_extra_on_the_side_the_tree_s_placement_assigns_it() {
    let found = [
        fixtures_apart::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults),
        fixtures_apart::<_, sittir_regex::render::AnyNode>("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults),
        fixtures_apart::<_, sittir_rust::render::AnyNode>("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults),
        fixtures_apart::<_, sittir_scm::render::AnyNode>("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults),
        fixtures_apart::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults),
    ];
    let assigned: Vec<usize> = found.iter().map(|(_, assigned)| *assigned).collect();
    assert!(assigned.iter().sum::<usize>() > 0, "the fixtures hold extras");
    let apart: Vec<&String> = found.iter().flat_map(|(apart, _)| apart).collect();
    assert!(apart.is_empty(), "{} sources apart; extras assigned per grammar {assigned:?}:\n{}", apart.len(), apart.iter().take(6).map(|line| line.as_str()).collect::<Vec<_>>().join("\n"));
}
