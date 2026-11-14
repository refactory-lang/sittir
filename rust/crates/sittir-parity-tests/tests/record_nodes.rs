//! The records a read leaves of a source answer every node of it as the
//! tree they were read from does (`Engine::backer_parity`): each node's
//! facts, children and parent, whether it is `MISSING` and whether it holds
//! an error, with no tree. Their leaves locate every byte the tree's tokens
//! hold, each edge level is found with no child listed, and the depth
//! members a scan of a tree's nodes finds count every subtree's levels as a
//! walk of the tree does.
#![cfg(feature = "arena")]

use sittir_core::arena::side::FIELD_BITS;
use sittir_core::arena::{HydrateNode, RecordCells, RecordGrammar};
use sittir_core::engine::{node_at_index, Engine, EngineGrammar};
use sittir_core::layout::LayoutWorkCounter;
use sittir_core::nodes::{for_each_edge_child, Kid, Navigation, Nodes, Step, TreeNodes, Visit};
use sittir_core::options::{ResolvedOptions, Side};
use sittir_core::read::{descendant_count, LentCursor};
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

/// What `f` answers of the navigation over the records a read of `source`
/// leaves, and the id it gives the root's node; none for a source whose
/// root has no record.
fn over_records<G: RecordGrammar, N: HydrateNode + RecordCells, R>(name: &str, grammar: G, options: ResolvedOptions, source: &str, f: impl FnOnce(&mut Navigation<'_>, NodeIndex) -> R) -> Option<R> {
    let mut engine = Engine::new(grammar, options).expect("an engine");
    let root = engine.parse_records::<N>(source).unwrap_or_else(|refusal| panic!("{name} {source:?}: a read: {refusal}")).root?;
    Some(engine.read_node(root, |parsed, at| f(&mut parsed.nodes(), at)).expect("the records read").expect("a read wrote the root's record"))
}

/// Every node of `source` answered by the records a read of it leaves as
/// its tree answers it (`Engine::backer_parity`), whether it holds an error
/// among the facts compared; its tree's `ERROR` and holds-an-error as the
/// tree's own `is_error` and `has_error` give them, an `ERROR` itself
/// included; and what its nodes held, counted into `held`.
fn backers_agree<G: RecordGrammar, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: ResolvedOptions, source: &str, held: &mut Held) {
    let tree = parsed(grammar, options.clone(), source);
    let (parity, _) = Engine::new(grammar, options).expect("an engine").backer_parity::<N>(source).unwrap_or_else(|refusal| panic!("{name} {source:?}: a read: {refusal}"));
    assert_eq!((parity.differing, parity.first), (0, None), "{name} {source:?}: the records differ from the tree: {parity:?}");
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
fn grammar_agrees<G: RecordGrammar + Copy, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> Held {
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

/// The leaves `nodes` reaches from `root`, in order, read through its walk
/// alone.
fn leaves(nodes: &mut dyn Nodes<'_>, root: NodeIndex) -> Vec<Kid> {
    let mut leaves = Vec::new();
    nodes.walk(root, &mut |step, kid| {
        if step == Step::Meet && kid.count == 1 {
            leaves.push(*kid);
        }
        Visit::Enter
    });
    leaves
}

/// The leaves of every fixture of `name` whose root has a record, read
/// through the records a read of it leaves: in source order with no byte
/// in two, and nothing but whitespace between them. Answers the bytes the
/// leaves hold.
fn rows_cover<G: RecordGrammar + Copy, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> u32 {
    let mut covered = 0;
    for source in fixtures(name) {
        let Some(found) = over_records::<G, N, _>(name, grammar, options(), &source, |nodes, root| leaves(nodes, root)) else { continue };
        let mut at = 0;
        for leaf in found {
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

/// What names a node whatever navigation answers it: its span and kinds.
type Named = (u32, u32, sittir_core::types::KindId, sittir_core::types::KindId);

fn named(kid: &Kid) -> Named {
    (kid.start, kid.end, kid.grammar, kid.display)
}

/// The children at the edge on each side of each node of `holders`, level
/// by level down, each level found with one `Nodes::edge` and no child
/// listed.
fn edge_paths(name: &str, source: &str, nodes: &mut dyn Nodes<'_>, holders: &[NodeIndex]) -> Vec<Vec<Named>> {
    let mut paths = Vec::new();
    for &index in holders {
        let holder = nodes.kid(index);
        for side in [Side::Before, Side::After] {
            let mut counting = Counting { inner: &mut *nodes, listed: 0, edges: 0 };
            let mut path = Vec::new();
            for_each_edge_child(&mut counting, &holder, side, &mut |kid| path.push(named(kid)));
            assert_eq!(
                (counting.listed, counting.edges),
                (0, path.len() + 1),
                "{name} {source:?}: the edge on side {side:?} below {} lists no children and asks each level's child once",
                index.0
            );
            paths.push(path);
        }
    }
    paths
}

/// Every node `nodes` reaches from `root`, in preorder.
fn preorder(nodes: &mut dyn Nodes<'_>, root: NodeIndex) -> Vec<NodeIndex> {
    let mut met = Vec::new();
    nodes.walk(root, &mut |step, kid| {
        if step == Step::Meet {
            met.push(kid.index);
        }
        Visit::Enter
    });
    met
}

/// The edge children every fixture of `name` holds, found alike through
/// its tree and a lent cursor, and, where its root has a record, through
/// the records a read of it leaves. The root's own two paths are left out
/// of the records' comparison: a read's root spans its whole source, so a
/// child that starts past leading whitespace is not at its edge, where the
/// tree's root starts at its first token.
fn edge_paths_agree<G: RecordGrammar + Copy, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: fn() -> ResolvedOptions) -> usize {
    let mut levels = 0;
    for source in fixtures(name) {
        let tree = parsed(grammar, options(), &source);
        let work = LayoutWorkCounter::default();
        let mut nodes = TreeNodes::new(tree.tree(), tree.source(), &work);
        let holders: Vec<NodeIndex> = (0..descendant_count(&tree.tree().root_node())).map(NodeIndex::new).collect();
        let from_tree = edge_paths(name, &source, &mut nodes, &holders);
        let from_records = over_records::<G, N, _>(name, grammar, options(), &source, |runs, root| {
            let holders = preorder(runs, root);
            edge_paths(name, &source, runs, &holders)
        });
        if let Some(from_records) = from_records {
            assert_eq!(from_records[2..], from_tree[2..], "{name} {source:?}: below the root, the records and the tree find the same edge children");
        }
        let mut cursor = tree.tree().walk();
        let mut lent = LentCursor::new(&mut cursor, tree.source());
        assert_eq!(edge_paths(name, &source, &mut lent, &holders), from_tree, "{name} {source:?}: a lent cursor finds the same edge children");
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
        let count = descendant_count(&tree.tree().root_node());
        let work = LayoutWorkCounter::default();
        let mut nodes = TreeNodes::new(tree.tree(), tree.source(), &work);
        let scanned = DepthMembers::scanned((0..count).map(|index| nodes.kid(NodeIndex::new(index))), kinds);
        let walked = DepthMembers::of(&mut TreeNodes::new(tree.tree(), tree.source(), &LayoutWorkCounter::default()), kinds);
        assert_eq!(scanned.walked(), 0, "{source:?}: the nodes are scanned, not walked");
        for index in 0..count {
            let at = NodeIndex::new(index);
            let end = at + descendant_count(&sittir_core::engine::node_at_index(tree.tree(), at).expect("a node"));
            let net = walked.between(at, end);
            assert_eq!(scanned.between(at, end), net, "{source:?}: the levels the subtree at {index} opens");
            opened += u32::from(net != 0);
        }
    }
    assert_ne!(opened, 0, "some subtree opens a level");
}

/// How many field ids `grammar` has, each fitting a node's field bits.
fn field_fits<G: EngineGrammar>(name: &str, grammar: G, _options: fn() -> ResolvedOptions) -> usize {
    let mut parser = tree_sitter::Parser::new();
    grammar.configure_parser(&mut parser).expect("the language");
    let fields = parser.language().expect("a language").field_count();
    assert!(fields < 1 << FIELD_BITS, "{name}: {fields} field ids need more than a node's {FIELD_BITS} field bits");
    fields
}

#[test]
fn every_grammar_s_field_ids_fit_a_node_s_facts() {
    for (name, fields) in each_grammar!(field_fits) {
        assert_ne!(fields, 0, "{name} has fields");
    }
}

/// The milliseconds the records of a flat file of `statements` calls take
/// to answer every node's parent; `pass` makes each source distinct.
fn parents_ms(statements: usize, pass: usize) -> f64 {
    let mut source = String::new();
    for i in 0..statements {
        writeln!(source, "a{}();", i + pass).expect("a string takes the text");
    }
    over_records::<_, sittir_typescript::render::AnyNode, _>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), &source, |runs, root| {
        let met = preorder(runs, root);
        let start = std::time::Instant::now();
        for &index in &met {
            std::hint::black_box(runs.parent(index));
        }
        start.elapsed().as_secs_f64() * 1e3
    })
    .expect("a root with a record")
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
