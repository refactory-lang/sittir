//! A record renders as the native node written into it. For every round-trip
//! source of each grammar, the root read one level down and rendered
//! natively renders the same from the record its first read wrote, from the
//! record a read at every depth wrote, and twice over. A parsed node with no
//! write in its range renders as its coordinate, whatever cell names it and
//! however it was read (shared-arena design § Render; trivia-table design
//! § 4, copying source text); one a write lies in renders from its record
//! through its template (trivia-table design § 4, edited ranges). Every node
//! of every source renders alike both ways: untouched, and with its own
//! inner side written back, a test-only write that changes no text.
#![cfg(feature = "arena")]

use sittir_core::arena::{Address, Arena, Cell, CellAt, HeldArenas, Linked, RecordGrammar, RecordSink, RecordTrees, WriteCell};
use sittir_core::engine::{claim_tree_id, Engine, EngineGrammar, ParsedTree};
use sittir_core::options::ResolvedOptions;
use sittir_core::prepare::RenderContext;
use sittir_core::read::{read_at, Depth, ReadNode};
use sittir_core::render::RenderError;
use sittir_core::slot::ChangedEdges;
use sittir_core::trivia_store::TriviaStore;
use sittir_core::types::NodeIndex;
use sittir_core::SlotValue;
use sittir_parity_tests::{edit_in_place, load_fixtures, ParityFixture};

/// How a source's records render alike.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Alike {
    /// Each read's record renders the native root's text.
    Rendered,
    /// The native render panics, and each record's does too.
    Panicking,
    /// The model reads no root of the source.
    Unread,
}

/// A grammar's native render of a root (`render_node_parts`).
type NativeRender<N> = fn(SlotValue<N>, &RenderContext<'_>, Option<&mut sittir_core::baseline::Baseline>) -> Result<(sittir_core::types::Source, String), RenderError>;

/// A grammar's render of a record (`render_record`).
type RecordRender<T> = fn(CellAt, &mut dyn RecordTrees, &Arena, &TriviaStore<T>, &RenderContext<'_>) -> Result<String, RenderError>;

/// One grammar's two renders: a native root's, and a record's.
struct Renders<G: EngineGrammar, N> {
    grammar: G,
    options: fn() -> ResolvedOptions,
    native: NativeRender<N>,
    record: RecordRender<G::Trivia>,
}

impl<G: RecordGrammar, N: ReadNode + WriteCell<G::Trivia>> Renders<G, N> {
    fn engine(&self) -> Engine<G> {
        Engine::new(self.grammar, (self.options)()).expect("an engine")
    }

    fn parse(engine: &mut Engine<G>, source: &str) -> ParsedTree<G> {
        engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse")
    }

    /// The node at `index` of `tree`, read one level down seating its sides,
    /// rendered natively; `None` when the model reads no node there.
    fn native(&self, tree: &ParsedTree<G>, index: NodeIndex, options: &ResolvedOptions) -> Option<Result<String, String>> {
        let node: N = read_at(&mut tree.tree().walk(), &mut tree.seating_ctx(), index, Depth::ONE).ok()?;
        let ctx = RenderContext { options, sources: tree };
        Some((self.native)(SlotValue::Node(node), &ctx, None).map(|(_, text)| text).map_err(|e| format!("native: {e}")))
    }

    /// The built record `root` of the arena `built`, its parsed children in
    /// `tree`'s, rendered twice: both renders, which must agree.
    fn record(&self, tree: &ParsedTree<G>, built: &Arena, root: CellAt, options: &ResolvedOptions) -> Result<String, String> {
        let ctx = RenderContext { options, sources: tree };
        twice(|| {
            let mut arenas = HeldArenas::of([(tree.tree_id(), tree.tree_arena())]);
            (self.record)(root, &mut arenas, built, tree.written(), &ctx).map_err(|e| format!("record: {e}"))
        })
    }

    /// The record at `at` of `tree`'s arena rendered twice by its entry point
    /// (`ParsedTree::render_record`): both renders, which must agree.
    fn parsed(tree: &ParsedTree<G>, at: Address, options: &ResolvedOptions) -> Result<String, String> {
        twice(|| tree.render_record(at, ChangedEdges::default(), options).map_err(|e| format!("record: {e}")))
    }

    /// The record of `tree`'s root, its first read `depth` levels down
    /// written by its entry point (`ParsedTree::read_record`).
    fn first_read(tree: &ParsedTree<G>, depth: Depth) -> Result<Address, String> {
        tree.read_record::<N>(NodeIndex::ROOT, depth)?.ok_or_else(|| "the root has no record".to_owned())
    }

    /// Whether `source` renders alike from its records, read to each depth:
    /// the same text, or, where the native render panics, a record render
    /// that panics too.
    fn renders_alike(&self, source: &str) -> Result<Alike, String> {
        let mut engine = self.engine();
        let options = engine.options().clone();
        let mut panicked = false;
        for depth in [Depth::ONE, Depth::All] {
            let tree = Self::parse(&mut engine, source);
            let native = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| self.native(&tree, NodeIndex::ROOT, &options)));
            let record = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| Self::first_read(&tree, depth).and_then(|root| Self::parsed(&tree, root, &options))));
            let (native, record) = match (native, record) {
                (Ok(None), _) => return Ok(Alike::Unread),
                (Err(_), Err(_)) => {
                    panicked = true;
                    continue;
                }
                (Err(_), Ok(_)) => return Err(format!("read {depth:?}: the native render panics and the record's does not")),
                (Ok(_), Err(_)) => return Err(format!("read {depth:?}: the record render panics and the native one does not")),
                (Ok(Some(native)), Ok(record)) => (native?, record?),
            };
            if record != native {
                return Err(format!("read {depth:?}:\n native {native:?}\n record {record:?}"));
            }
        }
        Ok(if panicked { Alike::Panicking } else { Alike::Rendered })
    }
}

