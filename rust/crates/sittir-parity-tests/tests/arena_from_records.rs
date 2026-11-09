//! A tree its deep read hydrated whole renders in arena storage from what its
//! records and rows hold. Untouched, rebuilt from a read and edited, no render
//! is handed tree-sitter's tree (`LayoutWork::tree_reads`), a second render
//! measures no layout run's baseline gap again, and an edited render writes
//! no record.
#![cfg(feature = "arena")]

use sittir_core::arena::{Address, ArenaRead, BuiltChunks, Cell, CellAt, HeldArenas, HydrateNode, LeafRead, Linked, RecordCells, RecordGrammar, RecordSink, RecordTrees, WriteCell};
use sittir_core::engine::{node_at_index, EngineGrammar, NodeRead, ParsedTree};
use sittir_core::layout::{LayoutWork, NodeLayout, UnitSides};
use sittir_core::nodes::Nodes;
use sittir_core::options::ResolvedOptions;
use sittir_core::prepare::{Prepare, RenderContext};
use sittir_core::read::{descendant_count, Depth, HasLayout, ReadNode};
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

/// The record of `case`'s `nested` node (`kind:n`) rendered from a tree read
/// whole, with its tree reads meanwhile, and the same node's record rendered
/// from a tree read only from that node down, which measures through the
/// tree.
fn nested_render<G: RecordGrammar, N: ReadNode + Clone + WriteCell<G::Trivia> + HydrateNode + RecordCells>(case: &Case<G, N>, nested: &str) -> (String, u32, String) {
    let options = (case.options)();
    let (whole, _) = case.hydrated();
    let index = nth_of_kind(&whole, nested);
    let address = whole.hydrate_record::<N>(index, Depth::All).expect("a read").expect("the node's record");
    let before = whole.layout_work();
    let text = whole.render_record(address, ChangedEdges::default(), &options, &whole.seating()).expect("a record render");
    let reads = since(whole.layout_work(), before).tree_reads;
    let part = parsed(case.grammar, (case.options)(), case.source);
    let address = part.hydrate_record::<N>(index, Depth::All).expect("a read").expect("the node's record");
    let through_tree = part.render_record(address, ChangedEdges::default(), &options, &part.seating()).expect("a record render");
    (text, reads, through_tree)
}

