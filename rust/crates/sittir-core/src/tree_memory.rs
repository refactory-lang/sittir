//! The bytes each parsed tree holds natively, counted by the allocator.
//!
//! Every native allocation goes through [`CountingAlloc`], which keeps the
//! JavaScript thread's live byte total. tree-sitter's C allocations go
//! through it too ([`route_tree_sitter`]). A napi entry that works on one
//! tree opens a [`TreeScope`]; what the total moved by inside the outermost
//! scope is that tree's, and nothing allocated outside every scope is any
//! tree's.

use std::alloc::{GlobalAlloc, Layout, System};
use std::cell::Cell;
use std::ffi::c_void;

/// The process's global allocator: the system's, counting the bytes it hands out.
pub struct CountingAlloc;

#[global_allocator]
static ALLOCATOR: CountingAlloc = CountingAlloc;

thread_local! {
    static LIVE: Cell<isize> = const { Cell::new(0) };
    static DEPTH: Cell<u32> = const { Cell::new(0) };
}

fn moved(bytes: isize) {
    LIVE.with(|live| live.set(live.get().wrapping_add(bytes)));
}

fn signed(bytes: usize) -> isize {
    isize::try_from(bytes).unwrap_or(isize::MAX)
}

// SAFETY: every call forwards to `System` with the caller's layout unchanged;
// the count is a thread-local add that neither allocates nor unwinds.
unsafe impl GlobalAlloc for CountingAlloc {
    unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
        // SAFETY: the caller's contract for `alloc`, forwarded.
        let ptr = unsafe { System.alloc(layout) };
        if !ptr.is_null() {
            moved(signed(layout.size()));
        }
        ptr
    }

    unsafe fn alloc_zeroed(&self, layout: Layout) -> *mut u8 {
        // SAFETY: the caller's contract for `alloc_zeroed`, forwarded.
        let ptr = unsafe { System.alloc_zeroed(layout) };
        if !ptr.is_null() {
            moved(signed(layout.size()));
        }
        ptr
    }

    unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
        // SAFETY: the caller's contract for `dealloc`, forwarded.
        unsafe { System.dealloc(ptr, layout) };
        moved(-signed(layout.size()));
    }

    unsafe fn realloc(&self, ptr: *mut u8, layout: Layout, new_size: usize) -> *mut u8 {
        // SAFETY: the caller's contract for `realloc`, forwarded.
        let grown = unsafe { System.realloc(ptr, layout, new_size) };
        if !grown.is_null() {
            moved(signed(new_size) - signed(layout.size()));
        }
        grown
    }
}

/// The live bytes the allocator has handed out on this thread and not taken back.
#[must_use]
pub fn live_bytes() -> isize {
    LIVE.with(Cell::get)
}

/// What a napi entry allocates while it works on one tree. Scopes nest; only
/// the outermost one's [`TreeScope::close`] answers the bytes, so an entry
/// another entry calls adds nothing twice.
pub struct TreeScope {
    start: isize,
}

impl TreeScope {
    #[must_use]
    pub fn open() -> Self {
        DEPTH.with(|depth| depth.set(depth.get() + 1));
        Self { start: live_bytes() }
    }

    /// The bytes the tree's count moves by: `Some` from the outermost scope,
    /// `None` from a nested one.
    #[must_use]
    pub fn close(self) -> Option<isize> {
        let depth = DEPTH.with(|depth| {
            let now = depth.get() - 1;
            depth.set(now);
            now
        });
        (depth == 0).then(|| live_bytes() - self.start)
    }
}

const HEADER: usize = 16;

fn ts_layout(size: usize) -> Option<Layout> {
    Layout::from_size_align(size.checked_add(HEADER)?, HEADER).ok()
}

unsafe extern "C" fn ts_malloc(size: usize) -> *mut c_void {
    let Some(layout) = ts_layout(size) else { return std::ptr::null_mut() };
    // SAFETY: `layout` has a non-zero size (at least the header).
    let base = unsafe { std::alloc::alloc(layout) };
    if base.is_null() {
        std::alloc::handle_alloc_error(layout);
    }
    // SAFETY: `base` is valid for `HEADER + size` bytes, aligned to `HEADER`.
    unsafe {
        base.cast::<usize>().write(size);
        base.add(HEADER).cast()
    }
}

unsafe extern "C" fn ts_calloc(count: usize, size: usize) -> *mut c_void {
    let Some(total) = count.checked_mul(size) else { return std::ptr::null_mut() };
    let Some(layout) = ts_layout(total) else { return std::ptr::null_mut() };
    // SAFETY: `layout` has a non-zero size.
    let base = unsafe { std::alloc::alloc_zeroed(layout) };
    if base.is_null() {
        std::alloc::handle_alloc_error(layout);
    }
    // SAFETY: as in `ts_malloc`.
    unsafe {
        base.cast::<usize>().write(total);
        base.add(HEADER).cast()
    }
}

unsafe extern "C" fn ts_free(ptr: *mut c_void) {
    if ptr.is_null() {
        return;
    }
    // SAFETY: `ptr` came from `ts_malloc`, `ts_calloc` or `ts_realloc`, so the
    // header before it holds the size it was made with.
    unsafe {
        let base = ptr.cast::<u8>().sub(HEADER);
        let size = base.cast::<usize>().read();
        std::alloc::dealloc(base, ts_layout(size).unwrap_unchecked());
    }
}

unsafe extern "C" fn ts_realloc(ptr: *mut c_void, size: usize) -> *mut c_void {
    if ptr.is_null() {
        // SAFETY: a null `ptr` asks for a fresh allocation.
        return unsafe { ts_malloc(size) };
    }
    let Some(layout) = ts_layout(size) else { return std::ptr::null_mut() };
    // SAFETY: as in `ts_free`; the new block keeps the header first.
    unsafe {
        let base = ptr.cast::<u8>().sub(HEADER);
        let old = base.cast::<usize>().read();
        let grown = std::alloc::realloc(base, ts_layout(old).unwrap_unchecked(), layout.size());
        if grown.is_null() {
            std::alloc::handle_alloc_error(layout);
        }
        grown.cast::<usize>().write(size);
        grown.add(HEADER).cast()
    }
}

/// Routes tree-sitter's C allocations through the Rust allocator, so they are
/// counted. Runs once, before the first parser is made.
pub fn route_tree_sitter() {
    static ROUTED: std::sync::Once = std::sync::Once::new();
    ROUTED.call_once(|| {
        // SAFETY: called before any other tree-sitter API call in this
        // binary (the first engine runs it before making its parser), once,
        // on the JavaScript thread; the four functions are one family over
        // the Rust allocator, never return null for a non-zero size, and
        // align to 16, as libc `malloc` does on the targets built.
        unsafe {
            tree_sitter::set_allocator(Some(tree_sitter::Allocator { malloc: ts_malloc, calloc: ts_calloc, realloc: ts_realloc, free: ts_free }));
        }
    });
}
