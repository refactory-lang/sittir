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
use sittir_core::tree_sitter;
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
                    TriviaEntry::Value(_) | TriviaEntry::Tokens => None,
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
                    SideEntry::Source { .. } | SideEntry::Written(_) | SideEntry::Tokens => false,
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

/// The bytes of the extras and `ERROR`s a parse places past the tokens
/// after the node they trail (`Placed::past`), and of those the tree's
/// placement sets after the place of those tokens on a trailing side
/// (`Assigned::Tokens`), each in source order.
fn placed_past<G: sittir_core::arena::RecordGrammar, N: HydrateNode>(grammar: G, options: fn() -> ResolvedOptions, source: &str) -> (Vec<Bytes>, Vec<Bytes>) {
    let tree = parsed(grammar, options(), source);
    let mut theirs = tree.nodes();
    let placement = tree.placed_trivia();
    let mut kept: Vec<Bytes> = placement
        .tables()
        .flat_map(sittir_core::trivia_table::Table::sides)
        .filter(|&((_, side), _)| side == TriviaSide::Trailing)
        .flat_map(|(_, entries)| entries.iter().skip_while(|entry| !matches!(entry, Assigned::Tokens)).copied().collect::<Vec<_>>())
        .filter_map(|entry| match entry {
            Assigned::Extra(at) | Assigned::Error(at) => Some(at),
            _ => None,
        })
        .map(|at| theirs.kid(at))
        .map(|kid| (kid.start, kid.end))
        .collect();
    kept.sort_unstable();
    let engine = Engine::new(grammar, options()).expect("an engine");
    let mut parser = tree_sitter::Parser::new();
    grammar.configure_parser(&mut parser).expect("the language");
    let syntax = parser.parse(source, None).expect("a parse");
    let mut built = engine.written().built_mut();
    let entry = built.write_source(&Source { text: source, breaks_lf: !source.contains('\r') }).expect("the source's entry");
    let mut ctx = sittir_core::read::ReadCtx::new(source, sittir_core::types::TreeId(0), grammar.shows()).with_relaxes(grammar.relaxes());
    let (mut placed, mut apart) = (Vec::new(), Vec::new());
    sittir_core::arena::hydrate_whole::<N>(&mut syntax.walk(), &mut ctx, Some(entry), grammar.surface_kinds(), &mut sittir_core::arena::ReadWriter::new(&mut built), &mut placed, &mut apart).expect("the records");
    let mut past: Vec<Bytes> = placed.iter().filter(|placed| placed.past).map(|placed| (placed.span.start, placed.span.end)).collect();
    past.sort_unstable();
    (past, kept)
}

#[test]
fn a_parse_marks_past_the_tokens_after_a_node_the_entries_the_tree_s_placement_sets_after_them() {
    let cases = [
        ("interface I {\n  a: string; // c\n  b: number\n}\n", vec![(27, 31)]),
        ("enum E {\n  A, // c\n  B\n}\n", vec![(14, 18)]),
        ("f(a, // c\n  b)\n", vec![(5, 9)]),
        ("const x = b + // c\n  d\n", vec![(14, 18)]),
        ("f(a /* x */, // c\n  b)\n", vec![(13, 17)]),
        ("f(a, /* c */ b)\n", vec![]),
        ("const x = [a, b, // c\n]\n", vec![]),
    ];
    for (source, expected) in cases {
        let (past, kept) = placed_past::<_, sittir_typescript::render::AnyNode>(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults, source);
        assert_eq!(kept, expected, "{source:?}: the tree's placement");
        assert_eq!(past, kept, "{source:?}: the parse");
    }
}

#[test]
fn a_parse_places_a_comment_past_the_tokens_after_a_node_as_the_tree_s_placement_does() {
    let sources = [
        "interface I {\n  a: string; // c\n  b: number\n}\n",
        "interface I {\n  a: string, // c\n  b: number\n}\n",
        "enum E {\n  A, // c\n  B\n}\n",
        "f(a, // c\n  b)\n",
        "x([a, // c\n  b])\n",
        "f(a, /* c */ b)\n",
        "x([/* A */ a, /* B */ b])\n",
        "const x = b + // c\n  d\n",
        "const x = // c\n  1\n",
        "function f() {\n  a; /* x\n  */ /* y */ b;\n}\n",
    ];
    let apart: Vec<String> = sources
        .iter()
        .flat_map(|source| {
            let (apart, assigned) = placed_apart::<_, sittir_typescript::render::AnyNode>(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults, source);
            assert!(assigned > 0, "{source:?} holds extras");
            apart.into_iter().map(move |line| format!("{source:?}: {line}"))
        })
        .collect();
    assert!(apart.is_empty(), "{} sides apart:\n{}", apart.len(), apart.join("\n"));
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
