//! The engine's held-parse table: each arena parse sits in a slot counted
//! once by its root and once by each link record naming it, read handles
//! borrow a slot by its parse's id, and a slot is reused only once its count
//! is 0.

#![cfg(feature = "arena")]

use std::cell::Cell;
use std::rc::Rc;

use sittir_core::arena::{Held, HeldParses, ParseReleased, LINK_WORDS};
use sittir_core::types::TreeId;

/// A held value that counts its drops in `dropped`.
struct Parse {
    id: TreeId,
    dropped: Rc<Cell<u32>>,
}

impl Held for Parse {
    fn id(&self) -> TreeId {
        self.id
    }
}

impl Drop for Parse {
    fn drop(&mut self) {
        self.dropped.set(self.dropped.get() + 1);
    }
}

fn parse(id: u32, dropped: &Rc<Cell<u32>>) -> Parse {
    Parse { id: TreeId(id), dropped: Rc::clone(dropped) }
}

#[test]
fn parses_each_released_leave_the_table_empty() {
    let dropped = Rc::new(Cell::new(0));
    let mut table = HeldParses::default();
    let slots: Vec<u32> = (0..100).map(|id| table.hold(parse(id, &dropped))).collect();
    assert_eq!(table.len(), 100);
    for slot in slots {
        assert!(table.release(slot).is_some(), "the root's release frees slot {slot}");
    }
    assert_eq!(table.len(), 0);
    assert_eq!(dropped.get(), 100);
}

#[test]
fn parses_never_released_are_freed_with_the_table() {
    let dropped = Rc::new(Cell::new(0));
    let mut table = HeldParses::default();
    for id in 0..100 {
        table.hold(parse(id, &dropped));
    }
    assert_eq!(dropped.get(), 0);
    drop(table);
    assert_eq!(dropped.get(), 100);
}

#[test]
fn a_linked_parse_outlives_its_root_and_goes_with_the_link() {
    let dropped = Rc::new(Cell::new(0));
    let mut table = HeldParses::default();
    let slot = table.hold(parse(7, &dropped));
    table.link(slot, TreeId(7)).expect("a live parse is linked");
    assert!(table.release(slot).is_none(), "the root's release leaves the link's count");
    assert_eq!(table.borrowed(slot, TreeId(7)).map(Held::id), Ok(TreeId(7)));
    assert_eq!(table.get(slot).id(), TreeId(7));
    assert!(table.release(slot).is_some(), "the link's release frees the parse");
    assert_eq!(dropped.get(), 1);
    assert_eq!(table.len(), 0);
}

#[test]
fn a_handle_kept_past_its_parse_is_refused_by_name_even_once_its_slot_is_reused() {
    let dropped = Rc::new(Cell::new(0));
    let mut table = HeldParses::default();
    let slot = table.hold(parse(1, &dropped));
    assert!(table.release(slot).is_some());
    assert_eq!(table.borrowed(slot, TreeId(1)).err(), Some(ParseReleased(TreeId(1))));
    let reused = table.hold(parse(2, &dropped));
    assert_eq!(reused, slot, "a slot whose count is 0 is reused");
    assert_eq!(table.borrowed(slot, TreeId(1)).err(), Some(ParseReleased(TreeId(1))), "the stale handle never reads the new parse");
    assert_eq!(table.borrowed(slot, TreeId(2)).map(Held::id), Ok(TreeId(2)));
    assert!(ParseReleased(TreeId(1)).to_string().contains("parse 1"), "the refusal names the parse");
}

#[test]
fn a_link_to_a_released_parse_is_refused_by_name() {
    let dropped = Rc::new(Cell::new(0));
    let mut table = HeldParses::default();
    let slot = table.hold(parse(3, &dropped));
    assert!(table.release(slot).is_some());
    assert_eq!(table.link(slot, TreeId(3)), Err(ParseReleased(TreeId(3))));
    let reused = table.hold(parse(4, &dropped));
    assert_eq!(table.link(reused, TreeId(3)), Err(ParseReleased(TreeId(3))));
    assert!(table.release(reused).is_some(), "the refused link took no count");
}

#[test]
fn a_slot_in_use_is_never_reused() {
    let dropped = Rc::new(Cell::new(0));
    let mut table = HeldParses::default();
    let first = table.hold(parse(1, &dropped));
    let second = table.hold(parse(2, &dropped));
    assert_ne!(first, second);
    table.link(first, TreeId(1)).expect("linked");
    assert!(table.release(first).is_none());
    let third = table.hold(parse(3, &dropped));
    assert_ne!(third, first, "a slot a link still counts is not reused");
    assert_ne!(third, second);
}

/// 10,000 holds, links and releases over 3 parses at a time, in an order a
/// fixed generator picks: after every step, each slot a root or a link still
/// counts reads its own parse, and each released parse is refused by name.
#[test]
fn hold_and_release_cycles_never_free_a_counted_slot() {
    let dropped = Rc::new(Cell::new(0));
    let mut table = HeldParses::default();
    let mut next_id = 0;
    let mut live: Vec<(u32, TreeId, u32)> = Vec::new();
    let mut gone: Vec<(u32, TreeId)> = Vec::new();
    let mut state: u64 = 0x5eed;
    let mut pick = |n: usize| {
        state = state.wrapping_mul(6_364_136_223_846_793_005).wrapping_add(1_442_695_040_888_963_407);
        usize::try_from(state >> 33).expect("fits") % n
    };
    for _ in 0..10_000 {
        if live.len() < 3 && (live.is_empty() || pick(2) == 0) {
            let id = TreeId(next_id);
            next_id += 1;
            live.push((table.hold(parse(id.0, &dropped)), id, 1));
        } else {
            let at = pick(live.len());
            if pick(3) == 0 {
                let (slot, id, count) = &mut live[at];
                table.link(*slot, *id).expect("a counted parse is linked");
                *count += 1;
            } else {
                let (slot, id, count) = &mut live[at];
                *count -= 1;
                let freed = table.release(*slot);
                assert_eq!(freed.is_some(), *count == 0, "slot {slot} frees exactly when its count reaches 0");
                if *count == 0 {
                    gone.push((*slot, *id));
                    live.swap_remove(at);
                }
            }
        }
        for &(slot, id, _) in &live {
            assert_eq!(table.borrowed(slot, id).map(Held::id), Ok(id), "a counted slot reads its parse");
        }
        for &(slot, id) in gone.iter().rev().take(8) {
            assert_eq!(table.borrowed(slot, id).err(), Some(ParseReleased(id)));
        }
        assert_eq!(table.len(), live.len());
    }
    assert_eq!(dropped.get() as usize, gone.len());
}

#[test]
fn a_link_record_is_eight_words() {
    assert_eq!(LINK_WORDS, 8);
}
