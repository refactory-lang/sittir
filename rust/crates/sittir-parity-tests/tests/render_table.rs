//! A render of parsed records keeps no table of the nodes it visits: at a
//! fixed depth its peak heap above its output does not grow with the nodes
//! it visits, and it decodes each entry of a run at most once.
#![cfg(feature = "arena")]

use std::alloc::{GlobalAlloc, Layout, System};
use std::fmt::Write;

use sittir_core::arena::side::{run_entries_decoded, RunEntry, SideRecord};
use sittir_core::arena::{prepare_root, Address, ArenaRead, Cell, CellAt};
use sittir_core::engine::{Engine, EngineGrammar, ReadSources, SourceRecords};
use sittir_core::prepare::RenderContext;
use sittir_core::render::ThroughTemplates;
use sittir_core::slot::ChangedEdges;
use sittir_core::types::NodeId;

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

#[test]
fn a_wide_list_renders_in_linear_run_decodes() {
    for templates in [false, true] {
        for items in [100, 400, 1600] {
            let render = rendered(&wide_list(items), templates);
            assert!(render.decoded <= render.entries, "templates {templates}, {items} items: {} run entries decoded of the {} the records hold", render.decoded, render.entries);
        }
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
