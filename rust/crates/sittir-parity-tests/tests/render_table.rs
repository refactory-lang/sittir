//! A render of parsed records keeps no table of the nodes it visits: at a
//! fixed depth its peak heap above its output does not grow with the nodes
//! it visits, and it decodes each entry of a run at most once.
#![cfg(feature = "arena")]

use std::alloc::{GlobalAlloc, Layout, System};
use std::fmt::Write;

use sittir_core::arena::side::{run_entries_decoded, RunEntry, SideRecord};
use sittir_core::arena::{coordinate_cell, prepare_root, Address, ArenaError, ArenaRead, BuiltChunks, BuiltWriter, Cell, CellAt, ListCell, RecordCells, RecordShape, RecordSink};
use sittir_core::engine::{Engine, EngineGrammar, ReadSources, SourceRecords};
use sittir_core::prepare::RenderContext;
use sittir_core::render::ThroughTemplates;
use sittir_core::slot::{ChangedEdges, NodeCoordinate};
use sittir_core::types::{KindId, NodeId, NodeIndex, Span, TreeId};

struct Peak;

thread_local! {
    static LIVE: std::cell::Cell<usize> = const { std::cell::Cell::new(0) };
    static HIGHEST: std::cell::Cell<usize> = const { std::cell::Cell::new(0) };
}

fn grew(by: usize) {
    let live = LIVE.with(|live| {
        live.set(live.get() + by);
        live.get()
    });
    HIGHEST.with(|highest| highest.set(highest.get().max(live)));
}

fn shrank(by: usize) {
    LIVE.with(|live| live.set(live.get().saturating_sub(by)));
}

// SAFETY: each method passes its arguments to `System` unchanged.
unsafe impl GlobalAlloc for Peak {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        grew(layout.size());
        // SAFETY: the caller's contract for this call is `System`'s.
        unsafe { System.alloc(layout) }
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        shrank(layout.size());
        // SAFETY: the caller's contract for this call is `System`'s.
        unsafe { System.dealloc(ptr, layout) }
    }

    unsafe fn realloc(&self, ptr: *mut u8, layout: Layout, new_size: usize) -> *mut u8 {
        grew(new_size);
        shrank(layout.size());
        // SAFETY: the caller's contract for this call is `System`'s.
        unsafe { System.realloc(ptr, layout, new_size) }
    }
}

#[global_allocator]
static PEAK: Peak = Peak;

struct Rendered {
    above_output: usize,
    prepare_peak: usize,
    decoded: u64,
    entries: u64,
}

/// The entries of the runs of the records under the record at `root`.
fn run_entries(arena: &dyn ArenaRead, root: Address) -> u64 {
    let (mut pending, mut entries) = (vec![root], 0);
    while let Some(at) = pending.pop() {
        let side = SideRecord::read(arena, Address(arena.words(at, 2).expect("a header")[1])).expect("a side record");
        entries += side.run.len() as u64;
        pending.extend(side.run.iter().filter_map(|entry| if let RunEntry::Record { at, .. } = *entry { Some(at) } else { None }));
    }
    entries
}

/// One render of the rust `source`'s root, from its templates when
/// `templates`: its peak heap above what it held before and above its
/// output, and the run entries it decoded against those its records hold.
fn rendered(source: &str, templates: bool) -> Rendered {
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let options = engine.options().clone();
    let root = engine.parse_records::<sittir_rust::render::node::AnyNode>(source).expect("a parse").root.expect("a root");
    let built = engine.written().built();
    let entries = run_entries(&*built, root);
    let prepare_peak = {
        let trees = SourceRecords::new(&engine, &built, |_| Ok(()));
        let read = ReadSources::over(&trees);
        let through = ThroughTemplates(&read);
        let kind = built.header_kind(root, sittir_rust::RustGrammar::KIND_BITS).expect("a kind");
        let at = CellAt { cell: Cell::Child { kind, at: root, changed: ChangedEdges::default() }, node: Some(NodeId::record(root.0)), site: None };
        let before = LIVE.with(std::cell::Cell::get);
        HIGHEST.with(|highest| highest.set(before));
        let prepared = prepare_root::<_, sittir_rust::render::node::AnyNode>(Some(&*built), &*built, engine.written(), at, &RenderContext::new(&options, &through), sittir_rust::RustGrammar::KIND_BITS).expect("a prepare");
        let held = HIGHEST.with(std::cell::Cell::get).saturating_sub(before);
        drop(prepared);
        held
    };
    let (before, decoded) = (LIVE.with(std::cell::Cell::get), run_entries_decoded());
    HIGHEST.with(|highest| highest.set(before));
    let text = engine.render_at(&built, root, ChangedEdges::default(), &options, templates, |_| Ok(())).expect("a render");
    let (peak, decoded) = (HIGHEST.with(std::cell::Cell::get), run_entries_decoded() - decoded);
    assert_eq!(text, source, "the render is the source");
    Rendered { above_output: peak.saturating_sub(before + text.capacity()), prepare_peak, decoded, entries }
}

