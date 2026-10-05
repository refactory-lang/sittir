//! Feasibility probe: write a whole tree-sitter tree into a flat u32 image in
//! one cursor pass, and time it against the parse that produced the tree.
//!
//! Row = one visible node, in pre-order, so the row index is tree-sitter's own
//! descendant index. Extras are assigned an owner in the same pass.

use std::time::{Duration, Instant};
use tree_sitter::{Language, Node, Parser, Tree};

const W: usize = 6;
const KIND: usize = 0; // grammar symbol | display symbol << 16
const FIELD_FLAGS: usize = 1; // field id | flags << 16
const START: usize = 2;
const END: usize = 3;
const PARENT: usize = 4;
const SUBTREE_END: usize = 5; // row after this node's last descendant

const NAMED: u32 = 1;
const EXTRA: u32 = 2;
const ERROR: u32 = 4;
const MISSING: u32 = 8;

const LEADING: u32 = 0;
const TRAILING: u32 = 1;
const INNER: u32 = 2;

/// Per open parent: the facts trivia ownership needs about the children seen so far.
#[derive(Clone, Copy)]
struct Open {
    row: u32,
    prev_owner: u32,
    prev_owner_end_row: u32,
    tokens_since_owner: u16,
    tokens_seen: u16,
    pending_from: u32,
}

struct Pending {
    extra: u32,
    start_row: u32,
    tokens_before: u16,
}

fn flags(node: &Node<'_>) -> u32 {
    (node.is_named() as u32) * NAMED
        | (node.is_extra() as u32) * EXTRA
        | (node.is_error() as u32) * ERROR
        | (node.is_missing() as u32) * MISSING
}

/// One pre-order pass. `trivia` receives (extra row, owner row, class | tokens_before << 8).
fn write_image(tree: &Tree, image: &mut [u32], trivia: &mut Vec<[u32; 3]>) -> usize {
    let mut cursor = tree.walk();
    let mut open: Vec<Open> = Vec::with_capacity(64);
    let mut pending: Vec<Pending> = Vec::new();
    let mut row = 0u32;
    loop {
        let node = cursor.node();
        let at = row as usize * W;
        let f = flags(&node);
        image[at + KIND] = node.grammar_id() as u32 | (node.kind_id() as u32) << 16;
        image[at + FIELD_FLAGS] = cursor.field_id().map_or(0, |id| id.get() as u32) | f << 16;
        image[at + START] = node.start_byte() as u32;
        image[at + END] = node.end_byte() as u32;
        image[at + PARENT] = open.last().map_or(u32::MAX, |o| o.row);

        // trivia ownership, decided as each child of the open parent arrives
        if let Some(parent) = open.last_mut() {
            if f & EXTRA != 0 {
                let start_row = node.start_position().row as u32;
                if parent.prev_owner != u32::MAX && parent.prev_owner_end_row == start_row {
                    trivia.push([row, parent.prev_owner, TRAILING | (parent.tokens_since_owner as u32) << 8 | 1 << 31]);
                } else {
                    pending.push(Pending { extra: row, start_row, tokens_before: parent.tokens_seen });
                }
            } else if f & NAMED != 0 && node.start_byte() != node.end_byte() {
                let start_row = node.start_position().row as u32;
                for p in pending.drain(parent.pending_from as usize..) {
                    let _same_line = p.start_row == start_row;
                    trivia.push([p.extra, row, LEADING]);
                }
                parent.prev_owner = row;
                parent.prev_owner_end_row = node.end_position().row as u32;
                parent.tokens_since_owner = 0;
            } else {
                parent.tokens_since_owner += 1;
                parent.tokens_seen += 1;
            }
        }

        let this = row;
        row += 1;
        if cursor.goto_first_child() {
            open.push(Open {
                row: this,
                prev_owner: u32::MAX,
                prev_owner_end_row: 0,
                tokens_since_owner: 0,
                tokens_seen: 0,
                pending_from: pending.len() as u32,
            });
            continue;
        }
        image[at + SUBTREE_END] = row;
        loop {
            if cursor.goto_next_sibling() {
                break;
            }
            if !cursor.goto_parent() {
                return row as usize;
            }
            let closed = open.pop().expect("an open parent for every goto_parent");
            image[closed.row as usize * W + SUBTREE_END] = row;
            for p in pending.drain(closed.pending_from as usize..) {
                if closed.prev_owner != u32::MAX {
                    trivia.push([p.extra, closed.prev_owner, TRAILING]);
                } else {
                    trivia.push([p.extra, closed.row, INNER | (p.tokens_before as u32) << 8]);
                }
            }
        }
    }
}

