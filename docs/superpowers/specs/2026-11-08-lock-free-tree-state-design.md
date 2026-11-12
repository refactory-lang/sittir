# Lock-free arena state: design

**Status:** approved by the maintainer, 2026-11-08. Amended the same day to rule out shared ownership ("And Rc and Arc") and to scope the work to arena storage ("Arena only").
**Scope:**
- the state arena storage uses on the parse, read, render and edit paths in `sittir-core`: what outlives an arena parse call (its nodes and its source text), the tree arena, the built arena's chunks and the engine cell;
- the types both storages share: the trivia placement, the trivia store, the layout work counters and the `Nodes` interface.

## Why

- A parse is confined to the JavaScript thread that made it. A coordinate from another thread's tree is refused. Even so, the state on these paths sits behind locks, atomics and shared ownership:
  - a `Mutex` for each of `records`, `slots` and `items`, and a `Mutex` inside a `OnceLock` for the arena;
  - `OnceLock`s for lines and depth members, and atomic `cached` and `grown` flags;
  - in the placement, a `Mutex<State>` and atomic published slots;
  - in the trivia store, an `RwLock` for each of the sides and the built chunks, a `Mutex` on the buffers, and an atomic edit count;
  - nine atomic layout work counters;
  - `Arc<str>` sources, an `Arc<[Kid]>` allocated by every `Nodes::kids` call, `Arc` shapes, plans and cached values, an `Rc<RefCell<Engine>>`, and chunk memory co-owned through an `Arc` with JavaScript's external buffers.
- None of these guards anything across threads.
  - On one thread they cost an atomic read-modify-write each time, which is a locked instruction on x86, or a run-time check.
  - They turn re-entry into a deadlock: arena Task 5's render held its arena while a measurement inside it locked that arena again.
  - They blur who owns what.
- The maintainer, 2026-11-08:
  - "I would also like to get to a lock free state", scoped to "Per-tree state, no locks";
  - "multithreaded is purely native side";
  - "And Rc and Arc";
  - then "Arena only".

## Goals

1. **One borrow per call.** In arena storage, the engine owns what outlives each parse call, its nodes and its source text (arena Task 6). A call borrows the engine once and reaches them through that borrow.
   - A second borrow of the engine within the call is refused by name and never blocks.
   - The engine has one owner, its JavaScript object, on one thread, so the flag is a plain `Cell`.
2. **Plain data under the borrow.** None of `Mutex`, `RwLock`, atomics, `OnceLock`, `RefCell`, `Rc` or `Arc` appears in arena storage's state or in the shared types. Caches and counters are ordinary fields, changed through `&mut`.
3. **Callees receive the borrow.** A function that needs a parse takes it, or a `&mut` part of it, from its caller and never re-acquires it. The deadlock Task 5 hit can then only be a compile error.
4. **One owner; everything else borrows.**
   - The engine owns the nodes and the source text each parse call leaves.
   - The source text has one owner, and everything else reads it as `&str`.
   - Caches own their values. A lookup returns `&T` tied to the borrow. Where a borrow can't outlive a later insert, it returns an index into storage the owner keeps, never a clone.
   - `Nodes::kids` fills a buffer its caller owns, or gives a borrowed slice. It no longer allocates an `Arc<[Kid]>` per call.
5. **The work counters belong to the call.** `LayoutWork` is a plain record the borrow owns and the caller reads after the call. Tests read it the way they do today.
6. **Native threads share only what is immutable, by borrow.** When native code runs work in parallel, it uses scoped threads that borrow immutable published data: rows, the source buffer, and records once written.
   - Each task returns its scratch to the borrow's owner, which merges it.
   - Threads never share a mutable cache, and nothing is reference-counted to cross a thread.
7. **Process-wide state built once stays as it is.** Grammar tables, compiled patterns, the tree-sitter `Language` and the engine stamp are built once at load and read without a lock.

## Non-goals

- Object storage's own state:
  - its holder, which is today's live-tree table;
  - its lazy read caches over tree-sitter's tree;
  - the trees-as-objects plan's object half, which is deferred.
