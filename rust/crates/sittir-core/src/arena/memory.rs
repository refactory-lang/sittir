//! A chunk's storage: zeroed when allocated, at one length for its life,
//! and never moved, so JavaScript can read and write it in place through an
//! external array buffer between native calls.
//!
//! The allocation is shared: the arena holds it, and so does each buffer
//! made over it, through the buffer's finalizer. A chunk the arena frees
//! detaches its buffers, so they read as empty; a buffer that could not be
//! detached still names live memory until it is collected.

use std::alloc::{alloc_zeroed, dealloc, Layout};
use std::cell::RefCell;
use std::ptr::NonNull;
use std::sync::atomic::{AtomicU64, AtomicU8, Ordering::Relaxed};
use std::sync::Arc;
use std::thread::ThreadId;

/// The idle bytes one thread's pool keeps at most.
const POOL_IDLE_BYTES: usize = 4 << 20;

/// What the chunk pool has done in this process: allocations made fresh and
/// taken from a pool, and chunks freed and kept in one.
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct PoolStats {
    pub fresh: u64,
    pub reused: u64,
    pub freed: u64,
    pub pooled: u64,
}

static FRESH: AtomicU64 = AtomicU64::new(0);
static REUSED: AtomicU64 = AtomicU64::new(0);
static FREED: AtomicU64 = AtomicU64::new(0);
static POOLED: AtomicU64 = AtomicU64::new(0);

/// The chunk pool's counts so far.
#[must_use]
pub fn pool_stats() -> PoolStats {
    PoolStats { fresh: FRESH.load(Relaxed), reused: REUSED.load(Relaxed), freed: FREED.load(Relaxed), pooled: POOLED.load(Relaxed) }
}

/// Whether chunks are pooled: unread, off or on.
static POOLING: AtomicU8 = AtomicU8::new(0);

/// Whether a chunk its own thread frees is kept for that thread's next
/// allocations: `SITTIR_CHUNK_POOL=1`, read on the first allocation unless
/// `set_pooling` said first.
fn pooling() -> bool {
    match POOLING.load(Relaxed) {
        0 => {
            let read = if std::env::var("SITTIR_CHUNK_POOL").is_ok_and(|on| on == "1") { 2 } else { 1 };
            match POOLING.compare_exchange(0, read, Relaxed, Relaxed) {
                Ok(_) => read == 2,
                Err(set) => set == 2,
            }
        }
        state => state == 2,
    }
}

/// Turns chunk pooling on or off for the rest of the process.
pub fn set_pooling(on: bool) {
    POOLING.store(if on { 2 } else { 1 }, Relaxed);
}

/// A thread's idle chunks, by layout, which it frees when it ends.
#[derive(Default)]
struct Idle {
    chunks: Vec<(Layout, NonNull<u8>)>,
    bytes: usize,
}

impl Idle {
    fn take(&mut self, layout: Layout) -> Option<NonNull<u8>> {
        let at = self.chunks.iter().rposition(|&(kept, _)| kept == layout)?;
        let (_, ptr) = self.chunks.swap_remove(at);
        self.bytes -= layout.size();
        Some(ptr)
    }

    fn keep(&mut self, layout: Layout, ptr: NonNull<u8>) -> bool {
        if self.bytes + layout.size() > POOL_IDLE_BYTES {
            return false;
        }
        self.chunks.push((layout, ptr));
        self.bytes += layout.size();
        true
    }
}

impl Drop for Idle {
    fn drop(&mut self) {
        for &(layout, ptr) in &self.chunks {
            // SAFETY: each idle chunk was allocated with its layout and has no
            // share left.
            unsafe { dealloc(ptr.as_ptr(), layout) };
        }
    }
}

thread_local! {
    static IDLE: RefCell<Idle> = RefCell::default();
}

/// An element a chunk holds: a word or a byte, for which zero is a value.
pub trait ChunkUnit: Copy + Default + 'static + private::Sealed {}

impl ChunkUnit for u32 {}
impl ChunkUnit for u8 {}

mod private {
    pub trait Sealed {}
    impl Sealed for u32 {}
    impl Sealed for u8 {}
}

/// `len` elements of `T`, zeroed, at a fixed address, and the thread that
/// allocated them, the only one whose pool may keep them.
pub struct ChunkMem<T: ChunkUnit> {
    ptr: NonNull<T>,
    len: usize,
    owner: ThreadId,
}

// SAFETY: the memory is plain words or bytes. Native code reads and writes
// it only on the JavaScript thread, inside a call, under its arena's
// borrow; JavaScript writes it only between calls. A buffer's finalizer
// only drops its share.
unsafe impl<T: ChunkUnit> Send for ChunkMem<T> {}
// SAFETY: as above.
unsafe impl<T: ChunkUnit> Sync for ChunkMem<T> {}

impl<T: ChunkUnit> std::fmt::Debug for ChunkMem<T> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ChunkMem").field("len", &self.len).finish_non_exhaustive()
    }
}

