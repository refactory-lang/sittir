# Manual arena benchmarks

The **Arena benchmarks** workflow runs on request. Choose `eager`, `corpus`,
or `all`. It has no push, pull-request or scheduled trigger, no performance
threshold, and no required CI status. Broken runs, changed workload fingerprints
or changed runtime inputs still fail their job.

```sh
gh workflow run benchmarks.yml --ref feat/hardening -f benchmark=eager
gh workflow run benchmarks.yml --ref feat/hardening -f benchmark=corpus
```

GitHub requires the dispatcher definition to exist on the repository's default
branch before manual dispatch is available. Once it lands there, `--ref` selects
the branch to measure. An isolated launch branch can run the same reusable jobs
before that registration, using a push trigger restricted to that branch. It
does not add a trigger to the feature branch or a required CI status. See [GitHub's manual-run
contract](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

The dispatcher first calls a shared [build](../../../../.github/workflows/benchmark-build.yml)
workflow, then separate reusable [eager](../../../../.github/workflows/benchmark-eager.yml)
and [corpus](../../../../.github/workflows/benchmark-corpus.yml) workflows.
Jobs use Ubuntu 24.04 x64 runners, pinned Node 26.12.0 and the repository's pinned
Rust toolchain. TypeScript compiles once; each grammar addon and the optional
private eager addon build in parallel on separate runners. Public and private
addons use the workspace release profile. Benchmarks consume committed generated
source and parser WASMs; the normal generated-output CI gate owns regeneration.

Compiled TypeScript and native bundles are cached by exact commit, OS,
architecture and Node version. Cargo dependency caches also survive source
changes. Bundles preserve native freshness stamps and verify checksums, commit,
platform, architecture, Node ABI, Rust version, Cargo configuration and Rust flags
before restoration. Both benchmark workflows download the same build artifacts;
measurement runners do not compile or regenerate the runtime.

Eager generator verification restores both the public Rust addon and private
probe on a separate verification runner. It loads the cached bootstrap tooling
there before checking format metadata. Corpus depends only on public addon
builds and can proceed while eager verification runs; it does not wait for the
private probe. Corpus restoration excludes that optional addon so every grammar
shard fingerprints the same runtime even when uploads finish at different times.

Each job runs object and arena storage on that same runner in alternating fresh
workers, under the existing 75% idle gate. Eager construction uses 10,000
four-node functions, five pairs, two warmups and three measured batches. The
corpus run uses one runner per grammar in parallel, covering all five grammars
and all three existing RRP, factory and IR validation buckets. Each grammar
runner executes five pairs with the same warmups and batches. The 75% idle gate
samples cumulative CPU times portably on Linux and macOS.

Object and arena workers remain sequential on each grammar's runner; independent
grammar shards and the eager benchmark run on separate runners. Aggregation
requires every expected grammar exactly once, validates each shard's workload
and before/after runtime fingerprints, and requires the same compiled runtime
across shards. Worker PID identity is scoped to its runner. Aggregate timings
sum grammar medians rather than describing one combined wall-clock run; raw
shards retain their individual machine details.

Artifacts retain raw JSON, logs, independently recomputed statistics, the job
summary and complete source/compiled/native fingerprints before and after timing.
Machine, Node/V8, Rust, dependency lock, release profile and runner image information
are recorded. Repeat a run at the same revision when comparing host effects;
compare paired ratios before comparing absolute times across different machines.
A hosted VM still has timing variability.

Both summaries report milliseconds and memory in MiB. Eager results show
GC-settled heap, external, heap-plus-external and RSS deltas for retained original
and edited populations. Corpus results show per-grammar worker peak RSS and
GC-settled heap, external, heap-plus-external and RSS deltas. Corpus peak RSS
includes process startup, warmups and all three buckets; it is not attributed to
individual buckets or summed across grammars. Its settled snapshots are taken
after loading the engine/corpus and after validation finishes, so they describe
post-validation memory rather than retained AST populations. Memory sampling and
GC stay outside timed sections. External memory already includes array buffers;
RSS overlaps heap and external memory. Historical reports without worker memory
are explicitly labeled rather than filled with zeroes.

The eager benchmark measures direct JS-owned arena construction. Native parsed
hydration currently goes through typed Rust nodes before record encoding.
Corpus factory/IR builders still produce objects under both storage settings.
These are explicit current limitations, not measurements of the completed direct
Tree-sitter-to-arena reader or public eager-builder cutover.