/// How one node renders alike from its record.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum NodeAlike {
    /// The model reads no node there, or writes it no record.
    Unread,
    Rendered,
    /// The native render panics, and the record's does too.
    Panicking,
}

impl<G: RecordGrammar, N: ReadNode + WriteCell<G::Trivia>> Renders<G, N> {
    /// Whether the node at `index` of `tree`, read one level down, renders
    /// from its record as natively, or panics there as natively.
    fn node_alike(&self, tree: &ParsedTree<G>, index: NodeIndex, options: &ResolvedOptions) -> Result<NodeAlike, String> {
        let node = sittir_core::engine::node_at_index(tree.tree(), index).expect("a node at every index");
        let at = format!("node {index} ({} {:?})", node.kind(), &tree.source()[sittir_core::types::Span::of(&node).range()]);
        let native = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| self.native(tree, index, options)));
        if matches!(native, Ok(None)) {
            return Ok(NodeAlike::Unread);
        }
        let record = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| tree.read_record::<N>(index, Depth::ONE).and_then(|at| at.map(|at| Self::parsed(tree, at, options)).transpose())));
        match (native, record) {
            (_, Ok(Ok(None))) => Ok(NodeAlike::Unread),
            (Err(_), Err(_)) => Ok(NodeAlike::Panicking),
            (Err(_), Ok(_)) => Err(format!("{at}: the native render panics and the record's does not")),
            (Ok(_), Err(_)) => Err(format!("{at}: the record render panics and the native one does not")),
            (Ok(native), Ok(record)) => {
                let (native, record) = (native.expect("a native read").map_err(|e| format!("{at}: {e}"))?, record.map_err(|e| format!("{at}: {e}"))?.expect("a record"));
                if record == native { Ok(NodeAlike::Rendered) } else { Err(format!("{at}:\n native {native:?}\n record {record:?}")) }
            }
        }
    }

    /// Every node of `source` renders alike from its record, untouched and
    /// edited: the nodes alike each way, and those that panic alike.
    fn nodes_alike(&self, source: &str) -> Result<[usize; 3], String> {
        let mut engine = self.engine();
        let options = engine.options().clone();
        let mut counts = [0; 3];
        let untouched = Self::parse(&mut engine, source);
        let nodes = sittir_core::read::descendant_count(&untouched.tree().root_node());
        for index in (0..nodes).map(NodeIndex::new) {
            match self.node_alike(&untouched, index, &options)? {
                NodeAlike::Rendered => counts[0] += 1,
                NodeAlike::Panicking => counts[2] += 1,
                NodeAlike::Unread => {}
            }
            let edited = Self::parse(&mut engine, source);
            edit_in_place(&edited, index);
            match self.node_alike(&edited, index, &options).map_err(|e| format!("edited {e}"))? {
                NodeAlike::Rendered => counts[1] += 1,
                NodeAlike::Panicking => counts[2] += 1,
                NodeAlike::Unread => {}
            }
        }
        Ok(counts)
    }
}

/// What `render` answers, twice: the text, when both answers agree.
fn twice(render: impl Fn() -> Result<String, String>) -> Result<String, String> {
    let first = render()?;
    let second = render()?;
    if first == second { Ok(first) } else { Err(format!("a second render differs:\n{first:?}\n{second:?}")) }
}

fn sources(grammar: &str) -> Vec<String> {
    load_fixtures(grammar)
        .into_iter()
        .filter_map(|fixture| match fixture {
            ParityFixture::RoundTrip(fixture) => Some(fixture.source_in),
            ParityFixture::Render { .. } => None,
        })
        .collect()
}

fn corpus<G: RecordGrammar, N: ReadNode + WriteCell<G::Trivia>>(grammar: &str, renders: &Renders<G, N>) {
    let sources = sources(grammar);
    assert!(!sources.is_empty(), "{grammar} has round-trip fixtures");
    let mut differ = Vec::new();
    let (mut rendered, mut nodes) = (0, [0; 3]);
    for (i, source) in sources.iter().enumerate() {
        match renders.renders_alike(source) {
            Ok(Alike::Rendered) => rendered += 1,
            Ok(Alike::Panicking) => eprintln!("{grammar} source {i}: the native render panics, and the record's alike"),
            Ok(Alike::Unread) => eprintln!("{grammar} source {i}: no root read"),
            Err(e) => differ.push(format!("{grammar} source {i}: {e}")),
        }
        match renders.nodes_alike(source) {
            Ok(counts) => nodes = [nodes[0] + counts[0], nodes[1] + counts[1], nodes[2] + counts[2]],
            Err(e) => differ.push(format!("{grammar} source {i}: {e}")),
        }
    }
    eprintln!("{grammar}: {rendered} of {} sources render alike; nodes alike {} untouched, {} edited, {} panic alike", sources.len(), nodes[0], nodes[1], nodes[2]);
    assert!(differ.is_empty(), "{} of {} sources render apart from their records:\n{}", differ.len(), sources.len(), differ.join("\n"));
}

