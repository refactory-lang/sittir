# Eager immutable construction probe

This is the eager-builder measurement step in the [arena tables implementation
plan](../../../plans/2026-10-10-arena-tables.md), following the [shared arena
design](../../../specs/2026-10-01-shared-arena-design.md). It reuses the older
construction and UTF-8 allocator probes' approach with the current grammar,
layout, admission sets and renderer.

It generates 243 Rust grammar builders and views, including `function_item`
and its slot kinds. Object and arena builders use the same own-literal
accessor and `$with` surface. There are no node prototypes. The record form
writes directly into JS-owned word and UTF-8 chunks at construction; its
render borrows those chunks for one synchronous native call. The object form
holds plain node data for the current generated N-API decoder. No record
encoder or JS inspection walk runs at render.

This is measurement code, separate from the public engine builders. Inputs
are already validated strict inputs; the probe reuses requiredness and slot
admission, but does not reproduce loose coercion, lexical guards, queries,
trivia or the complete public node API. It uses the current packed cell
layout, including its five-word child cells; bounded inline children, parsed
links and record reclamation remain further work. Object storage remains the
public construction path. These results cannot establish definitive cutover
readiness or replace the full corpus validator comparisons.

## Build and verify

From the repository root:

```sh
pnpm run regen:all --force
pnpm exec tsx docs/superpowers/probes/2026-10-12-record-wire/eager/generate.mts
pnpm exec tsx docs/superpowers/probes/2026-10-12-record-wire/eager/generate.mts --check
pnpm exec tsx docs/superpowers/probes/2026-10-12-record-wire/eager/build.mts
pnpm exec tsx --expose-gc docs/superpowers/probes/2026-10-12-record-wire/eager/verify.mts
```

The generator consumes the source compiler and source emitters together so
their model classes have one identity. It checks its record layout against
the generated `records.ts` and consumes the existing `slotStoredIds`
derivation. Generated builders are script-owned.

Verification covers paired render bytes, native full-depth reparses, Unicode,
presence bits, receiver-new-node `$with`, explicit ancestor replacement,
unchanged child identity, retained views across 10,000 builds, oversized
list runs, stable chunks, and an empty string following a full string chunk.
The native entry rejects malformed words, invalid numeric addresses and
shared buffers. A typed-array view's byte offset is respected.

`$with` returns a new receiver. Editing a child leaves every existing parent
pointing at the original child; a parent changes only when explicitly rebuilt.
Unchanged child addresses are shared. There is no in-place record update.
The JS storage owner retains its append-only chunks while any of its views
remain live; this probe does not reclaim individual dead records.

## Measurements

A functional smoke run, whose timings are not measurement evidence:

```sh
pnpm exec tsx --expose-gc docs/superpowers/probes/2026-10-12-record-wire/eager/bench.mjs \
  --count 10 --rounds 1 --warmup 0 --iterations 1 --output eager-smoke.json
```

For measurements, copy the built checkout outside watched directories and
run with the unchanged idle gate:

```sh
node --import tsx --expose-gc docs/superpowers/probes/2026-10-12-record-wire/eager/bench.mjs \
  --idle-gate docs/superpowers/probes/2026-10-01-shared-arena/timing/idle.sh \
  --output eager-results.json
```

Defaults are five paired alternating rounds, two warmups and three measured
batches per worker, using ten distinct fresh production workers. Each batch
constructs 10,000 empty functions with unique names: four nodes per function.
It renders each function and reparses every result to a full native root via
`hydrateRecord(..., Infinity)`. No parse node fields, text or chunks are
exported. Disposal follows the timed pipeline. A separate edit phase replaces
each root's name with one shared newly built leaf.

Build, render, deep parse, pipeline and immutable edit times are retained
per batch. Input and complete render fingerprints, counts and native
allocation deltas must match across iterations and paired output must match
between modes. Hashing, correctness assertions, process startup, warmup,
explicit GC and tree disposal are outside the pipeline timer. Render times
include ordinary JS loop/instrumentation and boundary overhead. Native body
nanoseconds are recorded separately, excluding automatic N-API argument and
result conversion.

The measurement addon counts Rust global-allocator calls, allocated bytes,
deallocation calls and freed bytes. Before/after render snapshots also include
automatic Rust-side N-API conversion; per-call body counts isolate the native
borrow/admission/decode/prepare/render work. Counts do not include V8 or C++
allocations. It creates no worker threads and measurement processes run alone.

A separate untimed memory population retains all 10,000 original roots, then
also all 10,000 edited roots. It records GC-settled `heapUsed`, `heapTotal`,
external memory, array buffers and RSS beside exact occupied word/string bytes
and chunk capacity. Inputs are held in both baselines. Array buffers are part
of external memory, so these fields must not be summed. RSS reflects allocator
reuse and is not precise native retained memory. The process deltas and
allocator counters do not supply complete native memory attribution.
