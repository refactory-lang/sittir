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
the branch to measure. The definitions in this feature branch have been checked
locally; no completed CI benchmark run is claimed. See [GitHub's manual-run
contract](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

The dispatcher calls separate reusable [eager](../../../../.github/workflows/benchmark-eager.yml)
and [corpus](../../../../.github/workflows/benchmark-corpus.yml) workflows. Both
use one shared setup action and reporting helper. Each benchmark builds its own
release runtime on a macOS 26 arm64 runner, pinned Node 26.12.0 and the repository's
pinned Rust toolchain. Public and private addons use the workspace release
profile. Setup completes before any timed worker starts.

Each job runs object and arena storage on that same runner in alternating fresh
workers, under the existing 75% idle gate. Eager construction uses 10,000
four-node functions, five pairs, two warmups and three measured batches. The
corpus run uses all five grammars and all three existing RRP, factory and IR
validation buckets, five pairs per grammar and the same warmups and batches.

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
