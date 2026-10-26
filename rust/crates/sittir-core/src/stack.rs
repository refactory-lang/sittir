//! The stack a recursive step over node data runs on. Node data nests as
//! deep as its source, so every step that recurses through it (render,
//! prepare, read, drop, and the decode and encode below napi) checks the
//! room left first: a deep tree continues on new segments instead of
//! overflowing the thread's stack.

/// The room a recursive step keeps below it: a step that finds less
/// continues on a new segment, or, one that calls napi, from a work stack.
const RED_ZONE: usize = 128 * 1024;

/// The size of each new segment.
const SEGMENT: usize = 2 * 1024 * 1024;

/// Runs `step`, on a new segment when the stack has less than the red zone
/// left.
pub fn grown<R>(step: impl FnOnce() -> R) -> R {
    stacker::maybe_grow(RED_ZONE, SEGMENT, step)
}

/// Whether the stack has less than the red zone left. No napi or V8 call
/// may run on a grown segment, since V8 checks its stack against the
/// thread's own, so a step that calls napi tests this instead of growing.
#[must_use]
pub fn low() -> bool {
    stacker::remaining_stack().is_some_and(|left| left < RED_ZONE)
}
