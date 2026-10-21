# Arena storage workflow measurements

Without `--validation`, `sittir tool bench-storage` measures the native workflow over the upstream and
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

## Paired validation bucket profiling

The existing validators can be profiled directly under both parsed-node storage
settings, without a separate synthetic traversal:

```sh
node packages/cli/dist/cli.js tool bench-storage --validation \
  --idle-gate docs/superpowers/probes/2026-10-01-shared-arena/timing/idle.sh \
  --output validation-storage.json
```

This uses the complete upstream/local corpus for deep `read-render-parse`,
raw `factory-render-parse` and `ir-render-parse`. Each storage/round gets a fresh
GC-enabled production worker; object/arena order alternates by round. Defaults
are five rounds per grammar/storage, two warmup runs and three measured runs
per bucket. Bounded depth and corpus limits are rejected in validation mode.

Schema version 4 contains `validationSamples` and `validationSummary`. Each
worker runs the canonical validators and preserves their normal pass, fail,
skip, exclusion, AST-match and separator-tolerance behavior. The complete
validator-result digest, ordered candidate identities and phase call/throw counts
must agree across iterations, storages and rounds. Rendered bytes/hash must be
stable within each storage mode; factory and IR output must also agree between
storages. Deep read retains both output fingerprints: native source folding and
object reconstruction may produce equivalent ASTs with different whitespace.
Candidate identities include entry name, source digest, kind and byte span.
A matching aggregate pass count cannot hide a changed candidate or output.

| Timer | Included | Excluded from this phase |
| --- | --- | --- |
| `validator` | The complete existing bucket run, including preparation, candidate enumeration, checks and profiling overhead | Explicit GC, worker startup/imports and warmup runs |
| `read` | Explicit deep root read before enumeration, then object candidate materialization or native candidate-address selection; reference materialization for factory/IR | Initial parse, candidate enumeration and filtering |
| `build` | Recursive construction of the factory/IR tree sent to rendering | Read-reference preparation, separate factory-storage check and AST/storage comparisons |
| `render` | Object candidate projection and primary native render, or native arena candidate rendering; includes required bridge conversion | Output hashing, wrapper preparation and trivia-width probe renders |
| `parse` | Reparse of the wrapped rendered text with the validator's Tree-sitter parser | Finding the target node and comparing its AST |

The narrow phase timers do not sum to total validator runtime. Phase totals
include throwing attempts, which retain their existing refusal behavior.
Candidate and output hash updates happen outside the narrow operation timers
and inside the total validator observation. Digest finalization and complete
result serialization/hashing happen after that total timer stops. No additional
JS inspection walk or text-access workload is added by the profiler. The
validators retain their existing necessary reads and checks.

Deep read explicitly reads every accepted corpus entry's root to `Infinity`
before enumerating candidates. Under arena storage this calls native
`hydrateRecord(treeId, 0, Infinity)`, walks the generated record-cell schema
natively, receives only candidate coordinates and addresses, and renders through
native `renderCandidate`. The walk includes nested content sharing a row and
omits unit cells and presence flags, matching the object validator's typed tree.
Objects, arena words and node text are never exported to inspect that read.
Candidate framing removes the root's outer trivia in Rust while retaining its
inner trivia, and the existing reparse and AST checks consume the rendered text.
Object storage reads the root deeply into JS and uses its existing detached
candidate rendering. An explicitly requested fixture callback separately exports
a self-contained object input after validation; this profiler requests no fixtures.

Factory and IR constructors currently build objects under both storage settings.
The measurements therefore compare today's real buckets, including the parsed
reference data those validators read, and cannot establish the performance of
future eager packed builders. Normal native source folding remains enabled.

## Recorded paired validation run

[Raw paired samples](results/2026-10-21-validation-storage-darwin-arm64.json) and [source, compiled harness, native/WASM provenance and verification](results/2026-10-21-validation-provenance.json).

Recorded 2026-10-21T22:38:25.526Z to 2026-10-21T23:05:01.517Z on Apple M4 Pro / Darwin 27.2.0 arm64 / Node v26.12.0. Five rounds, two warmup runs and three measured runs per bucket used 50 distinct fresh workers. Storage order alternated each round. Every worker passed the unchanged idle gate (76–93% idle) in an unwatched snapshot. This session ran no builds or tests during measurement.

Source base `6746b2a5176cb37fc67ab7d5772128bf5de2198c`, the implementation overlay, complete runtime source, compiled runtime, five native addons and parser/upstream WASMs are fingerprinted in the provenance. Snapshot imports resolve inside the snapshot. Inputs were identical to the checked checkout and remained unchanged before and after timing. All reported timing medians, ranges and ratios were independently recomputed from raw batches.

### Whole-validator comparison

Each cell below sums the five grammar medians for a complete corpus batch. This is a descriptive aggregate, not the duration of one combined run. Arena/object below 1 means arena was faster. Narrow phases and checking overhead are included in these totals.

| Bucket | Object ms | Arena ms | Arena/object |
| --- | ---: | ---: | ---: |
| read-render-parse | 10,015.172 | 7,550.117 | 0.754× |
| factory-render-parse | 10,018.379 | 10,135.117 | 1.012× |
| ir-render-parse | 10,033.323 | 10,135.598 | 1.010× |

