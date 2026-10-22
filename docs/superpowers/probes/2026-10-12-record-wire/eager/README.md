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

## Measured results

Baseline runtime revision `651faa3103309a0c0203c2203037a9c4432fa960`, Apple M4 Pro,
Darwin 27.2.0 arm64, Node v26.12.0. The run used ten distinct fresh workers,
five alternating pairs, two warmups and three measured batches per worker.
Every worker passed the unchanged idle gate at 75–84% idle. Source, compiled
workspace outputs, native addons and WASMs matched the unwatched copy and
remained unchanged before and after timing. No local builds, tests or source
writes ran during timing. The gate and session attest concurrency; this was
not continuous host-process monitoring.

Times are milliseconds per batch of 10,000 four-node functions: the median
of five worker medians. Ranges are the worker medians, not confidence intervals.
Each phase is summarized independently, so phase medians need not add to the
pipeline median. Arena/object above one favors objects.

| Phase | Objects ms | Arena ms | Arena/object | Object range | Arena range |
| --- | ---: | ---: | ---: | ---: | ---: |
| Build | 7.229 | 11.362 | 1.572 | 6.790–7.504 | 10.977–11.569 |
| Render | 27.001 | 47.780 | 1.770 | 26.481–27.406 | 47.544–48.819 |
| Native deep reparse | 94.639 | 95.022 | 1.004 | 93.976–95.622 | 94.311–98.413 |
| Build → render → deep reparse | 128.811 | 154.773 | 1.202 | 126.465–130.967 | 152.730–158.699 |
| `$with.name(sharedChild)` | 4.505 | 4.507 | 1.000 | 4.087–4.766 | 4.466–4.968 |

**This eager-record prototype takes 20.2% more pipeline time.** Building takes
57.2% more time and rendering 77.0% more time; deep reparse and immutable edits
are effectively tied. Native render-body time is 2.187 µs per object root
versus 3.678 µs per arena root. Input and complete render fingerprints match
across all 30 measured batches; each renders 128,890 bytes. Deep reparsing
stays native under both modes. No JS node inspection runs inside the pipeline.

The build increase is accepted for this stage. The render regression is a
blocker and must be addressed; the measurements below preserve its baseline.

This does not supersede the separate corpus validator results. Those measure
parsed storage, while both public factory settings still construct objects.
This workload measures direct eager construction using the current generic
record cells and equivalent probe wrappers.

### Allocation and retained memory

Render allocator counts and bytes are identical across measured batches within
each mode. These are Rust allocation calls and cumulative allocated bytes per
root, not retained bytes. Whole-boundary allocation and deallocation totals
match during each call.

| Render scope | Object calls/root | Arena calls/root | Object bytes/root | Arena bytes/root |
| --- | ---: | ---: | ---: | ---: |
| Whole Rust boundary | 10 | 28 | 1,781.889 | 4,280 |
| Native body | 9 | 25 | 1,717.889 | 3,928 |

The whole-boundary snapshots include automatic Rust N-API conversion. The
body includes borrowing/admission or object decoding, then canonical prepare
and render. Build and `$with` make no Rust allocation calls in either mode.
Parser-addon allocations and V8/C++ allocations are outside these counters.
The extra native allocations point toward admission and prepared-overlay work
for investigation; this run does not attribute time to those subphases.

Untimed memory deltas below are medians of five workers, measured after explicit
GC. Units are MiB (1,048,576 bytes). The first population retains 10,000 roots
(40,000 constructed nodes); the second retains those roots and 10,000 edited
roots sharing their unchanged children.

| Process field | Objects: built | Arena: built | Objects: originals + edits | Arena: originals + edits |
| --- | ---: | ---: | ---: | ---: |
| `heapUsed` | 15.797 | 12.292 | 29.223 | 24.559 |
| `heapTotal` | 18.000 | 19.750 | 30.500 | 31.750 |
| `external` | 0.000 | 4.027 | 0.000 | 8.027 |
| `arrayBuffers` (part of `external`) | 0.000 | 4.027 | 0.000 | 8.027 |
| RSS | 0.000 | 0.453 | 2.641 | 7.017 |
| `heapUsed` + `external` | 15.797 | 16.320 | 29.223 | 32.586 |

Arena lowers `heapUsed`, but after adding external buffers the observed
retained total is 3.3% higher for built roots and 11.5% higher with both
snapshots. `heapUsed` plus `external` is a process-memory observation, not
complete native retained-memory accounting. RSS reflects previously allocated
pages being reused; the zero object delta does not mean zero storage.

Exact arena storage, including its reserved word:

| Population | Occupied record bytes | Record capacity | Occupied UTF-8 bytes | UTF-8 capacity | Total slack |
| --- | ---: | ---: | ---: | ---: | ---: |
| Built roots | 2,600,004 | 4,177,920 | 48,890 | 61,440 | 1,590,466 (37.5%) |
| Originals + edits | 4,280,012 | 8,372,224 | 48,897 | 61,440 | 4,104,755 (48.7%) |

Slack is unused capacity divided by total record and UTF-8 capacity. Chunk
growth and append-only snapshot retention matter to this result. The packed
representation remains the target; the measured misses create optimization
work on native allocation, generic-cell size and chunk slack before cutover.
Bounded inline children and full corpus/public-builder coverage remain open.

[Raw paired samples](../results/2026-10-22-eager-storage-darwin-arm64.json),
[independently recomputed statistics](../results/2026-10-22-eager-analysis.json),
and [source/native provenance and checks](../results/2026-10-22-eager-provenance.json)
retain the complete results. The full project gates passed: five-grammar
regeneration, TypeScript, lint, four Clippy configurations, 451 object Rust
tests, 558 arena Rust tests, 29 reader-debug tests, and 812 Vitest files
(8,199 ordinary passes, seven expected-failure cases, 19 skipped, four todo).
Complete validation reports equal the pinned baseline and each other:
193 normalized rows, +0/−0. Independent source review resolved the optional
presence-unset edge case and returned no further actionable findings for
this measurement prototype. This is not a definitive-cutover sign-off.
