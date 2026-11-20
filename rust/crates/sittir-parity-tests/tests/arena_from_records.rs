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
type NativeRender<N> = fn(SlotValue<N>, &RenderContext<'_>) -> Result<(sittir_core::types::Source, String), RenderError>;

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
    /// The root's render once its edited node's inner side is written back.
    codemod: &'static str,
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
        let native = (self.native)(SlotValue::Node(node), &RenderContext::new(&options, &tree.seating())).expect("a native render").1;
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
        codemod: "// a file\nfn f(a: i32,  b: i32) -> i32 {\n    // leading\n    let x = g(a, b);\n    if x > 0 {\n        h(x, /* inside */ 1);\n    }\n    x\n}\n\nstruct S { a: i32, b: u8 }\n",
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
        codemod: "class C:\n    # comment\n    def f(self, a,  b):\n        if a:\n            return [a, b]\n        return None\n\n\ndef g():\n    while x:\n        y(1, 2)\n",
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
        codemod: "const a = [1, 2,  3]\nfunction f(x: number, y: number) {\n  // note\n  if (x) {\n    g(x, y)\n  }\n  return { x, y }\n}\n\nclass K {\n  m() { return 1 }\n}\n",
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
    assert_eq!(over.render_at(over.root, sittir_core::slot::ChangedEdges::default(), &options, false).expect("a record render"), case.codemod, "{}: codemod", case.name);
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

/// Every node the records a read of `source` leaves answer, compared with
/// the tree's (`Engine::backer_parity`): how many nodes agree, or the first
/// that does not.
fn nodes_agree<G: RecordGrammar, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: fn() -> ResolvedOptions, source: &str) -> Result<u32, String> {
    let mut engine = shaped_engine(grammar, options());
    let parity = engine.backer_parity::<N>(source).map_err(|refusal| format!("{name} {source:?}: from the records: {refusal}"))?;
    if parity.differing > 0 {
        return Err(format!("{name} {source:?}: {} of {} nodes differ, the first at {:?}", parity.differing, parity.nodes, parity.first));
    }
    Ok(parity.nodes)
}

/// Every fixture of `name` and the case sources above answer each node
/// alike from its records and through its tree.
fn grammar_nodes_agree<G: RecordGrammar + Copy, N: HydrateNode + RecordCells>(name: &str, grammar: G, options: fn() -> ResolvedOptions, extra: &[&str]) -> u32 {
    let sources: Vec<String> = fixture_sources(name).into_iter().chain(extra.iter().map(|source| (*source).to_owned())).collect();
    assert!(!sources.is_empty(), "{name} has fixtures");
    let mut nodes = 0;
    let mut differ = Vec::new();
    for source in &sources {
        match nodes_agree::<G, N>(name, grammar, options, source) {
            Ok(n) => nodes += n,
            Err(e) => differ.push(e),
        }
    }
    assert!(differ.is_empty(), "{} of {} {name} sources answer apart:\n{}", differ.len(), sources.len(), differ.join("\n"));
    nodes
}

