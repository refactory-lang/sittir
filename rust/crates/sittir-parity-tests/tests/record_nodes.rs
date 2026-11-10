//! The record backer of the navigation interface (`RecordNodes`) answers
//! every node of a tree its deep read hydrated as the tree backer
//! (`TreeNodes`) does (`ParsedTree::backer_parity`): each node's facts,
//! children and parent, whether it is `MISSING` and whether it holds an
//! error, from the rows the hydrate pass writes beside the records, with no
//! tree. Its rows' leaves locate every
//! byte the tree's tokens hold, and the depth members it finds by a scan of
//! its rows count every subtree's levels as a walk of the tree does.
#![cfg(feature = "arena")]

use sittir_core::arena::{HydrateNode, RecordCells, ROW_FIELD_BITS};
use sittir_core::engine::{node_at_index, EngineGrammar};
use sittir_core::layout::{LayoutWorkCounter, NodeLayout};
use sittir_core::nodes::{for_each_edge_child, Kid, Nodes, RecordNodes, Step, TreeNodes, Visit};
use sittir_core::options::{ResolvedOptions, Side};
use sittir_core::prepare::Prepare;
use sittir_core::read::{descendant_count, Depth, HasLayout, LentCursor};
use sittir_core::tree_sitter;
use sittir_core::trivia_table::DepthMembers;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::{each_grammar, fixture_sources, parsed};
use std::fmt::Write as _;
use std::sync::Arc;

/// A file with an `ERROR` node and a `MISSING` token, by grammar.
fn with_errors(name: &str) -> &'static str {
    match name {
        "python" => "def f(:\n    pass\nx = )\n",
        "regex" => "a{2,|(a))",
        "rust" => "fn f( {\n    let x = ;\n    g(1\n}\n",
        "scm" => "(a !)\n(a field: )\n",
        "typescript" => "if (a { b(); }\nlet x = ;\n",
        _ => unreachable!("one of the five grammars"),
    }
}

/// Nested python blocks, which open and close levels by `INDENT` and
/// `DEDENT`, and typescript statements ended by automatic semicolons.
fn with_layout(name: &str) -> Option<&'static str> {
    match name {
        "python" => Some("class C:\n    def f(self):\n        if x:\n            for y in z:\n                pass\n        return 1\n\n\ndef g():\n    while a:\n        b()\n    else:\n        c()\n"),
        "typescript" => Some("let a = 1\nlet b = a\nfoo()\nconst c = () => {\n  return b\n}\nclass K {\n  x = 1\n  y\n}\n"),
        _ => None,
    }
}

/// Identifiers and strings with characters outside ASCII.
fn non_ascii(name: &str) -> Option<&'static str> {
    match name {
        "python" => Some("名前 = \"héllo wörld\"  # ✓ комментарий\ndef größe(π):\n    return f\"{π} ✓\"\n"),
        "rust" => Some("fn größe(π: f64) -> &'static str {\n    // ✓ комментарий\n    \"ñ ✓\"\n}\n"),
        "typescript" => Some("const π = \"ünïcödé\";\nlet 变量 = `${π} ✓`; // комментарий\n"),
        "regex" => Some("ü+[à-ÿ]✓"),
        "scm" => Some("((identifier) @名前 (#eq? @名前 \"ñ ✓\"))\n"),
        _ => None,
    }
}

/// Every fixture tree of `name`: its round-trip fixtures and the files
/// above.
fn fixtures(name: &str) -> Vec<String> {
    let mut sources = fixture_sources(name);
    sources.extend([Some(with_errors(name)), with_layout(name), non_ascii(name)].into_iter().flatten().map(str::to_owned));
    sources
}

/// What the fixtures of a grammar held: nodes, `ERROR`s, `ERROR`s with no
/// node under them, `MISSING` tokens and nodes shown as an alias.
#[derive(Debug, Default, Clone, Copy)]
struct Held {
    nodes: u32,
    errors: u32,
    lone_errors: u32,
    missing: u32,
    aliased: u32,
}

