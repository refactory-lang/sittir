//! A tree id is minted once and never reused: the process's one counter, in
//! sittir-engine, only moves forward.
use sittir_core::engine::claim_tree_id;

#[test]
fn the_process_counter_is_monotonic() {
    let first = claim_tree_id().expect("an id");
    let second = claim_tree_id().expect("an id");
    assert!(second > first);
}
