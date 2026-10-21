# Object, arena and native workflow corpus benchmarks

`sittir tool bench-storage` compares parsed object nodes and arena views using
the upstream and local corpora that the storage parity test uses. Both modes
use the same compiled native addons and corpus entries. This is initial
parsed-storage evidence; eager built-node and native decode measurements
remain separate work.

## Running

Build workspace packages first (`pnpm run build`). From the repository root:

```sh
pnpm exec tsx packages/cli/src/cli.ts tool bench-storage --output storage.json
```

Defaults: all five stable grammars, five rounds per grammar and mode, two
warmup batches, three measured batches per timing phase. Each mode/round
runs in a fresh Node process with `--expose-gc` and `NODE_ENV=production`.
The order alternates object/arena, then arena/object. Node startup, module
loading, model loading, assertions, fingerprinting and explicit GC are
outside the timers.

A short functional smoke run:

```sh
pnpm exec tsx packages/cli/src/cli.ts tool bench-storage regex \
  --rounds 2 --warmup 0 --iterations 1 --limit 5 --output smoke.json
```

For measurements, run a copy outside watched directories, keep the machine
otherwise idle, and gate each worker with the existing idle script:

```sh
node packages/cli/dist/cli.js tool bench-storage \
  --idle-gate docs/superpowers/probes/2026-10-01-shared-arena/timing/idle.sh \
  --output storage.json
```

The idle script receives the run directory and waits for 75% CPU idle and
no Infigraph watcher under that directory. Its observed idle percentage is
stored with every raw sample. A run without the flag is explicitly marked
`idleGated: false`; smoke timings are not measurement evidence.

## Timed work

| Phase | Included | Prepared outside the timer |
| --- | --- | --- |
| `parse-read` | Parse each corpus entry and obtain its wrapped root | Native engine, descriptor, corpus and slot readers |
| `walk-structure-cold` | Traverse every public slot, count nodes/kinds | Fresh parsed roots |
| `walk-text-cold` | Traverse every public slot and read each available node text | Fresh parsed roots |
| `walk-text-warm` | Repeat the traversal and text reads | Fresh roots and one complete traversal with text |
| `render` | Render the root of every renderable corpus entry to a string | Fresh roots and a common renderable-entry selection |

Cold phases get new roots on every iteration. Corpus batches are retained
for the duration of a timed operation, then released before GC outside the
next timer. The shared public-slot walker reports accessor refusals as hard
errors; the benchmark does not silently skip a slot. Root render refusals
are listed by corpus entry in the report and excluded from the timed render
population. Different refusal populations or rendered bytes between modes
fail the comparison.

Parsed records are written in Rust. JavaScript field access obtains copies
of native chunks for inspection. A record render sends the tree ID, record
address, edge flags and options; Rust reads its own arena directly, without
sending those chunk copies back. Rendering can use a native source slice
or Rust-owned records. The planned eager-builder path supplies JS-owned
arena buffers for Rust to borrow during the call. This benchmark does not
force or measure those three render paths independently.

Reports keep every batch duration. Summaries use the median batch in each
round, then the median across rounds; ranges cover the round medians. Times
are also normalized per entry, visited node, or rendered root. `arena/object`
below one means the arena mode was faster for that phase. Corpus hashes,
node counts, walk checksums and timed work units must match between modes.
The same fingerprint is required across all rounds, so changing corpus
inputs during a run refuses aggregation rather than mixing populations.

## Retained memory

Each fresh worker samples memory before timing, with its engine and loaded
inputs held. It takes a GC-settled baseline, parses and fully walks the
corpus without text, then samples again with all roots retained. It accesses
text on the same held population and takes a third GC-settled sample.
Temporary text strings are not artificially retained by the harness.
Parsed arenas belong to tree tokens, not to the parsing engine's disposal
call: views, snapshots and deferred render handles keep their trees alive.
The harness releases roots and settles GC between timing iterations; the
fresh worker process bounds each round's lifetime.

Raw baseline/structure/text samples include `heapUsed`, `heapTotal`,
`external`, `arrayBuffers` and `rss`; summaries report median signed deltas
from the baseline. The nodes held are counted for normalization. Array
buffers are part of external memory, so those fields must not be summed.