- Moving any napi or V8 call off the JavaScript thread.
- Process-wide registries that change at runtime, and process statics shared by worker threads.
- Object storage's speed. The maintainer: "We don't have to keep investing in performance enhancements to object storage, as long as it doesn't affect arenas and the public api".

## Anti-goals

- A second copy of a shared rule, one for each storage. A shared type is written once, as plain data, and serves both.
- Swapping a lock for `RefCell` or `Cell` field by field inside the shared types or arena state. The engine's one borrow at the boundary is the only run-time check.
- `unsafe impl Sync`, or `UnsafeCell`, used to get around the borrow checker.
- Losing a refusal by name. Re-entering a borrowed engine fails with a message naming the operation, never as a crash.

## Shape

- **Shared types are plain data.** The placement, the trivia store's per-tree parts, the counters and the `Nodes` backers hold no lock, atomic or shared pointer. They mutate through `&mut`.
- **Arena storage** holds the shared types directly under the engine borrow. Its per-tree state lives only inside the read call (arena Task 6).
- **Object storage** wraps its per-tree state, including its copies of the shared types, in one coarse holder at its own boundary, as today's live-tree table does.
  - The table's borrow hands out `&mut` for a write and `&` for a read.
  - Object storage's locks and shared pointers stay outside the shared code.
  - Where a read path needs `&mut` for a cache, that holder takes it.
- **Lazily built values** (lines, depth members, published placement) become `Option` fields filled under `&mut`.
- **Counted maps** keep their byte accounting, now as plain arithmetic.
- **The engine cell.** `Rc<RefCell<Engine>>` becomes an engine owned by its JavaScript object, with a plain-`Cell` borrow flag.
  - Anything that holds the engine through the `Rc` today borrows it per call instead.
  - If one can't, it's listed for the maintainer.
- **The built arena's chunk memory** is co-owned with JavaScript's external buffers today.
  - It becomes the engine's alone if whatever frees a chunk detaches every view of it in the same call, which the code already does.
  - The builder proves that holds on every path that frees memory before dropping the `Arc`.
  - If one path can't, that structure is listed for the maintainer and not converted.
- **The trivia store.** The per-engine parts (sides, built chunks, buffers, edit walks) follow the same rule if they're confined to one JavaScript thread. The builder audits each one. A structure shared across threads today stays as it is and is listed.

## Guard

- `sittir-core` denies these types through clippy's `disallowed_types`: `std::sync::{Mutex, RwLock, OnceLock, LazyLock, Arc, Weak}`, `std::sync::atomic::*`, `std::rc::{Rc, Weak}` and `std::cell::RefCell`.
- An allowlist names three kinds of site:
  - the process-wide init-once sites;
  - the engine cell's flag;
  - object storage's holder sites.
- The allowlist's count is a ratchet that only goes down.

## Verification

- `validate:native` rows are identical in both storages after every step.
- Renders are byte-identical over all of matter.js and next.js, and records are word-identical.
- A write during a render of the same engine is refused by name with no deadlock.
- Speed comes from CI per-CPU medians for parse, deep read and the three render cases.
  - Arena storage has no regression past noise, except planned trade-offs stated with their numbers.
  - Object storage's speed is not a gate. Its correctness is: rows, renders and records, as above.
- The public API is unchanged.
- Arena peak RSS is unchanged or lower.

## Decided

- The maintainer, 2026-11-08:
  - no locks;
  - no `Rc` or `Arc`;
  - arena storage only;
  - process-wide tables built once stay init-once;
  - multithreading happens only on the native side;
  - arena regressions are acceptable only as planned trade-offs;
  - the trees-as-objects object half is deferred.
- After the read call, arena storage has no per-tree owner (arena Task 6). This work builds on that, and on no per-tree cell.

## Left to the builder

- Names, and whether the work record travels as an argument or a field of the borrow guard.
- How the placement's published slots are laid out without atomics.
- The lifetimes or indices that replace `Arc` and `Rc` values.
- What arena Task 5's rows `Arc`, shared by the arena and the tree, becomes, which is the same single owner.
- The order of steps after arena Task 6. Each step lands green on its own.
