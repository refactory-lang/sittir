//! A parse places its extras and `ERROR`s: for every node of every fixture,
//! the records the engine's side store names for a side of the node, right
//! after an arena parse and before anything reads a side, are those of the
//! extras and `ERROR`s the tree's placement assigns that side, in order,
//! with a line-break member in each gap the side holds whose whitespace
//! holds a line break in the source, and in no other. A
//! unit has no inside: what the tree's placement assigns inside one, the
//! parse keeps nowhere, as it keeps no side of a node its holder keeps as a
//! fixed token or a flag, and the tree's placement gives a flag's keyword no
//! side. The parse sets apart the list items the tree's lookup does: an item
//! with a record in its record's header, any other with a blank-line member
//! first on the leading side it places. Looking up every side of every node
//! of the records' tree takes its placement no step.
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
use sittir_core::trivia_table::TriviaSide;
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
    let mut pending = vec![(NodeIndex::ROOT, NodeIndex::ROOT, None)];
    while let Some((run, row, holder)) = pending.pop() {
        let routed = holder.and_then(|holder| {
            let at = theirs.kid(holder);
            grammar.slot_routes(&mut theirs, &at)
        });
        let fixed_token_or_flag = routed.as_ref().is_some_and(|routed| routed.keeps_as_fixed_token_or_flag(row));
        let flag = routed.as_ref().is_some_and(|routed| routed.is_flag(row));
        for side in [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner] {
            let inside_a_unit = side == TriviaSide::Inner && grammar.surface_kinds().units.contains(&theirs.kid(row).grammar);
            let kept: Vec<Bytes> = placement
                .tables()
                .flat_map(|table| table.side(row, side).iter())
                .filter(|_| !inside_a_unit && !fixed_token_or_flag)
                .map(|entry| entry.index())
                .map(|at| theirs.kid(at))
                .map(|kid| (kid.start, kid.end))
                .collect();
            let stored = records
                .place(run)
                .and_then(|place| match place {
                    Place::Node(_) => engine.written().side(place, side, &*built).expect("a placed side"),
                    _ => None,
                })
                .unwrap_or_default();
            let placed: Vec<Option<Bytes>> = stored
                .iter()
                .filter_map(|entry| match entry {
                    TriviaEntry::Record(entry) => Some(runs.index_of(entry.record.at).ok().map(|at| runs.kid(at)).map(|kid| (kid.start, kid.end))),
                    TriviaEntry::Value(_) => None,
                })
                .collect();
            assigned += kept.len();
            if flag && placement.tables().any(|table| !table.side(row, side).is_empty()) {
                let kid = theirs.kid(row);
                apart.push(format!("{}..{} {} {side:?}: the tree's placement gives a flag's keyword a side", kid.start, kid.end, G::kind_name(kid.grammar)));
            }
            drop(records.side_entries(run, side, false));
            if placed != kept.iter().copied().map(Some).collect::<Vec<_>>() {
                let kid = theirs.kid(row);
                apart.push(format!("{}..{} {} {side:?}: parse placed {placed:?}, the tree's placement {kept:?}", kid.start, kid.end, G::kind_name(kid.grammar)));
            }
            let seated = tree.side_entries(row, side, false);
            let written = shape_of(stored.iter().map(|entry| match entry {
                TriviaEntry::Record(_) => Some('R'),
                TriviaEntry::Value(SlotValue::Node(member)) => Some(member_letter(member)),
                TriviaEntry::Value(_) => None,
            }));
            let looked_up = shape_of(seated.iter().map(|entry| match entry {
                SideEntry::Source { .. } => Some('R'),
                SideEntry::Layout(TriviaEntry::Value(SlotValue::Node(member))) => Some(member_letter(member)),
                SideEntry::Layout(_) | SideEntry::Written(_) => None,
            }));
            if !fixed_token_or_flag && !inside_a_unit && placed.iter().all(Option::is_some) && written != looked_up {
                let kid = theirs.kid(row);
                apart.push(format!("{}..{} {} {side:?}: parse wrote {written:?}, the tree seats {looked_up:?}", kid.start, kid.end, G::kind_name(kid.grammar)));
            }
            if side == TriviaSide::Leading {
                let looked_up = seated.first().map_or(LayoutKinds::NONE, |entry| match entry {
                    SideEntry::Layout(entry) => blank_line_of(entry),
                    SideEntry::Source { .. } | SideEntry::Written(_) => LayoutKinds::NONE,
                });
                let set_apart = records.set_apart(run).unwrap_or(LayoutKinds::NONE);
                if set_apart != looked_up {
                    let kid = theirs.kid(row);
                    apart.push(format!("{}..{} {}: parse set it apart with {set_apart:?}, the tree's lookup {looked_up:?}", kid.start, kid.end, G::kind_name(kid.grammar)));
                }
            }
        }
        let (met, kept) = (ours.kids(run), theirs.kids(row));
        pending.extend(met.iter().zip(kept.iter()).map(|(met, kept)| (met.index, kept.index, Some(row))));
    }
    if records.placement_steps() > 0 {
        apart.push(format!("the records' tree placed its trivia in {} steps: a record tree reads its sides from the parse alone", records.placement_steps()));
    }
    (apart, assigned)
}

