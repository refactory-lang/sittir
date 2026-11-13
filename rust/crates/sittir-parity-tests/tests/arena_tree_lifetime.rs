//! An arena parse leaves no tree: `Engine::parse_records` reads the whole
//! tree into the engine's built arena in one walk and drops it, and what is
//! left answers for the source. The source reads back from its entry, and
//! navigation over the records alone (`RunNodes`) finds every node the
//! parser made, in built storage many parses share.
#![cfg(feature = "arena")]

use sittir_core::arena::source::Source;
use sittir_core::arena::{HydrateNode, RunNodes, RunTable, LINK_WORDS};
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
    let table = RunTable::default();
    let mut nodes = RunNodes::holding(&*built, entry.text, root, &table).unwrap_or_else(|refusal| panic!("{name} {source:?}: its root: {refusal}"));
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

/// `text` with the id each `NodeIndex(…)` and `TreeId(…)` in it holds
/// blanked, and with no coordinate naming its node past the call: a records
/// tree and a parsed tree name the same node apart.
fn unnamed(text: &str) -> String {
    let mut out = String::new();
    let mut rest = text;
    while let Some(at) = ["NodeIndex(", "TreeId(", "NodeId(", "row: Some("].iter().filter_map(|open| rest.find(open).map(|at| at + open.len())).min() {
        out.push_str(&rest[..at]);
        rest = rest[at..].trim_start_matches(|c: char| c.is_ascii_digit());
    }
    let named = |row: &str| format!("carried: Some(CoordinateCarried {{ changed: ChangedEdges {{ leading: false, trailing: false }}, name: Some(NodeName {{ node: NodeId(), row: {row} }}) }})");
    (out + rest).replace(&named("None"), "carried: None").replace(&named("Some()"), "carried: None")
}

/// Each node of `source` whose sides its records answer apart from its
/// tree, by its bytes and kind.
fn sides_apart<G: EngineGrammar, N: HydrateNode>(grammar: G, options: fn() -> ResolvedOptions, source: &str) -> Vec<String>
where
    G::Trivia: std::fmt::Debug,
{
    use sittir_core::trivia_table::TriviaSide;
    let tree = parsed(grammar, options(), source);
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let Some(root) = engine.parse_records::<N>(source).expect("a parse").root else { return Vec::new() };
    let built = engine.written().built();
    let records = sittir_core::engine::ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
    let (mut ours, mut theirs) = (records.nodes(), tree.nodes());
    let mut apart = Vec::new();
    let mut pending = vec![(NodeIndex::ROOT, NodeIndex::ROOT)];
    while let Some((run, row)) = pending.pop() {
        for side in [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner] {
            let (left, kept) = (unnamed(&format!("{:?}", records.side_entries(run, side, false))), unnamed(&format!("{:?}", tree.side_entries(row, side, false))));
            if left != kept {
                let kid = theirs.kid(row);
                apart.push(format!("{}..{} {} {side:?}:\n  records {left}\n  tree    {kept}", kid.start, kid.end, grammar.kind_name(kid.grammar)));
            }
        }
        let (met, kept) = (ours.kids(run), theirs.kids(row));
        pending.extend(met.iter().zip(kept.iter()).map(|(met, kept)| (met.index, kept.index)));
    }
    apart
}

/// The fixtures of `name` with a node whose sides its records answer apart
/// from its tree, each with the first such node.
fn fixtures_apart<G: EngineGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> Vec<String>
where
    G::Trivia: std::fmt::Debug,
{
    fixture_sources(name).iter().filter_map(|source| sides_apart::<G, N>(grammar, options, source).into_iter().next().map(|apart| format!("{name} {source:?}: {apart}"))).collect()
}