fn functions(n: usize) -> String {
    let mut source = (0..n).fold(String::new(), |mut source, at| {
        writeln!(source, "fn f{at}(a: u8) -> u8 {{\n    g(a, 1);\n    a\n}}\n").expect("a write to a string");
        source
    });
    source.pop();
    source
}

fn wide_list(items: usize) -> String {
    let list = (0..items).map(|at| format!("f({at})")).collect::<Vec<_>>().join(", ");
    format!("const A: [u8; {items}] = [{list}];\n")
}

fn wide_list_with_edge_comments(items: usize) -> String {
    let list = (0..items).map(|at| format!("f({at})")).collect::<Vec<_>>().join(", ");
    format!("const A: [u8; {items}] = [/* a */ {list} /* b */];\n")
}

fn wide_list_of_leaves_and_calls(items: usize) -> String {
    let list = (0..items).map(|at| if at % 2 == 0 { format!("a{at}") } else { format!("f({at})") }).collect::<Vec<_>>().join(", ");
    format!("const A: [u8; {items}] = [{list}];\n")
}

/// The bytes a function adds to a template render's peak: the prepare pass's
/// overlay, which is parked. It only falls.
const TEMPLATE_RENDER_BYTES_A_FUNCTION: usize = 6013;

#[test]
fn a_render_keeps_no_row_per_node() {
    let growth = |templates| {
        let (small, large) = (rendered(&functions(100), templates), rendered(&functions(1600), templates));
        (large.above_output.saturating_sub(small.above_output) / 1500, small, large)
    };
    let (plain, small, large) = growth(false);
    assert_eq!(plain, 0, "{plain} bytes a function above a plain render's output (100 functions: {}, 1600: {})", small.above_output, large.above_output);
    let (templates, small, large) = growth(true);
    assert!(templates <= TEMPLATE_RENDER_BYTES_A_FUNCTION, "{templates} bytes a function above a template render's output, over its ceiling");
    for (functions, render) in [(100, &small), (1600, &large)] {
        assert!(render.above_output <= render.prepare_peak, "{functions} functions: the template render's peak {} is above its prepare pass's {}", render.above_output, render.prepare_peak);
    }
}

/// The direct row reads a template render makes per ten run entries of a
/// wide list. It only falls.
const TEMPLATE_DECODES_PER_TEN_ENTRIES: u64 = 35;

#[test]
fn a_wide_list_renders_in_linear_run_decodes() {
    let plain = [100, 400, 1600].map(|items| rendered(&wide_list(items), false).decoded);
    assert!(plain[2] <= plain[0], "a plain render's run decodes grow with the list: {plain:?} at 100, 400 and 1600 items");
    for items in [100, 400, 1600] {
        let render = rendered(&wide_list(items), true);
        assert!(render.decoded * 10 <= render.entries * TEMPLATE_DECODES_PER_TEN_ENTRIES, "{items} items: a template render decoded {} run entries of the {} the records hold", render.decoded, render.entries);
    }
}

#[test]
fn a_wide_list_with_edge_comments_renders_in_linear_run_decodes() {
    let per_hundred_entries = |items| {
        let render = rendered(&wide_list_with_edge_comments(items), true);
        render.decoded * 100 / render.entries
    };
    let (small, large) = (per_hundred_entries(400), per_hundred_entries(6400));
    assert!(large <= small + small / 10, "run entries decoded per hundred grow with the list: {small} at 400 items, {large} at 6400");
}

#[test]
fn a_wide_list_of_leaves_and_calls_renders_in_linear_run_decodes() {
    let per_hundred_entries = |items| {
        let render = rendered(&wide_list_of_leaves_and_calls(items), true);
        render.decoded * 100 / render.entries
    };
    let (small, large) = (per_hundred_entries(400), per_hundred_entries(6400));
    assert!(large <= small + small / 10, "run entries decoded per hundred grow with the list: {small} at 400 items, {large} at 6400");
}