/// Every node of `source`, read whole as `N`, answered by its record backer
/// as its tree backer answers it (`ParsedTree::backer_parity`), whether it
/// holds an error among the facts compared; its tree backer's `ERROR` and
/// holds-an-error as the tree's own `is_error` and `has_error` give them,
/// an `ERROR` itself included; and what its nodes held, counted into
/// `held`.
fn backers_agree<G: EngineGrammar, N: HydrateNode + RecordCells + Prepare + HasLayout<Option<Box<NodeLayout<G::Trivia>>>>>(name: &str, grammar: G, options: ResolvedOptions, source: &str, held: &mut Held)
where
    G::Trivia: PartialEq,
{
    let tree = parsed(grammar, options, source);
    let parity = tree.backer_parity::<N>().unwrap_or_else(|refusal| panic!("{name} {source:?}: a whole read: {refusal}"));
    assert_eq!((parity.differing, parity.first), (0, None), "{name} {source:?}: the backers differ: {parity:?}");
    assert_eq!(parity.nodes, descendant_count(&tree.tree().root_node()), "{name} {source:?}: every node compared");
    let work = LayoutWorkCounter::default();
    let mut nodes = TreeNodes::new(tree.tree(), tree.source(), &work);
    for index in 0..parity.nodes {
        let at = NodeIndex::new(index);
        let kid = nodes.kid(at);
        let node = node_at_index(tree.tree(), at).expect("a node at every index");
        assert_eq!(kid.error(), node.is_error(), "{name} {source:?}: whether {index} is an ERROR");
        assert_eq!(nodes.holds_error(at), node.has_error() || node.is_error(), "{name} {source:?}: whether {index} holds an error");
        held.nodes += 1;
        held.errors += u32::from(kid.error());
        held.lone_errors += u32::from(kid.error() && kid.count == 1);
        held.missing += u32::from(nodes.missing(at));
        held.aliased += u32::from(kid.display != kid.grammar);
    }
}

/// What every fixture tree of `name` held, each checked by `backers_agree`.
fn grammar_agrees<G: EngineGrammar + Copy, N: HydrateNode + RecordCells + Prepare + HasLayout<Option<Box<NodeLayout<G::Trivia>>>>>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> Held
where
    G::Trivia: PartialEq,
{
    let mut held = Held::default();
    for source in fixtures(name) {
        backers_agree::<G, N>(name, grammar, options(), &source, &mut held);
    }
    let mut errors = Held::default();
    backers_agree::<G, N>(name, grammar, options(), with_errors(name), &mut errors);
    assert!(errors.errors > 0 && errors.missing > 0, "{name}: the error file holds an ERROR ({}) and a MISSING token ({})", errors.errors, errors.missing);
    held
}

macro_rules! each_grammar_read {
    ($check:ident) => {
        [
            ("python", $check::<_, ::sittir_python::render::AnyNode>("python", ::sittir_python::PythonGrammar, ::sittir_python::render::options::defaults)),
            ("regex", $check::<_, ::sittir_regex::render::AnyNode>("regex", ::sittir_regex::RegexGrammar, ::sittir_regex::render::options::defaults)),
            ("rust", $check::<_, ::sittir_rust::render::AnyNode>("rust", ::sittir_rust::RustGrammar, ::sittir_rust::render::options::defaults)),
            ("scm", $check::<_, ::sittir_scm::render::AnyNode>("scm", ::sittir_scm::ScmGrammar, ::sittir_scm::render::options::defaults)),
            ("typescript", $check::<_, ::sittir_typescript::render::AnyNode>("typescript", ::sittir_typescript::TypeScriptGrammar, ::sittir_typescript::render::options::defaults)),
        ]
    };
}

#[test]
fn record_nodes_match_tree_nodes() {
    let held = each_grammar_read!(grammar_agrees);
    for (name, held) in held {
        assert!(held.nodes > 0, "{name}: some node was read");
    }
    assert!(held.iter().any(|(_, held)| held.aliased > 0), "some node is shown as an alias: {held:?}");
    assert!(held.iter().any(|(_, held)| held.lone_errors > 0), "some ERROR has no node under it: {held:?}");
}

/// The leaves `nodes` reaches from the root, in order, read through its
/// walk alone.
fn leaves(nodes: &mut dyn Nodes<'_>) -> Vec<Kid> {
    let mut leaves = Vec::new();
    nodes.walk(NodeIndex::ROOT, &mut |step, kid| {
        if step == Step::Meet && kid.count == 1 {
            leaves.push(*kid);
        }
        Visit::Enter
    });
    leaves
}

/// The leaves of every fixture tree of `name`, read through its record
/// backer: in source order with no byte in two, and nothing but
/// whitespace between them. Answers the bytes the leaves hold.
fn rows_cover<G: EngineGrammar + Copy, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> u32 {
    let mut covered = 0;
    for source in fixtures(name) {
        let tree = parsed(grammar, options(), &source);
        tree.read_record::<N>(NodeIndex::ROOT, Depth::All).unwrap_or_else(|refusal| panic!("{name} {source:?}: a whole read: {refusal}"));
        let arena = tree.tree_arena();
        let mut records = RecordNodes::new(&arena, tree.source()).unwrap_or_else(|| panic!("{name} {source:?}: a row for every node"));
        let mut at = 0;
        for leaf in leaves(&mut records) {
            assert!(leaf.start >= at, "{name} {source:?}: the leaf at {} starts at {} inside the one before, which ends at {at}", leaf.index.0, leaf.start);
            let gap = &source[at as usize..leaf.start as usize];
            assert!(gap.chars().all(char::is_whitespace), "{name} {source:?}: {gap:?} before {} lies in no leaf", leaf.index.0);
            covered += leaf.width();
            at = leaf.end;
        }
        let rest = &source[at as usize..];
        assert!(rest.chars().all(char::is_whitespace), "{name} {source:?}: {rest:?} lies in no leaf");
    }
    covered
}