These are process-level retained-memory observations. Native Rust memory
contributes to RSS and is not fully attributed by V8's `external` field.
Allocator reuse, first-use runtime allocations, JIT and RSS page granularity
can dominate small populations; signed deltas are retained rather than
clamped. This does not supply native allocation counts, record capacity/slack,
or a precise native bytes-per-node figure. Those require the fuller native
measurement work. Root rendering can take the unchanged-source fast path;
it does not isolate native record decode cost.

## Native hydration without exporting records

The native Rust method `ParsedTree::hydrate_record::<AnyNode>(index, depth)`
and raw addon method `hydrateRecord(treeId, index, depth?)` materialize
parsed records without fetching chunks or creating JavaScript node views.
The addon returns only a record address, or null for a leaf or error node.
Depth defaults to one; the addon accepts a positive integer or `Infinity`
for all levels. Rust uses the reader's existing `Depth` type. Grammar minimum
depths apply as they do to ordinary reads.

A deeper hydration request also reaches children of cached parents. Existing
records keep their words and addresses; new child records enter the tree's
append-only row index. `readRecord` remains the cached read/address path;
explicit `hydrateRecord` ensures the requested depth. The generated writer
traverses the values the native reader produced, including lists and envelope
content. It still creates temporary typed values in Rust; this is not an
allocation-free read or a direct view of Tree-sitter memory.

`hydrateSlot` is the JavaScript accessor helper that reads and wraps a slot.
Native hydration supplies the materialization operation without that wrapping
or chunk transfer. Fetching an arena copy remains an explicit `chunk` call.

To benchmark native parse, hydration and render in fresh workers:

```sh
node packages/cli/dist/cli.js tool bench-storage --native-depth all \
  --idle-gate docs/superpowers/probes/2026-10-01-shared-arena/timing/idle.sh \
  --output native-workflow.json
```

Use `--native-depth 2` for a bounded read. This selects a separate run:
`nativeSamples` and `nativeSummary` contain its results; the object/arena
sample arrays are empty. Native and JS-inspection measurements never share
a worker process. Reports use schema version 2; the earlier recorded report
below retains its original version and provenance.

Each native worker samples GC-settled memory with all parsed syntax trees
and their successfully hydrated arenas retained. Inputs that refuse the
requested depth remain listed by stage; their syntax trees are included in
retained memory. Memory is sampled before the render preflight. The complete
workflow times only roots that both hydrate to a record and render successfully;
roots with no record are listed as render refusals. The report counts these
eligible roots and the retained roots with a record, not individual records
or native allocations.

Each iteration parses fresh trees, hydrates their roots to the requested
depth, then renders using the returned arena addresses. It records separate
`parse`, `hydrate` and `render` durations and their complete `pipeline`
duration on the same population. A separate `afterShallow` timer measures
hydration after a depth-one native read. Shallow preparation, assertions,
output hashing, warmup samples, explicit GC and tree disposal are outside
recorded durations. Parsing includes the addon's small tree-ID JSON result;
rendering includes the resulting string transfer to JS. No object reads,
JS node wrappers, text requests or chunk copies occur. Output bytes and hashes,
depth and refusal populations must agree across iterations and rounds.

Rendering uses the record entry point with normal options, so unchanged
regions may still use source slices. This measures the actual hydrated
workflow; it does not force every record through template reconstruction
or isolate native decode cost.

## Recorded native workflow runs

[Full-depth raw samples](results/2026-10-21-native-depth-all-darwin-arm64.json), [depth-2 raw samples](results/2026-10-21-native-depth-2-darwin-arm64.json), and [source/native provenance](results/2026-10-21-native-provenance.json).

Recorded 2026-10-21T19:09:32.297Z to 2026-10-21T19:11:57.985Z on the same Apple M4 Pro / Darwin 27.2.0 arm64 / Node v26.12.0 host. Each depth used five rounds per grammar, two warmup batches and three measured batches per operation, in 25 fresh workers. All 50 workers passed the unchanged idle gate (77–89% idle). The source base was `d179620aac5a6039151142956bcf4ba80769e80e`; the overlay, implementation files, compiled harness and rebuilt native binaries are fingerprinted in the provenance.

