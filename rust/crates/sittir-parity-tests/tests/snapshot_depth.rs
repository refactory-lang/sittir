//! A snapshot's time grows linearly with its tree's depth: doubling a chain's
//! depth doubles it, where a cost quadratic in the depth would quadruple it.
//! The chain is timed on one line and with a line for each token, since the
//! lines a run breaks to cost work of their own. The test binary holds this
//! one test, so no other test shares its process.

use sittir_core::types::NodeIndex;
use sittir_parity_tests::{multiline_tuple_chain, on_deep_stack, parsed_rust, tuple_chain};
use sittir_rust::render::AnyNode;
use std::time::{Duration, Instant};

/// The two depths timed, deep enough that a cost quadratic in the depth
/// outweighs the linear work and the shallower snapshot takes 200 ms or more:
/// an unoptimized build walks each level about eight times as slowly.
const LEVELS: [usize; 2] = if cfg!(debug_assertions) { [4_000, 8_000] } else { [32_000, 64_000] };

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
    for (name, chain) in [("on one line", tuple_chain as fn(usize) -> String), ("a line for each token", multiline_tuple_chain)] {
        let [shallow_time, deep_time] = on_deep_stack(move || {
            (0..5).fold([Duration::MAX; 2], |[shallow_time, deep_time], _| [shallow_time.min(snapshot_time(chain, shallow)), deep_time.min(snapshot_time(chain, deep))])
        });
        let growth = deep_time.as_secs_f64() / shallow_time.as_secs_f64();
        eprintln!("{name}, the least of five snapshots: {shallow} levels {shallow_time:?}, {deep} levels {deep_time:?}, growth {growth:.2}");
        assert!(growth < 3.0, "{name}: doubling the depth from {shallow} to {deep} levels multiplied the snapshot's time by {growth:.2} ({shallow_time:?} to {deep_time:?}): linear doubles it, quadratic quadruples it");
    }
}
