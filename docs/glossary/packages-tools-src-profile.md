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

Runs either native parse/hydrate/render measurements or, with validation enabled, the canonical deep read, factory and IR validator buckets under both storages. Fresh workers keep engine caches independent; paired storage order alternates by round. Settings and complete workload fingerprints are checked before aggregation. The report discriminates native hydration from paired validation samples.

### `packages/tools/src/profile/storage-common.ts::median`

The middle value of a sorted sample, or the mean of its two middle values. An empty sample is an error.

### `packages/tools/src/profile/storage.ts::integer`

Refuses non-integer or out-of-range benchmark settings before any subprocess is started.

### `packages/tools/src/profile/storage.ts::StorageBenchOptions`

Shared runner settings for grammar selection, rounds, warmup and measured iterations, idle gating and JSON output. Validation mode compares the three existing full-corpus validator buckets across object and arena storage. Native mode defaults to full depth and also accepts bounded depth and a corpus smoke limit; those controls cannot silently restrict validation mode.

### `packages/tools/src/profile/storage.ts::retainedMemory`

Summarizes signed baseline-to-retained deltas for the five process memory fields across native worker rounds. External memory and array buffers overlap and must not be added.

### `packages/tools/src/profile/storage.ts::summarizeNativeHydration`

Requires identical corpus, depth, eligible/root-record counts, render bytes/hash and stage-labelled refusal populations across native rounds. Summarizes each phase's per-round batch medians and signed retained-memory deltas, preserving ranges and time per eligible root.

### `packages/tools/src/profile/storage.ts::runWorker`

Runs a named native-hydration or validation-storage worker in a fresh GC-enabled production Node process after the optional idle gate. Records round and idle observations; startup and module imports stay outside worker timings.

### `packages/tools/src/profile/storage-common.ts::collectGarbage`

Requires exposed GC and gives native finalizers three GC/event-loop turns to settle outside timing regions.

### `packages/tools/src/profile/storage-common.ts::corpusFingerprint`

The corpus-entry count, UTF-8 byte count and SHA-256 of ordered names and sources used by native workflow workers. Round aggregation requires the same population fingerprint.

### `packages/tools/src/profile/native-hydration.ts::NativeHydrationSample`

A native worker's timed entry count, roots with a record, stage-labelled refusals, rendered output fingerprint, memory samples and the durations of each phase in `nativePhases`. Root counts do not count individual records or native allocations.

### `packages/tools/src/profile/native-hydration.ts::NativeContext`

The backend each measurement makes its native engine from (`withRecordEngine`), the ordered corpus and the GC-settling callback for a native workflow measurement. It carries no JS node wrappers or copied chunks.

### `packages/tools/src/profile/native-hydration.ts::withRecordEngine`

Makes a native engine from the backend and hands the callback its records parse (`parseRecords`) and its render of a read record (`readRenderAt`). It refuses an addon without them, and disposes the engine in a finally block, including on a parse or callback failure. Disposal is outside all recorded timers.

### `packages/tools/src/profile/native-hydration.ts::nativePopulation`

Parses every root into the arena on one engine, which keeps no tree, and samples GC-settled memory with every parse's records held. Then preflights the render of each root's record, fingerprints the output and records complete-workflow eligibility and stage-labelled refusals; a root whose parse left no record is refused at render. Refused inputs remain in the memory population and leave the timed population.

### `packages/tools/src/profile/native-hydration.ts::sampleNativeHydration`

Runs the retained-memory population and the parse/render workflow measurements, each on its own engine of the backend. Requires the native record entry points and transfers only parse answers, addresses and rendered strings.

### `packages/tools/src/profile/native-hydration.ts::renderFingerprint`

The framed SHA-256 and UTF-8 byte count of rendered roots in corpus order. Shared by preflight and iteration checks, all outside timing; a changed output fails the run.

### `packages/tools/src/profile/native-hydration.ts::timeNativeWorkflow`

Measures the records parse, which hydrates the arena, and the render of each root's record sequentially on a fresh engine per iteration, plus their total. Checks the rendered bytes and hash against the population's after timing; a root with no record or a changed output fails the run. No record inspection or chunk transfer occurs.

### `packages/tools/src/profile/native-hydration.ts::nativePhases`

The native report's phase keys, shared by sample initialization and summary aggregation (`summarizeNativeHydration`): parse, render and the total pipeline.

### `packages/tools/src/profile/native-hydration-worker.ts::NativeHydrationOptions`

A fresh worker's grammar, warmup and measured iteration counts, and optional corpus smoke limit.

### `packages/tools/src/profile/native-hydration-worker.ts::NativeHydrationRun`

A native hydration sample with grammar, fresh worker PID and ordered corpus fingerprint. The parent adds round and idle-gate provenance.

### `packages/tools/src/profile/native-hydration-worker.ts::sampleNative`

Loads the grammar's native hooks and corpus, then measures the native records parse and the render of each root's record in a fresh process without constructing wrapped nodes. Returns raw samples plus worker and corpus provenance.

### `packages/tools/src/profile/validation-storage-worker.ts::ValidationStorageOptions`

One fresh worker's grammar, explicit parsed-node storage, warmup count and measured iteration count. It always exercises the full corpus and deep read validation.

### `packages/tools/src/profile/validation-storage-worker.ts::sampleValidationStorage`

Selects storage through the canonical validation switch before loading an engine, then profiles the actual deep read, raw factory and IR validators. Warmup, GC and memory capture are outside measured samples. GC-settled process snapshots bracket the complete validation workload; peak RSS is the process-lifetime high-water mark, including startup, warmups and all three buckets. Settled deltas describe memory after validation rather than a retained AST population. Each timing sample records total validator time plus instrumented phases, semantic-result, candidate and rendered-output fingerprints. Drift between iterations fails the worker; worker exit bounds cached native engine lifetime.

### `packages/tools/src/profile/validation-storage.ts::ValidationBucketSample`

One canonical validator bucket's counts, semantic-result digest, ordered candidate/output facts, per-phase call/throw counts and raw iteration durations. Total validator time includes preparation and AST checks; phase durations describe narrower operations.

### `packages/tools/src/profile/validation-storage.ts::ValidationStorageRun`

One fresh process's grammar, selected storage, PID, full ordered corpus fingerprint, all three validation bucket samples, GC-settled baseline/after memory snapshots and peak RSS in bytes. Memory is optional for historical samples recorded before this instrumentation. The parent adds round and idle-gate observations.

### `packages/tools/src/profile/validation-storage.ts::bucketFingerprint`

The non-timing identity of a bucket: complete validator-result digest, counts, ordered cases and phase call/throw counts, with exact rendered bytes by default. Deep read comparisons may omit byte details across storage modes because native source folding and object reconstruction can preserve different whitespace while passing identical AST checks. Every iteration and same-storage round still uses exact output identity.

### `packages/tools/src/profile/validation-storage.ts::summarizeValidationStorage`

Requires all canonical buckets, identical ordered work, complete validation results and call/throw counts across modes, and exactly paired distinct rounds. Rendered bytes must be stable within each storage mode; factory and IR bytes must also agree across modes. Deep read byte fingerprints are retained for both modes because their production render paths can format whitespace differently. Medians summarize iterations within workers, then medians and ranges across rounds; no expected winner is encoded.
