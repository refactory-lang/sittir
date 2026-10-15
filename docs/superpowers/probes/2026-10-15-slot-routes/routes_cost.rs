//! Cost of routing every node's children through the generated reader
//! (`routes_at`, which allocates a `Routed` per node) against the string
//! compare the query's field routes did, a walk that builds each `Child` on
//! the stack, and the query's walk through the kind's router (`Router`), each
//! child routed on the stack. Usage: routes_cost <file.rs> [reps]
use sittir_core::read::{display_id, index_of, routes_at, Child, ReadTransport, Route, Router};
use sittir_core::types::{FieldId, KindId};
use sittir_rust::render::AnyTransport;
use std::hint::black_box;
use std::time::Instant;

fn main() {
    let mut args = std::env::args().skip(1);
    let path = args.next().expect("file");
    let reps: usize = args.next().map_or(5, |r| r.parse().unwrap());
    let source = std::fs::read_to_string(&path).unwrap();
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&sittir_rust::language()).unwrap();
    let tree = parser.parse(&source, None).unwrap();
    let total = tree.root_node().descendant_count() as u32;
    println!("{path}: {} bytes, {total} nodes", source.len());

    let mut cursor = tree.walk();
    let (mut routed, mut slotted) = (0usize, 0usize);
    for index in 0..total {
        if let Some(r) = routes_at::<AnyTransport>(&mut cursor, index) {
            routed += 1;
            slotted += r.routes.iter().filter(|route| matches!(route, Route::Slot { .. })).count();
        }
    }
    println!("nodes with routes: {routed}, children routed to a slot: {slotted}");

    let time = |label: &str, f: &mut dyn FnMut() -> usize| {
        let mut best = f64::MAX;
        let mut out = 0;
        for _ in 0..reps {
            let start = Instant::now();
            out = black_box(f());
            best = best.min(start.elapsed().as_secs_f64());
        }
        println!("{label:<28} {:>8.2} ms  ({:>6.1} ns/node)  [{out}]", best * 1e3, best * 1e9 / f64::from(total));
    };

    time("goto_descendant only", &mut || {
        let mut cursor = tree.walk();
        let mut n = 0;
        for index in 0..total {
            cursor.goto_descendant(index as usize);
            n += usize::from(cursor.node().is_named());
        }
        n
    });
    time("string compare (field|kind)", &mut || {
        let mut cursor = tree.walk();
        let mut n = 0;
        for index in 0..total {
            cursor.goto_descendant(index as usize);
            if cursor.goto_first_child() {
                loop {
                    if cursor.field_name() == Some("name") || cursor.node().kind() == "identifier" {
                        n += 1;
                    }
                    if !cursor.goto_next_sibling() {
                        break;
                    }
                }
                cursor.goto_parent();
            }
        }
        n
    });
    time("stack Child walk", &mut || {
        let mut cursor = tree.walk();
        let mut n = 0;
        for index in 0..total {
            cursor.goto_descendant(index as usize);
            if cursor.goto_first_child() {
                loop {
                    let node = cursor.node();
                    let child = Child {
                        index: index_of(&cursor),
                        grammar: KindId(node.grammar_id()),
                        display: display_id(&node),
                        field: cursor.field_id().map(|field| FieldId(field.get())),
                        named: node.is_named(),
                        trivia: node.is_extra() || node.is_error(),
                        descendants: node.descendant_count() as u32,
                        start: node.start_byte() as u32,
                        end: node.end_byte() as u32,
                    };
                    n += usize::from(black_box(&child).named);
                    if !cursor.goto_next_sibling() {
                        break;
                    }
                }
                cursor.goto_parent();
            }
        }
        n
    });
    time("router walk (no alloc)", &mut || {
        let mut cursor = tree.walk();
        let mut n = 0;
        for index in 0..total {
            cursor.goto_descendant(index as usize);
            let node = cursor.node();
            let Some(Router::Children(route)) = AnyTransport::router(KindId(node.grammar_id()), display_id(&node)) else { continue };
            if cursor.goto_first_child() {
                loop {
                    if let Ok(Route::Slot { .. }) = route(&Child::at(&cursor)) {
                        n += 1;
                    }
                    if !cursor.goto_next_sibling() {
                        break;
                    }
                }
                cursor.goto_parent();
            }
        }
        n
    });
    time("routes_at (Routed alloc)", &mut || {
        let mut cursor = tree.walk();
        let mut n = 0;
        for index in 0..total {
            if let Some(r) = routes_at::<AnyTransport>(&mut cursor, index) {
                n += r.routes.len();
            }
        }
        n
    });
}
