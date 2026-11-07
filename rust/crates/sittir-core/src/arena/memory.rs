//! A chunk's storage: zeroed when allocated, at one length for its life,
//! and never moved, so JavaScript can read and write it in place through an
//! external array buffer between native calls.
//!
//! The allocation is shared: the arena holds it, and so does each buffer
//! made over it, through the buffer's finalizer. A chunk the arena frees
//! detaches its buffers, so they read as empty; a buffer that could not be
//! detached still names live memory until it is collected.

use std::alloc::{alloc_zeroed, dealloc, Layout};
use std::ptr::NonNull;
use std::sync::Arc;

/// An element a chunk holds: a word or a byte, for which zero is a value.
pub trait ChunkUnit: Copy + Default + 'static + private::Sealed {}

impl ChunkUnit for u32 {}
impl ChunkUnit for u8 {}

mod private {
    pub trait Sealed {}
    impl Sealed for u32 {}
    impl Sealed for u8 {}
}

/// `len` elements of `T`, zeroed, at a fixed address.
pub struct ChunkMem<T: ChunkUnit> {
    ptr: NonNull<T>,
    len: usize,
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
            return Arc::new(Self { ptr: NonNull::dangling(), len });
        }
        let layout = Layout::array::<T>(len).expect("a chunk's length fits an allocation");
        // SAFETY: the layout has a nonzero size.
        let raw = unsafe { alloc_zeroed(layout) };
        let ptr = NonNull::new(raw.cast::<T>()).unwrap_or_else(|| std::alloc::handle_alloc_error(layout));
        Arc::new(Self { ptr, len })
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
        // SAFETY: `ptr` was allocated with this layout in `zeroed`, and the
        // last share is dropping, so nothing reads it after.
        unsafe { dealloc(self.ptr.as_ptr().cast(), layout) };
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

    #[test]
    fn an_empty_chunk_allocates_nothing() {
        let chunk = ChunkMem::<u8>::zeroed(0);
        assert!(chunk.is_empty());
        // SAFETY: as above.
        assert_eq!(unsafe { chunk.slice() }, &[] as &[u8]);
    }
}