impl<T: ChunkUnit> ChunkMem<T> {
    /// `len` zeroed elements.
    ///
    /// # Panics
    ///
    /// When the allocator refuses, as `Vec` does.
    #[must_use]
    pub fn zeroed(len: usize) -> Arc<Self> {
        if len == 0 {
            return Arc::new(Self { ptr: NonNull::dangling(), len, owner: std::thread::current().id() });
        }
        let layout = Layout::array::<T>(len).expect("a chunk's length fits an allocation");
        let kept = if pooling() { IDLE.try_with(|idle| idle.borrow_mut().take(layout)).ok().flatten() } else { None };
        if let Some(raw) = kept {
            // SAFETY: an idle chunk spans `layout`, and no share of it is left.
            unsafe { std::ptr::write_bytes(raw.as_ptr(), 0, layout.size()) };
            REUSED.fetch_add(1, Relaxed);
            return Arc::new(Self { ptr: raw.cast::<T>(), len, owner: std::thread::current().id() });
        }
        // SAFETY: the layout has a nonzero size.
        let raw = unsafe { alloc_zeroed(layout) };
        let ptr = NonNull::new(raw.cast::<T>()).unwrap_or_else(|| std::alloc::handle_alloc_error(layout));
        FRESH.fetch_add(1, Relaxed);
        Arc::new(Self { ptr, len, owner: std::thread::current().id() })
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.len
    }

    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.len == 0
    }

    /// The bytes the chunk takes.
    #[must_use]
    pub fn byte_len(&self) -> usize {
        self.len * std::mem::size_of::<T>()
    }

    /// The first element's address, for a buffer made over the chunk.
    #[must_use]
    pub fn as_ptr(&self) -> *mut T {
        self.ptr.as_ptr()
    }

    /// Every element, for reading.
    ///
    /// # Safety
    ///
    /// No mutable slice of this chunk is live while the result is, and no
    /// JavaScript runs: the caller holds its arena's shared borrow for the
    /// result's life, inside one native call.
    #[must_use]
    pub unsafe fn slice(&self) -> &[T] {
        // SAFETY: `ptr` names `len` initialized elements (zeroed, then only
        // ever written with whole values), and the caller rules out writes.
        unsafe { std::slice::from_raw_parts(self.ptr.as_ptr(), self.len) }
    }

    /// Every element, for writing.
    ///
    /// # Safety
    ///
    /// No other slice of this chunk is live while the result is, and no
    /// JavaScript runs: the caller holds its arena's mutable borrow for the
    /// result's life, inside one native call.
    #[must_use]
    #[allow(clippy::mut_from_ref, reason = "the arena's borrow, not this reference, is what makes the slice unique")]
    pub unsafe fn slice_mut(&self) -> &mut [T] {
        // SAFETY: as `slice`, and the caller rules out every other access.
        unsafe { std::slice::from_raw_parts_mut(self.ptr.as_ptr(), self.len) }
    }
}

impl<T: ChunkUnit> Drop for ChunkMem<T> {
    fn drop(&mut self) {
        if self.len == 0 {
            return;
        }
        let layout = Layout::array::<T>(self.len).expect("the layout it was allocated with");
        let ptr = self.ptr.cast::<u8>();
        if pooling() && self.owner == std::thread::current().id() && IDLE.try_with(|idle| idle.borrow_mut().keep(layout, ptr)).unwrap_or(false) {
            POOLED.fetch_add(1, Relaxed);
            return;
        }
        // SAFETY: `ptr` was allocated with this layout in `zeroed`, and the
        // last share is dropping, so nothing reads it after.
        unsafe { dealloc(ptr.as_ptr(), layout) };
        FREED.fetch_add(1, Relaxed);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_chunk_is_zeroed_and_keeps_its_address_while_shared() {
        let chunk = ChunkMem::<u32>::zeroed(1 << 10);
        let share = Arc::clone(&chunk);
        // SAFETY: no other slice is live and no JavaScript runs in a test.
        unsafe { chunk.slice_mut()[3] = 7 };
        // SAFETY: as above.
        let read = unsafe { share.slice() };
        assert_eq!(read.len(), 1 << 10);
        assert_eq!((read[0], read[3]), (0, 7));
        assert_eq!(share.as_ptr(), chunk.as_ptr());
        assert_eq!(chunk.byte_len(), 4 << 10);
    }

    fn idle_chunks() -> usize {
        IDLE.with(|idle| idle.borrow().chunks.len())
    }

    #[test]
    fn a_pooled_chunk_comes_back_zeroed_only_to_the_thread_that_allocated_it() {
        set_pooling(true);
        std::thread::spawn(|| {
            let chunk = ChunkMem::<u32>::zeroed(1 << 10);
            // SAFETY: no other slice is live and no JavaScript runs in a test.
            unsafe { chunk.slice_mut().fill(9) };
            let at = chunk.as_ptr();
            drop(chunk);
            assert_eq!(idle_chunks(), 1, "its own thread keeps it");
            let again = ChunkMem::<u32>::zeroed(1 << 10);
            assert_eq!((again.as_ptr(), idle_chunks()), (at, 0), "the same thread takes it back");
            // SAFETY: as above.
            assert!(unsafe { again.slice() }.iter().all(|&word| word == 0), "cleared before reuse");
            std::thread::spawn(move || {
                drop(again);
                assert_eq!(idle_chunks(), 0, "a thread that did not allocate it frees it");
            })
            .join()
            .expect("the dropping thread");
            assert_eq!(idle_chunks(), 0, "nor does it come back to its own thread");
        })
        .join()
        .expect("the allocating thread");
    }

    #[test]
    fn an_empty_chunk_allocates_nothing() {
        let chunk = ChunkMem::<u8>::zeroed(0);
        assert!(chunk.is_empty());
        // SAFETY: as above.
        assert_eq!(unsafe { chunk.slice() }, &[] as &[u8]);
    }
}