type RustNode = sittir_rust::render::AnyNode;
type RustStore = sittir_core::trivia_store::TriviaStore<<sittir_rust::RustGrammar as EngineGrammar>::Trivia>;

fn shape_of(built: &BuiltChunks, at: Address) -> RecordShape {
    <RustNode as RecordCells>::shape(built.header_kind(at, sittir_rust::RustGrammar::KIND_BITS).expect("a kind")).expect("a shape")
}

fn coordinate(kind: KindId, span: Span, name: NodeId) -> NodeCoordinate {
    let mut coordinate = NodeCoordinate::new(TreeId(0), NodeIndex(0), NodeIndex(0), span).named(Some(name));
    coordinate.kind = Some(kind);
    coordinate
}

/// The parsed node `value`, item `item` of the cell `word` of the record at
/// `holder`, as a built record links it.
fn held(built: &BuiltChunks, holder: Address, word: u32, item: u32, value: Cell) -> NodeCoordinate {
    match value {
        Cell::ParsedLeaf { kind, span, .. } => coordinate(kind, span, NodeId::leaf(holder.0, word, item)),
        Cell::Child { kind, at, .. } => {
            let side = SideRecord::read(built, Address(built.words(at, 2).expect("a header")[1])).expect("a side record");
            coordinate(kind, side.at.expect("a parsed record's row").span, NodeId::record(at.0))
        }
        other => panic!("a cell holding {other:?}"),
    }
}

fn linked(chunks: &mut BuiltChunks, store: &RustStore, coordinate: &NodeCoordinate) -> u32 {
    let mut unlinked = |_: &NodeCoordinate| Err(ArenaError::Unwritable("a node no link names"));
    coordinate_cell(&mut RecordSink::built(chunks, store, &mut unlinked), coordinate).expect("a link").0
}

/// A built record of the kind of the parsed record at `at`, linking what
/// each of its single cells holds, its list cells replaced by `list`.
fn rebuilt_record(chunks: &mut BuiltChunks, store: &RustStore, at: Address, list: Option<&[u32]>) -> Address {
    let shape = shape_of(chunks, at);
    let mut words = vec![0; shape.built_words as usize];
    let kind = chunks_kind(chunks, at);
    words[0] = BuiltWriter::new(chunks).header(kind, 0).expect("a header");
    for &cell in shape.cells {
        if cell.run.is_some() {
            if let Some(list) = list {
                words[cell.built as usize] = BuiltWriter::new(chunks).run(list).expect("a run").0;
            }
            continue;
        }
        let parsed = Cell::decode_parsed(&chunks.words(at, shape.words).expect("a record")[cell.word as usize..(cell.word + cell.width) as usize], cell, sittir_rust::RustGrammar::KIND_BITS).expect("a cell");
        if !matches!(parsed, Cell::Absent) {
            let linked_at = held(chunks, at, cell.word, 0, parsed);
            words[cell.built as usize] = linked(chunks, store, &linked_at);
        }
    }
    BuiltWriter::new(chunks).record(&words, true).expect("a built record")
}

fn chunks_kind(built: &BuiltChunks, at: Address) -> KindId {
    built.header_kind(at, sittir_rust::RustGrammar::KIND_BITS).expect("a kind")
}

/// The parsed records under `root` whose list holds `items` items, in
/// document order, each with those items.
fn lists_of(built: &BuiltChunks, root: Address, items: usize) -> Vec<(Address, Vec<Cell>)> {
    let (mut pending, mut lists) = (vec![root], Vec::new());
    while let Some(at) = pending.pop() {
        let side = SideRecord::read(built, Address(built.words(at, 2).expect("a header")[1])).expect("a side record");
        pending.extend(side.run.iter().rev().filter_map(|entry| if let RunEntry::Record { at, .. } = *entry { Some(at) } else { None }));
        let Some(shape) = <RustNode as RecordCells>::shape(chunks_kind(built, at)) else { continue };
        let words = built.words(at, shape.words).expect("a record");
        for &cell in shape.cells {
            let Some(width) = cell.run else { continue };
            let word = words[cell.word as usize];
            if word == 0 {
                continue;
            }
            let list = ListCell::of_word(sittir_core::arena::CellWord(word), built).expect("a list");
            if list.len as usize == items {
                let held = list.items(built, width).expect("items").map(|item| Cell::decode_parsed(item, cell, sittir_rust::RustGrammar::KIND_BITS).expect("an item")).collect();
                lists.push((at, held));
            }
        }
    }
    lists
}

