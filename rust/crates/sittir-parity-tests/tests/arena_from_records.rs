//! A tree its deep read hydrated whole renders in arena storage from what its
//! records and rows hold. Untouched, rebuilt from a read and edited, no render
//! is handed tree-sitter's tree (`LayoutWork::tree_reads`), a second render
//! measures no layout run's baseline gap again, and an edited render writes
//! no record.
#![cfg(feature = "arena")]

use sittir_core::arena::{Address, ArenaRead, BuiltChunks, Cell, CellAt, HeldArenas, HydrateNode, Linked, RecordCells, RecordGrammar, RecordSink, RecordTrees, WriteCell};
use sittir_core::engine::{EngineGrammar, ParsedTree};
use sittir_core::layout::LayoutWork;
use sittir_core::options::ResolvedOptions;
use sittir_core::prepare::RenderContext;
use sittir_core::read::{Depth, ReadNode};
use sittir_core::render::RenderError;
use sittir_core::slot::{ChangedEdges, NodeCoordinate};
use sittir_core::trivia_store::TriviaStore;
use sittir_core::types::NodeIndex;
use sittir_core::SlotValue;
use sittir_parity_tests::{edit_in_place, fixture_sources, parsed};

/// A grammar's native render of a root (`render_node_parts`).
type NativeRender<N> = fn(SlotValue<N>, &RenderContext<'_>, Option<&mut sittir_core::baseline::Baseline>) -> Result<(sittir_core::types::Source, String), RenderError>;

/// A grammar's render of a record (`render_record`).
type RecordRender<T> = fn(CellAt, &mut dyn RecordTrees, &dyn ArenaRead, &TriviaStore<T>, &RenderContext<'_>, Option<sittir_core::arena::Recording<'_>>) -> Result<String, RenderError>;

/// One grammar's renders, a source holding comments, lists and nested
/// blocks, the node of it a codemod edits (`kind:n`, its `n`th node of
/// `kind`), and how its root, read, becomes a rebuilt node: one whose sides
/// come from the node it was read from, where it no longer stands.
struct Case<G: EngineGrammar, N> {
    name: &'static str,
    grammar: G,
    options: fn() -> ResolvedOptions,
    native: NativeRender<N>,
    record: RecordRender<G::Trivia>,
    rebuild: fn(&mut N),
    source: &'static str,
    edited: &'static str,
}

/// A render's text, and what its tree's layout reads did meanwhile.
struct Rendered {
    text: String,
    work: LayoutWork,
}

fn since(after: LayoutWork, before: LayoutWork) -> LayoutWork {
    LayoutWork {
        region_nodes: after.region_nodes - before.region_nodes,
        sibling_items: after.sibling_items - before.sibling_items,
        region_fallbacks: after.region_fallbacks - before.region_fallbacks,
        cursor_climbs: after.cursor_climbs - before.cursor_climbs,
        sibling_steps: after.sibling_steps - before.sibling_steps,
        root_descents: after.root_descents - before.root_descents,
        depth_nodes: after.depth_nodes - before.depth_nodes,
        record_nodes: after.record_nodes - before.record_nodes,
        records_rendered: after.records_rendered - before.records_rendered,
        gap_items: after.gap_items - before.gap_items,
        tree_reads: after.tree_reads - before.tree_reads,
    }
}

/// The work a render did measuring baseline gaps: regions walked, layout
/// records rendered and the nodes they entered, frames aligned.
fn measuring(work: &LayoutWork) -> [u32; 4] {
    [work.region_nodes, work.records_rendered, work.record_nodes, work.gap_items]
}

impl<G: RecordGrammar, N: ReadNode + Clone + WriteCell<G::Trivia> + HydrateNode + RecordCells> Case<G, N> {
    /// The case's source parsed and hydrated whole (`hydrate_record`), and
    /// its root's record.
    fn hydrated(&self) -> (ParsedTree<G>, Address) {
        let tree = parsed(self.grammar, (self.options)(), self.source);
        let root = tree.hydrate_record::<N>(NodeIndex::ROOT, Depth::All).expect("a whole read").expect("the root's record");
        (tree, root)
    }

    /// The record of `tree`'s root rendered through the tree's table.
    fn untouched(&self, tree: &ParsedTree<G>, root: Address) -> Rendered {
        let options = (self.options)();
        let before = tree.layout_work();
        let text = tree.render_record(root, ChangedEdges::default(), &options, &tree.seating()).expect("a record render");
        Rendered { text, work: since(tree.layout_work(), before) }
    }

    /// `tree`'s root rebuilt from its read (`rebuild`), and written as a
    /// built record that links its children's parsed records.
    fn rebuilt_root(&self, tree: &ParsedTree<G>) -> (N, BuiltChunks, CellAt) {
        let mut node: N = tree.read(NodeIndex::ROOT, Depth::ONE).expect("the root reads");
        (self.rebuild)(&mut node);
        let (built, root) = built_record(tree, &node);
        (node, built, root)
    }

    /// The built record `root` of `built` rendered over `tree`'s arena.
    fn render_built(&self, tree: &ParsedTree<G>, built: &BuiltChunks, root: CellAt) -> Rendered {
        let options = (self.options)();
        let before = tree.layout_work();
        let text = {
            let seating = tree.seating();
            let ctx = RenderContext::new(&options, &seating);
            let mut arenas = HeldArenas::of([(tree.tree_id(), tree.tree_arena())]);
            (self.record)(root, &mut arenas, built, tree.store(), &ctx, None).expect("a record render")
        };
        Rendered { text, work: since(tree.layout_work(), before) }
    }

    /// The rebuilt root's record rendered (`rebuilt_root`), and the rebuilt
    /// root's native render after it, which it matches.
    fn rebuilt(&self, tree: &ParsedTree<G>) -> (Rendered, String) {
        let (node, built, root) = self.rebuilt_root(tree);
        let rendered = self.render_built(tree, &built, root);
        let options = (self.options)();
        let native = (self.native)(SlotValue::Node(node), &RenderContext::new(&options, &tree.seating()), None).expect("a native render").1;
        (rendered, native)
    }

    /// The case's edited node written back with its own inner side
    /// (`edit_in_place`), then the root's record rendered.
    fn codemod(&self, tree: &mut ParsedTree<G>, root: Address) -> Rendered {
        let index = nth_of_kind(tree, self.edited);
        let before = tree.layout_work();
        edit_in_place(tree, index);
        let options = (self.options)();
        let text = tree.render_record(root, ChangedEdges::default(), &options, &tree.seating()).expect("a record render");
        Rendered { text, work: since(tree.layout_work(), before) }
    }
}

/// The node `edited` names, `kind:n`: the `n`th node of `kind`.
fn nth_of_kind<G: EngineGrammar>(tree: &ParsedTree<G>, edited: &str) -> NodeIndex {
    let (kind, nth) = edited.split_once(':').expect("kind:n");
    let nth: usize = nth.parse().expect("an occurrence");
    let count = sittir_core::read::descendant_count(&tree.tree().root_node());
    (0..count)
        .map(NodeIndex::new)
        .filter(|&index| sittir_core::engine::node_at_index(tree.tree(), index).is_some_and(|node| node.kind() == kind))
        .nth(nth)
        .unwrap_or_else(|| panic!("a {edited}"))
}

/// `node` written as a built record into a fresh arena, each parsed child it
/// holds linked to its record in `tree`'s arena.
fn built_record<G: RecordGrammar, N: WriteCell<G::Trivia> + HydrateNode + RecordCells>(tree: &ParsedTree<G>, node: &N) -> (BuiltChunks, CellAt) {
    let mut built = BuiltChunks::new(G::KIND_BITS, G::shape);
    let mut link = |coord: &NodeCoordinate| -> Result<Linked, sittir_core::arena::ArenaError> {
        match tree.read_record::<N>(coord.index, Depth::ONE).map_err(|_| sittir_core::arena::ArenaError::Unwritable("an unread child"))? {
            Some(at) => Ok(Linked::Record(at)),
            None => Ok(Linked::Leaf(tree.source()[coord.span.range()].to_owned())),
        }
    };
    let word = node.write_cell(&mut RecordSink::built(&mut built, tree.store(), &mut link)).expect("a built record");
    let cell = Cell::decode_built(word, &built, G::KIND_BITS).expect("a built root");
    (built, CellAt { cell, tree: None, site: None })
}

/// A read node's layout made a rebuilt one's: its sides are the node's it
/// was read from, and it no longer stands there.
fn rebuilt_layout<T>(layout: &mut Option<Box<sittir_core::layout::NodeLayout<T>>>) {
    let layout = layout.as_mut().expect("a read node names itself");
    layout.sides = layout.at.take();
}

fn rust() -> Case<sittir_rust::RustGrammar, sittir_rust::render::AnyNode> {
    Case {
        name: "rust",
        grammar: sittir_rust::RustGrammar,
        options: sittir_rust::render::options::defaults,
        native: sittir_rust::render::render_node_parts,
        record: sittir_rust::render::node::render_record,
        rebuild: |node| {
            let sittir_rust::render::AnyNode::SourceFile(file) = node else { panic!("the root is a file") };
            rebuilt_layout(&mut file.layout);
        },
        source: "// a file\nfn f(a: i32,  b: i32) -> i32 {\n    // leading\n    let x = g(a, b);\n    if x > 0 {\n        h(x, /* inside */ 1);\n    }\n    x\n}\n\nstruct S { a: i32, b: u8 }\n",
        edited: "expression_statement:0",
    }
}

fn python() -> Case<sittir_python::PythonGrammar, sittir_python::render::AnyNode> {
    Case {
        name: "python",
        grammar: sittir_python::PythonGrammar,
        options: sittir_python::render::options::defaults,
        native: sittir_python::render::render_node_parts,
        record: sittir_python::render::node::render_record,
        rebuild: |node| {
            let sittir_python::render::AnyNode::Module(module) = node else { panic!("the root is a module") };
            rebuilt_layout(&mut module.layout);
        },
        source: "class C:\n    # comment\n    def f(self, a,  b):\n        if a:\n            return [a, b]\n        return None\n\n\ndef g():\n    while x:\n        y(1, 2)\n",
        edited: "expression_statement:0",
    }
}

fn typescript() -> Case<sittir_typescript::TypeScriptGrammar, sittir_typescript::render::AnyNode> {
    Case {
        name: "typescript",
        grammar: sittir_typescript::TypeScriptGrammar,
        options: sittir_typescript::render::options::defaults,
        native: sittir_typescript::render::render_node_parts,
        record: sittir_typescript::render::node::render_record,
        rebuild: |node| {
            let sittir_typescript::render::AnyNode::Program(program) = node else { panic!("the root is a program") };
            rebuilt_layout(&mut program.layout);
        },
        source: "const a = [1, 2,  3]\nfunction f(x: number, y: number) {\n  // note\n  if (x) {\n    g(x, y)\n  }\n  return { x, y }\n}\nclass K {\n  m() { return 1 }\n}\n",
        edited: "expression_statement:0",
    }
}

fn reads_no_tree<G: RecordGrammar, N: ReadNode + Clone + WriteCell<G::Trivia> + HydrateNode + RecordCells>(case: &Case<G, N>) -> [u32; 3] {
    let (tree, root) = case.hydrated();
    let untouched = case.untouched(&tree, root);
    assert_eq!(untouched.text, case.source, "{}: untouched", case.name);
    let (rebuilt, native) = case.rebuilt(&tree);
    assert_eq!(rebuilt.text, native, "{}: rebuilt", case.name);
    let (mut tree, root) = case.hydrated();
    let codemod = case.codemod(&mut tree, root);
    assert_eq!(codemod.text, case.source, "{}: codemod", case.name);
    [untouched.work.tree_reads, rebuilt.work.tree_reads, codemod.work.tree_reads]
}

#[test]
fn arena_render_reads_no_tree() {
    let reads = [("rust", reads_no_tree(&rust())), ("python", reads_no_tree(&python())), ("typescript", reads_no_tree(&typescript()))];
    assert_eq!(reads, [("rust", [0; 3]), ("python", [0; 3]), ("typescript", [0; 3])], "tree reads of the untouched, rebuilt and codemod renders");
}

fn measured_twice<G: RecordGrammar, N: ReadNode + Clone + WriteCell<G::Trivia> + HydrateNode + RecordCells>(case: &Case<G, N>) -> ([u32; 4], [u32; 4]) {
    let (tree, _) = case.hydrated();
    let (_, built, root) = case.rebuilt_root(&tree);
    let first = case.render_built(&tree, &built, root);
    let second = case.render_built(&tree, &built, root);
    assert_eq!(first.text, second.text, "{}", case.name);
    (measuring(&first.work), measuring(&second.work))
}

#[test]
fn a_baseline_gap_is_measured_once() {
    for (name, (first, second)) in [("rust", measured_twice(&rust())), ("python", measured_twice(&python())), ("typescript", measured_twice(&typescript()))] {
        assert!(first.iter().any(|&work| work > 0), "{name}: the first render measures its runs, {first:?}");
        assert_eq!(second, [0; 4], "{name}: the second render measures none again (first {first:?})");
    }
}

fn rehydrates<G: RecordGrammar, N: ReadNode + Clone + WriteCell<G::Trivia> + HydrateNode + RecordCells>(case: &Case<G, N>) -> bool {
    let (mut tree, root) = case.hydrated();
    tree.tree_arena().take_grown();
    case.codemod(&mut tree, root);
    let grown = tree.tree_arena().take_grown();
    grown
}

#[test]
fn an_edit_does_not_rehydrate() {
    let wrote = [("rust", rehydrates(&rust())), ("python", rehydrates(&python())), ("typescript", rehydrates(&typescript()))];
    assert_eq!(wrote, [("rust", false), ("python", false), ("typescript", false)], "an edited render wrote into its tree's arena");
}

/// Every layout run of `source` and the gap the read-time options write
/// there (`ParsedTree::baseline_runs`), measured through the tree, which a
/// tree read part-way does, and from the records of a tree read whole,
/// which reads no tree to measure: how many runs agree, or each that does
/// not.
fn baselines_agree<G: EngineGrammar, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: fn() -> ResolvedOptions, source: &str) -> Result<usize, String> {
    let through_tree = parsed(grammar, options(), source);
    let from_records = parsed(grammar, options(), source);
    from_records.hydrate_record::<N>(NodeIndex::ROOT, Depth::All).map_err(|refusal| format!("{name} {source:?}: a whole read: {refusal}"))?;
    let tree_runs = through_tree.baseline_runs(false).map_err(|refusal| format!("{name} {source:?}: through the tree: {refusal}"))?;
    let before = from_records.layout_work();
    let record_runs = from_records.baseline_runs(false).map_err(|refusal| format!("{name} {source:?}: from the records: {refusal}"))?;
    let reads = from_records.layout_work().tree_reads - before.tree_reads;
    if reads > 0 {
        return Err(format!("{name} {source:?}: measuring from the records read the tree {reads} times"));
    }
    if tree_runs.len() != record_runs.len() {
        return Err(format!("{name} {source:?}: {} runs through the tree, {} from the records", tree_runs.len(), record_runs.len()));
    }
    let differ: Vec<String> = tree_runs
        .iter()
        .zip(&record_runs)
        .filter(|(tree, record)| tree != record)
        .map(|((run, tree), (_, record))| format!("{name} {:?} at {}..{}: tree {tree:?}, records {record:?}", source.get(run.start.saturating_sub(12) as usize..(run.end as usize + 12).min(source.len())), run.start, run.end))
        .collect();
    if differ.is_empty() { Ok(tree_runs.len()) } else { Err(differ.join("\n")) }
}