type RustRenders = Renders<sittir_rust::RustGrammar, sittir_rust::render::AnyNode>;

fn rust() -> RustRenders {
    Renders { grammar: sittir_rust::RustGrammar, options: sittir_rust::render::options::defaults, native: sittir_rust::render::render_node_parts, record: sittir_rust::render::node::render_record }
}

#[test]
fn every_rust_source_renders_alike_from_its_records() {
    corpus("rust", &rust());
}

#[test]
fn every_typescript_source_renders_alike_from_its_records() {
    corpus("typescript", &Renders { grammar: sittir_typescript::TypeScriptGrammar, options: sittir_typescript::render::options::defaults, native: sittir_typescript::render::render_node_parts, record: sittir_typescript::render::node::render_record });
}

#[test]
fn every_python_source_renders_alike_from_its_records() {
    corpus("python", &python());
}

#[test]
fn every_regex_source_renders_alike_from_its_records() {
    corpus("regex", &Renders { grammar: sittir_regex::RegexGrammar, options: sittir_regex::render::options::defaults, native: sittir_regex::render::render_node_parts, record: sittir_regex::render::node::render_record });
}

#[test]
fn every_scm_source_renders_alike_from_its_records() {
    corpus("scm", &Renders { grammar: sittir_scm::ScmGrammar, options: sittir_scm::render::options::defaults, native: sittir_scm::render::render_node_parts, record: sittir_scm::render::node::render_record });
}

/// The node of kind `kind` spanning `text` in `source`, read one level
/// down, renders as `text` natively and from its record, untouched and
/// with a write in its range (`edit_in_place`), through its template.
fn renders_as_its_source<G: RecordGrammar, N: ReadNode + WriteCell<G::Trivia>>(renders: &Renders<G, N>, source: &str, kind: &str, text: &str) {
    let mut engine = renders.engine();
    let options = engine.options().clone();
    for edited in [false, true] {
        let tree = Renders::<G, N>::parse(&mut engine, source);
        let index = node_spanning(&tree, source, kind, text);
        if edited {
            edit_in_place(&tree, index);
        }
        let native = renders.native(&tree, index, &options).expect("a native read").expect("a native render");
        let record = Renders::<G, N>::parsed(&tree, tree.read_record::<N>(index, Depth::ONE).expect("a record write").expect("a record"), &options).expect("a record render");
        assert_eq!((native.as_str(), record.as_str()), (text, text), "{source:?}, edited: {edited}");
    }
}

/// The index of the node of kind `kind` spanning `text` in `tree`'s source.
fn node_spanning<G: EngineGrammar>(tree: &ParsedTree<G>, source: &str, kind: &str, text: &str) -> NodeIndex {
    (0..sittir_core::read::descendant_count(&tree.tree().root_node()))
        .map(NodeIndex::new)
        .find(|&index| sittir_core::engine::node_at_index(tree.tree(), index).is_some_and(|node| node.kind() == kind && &source[sittir_core::types::Span::of(&node).range()] == text))
        .unwrap_or_else(|| panic!("{source:?} has a {kind} node spanning {text:?}"))
}

#[test]
fn where_a_parsed_record_renders_never_depends_on_what_was_read() {
    let renders = python();
    let source = "def h():\n    t = (f(x), b,\n         g(y))\n";
    let tuple_text = "(f(x), b,\n         g(y))";
    let mut engine = renders.engine();
    let options = engine.options().clone();
    for edited in [false, true] {
        let render = |tree: &ParsedTree<sittir_python::PythonGrammar>| {
            let tuple = node_spanning(tree, source, "tuple", tuple_text);
            let at = tree.read_record::<sittir_python::render::AnyNode>(tuple, Depth::ONE).expect("a record write").expect("a record");
            Renders::<sittir_python::PythonGrammar, sittir_python::render::AnyNode>::parsed(tree, at, &options).expect("a record render")
        };
        let tree = Renders::<sittir_python::PythonGrammar, sittir_python::render::AnyNode>::parse(&mut engine, source);
        let tuple = node_spanning(&tree, source, "tuple", tuple_text);
        if edited {
            edit_in_place(&tree, tuple);
        }
        let first = render(&tree);
        tree.read_record::<sittir_python::render::AnyNode>(node_spanning(&tree, source, "call", "g(y)"), Depth::ONE).expect("a record write").expect("a record");
        let after_child = render(&tree);
        tree.read_record::<sittir_python::render::AnyNode>(NodeIndex::ROOT, Depth::All).expect("a record write").expect("a record");
        let after_all = render(&tree);
        let whole = Renders::<sittir_python::PythonGrammar, sittir_python::render::AnyNode>::parse(&mut engine, source);
        whole.read_record::<sittir_python::render::AnyNode>(NodeIndex::ROOT, Depth::All).expect("a record write").expect("a record");
        if edited {
            edit_in_place(&whole, node_spanning(&whole, source, "tuple", tuple_text));
        }
        let from_whole = render(&whole);
        let native = renders.native(&tree, tuple, &options).expect("a native read").expect("a native render");
        assert_eq!(first, native, "edited: {edited}");
        if !edited {
            assert_eq!(first, "(f(x), b,\n     g(y))", "an untouched node renders as its source, a copied line shifted by the writer's column less the node's");
        }
        assert_eq!((after_child.as_str(), after_all.as_str(), from_whole.as_str()), (first.as_str(), first.as_str(), first.as_str()), "edited: {edited}");
    }
}

