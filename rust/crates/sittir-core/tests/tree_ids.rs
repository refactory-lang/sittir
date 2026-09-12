//! A tree id is minted once and never reused: the in-image counter and the
//! process-shared claim both stop at `MAX_TREE_ID` instead of wrapping.
use sittir_core::engine::{claim_tree_id, claim_tree_id_from, MAX_TREE_ID};

#[test]
fn the_shared_claim_starts_at_zero_and_records_the_next_id() {
    assert_eq!(claim_tree_id_from(None), Some((0, 1.0)));
    assert_eq!(claim_tree_id_from(Some(5.0)), Some((5, 6.0)));
}

#[test]
fn the_shared_claim_hands_out_the_last_id_and_then_refuses_without_advancing() {
    let last = f64::from(MAX_TREE_ID);
    assert_eq!(claim_tree_id_from(Some(last)), Some((MAX_TREE_ID, last + 1.0)));
    assert_eq!(claim_tree_id_from(Some(last + 1.0)), None);
    assert_eq!(claim_tree_id_from(Some(last + 2.0)), None);
}

#[test]
fn the_shared_claim_refuses_a_value_that_is_not_a_counter() {
    assert_eq!(claim_tree_id_from(Some(-1.0)), None);
    assert_eq!(claim_tree_id_from(Some(1.5)), None);
    assert_eq!(claim_tree_id_from(Some(f64::NAN)), None);
}

#[test]
fn the_in_image_counter_is_monotonic() {
    let first = claim_tree_id().expect("an id");
    let second = claim_tree_id().expect("an id");
    assert!(second > first);
}
