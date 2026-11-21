//! A parse's hydration takes the vectors each record's walk gathers into
//! from those of a record whose walk ended, and writes a record's run with
//! no vector of its own: the allocations a parse makes grow with its source
//! by what its reads gather, not by a walk's working vectors.
#![cfg(feature = "arena")]

use std::alloc::{GlobalAlloc, Layout, System};
use std::cell::Cell;
use std::fmt::Write;

use sittir_core::engine::Engine;

struct Counting;

thread_local! {
    static ALLOCATIONS: Cell<u64> = const { Cell::new(0) };
}

// SAFETY: each method passes its arguments to `System` unchanged.
unsafe impl GlobalAlloc for Counting {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        ALLOCATIONS.with(|count| count.set(count.get() + 1));
        // SAFETY: the caller's contract for this call is `System`'s.
        unsafe { System.alloc(layout) }
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        // SAFETY: the caller's contract for this call is `System`'s.
        unsafe { System.dealloc(ptr, layout) }
    }

    unsafe fn realloc(&self, ptr: *mut u8, layout: Layout, new_size: usize) -> *mut u8 {
        ALLOCATIONS.with(|count| count.set(count.get() + 1));
        // SAFETY: the caller's contract for this call is `System`'s.
        unsafe { System.realloc(ptr, layout, new_size) }
    }
}

#[global_allocator]
static COUNTING: Counting = Counting;

/// The allocations and reallocations one read of `functions` functions
/// into records makes, on an engine that read the same source once before.
fn allocations(functions: usize) -> u64 {
    let source = (0..functions).fold(String::new(), |mut source, n| {
        writeln!(source, "fn f{n}(a: u8, b: u8) -> u8 {{\n    let c = a + b;\n    g(c, a);\n    c\n}}").expect("a write to a string");
        source
    });
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    engine.parse_records::<sittir_rust::render::AnyNode>(&source).expect("a parse");
    let before = ALLOCATIONS.with(Cell::get);
    engine.parse_records::<sittir_rust::render::AnyNode>(&source).expect("a parse");
    ALLOCATIONS.with(Cell::get) - before
}

#[test]
fn a_parse_allocates_no_working_vector_per_record() {
    let (small, large) = (allocations(20), allocations(80));
    let per_function = (large - small) / 60;
    assert!(per_function <= 17, "{per_function} allocations a function (20 functions: {small}, 80: {large}); a ceiling that only goes down");
}
