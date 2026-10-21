# `packages/tools/src/profile` — Function Glossary

### `packages/tools/src/profile/trivia-timing.ts::run`

`sittir tool trivia-timing`: parses one file deep with the grammar's engine, then times reading every node's leading trivia, best of `rounds`. Each read asks the native engine for the node's line gaps once, addressing a deep read's node by its tree, span and stamped kind, so the time is dominated by finding that node again (`node_at_span`). Per-node cost that grows with the file means the lookup scales with the file's width rather than its depth. Prints one line, or the timing as JSON.

### `packages/tools/src/profile/trivia-timing.ts::measureTriviaTiming`

The measurement `run` prints: the file's size in bytes, the number of nodes read, the best round's time and the time per node. The walk and the parse sit outside the timed loop, so only the trivia reads are measured.

### `packages/tools/src/profile/trivia-timing.ts::TriviaTimingOptions`

The grammar, the file, the number of rounds, and whether to print JSON.

### `packages/tools/src/profile/trivia-timing.ts::TriviaTiming`

One measurement: grammar, file, bytes, nodes, the best round in milliseconds, and microseconds per node.

### `packages/tools/src/profile/trivia-timing.ts::ReadNode`

A read node as the timing calls it: a node the slot readers reach (`wrappedNodesOf`), with its `$trivia` reader.

### `packages/tools/src/profile/storage.ts::run`

Runs paired parsed-corpus storage measurements in fresh GC-enabled processes. Validates settings before spawning; alternates which storage runs first, optionally gates each worker on machine idleness, refuses mismatched work, and writes raw samples plus per-round median summaries. Process startup and import costs are excluded from the worker timers.

### `packages/tools/src/profile/storage.ts::validatePair`

Admits a timing comparison only when corpus fingerprints, visited kinds/text counts, per-phase work units, root-render output digest and refused root population match. Timing and memory values deliberately differ and are excluded from this equivalence check.

### `packages/tools/src/profile/storage.ts::median`

The middle value of a sorted sample, or the mean of its two middle values. An empty sample is an error.

### `packages/tools/src/profile/storage.ts::summarize`

Requires an identical workload fingerprint across every round of a grammar, then summarizes each phase using the median batch duration within each worker round, then the median across rounds, preserving ranges of round medians. Reports normalized time per work unit and signed retained-memory deltas; external memory and array buffers overlap and are not summed.

### `packages/tools/src/profile/storage.ts::integer`

Refuses non-integer or out-of-range benchmark settings before any subprocess is started.

### `packages/tools/src/profile/storage.ts::StorageBenchOptions`

Configuration for the object/arena corpus comparison: grammar selection, rounds, warmup and measured batches, optional smoke limit, per-worker idle-gate script and JSON output path. Omitted values use the command's documented defaults.

### `packages/tools/src/profile/storage-worker.ts::collectGarbage`

Requires exposed GC and gives native finalizers three GC/event-loop turns to settle outside timing regions.

### `packages/tools/src/profile/storage-worker.ts::walk`

Consumes nodes through the shared public-slot walker, optionally accessing their text. Counts nodes, kind ids and text units as observable work; an accessor refusal fails the sample.

### `packages/tools/src/profile/storage-worker.ts::engineFor`

Creates the selected grammar's engine with explicit object or arena parsed-node storage.

### `packages/tools/src/profile/storage-worker.ts::retainedPopulation`

Measures GC-settled memory for one held corpus population before and after text access. Records root-render refusals and a digest of successfully rendered text outside timers. Returned data contains counts and samples, not the held roots.

### `packages/tools/src/profile/storage-worker.ts::timePhase`

Times corpus parse/root read, cold public-slot walks, warm text walks, or root render calls. Every iteration has fresh roots; the warm phase traverses those roots first. GC, preparation, warmup samples and work verification are outside recorded durations.

### `packages/tools/src/profile/storage-worker.ts::sampleStorage`

Loads the matched upstream/local corpus and slot readers, records retained memory before timed workloads, and measures each phase with the same native engine. Always disposes the engine, including when sampling fails. The worker reports its PID and corpus digest for provenance.

### `packages/tools/src/profile/storage-worker.ts::StorageWorkerOptions`

A fresh worker's grammar, storage mode, warmup and measured batch counts, with an optional corpus-entry limit for smoke runs. The parent validates these settings before starting the worker.

### `packages/tools/src/profile/storage-worker.ts::WalkResult`

Consumed public-walk work: visited-node count, sum of kind IDs, and accessed text length. These checksums must agree across storage modes and rounds; they are not elapsed-time measurements.

### `packages/tools/src/profile/storage-worker.ts::StorageSample`

One fresh process's raw parsed-corpus measurement, including corpus/render fingerprints, walk work, GC-settled memory samples, per-phase batch durations and render refusals. The parent verifies workload equality before aggregation.

### `packages/tools/src/profile/storage-worker.ts::TimingContext`

Prepared engine, corpus, slot readers, retained-population facts and worker settings used by each timed phase. Preparation and correctness checks remain outside the phase timer.
