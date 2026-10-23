use std::sync::atomic::{AtomicU32, Ordering::Relaxed};

static NEXT_TREE_ID: AtomicU32 = AtomicU32::new(0);

/// Mint the next tree id from the process's one counter. Every engine of
/// every grammar claims here, so no two trees in the process share an id
/// and a coordinate names its tree unambiguously. Ids are never reused — a
/// stale handle must not come back to life under a later tree — so once
/// `max` is claimed every later claim gets `None` and the counter stays put.
pub fn claim_tree_id(max: u32) -> Option<u32> {
    claim_from(&NEXT_TREE_ID, max)
}

fn claim_from(counter: &AtomicU32, max: u32) -> Option<u32> {
    let mut next = counter.load(Relaxed);
    while next <= max {
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

    #[test]
    fn exhaustion_does_not_wrap_or_reuse_an_id() {
        let counter = AtomicU32::new(9);
        assert_eq!(claim_from(&counter, 10), Some(9));
        assert_eq!(claim_from(&counter, 10), Some(10));
        assert_eq!(claim_from(&counter, 10), None);
        assert_eq!(claim_from(&counter, 10), None);
        assert_eq!(counter.load(Relaxed), 11);
    }

    #[test]
    fn concurrent_claims_are_unique() {
        use std::sync::{Arc, Barrier};

        let counter = Arc::new(AtomicU32::new(0));
        let barrier = Arc::new(Barrier::new(8));
        let threads: Vec<_> = (0..8)
            .map(|_| {
                let counter = Arc::clone(&counter);
                let barrier = Arc::clone(&barrier);
                std::thread::spawn(move || {
                    barrier.wait();
                    (0..256).map(|_| claim_from(&counter, u32::MAX - 1).unwrap()).collect::<Vec<_>>()
                })
            })
            .collect();
        let mut ids: Vec<_> = threads.into_iter().flat_map(|thread| thread.join().unwrap()).collect();
        ids.sort_unstable();
        ids.dedup();
        assert_eq!(ids.len(), 8 * 256);
    }
}
