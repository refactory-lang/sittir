# Native parse, hydrate and render corpus benchmark

`sittir tool bench-storage` measures the native workflow over the upstream and
local corpora used by the storage parity test. It parses fresh syntax trees,
hydrates records to the requested depth in Rust, then renders using native
record addresses. It never constructs JavaScript node views or requests node
text or arena chunks. Built-node construction and edits need separate workloads.

## Running

Build workspace packages first (`pnpm run build`). From the repository root:

```sh
pnpm exec tsx packages/cli/src/cli.ts tool bench-storage --output native-workflow.json
```

Defaults: all five stable grammars, full-depth hydration, five fresh-process
rounds per grammar, two warmup batches and three measured batches per phase.
Use `--native-depth 2` for bounded hydration, or `--native-depth all` explicitly.
Each round runs in a fresh Node process with `--expose-gc` and
`NODE_ENV=production`. Startup, imports and input loading are outside timers.

A short functional smoke run:

```sh
pnpm exec tsx packages/cli/src/cli.ts tool bench-storage regex \
  --rounds 2 --warmup 0 --iterations 1 --limit 5 --output smoke.json
```

For measurements, use a copy outside watched directories, keep the machine
otherwise idle, and gate each worker with the existing idle script:

```sh
node packages/cli/dist/cli.js tool bench-storage \
  --idle-gate docs/superpowers/probes/2026-10-01-shared-arena/timing/idle.sh \
  --output native-workflow.json
```

The script receives the run directory and requires at least 75% CPU idle
and no Infigraph watcher under that directory. Every sample records its idle
observation. A report without the flag says `idleGated: false`; smoke timings
are functional checks, not measurement evidence.

## Timed work

| Phase | Included | Prepared outside the timer |
| --- | --- | --- |
| `parse` | Parse a fresh corpus batch into native trees | Native engine and corpus |
| `hydrate` | Hydrate native root records to the requested depth | The same freshly parsed batch |
| `render` | Render those records by native address to strings | The same hydrated batch |
| `pipeline` | The complete parse → hydrate → render sequence | Native engine and corpus |
| `afterShallow` | Hydrate to the requested depth | Fresh trees and a depth-one native record read |

The first four timings come from the same iteration. Independently summarized
medians need not add exactly. The separate `afterShallow` workload measures
incremental hydration after a shallow read.

Each worker preflights hydration and rendering before measurement. Refused
inputs are listed by entry and stage; roots without records are render refusals.
Only roots that hydrate and render successfully enter the timed workflow.
Output bytes and hashes, requested depth and refusal populations must agree
across iterations and rounds. Corpus fingerprints use ordered names and source.

Parsing includes the addon's small tree-ID JSON result. Hydration returns
addresses; rendering transfers the resulting strings to JS. Assertions, output
hashing, warmup samples, explicit GC and tree disposal are outside timers.
Rendering uses normal options, so unchanged regions may use native source
slices. This does not force every record through template reconstruction or
isolate native decode cost.

Schema version 3 reports contain only `nativeSamples` and `nativeSummary`.
They retain every batch duration and worker PID. Summaries take each round's
median batch, then the median across rounds; ranges cover the round medians,
and normalized times use the number of eligible roots.

## Native hydration

Rust's `ParsedTree::hydrate_record::<AnyNode>(index, depth)` and the raw addon
method `hydrateRecord(treeId, index, depth?)` materialize parsed records without
exporting them. The addon returns an address, or null for a leaf or error node.
The API defaults to depth one and accepts positive integers or `Infinity` for
all levels; the benchmark defaults to all. Grammar minimum depths still apply.

Deeper hydration reaches children of cached parents. Existing records retain
their words and addresses; newly hydrated children enter the append-only row
index. `readRecord` keeps its cached-read behavior. The generated writer
traverses native values, lists and envelope content. Temporary typed values
are still created in Rust; this is not an allocation-free read or a direct
view of Tree-sitter memory.

`hydrateSlot` reads and wraps a slot in JavaScript. Native hydration performs
materialization without that wrapping or chunk transfer. Fetching an arena
copy remains a separate `chunk` operation. Parsed record rendering uses the
Rust-owned arena; the planned built-node path supplies JS-owned arena buffers
for Rust to borrow during the call.