#[test]
fn a_nested_record_renders_from_records() {
    for (name, (text, reads, through_tree)) in [
        ("rust", nested_render(&rust(), "block:0")),
        ("python", nested_render(&python(), "block:0")),
        ("typescript", nested_render(&typescript(), "statement_block:0")),
    ] {
        assert_eq!(reads, 0, "{name}: tree reads of a nested record's render");
        assert_eq!(text, through_tree, "{name}: a nested record renders from records as through the tree");
    }
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

/// Sources whose record-less reads take no tree once a whole read hydrated
/// them: one holding an `ERROR`, and one holding an identifier, a number
/// literal with parts (`kind:n`), whose interior has a record of its own,
/// units with sides, and the case's edited node.
struct Reads {
    error: &'static str,
    source: &'static str,
    number: &'static str,
}

fn rust_reads() -> Reads {
    Reads { error: "fn f() { let = ; }\n", source: "fn f(a: i32) -> i32 {\n    let v = [true, /* b */ false];\n    g(a, 0x1Fu8 as /* c */ u16);\n    a\n}\n", number: "integer_literal_hex:0" }
}

fn python_reads() -> Reads {
    Reads { error: "def f(a b):\n    pass\n", source: "def f(a):\n    x = [True, # c\n         None]\n    g(a, 1.5)\n", number: "float_point:0" }
}

fn typescript_reads() -> Reads {
    Reads { error: "let x = (;\n", source: "const t = [/* a */ true, , /* b */ false]\ng(t, 1.5)\n", number: "number_float_point:0" }
}

/// The tree reads each record-less read of `reads` makes in arena storage
/// once a whole read hydrated its tree: an `ERROR`'s read, an identifier's
/// leaf read, a number literal with parts' record, and the unit sides of
/// every node after a codemod edit.
fn record_less_reads<G: RecordGrammar, N: ReadNode + Clone + WriteCell<G::Trivia> + HydrateNode + RecordCells>(case: &Case<G, N>, reads: &Reads) -> [u32; 4] {
    let tree = parsed(case.grammar, (case.options)(), reads.error);
    let count = descendant_count(&tree.tree().root_node());
    let error = (0..count)
        .map(NodeIndex::new)
        .find(|&index| node_at_index(tree.tree(), index).is_some_and(|node| node.is_error()))
        .unwrap_or_else(|| panic!("{}: {:?} holds an ERROR", case.name, reads.error));
    tree.hydrate_record::<N>(NodeIndex::ROOT, Depth::All).expect("a whole read");
    let before = tree.layout_work();
    let read = tree.read_node::<N>(error, Depth::ONE).expect("a node").expect("a read");
    assert!(matches!(read, NodeRead::Error(_)), "{}: an ERROR reads as one", case.name);
    let error_reads = since(tree.layout_work(), before).tree_reads;

    let mut tree = parsed(case.grammar, (case.options)(), reads.source);
    let identifier = nth_of_kind(&tree, "identifier:0");
    let number = nth_of_kind(&tree, reads.number);
    let edited = nth_of_kind(&tree, case.edited);
    let count = descendant_count(&tree.tree().root_node());
    tree.hydrate_record::<N>(NodeIndex::ROOT, Depth::All).expect("a whole read");
    let before = tree.layout_work();
    assert!(tree.read_leaf::<N>(identifier).expect("the records read").is_some(), "{}: a cell of its holder names an identifier", case.name);
    let identifier_reads = since(tree.layout_work(), before).tree_reads;
    let before = tree.layout_work();
    assert!(tree.written_record::<N>(number).is_some(), "{}: a number literal with parts has a record", case.name);
    let number_reads = since(tree.layout_work(), before).tree_reads;
    edit_in_place(&mut tree, edited);
    let before = tree.layout_work();
    let units: usize = (0..count).map(|index| tree.unit_sides(NodeIndex(index)).len()).sum();
    let unit_reads = since(tree.layout_work(), before).tree_reads;
    assert!(units > 0, "{}: {:?} holds units with sides", case.name, reads.source);
    [error_reads, identifier_reads, number_reads, unit_reads]
}

#[test]
fn leaf_error_and_unit_reads_take_no_tree() {
    let reads = [
        ("rust", record_less_reads(&rust(), &rust_reads())),
        ("python", record_less_reads(&python(), &python_reads())),
        ("typescript", record_less_reads(&typescript(), &typescript_reads())),
    ];
    assert_eq!(reads, [("rust", [0; 4]), ("python", [0; 4]), ("typescript", [0; 4])], "tree reads of an ERROR's read, an identifier's leaf read, a number's record and the unit sides after an edit");
}

/// Over `source`, every node's unit sides in object storage are a typed
/// read's of its tree (`typed_unit_sides`), and arena storage's records
/// answer its nodes, unit sides and leaf reads as its tree does
/// (`backer_parity`): how many nodes it compared, or each that differs.
fn reads_agree<G: RecordGrammar, N: ReadNode + HydrateNode + RecordCells + Prepare + HasLayout<Option<Box<NodeLayout<G::Trivia>>>>>(name: &str, grammar: G, options: fn() -> ResolvedOptions, source: &str) -> Result<u32, String>
where
    G::Trivia: PartialEq + std::fmt::Debug,
{
    let object = parsed(grammar, options(), source);
    let count = descendant_count(&object.tree().root_node());
    let mut differ: Vec<String> = (0..count)
        .map(NodeIndex)
        .filter_map(|index| {
            let (typed, in_object) = (object.typed_unit_sides::<N>(index), object.unit_sides(index));
            (in_object != typed).then(|| format!("{name} {source:?} node {}: unit sides typed {typed:?}, object {in_object:?}", index.0))
        })
        .collect();
    let parity = parsed(grammar, options(), source).backer_parity::<N>().map_err(|refusal| format!("{name} {source:?}: {refusal}"))?;
    if parity.differing > 0 {
        differ.push(format!("{name} {source:?}: arena storage reads apart from its tree: {parity:?}"));
    }
    if differ.is_empty() { Ok(count) } else { Err(differ.join("\n")) }
}

fn grammar_reads_agree<G: RecordGrammar + Copy, N: ReadNode + HydrateNode + RecordCells + Prepare + HasLayout<Option<Box<NodeLayout<G::Trivia>>>>>(name: &str, grammar: G, options: fn() -> ResolvedOptions, extra: &[&str]) -> u32
where
    G::Trivia: PartialEq + std::fmt::Debug,
{
    let sources: Vec<String> = fixture_sources(name).into_iter().chain(extra.iter().map(|source| (*source).to_owned())).collect();
    assert!(!sources.is_empty(), "{name} has fixtures");
    let (mut nodes, mut differ) = (0, Vec::new());
    for source in &sources {
        match reads_agree::<G, N>(name, grammar, options, source) {
            Ok(n) => nodes += n,
            Err(e) => differ.push(e),
        }
    }
    assert!(differ.is_empty(), "{} of {} {name} sources read apart:\n{}", differ.len(), sources.len(), differ.join("\n"));
    nodes
}

#[test]
fn leaf_and_unit_reads_agree_across_storages() {
    let nodes = [
        ("python", grammar_reads_agree::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults, &[python().source, python_reads().source])),
        ("regex", grammar_reads_agree::<_, sittir_regex::render::AnyNode>("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults, &[])),
        ("rust", grammar_reads_agree::<_, sittir_rust::render::AnyNode>("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults, &[rust().source, rust_reads().source])),
        ("scm", grammar_reads_agree::<_, sittir_scm::render::AnyNode>("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults, &[])),
        ("typescript", grammar_reads_agree::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults, &[typescript().source, typescript_reads().source])),
    ];
    for (name, n) in nodes {
        assert!(n > 0, "{name}: its fixtures hold nodes");
    }
}

/// A list with a hole numbers each unit in it once: the typed read, the
/// units walk in both storages, and the list's slot items give the units
/// after the hole the same item.
#[test]
fn a_list_item_is_numbered_once() {
    let source = "const t = [/* a */ true, , /* b */ false]\n";
    let options = sittir_typescript::render::options::defaults;
    let object = parsed(sittir_typescript::TypeScriptGrammar, options(), source);
    let arena = parsed(sittir_typescript::TypeScriptGrammar, options(), source);
    arena.hydrate_record::<sittir_typescript::render::AnyNode>(NodeIndex::ROOT, Depth::All).expect("a whole read");
    let array = nth_of_kind(&object, "array:0");
    let items = |units: Vec<UnitSides<_>>| units.into_iter().map(|unit| unit.item.0).collect::<Vec<u32>>();
    let typed = items(object.typed_unit_sides::<sittir_typescript::render::AnyNode>(array));
    assert_eq!(typed, [0, 2], "the typed read numbers the units around the hole");
    assert_eq!(items(object.unit_sides(array)), typed, "object storage");
    assert_eq!(items(arena.unit_sides(array)), typed, "arena storage");
    let mut nodes = arena.nodes();
    let at = nodes.kid(array);
    let routed = sittir_typescript::TypeScriptGrammar.slot_routes(&mut nodes, &at).expect("an array routes its children");
    let scalar: Vec<u32> = routed
        .slot_items()
        .into_iter()
        .filter(|&(child, _, _)| matches!(routed.routes[child], sittir_core::read::Route::Slot { scalar: true, .. }))
        .map(|(_, _, item)| item.0)
        .collect();
    assert_eq!(scalar, typed, "the list's slot items");
}

/// Once a tree is read whole, an extra whose read has structure has a record
/// of its own, which its tree holds since no cell names it: a rust doc
/// comment, and a python comment, whose read captures its content. A named
/// node that neither a cell nor a record of its own holds reads from its
/// row: as the unit its read stores (python's newline token, a regex
/// quantifier's lazy flag), else as a leaf (python's line continuation).
#[test]
fn an_extra_with_structure_is_held_and_a_node_no_cell_names_reads_from_its_row() {
    type Rust = sittir_rust::render::AnyNode;
    type Python = sittir_python::render::AnyNode;
    type Regex = sittir_regex::render::AnyNode;
    let rust_tree = parsed(sittir_rust::RustGrammar, sittir_rust::render::options::defaults(), "/// doc\nfn f() {}\n");
    rust_tree.hydrate_record::<Rust>(NodeIndex::ROOT, Depth::All).expect("a whole read");
    let doc = nth_of_kind(&rust_tree, "line_comment:0");
    assert!(rust_tree.written_record::<Rust>(doc).is_some(), "a doc comment's record is held");
    assert_eq!(rust_tree.read_leaf::<Rust>(doc), Ok(None), "a doc comment reads through its record");
    let python_tree = parsed(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), "x = 1  # c\n");
    python_tree.hydrate_record::<Python>(NodeIndex::ROOT, Depth::All).expect("a whole read");
    assert!(python_tree.written_record::<Python>(nth_of_kind(&python_tree, "comment:0")).is_some(), "a comment's record is held");
    let newline = nth_of_kind(&python_tree, "newline:0");
    assert!(python_tree.written_record::<Python>(newline).is_none(), "a newline token has no record");
    assert_eq!(python_tree.read_leaf::<Python>(newline), Ok(Some(LeafRead::Unit(sittir_python::render::kind_ids::_NEWLINE))));
    let regex_tree = parsed(sittir_regex::RegexGrammar, sittir_regex::render::options::defaults(), "a*?");
    regex_tree.hydrate_record::<Regex>(NodeIndex::ROOT, Depth::All).expect("a whole read");
    let lazy = nth_of_kind(&regex_tree, "lazy:0");
    assert_eq!(regex_tree.read_leaf::<Regex>(lazy), Ok(Some(LeafRead::Unit(sittir_regex::render::kind_ids::_LAZY))));
    let continued = parsed(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), "x = 1 + \\\n    2\n");
    continued.hydrate_record::<Python>(NodeIndex::ROOT, Depth::All).expect("a whole read");
    let continuation = nth_of_kind(&continued, "line_continuation_newline:0");
    let at = continued.row_coordinate(continuation).expect("a row");
    assert_eq!(continued.read_leaf::<Python>(continuation), Ok(Some(LeafRead::Leaf { kind: at.kind.expect("a stamped kind"), span: at.span })));
}

/// A walk writes and holds the record of each extra its reader reads as one
/// as it meets the extra among its node's children, with no pass over the
/// tree after it: a root read one level down, which leaves rows under its
/// children unwritten, holds the doc comment among them.
#[test]
fn a_walk_holds_each_structural_extra_it_meets() {
    type Rust = sittir_rust::render::AnyNode;
    let tree = parsed(sittir_rust::RustGrammar, sittir_rust::render::options::defaults(), "/// doc\nfn f() {}\n");
    let doc = nth_of_kind(&tree, "line_comment:0");
    tree.read_record::<Rust>(NodeIndex::ROOT, Depth::ONE).expect("a read");
    let arena = tree.tree_arena();
    assert!(arena.node_rows().is_none(), "a read one level down leaves rows under its children unwritten");
    assert!(arena.held(doc).is_some(), "the doc comment's record is held");
}

#[test]
fn a_node_of_a_record_kind_no_written_record_names_is_no_leaf() {
    type Ts = sittir_typescript::render::AnyNode;
    let tree = parsed(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults(), "class A { constructor() {} }\n");
    assert_eq!(tree.backer_parity::<Ts>().expect("a census").differing, 0, "the typed read takes a method name's envelope as a node with a slot");
    let name = nth_of_kind(&tree, "property_identifier:0");
    assert_eq!(tree.read_leaf::<Ts>(name), Ok(None), "a method name's envelope is no leaf before a read writes its record");
}
