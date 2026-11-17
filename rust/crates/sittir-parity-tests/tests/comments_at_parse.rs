//! A parse places its extras and `ERROR`s: for every node of every fixture,
//! the records the engine's side store names for a side of the node, right
//! after an arena parse and before anything reads a side, are those of the
//! extras and `ERROR`s the tree's placement assigns that side, in order. A
//! list item the source sets apart with a blank line holds a blank-line
//! member first on its leading side, there as in the tree's lookup.
#![cfg(feature = "arena")]

use sittir_core::arena::source::Source;
use sittir_core::arena::{HydrateNode, RunNodes, RunTable};
use sittir_core::engine::{Engine, ParsedTree};
use sittir_core::nodes::Nodes;
use sittir_core::options::ResolvedOptions;
use sittir_core::layout_kinds::LayoutKinds;
use sittir_core::read::SideEntry;
use sittir_core::slot::SlotValue;
use sittir_core::trivia::{TriviaEntry, TriviaSeam};
use sittir_core::trivia_store::Place;
use sittir_core::trivia_table::{Assigned, TriviaSide};
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{fixture_sources, parsed};

/// The bytes of an entry: where it starts and ends in the source.
type Bytes = (u32, u32);

/// The nodes of `source` whose extras and `ERROR`s the parse placed apart
/// from the tree's placement, and how many the tree's placement assigns.
fn placed_apart<G: sittir_core::arena::RecordGrammar, N: HydrateNode>(grammar: G, options: fn() -> ResolvedOptions, source: &str) -> (Vec<String>, usize) {
    let tree = parsed(grammar, options(), source);
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let parse = engine.parse_records::<N>(source).expect("a parse");
    let Some(root) = parse.root else { return (Vec::new(), 0) };
    let built = engine.written().built();
    let text = Source::read(&*built, parse.source).expect("its source entry").text;
    let records = ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
    let table = RunTable::default();
    let mut runs = RunNodes::holding(&*built, text, root, &table).expect("its root");
    let placement = tree.placed_trivia();
    let (mut ours, mut theirs) = (records.nodes(), tree.nodes());
    let (mut apart, mut assigned) = (Vec::new(), 0);
    let mut pending = vec![(NodeIndex::ROOT, NodeIndex::ROOT)];
    while let Some((run, row)) = pending.pop() {
        for side in [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner] {
            let kept: Vec<Bytes> = placement
                .tables()
                .flat_map(|table| table.side(row, side).iter())
                .filter_map(|entry| match *entry {
                    Assigned::Extra(at) | Assigned::Error(at) | Assigned::Member(at) => Some(at),
                    _ => None,
                })
                .map(|at| theirs.kid(at))
                .map(|kid| (kid.start, kid.end))
                .collect();
            let stored = records
                .place(run)
                .and_then(|place| match place {
                    Place::Read { tree, site } => engine.written().side(Place::Placed { tree, site }, side, &*built).expect("a placed side"),
                    _ => None,
                })
                .unwrap_or_default();
            let blank_first = stored.first().is_some_and(is_blank_line);
            let placed: Vec<Option<Bytes>> = stored
                .iter()
                .skip(usize::from(blank_first))
                .map(|entry| match entry {
                    TriviaEntry::Record(entry) => runs.index_of(entry.record.at).ok().map(|at| runs.kid(at)).map(|kid| (kid.start, kid.end)),
                    TriviaEntry::Value(_) => None,
                })
                .collect();
            assigned += kept.len();
            if placed != kept.iter().copied().map(Some).collect::<Vec<_>>() {
                let kid = theirs.kid(row);
                apart.push(format!("{}..{} {} {side:?}: parse placed {placed:?}, the tree's placement {kept:?}", kid.start, kid.end, grammar.kind_name(kid.grammar)));
            }
            if side == TriviaSide::Leading {
                let looked_up = tree.side_entries(row, side, false).first().is_some_and(|entry| match entry {
                    SideEntry::Layout(entry) => is_blank_line(entry),
                    SideEntry::Source { .. } | SideEntry::Written(_) => false,
                });
                if blank_first != looked_up {
                    let kid = theirs.kid(row);
                    apart.push(format!("{}..{} {}: parse set it apart {blank_first}, the tree's lookup {looked_up}", kid.start, kid.end, grammar.kind_name(kid.grammar)));
                }
            }
        }
        let (met, kept) = (ours.kids(run), theirs.kids(row));
        pending.extend(met.iter().zip(kept.iter()).map(|(met, kept)| (met.index, kept.index)));
    }
    (apart, assigned)
}