#[test]
fn a_node_s_sides_read_from_its_records_as_from_its_tree() {
    let apart = [
        fixtures_apart::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults),
        fixtures_apart::<_, sittir_regex::render::AnyNode>("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults),
        fixtures_apart::<_, sittir_rust::render::AnyNode>("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults),
        fixtures_apart::<_, sittir_scm::render::AnyNode>("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults),
        fixtures_apart::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults),
    ]
    .concat();
    assert!(apart.is_empty(), "{} sources:\n{}", apart.len(), apart.iter().take(8).cloned().collect::<Vec<_>>().join("\n"));
}

/// The node `path` leads to from the root of `nodes`, each step a child's
/// position among its parent's.
fn at_path(nodes: &mut dyn Nodes<'_>, path: &[usize]) -> NodeIndex {
    path.iter().fold(NodeIndex::ROOT, |at, &position| nodes.kids(at)[position].index)
}

#[test]
fn a_side_written_to_a_read_s_node_is_read_by_every_later_call() {
    use sittir_core::engine::ParsedTree;
    use sittir_core::trivia_table::TriviaSide;
    let source = "fn f() {\n    // why\n    a\n}\n\nfn g() {}\n";
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let root = engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse").root.expect("a root");
    let (path, side, place) = {
        let built = engine.written().built();
        let records = ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
        let mut nodes = records.nodes();
        let mut pending = vec![Vec::new()];
        let mut found = None;
        while let Some(path) = pending.pop() {
            let at = at_path(&mut nodes, &path);
            if let Some(side) = [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].into_iter().find(|&side| !records.side_entries(at, side, false).is_empty()) {
                found = Some((path, side, records.place(at).expect("a place in the store")));
                break;
            }
            pending.extend((0..nodes.kids(at).len()).map(|position| [path.as_slice(), &[position]].concat()));
        }
        found.expect("a side that holds the comment")
    };
    assert_eq!(path.first(), Some(&0), "the comment lies in the first function");
    engine.written().write_held_side(place, side, Vec::new()).expect("a write");
    let built = engine.written().built();
    let records = ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
    let mut nodes = records.nodes();
    let (at, first, second) = (at_path(&mut nodes, &path), at_path(&mut nodes, &[0]), at_path(&mut nodes, &[1]));
    assert!(records.side_entries(at, side, false).is_empty(), "the written side is the one read");
    assert!(records.edited_within(NodeIndex::ROOT, false));
    assert!(records.edited_within(first, false) || first == at);
    assert!(records.edited_within(at, true));
    assert_eq!(records.edited_within(at, false), side == TriviaSide::Inner, "a node's own leading and trailing are not within it");
    assert!(!records.edited_within(second, true), "the second function holds no write");
}

/// The sources of `name`'s fixtures whose records store another layout
/// than their tree does, and how many of the sources store any.
fn layouts_apart<G: EngineGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> (Vec<String>, usize) {
    let mut storing = 0;
    let apart = fixture_sources(name)
        .iter()
        .filter_map(|source| {
            let tree = parsed(grammar, options(), source);
            let kept = tree.stored_layout();
            let mut engine = Engine::new(grammar, options()).expect("an engine");
            let root = engine.parse_records::<N>(source).expect("a parse").root?;
            let built = engine.written().built();
            let stored = sittir_core::engine::ParsedTree::over_records(&engine, &built, root).expect("a tree over the records").stored_layout();
            storing += usize::from(kept != sittir_core::layout::StoredLayout::default());
            (stored != kept).then(|| format!("{name} {source:?}: records {stored:?}, tree {kept:?}"))
        })
        .collect();
    (apart, storing)
}

#[test]
fn a_read_s_records_store_the_layout_its_tree_does() {
    let (apart, storing): (Vec<_>, Vec<_>) = [
        layouts_apart::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults),
        layouts_apart::<_, sittir_regex::render::AnyNode>("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults),
        layouts_apart::<_, sittir_rust::render::AnyNode>("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults),
        layouts_apart::<_, sittir_scm::render::AnyNode>("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults),
        layouts_apart::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults),
    ]
    .into_iter()
    .unzip();
    let apart = apart.concat();
    assert!(storing.iter().sum::<usize>() > 0, "some fixture stores a layout apart from its options");
    assert!(apart.is_empty(), "{} sources:\n{}", apart.len(), apart.iter().take(8).cloned().collect::<Vec<_>>().join("\n"));
}

/// Each `ERROR` node of `source` as its records keep it: where it is kept,
/// and where each of its children is.
fn errors_kept<G: EngineGrammar + Copy, N: HydrateNode>(grammar: G, options: fn() -> ResolvedOptions, source: &str) -> Vec<(Option<sittir_core::arena::NodeSite>, Vec<Option<sittir_core::arena::NodeSite>>)> {
    use sittir_core::trivia_store::Place;
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let Some(root) = engine.parse_records::<N>(source).expect("a parse").root else { return Vec::new() };
    let built = engine.written().built();
    let records = sittir_core::engine::ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
    let site = |index| match records.place(index) {
        Some(Place::Read { site, .. }) => Some(site),
        _ => None,
    };
    let mut nodes = records.nodes();
    let mut errors = Vec::new();
    nodes.walk(NodeIndex::ROOT, &mut |step, kid| {
        if step == Step::Meet && kid.grammar == sittir_core::types::KindId::ERROR {
            errors.push(kid.index);
        }
        Visit::Enter
    });
    errors.into_iter().map(|index| (site(index), nodes.kids(index).iter().map(|kid| site(kid.index)).collect())).collect()
}

#[test]
fn an_error_has_a_record_of_its_own_that_holds_its_children() {
    use sittir_core::arena::NodeSite;
    let kept = errors_kept::<_, sittir_rust::render::AnyNode>(sittir_rust::RustGrammar, sittir_rust::render::options::defaults, "// lead\nfn f() {\n    a ) b;\n}\n@@@\n");
    assert_eq!(kept.len(), 2, "one error in the block, one after the function: {kept:?}");
    for (error, children) in kept {
        let Some(NodeSite::Record(at)) = error else { panic!("an error is kept in a record of its own: {error:?}") };
        assert_ne!(children.len(), 0, "an error holds what it could not read");
        for child in children {
            assert!(matches!(child, Some(NodeSite::Row { holder, .. }) if holder == at), "an error's child is a row of the error's record: {child:?}");
        }
    }
}

#[test]
fn a_source_that_parses_to_an_error_alone_has_its_error_s_record_for_a_root() {
    let source = "const default";
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let parse = engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse");
    let root = parse.root.expect("a root");
    let built = engine.written().built();
    let table = RunTable::default();
    let mut nodes = RunNodes::holding(&*built, source, root, &table).expect("its root");
    let kid = nodes.kid(NodeIndex::ROOT);
    assert_eq!((kid.grammar, kid.start, kid.end), (sittir_core::types::KindId::ERROR, 0, 13));
    let tree = parsed(sittir_rust::RustGrammar, sittir_rust::render::options::defaults(), source);
    let spans = |kids: sittir_core::nodes::Kids| kids.iter().map(|kid| (kid.grammar, kid.start, kid.end)).collect::<Vec<_>>();
    let held = spans(tree.nodes().kids(NodeIndex::ROOT));
    assert_ne!(held.len(), 0, "the error holds what it could not read");
    assert_eq!(spans(nodes.kids(NodeIndex::ROOT)), held, "the root's children are the tree's");
}

/// The first coordinate a side of a node of `tree` holds, with the id of
/// the node it names.
fn held_coordinate<G: EngineGrammar, B: sittir_core::engine::Backing>(tree: &sittir_core::engine::ParsedTree<G, B>) -> (sittir_core::slot::NodeCoordinate, NodeIndex) {
    use sittir_core::trivia::TriviaEntry;
    use sittir_core::trivia_table::TriviaSide;
    use sittir_core::SlotValue;
    let mut nodes = tree.nodes();
    let mut met = Vec::new();
    nodes.walk(NodeIndex::ROOT, &mut |step, kid| {
        if step == Step::Meet {
            met.push(*kid);
        }
        Visit::Enter
    });
    let held = met.iter().find_map(|kid| {
        [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].into_iter().flat_map(|side| tree.side_entries(kid.index, side, false)).find_map(|entry| match entry.into_entry() {
            TriviaEntry::Value(SlotValue::Coord(coord)) => Some(coord),
            _ => None,
        })
    });
    let coord = held.expect("a side that holds a coordinate");
    let named = met.iter().find(|kid| kid.extra && kid.span() == coord.span).expect("the node the coordinate names");
    (coord, named.index)
}

#[test]
fn a_coordinate_of_a_read_s_node_names_its_record() {
    use sittir_core::arena::NodeSite;
    use sittir_core::trivia_store::Place;
    let source = "// lead\nfn f() {}\n";
    let (grammar, options) = (sittir_rust::RustGrammar, sittir_rust::render::options::defaults);
    let (kept, _) = held_coordinate(&parsed(grammar, options(), source));
    assert_eq!(kept.name(), None, "a tree's coordinate names its node by its tree and index");
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let root = engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse").root.expect("a root");
    let built = engine.written().built();
    let records = sittir_core::engine::ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
    let (coord, index) = held_coordinate(&records);
    let Some(Place::Read { site: NodeSite::Record(at), .. }) = records.place(index) else { panic!("a comment has a record") };
    assert_eq!(coord.name(), Some(NodeSite::Record(at).name()));
    assert_eq!((coord.span, coord.kind), (kept.span, kept.kind));
}

#[test]
fn a_read_s_record_answers_its_sides_by_its_address_as_a_built_record_does() {
    use sittir_core::arena::{Address, NodeSite};
    use sittir_core::trivia_store::Place;
    use sittir_core::trivia_table::TriviaSide;
    let source = "fn f() {\n    // why\n    a;\n}\n";
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let root = engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse").root.expect("a root");
    let (at, side, assigned): (Address, TriviaSide, String) = {
        let built = engine.written().built();
        let records = sittir_core::engine::ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
        let mut nodes = records.nodes();
        let mut met = Vec::new();
        nodes.walk(NodeIndex::ROOT, &mut |step, kid| {
            if step == Step::Meet {
                met.push(kid.index);
            }
            Visit::Enter
        });
        met.into_iter()
            .find_map(|index| {
                let Some(Place::Read { site: NodeSite::Record(at), .. }) = records.place(index) else { return None };
                [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].into_iter().find_map(|side| {
                    let entries = records.trivia_side(index, side);
                    (!entries.is_empty()).then(|| (at, side, format!("{entries:?}")))
                })
            })
            .expect("a record whose side holds the comment")
    };
    assert!(assigned.contains("Coord"), "the side holds the comment by its coordinate: {assigned}");
    let read = engine.built_trivia_side(at, side).expect("a side").expect("the side its source assigns");
    assert_eq!(unnamed(&format!("{read:?}")), unnamed(&assigned));
    engine.write_built_trivia_side(at, side, Vec::new()).expect("a write");
    assert_eq!(engine.built_trivia_side(at, side).expect("a side").map(|entries| entries.len()), Some(0), "the written side is the one read");
}

#[test]
fn siblings_are_answered_for_nodes_of_several_reads_each_from_its_own() {
    use sittir_core::engine::ParsedTree;
    let (first, second) = ("fn a() {}\nfn b() {}\n", "fn c() {}\n");
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let roots = [first, second].map(|source| engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse").root.expect("a root"));
    let items = |root, positions: &[usize]| {
        let built = engine.written().built();
        let records = ParsedTree::over_records(&engine, &built, root).expect("a tree over the records");
        let mut nodes = records.nodes();
        positions.iter().map(|&position| records.name_at(at_path(&mut nodes, &[position])).expect("a name")).collect::<Vec<_>>()
    };
    let (ab, c) = (items(roots[0], &[0, 1]), items(roots[1], &[0]));
    let spans = |names: &[_]| {
        engine.siblings_of(names).expect("siblings").into_iter().map(|siblings| [siblings.previous, siblings.next].map(|sibling| sibling.map(|sibling| (sibling.start, sibling.end)))).collect::<Vec<_>>()
    };
    assert_eq!(spans(&[ab[0], c[0], ab[1]]), [[None, Some((10, 19))], [None, None], [Some((0, 9)), None]]);
}

#[test]
fn a_call_s_tree_is_made_from_a_record_and_never_from_its_source_alone() {
    use sittir_core::arena::NodeSite;
    use sittir_core::engine::{ParsedTree, SourceTrees, Trees};
    use sittir_core::types::TreeId;
    let source = "fn f() {\n    g(1 + 2);\n}\n";
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let parse = engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse");
    let root = parse.root.expect("a root");
    let built = engine.written().built();
    let whole = ParsedTree::over_records(&engine, &built, root).expect("a tree from the root's record");
    let mut records = Vec::new();
    whole.nodes().walk(NodeIndex::ROOT, &mut |step, kid| {
        if step == Step::Meet {
            if let Some(NodeSite::Record(at)) = whole.name_at(kid.index).map(NodeSite::named) {
                records.push((at, kid.span(), kid.grammar));
            }
        }
        Visit::Enter
    });
    let &(deepest, span, kind) = records.last().expect("a record below the root");
    assert_ne!(deepest, root);
    let below = ParsedTree::over_records(&engine, &built, deepest).expect("a tree from a record below the root");
    let (top, own) = (below.nodes().kid(NodeIndex::ROOT), below.index_at(NodeSite::Record(deepest)).expect("its own node"));
    assert_eq!((top.start, top.end, top.grammar), { let top = whole.nodes().kid(NodeIndex::ROOT); (top.start, top.end, top.grammar) }, "the parents of a record lead to its source's root, the call's first node");
    assert_eq!(below.index_at(NodeSite::Record(root)), Some(NodeIndex::ROOT));
    let kid = below.nodes().kid(own);
    assert_eq!((kid.span(), kid.grammar), (span, kind));

    let trees = SourceTrees::new(&engine, &built, |_| Ok(()));
    let id = TreeId(parse.source.0);
    assert!(trees.tree(id).is_none(), "a source's id alone makes no tree");
    assert!(trees.tree_holding(id, deepest).is_some(), "a record of the source makes its tree");
    assert!(trees.tree(id).is_some(), "the id finds the tree the call made");
    assert!(trees.tree_holding(TreeId(id.0 + 4), deepest).is_none(), "a record makes the tree of its own source alone");
}
