//! An arena parse leaves no tree: `Engine::parse_records` reads the whole
//! tree into the engine's built arena in one walk and drops it, and what is
//! left answers for the source. The source reads back from its entry, and
//! navigation over the records alone (`RunNodes`) finds every node the
//! parser made, in built storage many parses share.
#![cfg(feature = "arena")]

use sittir_core::engine::Backing as _;
use sittir_core::render::SourceTable as _;
use sittir_core::arena::source::Source;
use sittir_core::arena::{HydrateNode, RunNodes, RunTable, LINK_WORDS};
use sittir_core::engine::{Engine, EngineGrammar};
use sittir_core::nodes::{Nodes, Step, Visit};
use sittir_core::options::ResolvedOptions;
use sittir_core::read::descendant_count;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{fixture_sources, parsed};

/// How many nodes the records of `source` hold, parsed by `engine` as `N`,
/// each of the nodes of the tree `beside`, when given, held or written by its
/// holder's template; 0 for a source that parses to an `ERROR` alone.
fn nodes_left<G: EngineGrammar + Copy, N: HydrateNode>(name: &str, engine: &mut Engine<G>, source: &str, beside: Option<&sittir_core::engine::ParsedTree<G>>) -> u32 {
    let parse = engine.parse_records::<N>(source).unwrap_or_else(|refusal| panic!("{name} {source:?}: {refusal}"));
    let built = engine.written().built();
    let entry = Source::read(&*built, parse.source).unwrap_or_else(|refusal| panic!("{name} {source:?}: its source entry: {refusal}"));
    assert_eq!(entry.text, source, "{name}: the source reads back from its entry");
    assert_eq!(entry.breaks_lf, !source.contains('\r'), "{name} {source:?}");
    let Some(root) = parse.root else { return 0 };
    let table = RunTable::default();
    let mut nodes = RunNodes::holding(&*built, entry.text, root, &table, <G as EngineGrammar>::read_shape()).unwrap_or_else(|refusal| panic!("{name} {source:?}: its root: {refusal}"));
    let mut met = 0;
    nodes.walk(NodeIndex::ROOT, &mut |step, _| {
        met += u32::from(step == Step::Meet);
        Visit::Enter
    });
    assert_eq!(nodes.refused(), None, "{name} {source:?}");
    if let Some(tree) = beside.filter(|tree| !tree.tree().root_node().is_error()) {
        let grammar = engine.grammar();
        let mut theirs = tree.nodes();
        let (mut held, mut accounted) = (0, 0);
        let mut pending = vec![(NodeIndex::ROOT, NodeIndex::ROOT)];
        while let Some((run, row)) = pending.pop() {
            held += 1;
            if nodes.is_unit(run) {
                accounted += theirs.kid(row).count;
                continue;
            }
            accounted += 1;
            let aligned = sittir_core::arena::aligned_kids(grammar, &mut nodes, run, &mut theirs, row);
            assert_eq!(aligned.apart, None, "{name} {source:?}: the records and the tree hold the same children");
            accounted += aligned.fixed.iter().map(|kid| kid.count).sum::<u32>();
            pending.extend(aligned.held.iter().map(|(met, kept)| (met.index, kept.index)));
        }
        assert_eq!(held, met, "{name} {source:?}: every node of the records stands for a node of the tree");
        assert_eq!(accounted, descendant_count(&tree.tree().root_node()), "{name} {source:?}: every node the parser made is held or written by its holder");
    }
    met
}