/// Whether `entry` is a blank-line whitespace member.
fn is_blank_line<T: TriviaSeam>(entry: &TriviaEntry<T>) -> bool {
    matches!(entry.value(), Some(SlotValue::Node(member)) if member.seam_gap() == Some(LayoutKinds::BLANKLINE))
}

fn fixtures_apart<G: sittir_core::arena::RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> (Vec<String>, usize) {
    fixture_sources(name).iter().fold((Vec::new(), 0), |(mut apart, assigned), source| {
        let (found, extras) = placed_apart::<G, N>(grammar, options, source);
        apart.extend(found.into_iter().next().map(|first| format!("{name} {source:?}: {first}")));
        (apart, assigned + extras)
    })
}

#[test]
fn a_parse_places_each_extra_and_error_on_the_side_the_tree_s_placement_assigns_it() {
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

/// How many entries a parse placed across every side of every node of
/// `source`.
fn placed_entries<G: sittir_core::arena::RecordGrammar, N: HydrateNode>(grammar: G, options: fn() -> ResolvedOptions, source: &str) -> usize {
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let root = engine.parse_records::<N>(source).expect("a parse").root.expect("a root");
    let built = engine.written().built();
    let records = ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
    let mut nodes = records.nodes();
    let (mut pending, mut placed) = (vec![NodeIndex::ROOT], 0);
    while let Some(at) = pending.pop() {
        for side in [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner] {
            placed += records
                .place(at)
                .and_then(|place| match place {
                    Place::Read { tree, site } => engine.written().side(Place::Placed { tree, site }, side, &*built).expect("a placed side"),
                    _ => None,
                })
                .map_or(0, |entries| entries.len());
        }
        pending.extend(nodes.kids(at).iter().map(|kid| kid.index));
    }
    placed
}

#[test]
fn nothing_under_an_error_is_placed() {
    let placed = [
        ("an ERROR holding an ERROR", placed_entries::<_, sittir_python::render::AnyNode>(sittir_python::PythonGrammar, sittir_python::render::options::defaults, "\n    case *x,:\n        y = 0")),
        ("a comment inside a python ERROR", placed_entries::<_, sittir_python::render::AnyNode>(sittir_python::PythonGrammar, sittir_python::render::options::defaults, "def f(x # c\n  :\n")),
        ("a comment inside a rust ERROR", placed_entries::<_, sittir_rust::render::AnyNode>(sittir_rust::RustGrammar, sittir_rust::render::options::defaults, "@@ /* c */ @@ x\n")),
        ("a regex source wholly an ERROR", placed_entries::<_, sittir_regex::render::AnyNode>(sittir_regex::RegexGrammar, sittir_regex::render::options::defaults, "*")),
        ("a rust source wholly an ERROR", placed_entries::<_, sittir_rust::render::AnyNode>(sittir_rust::RustGrammar, sittir_rust::render::options::defaults, "const default")),
    ];
    for (case, placed) in placed {
        assert_eq!(placed, 1, "{case}: the outermost ERROR alone is placed");
    }
}

#[test]
fn a_placed_error_is_the_entry_a_built_side_holds_for_it() {
    let source = "\n    case *x,:\n        y = 0";
    let mut engine = Engine::new(sittir_python::PythonGrammar, sittir_python::render::options::defaults()).expect("an engine");
    let parse = engine.parse_records::<sittir_python::render::AnyNode>(source).expect("a parse");
    let root = parse.root.expect("a root");
    let built = engine.written().built();
    let text = Source::read(&*built, parse.source).expect("its source entry").text;
    let table = RunTable::default();
    let mut runs = RunNodes::holding(&*built, text, root, &table).expect("its root");
    let error = runs.kids(NodeIndex::ROOT).iter().find(|kid| kid.grammar == sittir_core::types::KindId::ERROR).copied().expect("the source's ERROR");
    let Some(sittir_core::arena::NodeSite::Record(at)) = runs.site(error.index) else { panic!("the ERROR has a record of its own") };
    let Some(Place::Read { tree, site }) = ParsedTree::over_records(&engine, &built, root).expect("a tree over the records").place(NodeIndex::ROOT) else { panic!("the root's place") };
    let stored = engine.written().side(Place::Placed { tree, site }, TriviaSide::Inner, &*built).expect("a placed side").expect("the root's inner side");
    assert_eq!(stored.len(), 1, "the root's inner holds the ERROR alone");
    let TriviaEntry::Record(entry) = &stored[0] else { panic!("the ERROR is named by its record, as a built side names it: {:?}", stored[0]) };
    assert_eq!((entry.record.kind, entry.record.at), (sittir_core::types::KindId::ERROR, at), "the entry names the ERROR's own record");
}