#[test]
fn the_records_answer_every_node_as_the_tree_does() {
    let nodes = [
        ("python", grammar_nodes_agree::<_, sittir_python::render::AnyNode>("python", sittir_python::PythonGrammar, sittir_python::render::options::defaults, &[python().source])),
        ("regex", grammar_nodes_agree::<_, sittir_regex::render::AnyNode>("regex", sittir_regex::RegexGrammar, sittir_regex::render::options::defaults, &[])),
        ("rust", grammar_nodes_agree::<_, sittir_rust::render::AnyNode>("rust", sittir_rust::RustGrammar, sittir_rust::render::options::defaults, &[rust().source])),
        ("scm", grammar_nodes_agree::<_, sittir_scm::render::AnyNode>("scm", sittir_scm::ScmGrammar, sittir_scm::render::options::defaults, &[])),
        ("typescript", grammar_nodes_agree::<_, sittir_typescript::render::AnyNode>("typescript", sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults, &[typescript().source])),
    ];
    for (name, n) in nodes {
        assert!(n > 0, "{name}: its fixtures hold nodes");
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

/// An extra whose kind is a text leaf has a record no slot names, which
/// renders as its source untouched and through the templates alike.
#[test]
fn an_extra_text_leaf_s_record_renders_as_its_source_through_the_templates() {
    type Python = sittir_python::render::AnyNode;
    let options = sittir_python::render::options::defaults();
    let tree = parsed(sittir_python::PythonGrammar, options.clone(), "x = 1 + \\\n    2\n");
    let read = OverRead::of::<Python>(sittir_python::PythonGrammar, &options, &tree);
    let index = nth_of_kind(&tree, "line_continuation_newline:0");
    let at = read.records[&index];
    let source = &tree.source()[sittir_core::types::Span::of(&sittir_core::engine::node_at_index(tree.tree(), index).expect("its node")).range()];
    for templates in [false, true] {
        assert_eq!(read.render_at(at, sittir_core::slot::ChangedEdges::default(), &options, templates).map_err(|e| e.to_string()).as_deref(), Ok(source), "templates {templates}");
    }
}

#[test]
fn a_method_name_s_envelope_is_answered_as_the_tree_answers_it() {
    type Ts = sittir_typescript::render::AnyNode;
    let mut engine = shaped_engine(sittir_typescript::TypeScriptGrammar, sittir_typescript::render::options::defaults());
    let parity = engine.backer_parity::<Ts>("class A { constructor() {} }\n").expect("a census");
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
    let comment = sittir_core::trivia::TriviaText { kind: sittir_rust::render::kind_ids::LINE_COMMENT, text: text.to_owned(), span: None, before: None, after: None };
    [TriviaNode::Text(comment), TriviaNode::Newline].into_iter().map(|entry| sittir_core::trivia::TriviaEntry::new(SlotValue::Node(entry))).collect()
}

const REBUILT: &str = "fn f() {\n    x = f(a) + g(b);\n    let c = |p: A ,q: B| p;\n}\n";

/// A built node's written sides that start with gap members, which its
/// record's header keeps as codes before the rest of the side in its row,
/// render from its record as natively.
#[test]
fn a_built_node_s_written_gap_members_render_from_its_record_as_natively() {
    use sittir_rust::render::node::{BinaryExpressionNode, TriviaNode};
    use sittir_rust::render::AnyNode;
    let options = sittir_rust::render::options::defaults();
    let entries = |members: &[TriviaNode]| members.iter().cloned().map(|member| sittir_core::trivia::TriviaEntry::new(SlotValue::Node(member))).collect::<Vec<_>>();
    let rendered = |trivia: Option<sittir_core::trivia::NodeTrivia<TriviaNode>>| {
        let tree = parsed(sittir_rust::RustGrammar, options.clone(), REBUILT);
        let mut node: AnyNode = tree.read(nth_of_kind(&tree, "binary_expression:0"), Depth::ONE).expect("a node");
        let AnyNode::BinaryExpression(BinaryExpressionNode { layout, .. }) = &mut node else { panic!("a binary expression") };
        rebuilt_layout(layout);
        layout.as_mut().expect("a read node names itself").trivia = trivia;
        let native = sittir_rust::render::render_node_parts(SlotValue::Node(node.clone()), &RenderContext::new(&options, &tree.seating())).expect("a native render").1;
        let over = OverRead::of::<AnyNode>(sittir_rust::RustGrammar, &options, &tree);
        let AnyNode::BinaryExpression(BinaryExpressionNode { layout, .. }) = &mut node else { panic!("a binary expression") };
        let layout = layout.as_mut().expect("a read node names itself");
        layout.sides = layout.sides.take().map(|sides| over.named(sides));
        (over.render(&node, &options), native)
    };
    let written = sittir_core::trivia::NodeTrivia { leading: Some(entries(&[TriviaNode::Blankline, TriviaNode::Space, TriviaNode::Space, TriviaNode::Newline])), trailing: Some(entries(&[TriviaNode::Space])), ..Default::default() };
    let (record, native) = rendered(Some(written));
    assert_eq!(record, native);
    assert_ne!(record, rendered(None).0, "the written sides render");
}

/// A built node rebuilt from a parsed one renders from its record as it does
/// natively: the sides written on it and on its unit child from the store,
/// each side it holds none of from the node it was rebuilt from, and its list
/// slot's layout from its side record or, when it stores none, from the
/// options.
#[test]
fn a_built_node_s_written_sides_units_and_slots_render_from_its_record_as_natively() {
    use sittir_rust::render::AnyNode;
    type Edit = fn(&mut NodeLayout<sittir_rust::render::node::TriviaNode>, &ParsedTree<sittir_rust::RustGrammar>);
    let written = |layout: &mut NodeLayout<_>| layout.trivia = Some(sittir_core::trivia::NodeTrivia { leading: Some(line_comment("// node")), ..Default::default() });
    let cases: [(&str, Edit, &str); 3] = [
        ("binary_expression:0", |layout, _| layout.units.push(UnitSides { slot: "_operator".into(), item: sittir_core::types::ItemIndex(0), trivia: sittir_core::trivia::NodeTrivia { leading: Some(line_comment("// unit")), ..Default::default() } }), "// unit"),
        ("closure_parameters:0", |layout, _| assert!(layout.slots.is_empty(), "a read stores no slot layout: prepare takes its tree's"), "|p: A, q: B|"),
        (
            "closure_parameters:0",
            |layout, tree| {
                let source = sittir_core::render::SourceTable::slot_layouts(&tree.seating(), layout.sides.as_ref().expect("rebuilt from its read"));
                assert!(source.is_empty(), "a read stores no slot layout: the options decide its gaps");
                let (space, tight) = (sittir_rust::render::kind_ids::_SPACE, sittir_rust::render::kind_ids::_TIGHT);
                layout.slots = vec![sittir_core::layout::SlotLayout { slot: "_parameters".into(), before: Some(space), after: Some(tight), ..Default::default() }];
            },
            "|p: A ,q: B|",
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
        let native = sittir_rust::render::render_node_parts(SlotValue::Node(node.clone()), &RenderContext::new(&options, &tree.seating())).expect("a native render").1;
        let over = OverRead::of::<AnyNode>(sittir_rust::RustGrammar, &options, &tree);
        let (AnyNode::BinaryExpression(sittir_rust::render::node::BinaryExpressionNode { layout, .. }) | AnyNode::ClosureParameters(sittir_rust::render::node::ClosureParametersNode { layout, .. })) = &mut node else { panic!("a node of {kind}") };
        let layout = layout.as_mut().expect("a read node names itself");
        layout.sides = layout.sides.take().map(|sides| over.named(sides));
        let record = over.render(&node, &options);
        assert_eq!(record, native, "{kind}");
        assert!(record.contains("// node") && record.contains(expected), "{kind}: {record:?}");
    }
}

/// A built empty node's inner side is the leading side of its record's
/// inside site: its record's store keeps it at that site, and reads it
/// there. It renders from its record as natively.
#[test]
fn a_built_empty_node_s_inner_side_is_kept_as_the_leading_side_of_its_inside_site() {
    use sittir_core::arena::{Cell, Linked, RecordSink};
    use sittir_core::trivia_store::Place;
    use sittir_core::trivia_table::TriviaSide;
    use sittir_core::types::NodeId;
    use sittir_rust::render::node::BlockNode;
    use sittir_rust::render::AnyNode;
    let options = sittir_rust::render::options::defaults();
    let tree = parsed(sittir_rust::RustGrammar, options.clone(), "fn f() {}\n");
    let mut node: AnyNode = tree.read(nth_of_kind(&tree, "block:0"), Depth::ONE).expect("a block");
    let AnyNode::Block(BlockNode { layout, .. }) = &mut node else { panic!("a block") };
    rebuilt_layout(layout);
    layout.as_mut().expect("a read node names itself").trivia = Some(sittir_core::trivia::NodeTrivia { inner: Some(line_comment("// inside")), ..Default::default() });
    let native = sittir_rust::render::render_node_parts(SlotValue::Node(node.clone()), &RenderContext::new(&options, &tree.seating())).expect("a native render").1;
    let over = OverRead::of::<AnyNode>(sittir_rust::RustGrammar, &options, &tree);
    let AnyNode::Block(BlockNode { layout, .. }) = &mut node else { panic!("a block") };
    let layout = layout.as_mut().expect("a read node names itself");
    layout.sides = layout.sides.take().map(|sides| over.named(sides));
    let at = {
        let mut link = |coord: &sittir_core::slot::NodeCoordinate| over.records.get(&coord.index).map(|&at| Linked::Record(at)).ok_or(sittir_core::arena::ArenaError::Unwritable("a child with no record"));
        let store = over.engine.written().clone();
        let mut built = over.engine.written().built_mut();
        let word = node.write_cell(&mut RecordSink::built(&mut built, &store, &mut link)).expect("a built record");
        match Cell::decode_built(word, &*built, sittir_rust::RustGrammar::KIND_BITS) {
            Ok(Cell::Child { at, .. }) => at,
            other => panic!("a built root: {other:?}"),
        }
    };
    {
        let built = over.engine.written().built();
        let site = Place::Node(NodeId::leaf(at.0, NodeId::INSIDE_WORD, 0));
        assert_eq!(over.engine.written().side(site, TriviaSide::Leading, &*built).expect("a side").map(|entries| entries.len()), Some(line_comment("// inside").len()), "the inside site's leading side keeps the comment");
        assert_eq!(over.engine.written().side(Place::record(at), TriviaSide::Inner, &*built).expect("a side"), over.engine.written().side(site, TriviaSide::Leading, &*built).expect("a side"), "the record's inner side reads as that site's leading side");
    }
    assert_eq!(over.render_at(at, sittir_core::slot::ChangedEdges::default(), &options, false).expect("a record render"), native);
    assert!(native.contains("// inside"), "{native:?}");
}
