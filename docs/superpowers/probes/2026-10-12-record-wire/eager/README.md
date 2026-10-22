# Eager immutable construction probe

This is the eager-builder measurement step in the [arena tables implementation
plan](../../../plans/2026-10-10-arena-tables.md), following the [shared arena
design](../../../specs/2026-10-01-shared-arena-design.md). It reuses the older
construction and UTF-8 allocator probes' approach with the current grammar,
layout, admission sets and renderer.

It generates 243 Rust grammar builders and views, including `function_item`
and its slot kinds. Object and arena builders use the same own-literal
accessor and `$with` surface. Views own their address and resolve the owner through one weak registry; their methods do not capture a per-node store/reference pair. There are no node prototypes. The record form
writes directly into JS-owned word and UTF-8 chunks at construction. Each record receives one writable cursor, reused at its literal slot offsets. Published views retain no writable cursor. Built text is interned once per arena, and text access retains the original builder string, including strings whose UTF-8 form replaces a lone surrogate. A native
registration retains the typed arrays; each synchronous render borrows fresh
spans from only the chunks it visits, bounded by their current written prefixes.
No borrowed span survives the call. The object form
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
text deduplication, original-string retention, own numeric addresses, presence bits, receiver-new-node `$with`, explicit ancestor replacement,
unchanged child identity, retained views across 10,000 builds, oversized
list runs, stable chunks, and an empty string following a full string chunk.
The native entries reject malformed words, invalid numeric addresses and
shared buffers. Registered buffers are checked again for detach, resize and
current written bounds on every render. Verification also covers registration
reuse, explicit disposal, GC finalization and conflicting kinds on shared
children. A typed-array view's byte offset is respected.

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

A separate untimed memory population retains all 10,000 original roots before
and after rendering, then all originals plus 10,000 rendered edited roots.
It records GC-settled process memory beside exact occupied bytes and chunk
capacity. The rendered snapshots include registration metadata. The signed
Rust allocated-minus-freed delta records live bytes attributed to the measurement
addon's allocator; it excludes V8, C++, and the parser addon. Array buffers are
part of external memory and must not be added again. RSS includes allocator
reuse and does not precisely attribute native retained storage.

An additional untimed-pipeline reference measures the historical generic encoder
against the same object roots after deep parsing and disposal. Its encoding
time is measured separately and does not enter build, render, parse, pipeline,
or edit times. The encoder is shared with the older feasibility probe: it
walks object storage, looks up slot names, and grows buffers by copying. Its
wire format has no current native renderer, so this row measures encoding only;
it is not an end-to-end alternative or an API inspection benchmark.

## Render optimization status

The current renderer caches computed record layouts, keeps small scratch
collections inline, avoids scalar-slot vectors and reuses prepared-node
lookups. Registered arenas reuse typed-array identity while reacquiring spans
per call. Admission still runs on every render, including validation of shared
addresses and their kinds. Stored layout settings retain precedence over
prepared defaults.

The measurement addon's build derives its release settings from the root
workspace profile: fat LTO and one codegen unit. Both storage modes use that
same addon. The historical baseline below used LTO off and 16 codegen units;
absolute old/new timings cannot isolate the effect of the runtime changes.

Source review found no actionable issues for this measurement prototype.
The full project checks pass: five-grammar regeneration, TypeScript, lint,
four Clippy configurations, 451 object Rust tests, 564 arena Rust tests,
29 reader-debug tests and 812 Vitest files (8,199 ordinary passes, seven
expected-failure cases, 19 skipped, four todo). Complete reports equal the
pinned baseline and both storages: 193 normalized rows, +0/−0, with all 29
raw count fields per grammar unchanged. Focused core/macro/Clippy checks and
fresh native builds also passed after formatting the new scratch helper.

The final five-pair run below confirms render parity for this prototype.
Public eager builders and definitive cutover remain further work.

## Current paired measurements

Runtime revision `7327f49790bd2dcdb2bf81a5421e67fb19873f17`, Apple M4 Pro,
Darwin 27.2.0 arm64, Node v26.12.0. This run includes literal public accessor
arguments, one construction cursor, V2 own-address probe views, and built-text
deduplication/original-string retention. Both storages use the same unchanged
native addon and workspace-derived release profile as the previous optimized run.
Ten distinct fresh workers ran five alternating pairs, two warmups and three
measured batches each. Every worker passed the unchanged idle gate at 84–86%
idle. All 30 batches match input and complete-render fingerprints (128,890 bytes).
The isolated copy matches 2,244 source, 2,270 compiled and 16 native/WASM files;
all hashes remained unchanged before/after timing. No local builds, tests or
source writes ran during measurement. Host concurrency is a session attestation.

