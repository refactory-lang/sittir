# A per-call scratch allocator for the engine

**Status:** draft, 2026-11-15. The user asked for a spec on using the allocator trait Rust 1.100.0 stabilized. Three decisions are open (see "Open decisions"); nothing is built.

## Why

A native call builds many short-lived tables and frees every one before it returns. The render profile of arena storage against master's arena shows what that costs on python and typescript:

- reading a node's children into per-call lists is the largest single rise;
- freeing the call's tables is 8% to 17% of the call;
- placement allocates a list per node (segments, members, events, sides, adjacency, edges, plans, steps), each grown from empty.

None of that memory outlives the call. A bump allocator fits the lifetime exactly: allocation is a pointer add, growth at the tip is free, and the whole call's memory goes at once.

## What Rust 1.100.0 gives us

Checked by compiling probes with the pinned toolchain, no feature gate:

| type | takes an allocator on stable |
|---|---|
| `Vec<T, A>` (`new_in`, `with_capacity_in`), `Box<T, A>`, `Box<[T], A>` | yes |
| `HashMap`, `VecDeque`, `BTreeMap`, `Rc`, `Arc` | no (`allocator_ext` is unstable) |

`Vec<T, &A>` is 32 bytes where `Vec<T>` is 24. A struct that holds such a list grows by a word per list.

So the design is lists and boxes in the scratch, and no map: a table that is a hash map today becomes a flat list or a sorted list in the scratch, or stays on the global allocator.

## The end state

- `sittir-core` has one type, `Scratch`: a chained-chunk bump arena. `&Scratch` implements `Allocator`.
- An engine owns one `Scratch`. A native call takes a scope from it, allocates its working lists there, and the scope's drop rewinds to where it began. Chunks are kept between calls, so a steady run of calls makes no call to the global allocator for scratch memory.
- Everything a call returns to JavaScript, stores in a tree, or stores in the record arena is allocated as it is today. Scratch memory never crosses a call boundary.
- The engine's memory report counts the scratch's retained chunks.

## The allocator

```rust
pub struct Scratch { chunks: RefCell<Vec<Chunk>>, tip: Cell<*mut u8>, end: Cell<*mut u8> }

unsafe impl Allocator for &Scratch {
    fn allocate(&self, layout: Layout) -> Result<NonNull<[u8]>, AllocError>;
    unsafe fn deallocate(&self, ptr: NonNull<u8>, layout: Layout);
    unsafe fn grow(&self, ptr: NonNull<u8>, old: Layout, new: Layout) -> Result<NonNull<[u8]>, AllocError>;
}
```

- **allocate** aligns the tip, advances it, and opens a new chunk when the current one is full. A chunk is at least twice the last one's size and at least the request.
- **deallocate** moves the tip back when `ptr` is the most recent allocation, and does nothing otherwise.
- **grow** extends in place when `ptr` is the most recent allocation and the chunk has room. Otherwise it allocates, copies and leaves the old block. `shrink` keeps the default.
- **Scopes.** `scratch.scope()` returns a guard holding the tip and chunk it started at. Dropping it rewinds. Scopes nest, which a render needs: measuring a baseline runs a second, template-only render inside the first.
- **No fixed buffer.** A source file sets no bound on a call's working memory, so the arena grows by chunks.
- **Trim.** A scope that ends above a high-water mark frees the chunks past it, so one large file doesn't pin its peak for the engine's life. The mark is a constant in the allocator, set from measured corpus peaks.

## Safety

The `unsafe` is confined to `scratch.rs`. Its contract:

- A block stays valid until its scope rewinds. A list in the scratch is `Vec<T, &'s Scratch>`, and a scope borrows the scratch for `'s`, so the borrow checker refuses a list that outlives its scope and refuses a rewind while a list is alive.
- Element destructors run when the list drops, as with any `Vec`. A scope's rewind runs no destructor, so a scratch list or box is always dropped before its scope ends and never forgotten.
- One engine, one scratch, one thread. `Scratch` is `!Sync`. A threaded batch gives each worker's engine its own.
- Zero-size layouts return a dangling aligned pointer and never move the tip.

Tests: the allocator's unit tests run under Miri in CI (alignment, growth at and off the tip, nested scopes, trim, zero-size, a request larger than a chunk).

## What moves into the scratch

In the order the profile ranks them. Each row is its own change with its own measurement.

| step | where | what |
|---|---|---|
| 1 | `trivia_table/place.rs`, `nodes.rs` | placement's per-node lists, and a node's child list as a scratch slice where it is `Arc<[Kid]>` today |
| 2 | `baseline.rs`, `spacing.rs`, `render.rs` | the frame, open and close stacks of a render and of a baseline measure |
| 3 | `engine.rs` lookups, `arena/prep.rs`, `arena/reach.rs` | per-call level, item and unit lists |
| 4 | `read.rs`, `arena/hydrate.rs` | lists a read builds and then copies out |

Step 1 also removes reference counts from child lists, which the lock-free tree-state design already asks for.

## What stays out

- **The record arena.** Its chunks are word buffers JavaScript views directly, with counted slots and per-record release. A bump arena can't free one record.
- **Per-tree stores** (written trivia, layout overlays, prepared rows). They outlive calls and are freed one entry at a time.
- **Anything returned through napi.** Encoders take `Vec<T>`; a value built in the scratch is copied once at the boundary or built outside it.
- **Hash maps.** Until `allocator_ext` is stable, a map either becomes a flat scratch list (where the profile shows it matters) or stays global.
- **A global allocator swap** (`#[global_allocator]`). It would change every allocation in the addon and in object storage, which is a different experiment.

## Consequences to plan for

- **Type size.** A list in the scratch is a word wider. The pinned stack ceilings in the typed-read nesting test are measured, so a change that puts a scratch list in a recursive frame re-measures them in the same change.
- **Signatures.** A function that fills a caller's list takes `&mut Vec<T, &Scratch>`, or is generic over `A: Allocator`. Generic is the default for helpers both storages share, so object storage's callers keep passing global lists unchanged.
- **Lifetimes.** `Placer<'t, '_, '_>` and the lookups gain the scope's lifetime.

## Verification

Per step:

1. Rendered bytes and edit-render bytes identical on the corpus, both storages (the batch signatures).
2. Local table before and after in one session: render, edit, render + edit, parse, release, and peak resident memory.
3. One paired CI run after steps 1 and 2, read against master's arena.
4. Cargo tests, clippy in the four CI variants, the validation rows, the suite.

A step that doesn't move its row is dropped, not kept.

## Open decisions

1. **Which storages.** Placement and render code is shared. (a) Arena storage only: shared helpers are generic over the allocator and object storage keeps global lists, so its rows cannot move. (b) Both storages use the scratch. (a) honours the standing rule that a performance change may be arena-only and that object rows don't move; (b) is simpler code and probably faster for object storage too, but it is a change to object storage's render.
2. **Own allocator or a crate.** About 150 lines of our own, counted by the engine's memory report and shaped to scopes, or `bumpalo` behind its allocator feature (to be checked on 1.100.0). This draft assumes our own: one owner, no new dependency.
3. **Where it sits against the arena render work in flight.** The render gap's first fix is ranking without a root walk, which needs no allocator. Steps 1 and 2 here replace the "cheaper children" and "fewer allocations to free" candidates. Either this spec's step 1 is that work, or those candidates land first with plain sized lists and the scratch follows as a second measurement.