#[test]
fn rows_cover_every_byte() {
    for (name, covered) in each_grammar_read!(rows_cover) {
        assert_ne!(covered, 0, "{name}: the leaves hold bytes");
    }
}

/// Navigation answering through `inner`, counting the children it lists
/// (`Nodes::kids`) and the edge children it finds (`Nodes::edge`).
struct Counting<'n, 't> {
    inner: &'n mut dyn Nodes<'t>,
    listed: usize,
    edges: usize,
}

impl<'t> Nodes<'t> for Counting<'_, 't> {
    fn text(&self) -> &'t str {
        self.inner.text()
    }

    fn kid(&mut self, index: NodeIndex) -> Kid {
        self.inner.kid(index)
    }

    fn kids(&mut self, index: NodeIndex) -> Arc<[Kid]> {
        self.listed += 1;
        self.inner.kids(index)
    }

    fn edge(&mut self, index: NodeIndex, side: Side) -> Option<Kid> {
        self.edges += 1;
        self.inner.edge(index, side)
    }

    fn parent(&mut self, index: NodeIndex) -> Option<NodeIndex> {
        self.inner.parent(index)
    }

    fn missing(&mut self, index: NodeIndex) -> bool {
        self.inner.missing(index)
    }

    fn holds_error(&mut self, index: NodeIndex) -> bool {
        self.inner.holds_error(index)
    }
}

/// The children at the edge on each side of each of the `count` nodes of
/// `nodes`, level by level down, each level found with one `Nodes::edge`
/// and no child listed.
fn edge_paths(name: &str, source: &str, nodes: &mut dyn Nodes<'_>, count: u32) -> Vec<Vec<Kid>> {
    let mut paths = Vec::new();
    for index in 0..count {
        let holder = nodes.kid(NodeIndex::new(index));
        for side in [Side::Before, Side::After] {
            let mut counting = Counting { inner: &mut *nodes, listed: 0, edges: 0 };
            let mut path = Vec::new();
            for_each_edge_child(&mut counting, &holder, side, &mut |kid| path.push(*kid));
            assert_eq!(
                (counting.listed, counting.edges),
                (0, path.len() + 1),
                "{name} {source:?}: the edge on side {side:?} below {index} lists no children and asks each level's child once"
            );
            paths.push(path);
        }
    }
    paths
}

/// The edge children every fixture tree of `name` holds, found alike
/// through its record backer, its tree backer and a lent cursor.
fn edge_paths_agree<G: EngineGrammar + Copy, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> usize {
    let mut levels = 0;
    for source in fixtures(name) {
        let tree = parsed(grammar, options(), &source);
        tree.read_record::<N>(NodeIndex::ROOT, Depth::All).unwrap_or_else(|refusal| panic!("{name} {source:?}: a whole read: {refusal}"));
        let arena = tree.tree_arena();
        let mut records = RecordNodes::new(&arena, tree.source()).unwrap_or_else(|| panic!("{name} {source:?}: a row for every node"));
        let work = LayoutWorkCounter::default();
        let mut nodes = TreeNodes::new(tree.tree(), tree.source(), &work);
        let count = descendant_count(&tree.tree().root_node());
        let from_tree = edge_paths(name, &source, &mut nodes, count);
        assert_eq!(edge_paths(name, &source, &mut records, count), from_tree, "{name} {source:?}: the backers find the same edge children");
        let mut cursor = tree.tree().walk();
        let mut lent = LentCursor::new(&mut cursor, tree.source());
        assert_eq!(edge_paths(name, &source, &mut lent, count), from_tree, "{name} {source:?}: a lent cursor finds the same edge children");
        levels += from_tree.iter().map(Vec::len).sum::<usize>();
    }
    levels
}

#[test]
fn an_edge_level_lists_no_children() {
    for (name, levels) in each_grammar_read!(edge_paths_agree) {
        assert_ne!(levels, 0, "{name}: some node has a child at its edge");
    }
}