## Retained memory

Each fresh worker takes a GC-settled baseline with its engine and loaded inputs
held, parses and hydrates the corpus, then samples with all syntax trees and
arenas retained. Inputs that refuse hydration remain in this memory population.
Memory is sampled before the render preflight. Every batch's native tree IDs
are explicitly disposed outside the timer, including on failure.

Raw samples include `heapUsed`, `heapTotal`, `external`, `arrayBuffers` and
`rss`; summaries report median signed deltas from the baseline. Array buffers
are part of external memory, so those fields must not be summed. Small V8 heap
deltas include the harness's IDs, addresses and bookkeeping, not node views.

These are process-level observations. Native Rust memory contributes to RSS
and is not fully attributed by V8's external-memory field. Allocator reuse,
first-use runtime allocations and RSS page granularity can dominate small
populations. These measurements do not supply native allocation counts,
record capacity/slack or precise native bytes per node.

## Recorded native workflow runs

[Full-depth raw samples](results/2026-10-21-native-depth-all-darwin-arm64.json), [depth-2 raw samples](results/2026-10-21-native-depth-2-darwin-arm64.json), and [source/native provenance](results/2026-10-21-native-provenance.json).

Recorded 2026-10-21T19:56:32.516Z to 2026-10-21T19:59:32.269Z on Apple M4 Pro / Darwin 27.2.0 arm64 / Node v26.12.0. Each depth used five rounds per grammar, two warmup batches and three measured batches per operation. All 50 distinct workers passed the unchanged idle gate (76–90% idle). The full-depth command omitted the depth flag, exercising the default. Source base `a57d72e652c84633f0b959fb16076766843657ad`, the source overlay, compiled harness and native binaries are fingerprinted in the provenance.

Both depths completed all 440 corpus entries with zero hydration or render refusals. Corpus fingerprints and output bytes/hashes match across iterations, rounds and depths. All timing and memory statistics were independently recomputed from the raw samples.

### Timing medians

Milliseconds per complete corpus batch. Ranges and nanoseconds per eligible root remain in the raw reports.

| Grammar | Depth | Roots | Parse ms | Hydrate ms | Render ms | Pipeline ms | After shallow ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| python | all | 116 | 2.499 | 3.577 | 1.598 | 7.722 | 3.323 |
| regex | all | 37 | 0.261 | 0.436 | 0.220 | 0.926 | 0.404 |
| rust | all | 149 | 2.750 | 3.786 | 1.692 | 8.240 | 3.504 |
| scm | all | 19 | 0.335 | 0.449 | 0.234 | 1.021 | 0.432 |
| typescript | all | 119 | 2.471 | 2.932 | 1.310 | 6.664 | 2.828 |
| python | 2 | 116 | 2.494 | 0.716 | 1.608 | 4.840 | 0.608 |
| regex | 2 | 37 | 0.263 | 0.111 | 0.229 | 0.613 | 0.085 |
| rust | 2 | 149 | 2.676 | 0.869 | 1.637 | 5.225 | 0.756 |
| scm | 2 | 19 | 0.341 | 0.157 | 0.247 | 0.743 | 0.124 |
| typescript | 2 | 119 | 2.440 | 0.665 | 1.339 | 4.472 | 0.599 |

### Retained-memory deltas

Median signed process deltas from the loaded-engine baseline, MiB, sampled after hydration and before render preflight. The remaining process fields are retained in the raw reports. These are not native allocation counts.

| Grammar | Depth | Heap used MiB | RSS MiB |
| --- | --- | ---: | ---: |
| python | all | 0.106 | 2.453 |
| regex | all | 0.100 | 0.422 |
| rust | all | 0.109 | 3.016 |
| scm | all | 0.086 | 0.516 |
| typescript | all | 0.106 | 2.297 |
| python | 2 | 0.106 | 2.109 |
| regex | 2 | 0.100 | 0.422 |
| rust | 2 | 0.109 | 2.703 |
| scm | 2 | 0.086 | 0.391 |
| typescript | 2 | 0.106 | 2.047 |