fn python() -> Renders<sittir_python::PythonGrammar, sittir_python::render::AnyNode> {
    Renders { grammar: sittir_python::PythonGrammar, options: sittir_python::render::options::defaults, native: sittir_python::render::render_node_parts, record: sittir_python::render::node::render_record }
}

#[test]
fn a_list_child_renders_with_the_extras_and_errors_its_edge_items_hold() {
    for source in ["(e, f=g)", "(a:str=\"x\", b=c)"] {
        renders_as_its_source(&python(), source, "tuple", source);
    }
    renders_as_its_source(&rust(), "error(\"was {:?}\", first_char(.0))", "arguments", "(.0)");
}

#[test]
fn a_node_framed_by_errors_on_both_sides_leaves_no_seam_past_its_holder() {
    renders_as_its_source(&python(), "(x, =b=)", "tuple", "(x, =b=)");
}

#[test]
fn an_envelope_whose_content_is_a_unit_writes_its_record() {
    let regex = Renders { grammar: sittir_regex::RegexGrammar, options: sittir_regex::render::options::defaults, native: sittir_regex::render::render_node_parts, record: sittir_regex::render::node::render_record };
    renders_as_its_source(&regex, "h*?", "lazy", "?");
}

use sittir_rust::render::kind_ids as rust_kinds;

/// The descendant index of the `nth` node of grammar kind `kind`.
fn index_of<G: EngineGrammar>(tree: &ParsedTree<G>, kind: sittir_core::types::KindId, nth: usize) -> NodeIndex {
    (0..sittir_core::read::descendant_count(&tree.tree().root_node()))
        .map(NodeIndex::new)
        .filter(|&index| sittir_core::engine::node_at_index(tree.tree(), index).is_some_and(|node| sittir_core::read::grammar_id(&node) == kind))
        .nth(nth)
        .unwrap_or_else(|| panic!("no node {nth} of kind {kind:?}"))
}

fn line_comment(text: &str) -> Vec<sittir_core::trivia::TriviaEntry<sittir_rust::render::node::TriviaNode>> {
    use sittir_rust::render::node::TriviaNode;
    let comment = sittir_core::trivia::TriviaText { kind: rust_kinds::LINE_COMMENT, text: text.to_owned(), span: None, before: None, after: None };
    [TriviaNode::Text(comment), TriviaNode::Newline].into_iter().map(|entry| sittir_core::trivia::TriviaEntry::new(SlotValue::Node(entry))).collect()
}

const EDITED: &str = "fn f() {\n    g(/* inside */);\n    h();\n}\n";

#[test]
fn an_edited_parent_renders_from_its_record_and_an_untouched_child_holding_a_comment_as_its_source() {
    let renders = rust();
    let mut engine = renders.engine();
    let options = engine.options().clone();
    for depth in [Depth::ONE, Depth::All] {
        let tree = RustRenders::parse(&mut engine, EDITED);
        let statement = index_of(&tree, rust_kinds::EXPRESSION_STATEMENT, 1);
        tree.write_trivia_side(statement, sittir_core::trivia_table::TriviaSide::Leading, line_comment("// written"));
        let native = renders.native(&tree, NodeIndex::ROOT, &options).expect("a root").expect("a native render");
        let record = RustRenders::parsed(&tree, RustRenders::first_read(&tree, depth).expect("a record"), &options).expect("a record render");
        assert_eq!(record, native, "read {depth:?}");
        assert!(record.contains("g(/* inside */)") && record.contains("// written"), "{record:?}");
    }
}

#[test]
fn an_untouched_parsed_record_a_built_record_links_renders_as_its_source() {
    let renders = rust();
    let mut engine = renders.engine();
    let options = engine.options().clone();
    let tree = RustRenders::parse(&mut engine, EDITED);
    let mut root: sittir_rust::render::AnyNode = read_at(&mut tree.tree().walk(), &mut tree.seating_ctx(), NodeIndex::ROOT, Depth::ONE).expect("a root");
    let sittir_rust::render::AnyNode::SourceFile(file) = &mut root else { panic!("the root is a file") };
    let layout = file.layout.as_mut().expect("a read node names itself");
    layout.sides = layout.at.take();
    let native = (renders.native)(SlotValue::Node(root.clone()), &RenderContext { options: &options, sources: &tree }, None).expect("a native render").1;
    let (built, root, linked) = built_record(&tree, &root);
    assert!(linked > 0, "the built root links its parsed children");
    let record = renders.record(&tree, &built, root, &options).expect("a record render");
    assert_eq!(record, native);
}

