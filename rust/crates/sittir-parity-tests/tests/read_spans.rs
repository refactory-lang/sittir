//! A read's root names the addresses its records lie in: one range for each
//! run of chunks its writer wrote in turn. A range holds no record of
//! another read or of a build, whatever numbers the read's chunks took.
#![cfg(feature = "arena")]

use std::ops::Range;

use sittir_core::arena::{read_spans, Address};
use sittir_core::engine::{Engine, ParsedTree};
use sittir_core::nodes::Nodes;
use sittir_core::trivia_store::Place;
use sittir_core::types::NodeIndex;
use sittir_parity_tests::fixture_sources;
use sittir_rust::render::AnyNode;
use sittir_rust::RustGrammar;

fn engine() -> Engine<RustGrammar> {
    Engine::new(RustGrammar, sittir_rust::render::options::defaults()).expect("an engine")
}

/// A rust source of `n` fixtures joined, whose records take more than one
/// chunk.
fn joined(n: usize) -> String {
    fixture_sources("rust").into_iter().take(n).collect::<Vec<_>>().join("\n")
}

/// The records a read left for the nodes of the tree its root heads.
fn records(engine: &Engine<RustGrammar>, root: Address) -> Vec<Address> {
    let built = engine.written().built();
    let tree = ParsedTree::over_records(engine, &built, root).expect("a tree over the records");
    let mut nodes = tree.nodes();
    let (mut pending, mut found) = (vec![NodeIndex::ROOT], Vec::new());
    while let Some(at) = pending.pop() {
        if let Some(record) = tree.place(at).and_then(Place::as_record) {
            found.push(record);
        }
        pending.extend(nodes.kids(at).iter().map(|kid| kid.index));
    }
    found
}

fn spans(engine: &Engine<RustGrammar>, root: Address) -> Vec<Range<Address>> {
    read_spans(&*engine.written().built(), root).expect("the root's spans")
}

fn parse(engine: &mut Engine<RustGrammar>, source: &str) -> Address {
    engine.parse_records::<AnyNode>(source).expect("a parse").root.expect("a root")
}

#[test]
fn a_read_whose_chunks_took_numbers_in_turn_is_one_span_holding_its_records() {
    let mut engine = engine();
    let root = parse(&mut engine, &joined(150));
    let found = records(&engine, root);
    let spans = spans(&engine, root);
    assert_eq!(spans.len(), 1, "{spans:?}");
    assert!(found.iter().map(|at| at.chunk()).collect::<std::collections::BTreeSet<_>>().len() > 1, "the read took more than one chunk");
    assert!(found.iter().all(|at| spans[0].contains(at)), "every record lies in the span");
}

#[test]
fn a_chunk_a_build_took_between_a_read_s_chunks_parts_its_spans() {
    let mut engine = engine();
    let first = parse(&mut engine, "fn f() {}\n");
    let built = engine.written().built_mut().alloc_words(16).expect("a builder's chunk").chunk;
    let second = parse(&mut engine, &joined(150));
    let spans = spans(&engine, second);
    assert_eq!(spans.len(), 2, "{spans:?}");
    let inside = Address::new(built, 0).expect("an address");
    assert!(!spans.iter().any(|span| span.contains(&inside)), "no span holds the build's chunk");
    assert!(records(&engine, second).iter().all(|at| spans.iter().any(|span| span.contains(at))), "every record lies in a span");
    assert!(!records(&engine, first).iter().any(|at| spans.iter().any(|span| span.contains(at))), "no span holds the read before's records");
}

#[test]
fn reads_between_builds_each_name_their_own_records_and_no_other() {
    let mut engine = engine();
    let mut roots = Vec::new();
    let mut builds = Vec::new();
    for n in [40, 150, 60] {
        roots.push(parse(&mut engine, &joined(n)));
        builds.push(engine.written().built_mut().alloc_words(16).expect("a builder's chunk").chunk);
    }
    for (n, &root) in roots.iter().enumerate() {
        let spans = spans(&engine, root);
        for (m, &other) in roots.iter().enumerate() {
            let held = records(&engine, other).iter().filter(|at| spans.iter().any(|span| span.contains(at))).count();
            assert_eq!(held == records(&engine, other).len(), n == m, "read {n}'s spans {spans:?} against read {m}'s records");
            if n != m {
                assert_eq!(held, 0, "read {n}'s spans hold none of read {m}'s records");
            }
        }
        for &build in &builds {
            let inside = Address::new(build, 0).expect("an address");
            assert!(!spans.iter().any(|span| span.contains(&inside)), "read {n}'s spans hold no build's chunk");
        }
    }
}
