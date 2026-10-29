# Manual arena benchmarks

The **Arena benchmarks** workflow runs on request: it is dispatched for
`corpus` or `all`, at the branch to measure. A push, a pull request
or a schedule never runs it. It has no performance threshold and no required
CI status. Broken runs, changed workload fingerprints or changed runtime
inputs still fail their job.

```sh
gh workflow run benchmarks.yml --ref <branch> -f benchmark=corpus
```

GitHub offers manual dispatch only for a workflow the repository's default
branch holds, so the dispatcher is registered there, and a dispatched run reads
the workflow from the ref it targets. The reusable jobs it calls need only be
on the branch measured. See [GitHub's manual-run
contract](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow).

The dispatcher first calls a shared [build](../../../../.github/workflows/benchmark-build.yml)
workflow, then the reusable [corpus](../../../../.github/workflows/benchmark-corpus.yml) workflow.
Jobs use Ubuntu 24.04 x64 runners, pinned Node 26.12.0 and the repository's pinned
Rust toolchain. TypeScript compiles once; each grammar addon builds in parallel
on separate runners, with the workspace release profile. Benchmarks consume committed generated
source and parser WASMs; the normal generated-output CI gate owns regeneration.

Compiled TypeScript and native bundles are cached by exact commit, OS,
architecture and Node version. Cargo dependency caches also survive source
changes. Bundles preserve native freshness stamps and verify checksums, commit,
platform, architecture, Node ABI, Rust version, Cargo configuration and Rust flags
before restoration. Measurement runners download the build artifacts and do
not compile or regenerate the runtime.

Each job runs object and arena storage on that same runner in alternating fresh
workers, under the existing 75% idle gate. The corpus run uses one runner per
grammar in parallel, covering all five grammars and all three RRP, factory and
IR validation buckets. Each grammar runner executes five pairs, two warmups and
three measured batches. Each bucket's time is its whole validator round trip:
producing the nodes, rendering, reparsing and comparing. The factory and IR
rows are not construction measurements. The 75% idle gate
samples cumulative CPU times portably on Linux and macOS.

Object and arena workers remain sequential on each grammar's runner; independent
grammar shards run on separate runners. Aggregation
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

The summary reports milliseconds and memory in MiB: per-grammar worker peak
RSS and GC-settled heap, external, heap-plus-external and RSS deltas. Peak RSS
includes process startup, warmups and all three buckets; it is not attributed to
individual buckets or summed across grammars. The settled deltas are a leak
check: their snapshots are taken after loading the engine/corpus and after
validation finishes, so they show what validation leaves behind, not the memory
a retained AST population holds. Memory sampling and
GC stay outside timed sections. External memory already includes array buffers;
RSS overlaps heap and external memory. Historical reports without worker memory
are explicitly labeled rather than filled with zeroes.

Native parsed hydration writes narrow records through the same routing decisions
as the typed reader, without first building a typed AST to encode. The
`construction` input chooses whether the arena arm's factory and IR buckets build
records or objects; both rows remain whole round-trip measurements. The frozen
[eager probe](eager/README.md) is no longer run; its figures describe its own
wrappers, not the engine's builders.