/// `node` written as a built record into a fresh arena, each untouched
/// parsed child it holds linked to its record in `tree`'s arena, and how many
/// it linked.
fn built_record<G: EngineGrammar, N: ReadNode + WriteCell<G::Trivia>>(tree: &ParsedTree<G>, node: &N) -> (Arena, CellAt, usize) {
    let mut built = Arena::new();
    let mut linked = 0;
    let mut link = |coord: &sittir_core::slot::NodeCoordinate| -> Result<Linked, sittir_core::arena::ArenaError> {
        let child: N = tree.read(coord.index, Depth::ONE).map_err(|_| sittir_core::arena::ArenaError::Unwritable("an unread child"))?;
        match child.write_cell(&mut RecordSink::parsed(tree.tree_id(), &mut tree.tree_arena()))? {
            Cell::Child { at, .. } => {
                linked += 1;
                Ok(Linked::Record(at))
            }
            _ => Ok(Linked::Leaf(tree.source()[coord.span.range()].to_owned())),
        }
    };
    let cell = node.write_cell(&mut RecordSink::built(&mut built, tree.written(), &mut link)).expect("a built record");
    (built, CellAt { cell, tree: None, site: None }, linked)
}

const REBUILT: &str = "fn f() {\n    x = f(a) + g(b);\n    let c = |p: A ,q: B| p;\n}\n";

/// A built node rebuilt from a parsed one renders from its record as it does
/// natively: the sides written on it and on its unit child from the store,
/// each side it holds none of from the node it was rebuilt from, and its list
/// slot's layout from its side record or, when it stores none, from that
/// node.
#[test]
fn a_built_node_s_written_sides_units_and_slots_render_from_its_record_as_natively() {
    use sittir_core::layout::{NodeLayout, UnitSides};
    use sittir_rust::render::AnyNode;
    type Edit = fn(&mut NodeLayout<sittir_rust::render::node::TriviaNode>, &ParsedTree<sittir_rust::RustGrammar>);
    let written = |layout: &mut NodeLayout<_>| layout.trivia = Some(sittir_core::trivia::NodeTrivia { leading: Some(line_comment("// node")), ..Default::default() });
    let cases: [(sittir_core::types::KindId, Edit, &str); 3] = [
        (rust_kinds::BINARY_EXPRESSION, |layout, _| layout.units.push(UnitSides { slot: "_operator".into(), item: sittir_core::types::ItemIndex(0), trivia: sittir_core::trivia::NodeTrivia { leading: Some(line_comment("// unit")), ..Default::default() } }), "// unit"),
        (rust_kinds::CLOSURE_PARAMETERS, |layout, _| assert!(layout.slots.is_empty(), "a read stores no slot layout: prepare takes its tree's"), "|p: A ,q: B|"),
        (
            rust_kinds::CLOSURE_PARAMETERS,
            |layout, tree| {
                let source = sittir_core::render::SourceTable::slot_layouts(tree, layout.sides.as_ref().expect("rebuilt from its read"));
                assert!(!source.is_empty(), "the source spaces the list apart from the options");
                layout.slots = source.into_iter().map(|slot| sittir_core::layout::SlotLayout { before: slot.after, after: slot.before, ..slot }).collect();
            },
            "|p: A, q: B|",
        ),
    ];
    let renders = rust();
    let mut engine = renders.engine();
    let options = engine.options().clone();
    for (kind, edit, expected) in cases {
        let tree = RustRenders::parse(&mut engine, REBUILT);
        let mut node: AnyNode = tree.read(index_of(&tree, kind, 0), Depth::ONE).expect("a node");
        let (AnyNode::BinaryExpression(sittir_rust::render::node::BinaryExpressionNode { layout, .. }) | AnyNode::ClosureParameters(sittir_rust::render::node::ClosureParametersNode { layout, .. })) = &mut node else { panic!("a node of {kind:?}") };
        let layout = layout.as_mut().expect("a read node names itself");
        layout.sides = layout.at.take();
        written(layout);
        edit(layout, &tree);
        let native = (renders.native)(SlotValue::Node(node.clone()), &RenderContext { options: &options, sources: &tree }, None).expect("a native render").1;
        let (built, root, _) = built_record(&tree, &node);
        let record = renders.record(&tree, &built, root, &options).expect("a record render");
        assert_eq!(record, native, "{kind:?}");
        assert!(record.contains("// node") && record.contains(expected), "{kind:?}: {record:?}");
    }
}


type TypeScriptRenders = Renders<sittir_typescript::TypeScriptGrammar, sittir_typescript::render::AnyNode>;

fn typescript() -> TypeScriptRenders {
    Renders { grammar: sittir_typescript::TypeScriptGrammar, options: sittir_typescript::render::options::defaults, native: sittir_typescript::render::render_node_parts, record: sittir_typescript::render::node::render_record }
}

const ENVELOPED: &str = "interface I {\n  a: string;\n  b: number;\n}\n";

