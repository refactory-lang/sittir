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

Runs paired parsed-corpus storage measurements, or a native parse/hydrate/render workflow selected by nativeDepth, in separate fresh GC-enabled processes. Validates settings before spawning; alternates which storage runs first, optionally gates each worker on machine idleness, refuses mismatched work, and writes raw samples plus per-round median summaries. Process startup and import costs are excluded from worker timers.

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

### `packages/tools/src/profile/storage.ts::retainedMemory`

Summarizes signed baseline-to-retained deltas for the five process memory fields across worker rounds. Shared by JS-inspection and native-only reports; external memory and array buffers overlap and must not be added.

### `packages/tools/src/profile/storage.ts::summarizeNativeHydration`

Requires identical corpus, depth, eligible/root-record counts, render bytes/hash and stage-labelled refusal populations across native rounds. Summarizes each phase's per-round batch medians and retained-memory deltas without comparing them as object/arena timings.

### `packages/tools/src/profile/storage.ts::runWorker`

Runs the chosen JS-inspection or native-only worker in a fresh GC-enabled production Node process, after the optional idle gate. Adds round and idle observations; startup and imports remain outside worker timers.

### `packages/tools/src/profile/storage-common.ts::collectGarbage`

Requires exposed GC and gives native finalizers three GC/event-loop turns to settle outside timing regions.

### `packages/tools/src/profile/storage-common.ts::corpusFingerprint`

The shared corpus-entry count, UTF-8 byte count and SHA-256 of names/sources used by both JS-inspection and native-only workers. Population fingerprints use the same ordered input encoding.

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

### `packages/tools/src/profile/native-hydration.ts::NativeHydrationSample`

A native worker's hydration depth, complete-workflow root count, retained roots with records, stage-labelled refusals, rendered output fingerprint, memory samples and five phase durations. Root counts do not count individual records or native allocations.

### `packages/tools/src/profile/native-hydration.ts::NativeContext`

The shared raw native engine, tree disposal capability, ordered corpus, normalized numeric native depth and GC-settling callback for a native workflow measurement. It carries no JS node wrappers or copied chunks.

### `packages/tools/src/profile/native-hydration.ts::withNativeTrees`

Parses a selected corpus population into raw native tree IDs, supplies parse start/end timestamps to the callback, and releases every successfully created tree in a finally block, including on parse or callback failure. Disposal is outside all recorded timers.

### `packages/tools/src/profile/native-hydration.ts::nativePopulation`

Hydrates all roots without exporting records and samples GC-settled memory with all syntax trees retained. Then preflights address-based rendering, fingerprints the output and records complete-workflow eligibility and stage-labelled refusals. Refused inputs remain in the memory population and leave the timed population.

### `packages/tools/src/profile/native-hydration.ts::timeNativeAfterShallow`

Times native hydration at the requested depth after a depth-one read prepared outside the timer, using the same eligible roots as the complete workflow. Verifies the root-record count outside timing and disposes each batch explicitly.

### `packages/tools/src/profile/native-hydration.ts::sampleNativeHydration`

Runs one raw engine's retained-memory and parse/hydrate/render workflow measurements, plus hydration after a shallow read. Requires the native record entry points and transfers only parse metadata, addresses and rendered strings. Always disposes the engine.

### `packages/tools/src/profile/native-hydration.ts::renderFingerprint`

The framed SHA-256 and UTF-8 byte count of rendered roots in corpus order. Shared by preflight and iteration checks, all outside timing; a changed output fails the run.

### `packages/tools/src/profile/native-hydration.ts::timeNativeWorkflow`

Measures parse, native hydration and address-based rendering sequentially on the same fresh corpus batch, plus the total workflow duration. Checks the rendered bytes/hash and record-address presence after timing. Normal source folding remains enabled; no record inspection or chunk transfer occurs.

### `packages/tools/src/profile/native-hydration.ts::nativePhases`

The native report's phase keys, shared by sample initialization and summary aggregation: parse, hydrate, render, total pipeline and hydration after a shallow read.

### `packages/tools/src/profile/native-hydration-worker.ts::NativeHydrationOptions`

A fresh worker's grammar, explicit positive hydration depth or all, warmup and measured iteration counts, and optional corpus smoke limit. Serialized all becomes Infinity only at the native call.

### `packages/tools/src/profile/native-hydration-worker.ts::NativeHydrationRun`

A native hydration sample with grammar, fresh worker PID and the same ordered corpus fingerprint as the object/arena benchmark. The parent adds round and idle-gate provenance.

### `packages/tools/src/profile/native-hydration-worker.ts::sampleNative`

Loads the grammar's native hooks and corpus, then measures native parse, requested-depth hydration and address-based rendering in a fresh process without constructing wrapped nodes. Returns raw samples plus worker and corpus provenance.
