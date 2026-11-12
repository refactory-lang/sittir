//! Probe only: per-part time and allocation counts of a parse's release and
//! of its parse, on the calling thread. Allocation counts come from the
//! `probe_alloc_counts` symbol an `LD_PRELOAD` interposer exports; without
//! it they read zero.

use std::cell::RefCell;
use std::time::Instant;

pub const DETACH: usize = 0;
pub const SIDES: usize = 1;
pub const ROWS: usize = 2;
pub const ARENA: usize = 3;
pub const RECORDS: usize = 4;
pub const SLOTS_ITEMS: usize = 5;
pub const PLACEMENT_SHAPES: usize = 6;
pub const PLACEMENT_HEAP_MAPS: usize = 7;
pub const PLACEMENT_BTREES: usize = 8;
pub const PLACEMENT_STATE_REST: usize = 9;
pub const PLACEMENT_PUBLISHED: usize = 10;
pub const LINES: usize = 11;
pub const DEPTH_MEMBERS: usize = 12;
pub const TREE: usize = 13;
pub const REST: usize = 14;
pub const SETTLE: usize = 15;
pub const RELEASE_ROOT: usize = 16;
pub const RELEASE_PARSE: usize = 17;
pub const DROP_LIVE_TREE: usize = 18;
pub const RELEASE_BUILT: usize = 19;
pub const PARSE: usize = 20;
pub const TREES: usize = 21;
pub const PARTS: usize = 22;

/// Per part: ms, allocations, frees, bytes allocated, bytes freed.
pub const FIELDS: usize = 5;

thread_local! {
    static SPLIT: RefCell<[[f64; FIELDS]; PARTS]> = const { RefCell::new([[0.0; FIELDS]; PARTS]) };
}

type CountsFn = unsafe extern "C" fn(*mut u64);

#[cfg(target_os = "linux")]
fn counts_fn() -> Option<CountsFn> {
    unsafe extern "C" {
        fn dlsym(handle: *mut std::ffi::c_void, symbol: *const std::ffi::c_char) -> *mut std::ffi::c_void;
    }
    static FOUND: std::sync::OnceLock<Option<usize>> = std::sync::OnceLock::new();
    let found = *FOUND.get_or_init(|| {
        // SAFETY: RTLD_DEFAULT (null on glibc) searches every loaded object for a C string symbol.
        let at = unsafe { dlsym(std::ptr::null_mut(), c"probe_alloc_counts".as_ptr()) };
        (!at.is_null()).then_some(at as usize)
    });
    // SAFETY: the interposer exports `void probe_alloc_counts(uint64_t out[4])`.
    found.map(|at| unsafe { std::mem::transmute::<usize, CountsFn>(at) })
}

#[cfg(not(target_os = "linux"))]
fn counts_fn() -> Option<CountsFn> {
    None
}

/// This thread's allocations, frees, bytes allocated and bytes freed so far.
#[must_use]
pub fn alloc_counts() -> [u64; 4] {
    let mut out = [0u64; 4];
    if let Some(counts) = counts_fn() {
        // SAFETY: `out` holds the four counts the interposer writes.
        unsafe { counts(out.as_mut_ptr()) };
    }
    out
}

/// A part being timed: its start and the allocation counts at its start.
pub struct Part {
    at: usize,
    start: Instant,
    counts: [u64; 4],
}

impl Part {
    #[must_use]
    pub fn start(at: usize) -> Self {
        let counts = alloc_counts();
        Self { at, start: Instant::now(), counts }
    }

    pub fn end(self) {
        drop(self);
    }
}

impl Drop for Part {
    fn drop(&mut self) {
        let took = self.start.elapsed();
        let counts = alloc_counts();
        SPLIT.with(|split| {
            let part = &mut split.borrow_mut()[self.at];
            part[0] += took.as_secs_f64() * 1000.0;
            for field in 0..4 {
                #[allow(clippy::cast_precision_loss)]
                {
                    part[field + 1] += counts[field].wrapping_sub(self.counts[field]) as f64;
                }
            }
        });
    }
}

/// Counts one more at part `at`'s first field.
pub fn count(at: usize) {
    SPLIT.with(|split| split.borrow_mut()[at][0] += 1.0);
}

/// This thread's split since the last take, part by part, each part's
/// fields in order, zeroed.
#[must_use]
pub fn take() -> Vec<f64> {
    SPLIT.with(|split| std::mem::take(&mut *split.borrow_mut()).into_iter().flatten().collect())
}
