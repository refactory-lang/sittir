//! A read's record renders as the native node read from the tree. For
//! every round-trip source of each grammar, the root read one level down
//! and rendered natively renders the same from the record a read of the
//! source left it, twice over, and so does every node that has a record:
//! untouched, and with its own inner side written back, a test-only write
//! that changes no text. A record renders as a render root whose changed
//! edges have no neighbour, and an address that names no record is refused.
#![cfg(feature = "arena")]

use sittir_core::arena::{Address, HydrateNode, RecordCells, RecordGrammar, WriteCell};
use sittir_core::engine::{claim_tree_id, Engine, EngineGrammar, ParsedTree};
use sittir_core::options::ResolvedOptions;
use sittir_core::prepare::RenderContext;
use sittir_core::read::{read_at, Depth, ReadNode};
use sittir_core::render::RenderError;
use sittir_core::slot::ChangedEdges;
use sittir_core::types::NodeIndex;
use sittir_core::SlotValue;
use sittir_parity_tests::{edit_in_place, load_fixtures, OverRead, ParityFixture};

/// How a source's records render alike.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Alike {
    /// The read's record renders the native root's text.
    Rendered,
    /// The native render panics, and the record's does too.
    Panicking,
    /// The model reads no root of the source.
    Unread,
}

/// A grammar's native render of a root (`render_node_parts`).
type NativeRender<N> = fn(SlotValue<N>, &RenderContext<'_>, Option<&mut sittir_core::baseline::Baseline>) -> Result<(sittir_core::types::Source, String), RenderError>;

/// One grammar's two renders: a native root's, and a record's.
struct Renders<G: EngineGrammar, N> {
    grammar: G,
    options: fn() -> ResolvedOptions,
    native: NativeRender<N>,
}

impl<G: RecordGrammar, N: ReadNode + WriteCell<G::Trivia> + HydrateNode + RecordCells> Renders<G, N> {
    fn engine(&self) -> Engine<G> {
        Engine::new(self.grammar, (self.options)()).expect("an engine")
    }

    fn parse(engine: &mut Engine<G>, source: &str) -> ParsedTree<G> {
        engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse")
    }

    /// The node at `index` of `tree`, read one level down seating its sides,
    /// rendered natively; `None` when the model reads no node there.
    fn native(&self, tree: &ParsedTree<G>, index: NodeIndex, options: &ResolvedOptions) -> Option<Result<String, String>> {
        let seating = tree.seating();
        let node: N = read_at(&mut seating.cursor(index), &mut seating.ctx(), index, Depth::ONE).ok()?;
        let ctx = RenderContext::new(options, &seating);
        Some((self.native)(SlotValue::Node(node), &ctx, None).map(|(_, text)| text).map_err(|e| format!("native: {e}")))
    }

    /// An engine that read `tree`'s source and kept no tree.
    fn read(&self, tree: &ParsedTree<G>) -> OverRead<G> {
        OverRead::of::<N>(self.grammar, &(self.options)(), tree)
    }

    /// The record at `at` of `over`'s arena rendered twice
    /// (`Engine::render_at`): both renders, which must agree.
    fn record(over: &OverRead<G>, at: Address, options: &ResolvedOptions) -> Result<String, String> {
        twice(|| over.render_at(at, ChangedEdges::default(), options, false).map_err(|e| format!("record: {e}")))
    }

    /// Whether `source` renders alike from the records a read of it leaves:
    /// the same text, or, where the native render panics, a record render
    /// that panics too.
    fn renders_alike(&self, source: &str) -> Result<Alike, String> {
        let mut engine = self.engine();
        let options = engine.options().clone();
        let tree = Self::parse(&mut engine, source);
        let native = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| self.native(&tree, NodeIndex::ROOT, &options)));
        if matches!(native, Ok(None)) {
            return Ok(Alike::Unread);
        }
        let record = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            let over = self.read(&tree);
            Self::record(&over, over.root, &options)
        }));
        let (native, record) = match (native, record) {
            (Err(_), Err(_)) => return Ok(Alike::Panicking),
            (Err(_), Ok(_)) => return Err("the native render panics and the record's does not".to_owned()),
            (Ok(_), Err(_)) => return Err("the record render panics and the native one does not".to_owned()),
            (Ok(native), Ok(record)) => (native.expect("a native read")?, record?),
        };
        if record == native { Ok(Alike::Rendered) } else { Err(format!("\n native {native:?}\n record {record:?}")) }
    }
}