fn every_fixture_is_left_whole<G: EngineGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> u32 {
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let sources = fixture_sources(name);
    assert!(!sources.is_empty(), "{name} has fixtures");
    let mut nodes = 0;
    for source in &sources {
        let tree = parsed(grammar, options(), source);
        nodes += nodes_left::<G, N>(name, &mut engine, source, Some(&tree));
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
    let rust = nodes_left::<_, sittir_rust::render::AnyNode>("rust", &mut Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine"), &nested("fn f() {\n    let x = ", ";\n}\n"), None);
    let typescript = nodes_left::<_, sittir_typescript::render::AnyNode>(
        "typescript",
        &mut Engine::new(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults()).expect("an engine"),
        &nested("let x = ", ";\n"),
        None,
    );
    let python = nodes_left::<_, sittir_python::render::AnyNode>("python", &mut Engine::new(sittir_python::PythonGrammar, sittir_python::render::options::defaults()).expect("an engine"), &nested("x = ", "\n"), None);
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
    while let Some(at) = ["NodeIndex(", "TreeId(", "NodeId("].iter().filter_map(|open| rest.find(open).map(|at| at + open.len())).min() {
        out.push_str(&rest[..at]);
        rest = rest[at..].trim_start_matches(|c: char| c.is_ascii_digit());
    }
    let named = "carried: Some(CoordinateCarried { changed: ChangedEdges { leading: false, trailing: false }, name: Some(NodeId()) })";
    (out + rest).replace(named, "carried: None")
}

/// A side's entries as a reader tells them apart: an entry of the source by
/// its kind and bytes, which a tree holds as a coordinate and records as the
/// record that names them; any other as it is.
fn side_shapes<T: std::fmt::Debug>(entries: Vec<sittir_core::read::SideEntry<T>>) -> Vec<String> {
    entries
        .into_iter()
        .map(|entry| match entry {
            sittir_core::read::SideEntry::Source { kind, span, .. } => format!("source {} {}..{}", kind.0, span.start, span.end),
            other => unnamed(&format!("{other:?}")),
        })
        .collect()
}

/// Each node of `source` whose sides its records answer apart from its
/// tree, by its bytes and kind.
fn sides_apart<G: sittir_core::arena::RecordGrammar, N: HydrateNode>(grammar: G, options: fn() -> ResolvedOptions, source: &str) -> Vec<String>
where
    G::Trivia: std::fmt::Debug,
{
    use sittir_core::trivia_table::TriviaSide;
    let tree = parsed(grammar, options(), source);
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let Some(root) = engine.parse_records::<N>(source).expect("a parse").root else { return Vec::new() };
    let built = engine.written().built();
    let records = sittir_core::engine::Records::over(&engine, &built, root).expect("a tree over the records");
    let (mut ours, mut theirs) = (records.nodes(), tree.nodes());
    let mut apart = Vec::new();
    let mut pending = vec![(NodeIndex::ROOT, NodeIndex::ROOT)];
    while let Some((run, row)) = pending.pop() {
        for side in [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner] {
            let (left, kept) = (side_shapes(records.side_entries(run, side, false)), side_shapes(tree.side_entries(row, side, false)));
            if left != kept {
                let kid = theirs.kid(row);
                apart.push(format!("{}..{} {} {side:?}:\n  records {left:?}\n  tree    {kept:?}", kid.start, kid.end, G::kind_name(kid.grammar)));
            }
        }
        if !ours.is_unit(run) {
            let aligned = sittir_core::arena::aligned_kids(grammar, &mut ours, run, &mut theirs, row);
            pending.extend(aligned.held.iter().map(|(met, kept)| (met.index, kept.index)));
        }
    }
    apart
}

/// The fixtures of `name` with a node whose sides its records answer apart
/// from its tree, each with the first such node.
fn fixtures_apart<G: sittir_core::arena::RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> Vec<String>
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

/// The name of the first node of `root`'s tree, in a walk from the root,
/// one of whose sides holds an entry its parse placed, with that side.
fn placed_side(engine: &Engine<sittir_rust::RustGrammar>, root: sittir_core::arena::Address) -> (sittir_core::types::NodeId, sittir_core::trivia_table::TriviaSide) {
    use sittir_core::trivia_table::TriviaSide;
    let built = engine.written().built();
    let records = sittir_core::engine::Records::over(engine, &built, root).expect("a tree over the records");
    let mut nodes = records.nodes();
    let mut pending = vec![NodeIndex::ROOT];
    while let Some(at) = pending.pop() {
        if let Some(side) = [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].into_iter().find(|&side| records.side_entries(at, side, false).iter().any(|entry| matches!(entry, sittir_core::read::SideEntry::Source { .. }))) {
            let Some(sittir_core::trivia_store::Place::Node(name)) = records.place(at) else { panic!("a node the store keeps") };
            return (name, side);
        }
        pending.extend(nodes.kids(at).iter().rev().map(|kid| kid.index));
    }
    panic!("no side holds an entry")
}

#[test]
fn a_side_written_to_a_read_s_node_is_an_entry_of_its_read_s_list_and_its_record_keeps_its_parse_s_rows() {
    use sittir_core::arena::{replaced_list, Address, CellWord, Replaced, RowFields};
    use sittir_core::trivia_table::TriviaSide;
    let source = "fn f() {\n    // why\n    a;\n}\n";
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let root = engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse").root.expect("a root");
    let (name, side) = placed_side(&engine, root);
    assert_eq!(side, TriviaSide::Leading, "the comment leads the statement");
    let holder = Address(name.address());
    let rows = RowFields::of_record(&*engine.written().built(), holder).expect("its rows").2;
    engine.write_read_side(name, side, &[]).expect("a write");
    engine.write_read_side(name, TriviaSide::Trailing, &[]).expect("a write");
    let built = engine.written().built();
    assert_eq!(RowFields::of_record(&*built, holder).expect("its rows").2, rows, "the read's record keeps the rows its parse placed");
    let (_, list) = replaced_list(&*built, holder).expect("its read").expect("a list");
    let entries = Replaced::read(&*built, list).expect("its entries");
    let comment = u32::try_from(source.find("// why").expect("the comment")).expect("an offset");
    let end = u32::try_from(source.find("a;").expect("the statement") + 2).expect("an offset");
    assert_eq!(entries, vec![
        Replaced { node: name, side: TriviaSide::Leading, offset: comment, row: CellWord(0) },
        Replaced { node: name, side: TriviaSide::Trailing, offset: end, row: CellWord(0) },
    ], "a leading side's range starts where its placed comment does, a trailing side's where its node ends, in offset order");
}

#[test]
fn a_side_written_to_a_read_s_node_is_read_by_every_later_call() {
    use sittir_core::trivia_table::TriviaSide;
    let source = "fn f() {\n    // why\n    a\n}\n\nfn g() {}\n";
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let root = engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse").root.expect("a root");
    let (path, side, place) = {
        let built = engine.written().built();
        let records = sittir_core::engine::Records::over(&engine, &built, root).expect("a tree over the records");
        let mut nodes = records.nodes();
        let mut pending = vec![Vec::new()];
        let mut found = None;
        while let Some(path) = pending.pop() {
            let at = at_path(&mut nodes, &path);
            if let Some(side) = [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].into_iter().find(|&side| records.side_entries(at, side, false).iter().any(|entry| matches!(entry, sittir_core::read::SideEntry::Source { .. }))) {
                found = Some((path, side, records.place(at).expect("a place in the store")));
                break;
            }
            pending.extend((0..nodes.kids(at).len()).map(|position| [path.as_slice(), &[position]].concat()));
        }
        found.expect("a side that holds the comment")
    };
    assert_eq!(path.first(), Some(&0), "the comment lies in the first function");
    let sittir_core::trivia_store::Place::Node(name) = place else { panic!("a node the store keeps") };
    engine.write_read_side(name, side, &[]).expect("a write");
    let built = engine.written().built();
    let records = sittir_core::engine::Records::over(&engine, &built, root).expect("a tree over the records");
    let mut nodes = records.nodes();
    let (at, first, second) = (at_path(&mut nodes, &path), at_path(&mut nodes, &[0]), at_path(&mut nodes, &[1]));
    assert!(records.side_entries(at, side, false).is_empty(), "the written side is the one read");
    let sources = sittir_core::engine::SourceRecords::new(&engine, &built, |_| Ok(()));
    let table = sittir_core::engine::ReadSources::over(&sources);
    let named = |index: NodeIndex| sittir_core::slot::NodeIdOrCoordinate::of(records.name_at(index).expect("a named node"));
    assert!(table.renders_as_source(named(NodeIndex::ROOT)), "a write below a node leaves it rendering as its source");
    assert!(table.renders_as_source(named(first)) || first == at);
    assert_eq!(table.renders_through_template(named(at)), side == TriviaSide::Inner, "a node renders through its template for its own inner side alone");
    assert!(table.renders_as_source(named(second)), "the second function holds no write");
}

/// The sources of `name`'s fixtures whose records store another layout
/// than their tree does, and how many of the sources store any.
fn layouts_apart<G: sittir_core::arena::RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> (Vec<String>, usize) {
    let mut storing = 0;
    let apart = fixture_sources(name)
        .iter()
        .filter_map(|source| {
            let tree = parsed(grammar, options(), source);
            let kept = tree.stored_layout();
            let mut engine = Engine::new(grammar, options()).expect("an engine");
            let root = engine.parse_records::<N>(source).expect("a parse").root?;
            let built = engine.written().built();
            let stored = sittir_core::engine::Records::over(&engine, &built, root).expect("a tree over the records").stored_layout();
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
fn errors_kept<G: sittir_core::arena::RecordGrammar + Copy, N: HydrateNode>(grammar: G, options: fn() -> ResolvedOptions, source: &str) -> Vec<(Option<sittir_core::arena::NodeSite>, Vec<Option<sittir_core::arena::NodeSite>>)> {
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let Some(root) = engine.parse_records::<N>(source).expect("a parse").root else { return Vec::new() };
    let built = engine.written().built();
    let table = RunTable::default();
    let mut nodes = RunNodes::holding(&*built, source, root, &table, <G as EngineGrammar>::read_shape()).expect("its root");
    let mut errors = Vec::new();
    nodes.walk(NodeIndex::ROOT, &mut |step, kid| {
        if step == Step::Meet && kid.grammar == sittir_core::types::KindId::ERROR {
            errors.push(kid.index);
        }
        Visit::Enter
    });
    errors
        .into_iter()
        .map(|index| {
            let kids: Vec<NodeIndex> = nodes.kids(index).iter().map(|kid| kid.index).collect();
            (nodes.site(index), kids.into_iter().map(|kid| nodes.site(kid)).collect())
        })
        .collect()
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
    let mut nodes = RunNodes::holding(&*built, source, root, &table, <sittir_rust::RustGrammar as EngineGrammar>::read_shape()).expect("its root");
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
fn held_coordinate<G: EngineGrammar>(tree: &sittir_core::engine::ParsedTree<G>) -> sittir_core::slot::NodeCoordinate {
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
    met.iter()
        .find_map(|kid| {
            [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].into_iter().flat_map(|side| tree.side_entries(kid.index, side, false)).find_map(|entry| match entry.into_entry() {
                TriviaEntry::Value(SlotValue::Coord(coord)) => Some(coord),
                _ => None,
            })
        })
        .expect("a side that holds a coordinate")
}

/// What a side of `records` holds of a read's comment: its record, the bytes
/// it renders as its source, and its kind.
fn held_record<G: sittir_core::arena::RecordGrammar>(records: &sittir_core::engine::Records<'_, G>) -> (sittir_core::arena::Address, sittir_core::types::Span, sittir_core::types::KindId) {
    use sittir_core::trivia::{RecordEntry, TriviaEntry};
    use sittir_core::trivia_table::TriviaSide;
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
            [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].into_iter().flat_map(|side| records.side_entries(index, side, false)).find_map(|entry| match entry.into_entry() {
                TriviaEntry::Record(RecordEntry { record, as_source: Some(source), .. }) => Some((record.at, source.span, record.kind)),
                _ => None,
            })
        })
        .expect("a side that holds a read's record")
}

#[test]
fn a_side_holds_a_read_s_comment_by_its_record_over_the_bytes_a_tree_s_coordinate_spans() {
    let source = "// lead\nfn f() {}\n";
    let (grammar, options) = (sittir_rust::RustGrammar, sittir_rust::render::options::defaults);
    let kept = held_coordinate(&parsed(grammar, options(), source));
    assert_eq!(kept.name(), None, "a tree's coordinate names its node by its tree and index");
    let mut engine = Engine::new(grammar, options()).expect("an engine");
    let root = engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse").root.expect("a root");
    let built = engine.written().built();
    let records = sittir_core::engine::Records::over(&engine, &built, root).expect("the records");
    let (at, span, kind) = held_record(&records);
    assert_eq!(records.index_named(sittir_core::types::NodeId::record(at.0)).map(|index| records.nodes().kid(index).span()), Some(span));
    assert_eq!((span, Some(kind)), (kept.span, kept.kind));
}

/// Each entry's record and the bytes it renders as its source; none for an
/// entry that is no such record.
fn entry_sources<T>(entries: &[sittir_core::trivia::TriviaEntry<T>]) -> Vec<Option<(sittir_core::arena::Address, sittir_core::types::Span)>> {
    use sittir_core::trivia::{RecordEntry, TriviaEntry};
    entries
        .iter()
        .map(|entry| match entry {
            TriviaEntry::Record(RecordEntry { record, as_source: Some(source), .. }) => Some((record.at, source.span)),
            _ => None,
        })
        .collect()
}

#[test]
fn a_read_s_record_answers_its_sides_by_its_address_as_a_built_record_does() {
    use sittir_core::arena::Address;
    use sittir_core::trivia_store::Place;
    use sittir_core::trivia_table::TriviaSide;
    let source = "fn f() {\n    // why\n    a;\n}\n";
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let root = engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse").root.expect("a root");
    let side_of = |at: Address, side: TriviaSide| engine.read_node(at, |tree, index| tree.trivia_side(index, side)).expect("a read").expect("the record's node");
    let (at, side, assigned): (Address, TriviaSide, Vec<Option<(Address, sittir_core::types::Span)>>) = {
        let built = engine.written().built();
        let records = sittir_core::engine::Records::over(&engine, &built, root).expect("a tree over the records");
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
                let at = records.place(index).and_then(Place::as_record)?;
                [TriviaSide::Leading, TriviaSide::Trailing, TriviaSide::Inner].into_iter().find_map(|side| {
                    let entries = records.trivia_side(index, side);
                    (!entries.is_empty()).then(|| (at, side, entry_sources(&entries)))
                })
            })
            .expect("a record whose side holds the comment")
    };
    assert!(assigned.iter().all(Option::is_some), "the side holds the comment by its record, as its source: {assigned:?}");
    assert_eq!(entry_sources(&side_of(at, side)), assigned);
    engine.write_built_trivia_side(at, side, &[]).expect("a write");
    assert_eq!(side_of(at, side).len(), 0, "the written side is the one read");
}

#[test]
fn a_call_reads_a_node_and_its_children_and_makes_one_backer_per_source() {
    use sittir_core::arena::NodeSite;
    use sittir_core::engine::{SourceRecords, Trees};
    use sittir_core::slot::NodeIdOrCoordinate;
    use sittir_core::types::NodeId;
    let source = "fn f() {\n    g(1 + 2);\n}\n";
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let parse = engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse");
    let root = parse.root.expect("a root");
    let built = engine.written().built();
    let whole = sittir_core::engine::Records::over(&engine, &built, root).expect("the records from the root's");
    let mut records = Vec::new();
    whole.nodes().walk(NodeIndex::ROOT, &mut |step, kid| {
        if step == Step::Meet {
            if let Some(at) = whole.name_at(kid.index).and_then(NodeId::as_record) {
                records.push((sittir_core::arena::Address(at), kid.span(), kid.grammar));
            }
        }
        Visit::Enter
    });
    let &(deepest, span, kind) = records.last().expect("a record below the root");
    assert_ne!(deepest, root);
    let below = sittir_core::engine::Records::over(&engine, &built, deepest).expect("the records from one below the root");
    assert_eq!(below.index_at(NodeSite::Record(deepest)), Some(NodeIndex::ROOT), "the first node the call names");
    assert_eq!(below.nodes().parent(NodeIndex::ROOT), None, "named on its own, it answers no parent, as a built node does");
    let kid = below.nodes().kid(NodeIndex::ROOT);
    assert_eq!((kid.span(), kid.grammar), (span, kind));
    let top = below.index_at(NodeSite::Record(root)).expect("the source's root, named on its own");
    below.nodes().walk(top, &mut |_, _| Visit::Enter);
    assert!(below.nodes().parent(NodeIndex::ROOT).is_some(), "met again as a child, it answers as that child");

    let sources = SourceRecords::new(&engine, &built, |_| Ok(()));
    let first = sources.holding(NodeIdOrCoordinate::of(NodeId::record(deepest.0))).expect("the source of the record");
    let second = sources.holding(NodeIdOrCoordinate::of(NodeId::record(root.0))).expect("the same source");
    assert!(std::ptr::eq(first, second), "one source, one backer");
}

/// How many nodes with no record of their own the records of `name`'s
/// fixtures keep in a slot, each found from its site and its site from its
/// row.
fn sites_and_rows_agree<G: sittir_core::arena::RecordGrammar + Copy, N: HydrateNode>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> usize {
    use sittir_core::arena::site::{row_sites, site_row};
    use sittir_core::arena::NodeSite;
    let mut kept = 0;
    for source in fixture_sources(name) {
        let mut engine = Engine::new(grammar, options()).expect("an engine");
        let Some(root) = engine.parse_records::<N>(&source).expect("a parse").root else { continue };
        let built = engine.written().built();
        let tree = sittir_core::engine::Records::over(&engine, &built, root).expect("a tree over the records");
        let mut records = Vec::new();
        tree.nodes().walk(NodeIndex::ROOT, &mut |step, kid| {
            if step == Step::Meet && !kid.error() {
                if let Some(at) = tree.name_at(kid.index).and_then(sittir_core::types::NodeId::as_record) {
                    records.push(sittir_core::arena::Address(at));
                }
            }
            Visit::Enter
        });
        for holder in records {
            let sites = row_sites(&*built, holder, G::shape, G::KIND_BITS).unwrap_or_else(|refusal| panic!("{name} {source:?}: the sites of the record at {}: {refusal}", holder.0));
            for (row, site) in sites {
                assert_eq!(site_row(&*built, holder, G::shape, G::KIND_BITS, site), Ok(row), "{name} {source:?}: {site:?} of the record at {}", holder.0);
                let named = if row == 1 { NodeSite::Record(holder) } else { NodeSite::Row { holder, word: row - 2 } };
                assert!(tree.index_at(named).is_some(), "{name} {source:?}: row {row} of the record at {} is a node of its run", holder.0);
                kept += 1;
            }
        }
    }
    kept
}

#[test]
fn a_slot_s_site_and_its_node_s_row_are_found_from_each_other() {
    let kept = [
        sites_and_rows_agree::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults),
        sites_and_rows_agree::<_, sittir_regex::render::AnyNode>("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults),
        sites_and_rows_agree::<_, sittir_rust::render::AnyNode>("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults),
        sites_and_rows_agree::<_, sittir_scm::render::AnyNode>("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults),
        sites_and_rows_agree::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults),
    ];
    assert!(kept.iter().all(|&kept| kept > 0), "every grammar keeps some node in a slot with no record of its own: {kept:?}");
}

fn widest_record<G: sittir_core::arena::RecordGrammar>() -> u32 {
    (0..=u16::MAX).filter_map(|kind| G::shape(sittir_core::types::KindId(kind))).map(|shape| shape.words).max().unwrap_or(0)
}

#[test]
fn a_site_s_word_names_any_cell_of_every_record() {
    let widest = [
        widest_record::<sittir_rust::RustGrammar>(),
        widest_record::<sittir_python::PythonGrammar>(),
        widest_record::<sittir_typescript::TypeScriptGrammar>(),
        widest_record::<sittir_regex::RegexGrammar>(),
        widest_record::<sittir_scm::ScmGrammar>(),
    ];
    assert!(widest.iter().all(|&words| words > 0 && words <= sittir_core::types::NodeId::SITE_WORDS), "{widest:?}");
}

#[test]
fn a_record_kept_past_its_root_s_release_keeps_its_read_s_entry_starts_until_its_own_release() {
    use sittir_core::arena::count::Held;
    use sittir_core::engine::Backing;
    let source = "fn f() {\n    // c\n    g(1);\n}\n";
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let before = engine.written().built().allocated_bytes();
    let parse = engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse");
    let root = parse.root.expect("a root");
    let (deepest, starts) = {
        let built = engine.written().built();
        let whole = sittir_core::engine::Records::over(&engine, &built, root).expect("a tree from the root's record");
        let mut records = Vec::new();
        whole.nodes().walk(NodeIndex::ROOT, &mut |step, kid| {
            if step == Step::Meet {
                records.extend(whole.name_at(kid.index).and_then(sittir_core::types::NodeId::as_record).map(sittir_core::arena::Address));
            }
            Visit::Enter
        });
        (*records.last().expect("a record below the root"), Backing::entry_starts(&whole, |starts| starts.map(<[u32]>::to_vec)))
    };
    assert!(starts.as_ref().is_some_and(|starts| !starts.is_empty()), "the read keeps the start of its comment's node");
    engine.written().built_mut().hold(deepest).expect("a count of the record below the root");
    engine.written().release(Held::Record(root), true).expect("the root's release");
    {
        let built = engine.written().built();
        let below = sittir_core::engine::Records::over(&engine, &built, deepest).expect("a tree from the kept record");
        assert_eq!(Backing::entry_starts(&below, |starts| starts.map(<[u32]>::to_vec)), starts, "the kept record's tree reads its read's starts, not every frame");
    }
    engine.written().release(Held::Record(deepest), false).expect("the kept record's release");
    assert_eq!(engine.written().built().allocated_bytes(), before, "the starts go with the last record of the read");
}

/// A plan call reads the nodes of one source: a name of another read is
/// refused, whichever comes first, and never read against the first's text.
#[test]
fn a_plan_call_refuses_a_name_of_another_source() {
    use sittir_core::query::{NamedAddress, Plan, PlanSpec};
    use sittir_core::types::{ChildPosition, NodeId};
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let mut read = |source: &str| engine.parse_records::<sittir_rust::render::AnyNode>(source).expect("a parse").root.expect("a root record");
    let (first, second) = (read("fn a() {}\n"), read("\n\n// a source of other bytes\nfn second() {}\n"));
    let plan = Plan::compile(PlanSpec::And { of: Vec::new() }).expect("a plan");
    let own = |at: sittir_core::arena::Address| NamedAddress::Own(NodeId::record(at.0));
    assert_eq!(engine.plan_holds_of(&[own(first), own(first)], &plan), Ok(vec![true, true]), "names of one source answer");
    let child = NamedAddress::Child { parent: NodeId::record(second.0), index: ChildPosition::new(0) };
    for names in [[own(first), own(second)], [own(second), own(first)], [own(first), child]] {
        let refused = engine.plan_holds_of(&names, &plan).expect_err("a name of another source");
        assert!(refused.contains("another source"), "{refused}");
    }
}
