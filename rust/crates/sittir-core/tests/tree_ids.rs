//! A tree id is minted once and never reused: every engine claims from the
//! process's one counter, which the engine library holds.
use sittir_core::engine::claim_tree_id;

#[test]
fn the_process_counter_is_monotonic() {
    let first = claim_tree_id().expect("an id").id();
    let second = claim_tree_id().expect("an id").id();
    assert!(second > first);
}
