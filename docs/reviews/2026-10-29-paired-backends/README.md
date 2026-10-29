# Paired-backend evidence

The report is [one level up](../2026-10-29-paired-backends.md). `compatibility` contains the exact inputs and both versions' output observations. `benchmarks` contains all final warm-process samples, the protocol and summary. `validation` contains both-mode reports and the independent master report, with real Git manifest provenance. `verification` contains full command receipts, native build logs, source/runtime fingerprints and compressed full test results.

The complete local bundle, including prior reviews, failed attempts and the pinned master build, is saved in this checkout at `scratch/review-artifacts/2026-10-29/`. The bundle is Git-ignored by the repository's existing scratch rule. Rebuildable dependency/Cargo caches are excluded; pinned sources, lockfiles, measured native addons, compiled JavaScript and build commands are retained.

Use `gzip -dc verification/full-tests-verified.json.gz` to inspect the complete unit result. The baseline is master `7471447a24febcdae6f37b025cdb80a12a929209`; independently install its frozen lockfile and build its grammar runtimes with the recorded gate-profile commands. The worker scripts take a runtime-root path as their first argument. Their accompanying corpus files are included. The original full runner, source paths and command history are also preserved in the local bundle.

Portable formatting preserves every parsed JSON value. `manifest.json` records original and saved hashes; original bytes stay in the local bundle. Bootstrap ranges describe these local paired process samples, with no enforced performance threshold. One-round profiler output is integration evidence, not a statistical performance conclusion.
