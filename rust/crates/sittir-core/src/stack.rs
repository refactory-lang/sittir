//! Stack growth for the pure-Rust recursion of read, prepare and render.
//!
//! Each step that descends a level runs through [`grown`]: on the thread's
//! own stack while it has room, else on a fresh heap segment. A segment is
//! never the V8 central stack, so no napi or JS call may run while one is in
//! use; [`assert_central`] says so at the napi boundary.

use std::cell::Cell;

/// The stack a step must have left to run in place.
const RED_ZONE: usize = 256 * 1024;
/// The size of each segment a step moves to.
const SEGMENT: usize = 4 * 1024 * 1024;

thread_local! {
    static SEGMENTS: Cell<usize> = const { Cell::new(0) };
}

struct OnSegment;

impl OnSegment {
    fn enter() -> Self {
        SEGMENTS.with(|segments| segments.set(segments.get() + 1));
        OnSegment
    }
}

impl Drop for OnSegment {
    fn drop(&mut self) {
        SEGMENTS.with(|segments| segments.set(segments.get() - 1));
    }
}

/// Run `step` where it has stack: in place, or on a new segment when the
/// current stack has less than the red zone left. A panic in `step`
/// unwinds on the caller's stack.
#[inline]
pub fn grown<R>(step: impl FnOnce() -> R) -> R {
    match stacker::remaining_stack() {
        Some(left) if left >= RED_ZONE => step(),
        _ => {
            let _segment = OnSegment::enter();
            stacker::grow(SEGMENT, step)
        }
    }
}

/// Whether this thread is running a step on a grown segment.
#[must_use]
pub fn on_segment() -> bool {
    SEGMENTS.with(Cell::get) > 0
}

/// Asserts, in debug builds, that `what` is not reached from a grown
/// segment, where a napi or JS call would end the process.
#[inline]
pub fn assert_central(what: &str) {
    debug_assert!(!on_segment(), "{what} called on a grown stack segment");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn descend(levels: usize, at_bottom: &dyn Fn()) -> usize {
        grown(|| {
            let frame = std::hint::black_box([0u8; 4096]);
            if levels == 0 {
                at_bottom();
                usize::from(frame[0])
            } else {
                descend(levels - 1, at_bottom) + usize::from(frame[levels % 4096])
            }
        })
    }

    #[test]
    fn a_step_past_the_thread_stack_runs_on_a_segment_and_returns() {
        let reached = Cell::new(false);
        assert_eq!(descend(20_000, &|| reached.set(on_segment())), 0);
        assert!(reached.get(), "20k levels of 4 KiB frames outgrow the test thread's stack");
        assert!(!on_segment(), "the segment count unwinds with the steps");
    }

    #[test]
    fn a_panic_on_a_segment_unwinds_to_the_caller() {
        let caught = std::panic::catch_unwind(|| descend(20_000, &|| panic!("deep refusal")));
        let payload = caught.expect_err("the panic reaches the caller");
        assert_eq!(payload.downcast_ref::<&str>(), Some(&"deep refusal"));
        assert!(!on_segment(), "the segment count unwinds with the panic");
    }

    #[test]
    #[cfg(debug_assertions)]
    #[should_panic(expected = "the napi boundary called on a grown stack segment")]
    fn a_boundary_reached_from_a_segment_fails_loudly() {
        descend(20_000, &|| assert_central("the napi boundary"));
    }
}