/// How one node renders alike from its record.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum NodeAlike {
    /// The model reads no node there, or the read leaves it no record.
    Unread,
    Rendered,
    /// The native render panics, and the record's does too.
    Panicking,
}

impl<G: RecordGrammar, N: ReadNode + WriteCell<G::Trivia> + HydrateNode + RecordCells> Renders<G, N> {
    /// Whether the node at `index` of `tree`, read one level down, renders
    /// from the record `over`'s read left it as natively, or panics there
    /// as natively.
    fn node_alike(&self, tree: &ParsedTree<G>, over: &OverRead<G>, index: NodeIndex, options: &ResolvedOptions) -> Result<NodeAlike, String> {
        let node = sittir_core::engine::node_at_index(tree.tree(), index).expect("a node at every index");
        let at = format!("node {index} ({} {:?})", node.kind(), &tree.source()[sittir_core::types::Span::of(&node).range()]);
        let Some(&written) = over.records.get(&index) else { return Ok(NodeAlike::Unread) };
        let native = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| self.native(tree, index, options)));
        if matches!(native, Ok(None)) {
            return Ok(NodeAlike::Unread);
        }
        let record = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| Self::record(over, written, options)));
        match (native, record) {
            (Err(_), Err(_)) => Ok(NodeAlike::Panicking),
            (Err(_), Ok(_)) => Err(format!("{at}: the native render panics and the record's does not")),
            (Ok(_), Err(_)) => Err(format!("{at}: the record render panics and the native one does not")),
            (Ok(native), Ok(record)) => {
                let (native, record) = (native.expect("a native read").map_err(|e| format!("{at}: {e}"))?, record.map_err(|e| format!("{at}: {e}"))?);
                if record == native { Ok(NodeAlike::Rendered) } else { Err(format!("{at}:\n native {native:?}\n record {record:?}")) }
            }
        }
    }

    /// Every node of `source` renders alike from its record, untouched and
    /// edited: the nodes alike each way, and those that panic alike. An
    /// extra takes no sides of its own, so none is edited.
    fn nodes_alike(&self, source: &str) -> Result<[usize; 3], String> {
        let mut engine = self.engine();
        let options = engine.options().clone();
        let mut counts = [0; 3];
        let untouched = Self::parse(&mut engine, source);
        if std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| self.native(&untouched, NodeIndex::ROOT, &options))).is_ok_and(|read| read.is_none()) {
            return Ok(counts);
        }
        let Ok(over) = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| self.read(&untouched))) else { return Ok(counts) };
        let nodes = sittir_core::read::descendant_count(&untouched.tree().root_node());
        for index in (0..nodes).map(NodeIndex::new) {
            match self.node_alike(&untouched, &over, index, &options)? {
                NodeAlike::Rendered => counts[0] += 1,
                NodeAlike::Panicking => counts[2] += 1,
                NodeAlike::Unread => continue,
            }
            if sittir_core::engine::node_at_index(untouched.tree(), index).is_some_and(|node| node.is_extra()) {
                continue;
            }
            let mut edited = Self::parse(&mut engine, source);
            edit_in_place(&mut edited, index);
            let over = self.read(&edited);
            over.edit_in_place(index);
            match self.node_alike(&edited, &over, index, &options).map_err(|e| format!("edited {e}"))? {
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

fn corpus<G: RecordGrammar, N: ReadNode + WriteCell<G::Trivia> + HydrateNode + RecordCells>(grammar: &str, renders: &Renders<G, N>) {
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
    Renders { grammar: sittir_rust::RustGrammar, options: sittir_rust::render::options::defaults, native: sittir_rust::render::render_node_parts }
}

#[test]
fn every_rust_source_renders_alike_from_its_records() {
    corpus("rust", &rust());
}

#[test]
fn every_typescript_source_renders_alike_from_its_records() {
    corpus("typescript", &Renders { grammar: sittir_typescript::TypeScriptGrammar, options: sittir_typescript::render::options::defaults, native: sittir_typescript::render::render_node_parts });
}

#[test]
fn every_python_source_renders_alike_from_its_records() {
    corpus("python", &python());
}

#[test]
fn every_regex_source_renders_alike_from_its_records() {
    corpus("regex", &Renders { grammar: sittir_regex::RegexGrammar, options: sittir_regex::render::options::defaults, native: sittir_regex::render::render_node_parts });
}

#[test]
fn every_scm_source_renders_alike_from_its_records() {
    corpus("scm", &Renders { grammar: sittir_scm::ScmGrammar, options: sittir_scm::render::options::defaults, native: sittir_scm::render::render_node_parts });
}

/// The node of kind `kind` spanning `text` in `source`, read one level
/// down, renders as `text` natively and from the record a read left it,
/// untouched and with a write in its range (`edit_in_place`), through its
/// template.
fn renders_as_its_source<G: RecordGrammar, N: ReadNode + WriteCell<G::Trivia> + HydrateNode + RecordCells>(renders: &Renders<G, N>, source: &str, kind: &str, text: &str) {
    let mut engine = renders.engine();
    let options = engine.options().clone();
    for edited in [false, true] {
        let mut tree = Renders::<G, N>::parse(&mut engine, source);
        let index = node_spanning(&tree, source, kind, text);
        let over = renders.read(&tree);
        if edited {
            edit_in_place(&mut tree, index);
            over.edit_in_place(index);
        }
        let native = renders.native(&tree, index, &options).expect("a native read").expect("a native render");
        let record = Renders::<G, N>::record(&over, *over.records.get(&index).expect("a record"), &options).expect("a record render");
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

fn python() -> Renders<sittir_python::PythonGrammar, sittir_python::render::AnyNode> {
    Renders { grammar: sittir_python::PythonGrammar, options: sittir_python::render::options::defaults, native: sittir_python::render::render_node_parts }
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
    let comment = sittir_core::trivia::TriviaText { kind: rust_kinds::LINE_COMMENT, text: text.to_owned(), span: None, before: None, after: None, bytes: None };
    [TriviaNode::Text(comment), TriviaNode::Newline].into_iter().map(|entry| sittir_core::trivia::TriviaEntry::new(SlotValue::Node(entry))).collect()
}

const EDITED: &str = "fn f() {\n    g(/* inside */);\n    h();\n}\n";

#[test]
fn an_edited_parent_renders_from_its_record_and_an_untouched_child_holding_a_comment_as_its_source() {
    let renders = rust();
    let mut engine = renders.engine();
    let options = engine.options().clone();
    let mut tree = RustRenders::parse(&mut engine, EDITED);
    let statement = index_of(&tree, rust_kinds::EXPRESSION_STATEMENT, 1);
    let over = renders.read(&tree);
    let leading = sittir_core::trivia_table::TriviaSide::Leading;
    tree.write_trivia_side(statement, leading, line_comment("// written")).expect("a side write");
    over.engine.write_read_side(over.name(statement).expect("a statement has a record"), leading, line_comment("// written")).expect("a side write");
    let native = renders.native(&tree, NodeIndex::ROOT, &options).expect("a root").expect("a native render");
    let record = RustRenders::record(&over, over.root, &options).expect("a record render");
    assert_eq!(record, native);
    assert!(record.contains("g(/* inside */)") && record.contains("// written"), "{record:?}");
}

#[test]
fn an_error_node_has_a_record_and_renders_as_its_source() {
    let renders = rust();
    let mut engine = renders.engine();
    let tree = RustRenders::parse(&mut engine, "fn f( {\n");
    let error = (0..sittir_core::read::descendant_count(&tree.tree().root_node()))
        .map(NodeIndex::new)
        .find(|&index| sittir_core::engine::node_at_index(tree.tree(), index).is_some_and(|node| node.is_error()))
        .expect("an ERROR node");
    assert!(tree.read_error(error).is_some());
    let over = renders.read(&tree);
    assert!(over.name(error).is_some(), "the read leaves the ERROR a record, which holds every node under it");
    assert_eq!(over.render_at(over.root, ChangedEdges::default(), engine.options(), false).expect("a record render"), "fn f( {\n");
}

/// The words of each chunk a read wrote in `over`'s arena, by its number.
fn read_chunks<G: RecordGrammar>(over: &OverRead<G>) -> Vec<(u32, Vec<u32>)> {
    use sittir_core::arena::ArenaRead;
    let built = over.engine.written().built();
    (1..sittir_core::arena::MAX_CHUNKS).filter(|&n| built.read_chunk(n)).filter_map(|n| built.chunk(n).map(|words| (n, words.to_vec()))).collect()
}

#[test]
fn an_address_that_names_no_record_of_the_arena_is_refused() {
    let renders = rust();
    let mut engine = renders.engine();
    let options = engine.options().clone();
    let tree = RustRenders::parse(&mut engine, &EDITED.repeat(400));
    let over = renders.read(&tree);
    let render = |at| over.render_at(at, ChangedEdges::default(), &options, false);
    assert!(matches!(render(Address::NONE), Err(RenderError::Record(_))), "{:?}", render(Address::NONE));
    let past = Address::new(sittir_core::arena::MAX_CHUNKS - 1, 0).expect("an address");
    assert!(matches!(render(past), Err(RenderError::Record(_))), "{:?}", render(past));
    let (n, word) = read_chunks(&over)
        .into_iter()
        .find_map(|(n, chunk)| chunk.iter().take(chunk.len() - 1).position(|&word| word > u32::from(u16::MAX)).map(|word| (n, word)))
        .expect("a source this long fills chunks whose cells name addresses past every kind id");
    let at = Address::new(n, u32::try_from(word).expect("a chunk's word")).expect("an address");
    assert!(matches!(render(at), Err(RenderError::Record(_))), "a header naming no kind is never read as a record's: {:?}", render(at));
}

#[test]
fn payload_words_never_render_as_node_records() {
    use std::collections::HashSet;
    for source in ["fn a() {}".to_owned(), "fn a() {}\n".repeat(40)] {
        let renders = rust();
        let mut engine = renders.engine();
        let options = engine.options().clone();
        let tree = RustRenders::parse(&mut engine, &source);
        let over = renders.read(&tree);
        let records: HashSet<Address> = over.records.values().copied().collect();
        for (chunk_index, chunk) in read_chunks(&over) {
            for word in 0..u32::try_from(chunk.len()).expect("a chunk's length") {
                let at = Address::new(chunk_index, word).expect("a chunk's address");
                if records.contains(&at) {
                    continue;
                }
                assert!(over.render_at(at, ChangedEdges::default(), &options, false).is_err(), "word {at:?} is not a node record");
            }
        }
    }
}

#[test]
fn a_record_rendered_as_a_render_root_drops_the_seams_its_holder_gave_it() {
    let renders = rust();
    let mut engine = renders.engine();
    let options = engine.options().clone();
    let tree = RustRenders::parse(&mut engine, "fn a() {}\n\nfn b() { Ok(None) }\n");
    let over = renders.read(&tree);
    let both = ChangedEdges { leading: true, trailing: true };
    let record = |kind, nth| *over.records.get(&index_of(&tree, kind, nth)).expect("its record");
    let call = record(rust_kinds::CALL_EXPRESSION, 0);
    assert_eq!(over.render_at(call, both, &options, false).expect("a render"), "Ok(None)", "a node crossing as its coordinate renders so");
    assert_eq!(over.render_at(call, ChangedEdges::default(), &options, false).expect("a render"), " Ok(None) ", "in its holder, it keeps the block's padding");
    assert_eq!(over.render_at(record(rust_kinds::FUNCTION_ITEM, 1), both, &options, false).expect("a render"), "fn b() { Ok(None) }");
}

#[test]
fn a_record_rendered_as_a_render_root_keeps_its_inner_trivia_and_leaves_the_ordinary_render_unchanged() {
    let renders = rust();
    let mut engine = renders.engine();
    let options = engine.options().clone();
    let source = "fn f() {\n  // outside\n  call(/* inside */ arg); // tail\n}\n";
    let tree = RustRenders::parse(&mut engine, source);
    let over = renders.read(&tree);
    let record = *over.records.get(&node_spanning(&tree, source, "expression_statement", "call(/* inside */ arg);")).expect("a statement record");
    let ordinary = over.render_at(record, ChangedEdges::default(), &options, false).expect("the ordinary render");
    let both = ChangedEdges { leading: true, trailing: true };
    assert_eq!(over.render_at(record, both, &options, false).expect("the root render"), "// outside\ncall(/* inside */ arg); // tail\n");
    assert_eq!(over.render_at(record, ChangedEdges::default(), &options, false).expect("the ordinary render after the root render"), ordinary);
}

#[test]
fn a_list_record_rendered_as_a_render_root_keeps_the_trailing_comment_of_its_child() {
    type Python = Renders<sittir_python::PythonGrammar, sittir_python::render::AnyNode>;
    let renders = python();
    let mut engine = renders.engine();
    let options = engine.options().clone();
    let both = ChangedEdges { leading: true, trailing: true };
    for (source, expected) in [
        ("print b # bye\n", "print b # bye\n"),
        ("# outside\nprint b # bye\n", "print b # bye\n"),
        ("... # omitted\n", "... # omitted\n"),
        ("a; b # tail\n", "a; b # tail\n"),
        ("type IntFunc[**P] = Callable[P, int] # ParamSpec\n", "type IntFunc[**P] = Callable[P, int] # ParamSpec\n"),
    ] {
        let tree = Python::parse(&mut engine, source);
        let over = renders.read(&tree);
        let record = *over.records.get(&index_of(&tree, sittir_python::render::kind_ids::SIMPLE_STATEMENTS_ELEMENTS, 0)).expect("a list record");
        for _ in 0..2 {
            assert_eq!(over.render_at(record, both, &options, false).expect("the list render"), expected, "{source:?}");
        }
    }
}

#[test]
fn a_record_rendered_as_a_render_root_keeps_line_breaks_between_unmodified_control_flow_children() {
    type TypeScript = Renders<sittir_typescript::TypeScriptGrammar, sittir_typescript::render::AnyNode>;
    let renders: TypeScript = Renders { grammar: sittir_typescript::TypeScriptGrammar, options: sittir_typescript::render::options::defaults, native: sittir_typescript::render::render_node_parts };
    let mut engine = renders.engine();
    let options = engine.options().clone();
    let source = "try {}\ncatch (e: unknown) {}\nfinally {}";
    let tree = TypeScript::parse(&mut engine, source);
    let over = renders.read(&tree);
    let record = *over.records.get(&node_spanning(&tree, source, "try_statement", source)).expect("a statement record");
    assert_eq!(over.render_at(record, ChangedEdges { leading: true, trailing: true }, &options, false).expect("the root render"), source);
}
