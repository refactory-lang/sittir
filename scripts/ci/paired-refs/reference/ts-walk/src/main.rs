//! Usage:
//!   ts-walk timing <corpus-dir> <files.txt> <passes> <out.json>
//!   ts-walk memory <corpus-dir> <files.txt> <out.json>
//!
//! What it would cost to copy each node of a tree-sitter tree into a flat
//! table right after the parse, so the tree can be dropped. The rows are what
//! one walk through the public `TreeCursor` API collects: kind id, grammar
//! id, field id, the named, extra, missing and error flags, start and end
//! byte, and the row index just past the node's subtree (`Row`, 20 bytes).
//!
//! `timing` times, per file of <files.txt> (one path a line, relative to
//! <corpus-dir>), the tree-sitter parse, the walk into rows and the tree's
//! drop. One warmup pass, then <passes> timed passes; each pass's totals are
//! one sample. The row count must equal the root's visible descendant count,
//! and the rows' checksum must be the same in every pass.
//!
//! `memory` installs a counting allocator for tree-sitter (`set_allocator`)
//! before any other tree-sitter call and, per file, records the bytes and the
//! allocations live after the parse that the tree's drop gives back (what the
//! tree holds, the parser's own buffers excluded), and the parse's peak.
//! Bytes are the sizes tree-sitter asked for, without the allocator's own
//! overhead.
use std::ffi::c_void;
use std::sync::atomic::{AtomicUsize, Ordering::Relaxed};
use std::time::Instant;
use tree_sitter::{Parser, Tree};

extern "C" {
    fn tree_sitter_typescript() -> *const ();
    fn malloc(size: usize) -> *mut c_void;
    fn calloc(count: usize, size: usize) -> *mut c_void;
    fn realloc(ptr: *mut c_void, size: usize) -> *mut c_void;
    fn free(ptr: *mut c_void);
}

#[derive(Clone, Copy, Default)]
#[repr(C)]
struct Row {
    start: u32,
    end: u32,
    subtree_end: u32,
    kind: u16,
    grammar: u16,
    field: u16,
    flags: u16,
}

const NAMED: u16 = 1;
const EXTRA: u16 = 2;
const MISSING: u16 = 4;
const ERROR: u16 = 8;

fn walk(tree: &Tree, rows: &mut Vec<Row>, open: &mut Vec<u32>) {
    rows.clear();
    open.clear();
    let mut cursor = tree.walk();
    loop {
        let node = cursor.node();
        let at = rows.len();
        rows.push(Row {
            start: node.start_byte() as u32,
            end: node.end_byte() as u32,
            subtree_end: 0,
            kind: node.kind_id(),
            grammar: node.grammar_id(),
            field: cursor.field_id().map_or(0, |field| field.get()),
            flags: u16::from(node.is_named()) * NAMED + u16::from(node.is_extra()) * EXTRA + u16::from(node.is_missing()) * MISSING + u16::from(node.is_error()) * ERROR,
        });
        if cursor.goto_first_child() {
            open.push(at as u32);
            continue;
        }
        rows[at].subtree_end = rows.len() as u32;
        loop {
            if cursor.goto_next_sibling() {
                break;
            }
            if !cursor.goto_parent() {
                return;
            }
            let parent = open.pop().expect("a parent row for every goto_parent") as usize;
            rows[parent].subtree_end = rows.len() as u32;
        }
    }
}

fn checksum(rows: &[Row], mut sum: u64) -> u64 {
    for row in rows {
        for word in [row.start, row.end, row.subtree_end, u32::from(row.kind) << 16 | u32::from(row.grammar), u32::from(row.field) << 16 | u32::from(row.flags)] {
            sum = (sum ^ u64::from(word)).wrapping_mul(0x0100_0000_01b3);
        }
    }
    sum
}

static LIVE_BYTES: AtomicUsize = AtomicUsize::new(0);
static LIVE_ALLOCATIONS: AtomicUsize = AtomicUsize::new(0);
static PEAK_BYTES: AtomicUsize = AtomicUsize::new(0);
const HEADER: usize = 16;

unsafe fn counted(block: *mut c_void, size: usize) -> *mut c_void {
    assert!(!block.is_null(), "allocation of {size} bytes failed");
    unsafe { (block as *mut usize).write(size) };
    let live = LIVE_BYTES.fetch_add(size, Relaxed) + size;
    PEAK_BYTES.fetch_max(live, Relaxed);
    unsafe { (block as *mut u8).add(HEADER) as *mut c_void }
}

unsafe extern "C" fn counting_malloc(size: usize) -> *mut c_void {
    LIVE_ALLOCATIONS.fetch_add(1, Relaxed);
    unsafe { counted(malloc(size + HEADER), size) }
}

unsafe extern "C" fn counting_calloc(count: usize, size: usize) -> *mut c_void {
    LIVE_ALLOCATIONS.fetch_add(1, Relaxed);
    unsafe { counted(calloc(1, count * size + HEADER), count * size) }
}

unsafe extern "C" fn counting_realloc(ptr: *mut c_void, size: usize) -> *mut c_void {
    if ptr.is_null() {
        return unsafe { counting_malloc(size) };
    }
    let block = unsafe { (ptr as *mut u8).sub(HEADER) as *mut c_void };
    LIVE_BYTES.fetch_sub(unsafe { (block as *const usize).read() }, Relaxed);
    unsafe { counted(realloc(block, size + HEADER), size) }
}

unsafe extern "C" fn counting_free(ptr: *mut c_void) {
    if ptr.is_null() {
        return;
    }
    let block = unsafe { (ptr as *mut u8).sub(HEADER) as *mut c_void };
    LIVE_BYTES.fetch_sub(unsafe { (block as *const usize).read() }, Relaxed);
    LIVE_ALLOCATIONS.fetch_sub(1, Relaxed);
    unsafe { free(block) };
}

