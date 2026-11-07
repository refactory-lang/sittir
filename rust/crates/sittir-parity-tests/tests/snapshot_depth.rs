//! A snapshot's time grows linearly with its tree's depth: doubling a chain's
//! depth doubles it, where a cost quadratic in the depth would quadruple it.
//! The chain is timed on one line and with a line for each token, since the
//! lines a run breaks to cost work of their own, as `!` operators, each a
//! layout owner a snapshot places on a read of its own, and as nested blocks: a
//! brace a line, each line indented a level deeper than the one before; all
//! opened on one deeply indented line; and under an indentation unit as wide
//! as the chain is deep. A flat tuple of `u8`s grows in width instead, its
//! gaps measured from its frame, since a record writes a unit kind with no
//! anchor. An unoptimized build checks each line's indentation a recording
//! render counts against its text (`SpacingWriter::with_recording`), work
//! that grows with the line's depth, so it times the blocks optimized alone.
//! The test binary holds this one test, so no other test shares its process.

use sittir_core::types::NodeIndex;
use sittir_parity_tests::{block_chain, flat_tuple, indented_block_line, multiline_tuple_chain, on_deep_stack, parsed_rust, tuple_chain, unary_chain, wide_unit_blocks};
use sittir_rust::render::AnyNode;
use std::time::{Duration, Instant};

/// The two depths timed, deep enough that a cost quadratic in the depth
/// outweighs the linear work and the shallower snapshot takes 200 ms or more:
/// an unoptimized build walks each level about eight times as slowly.
const LEVELS: [usize; 2] = if cfg!(debug_assertions) { [4_000, 8_000] } else { [32_000, 64_000] };

/// A chain the test times: its name, and its source at a depth.
type Chain = (&'static str, fn(usize) -> String);

/// The chains timed in every build: tuple types nested on one line and
/// with a line for each token, `!` operators, and a flat tuple as many
/// `u8`s wide.
const CHAINS: [Chain; 4] = [("on one line", tuple_chain), ("a line for each token", multiline_tuple_chain), ("`!` operators", unary_chain), ("a flat tuple of u8s", flat_tuple)];

/// The chains of nested blocks, timed in an optimized build alone.
const BLOCKS: [Chain; 3] = [("nested blocks", block_chain), ("blocks opened on one indented line", indented_block_line), ("blocks under a wide indentation unit", wide_unit_blocks)];

/// One snapshot of `chain`'s chain of `levels`, each of a fresh parse, so no
/// cache a tree keeps answers for an earlier one.
fn snapshot_time(chain: fn(usize) -> String, levels: usize) -> Duration {
    let tree = parsed_rust(&chain(levels));
    let start = Instant::now();
    let node = tree.snapshot::<AnyNode>(NodeIndex::ROOT, None).expect("a snapshot");
    let took = start.elapsed();
    drop(node);
    took
}

#[test]
fn a_snapshot_s_time_grows_linearly_with_its_tree_s_depth() {
    let [shallow, deep] = LEVELS;
    let blocks: &[Chain] = if cfg!(debug_assertions) { &[] } else { &BLOCKS };
    for &(name, chain) in CHAINS.iter().chain(blocks) {
        let [shallow_time, deep_time] = on_deep_stack(move || {
            (0..5).fold([Duration::MAX; 2], |[shallow_time, deep_time], _| [shallow_time.min(snapshot_time(chain, shallow)), deep_time.min(snapshot_time(chain, deep))])
        });
        let growth = deep_time.as_secs_f64() / shallow_time.as_secs_f64();
        eprintln!("{name}, the least of five snapshots: {shallow} levels {shallow_time:?}, {deep} levels {deep_time:?}, growth {growth:.2}");
        assert!(growth < 3.0, "{name}: doubling the depth from {shallow} to {deep} levels multiplied the snapshot's time by {growth:.2} ({shallow_time:?} to {deep_time:?}): linear doubles it, quadratic quadruples it");
    }
}
