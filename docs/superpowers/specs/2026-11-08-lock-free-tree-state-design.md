# Lock-free tree state: design

**Status:** approved by the maintainer, 2026-11-08, then amended the same day ("And Rc and Arc"). No shared ownership either.
**Scope:** the state a parsed tree and its engine use on the parse, read, render and edit paths in `sittir-core`: `ParsedTree`, the trivia placement, the trivia store, the tree arena, the built arena's chunks, the engine cell and the layout work counters.

## Why

- Every parsed tree is already confined to the JavaScript thread that parsed it. A coordinate from another thread's tree is refused. Even so, its state sits behind locks and atomics:
  - in `ParsedTree`: a `Mutex` for each of `records`, `slots` and `items`, a `Mutex` inside a `OnceLock` for the arena, `OnceLock`s for lines and depth members, and atomic `cached` and `grown` flags;
  - in the placement: a `Mutex<State>` and atomic published slots;
  - in the trivia store: an `RwLock` for each of the sides and the built chunks, a `Mutex` on the buffers, and an atomic edit count;
  - nine atomic layout work counters.
- None of these guards anything across threads. On one thread they cost an atomic read-modify-write each time, which is a locked instruction on x86. They also turn re-entry into a deadlock: arena Task 5's render held its arena while a measurement inside it locked that arena again.
- Shared ownership has the same costs. An `Arc` clone or drop is an atomic read-modify-write, and an `Rc` with its `RefCell` pays a check at run time. Both blur who owns what:
  - the source is `Arc<str>`;
  - every `Nodes::kids` call allocates an `Arc<[Kid]>`;
  - the placement keeps `Arc` shapes, sims and plans;
  - cached slots, items and records are `Arc`;
  - the engine is an `Rc<RefCell<Engine>>`, and seatings are `Rc`;
  - the built arena's chunk memory is an `Arc` shared with JavaScript's external buffers.
- The maintainer, 2026-11-08: "I would also like to get to a lock free state", scoped to "Per-tree state, no locks". On threading: "multithreaded is purely native side". Then: "And Rc and Arc".

## Goals

1. **One borrow per call.** Every napi entry point that touches a tree takes that tree's borrow once, through `TreeCell`, the trees-as-objects plan's Task 1. The engine gets the same through its own cell. A second borrow of the same tree or engine within the call is refused by name and never blocks.
   - The cell has one owner on one thread, so its flag is a plain `Cell`, not an atomic.
   - The cell is `Send` and not `Sync`. `ParsedTree` stays `Send + Sync` because it's plain data.
2. **Plain data under the borrow.** None of `Mutex`, `RwLock`, atomics, `OnceLock`, `RefCell`, `Rc` or `Arc` appears on the paths in scope. Caches and counters are ordinary fields, changed through `&mut`.
3. **Callees receive the borrow.** A function that needs the tree takes it, or a `&mut` part of it, from its caller and never re-acquires it. The deadlock Task 5 hit can then only be a compile error.
4. **One owner; everything else borrows.**
   - Holders:
     - a tree's holder owns it: the JavaScript `Tree` object in object storage, or the engine's held-parse slot in arena storage, where the count is a plain integer;
     - the engine is owned by its JavaScript object;
     - a tree owns its source, and everything else reads it as `&str`.
   - Caches own their values. A lookup returns `&T` tied to the borrow. Where a borrow can't outlive a later insert, it returns an index into storage the owner keeps, never a clone.
   - `Nodes::kids` fills a buffer its caller owns, or gives a borrowed slice. It no longer allocates an `Arc<[Kid]>` per call.
5. **The work counters belong to the call.** `LayoutWork` is a plain record the borrow owns and the caller reads after the call. Tests read it the way they do today.
6. **Native threads share only what is immutable, by borrow.** When native code runs work in parallel, it uses scoped threads that borrow immutable published data: rows, the source buffer, and records once written. Each task returns its scratch to the borrow's owner, which merges it. Threads never share a mutable cache, and nothing is reference-counted to cross a thread.
7. **Process-wide state built once stays as it is.** Grammar tables, compiled patterns, the tree-sitter `Language` and the engine stamp are built once at load and read without a lock.