#[test]
fn depth_members_match_the_walk() {
    let kinds = sittir_python::render::kind_ids::SURFACE_KINDS;
    let mut opened = 0;
    for source in fixtures("python") {
        let tree = parsed(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), &source);
        tree.read_record::<sittir_python::render::AnyNode>(NodeIndex::ROOT, Depth::All).unwrap_or_else(|refusal| panic!("{source:?}: a whole read: {refusal}"));
        let arena = tree.tree_arena();
        let recorded = DepthMembers::scanned(RecordNodes::new(&arena, tree.source()).expect("a row for every node").preorder(), kinds);
        let walked = DepthMembers::of(&mut TreeNodes::new(tree.tree(), tree.source(), &LayoutWorkCounter::default()), kinds);
        assert_eq!(recorded.walked(), 0, "{source:?}: the rows are scanned, not walked");
        let count = descendant_count(&tree.tree().root_node());
        for index in 0..count {
            let at = NodeIndex::new(index);
            let end = at + descendant_count(&sittir_core::engine::node_at_index(tree.tree(), at).expect("a node"));
            let net = walked.between(at, end);
            assert_eq!(recorded.between(at, end), net, "{source:?}: the levels the subtree at {index} opens");
            opened += u32::from(net != 0);
        }
    }
    assert_ne!(opened, 0, "some subtree opens a level");
}

/// How many field ids `grammar` has, each fitting a row's field bits.
fn field_fits<G: EngineGrammar>(name: &str, grammar: G, _options: fn() -> ResolvedOptions) -> usize {
    let mut parser = tree_sitter::Parser::new();
    grammar.configure_parser(&mut parser).expect("the language");
    let fields = parser.language().expect("a language").field_count();
    assert!(fields < 1 << ROW_FIELD_BITS, "{name}: {fields} field ids need more than a row's {ROW_FIELD_BITS} bits");
    fields
}

#[test]
fn every_grammar_s_field_ids_fit_a_row() {
    for (name, fields) in each_grammar!(field_fits) {
        assert_ne!(fields, 0, "{name} has fields");
    }
}

#[test]
fn backer_parity_reads_the_tree_whole_after_a_shallow_read() {
    use sittir_typescript::render::AnyNode;
    let source = "function f() {\n  function g() {\n    return [1, \"two\"];\n  }\n}\n";
    let tree = parsed(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), source);
    tree.read_record::<AnyNode>(NodeIndex::ROOT, Depth::ONE).expect("a shallow read").expect("a root record");
    let parity = tree.backer_parity::<AnyNode>().expect("a whole read after a shallow one");
    assert_eq!((parity.differing, parity.nodes), (0, descendant_count(&tree.tree().root_node())));
}

/// The milliseconds the record backer of a flat file of `statements`
/// calls takes to answer every node's parent; `pass` makes each source
/// distinct.
fn parents_ms(statements: usize, pass: usize) -> f64 {
    let mut source = String::new();
    for i in 0..statements {
        writeln!(source, "a{}();", i + pass).expect("a string takes the text");
    }
    let tree = parsed(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), &source);
    tree.read_record::<sittir_typescript::render::AnyNode>(NodeIndex::ROOT, Depth::All).expect("a whole read");
    let arena = tree.tree_arena();
    let mut records = RecordNodes::new(&arena, tree.source()).expect("a row for every node");
    let count = descendant_count(&tree.tree().root_node());
    let start = std::time::Instant::now();
    for index in 0..count {
        std::hint::black_box(records.parent(NodeIndex::new(index)));
    }
    start.elapsed().as_secs_f64() * 1e3
}

#[test]
fn parent_lookups_grow_with_the_tree() {
    let _ = parents_ms(100, 0);
    let (mut small, mut large) = (f64::INFINITY, f64::INFINITY);
    for pass in 1..=5 {
        small = small.min(parents_ms(1000, pass));
        large = large.min(parents_ms(8000, pass));
    }
    assert!(large < small * 24.0, "eight times the statements take {:.1} times as long ({small:.2} ms, {large:.2} ms)", large / small);
}

#[test]
fn a_read_inside_an_error_its_holder_meets_writes_no_rows() {
    use sittir_core::heap::HeapBytes;
    let source = "if (a { b(); }\nlet x = ;\n";
    let tree = parsed(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), source);
    let at = |index: u32| sittir_core::engine::node_at_index(tree.tree(), NodeIndex::new(index)).expect("a node");
    let error = (0..descendant_count(&tree.tree().root_node())).find(|&index| at(index).is_error()).expect("the source holds an ERROR");
    assert_ne!(error, 0, "the ERROR has a holder");
    let made = tree.tree_arena().heap_bytes();
    for index in error..error + descendant_count(&at(error)) {
        assert_eq!(tree.read_record::<sittir_typescript::render::AnyNode>(NodeIndex::new(index), Depth::ONE), Ok(None), "the node at {index} has no record");
    }
    assert_eq!(tree.tree_arena().heap_bytes(), made, "no read inside the ERROR walked it for rows");
}