Times are milliseconds per 10,000 four-node functions, the median of five
worker medians. Ranges are worker medians, not confidence intervals. Independent
phase medians need not sum to the pipeline median. Arena/object below one favors arena.

| Phase | Objects ms | Arena ms | Arena/object | Object range | Arena range |
| --- | ---: | ---: | ---: | ---: | ---: |
| Build | 17.025 | 14.771 | 0.868 | 16.593–18.726 | 14.657–15.414 |
| Render | 24.144 | 23.373 | 0.968 | 23.714–24.847 | 23.124–23.638 |
| Native deep reparse | 94.413 | 97.440 | 1.032 | 93.094–96.120 | 96.927–99.150 |
| Build → render → deep reparse | 135.937 | 136.794 | 1.006 | 132.854–136.396 | 135.535–137.327 |
| `$with.name(sharedChild)` | 7.391 | 4.139 | 0.560 | 7.158–7.837 | 3.920–4.579 |

Arena uses 13.2% less build time, 3.2% less render time and 44.0% less immutable
edit time than the updated object path. Complete pipeline time is effectively
tied (arena 0.6% higher). Deep parsing uses the same native full-depth path under
both modes; no JS node inspection runs inside the pipeline.

**Absolute construction regressed in both paths:** the preceding optimized run
built objects in 6.965 ms and arenas in 11.227 ms, versus 17.025 ms and 14.771 ms
here. The matched wrapper/storage changes affect both paths. These separate
runs, with several changes and different host conditions, do not isolate a
cause. Further construction profiling remains necessary; the relative arena
win alone does not establish an overall construction improvement.

The separately timed historical generic encoder takes **5.670 ms** per object
batch (worker-median range 5.402–5.941 ms). It emits 370,001 words and 48,890
UTF-8 bytes, reserving 2,162,688 bytes. This is the old encoder's wire, with no
current native renderer. Its time is excluded from all five phases above.

Native render bodies take 1.836 µs per object root and 1.554 µs per arena root.
Whole Rust-boundary allocations remain 10 calls / 1,781.889 bytes per object
root and 8.0016 calls / 368.1464 bytes per arena root. Body-only counts remain
9 / 1,717.889 bytes and 6.0006 / 240.0648 bytes respectively. Construction and
immutable edits make zero Rust allocator calls. These counters exclude V8/C++
and the separate parser addon.

The memory populations below have all been rendered before GC-settled snapshots,
so native registration is included. Deltas are median MiB across five workers;
inputs and an empty owner are held in the baseline. Array buffers are part of
external memory. RSS includes allocator reuse and is not native attribution.

| Process field | Objects: rendered originals | Arena: rendered originals | Objects: rendered originals + edits | Arena: rendered originals + edits |
| --- | ---: | ---: | ---: | ---: |
| `heapUsed` | 14.721 | 12.519 | 27.089 | 23.750 |
| `heapTotal` | 14.750 | 12.656 | 26.750 | 12.656 |
| `external` | 0.000 | 4.027 | 0.000 | 8.027 |
| `arrayBuffers` (within `external`) | 0.000 | 4.027 | 0.000 | 8.027 |
| RSS | 0.141 | 8.048 | 5.407 | 8.345 |
| `heapUsed` + `external` | 14.721 | 16.547 | 27.089 | 31.777 |

Arena lowers JS heap but retains more heap plus external memory: about 12.4%
more for rendered originals and 17.3% more for originals plus edits. The signed
measurement-addon Rust allocated-minus-freed deltas are 208 and 216 bytes for
those arena populations, versus zero for objects. Those tiny deltas measure
Rust registration metadata; they exclude C++ reference metadata and the parser
addon. Complete native attribution and per-record reclamation remain open.
Exact arena occupied bytes and capacity are unchanged from the earlier tables.

Fresh checks pass: five-grammar regeneration, all TypeScript lanes, lint,
812 Vitest files (8,204 ordinary passes, seven expected failures, 19 skipped,
four todo), 451 object Rust tests, 564 arena Rust tests and 29 reader-debug
tests. Both complete validation reports match the pinned baseline and each
other: 193 normalized rows, +0/−0, all 29 raw count fields per grammar unchanged.
The source review found no blocking issue for this prototype and the production
literal-accessor change. Public eager cutover remains further work.

[Raw paired samples](../results/2026-10-22-eager-literal-slots-storage-darwin-arm64.json),
[independently recomputed statistics](../results/2026-10-22-eager-literal-slots-analysis.json),
and [source/native provenance and checks](../results/2026-10-22-eager-literal-slots-provenance.json).

## Previous paired measurements

