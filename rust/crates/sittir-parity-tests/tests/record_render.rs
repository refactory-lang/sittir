//! A record renders as the native node written into it. For every round-trip
//! source of each grammar, the root read one level down and rendered
//! natively renders the same from the record its first read wrote, from the
//! record a read at every depth wrote, and twice over: a parsed node is its
//! row's source whatever cell names it, as a native read one level down
//! holds each child as its coordinate. A parsed node a write lies in renders
//! from its record, and an untouched one a built record links renders as its
//! source.
#![cfg(feature = "arena")]

use sittir_core::arena::{Arena, Cell, CellAt, HeldArenas, Linked, RecordSink, RecordTrees, WriteCell};
use sittir_core::engine::{claim_tree_id, Engine, EngineGrammar, ParsedTree};
use sittir_core::options::ResolvedOptions;
use sittir_core::prepare::RenderContext;
use sittir_core::read::{read_at, Depth, ReadNode};
use sittir_core::render::RenderError;
use sittir_core::trivia_store::TriviaStore;
use sittir_core::types::NodeIndex;
use sittir_core::SlotValue;
use sittir_parity_tests::{load_fixtures, ParityFixture};

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

impl<G: EngineGrammar, N: ReadNode + WriteCell<G::Trivia>> Renders<G, N> {
    fn engine(&self) -> Engine<G> {
        Engine::new(self.grammar, (self.options)()).expect("an engine")
    }

    fn parse(engine: &mut Engine<G>, source: &str) -> ParsedTree<G> {
        engine.parse(source, claim_tree_id().expect("a tree id")).expect("a parse")
    }

    /// The root of `tree`, read one level down seating its sides, rendered
    /// natively; `None` when the model reads no root there.
    fn native(&self, tree: &ParsedTree<G>, options: &ResolvedOptions) -> Option<Result<String, String>> {
        let root: N = read_at(&mut tree.tree().walk(), &mut tree.seating_ctx(), NodeIndex::ROOT, Depth::ONE).ok()?;
        let ctx = RenderContext { options, sources: tree };
        Some((self.native)(SlotValue::Node(root), &ctx, None).map(|(_, text)| text).map_err(|e| format!("native: {e}")))
    }

    /// The record of `cell`, in `tree`'s arena or the built arena `built`,
    /// rendered twice: both renders, which must agree.
    fn record(&self, tree: &ParsedTree<G>, built: &Arena, root: CellAt, options: &ResolvedOptions) -> Result<String, String> {
        let ctx = RenderContext { options, sources: tree };
        let render = || {
            let mut arenas = HeldArenas::of([(tree.tree_id(), tree.tree_arena())]);
            (self.record)(root, &mut arenas, built, tree.written(), &ctx).map_err(|e| format!("record: {e}"))
        };
        let first = render()?;
        let second = render()?;
        if first == second { Ok(first) } else { Err(format!("a second render differs:\n{first:?}\n{second:?}")) }
    }

    /// The cell `tree`'s root's first read `depth` levels down writes.
    fn first_read(tree: &ParsedTree<G>, depth: Depth) -> Result<CellAt, String> {
        let root: N = tree.read(NodeIndex::ROOT, depth).map_err(|e| format!("read: {e:?}"))?;
        let cell = root.write_cell(&mut RecordSink::parsed(tree.tree_id(), &mut tree.tree_arena())).map_err(|e| format!("write: {e}"))?;
        Ok(CellAt { cell, tree: Some(tree.tree_id()), site: None })
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
            let native = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| self.native(&tree, &options)));
            let record = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| Self::first_read(&tree, depth).and_then(|root| self.record(&tree, &Arena::new(), root, &options))));
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

fn sources(grammar: &str) -> Vec<String> {
    load_fixtures(grammar)
        .into_iter()
        .filter_map(|fixture| match fixture {
            ParityFixture::RoundTrip(fixture) => Some(fixture.source_in),
            ParityFixture::Render { .. } => None,
        })
        .collect()
}