Both depths completed all 440 corpus entries, with zero hydration or render refusals. Corpus fingerprints match the earlier object/arena run. Output bytes and hashes match across iterations, rounds and depths. This establishes a native workflow measurement without JS inspection; the earlier public-slot walks measure different work and are not used as a timing ratio here.

### Native timing medians

Milliseconds per complete corpus batch. Each pipeline duration covers the same iteration as its parse, hydrate and render components. Independently summarized medians need not add exactly. `afterShallow` measures only hydration after a depth-one read prepared outside its timer. Ranges and nanoseconds per entry remain in the raw reports.

| Grammar | Depth | Roots | Parse ms | Hydrate ms | Render ms | Pipeline ms | After shallow ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| python | all | 116 | 2.636 | 3.549 | 1.629 | 7.751 | 3.424 |
| regex | all | 37 | 0.279 | 0.439 | 0.222 | 0.932 | 0.432 |
| rust | all | 149 | 2.739 | 3.687 | 1.690 | 8.125 | 3.541 |
| scm | all | 19 | 0.343 | 0.483 | 0.239 | 1.084 | 0.446 |
| typescript | all | 119 | 2.500 | 3.096 | 1.321 | 6.879 | 2.921 |
| python | 2 | 116 | 2.529 | 0.724 | 1.643 | 4.874 | 0.607 |
| regex | 2 | 37 | 0.261 | 0.110 | 0.229 | 0.601 | 0.082 |
| rust | 2 | 149 | 2.818 | 0.882 | 1.725 | 5.426 | 0.777 |
| scm | 2 | 19 | 0.344 | 0.156 | 0.244 | 0.770 | 0.129 |
| typescript | 2 | 119 | 2.468 | 0.723 | 1.336 | 4.541 | 0.579 |

### Native retained-memory deltas

Median signed process deltas from the loaded-engine baseline, MiB, sampled after hydration and before the render preflight. All roots remain native; the small V8 heap delta includes the harness's tree IDs, addresses and bookkeeping. RSS includes retained native state, allocator reuse and temporary-read high-water effects. These observations do not count native allocations or isolate arena capacity, and are not a total-memory comparison with the public-slot benchmark. All five memory fields remain in the raw reports.

| Grammar | All: heapUsed MiB | All: RSS MiB | Depth 2: heapUsed MiB | Depth 2: RSS MiB |
| --- | ---: | ---: | ---: | ---: |
| python | 0.106 | 2.453 | 0.106 | 2.141 |
| regex | 0.100 | 0.453 | 0.100 | 0.391 |
| rust | 0.109 | 3.047 | 0.109 | 2.609 |
| scm | 0.086 | 0.391 | 0.086 | 0.344 |
| typescript | 0.106 | 2.250 | 0.106 | 1.984 |

Native hydration still constructs temporary typed Rust values. Normal render folding remains enabled, so these runs do not isolate record decoding or force reconstruction of every node. Eager built/edit workloads and precise native allocation/capacity measurements remain separate.

## Recorded object/arena run

[Raw samples](results/2026-10-21-darwin-arm64.json) and [source/native provenance](results/2026-10-21-provenance.json).

Recorded 2026-10-21T17:40:47.230Z to 2026-10-21T17:45:59.148Z: Node v26.12.0, Darwin 27.2.0 arm64, Apple M4 Pro (14 logical CPUs). The run used an unwatched copy, five alternating rounds per mode and grammar, two warmup batches and three measured batches per phase. All 50 workers passed the unchanged idle gate (75–95% idle). All corpus and work fingerprints matched; no corpus root refused rendering. The source base was `339ec8574fbcb0fbea67d62371e4e3f21c9eadbf`, with the benchmark overlay and copied native binaries fingerprinted in the provenance file.

The first attempt stopped at the idle gate during sustained host CPU load. Its timings are excluded; the successful run is a fresh complete run with the same threshold and code.