Runtime revision `aa21d998231dfac8b0c9c7649cb4140e4da98b1c`, Apple M4 Pro,
Darwin 27.2.0 arm64, Node v26.12.0. Both modes use the same freshly built
measurement addon and workspace-derived release profile. The ten distinct
fresh workers ran in five alternating pairs, with two warmups and three
measured batches each. Every worker passed the unchanged idle gate at
88–92% idle. Source, compiled outputs, native addons and WASMs matched the
unwatched copy and remained unchanged before and after timing. No local
builds, tests or source writes ran during timing; concurrency is a session
attestation, not continuous host-process monitoring.

Times are milliseconds per 10,000 four-node functions: the median of five
worker medians. Ranges are worker medians, not confidence intervals. Phase
medians are independent and need not add to the pipeline median. Arena/object
above one favors objects.

| Phase | Objects ms | Arena ms | Arena/object | Object range | Arena range |
| --- | ---: | ---: | ---: | ---: | ---: |
| Build | 6.965 | 11.227 | 1.612 | 6.829–7.180 | 10.545–12.025 |
| Render | 23.662 | 23.628 | 0.999 | 23.347–24.739 | 23.499–23.880 |
| Native deep reparse | 95.241 | 95.702 | 1.005 | 94.791–96.339 | 94.539–96.558 |
| Build → render → deep reparse | 126.164 | 130.741 | 1.036 | 125.621–126.772 | 130.101–131.398 |
| `$with.name(sharedChild)` | 4.266 | 4.456 | 1.045 | 4.208–4.332 | 4.232–4.616 |

**Arena render time is effectively tied with objects.** Construction takes
61.2% more time and the complete pipeline takes 3.6% more time. Deep reparse
is effectively tied; the separately timed immutable edit takes 4.5% more
time in this run. These small descriptive samples do not establish a
statistically significant render speedup. All 30 measured batches have the
same input and complete-render fingerprints; each renders 128,890 bytes.
Deep reparse stays native in both modes, with no JS node inspection in the
pipeline.

Native render-body time is 1.884 µs per object root versus 1.514 µs per arena
root. The JS-inclusive render phase above also includes boundary conversion,
loop and instrumentation overhead. Rust allocations per root are identical
across the 15 measured batches within each mode:

| Render scope | Object calls/root | Arena calls/root | Object bytes/root | Arena bytes/root |
| --- | ---: | ---: | ---: | ---: |
| Whole Rust boundary | 10 | 8.0016 | 1,781.889 | 368.1464 |
| Native body | 9 | 6.0006 | 1,717.889 | 240.0648 |

These are cumulative allocation calls and bytes, not retained bytes. Arena
whole-boundary frees are 8.0012 calls and 368.1256 bytes per root; registration
metadata can outlive a render call. Object allocation and deallocation totals
match. Build and immutable edit make no Rust allocation calls. The counters
exclude V8/C++ and the separate parser addon.

Untimed GC-settled memory deltas are medians of five workers, in MiB. The
second population retains all original roots plus edited roots sharing their
unchanged children. Neither population is rendered, so it excludes native
registration metadata allocated by first render.

| Process field | Objects: built | Arena: built | Objects: originals + edits | Arena: originals + edits |
| --- | ---: | ---: | ---: | ---: |
| `heapUsed` | 15.742 | 12.287 | 29.170 | 24.562 |
| `heapTotal` | 18.250 | 19.750 | 29.750 | 32.000 |
| `external` | 0.000 | 4.027 | 0.000 | 8.027 |
| `arrayBuffers` (part of `external`) | 0.000 | 4.027 | 0.000 | 8.027 |
| RSS | 0.016 | 0.391 | 2.625 | 6.798 |
| `heapUsed` + `external` | 15.742 | 16.314 | 29.170 | 32.589 |

Arena lowers JS heap usage, but heap plus external memory is 3.6% higher for
built roots and 11.7% higher with both snapshots. These process observations
do not provide complete native retained-memory accounting. RSS reflects
allocator reuse; array buffers must not be added to external memory again.
Exact occupied bytes, capacity and chunk slack equal the historical table
below. Generic cell size, chunk slack, registration accounting, bounded
inline children and broader workloads remain open before public cutover.

[Raw paired samples](../results/2026-10-22-eager-optimized-storage-darwin-arm64.json),
[independently recomputed statistics](../results/2026-10-22-eager-optimized-analysis.json),
and [source/native provenance and checks](../results/2026-10-22-eager-optimized-provenance.json)
retain this run separately from the historical baseline. Its absolute
old/new timings include both runtime changes and a different native release
profile, so they cannot isolate the effect of either change.

## Historical baseline

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

The build increase is accepted for this stage. This revision's render
regression prompted the optimization work above; the measurements below
preserve its baseline. The current paired run above confirms render parity
for the optimized prototype.

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