## Non-goals

- Moving any napi or V8 call off the JavaScript thread. Parallelism stays inside native code.
- Process-wide registries that change at runtime: `LIVE_TREES`, which trees-as-objects removes, and process statics shared by worker threads.
- Object storage's speed numbers, beyond not regressing them. The maintainer's direction on 2026-11-08 was not to chase them.

## Anti-goals

- Swapping a lock for `RefCell` or `Cell` field by field. That moves a deadlock to a runtime panic and keeps a check on every access. The one borrow at the boundary is the only runtime check.
- `unsafe impl Sync`, or `UnsafeCell`, used to get around the borrow checker.
- A second copy of a rule, or a different path for one storage.
- Losing a refusal by name. Re-entering a tree that's already borrowed fails with a message naming the tree and the operation, never as a crash.

## Shape

- `TreeCell` keeps its non-blocking `read` and `write` borrows from trees-as-objects Task 1, but nothing holds it through an `Arc`. The JavaScript `Tree` object owns it, and a coordinate reaches it through that object (`FromNapiRef<Tree>`) for the length of one call. The trees-as-objects plan is amended to match: no `TreeRef = Arc<TreeCell>`, and no interim `Weak` index.
- With no interior mutability inside, `ParsedTree` is `Send + Sync` because it is plain data.
- The built arena's chunk memory is co-owned with JavaScript's external buffers today.
  - It becomes the engine's alone if whatever frees a chunk detaches every view of it in the same call, which the code already does.
  - The builder proves that holds on every path that frees memory before dropping the `Arc`.
  - If one path can't, that structure is listed for the maintainer and not converted.
- A call that fills a cache (hydrating records, placing sides, measuring a baseline, filling slots) takes the `write` borrow. A call that only reads published data takes `read`.
- Lazily built values (lines, depth members, the arena, published placement) become `Option` fields filled under `&mut`.
- Counted maps keep their byte accounting, which is now plain arithmetic.
- In the trivia store, the per-engine parts on these paths (sides, built chunks, buffers, edit walks) follow the same rule as the tree if they are confined to one JavaScript thread.
  - The builder audits each one first.
  - A structure that is shared across threads today stays synchronized and is listed for the maintainer. It is not converted silently.

## Guard

- `sittir-core` denies these types through clippy's `disallowed_types`: `std::sync::{Mutex, RwLock, OnceLock, LazyLock, Arc, Weak}`, `std::sync::atomic::*`, `std::rc::{Rc, Weak}` and `std::cell::RefCell`.
- An allowlist names the process-wide init-once sites and the two cells' flags.
- The allowlist's count is a ratchet that only goes down.

## Verification

- `validate:native` rows are identical in both storages after every step. Renders are byte-identical over all of matter.js and next.js, and records are word-identical.
- The trees-as-objects Review Focus 2 holds: a write during a render of the same tree is refused by name with no deadlock, and a write to another tree in the same call succeeds.
- Speed comes from CI per-CPU medians for parse, deep read and the three render cases, in both storages:
  - there is no regression past noise;
  - matter.js object render on x86 is reported against the master it starts from.
- Peak RSS is unchanged.

## Decided

- The maintainer, 2026-11-08:
  - the scope is per-tree state with no locks;
  - process-wide tables built once stay init-once;
  - multithreading happens only on the native side;
  - arena regressions are acceptable only as planned trade-offs;
  - no `Rc` or `Arc` ("And Rc and Arc").
- This builds on trees-as-objects Task 1's `TreeCell`, not a second borrow mechanism.

## Left to the builder

- Names, and whether the work record travels as an argument or a field of the borrow guard.
- How the placement's published slots are laid out without atomics.
- The lifetimes or indices that replace `Arc` and `Rc` values.
- What arena Task 5's rows `Arc`, shared by the arena and the tree, becomes, which is the same single owner.
- The order of steps, after trees-as-objects Task 1. Each step lands green on its own, and the plan sequences it against arena Tasks 6 and 7, which touch the same structures.