#[test]
fn an_envelope_and_its_content_a_write_lies_in_prepare_apart_and_render_from_their_records() {
    use sittir_typescript::render::kind_ids as ts;
    use sittir_typescript::render::node::TriviaNode;
    let renders = typescript();
    let mut engine = renders.engine();
    let options = engine.options().clone();
    for depth in [Depth::ONE, Depth::All] {
        let tree = TypeScriptRenders::parse(&mut engine, ENVELOPED);
        let property = index_of(&tree, ts::PROPERTY_SIGNATURE, 1);
        let comment = sittir_core::trivia::TriviaText { kind: ts::COMMENT_LINE, text: "// written".to_owned(), span: None, before: None, after: None };
        let entries = [TriviaNode::Text(comment), TriviaNode::Newline].into_iter().map(|entry| sittir_core::trivia::TriviaEntry::new(SlotValue::Node(entry))).collect();
        tree.write_trivia_side(property, sittir_core::trivia_table::TriviaSide::Leading, entries);
        let native = renders.native(&tree, NodeIndex::ROOT, &options).expect("a root").expect("a native render");
        let record = TypeScriptRenders::parsed(&tree, TypeScriptRenders::first_read(&tree, depth).expect("a record"), &options).expect("a record render");
        assert_eq!(record, native, "read {depth:?}");
        assert!(record.contains("// written"), "{record:?}");
        assert_apart(&tree, &options);
    }
}

/// The row of `tree`'s `_interface_body`, the envelope's record there and
/// the record of the object type it holds, which shares its row.
fn envelope_and_content(tree: &ParsedTree<sittir_typescript::TypeScriptGrammar>) -> (NodeIndex, Address, Address) {
    use sittir_typescript::render::kind_ids as ts;
    let row = (0..sittir_core::read::descendant_count(&tree.tree().root_node()))
        .map(NodeIndex::new)
        .find(|&index| sittir_core::engine::node_at_index(tree.tree(), index).is_some_and(|node| sittir_core::read::display_id(&node) == ts::_INTERFACE_BODY))
        .expect("an interface body");
    let arena = tree.tree_arena();
    let envelope = arena.record(row).expect("the envelope's record");
    let words = arena.arena().words(envelope, 7).expect("its words");
    let Ok(Cell::Child { at, .. }) = Cell::decode(&words[2..7]) else { panic!("its content is a record") };
    (row, envelope, at)
}

#[test]
fn an_untouched_envelope_s_content_renders_as_the_row_it_shares_with_its_envelope() {
    let renders = typescript();
    let mut engine = renders.engine();
    let options = engine.options().clone();
    let tree = TypeScriptRenders::parse(&mut engine, ENVELOPED);
    TypeScriptRenders::first_read(&tree, Depth::All).expect("every record written");
    let (_, envelope, content) = envelope_and_content(&tree);
    let shared = TypeScriptRenders::parsed(&tree, envelope, &options).expect("the envelope's render");
    assert!(shared.contains("a: string;"), "{shared:?}");
    assert_eq!(TypeScriptRenders::parsed(&tree, content, &options), Ok(shared));
}

/// The envelope `_interface_body` of `tree` and the object type it holds,
/// which share one row, each prepare at a place of its own with its own
/// kind's edges.
fn assert_apart(tree: &ParsedTree<sittir_typescript::TypeScriptGrammar>, options: &ResolvedOptions) {
    use sittir_core::arena::{PrepPlace, Prepared};
    use sittir_core::trivia_store::{Place, Site};
    use sittir_typescript::render::kind_ids as ts;
    let (row, envelope, content) = envelope_and_content(tree);
    let ctx = RenderContext { options, sources: tree };
    let root = CellAt { cell: Cell::Child { kind: ts::PROGRAM, at: tree.tree_arena().record(NodeIndex::ROOT).expect("the root's record"), link: None, changed: sittir_core::slot::ChangedEdges::default() }, tree: Some(tree.tree_id()), site: None };
    let prepared: Prepared<_> = {
        let mut arenas = HeldArenas::of([(tree.tree_id(), tree.tree_arena())]);
        sittir_core::arena::prepare_root::<_, sittir_typescript::render::AnyNode>(&mut arenas, &Arena::new(), tree.written(), root, &ctx).expect("prepared")
    };
    let own = |kind| {
        let mut edges = sittir_core::options::Edges::default();
        sittir_core::prepare::prepare_edges(&mut edges, kind, (None, None), &ctx);
        edges
    };
    let edges = |place| prepared.node(place).map(|node| node.edges);
    let envelope_place = Place::Row { tree: tree.tree_id(), row };
    let content_place = PrepPlace::Content(Site { holder: envelope_place, word: 2, item: sittir_core::types::ItemIndex(0) });
    assert_ne!(envelope, content);
    assert_ne!(own(ts::_INTERFACE_BODY), own(ts::OBJECT_TYPE), "the two kinds' edges differ, so a shared place would lose one");
    assert_eq!(edges(envelope_place.into()), Some(own(ts::_INTERFACE_BODY)));
    assert_eq!(edges(content_place), Some(own(ts::OBJECT_TYPE)));
    assert_eq!(edges(Place::Record(content).into()), None, "the content's record address keys no built record");
}

#[test]
fn a_node_s_record_is_written_on_its_first_read_and_answered_by_every_later_one() {
    let mut engine = rust().engine();
    let tree = RustRenders::parse(&mut engine, EDITED);
    let root = RustRenders::first_read(&tree, Depth::ONE).expect("the root's record");
    assert_eq!(RustRenders::first_read(&tree, Depth::All), Ok(root), "a later read, to any depth, answers the record the first wrote");
    let statement = index_of(&tree, rust_kinds::EXPRESSION_STATEMENT, 0);
    let child = tree.read_record::<sittir_rust::render::AnyNode>(statement, Depth::ONE).expect("a read").expect("a record");
    assert_ne!(child, root);
    assert_eq!(tree.tree_arena().record(statement), Some(child), "the row index holds it");
    let leaf = index_of(&tree, rust_kinds::IDENTIFIER, 0);
    assert_eq!(tree.read_record::<sittir_rust::render::AnyNode>(leaf, Depth::ONE), Ok(None), "a parsed leaf has no record: its holder's cell holds it whole");
}