fn corpus<G: EngineGrammar, N: ReadNode + WriteCell<G::Trivia>>(grammar: &str, renders: &Renders<G, N>) {
    let sources = sources(grammar);
    assert!(!sources.is_empty(), "{grammar} has round-trip fixtures");
    let mut differ = Vec::new();
    let mut rendered = 0;
    for (i, source) in sources.iter().enumerate() {
        match renders.renders_alike(source) {
            Ok(Alike::Rendered) => rendered += 1,
            Ok(Alike::Panicking) => eprintln!("{grammar} source {i}: the native render panics, and the record's alike"),
            Ok(Alike::Unread) => eprintln!("{grammar} source {i}: no root read"),
            Err(e) => differ.push(format!("{grammar} source {i}: {e}")),
        }
    }
    eprintln!("{grammar}: {rendered} of {} sources render alike", sources.len());
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
    corpus("python", &Renders { grammar: sittir_python::PythonGrammar, options: sittir_python::render::options::defaults, native: sittir_python::render::render_node_parts, record: sittir_python::render::node::render_record });
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
        let native = renders.native(&tree, &options).expect("a root").expect("a native render");
        let record = renders.record(&tree, &Arena::new(), RustRenders::first_read(&tree, depth).expect("a record"), &options).expect("a record render");
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
    let mut built = Arena::new();
    let mut linked = 0;
    let mut link = |coord: &sittir_core::slot::NodeCoordinate| -> Result<Linked, sittir_core::arena::ArenaError> {
        let child: sittir_rust::render::AnyNode = tree.read(coord.index, Depth::ONE).map_err(|_| sittir_core::arena::ArenaError::Unwritable("an unread child"))?;
        match child.write_cell(&mut RecordSink::parsed(tree.tree_id(), &mut tree.tree_arena()))? {
            Cell::Child { at, .. } => {
                linked += 1;
                Ok(Linked::Record(at))
            }
            _ => Ok(Linked::Leaf(tree.source()[coord.span.range()].to_owned())),
        }
    };
    let cell = root.write_cell(&mut RecordSink::built(&mut built, tree.written(), &mut link)).expect("a built record");
    assert!(linked > 0, "the built root links its parsed children");
    let record = renders.record(&tree, &built, CellAt { cell, tree: None, site: None }, &options).expect("a record render");
    assert_eq!(record, native);
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
        let native = renders.native(&tree, &options).expect("a root").expect("a native render");
        let record = renders.record(&tree, &Arena::new(), TypeScriptRenders::first_read(&tree, depth).expect("a record"), &options).expect("a record render");
        assert_eq!(record, native, "read {depth:?}");
        assert!(record.contains("// written"), "{record:?}");
        assert_apart(&tree, &options);
    }
}

/// The envelope `_interface_body` of `tree` and the object type it holds,
/// which share one row, each prepare at a place of its own with its own
/// kind's edges.
fn assert_apart(tree: &ParsedTree<sittir_typescript::TypeScriptGrammar>, options: &ResolvedOptions) {
    use sittir_core::arena::{PrepPlace, Prepared};
    use sittir_core::trivia_store::{Place, Site};
    use sittir_typescript::render::kind_ids as ts;
    let row = (0..sittir_core::read::descendant_count(&tree.tree().root_node()))
        .map(NodeIndex::new)
        .find(|&index| sittir_core::engine::node_at_index(tree.tree(), index).is_some_and(|node| sittir_core::read::display_id(&node) == ts::_INTERFACE_BODY))
        .expect("an interface body");
    let (envelope, content) = {
        let arena = tree.tree_arena();
        let envelope = arena.record(row).expect("the edited envelope's record");
        let words = arena.arena().words(envelope, 7).expect("its words");
        let Ok(Cell::Child { at, .. }) = Cell::decode(&words[2..7]) else { panic!("its content is a record") };
        (envelope, at)
    };
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