Factory and IR construct object trees under both storage settings. Their ratios include the cost of reading parsed reference nodes under the selected storage; these runs do not measure eager packed builders. Deep read uses native hydration, typed-cell candidate enumeration and candidate rendering for arena storage, with normal source folding enabled. The object path retains its existing detached candidate rendering.

### Per-grammar validator timings

Milliseconds per corpus batch, median of each worker’s three batches, then median across five rounds. Bracketed ranges cover round medians.

| Grammar | Bucket | Object ms [range] | Arena ms [range] | Arena/object |
| --- | --- | ---: | ---: | ---: |
| python | read-render-parse | 2,655.471 [2,645.749–2,684.393] | 1,742.709 [1,730.349–1,768.813] | 0.656× |
| python | factory-render-parse | 2,695.803 [2,679.684–2,710.268] | 2,747.381 [2,738.308–2,801.538] | 1.019× |
| python | ir-render-parse | 2,730.486 [2,727.049–2,740.104] | 2,791.680 [2,776.470–2,795.158] | 1.022× |
| regex | read-render-parse | 350.636 [343.682–355.748] | 286.245 [280.259–296.032] | 0.816× |
| regex | factory-render-parse | 360.225 [358.984–371.187] | 366.257 [363.712–369.231] | 1.017× |
| regex | ir-render-parse | 359.162 [355.407–364.290] | 359.334 [355.571–365.339] | 1.000× |
| rust | read-render-parse | 3,595.863 [3,590.993–3,610.322] | 2,837.084 [2,829.422–2,849.066] | 0.789× |
| rust | factory-render-parse | 3,577.400 [3,560.432–3,598.147] | 3,610.759 [3,600.704–3,613.996] | 1.009× |
| rust | ir-render-parse | 3,547.469 [3,544.142–3,570.981] | 3,566.302 [3,563.792–3,586.813] | 1.005× |
| scm | read-render-parse | 261.619 [259.721–278.657] | 167.985 [163.782–169.447] | 0.642× |
| scm | factory-render-parse | 231.103 [228.751–232.256] | 233.693 [232.033–235.162] | 1.011× |
| scm | ir-render-parse | 229.827 [229.538–234.953] | 232.424 [230.475–234.668] | 1.011× |
| typescript | read-render-parse | 3,151.582 [3,129.102–3,157.028] | 2,516.094 [2,511.870–2,539.397] | 0.798× |
| typescript | factory-render-parse | 3,153.848 [3,145.123–3,238.026] | 3,177.027 [3,170.482–3,191.751] | 1.007× |
| typescript | ir-render-parse | 3,166.379 [3,148.395–3,502.974] | 3,185.859 [3,175.612–3,194.228] | 1.006× |

### Narrow phase comparison

Sums of grammar medians, milliseconds. These exclude initial parsing, enumeration and validation checks as specified in the timer table above, so they do not sum to the whole-validator totals.

| Bucket | Phase | Object ms | Arena ms | Arena/object |
| --- | --- | ---: | ---: | ---: |
| read-render-parse | read | 264.513 | 31.623 | 0.120× |
| read-render-parse | build | 0.000 | 0.000 | n/a |
| read-render-parse | render | 834.262 | 50.177 | 0.060× |
| read-render-parse | parse | 68.024 | 65.254 | 0.959× |
| factory-render-parse | read | 79.014 | 133.477 | 1.689× |
| factory-render-parse | build | 1,813.800 | 1,815.261 | 1.001× |
| factory-render-parse | render | 110.570 | 110.800 | 1.002× |
| factory-render-parse | parse | 33.531 | 33.653 | 1.004× |
| ir-render-parse | read | 74.996 | 127.108 | 1.695× |
| ir-render-parse | build | 1,813.142 | 1,814.898 | 1.001× |
| ir-render-parse | render | 104.895 | 104.084 | 0.992× |
| ir-render-parse | parse | 31.845 | 31.752 | 0.997× |

### Workload parity

All 440 corpus entries have matching fingerprints. Deep read explicitly hydrated 436 accepted roots before enumeration; the existing one Python and three TypeScript parse-error skips remain. Ordered candidate identities, complete validator results, phase calls/throws and pass/fail/skip/AST-match counts match across storages, iterations and rounds. Render bytes/hash are stable within each mode, with exact factory/IR output equality between modes. Deep read retains separate output hashes for native folding and object reconstruction; both pass the same canonical AST checks.

| Bucket | Candidate cases per batch | Primary render calls per batch |
| --- | ---: | ---: |
| read-render-parse | 11,629 | 11,629 |
| factory-render-parse | 4,711 | 4,658 |
| ir-render-parse | 4,191 | 4,138 |

The two built buckets perform 8,796 primary renders in total, matching canonical built/reparse counts. Separate factory-storage checks and exclusions remain inside the complete validator observation. Full validation reports also match the baseline and each other: 193 normalized rows, +0/−0; all 29 raw count fields match for every grammar.
