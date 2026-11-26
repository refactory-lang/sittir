//! Releasing a parse's root takes time linear in how wide its list is:
//! doubling the list doubles it, where a cost quadratic in its width would
//! quadruple it. The test binary holds this one test, so no other test shares
//! its process.
#![cfg(feature = "arena")]

use sittir_core::arena::count::Held;
use sittir_core::engine::Engine;
use std::fmt::Write;
use std::time::{Duration, Instant};

/// The two widths timed, wide enough that a cost quadratic in the width
/// outweighs the linear work.
const ITEMS: [usize; 2] = [32_000, 64_000];

/// One release of the root of a fresh parse of a list of `items` statements.
fn release_time(items: usize) -> Duration {
    let source = (0..items).fold(String::new(), |mut source, at| {
        writeln!(source, "x{at};").expect("a write to a string");
        source
    });
    let mut engine = Engine::new(sittir_rust::RustGrammar, sittir_rust::render::options::defaults()).expect("an engine");
    let root = engine.parse_records::<sittir_rust::render::AnyNode>(&source).expect("a parse").root.expect("a root record");
    let start = Instant::now();
    engine.written().release(Held::Record(root), true).expect("the root's release");
    start.elapsed()
}

/// The growth of five pairs, each a narrow release taken just before a wide
/// one, is the least pair's: load steady across a pair cancels in its ratio,
/// and a cost quadratic in the width quadruples every pair's.
#[test]
fn a_parse_s_release_grows_linearly_with_its_list_s_width() {
    let [narrow, wide] = ITEMS;
    let (growth, narrow_time, wide_time) = (0..5)
        .map(|_| {
            let (narrow_time, wide_time) = (release_time(narrow), release_time(wide));
            (wide_time.as_secs_f64() / narrow_time.as_secs_f64(), narrow_time, wide_time)
        })
        .min_by(|a, b| a.0.total_cmp(&b.0))
        .expect("five pairs");
    eprintln!("the least growth of five pairs: {narrow} items {narrow_time:?}, {wide} items {wide_time:?}, growth {growth:.2}");
    assert!(growth < 3.0, "doubling the list from {narrow} to {wide} items multiplied the release's time by {growth:.2} ({narrow_time:?} to {wide_time:?}): linear doubles it, quadratic quadruples it");
}