In this implementation, cold structural walks cost 22–33% more in arena mode, and warm walks with text take 1.31–3.58 times the object time. Parse/root-read times are mostly close; unchanged-root renders are slightly faster. Retained V8 heap is 59–77% lower for structure and 58–75% lower after text access. RSS does not improve, so the V8 result is not a total-memory saving. These are parsed-corpus results, not isolated native decode or eager-builder results.

| Grammar | Corpus entries | Public nodes retained |
| --- | ---: | ---: |
| python | 116 | 5635 |
| regex | 37 | 674 |
| rust | 149 | 5058 |
| scm | 19 | 671 |
| typescript | 119 | 4081 |

### Timing medians

Times are milliseconds per complete corpus batch; ratios below one favor arena. Ranges of round medians and normalized nanoseconds per work unit remain in the raw report.

| Grammar | Phase | Object ms | Arena ms | Arena/object |
| --- | --- | ---: | ---: | ---: |
| python | `parse-read` | 4.140 | 4.146 | 1.001 |
| python | `walk-structure-cold` | 36.140 | 46.841 | 1.296 |
| python | `walk-text-cold` | 35.982 | 48.266 | 1.341 |
| python | `walk-text-warm` | 5.169 | 6.782 | 1.312 |
| python | `render` | 1.916 | 1.863 | 0.973 |
| regex | `parse-read` | 0.661 | 0.749 | 1.134 |
| regex | `walk-structure-cold` | 3.391 | 4.421 | 1.304 |
| regex | `walk-text-cold` | 3.398 | 4.280 | 1.260 |
| regex | `walk-text-warm` | 0.300 | 0.741 | 2.471 |
| regex | `render` | 0.321 | 0.288 | 0.897 |
| rust | `parse-read` | 4.583 | 4.501 | 0.982 |
| rust | `walk-structure-cold` | 30.594 | 40.728 | 1.331 |
| rust | `walk-text-cold` | 31.301 | 41.299 | 1.319 |
| rust | `walk-text-warm` | 2.680 | 6.918 | 2.582 |
| rust | `render` | 2.038 | 1.914 | 0.939 |
| scm | `parse-read` | 0.600 | 0.635 | 1.059 |
| scm | `walk-structure-cold` | 3.855 | 4.898 | 1.270 |
| scm | `walk-text-cold` | 3.847 | 5.074 | 1.319 |
| scm | `walk-text-warm` | 0.329 | 0.769 | 2.335 |
| scm | `render` | 0.289 | 0.262 | 0.907 |
| typescript | `parse-read` | 3.985 | 3.935 | 0.987 |
| typescript | `walk-structure-cold` | 24.567 | 29.853 | 1.215 |
| typescript | `walk-text-cold` | 24.020 | 30.056 | 1.251 |
| typescript | `walk-text-warm` | 2.376 | 8.507 | 3.580 |
| typescript | `render` | 1.591 | 1.535 | 0.965 |

### Retained-memory deltas

Median signed deltas from the loaded-engine baseline, MiB. These are process observations with the roots retained; `external`, array-buffer and heap-total samples are also in the raw report.

| Grammar | Accesses | Object heapUsed | Arena heapUsed | Object RSS | Arena RSS |
| --- | --- | ---: | ---: | ---: | ---: |
| python | Structure | 18.68 | 4.34 | 39.22 | 40.52 |
| python | Structure + text | 18.73 | 4.72 | 39.25 | 40.63 |
| regex | Structure | 2.46 | 0.80 | 1.16 | 2.22 |
| regex | Structure + text | 2.48 | 0.87 | 1.19 | 2.52 |
| rust | Structure | 17.77 | 5.03 | 31.32 | 32.85 |
| rust | Structure + text | 17.83 | 5.29 | 31.44 | 33.53 |
| scm | Structure | 2.43 | 0.99 | 1.42 | 2.72 |
| scm | Structure + text | 2.45 | 1.03 | 1.47 | 2.94 |
| typescript | Structure | 14.49 | 4.20 | 22.89 | 36.82 |
| typescript | Structure + text | 14.53 | 4.33 | 22.96 | 48.40 |