/// The blank-line kind `entry` is a member of, `LayoutKinds::NONE` for any
/// other entry.
fn blank_line_of<T: TriviaSeam>(entry: &TriviaEntry<T>) -> LayoutKinds {
    match entry.value() {
        Some(SlotValue::Node(member)) => member.seam_gap().filter(|gap| [LayoutKinds::BLANKLINE, LayoutKinds::DOUBLE_BLANKLINE].contains(gap)).unwrap_or(LayoutKinds::NONE),
        _ => LayoutKinds::NONE,
    }
}

/// A layout member as one letter: `D` a double blank-line member, `B` a
/// blank-line member, `N` a line-break member, `S` a space member, `?`
/// anything else.
fn member_letter<T: TriviaSeam>(member: &T) -> char {
    match member.seam_gap() {
        Some(LayoutKinds::DOUBLE_BLANKLINE) => 'D',
        Some(LayoutKinds::BLANKLINE) => 'B',
        Some(LayoutKinds::NEWLINE) => 'N',
        Some(LayoutKinds::SPACE) => 'S',
        _ => '?',
    }
}

/// A side's entries in order, each as one letter: a layout member as
/// `member_letter` spells it, `R` a record or an entry of the source, `?`
/// anything else, the blank-line member a list item leads with left out.
fn shape_of(entries: impl IntoIterator<Item = Option<char>>) -> String {
    let shape: String = entries.into_iter().map(|letter| letter.unwrap_or('?')).collect();
    shape.strip_prefix(['B', 'D']).map_or(shape.clone(), str::to_owned)
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

/// How many records a parse placed across every side of every node of
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
                    Place::Node(_) => engine.written().side(place, side, &*built).expect("a placed side"),
                    _ => None,
                })
                .map_or(0, |entries| entries.iter().filter(|entry| matches!(entry, TriviaEntry::Record(_))).count());
        }
        pending.extend(nodes.kids(at).iter().map(|kid| kid.index));
    }
    placed
}