#[test]
fn native_hydration_deepens_a_cached_record_without_rewriting_it() {
    let mut engine = rust().engine();
    let tree = RustRenders::parse(&mut engine, EDITED);
    let root = RustRenders::first_read(&tree, Depth::ONE).expect("a shallow root");
    let statement = index_of(&tree, rust_kinds::EXPRESSION_STATEMENT, 0);
    assert_eq!(
        tree.tree_arena().record(statement),
        None,
        "the shallow read leaves the statement unmaterialized"
    );
    let before: Vec<_> = (0..).map_while(|n| tree.record_chunk(n)).collect();
    assert_eq!(
        tree.hydrate_record::<sittir_rust::render::AnyNode>(NodeIndex::ROOT, Depth::All),
        Ok(Some(root))
    );
    assert!(
        tree.tree_arena().record(statement).is_some(),
        "hydration must reach children of a cached root"
    );
    for (n, words) in before.iter().enumerate() {
        let chunk = u32::try_from(n).expect("the chunk index fits");
        assert_eq!(
            &tree.record_chunk(chunk).expect("the chunk remains")[..words.len()],
            words,
            "published words stay immutable"
        );
    }
    let hydrated: Vec<_> = (0..).map_while(|n| tree.record_chunk(n)).collect();
    assert_eq!(
        tree.hydrate_record::<sittir_rust::render::AnyNode>(NodeIndex::ROOT, Depth::All),
        Ok(Some(root))
    );
    assert_eq!(
        (0..)
            .map_while(|n| tree.record_chunk(n))
            .collect::<Vec<_>>(),
        hydrated,
        "a repeated hydration appends no records or list runs"
    );
}

#[test]
fn native_hydration_uses_the_readers_depth_boundary() {
    let mut engine = rust().engine();
    let mut previous = 0;
    for depth in [
        Depth::ONE,
        Depth::Levels(std::num::NonZeroU32::new(2).unwrap()),
        Depth::Levels(std::num::NonZeroU32::new(3).unwrap()),
        Depth::All,
    ] {
        let expected = RustRenders::parse(&mut engine, EDITED);
        expected
            .read_record::<sittir_rust::render::AnyNode>(NodeIndex::ROOT, depth)
            .expect("a native read");
        let tree = RustRenders::parse(&mut engine, EDITED);
        RustRenders::first_read(&tree, Depth::ONE).expect("a shallow root");
        tree.hydrate_record::<sittir_rust::render::AnyNode>(NodeIndex::ROOT, depth)
            .expect("hydration");
        let rows = |tree: &ParsedTree<sittir_rust::RustGrammar>| {
            (0..sittir_core::read::descendant_count(&tree.tree().root_node()))
                .map(NodeIndex::new)
                .filter(|&index| tree.tree_arena().record(index).is_some())
                .collect::<Vec<_>>()
        };
        let got = rows(&tree);
        assert_eq!(
            got,
            rows(&expected),
            "hydration and the generated reader agree at {depth:?}"
        );
        assert!(got.len() >= previous);
        previous = got.len();
    }
    assert!(previous > 1, "the probe exercises deeper materialization");
}

#[test]
fn native_hydration_keeps_envelope_content_unindexed_and_writes_it_once() {
    let source = "def h():\n    t = (f(x), b, g(y))\n";
    let mut engine = python().engine();
    let tree = Renders::<sittir_python::PythonGrammar, sittir_python::render::AnyNode>::parse(
        &mut engine,
        source,
    );
    let root = tree
        .read_record::<sittir_python::render::AnyNode>(NodeIndex::ROOT, Depth::ONE)
        .expect("a shallow read");
    tree.hydrate_record::<sittir_python::render::AnyNode>(NodeIndex::ROOT, Depth::All)
        .expect("all records hydrated");
    let words: Vec<_> = (0..).map_while(|n| tree.record_chunk(n)).collect();
    assert_eq!(
        tree.hydrate_record::<sittir_python::render::AnyNode>(NodeIndex::ROOT, Depth::All),
        Ok(root)
    );
    assert_eq!(
        (0..)
            .map_while(|n| tree.record_chunk(n))
            .collect::<Vec<_>>(),
        words
    );
    assert_eq!(
        tree.render_record(
            root.expect("a record"),
            ChangedEdges::default(),
            engine.options()
        )
        .expect("render"),
        source
    );
}

#[test]
fn an_error_node_has_no_record() {
    let mut engine = rust().engine();
    let tree = RustRenders::parse(&mut engine, "fn f( {\n");
    let error = (0..sittir_core::read::descendant_count(&tree.tree().root_node()))
        .map(NodeIndex::new)
        .find(|&index| sittir_core::engine::node_at_index(tree.tree(), index).is_some_and(|node| node.is_error()))
        .expect("an ERROR node");
    assert!(tree.read_error(error).is_some());
    assert_eq!(tree.read_record::<sittir_rust::render::AnyNode>(error, Depth::ONE), Ok(None));
}

