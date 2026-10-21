# Object and arena corpus benchmark

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

## Recorded run

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