/// Every fixture of `name` and the case sources above measure each layout
/// run's gap alike from its records and through its tree.
fn grammar_baselines_agree<G: EngineGrammar + Copy, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: fn() -> ResolvedOptions, extra: &[&str]) -> usize {
    let sources: Vec<String> = fixture_sources(name).into_iter().chain(extra.iter().map(|source| (*source).to_owned())).collect();
    assert!(!sources.is_empty(), "{name} has fixtures");
    let mut runs = 0;
    let mut differ = Vec::new();
    for source in &sources {
        match baselines_agree::<G, N>(name, grammar, options, source) {
            Ok(n) => runs += n,
            Err(e) => differ.push(e),
        }
    }
    assert!(differ.is_empty(), "{} of {} {name} sources measure apart:\n{}", differ.len(), sources.len(), differ.join("\n"));
    runs
}

#[test]
fn a_baseline_measured_from_records_is_the_one_measured_through_the_tree() {
    let runs = [
        ("python", grammar_baselines_agree::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults, &[python().source])),
        ("regex", grammar_baselines_agree::<_, sittir_regex::render::AnyNode>("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults, &[])),
        ("rust", grammar_baselines_agree::<_, sittir_rust::render::AnyNode>("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults, &[rust().source])),
        ("scm", grammar_baselines_agree::<_, sittir_scm::render::AnyNode>("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults, &[])),
        ("typescript", grammar_baselines_agree::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults, &[typescript().source])),
    ];
    for (name, n) in runs {
        assert!(n > 0, "{name}: its fixtures hold layout runs");
    }
}