#[test]
fn an_address_that_names_no_record_of_the_arena_is_refused() {
    use sittir_core::arena::ArenaError;
    let mut engine = rust().engine();
    let options = engine.options().clone();
    let tree = RustRenders::parse(&mut engine, &EDITED.repeat(40));
    RustRenders::first_read(&tree, Depth::All).expect("every record written");
    assert!(matches!(tree.render_record(Address::NONE, ChangedEdges::default(), &options), Err(RenderError::Record(ArenaError::Malformed { what: "record address", .. }))));
    let past = Address::new(sittir_core::arena::MAX_CHUNKS - 1, 0).expect("an address");
    assert!(matches!(tree.render_record(past, ChangedEdges::default(), &options), Err(RenderError::Record(ArenaError::OutOfBounds { .. }))));
    let chunk = tree.record_chunk(1).expect("a source this long fills a second chunk");
    let word = chunk.iter().take(chunk.len() - 1).position(|&word| word > u32::from(u16::MAX)).expect("a word past every kind id");
    let at = Address::new(1, u32::try_from(word).expect("a chunk's word")).expect("an address");
    assert!(matches!(tree.render_record(at, ChangedEdges::default(), &options), Err(RenderError::Record(ArenaError::Malformed { what: "record kind", .. }))), "a header naming no kind is never read as a record");
}

#[test]
fn an_address_inside_a_side_record_is_refused_before_source_folding() {
    let mut engine = rust().engine();
    let options = engine.options().clone();
    let tree = RustRenders::parse(&mut engine, "fn a() {}");
    RustRenders::first_read(&tree, Depth::All).expect("every record written");
    let row = index_of(&tree, rust_kinds::PARAMETERS, 0);
    let at = {
        let arena = tree.tree_arena();
        let record = arena.record(row).expect("the parameters record");
        let header = arena.arena().words(record, 2).expect("its header");
        Address(header[1])
            .offset(1)
            .expect("the first payload word of its side record")
    };
    assert!(
        matches!(
            tree.render_record(at, ChangedEdges::default(), &options),
            Err(RenderError::Record(_))
        ),
        "a side record's row is never a node record header"
    );
}

#[test]
fn payload_words_never_render_as_node_records() {
    use std::collections::HashSet;
    for source in ["fn a() {}".to_owned(), "fn a() {}\n".repeat(40)] {
        let mut engine = rust().engine();
        let options = engine.options().clone();
        let tree = RustRenders::parse(&mut engine, &source);
        RustRenders::first_read(&tree, Depth::All).expect("every record written");
        let records: HashSet<_> = {
            let arena = tree.tree_arena();
            (0..sittir_core::read::descendant_count(&tree.tree().root_node()))
                .filter_map(|row| arena.record(NodeIndex::new(row)))
                .collect()
        };
        for chunk_index in 0.. {
            let Some(chunk) = tree.record_chunk(chunk_index) else {
                break;
            };
            for word in 0..u32::try_from(chunk.len()).expect("a chunk's length") {
                let at = Address::new(chunk_index, word).expect("a chunk's address");
                if records.contains(&at) {
                    continue;
                }
                assert!(
                    tree.render_record(at, ChangedEdges::default(), &options)
                        .is_err(),
                    "word {at:?} is not a node record"
                );
            }
        }
    }
}

#[test]
fn a_chunk_is_copied_out_as_its_records_fill_it() {
    let mut engine = rust().engine();
    let tree = RustRenders::parse(&mut engine, EDITED);
    let root = RustRenders::first_read(&tree, Depth::ONE).expect("the root's record");
    let before = tree.record_chunk(root.chunk()).expect("the root's chunk");
    assert_eq!(&before[root.word() as usize..][..2], tree.tree_arena().arena().words(root, 2).expect("its header"));
    let statement = index_of(&tree, rust_kinds::EXPRESSION_STATEMENT, 1);
    tree.read_record::<sittir_rust::render::AnyNode>(statement, Depth::All).expect("a read").expect("a record");
    let after = tree.record_chunk(root.chunk()).expect("the root's chunk");
    assert!(after.len() > before.len() && after.starts_with(&before), "a later read appends; the words before it stay");
    assert_eq!(tree.record_chunk(sittir_core::arena::MAX_CHUNKS), None);
}


#[test]
fn a_record_rendered_as_a_render_root_drops_the_seams_its_holder_gave_it() {
    let mut engine = rust().engine();
    let options = engine.options().clone();
    let tree = RustRenders::parse(&mut engine, "fn a() {}\n\nfn b() { Ok(None) }\n");
    RustRenders::first_read(&tree, Depth::All).expect("every record written");
    let both = ChangedEdges { leading: true, trailing: true };
    let record = |kind, nth| tree.tree_arena().record(index_of(&tree, kind, nth)).expect("its record");
    let call = record(rust_kinds::CALL_EXPRESSION, 0);
    assert_eq!(tree.render_record(call, both, &options).expect("a render"), "Ok(None)", "a node crossing as its coordinate renders so");
    assert_eq!(tree.render_record(call, ChangedEdges::default(), &options).expect("a render"), " Ok(None) ", "in its holder, it keeps the block's padding");
    assert_eq!(tree.render_record(record(rust_kinds::FUNCTION_ITEM, 1), both, &options).expect("a render"), "fn b() { Ok(None) }");
}