fn language_for(path: &str) -> Language {
    if path.ends_with(".rs") {
        tree_sitter_rust::LANGUAGE.into()
    } else if path.ends_with(".ts") {
        tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into()
    } else {
        tree_sitter_python::LANGUAGE.into()
    }
}

fn best_of(n: u32, mut f: impl FnMut()) -> Duration {
    let mut best = Duration::MAX;
    for _ in 0..n {
        let t = Instant::now();
        f();
        best = best.min(t.elapsed());
    }
    best
}

fn median_of(n: u32, mut f: impl FnMut()) -> Duration {
    let mut all: Vec<Duration> = (0..n)
        .map(|_| {
            let t = Instant::now();
            f();
            t.elapsed()
        })
        .collect();
    all.sort();
    all[all.len() / 2]
}

fn main() {
    let path = std::env::args().nth(1).expect("a source file");
    let out = std::env::args().nth(2);
    let source = std::fs::read_to_string(&path).expect("readable source");
    let mut parser = Parser::new();
    parser.set_language(&language_for(&path)).expect("language");

    let mut tree = parser.parse(&source, None).expect("parse");
    let parse = median_of(200, || {
        tree = parser.parse(&source, None).expect("parse");
    });

    let rows = tree.root_node().descendant_count();
    let mut image = vec![0u32; rows * W];
    let mut trivia: Vec<[u32; 3]> = Vec::new();
    let written = write_image(&tree, &mut image, &mut trivia);
    assert_eq!(written, rows, "the pass visits exactly descendant_count() nodes");

    // the row index is the cursor's descendant index: seek a sample of rows back
    let mut cursor = tree.walk();
    let mut probe = 0usize;
    while probe < rows {
        cursor.goto_descendant(probe);
        let node = cursor.node();
        assert_eq!(cursor.descendant_index(), probe);
        assert_eq!(image[probe * W + START], node.start_byte() as u32);
        assert_eq!(image[probe * W + END], node.end_byte() as u32);
        assert_eq!(image[probe * W + KIND] & 0xffff, node.grammar_id() as u32);
        probe += 97;
    }

    let write = median_of(200, || {
        trivia.clear();
        write_image(&tree, &mut image, &mut trivia);
    });
    let write_best = best_of(200, || {
        trivia.clear();
        write_image(&tree, &mut image, &mut trivia);
    });
    let alloc_and_write = median_of(200, || {
        let mut fresh = vec![0u32; rows * W];
        let mut t: Vec<[u32; 3]> = Vec::new();
        write_image(&tree, &mut fresh, &mut t);
        std::hint::black_box(&fresh);
    });
    let seek = median_of(200, || {
        let mut c = tree.walk();
        let mut i = 0;
        while i < rows {
            c.goto_descendant(i);
            std::hint::black_box(c.node());
            i += 7;
        }
    });

    let named = (0..rows).filter(|r| image[r * W + FIELD_FLAGS] >> 16 & NAMED != 0).count();
    let extras = (0..rows).filter(|r| image[r * W + FIELD_FLAGS] >> 16 & EXTRA != 0).count();
    println!("# {path} — {} bytes", source.len());
    println!("rows (visible nodes): {rows}  (named {named}, anonymous {}, extras {extras}, owned extras {})", rows - named, trivia.len());
    println!("image: {} bytes ({:.1}x source), {} bytes/row", rows * W * 4, (rows * W * 4) as f64 / source.len() as f64, W * 4);
    println!("tree-sitter parse:           {:>8.1} us", parse.as_secs_f64() * 1e6);
    println!("image write (one pass):      {:>8.1} us median, {:.1} us best  ({:.0} ns/row, {:.2}x the parse)",
        write.as_secs_f64() * 1e6, write_best.as_secs_f64() * 1e6,
        write.as_secs_f64() * 1e9 / rows as f64, write.as_secs_f64() / parse.as_secs_f64());
    println!("allocate + write:            {:>8.1} us", alloc_and_write.as_secs_f64() * 1e6);
    println!("goto_descendant seek:        {:>8.0} ns per seek (every 7th row)", seek.as_secs_f64() * 1e9 / (rows / 7) as f64);

    if let Some(out) = out {
        let bytes: Vec<u8> = image.iter().flat_map(|w| w.to_le_bytes()).collect();
        std::fs::write(&out, bytes).expect("write image");
        println!("wrote {out}");
    }
}
