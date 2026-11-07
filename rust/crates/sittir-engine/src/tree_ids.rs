use std::sync::atomic::{AtomicU32, Ordering::Relaxed};

static NEXT_TREE_ID: AtomicU32 = AtomicU32::new(0);

/// Mint the next tree id from the process's one counter. Every grammar's
/// engine claims here, so no two trees in the process share an id. Ids are
/// never reused, so a stale handle never comes back to life under a later
/// tree: once the last id is claimed, every later claim gets `None` and the
/// counter stays put.
#[must_use]
pub fn claim_tree_id() -> Option<u32> {
    claim_from(&NEXT_TREE_ID)
}

fn claim_from(counter: &AtomicU32) -> Option<u32> {
    let mut next = counter.load(Relaxed);
    while next < u32::MAX {
        match counter.compare_exchange_weak(next, next + 1, Relaxed, Relaxed) {
            Ok(id) => return Some(id),
            Err(observed) => next = observed,
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering::Relaxed};

    #[test]
    fn a_counter_hands_out_its_last_id_then_refuses_without_wrapping_or_moving() {
        let counter = AtomicU32::new(u32::MAX - 1);
        assert_eq!(claim_from(&counter), Some(u32::MAX - 1));
        assert_eq!(claim_from(&counter), None);
        assert_eq!(claim_from(&counter), None);
        assert_eq!(counter.load(Relaxed), u32::MAX);
    }

    #[test]
    fn concurrent_claims_are_unique_and_increase_within_each_thread() {
        use std::sync::{Arc, Barrier};

        let counter = Arc::new(AtomicU32::new(0));
        let barrier = Arc::new(Barrier::new(8));
        let threads: Vec<_> = (0..8)
            .map(|_| {
                let counter = Arc::clone(&counter);
                let barrier = Arc::clone(&barrier);
                std::thread::spawn(move || {
                    barrier.wait();
                    (0..256).map(|_| claim_from(&counter).unwrap()).collect::<Vec<_>>()
                })
            })
            .collect();
        let per_thread: Vec<Vec<u32>> = threads.into_iter().map(|thread| thread.join().unwrap()).collect();
        for ids in &per_thread {
            assert!(ids.windows(2).all(|pair| pair[0] < pair[1]), "a thread's claims increase: {ids:?}");
        }
        let mut ids: Vec<u32> = per_thread.into_iter().flatten().collect();
        ids.sort_unstable();
        assert_eq!(ids, (0..8 * 256).collect::<Vec<_>>());
    }

    #[test]
    fn the_process_counter_hands_out_increasing_ids() {
        let first = claim_tree_id().unwrap();
        let second = claim_tree_id().unwrap();
        assert!(second > first);
    }
}