#[derive(Clone, Copy)]
enum Rebuilt {
    Reversed,
    Interleaved,
    AlternatingWithCalls,
    CommentOnEveryItem,
}

fn rebuilt_source(shape: Rebuilt, items: usize) -> String {
    let array = |name: &str, item: &dyn Fn(usize) -> String| format!("const {name}: [u8; {items}] = [{}];\n", (0..items).map(item).collect::<Vec<_>>().join(", "));
    match shape {
        Rebuilt::Reversed => array("A", &|at| format!("a{at}")),
        Rebuilt::Interleaved => array("A", &|at| format!("a{at}")) + &array("B", &|at| format!("b{at}")),
        Rebuilt::AlternatingWithCalls => array("A", &|at| if at % 2 == 0 { format!("a{at}") } else { format!("f({at})") }),
        Rebuilt::CommentOnEveryItem => array("A", &|at| format!("/* c */ a{at}")),
    }
}

/// The run entries one render of a list rebuilt in `shape` from the parsed
/// leaves of its source decodes, per hundred items.
fn decoded_rebuilding(shape: Rebuilt, items: usize) -> u64 {
    let source = rebuilt_source(shape, items);
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let options = engine.options().clone();
    let root = engine.parse_records::<RustNode>(&source).expect("a parse").root.expect("a root");
    let store = engine.written().clone();
    let at = {
        let mut chunks = engine.written().built_mut();
        let lists = lists_of(&chunks, root, items);
        let (first, first_items) = lists.first().expect("a list").clone();
        let list_word = shape_of(&chunks, first).cells.iter().find(|cell| cell.run.is_some()).expect("a list cell").word;
        let link = |chunks: &mut BuiltChunks, holder: Address, item: usize, value: Cell| {
            let coordinate = held(chunks, holder, list_word, u32::try_from(item).expect("an item"), value);
            linked(chunks, &store, &coordinate)
        };
        let mut cells = Vec::with_capacity(items * 2);
        match shape {
            Rebuilt::Reversed => {
                for (item, &value) in first_items.iter().enumerate().rev() {
                    cells.push(link(&mut chunks, first, item, value));
                }
            }
            Rebuilt::CommentOnEveryItem => {
                for (item, &value) in first_items.iter().enumerate() {
                    cells.push(link(&mut chunks, first, item, value));
                }
            }
            Rebuilt::Interleaved => {
                let (second, second_items) = lists[1].clone();
                for (item, (&one, &other)) in first_items.iter().zip(&second_items).enumerate() {
                    cells.push(link(&mut chunks, first, item, one));
                    cells.push(link(&mut chunks, second, item, other));
                }
            }
            Rebuilt::AlternatingWithCalls => {
                for (item, &value) in first_items.iter().enumerate() {
                    cells.push(match value {
                        Cell::Child { at, .. } => {
                            let call = rebuilt_record(&mut chunks, &store, at, None);
                            sittir_core::arena::CellWord::of(call, ChangedEdges::default()).expect("a cell").0
                        }
                        value => link(&mut chunks, first, item, value),
                    });
                }
            }
        }
        rebuilt_record(&mut chunks, &store, first, Some(&cells))
    };
    let built = engine.written().built();
    let before = run_entries_decoded();
    let text = engine.render_at(&built, at, ChangedEdges::default(), &options, false, |_| Ok(())).expect("a render");
    let decoded = run_entries_decoded() - before;
    if matches!(shape, Rebuilt::CommentOnEveryItem) {
        assert_eq!(text.matches("/* c */").count(), items, "every item keeps its comment");
    }
    decoded * 100 / items as u64
}

#[test]
fn a_rebuilt_list_renders_in_linear_run_decodes() {
    for (name, shape) in [("reversed", Rebuilt::Reversed), ("interleaved", Rebuilt::Interleaved), ("alternating with rebuilt calls", Rebuilt::AlternatingWithCalls), ("a comment on every item", Rebuilt::CommentOnEveryItem)] {
        let (small, large) = (decoded_rebuilding(shape, 400), decoded_rebuilding(shape, 6400));
        assert!(large <= small + small / 10, "{name}: run entries decoded per hundred items grow with the list: {small} at 400 items, {large} at 6400");
    }
}
