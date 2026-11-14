//! A read's records render from the engine's arena alone, untouched and
//! edited, and answer its nodes and layout as the tree they were read from
//! does. A node built over a read's records renders as it does natively.
#![cfg(feature = "arena")]

use sittir_core::arena::{HydrateNode, RecordCells, RecordGrammar, WriteCell};
use sittir_core::engine::{EngineGrammar, ParsedTree};
use sittir_core::layout::{NodeLayout, UnitSides};
use sittir_core::nodes::Nodes;
use sittir_core::options::ResolvedOptions;
use sittir_core::prepare::RenderContext;
use sittir_core::read::{Depth, ReadNode};
use sittir_core::render::RenderError;
use sittir_core::types::NodeIndex;
use sittir_core::SlotValue;
use sittir_parity_tests::{fixture_sources, parsed, OverRead};

/// A grammar's native render of a root (`render_node_parts`).
type NativeRender<N> = fn(SlotValue<N>, &RenderContext<'_>, Option<&mut sittir_core::baseline::Baseline>) -> Result<(sittir_core::types::Source, String), RenderError>;

/// One grammar's renders, a source holding comments, lists and nested
/// blocks, the node of it a codemod edits (`kind:n`, its `n`th node of
/// `kind`), and how its root, read, becomes a rebuilt node: one whose sides
/// come from the node it was read from, where it no longer stands.
struct Case<G: EngineGrammar, N> {
    name: &'static str,
    grammar: G,
    options: fn() -> ResolvedOptions,
    native: NativeRender<N>,
    rebuild: fn(&mut N),
    /// The root, read, made a built node of its own: it keeps the children
    /// it was read with and no layout.
    bare: fn(&mut N),
    source: &'static str,
    edited: &'static str,
}

impl<G: RecordGrammar + Copy, N: ReadNode + Clone + WriteCell<G::Trivia> + HydrateNode + RecordCells> Case<G, N> {
    /// The case's source as a tree, and an engine that read it and kept no
    /// tree.
    fn read(&self) -> (ParsedTree<G>, OverRead<G>) {
        let tree = parsed(self.grammar, (self.options)(), self.source);
        let over = OverRead::of::<N>(self.grammar, &(self.options)(), &tree);
        (tree, over)
    }

    /// The case's root read one level and made a built node (`bare`).
    fn bare_root(&self, tree: &ParsedTree<G>) -> N {
        let mut node: N = tree.read(NodeIndex::ROOT, Depth::ONE).expect("the root reads");
        (self.bare)(&mut node);
        node
    }

    /// The bare root rendered from the records a read of the case's source
    /// left (`over_read`), and its native render after it.
    fn bare(&self) -> (String, String) {
        let tree = parsed(self.grammar, (self.options)(), self.source);
        self.over_read(&tree, self.bare_root(&tree))
    }

    /// The root rebuilt from its read (`rebuild`) rendered from the records
    /// a read of the case's source left, and its native render after it.
    fn rebuilt(&self, tree: &ParsedTree<G>) -> (String, String) {
        let mut node: N = tree.read(NodeIndex::ROOT, Depth::ONE).expect("the root reads");
        (self.rebuild)(&mut node);
        self.over_read(tree, node)
    }

    fn over_read(&self, tree: &ParsedTree<G>, node: N) -> (String, String) {
        let options = (self.options)();
        let record = OverRead::of::<N>(self.grammar, &options, tree).render(&node, &options);
        let native = (self.native)(SlotValue::Node(node), &RenderContext::new(&options, &tree.seating()), None).expect("a native render").1;
        (record, native)
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
        rebuild: |node| {
            let sittir_rust::render::AnyNode::SourceFile(file) = node else { panic!("the root is a file") };
            rebuilt_layout(&mut file.layout);
        },
        bare: |node| {
            let sittir_rust::render::AnyNode::SourceFile(file) = node else { panic!("the root is a file") };
            file.layout = None;
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
        rebuild: |node| {
            let sittir_python::render::AnyNode::Module(module) = node else { panic!("the root is a module") };
            rebuilt_layout(&mut module.layout);
        },
        bare: |node| {
            let sittir_python::render::AnyNode::Module(module) = node else { panic!("the root is a module") };
            module.layout = None;
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
        rebuild: |node| {
            let sittir_typescript::render::AnyNode::Program(program) = node else { panic!("the root is a program") };
            rebuilt_layout(&mut program.layout);
        },
        bare: |node| {
            let sittir_typescript::render::AnyNode::Program(program) = node else { panic!("the root is a program") };
            program.layout = None;
        },
        source: "const a = [1, 2,  3]\nfunction f(x: number, y: number) {\n  // note\n  if (x) {\n    g(x, y)\n  }\n  return { x, y }\n}\nclass K {\n  m() { return 1 }\n}\n",
        edited: "expression_statement:0",
    }
}

/// The case's root rendered from its read's records untouched; rebuilt
/// from its read, beside its native render; and again after its edited
/// node's own inner side is written back.
fn renders_from_records<G: RecordGrammar + Copy, N: ReadNode + Clone + WriteCell<G::Trivia> + HydrateNode + RecordCells>(case: &Case<G, N>) {
    let options = (case.options)();
    let (tree, over) = case.read();
    assert_eq!(over.render_at(over.root, sittir_core::slot::ChangedEdges::default(), &options, false).expect("a record render"), case.source, "{}: untouched", case.name);
    let (rebuilt, native) = case.rebuilt(&tree);
    assert_eq!(rebuilt, native, "{}: rebuilt", case.name);
    over.edit_in_place(nth_of_kind(&tree, case.edited));
    assert_eq!(over.render_at(over.root, sittir_core::slot::ChangedEdges::default(), &options, false).expect("a record render"), case.source, "{}: codemod", case.name);
}

#[test]
fn a_read_s_records_render_untouched_rebuilt_and_edited() {
    renders_from_records(&rust());
    renders_from_records(&python());
    renders_from_records(&typescript());
}

/// An engine whose store knows the grammar's record shapes, as the addon's
/// does: what releasing a read's records reads.
fn shaped_engine<G: RecordGrammar>(grammar: G, options: ResolvedOptions) -> sittir_core::engine::Engine<G> {
    sittir_core::engine::Engine::with_store(grammar, options, sittir_core::trivia_store::TriviaStore::for_records(G::KIND_BITS, G::shape)).expect("an engine")
}

/// Every layout run of `source` and the gap the read-time options write
/// there (`ParsedTree::baseline_runs`), measured through the tree and from
/// the records a read of it leaves (`Engine::backer_parity`), with every
/// node the records answer compared with the tree's: how many runs agree,
/// or each that does not.
fn baselines_agree<G: RecordGrammar, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: fn() -> ResolvedOptions, source: &str) -> Result<usize, String> {
    let through_tree = parsed(grammar, options(), source);
    let tree_runs = through_tree.baseline_runs(false).map_err(|refusal| format!("{name} {source:?}: through the tree: {refusal}"))?;
    let mut engine = shaped_engine(grammar, options());
    let (parity, record_runs) = engine.backer_parity::<N>(source).map_err(|refusal| format!("{name} {source:?}: from the records: {refusal}"))?;
    if parity.nodes == 0 {
        return Ok(0);
    }
    if parity.differing > 0 {
        return Err(format!("{name} {source:?}: {} of {} nodes differ, the first at {:?}", parity.differing, parity.nodes, parity.first));
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
fn grammar_baselines_agree<G: RecordGrammar + Copy, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: fn() -> ResolvedOptions, extra: &[&str]) -> usize {
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

/// A list's units keep their items around a hole, in the tree's navigation
/// and in the records', and the
/// list's slot items give the units after the hole the same item.
#[test]
fn a_list_item_is_numbered_once() {
    type Ts = sittir_typescript::render::AnyNode;
    let source = "const t = [/* a */ true, , /* b */ false]\n";
    let options = sittir_typescript::render::options::defaults;
    let tree = parsed(sittir_typescript::TypeScriptGrammar, options(), source);
    let over = OverRead::of::<Ts>(sittir_typescript::TypeScriptGrammar, &options(), &tree);
    let array = nth_of_kind(&tree, "array:0");
    let items = |units: Vec<UnitSides<_>>| units.into_iter().map(|unit| unit.item.0).collect::<Vec<u32>>();
    let typed = vec![0, 2];
    assert_eq!(items(tree.unit_sides(array)), typed, "through the tree, the units around the hole");
    let (from_records, scalar) = over
        .engine
        .read_named(over.name(array).expect("an array has a record"), |parsed, at| {
            let mut nodes = parsed.nodes();
            let kid = nodes.kid(at);
            let routed = sittir_typescript::TypeScriptGrammar.slot_routes(&mut nodes, &kid).expect("an array routes its children");
            let scalar: Vec<u32> = routed
                .slot_items()
                .into_iter()
                .filter(|&(child, _, _)| matches!(routed.routes[child], sittir_core::read::Route::Slot { scalar: true, .. }))
                .map(|(_, _, item)| item.0)
                .collect();
            (items(parsed.unit_sides(at)), scalar)
        })
        .expect("the records read")
        .expect("a read wrote the record");
    assert_eq!(from_records, typed, "from the records");
    assert_eq!(scalar, typed, "the list's slot items");
}

/// A read leaves a record for an extra whose read has structure, a rust
/// doc comment and a python comment, whose read captures its content, and
/// none for a token its holder's template writes.
#[test]
fn an_extra_with_structure_has_a_record_and_a_token_has_none() {
    type Rust = sittir_rust::render::AnyNode;
    type Python = sittir_python::render::AnyNode;
    let rust_tree = parsed(sittir_rust::RustGrammar, sittir_rust::render::options::defaults(), "/// doc\nfn f() {}\n");
    let rust_read = OverRead::of::<Rust>(sittir_rust::RustGrammar, &sittir_rust::render::options::defaults(), &rust_tree);
    assert!(rust_read.name(nth_of_kind(&rust_tree, "line_comment:0")).is_some(), "a doc comment has a record");
    let python_tree = parsed(sittir_python::PythonGrammar, sittir_python::render::options::defaults(), "x = 1  # c\n");
    let python_read = OverRead::of::<Python>(sittir_python::PythonGrammar, &sittir_python::render::options::defaults(), &python_tree);
    assert!(python_read.name(nth_of_kind(&python_tree, "comment:0")).is_some(), "a comment has a record");
    assert!(python_read.name(nth_of_kind(&python_tree, "newline:0")).is_none(), "a newline token has no record");
}

#[test]
fn a_method_name_s_envelope_is_answered_as_the_tree_answers_it() {
    type Ts = sittir_typescript::render::AnyNode;
    let mut engine = shaped_engine(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults());
    let (parity, _) = engine.backer_parity::<Ts>("class A { constructor() {} }\n").expect("a census");
    assert!(parity.nodes > 0);
    assert_eq!(parity.differing, 0, "the first differing node: {:?}", parity.first);
}

fn holds_a_read<G: RecordGrammar + Copy, N: ReadNode + Clone + WriteCell<G::Trivia> + HydrateNode + RecordCells>(case: &Case<G, N>, held: &str) {
    let (record, native) = case.bare();
    assert!(record.contains(held), "{}: the built root renders the children it holds: {record:?}", case.name);
    assert_eq!(record, native, "{}", case.name);
}

#[test]
fn a_built_record_over_a_read_s_records_renders_as_natively() {
    holds_a_read(&rust(), "let x = g(a, b);");
    holds_a_read(&python(), "return [a, b]");
    holds_a_read(&typescript(), "return { x, y }");
}

fn line_comment(text: &str) -> Vec<sittir_core::trivia::TriviaEntry<sittir_rust::render::node::TriviaNode>> {
    use sittir_rust::render::node::TriviaNode;
    let comment = sittir_core::trivia::TriviaText { kind: sittir_rust::render::kind_ids::LINE_COMMENT, text: text.to_owned(), span: None, before: None, after: None, bytes: None };
    [TriviaNode::Text(comment), TriviaNode::Newline].into_iter().map(|entry| sittir_core::trivia::TriviaEntry::new(SlotValue::Node(entry))).collect()
}

const REBUILT: &str = "fn f() {\n    x = f(a) + g(b);\n    let c = |p: A ,q: B| p;\n}\n";

/// A built node rebuilt from a parsed one renders from its record as it does
/// natively: the sides written on it and on its unit child from the store,
/// each side it holds none of from the node it was rebuilt from, and its list
/// slot's layout from its side record or, when it stores none, from that
/// node.
#[test]
fn a_built_node_s_written_sides_units_and_slots_render_from_its_record_as_natively() {
    use sittir_rust::render::AnyNode;
    type Edit = fn(&mut NodeLayout<sittir_rust::render::node::TriviaNode>, &ParsedTree<sittir_rust::RustGrammar>);
    let written = |layout: &mut NodeLayout<_>| layout.trivia = Some(sittir_core::trivia::NodeTrivia { leading: Some(line_comment("// node")), ..Default::default() });
    let cases: [(&str, Edit, &str); 3] = [
        ("binary_expression:0", |layout, _| layout.units.push(UnitSides { slot: "_operator".into(), item: sittir_core::types::ItemIndex(0), trivia: sittir_core::trivia::NodeTrivia { leading: Some(line_comment("// unit")), ..Default::default() } }), "// unit"),
        ("closure_parameters:0", |layout, _| assert!(layout.slots.is_empty(), "a read stores no slot layout: prepare takes its tree's"), "|p: A ,q: B|"),
        (
            "closure_parameters:0",
            |layout, tree| {
                let source = sittir_core::render::SourceTable::slot_layouts(&tree.seating(), layout.sides.as_ref().expect("rebuilt from its read"), sittir_core::render::Lent::NONE);
                assert!(!source.is_empty(), "the source spaces the list apart from the options");
                layout.slots = source.into_iter().map(|slot| sittir_core::layout::SlotLayout { before: slot.after, after: slot.before, ..slot }).collect();
            },
            "|p: A, q: B|",
        ),
    ];
    let options = sittir_rust::render::options::defaults();
    for (kind, edit, expected) in cases {
        let tree = parsed(sittir_rust::RustGrammar, options.clone(), REBUILT);
        let mut node: AnyNode = tree.read(nth_of_kind(&tree, kind), Depth::ONE).expect("a node");
        let (AnyNode::BinaryExpression(sittir_rust::render::node::BinaryExpressionNode { layout, .. }) | AnyNode::ClosureParameters(sittir_rust::render::node::ClosureParametersNode { layout, .. })) = &mut node else { panic!("a node of {kind}") };
        rebuilt_layout(layout);
        let layout = layout.as_mut().expect("a read node names itself");
        written(layout);
        edit(layout, &tree);
        let native = sittir_rust::render::render_node_parts(SlotValue::Node(node.clone()), &RenderContext::new(&options, &tree.seating()), None).expect("a native render").1;
        let over = OverRead::of::<AnyNode>(sittir_rust::RustGrammar, &options, &tree);
        let (AnyNode::BinaryExpression(sittir_rust::render::node::BinaryExpressionNode { layout, .. }) | AnyNode::ClosureParameters(sittir_rust::render::node::ClosureParametersNode { layout, .. })) = &mut node else { panic!("a node of {kind}") };
        let layout = layout.as_mut().expect("a read node names itself");
        layout.sides = layout.sides.take().map(|sides| over.named(sides));
        let record = over.render(&node, &options);
        assert_eq!(record, native, "{kind}");
        assert!(record.contains("// node") && record.contains(expected), "{kind}: {record:?}");
    }
}