#[test]
fn a_parse_places_a_comment_beside_a_separator_as_the_tree_s_placement_does() {
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
fn a_parse_places_an_error_at_a_zero_width_token_by_its_place_in_the_tree_as_the_tree_s_placement_does() {
    let (apart, assigned) = placed_apart::<_, sittir_python::render::AnyNode>(sittir_python::PythonGrammar, sittir_python::render::options::defaults, "print(f\"a\"'b {c}\")\n");
    assert!(assigned > 0, "the source holds an ERROR");
    assert!(apart.is_empty(), "{} sides apart:\n{}", apart.len(), apart.join("\n"));
}

#[test]
fn a_parse_keeps_no_side_of_a_node_its_holder_keeps_as_a_fixed_token_or_a_flag() {
    let rust = [
        "fn f() { let y = & /*c*/ mut x; }\n",
        "fn f() { let y = &mut /*c*/ x; }\n",
        "static /*d*/ mut X: u8 = 0;\n",
        "fn f(&mut /*c*/ self) {}\n",
        "fn f() { let /*c*/ mut x = 1; }\n",
        "fn f() { let mut /*c*/ x = 1; }\n",
        "fn f(x: & /*c*/ mut u8) {}\n",
        "fn f() { let &mut /*c*/ x = y; }\n",
        "fn f(x: *mut /*c*/ u8) {}\n",
        "fn f() { let y = &raw mut /*c*/ x; }\n",
        "extern crate /*c*/ foo;\n",
        "pub(crate /*c*/) fn f() {}\n",
        "pub(/*c*/ crate) fn f() {}\n",
        "fn f(& /*c*/ self) {}\n",
        "fn f(/*c*/ self) {}\n",
        "fn f(self /*c*/) {}\n",
        "pub(self /*c*/) fn f() {}\n",
    ];
    let typescript = [
        "let x: typeof import /*c*/ ('a');\n",
        "function f(this /*c*/: T) {}\n",
        "a?. /*c*/ [0];\n",
        "a /*c*/ ?.[0];\n",
        "class C extends B { override /*c*/ m() {} }\n",
        "class C extends B { /*c*/ override m() {} }\n",
        "class C { constructor(override /*c*/ x: T) {} }\n",
    ];
    let found = rust
        .iter()
        .map(|source| (*source, placed_apart::<_, sittir_rust::render::AnyNode>(sittir_rust::RustGrammar, sittir_rust::render::options::defaults, source)))
        .chain(typescript.iter().map(|source| (*source, placed_apart::<_, sittir_typescript::render::AnyNode>(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults, source))));
    let apart: Vec<String> = found.flat_map(|(source, (apart, _))| apart.into_iter().map(move |line| format!("{source:?}: {line}"))).collect();
    assert!(apart.is_empty(), "{} sides apart:\n{}", apart.len(), apart.join("\n"));
}

#[test]
fn nothing_under_an_error_is_placed() {
    let placed = [
        ("an ERROR holding an ERROR", 1, placed_entries::<_, sittir_python::render::AnyNode>(sittir_python::PythonGrammar, sittir_python::render::options::defaults, "\n    case *x,:\n        y = 0")),
        ("a comment inside a python ERROR", 1, placed_entries::<_, sittir_python::render::AnyNode>(sittir_python::PythonGrammar, sittir_python::render::options::defaults, "def f(x # c\n  :\n")),
        ("a comment inside a rust ERROR", 1, placed_entries::<_, sittir_rust::render::AnyNode>(sittir_rust::RustGrammar, sittir_rust::render::options::defaults, "@@ /* c */ @@ x\n")),
        ("a regex source wholly an ERROR", 0, placed_entries::<_, sittir_regex::render::AnyNode>(sittir_regex::RegexGrammar, sittir_regex::render::options::defaults, "*")),
        ("a rust source wholly an ERROR", 0, placed_entries::<_, sittir_rust::render::AnyNode>(sittir_rust::RustGrammar, sittir_rust::render::options::defaults, "const default")),
    ];
    for (case, outermost, placed) in placed {
        assert_eq!(placed, outermost, "{case}: the outermost ERROR alone is placed, unless it is the root, which renders its own span");
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
    let Some(place @ Place::Node(_)) = ParsedTree::over_records(&engine, &built, root).expect("a tree over the records").place(NodeIndex::ROOT) else { panic!("the root's place") };
    let stored = engine.written().side(place, TriviaSide::Inner, &*built).expect("a placed side").expect("the root's inner side");
    assert_eq!(stored.len(), 1, "the root's inner holds the ERROR alone");
    let TriviaEntry::Record(entry) = &stored[0] else { panic!("the ERROR is named by its record, as a built side names it: {:?}", stored[0]) };
    assert_eq!((entry.record.kind, entry.record.at), (sittir_core::types::KindId::ERROR, at), "the entry names the ERROR's own record");
}

/// A source whose root is an `ERROR`, with what a parse placed on the root's
/// own sides: the entries the tree's placement assigns them, and the records
/// an arena parse placed there.
type ErrorRoot = (String, usize, usize);

/// The fixtures of a grammar whose root is an `ERROR` (`ErrorRoot`).
fn error_roots<G: sittir_core::arena::RecordGrammar + Copy, N: HydrateNode>(grammar: &str, of: G, options: fn() -> ResolvedOptions) -> Vec<ErrorRoot> {
    let sides = [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner];
    fixture_sources(grammar)
        .into_iter()
        .filter_map(|source| {
            let tree = parsed(of, options(), &source);
            if tree.nodes().kid(NodeIndex::ROOT).grammar != sittir_core::types::KindId::ERROR {
                return None;
            }
            let placement = tree.placed_trivia();
            let assigned = sides.iter().map(|&side| placement.tables().map(|table| table.side(NodeIndex::ROOT, side).len()).sum::<usize>()).sum();
            let mut engine = Engine::new(of, options()).expect("an engine");
            let parse = engine.parse_records::<N>(&source).expect("a parse");
            let root = parse.root.expect("the ERROR's record");
            let built = engine.written().built();
            let place = Place::record(root);
            let stored = sides.iter().filter_map(|&side| engine.written().side(place, side, &*built).expect("a placed side")).map(|entries| entries.len()).sum();
            Some((source, assigned, stored))
        })
        .collect()
}

#[test]
fn a_root_that_is_an_error_is_placed_on_no_side_of_its_own() {
    let roots: Vec<(&str, Vec<ErrorRoot>)> = vec![
        ("python", error_roots::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults)),
        ("regex", error_roots::<_, sittir_regex::render::AnyNode>("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults)),
        ("rust", error_roots::<_, sittir_rust::render::AnyNode>("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults)),
        ("scm", error_roots::<_, sittir_scm::render::AnyNode>("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults)),
        ("typescript", error_roots::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults)),
    ];
    let counts: Vec<(&str, usize)> = roots.iter().map(|(grammar, found)| (*grammar, found.len())).collect();
    assert!(counts.iter().any(|&(grammar, count)| grammar == "regex" && count > 0) && counts.iter().any(|&(grammar, count)| grammar == "rust" && count > 0), "the fixtures hold roots that are an ERROR: {counts:?}");
    let placed: Vec<String> = roots
        .iter()
        .flat_map(|(grammar, found)| found.iter().filter(|(_, assigned, stored)| *assigned + *stored > 0).map(move |(source, assigned, stored)| format!("{grammar} {:?}: {assigned} assigned, {stored} stored", source.chars().take(40).collect::<String>())))
        .collect();
    assert!(placed.is_empty(), "roots that are an ERROR placed on a side of their own ({counts:?}):\n{}", placed.join("\n"));
}

const _: () = {
    assert!(!sittir_regex::render::kind_ids::SURFACE_KINDS.named_extras, "regex's only extra is a line break");
    assert!(sittir_python::render::kind_ids::SURFACE_KINDS.named_extras, "python has comments and line continuations");
    assert!(sittir_rust::render::kind_ids::SURFACE_KINDS.named_extras, "rust has comments");
    assert!(sittir_scm::render::kind_ids::SURFACE_KINDS.named_extras, "scm has comments");
    assert!(sittir_typescript::render::kind_ids::SURFACE_KINDS.named_extras, "typescript has comments");
};

/// Whether a tree of `source`, and the tree over the records its arena
/// parse left, can hold an extra or `ERROR` on a side.
fn holds_entries<G: sittir_core::arena::RecordGrammar + Copy, N: HydrateNode>(grammar: G, options: fn() -> ResolvedOptions, source: &str) -> (bool, bool) {
    let tree = parsed(grammar, options(), source);
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let root = engine.parse_records::<N>(source).expect("a parse").root.expect("a root");
    let built = engine.written().built();
    let records = ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
    (tree.holds_entries(), records.holds_entries())
}

#[test]
fn a_tree_holds_entries_where_its_grammar_has_trivia_that_isn_t_whitespace_or_it_holds_an_error() {
    let regex = |source| holds_entries::<_, sittir_regex::render::AnyNode>(sittir_regex::RegexGrammar, sittir_regex::render::options::defaults, source);
    assert_eq!(regex("a\nb"), (false, false), "a regex tree with no ERROR");
    assert_eq!(regex("a(b"), (true, true), "a regex tree that holds an ERROR");
    let python = holds_entries::<_, sittir_python::render::AnyNode>(sittir_python::PythonGrammar, sittir_python::render::options::defaults, "x = 1\n");
    assert_eq!(python, (true, true), "a python tree with no comment");
}

/// What `Backing::entries_within` answers over the records an arena parse
/// of `source` left, for its root and for each top-level node.
fn entries_within_of(source: &str) -> (bool, Vec<bool>) {
    use sittir_core::engine::{Backing, Records};
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let root = engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse").root.expect("a root");
    let built = engine.written().built();
    let records = ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
    let mut nodes = records.nodes();
    let kids = nodes.kids(NodeIndex::ROOT);
    let within = |span| Records::entries_within(&records, span);
    (within(nodes.kid(NodeIndex::ROOT).span()), kids.iter().filter(|kid| kid.holder()).map(|kid| within(kid.span())).collect())
}

#[test]
fn a_read_answers_which_nodes_can_hold_an_entry_from_where_its_entries_are() {
    assert_eq!(entries_within_of("fn a() {}\nfn b() {}\n"), (false, vec![false, false]), "a read with no entry");
    assert_eq!(entries_within_of("fn a() {}\n// c\nfn b() {}\n"), (true, vec![false, true]), "a comment leading the second item");
    assert_eq!(entries_within_of("fn a() { /* c */ x; }\nfn b() {}\n"), (true, vec![true, false]), "a comment inside the first item, none past it");
    assert_eq!(entries_within_of("fn a() {}\n\nfn b() {}\n"), (true, vec![false, true]), "a blank line setting the second item apart");
    assert_eq!(entries_within_of("fn a() {} // c\nfn b() {}\n"), (true, vec![true, false]), "a comment trailing the first item");
}
