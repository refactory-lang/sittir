# A per-call scratch allocator for the engine

**Status:** draft, 2026-11-15. The user asked for a spec on using the allocator trait Rust 1.100.0 stabilized, and ruled three points the same day: arena storage only; our own allocator, not a crate; the arena render's rank fix lands first and this follows it. The draft was then corrected against the engine source by the peer that owns the arena work. It is to be re-read after the rank fix lands, because that fix changes what is left for an allocator to do (see "What the rank fix changes"). Nothing is built.

**Groundwork approved, 2026-11-16** (the maintainer: "Allocator groundwork now"). Two parts depend on nothing in flight and start now: the allocation count by call site (Verification, step 1), and the `Scratch` type of "The allocator" with the tests of "Safety", in a file of its own with no consumer. The rank stamp this draft waited for was measured and dropped; what changes the picture instead is the deletion of the placer, the largest per-call allocator, in the parsed-comments design. So every row of "What moves" waits for that deletion and is re-read against the allocation count taken after it.

## Ruled 2026-11-16: it is the `NodeAllocator`

The maintainer, after approving the groundwork: "we should call this the NodeAllocator (for list of nodes/and boxed enums)", "NodeAllocator would be used whenever a node is created", and "i'm fine with not having a source allocator". Where the sections below say `Scratch`, read `NodeAllocator`; they are rewritten when the allocation count is in.

What that changes:

- **Its first consumer is the typed nodes a call creates.** A build or an edit decodes its value from JavaScript into boxed enums and lists of slot values, then writes them into records. Those typed nodes die when the call returns, and `Vec` and `Box` are exactly what stable Rust lets an allocator back. The draft below aimed first at the navigation table and the placer's lists; those come second, if the count still shows them after the placer is deleted.
- **There is no allocator for source text.** The string pool's chunks are native memory JavaScript reads in place, as the record arena's are, and stay as they are.
- **What it cannot back, in arena storage:** a node that lasts. A parsed or built node is a record in the chunked arena, which JavaScript views and counts, and no Rust allocator owns that memory. A parse and a render make no typed node at all. So "whenever a node is created" means whenever a call makes a typed node natively, which today is a build and an edit.
- **Object storage is still out,** as ruled on 2026-11-15: its typed nodes live as long as their tree, so a per-call allocator cannot hold them.

Open until the count is read: whether the per-call tables share the same allocator or stay on the global one, and the name of the scope type (the approved rows named `Scratch` and `Scope`; the renamed rows go back to the maintainer before code).

## Why

A native call builds short-lived tables and frees every one before it returns. The render profile of arena storage against master's arena, on python and typescript, shows:

- freeing the call's tables at the end is 8% of the call on python and 17% on typescript. That is the ceiling for "the whole call's memory goes at once";
- allocator and copy time inside the call is bounded only loosely (libc's self time under the render call), and the saved stacks can't split it by table.

A bump allocator fits memory whose lifetime is one call: allocation is a pointer add, growth at the tip is free, and it all goes at once. An allocation count by call site is needed before any step here is promised a number.

## What Rust 1.100.0 gives us

Checked by compiling probes with the pinned toolchain, no feature gate:

| type | takes an allocator on stable |
|---|---|
| `Vec<T, A>` (`new_in`, `with_capacity_in`), `Box<T, A>`, `Box<[T], A>` | yes |
| `HashMap`, `VecDeque`, `BTreeMap`, `Rc`, `Arc` | no (`allocator_ext` is unstable) |

`Vec<T, &A>` is 32 bytes where `Vec<T>` is 24.

So the scratch holds lists and boxes. A table that is a hash map today either becomes a flat list or stays on the global allocator.

## Whose memory is a call's

This decides everything else, and it differs by storage.

| memory | object storage | arena storage |
|---|---|---|
| the `Placer` (`kids`, `plans`, `placed`, `ranks`) and the lists of `place_gaps_of` | one call | one call |
| a render's prepared overlay and its frame stacks | one render | one render |
| the navigation table over records (`met`, each node's child list, `read`, and its maps) | — | one call |
| placement's `State` (its per-node maps, shapes and child lists) and `Published` tables | the tree's: a cache across calls | one call, because the tree is made per call |
| a measure's baseline (`tree.records`) and each run's kept gap | the tree's | one call |

So "it dies with the call" is true of placement's state only in arena storage, and only because an arena tree is made for the call.

Two more facts shape the design:

- **A nested render is not last-in, first-out.** A baseline measure runs a second render inside the first. That inner render triggers lazy placement, which writes the tree's state and publishes tables, and it leaves its baseline with the tree. Tree-lifetime data is therefore allocated while the inner render's working memory is live.
- **Child lists are the navigation trait's type.** `Kids = Arc<[Kid]>` is what `Nodes::kids` returns for both backers, and shapes, the placer and the navigation table hold clones. A scratch slice there changes the trait.

## The end state

- `sittir-core` has one type, `Scratch`: a chained-chunk bump arena, with `Allocator` implemented for a reference to its scope.
- An arena-storage engine owns one `Scratch`. A native call opens one scope, allocates there, and the scope's end rewinds. Chunks are kept between calls, so a steady run of calls asks the global allocator for no scratch memory.
- Object storage allocates as it does today. Shared code is generic over the allocator, and a child list's type belongs to the backer (an associated type of the navigation trait), so object storage's types and rows don't move.
- What a call returns to JavaScript, stores in a counted record, or keeps past the call is allocated as it is today.
- The engine's memory report counts the scratch's retained chunks.

## The allocator

```rust
pub struct Scratch { /* chunks, tip, end */ }
pub struct Scope<'s> { /* the scratch, and the tip and chunk it began at */ }

unsafe impl Allocator for &Scope<'_> {
    fn allocate(&self, layout: Layout) -> Result<NonNull<[u8]>, AllocError>;
    unsafe fn deallocate(&self, ptr: NonNull<u8>, layout: Layout);
    unsafe fn grow(&self, ptr: NonNull<u8>, old: Layout, new: Layout) -> Result<NonNull<[u8]>, AllocError>;
}
```

- **allocate** aligns the tip, advances it, and opens a new chunk when the current one is full. A chunk is at least twice the last one's size and at least the request.
- **deallocate** moves the tip back when `ptr` is the most recent block in the current chunk, and does nothing otherwise.
- **grow** extends in place when `ptr` is the most recent block and its chunk has room. Otherwise it allocates, copies and leaves the old block.
- **One rewinding scope per call.** Lists borrow the scope, `Vec<T, &'s Scope>`, so the scope can't end while one is alive. A render nested inside a measure allocates in the same scope and rewinds nothing: its working memory stays until the call ends. That is the cost of the nesting fact above; a second arena for tree-lifetime data is the alternative if measurement shows the retained inner renders matter.
- **No fixed buffer.** A source file sets no bound on a call's working memory.
- **Trim.** A call that ends above a high-water mark frees the chunks past it. The mark comes from measured corpus peaks.

## Safety

The `unsafe` is confined to `scratch.rs`. Its invariants, each pinned by a test run under Miri:

- A block is valid until its scope ends. Lists and boxes borrow the scope, so the borrow checker refuses one that outlives it.
- The tip is never behind a live block. `deallocate` and in-place `grow` act only on the most recent block of the current chunk.
- Trim frees only chunks no live scope has blocks in. It runs when the call's one scope has ended.
- A forgotten list (`mem::forget` is safe code) skips its elements' destructors and leaks what they own. It frees nothing early, so it is a leak and not unsoundness.
- Zero-size layouts return a dangling aligned pointer and never move the tip.
- `Scratch` is neither `Send` nor `Sync`. An engine is reached only from its JavaScript thread today. The tests that move a read onto a deep-stack thread must still compile, so the scratch is created on the thread that uses it.
- A scope is never open across a call into JavaScript. Per-call state is already guarded against re-entry and panics on it; the decode paths are to be audited for getters or proxies on a caller's object before this lands, and the rule is checked, not assumed.

## What moves, in order

Each row is its own change with its own measurement, arena storage only.

| step | what | lifetime | shared code touched |
|---|---|---|---|
| 1 | the navigation table over records: `met`, each node's child list, `read` | call | none, if the child list type is the backer's own |
| 2 | the `Placer`'s own tables and the event, member and plan lists of `place_gaps_of` | call | generic over the allocator |
| 3 | a render's prepared overlay and the frame stacks of layout and render | render, kept to the call's end when nested | generic over the allocator |
| 4 | placement's `State` and `Published` | the tree's, which is the call's in arena storage | the tree type gains an allocator parameter |

Step 4 is the largest item in the profile and the hardest in the types.

## What stays out

- **The record arena.** Its chunks are word buffers JavaScript views directly, with counted slots and per-record release. Hydration's growth is in those words.
- **What a read builds.** It is returned.
- **Per-tree stores in object storage,** and anything kept past a call in either storage.
- **Anything returned through napi.** Encoders take `Vec<T>`.
- **Hash maps,** until `allocator_ext` is stable.
- **A global allocator swap** (`#[global_allocator]`): it would change every allocation in the addon and in object storage.

## What the rank fix changes

The arena render's first fix stamps each record with its walk-order index and its subtree's count. With that stamp the node id can be the index. Then:

- the navigation table's `met` is a flat list sized once from the root's count, and its site-to-id map isn't needed;
- its address-to-read map can be the same flat list;
- on a counted tree, placement's per-node maps can each be a flat list indexed by node id. That is shared code, so it would move object storage's render and is a larger change than a scratch.

So most per-call hash maps become flat lists through the stamp, with or without a scratch. After the rank fix lands and is measured, this spec is re-read: steps 1 and 2 may shrink to "put the flat lists in the scratch", and the reading cost of a child's side record (a decode and an allocation per record, the larger part of "cheaper children") is not an allocator matter at all.

## Consequences to plan for

- **Type size.** A scratch list is a word wider. A change that puts one in a recursive frame re-measures the pinned stack ceilings in the same change.
- **Lifetimes.** The placer, the lookups and the navigation table gain the scope's lifetime.

## Verification

Per step:

1. An allocation count by call site before, so the step has a number to beat.
2. Rendered bytes and edit-render bytes identical on the corpus, both storages.
3. A local table before and after in one session: render, edit, render + edit, parse, release, peak resident memory.
4. A paired CI run, read against master's arena; object rows must not move.
5. Cargo tests, clippy in the four CI variants, the validation rows, the suite.

A step that doesn't move its row is dropped, not kept.