fn parser() -> Parser {
    let mut parser = Parser::new();
    parser.set_language(&unsafe { tree_sitter_language::LanguageFn::from_raw(tree_sitter_typescript) }.into()).expect("the TypeScript language loads");
    parser
}

fn sources(dir: &str, list: &str) -> Vec<String> {
    let names = std::fs::read_to_string(list).expect("files.txt");
    names.lines().filter(|line| !line.is_empty()).map(|name| std::fs::read_to_string(std::path::Path::new(dir).join(name)).unwrap_or_else(|e| panic!("{name}: {e}"))).collect()
}

fn timing(dir: &str, list: &str, passes: usize, out: &str) {
    let sources = sources(dir, list);
    let mut parser = parser();
    let (mut rows, mut open) = (Vec::new(), Vec::new());
    let mut samples = Vec::new();
    let mut signature = None;
    let (mut visible, mut named, mut errors) = (0usize, 0usize, 0usize);
    for pass in 0..=passes {
        let (mut parse, mut walking, mut dropping) = (0f64, 0f64, 0f64);
        let mut sum = 0xcbf2_9ce4_8422_2325u64;
        let mut nodes = 0usize;
        for source in &sources {
            let began = Instant::now();
            let tree = parser.parse(source, None).expect("a tree");
            let parsed = Instant::now();
            walk(&tree, &mut rows, &mut open);
            let walked = Instant::now();
            if pass == 0 {
                assert_eq!(rows.len(), tree.root_node().descendant_count(), "the walk's rows against the root's visible descendants");
                named += rows.iter().filter(|row| row.flags & NAMED != 0).count();
                errors += rows.iter().filter(|row| row.flags & (ERROR | MISSING) != 0).count();
            }
            let dropped_at = Instant::now();
            drop(tree);
            let dropped = Instant::now();
            parse += (parsed - began).as_secs_f64() * 1e3;
            walking += (walked - parsed).as_secs_f64() * 1e3;
            dropping += (dropped - dropped_at).as_secs_f64() * 1e3;
            nodes += rows.len();
            sum = checksum(&rows, sum);
        }
        match signature {
            None => {
                signature = Some(sum);
                visible = nodes;
            }
            Some(first) => assert_eq!((first, visible), (sum, nodes), "pass {pass} walked different rows"),
        }
        if pass > 0 {
            samples.push(format!("{{\"parseMs\":{parse:.3},\"walkMs\":{walking:.3},\"dropMs\":{dropping:.3}}}"));
        }
    }
    let bytes: usize = sources.iter().map(String::len).sum();
    std::fs::write(
        out,
        format!(
            "{{\"mode\":\"timing\",\"files\":{},\"bytes\":{bytes},\"rowBytes\":{},\"visibleNodes\":{visible},\"namedNodes\":{named},\"errorOrMissingRows\":{errors},\"signature\":{{\"rows\":{visible},\"checksum\":\"{:016x}\"}},\"samples\":[{}]}}\n",
            sources.len(),
            std::mem::size_of::<Row>(),
            signature.unwrap_or_default(),
            samples.join(",")
        ),
    )
    .expect("out.json");
}

fn memory(dir: &str, list: &str, out: &str) {
    unsafe {
        tree_sitter::set_allocator(Some(tree_sitter::Allocator { malloc: counting_malloc, calloc: counting_calloc, realloc: counting_realloc, free: counting_free }));
    }
    let sources = sources(dir, list);
    let mut parser = parser();
    let (mut rows, mut open) = (Vec::new(), Vec::new());
    let (mut tree_bytes, mut tree_allocations, mut visible, mut largest_tree, mut largest_peak) = (0usize, 0usize, 0usize, 0usize, 0usize);
    for source in &sources {
        let before = LIVE_BYTES.load(Relaxed);
        PEAK_BYTES.store(before, Relaxed);
        let tree = parser.parse(source, None).expect("a tree");
        let (after, allocations, peak) = (LIVE_BYTES.load(Relaxed), LIVE_ALLOCATIONS.load(Relaxed), PEAK_BYTES.load(Relaxed));
        walk(&tree, &mut rows, &mut open);
        drop(tree);
        let held = after - LIVE_BYTES.load(Relaxed);
        tree_bytes += held;
        tree_allocations += allocations - LIVE_ALLOCATIONS.load(Relaxed);
        visible += rows.len();
        largest_tree = largest_tree.max(held);
        largest_peak = largest_peak.max(peak - before);
    }
    let bytes: usize = sources.iter().map(String::len).sum();
    std::fs::write(
        out,
        format!(
            "{{\"mode\":\"memory\",\"files\":{},\"bytes\":{bytes},\"rowBytes\":{},\"visibleNodes\":{visible},\"treeBytes\":{tree_bytes},\"treeAllocations\":{tree_allocations},\"largestTreeBytes\":{largest_tree},\"largestParsePeakBytes\":{largest_peak}}}\n",
            sources.len(),
            std::mem::size_of::<Row>()
        ),
    )
    .expect("out.json");
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    match args.get(1).map(String::as_str) {
        Some("timing") if args.len() == 6 => timing(&args[2], &args[3], args[4].parse().expect("passes"), &args[5]),
        Some("memory") if args.len() == 5 => memory(&args[2], &args[3], &args[4]),
        _ => panic!("usage: ts-walk timing <corpus-dir> <files.txt> <passes> <out.json> | ts-walk memory <corpus-dir> <files.txt> <out.json>"),
    }
}
