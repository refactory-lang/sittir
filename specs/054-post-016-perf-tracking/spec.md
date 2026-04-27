# Feature Specification: Post-016 Perf & Health Telemetry

**Feature Branch**: `054-post-016-perf-tracking`
**Created**: 2026-04-26
**Status**: Draft
**Depends on**: `016-parity-regressions` merged to master (baseline JSON format established, dual-backend napi boundary stable)
**Input**: Three classes of telemetry deferred repeatedly during 016 implementation: per-render timing, cross-napi-boundary memory tracking, and FFI cost regression gating.

## Background

The 016 parity-regressions feature established a dual-backend render pipeline (TS/Nunjucks vs Rust/Askama via napi-rs) with committed baseline JSONs and a CI regression-checker. What 016 deliberately did not measure is **how fast** each backend is, **how much memory** each allocates per render, and **how much the napi bridge itself costs**. Three memory notes capture what is known:

- `project_post_processing_reset` — cosmetic whitespace post-processing was removed from both backends, revealing ~308 walker bugs previously hidden. The reset confirmed that the two backends can diverge silently in ways the existing parity check catches — but says nothing about throughput or allocation.
- `project_perf_memory_ffi_tracking` — provisional spec 023+ entry, explicitly deferred post-016; door-to-door measurement for both backends, allocation counts, FFI overhead.
- `feedback_validator_json_output` — validators produce stringly-typed failure lists; a JSON-dump path was requested so debugging uses `jq` not grep. This spec adds a parallel metrics-JSON emit alongside the failure JSON.

This spec gives those three concerns a permanent home and defines the collection interface they share with 016's baseline format.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Per-render perf telemetry (Priority: P1)

A maintainer runs `pnpm test` or the codegen CLI and currently has no insight into per-rule render time, template-compile cost, or cache-miss rate on either backend. After a large refactor (e.g. Cluster F walker rewrite), it is impossible to tell whether the change sped up or slowed down the 600+ templates without adding manual timing instrumentation.

**Why this priority**: Measurement precedes optimisation. The walker refactor, variant() adoption waves, and template-engine convergence (spec 020) will all affect render throughput. Without a committed baseline, regressions in render time are invisible until they manifest as CI timeout failures. This is the minimal measurement investment that lets every future PR prove it didn't regress.

**Independent Test**: Run the corpus validators with `SITTIR_METRICS=1 SITTIR_BACKEND=typescript pnpm test`. Assert that `metrics-ts.json` exists in the working directory (or the path configured by `SITTIR_METRICS_OUT`). Assert the file contains an array of per-kind entries, each with `kind`, `grammar`, `callCount`, `meanMs`, `p99Ms`, `templateParseMs`, and `renderMs`. Run again without `SITTIR_METRICS=1` and assert no `metrics-*.json` file is written and no measurable overhead appears in test wall-time (±5% tolerance across 10 runs).

**Acceptance Scenarios**:

1. **Given** `SITTIR_METRICS=1` is set, **When** the roundtrip validator runs for any grammar, **Then** a `metrics-ts.json` (TS backend) or `metrics-native.json` (native backend) is written containing at least one entry per kind that was rendered at least once. Entries are sorted by `kind` for deterministic diffs.
2. **Given** both backends are run with `SITTIR_METRICS=1`, **Then** both JSON files use an identical top-level schema (same keys, same units) so a cross-backend comparison tool can diff them field-by-field without format translation.
3. **Given** `SITTIR_METRICS=1` is unset, **When** the same validators run, **Then** the test wall-time does not exceed the committed baseline by more than 5% in a 10-run average, and no metrics file is written.
4. **Given** `SITTIR_METRICS_OUT=/some/dir` is set alongside `SITTIR_METRICS=1`, **Then** the metrics files are written to `/some/dir/metrics-{ts,native}.json` instead of the working directory, enabling CI artefact upload without polluting the repo root.
5. **Given** a template compilation error occurs during a metrics-enabled run, **Then** the error is reported as normal — the metrics path does not swallow or hide errors by wrapping render calls in try/catch.

---

### User Story 2 — Memory tracking across the napi boundary (Priority: P2)

The native backend allocates Rust strings, copies them through the napi bridge, and hands them to the TS caller. After 016's post-processing removal, both backends produce identical raw output — but the allocation cost on each side is unknown. For large fixtures (>50 KB source files), peak heap and resident-memory spikes may be hiding until we hit a production-size corpus.

**Why this priority**: Lower than US1 because timing alone is sufficient to catch most throughput regressions; memory is needed only when a specific refactor (e.g. consolidating AssembledField values per `project_assembled_field_unification`) risks an allocation spike. But memory-tracking infrastructure is meaningfully harder to add retroactively after the codebase has grown further — establishing the collection point now is cheaper than retrofitting later. The P2 designation acknowledges that memory data is supplementary to the timing data from US1.

**Independent Test**: With `SITTIR_METRICS=1`, run the roundtrip validator against a grammar that has at least one fixture file over 50 KB. Assert that `metrics-ts.json` includes a top-level `memory` block with `tsHeapDeltaBytes`, `rustResidentDeltaBytes` (native only), and `napiCopyBytes` (native only). Assert that `rustResidentDeltaBytes` and `napiCopyBytes` are absent when `SITTIR_BACKEND=typescript` (TS backend does not cross the napi bridge). Assert that a fixture exceeding the configured `SITTIR_METRICS_HEAP_WARN_KB` threshold emits a warning line to stderr (not stdout, which carries structured output).

**Acceptance Scenarios**:

1. **Given** the native backend and `SITTIR_METRICS=1`, **When** a fixture file over 50 KB is rendered, **Then** `metrics-native.json` includes a `memory` block at the top level AND a per-kind `napiCopyBytes` field in the per-kind entry for that fixture's dominant kind.
2. **Given** the TS backend and `SITTIR_METRICS=1`, **Then** `metrics-ts.json` includes only `tsHeapDeltaBytes` in the `memory` block; `rustResidentDeltaBytes` and `napiCopyBytes` are absent (not null, not zero — fully absent to keep the schema backend-discriminated without sentinels).
3. **Given** `SITTIR_METRICS_HEAP_WARN_KB=200` is set, **When** any single render call allocates (TS heap delta or Rust resident delta) more than 200 KB, **Then** a warning is emitted to stderr in the form `[sittir-metrics] memory spike: kind=<K> heapDeltaKb=<N>` (parseable by `grep` and `jq` in CI logs).
4. **Given** `SITTIR_METRICS=1` but `SITTIR_BACKEND=typescript` (no napi bridge), **Then** the TS-side memory capture uses `process.memoryUsage().heapUsed` deltas bracketing each render call. The delta is measured before and after each call; the per-kind entry accumulates across calls for that kind.
5. **Given** the native backend, **When** jemalloc stats or `mimalloc_stats` are not available at compile time, **Then** `rustResidentDeltaBytes` falls back to `process.memoryUsage().rss` delta (measured on the TS side around the napi call) and the per-kind entry is tagged `{ rustResidentSource: 'rss-proxy' }` to make the approximation visible.

---

### User Story 3 — FFI cost tracking and regression gate (Priority: P3)

The napi-rs bridge marshals a `RenderInput` object (serialised from TS-side NodeData) and returns a `String` per call. That serialize/deserialize cost has never been measured. If the serialised payload grows (e.g. because a future spec adds fields to NodeData), or if call count grows (e.g. because recursive factory tests exercise more kinds per fixture), CI currently has no way to catch FFI-cost regressions before they accumulate.

**Why this priority**: P3 because the FFI gate depends on US1's per-render timing (the FFI component is a subset of render time) and because the regression impact is indirect — FFI regressions manifest as slow CI, not broken output. The warn-only/blocking two-phase rollout (first month warn, then block) guards against the gate being calibrated incorrectly on first deployment.

**Independent Test**: With `SITTIR_BACKEND=native` and `SITTIR_METRICS=1`, run the roundtrip validator and assert that `metrics-native.json` includes a top-level `ffi` block with `totalCalls`, `meanRoundtripMs`, `p99RoundtripMs`, and `meanPayloadBytes`. Then edit `specs/054-post-016-perf-tracking/baselines/perf-native.json` to lower `ffi.meanRoundtripMs` by 20% below the current value. Run the regression-checker script. Assert it exits 1 (or exits 0 with a warning-only flag when `SITTIR_METRICS_FFI_WARN_ONLY=1`).

**Acceptance Scenarios**:

1. **Given** `SITTIR_BACKEND=native` and `SITTIR_METRICS=1`, **When** the validator runs, **Then** `metrics-native.json` contains a `ffi` block with all four fields (`totalCalls`, `meanRoundtripMs`, `p99RoundtripMs`, `meanPayloadBytes`). `ffi` is absent from `metrics-ts.json` (no napi bridge on TS backend).
2. **Given** a committed `specs/054-post-016-perf-tracking/baselines/perf-native.json`, **When** the regression-checker compares a fresh metrics run against the committed baseline and `meanRoundtripMs` or `totalCalls` has increased by >10%, **Then** the checker either exits 1 (blocking mode) or prints a `[WARN]` line to stderr (warn-only mode), controlled by `SITTIR_METRICS_FFI_WARN_ONLY`.
3. **Given** the first month after this spec ships, **When** the regression-checker runs in CI, **Then** it runs in warn-only mode (`SITTIR_METRICS_FFI_WARN_ONLY=1` set in `.github/workflows/ci.yml`); no PR is blocked solely by an FFI regression during this calibration period.
4. **Given** the calibration period has ended (the spec's `warnOnlyUntil` date in `baselines/perf-native.json` is in the past), **When** CI runs the regression-checker, **Then** `SITTIR_METRICS_FFI_WARN_ONLY` is no longer set and an FFI-count or mean-roundtrip regression above the 10% threshold blocks the PR.
5. **Given** a PR that deliberately reduces FFI call count (e.g. batching multiple renders per napi call), **When** the regression-checker runs, **Then** it exits 0 because reductions are not regressions — only increases are flagged.

---

### Edge Cases

- **Metrics overhead on CI**: The metrics collection path (timing brackets + memory snapshots) adds CPU and memory instrumentation. If `SITTIR_METRICS=1` is set accidentally in CI (e.g. via a checked-in `.env`), it must not cause the validators themselves to fail or produce stale results. Behaviour: the metrics path is strictly additive — no render call path changes, no error paths suppressed. The JSON write is the only side effect.
- **Non-deterministic timing across machines**: p99 latency will differ between a developer laptop and a GitHub Actions runner. The regression gate MUST compare a fresh metrics run against a baseline collected on the same machine class, not against a hand-authored number. Behaviour: `baselines/perf-native.json` stores a `collectedOn: { platform, cpuModel, nodeVersion }` block; the regression-checker skips the gate when `platform` differs and logs `[INFO] platform mismatch — perf gate skipped`. Cross-platform regression gating is out of scope.
- **DRY — one collection point per metric**: Both backends must collect each metric at exactly one call site. TS-side timing brackets live in a single `withMetrics(kind, fn)` wrapper exported from a new `packages/core/src/metrics.ts`. Rust-side timing uses a single `#[instrument]` macro site per render entry point. Two wrappers, zero diverging walkers.
- **Zero-overhead guarantee — compiler verification**: When `SITTIR_METRICS=1` is unset, the hot path must not pay even a branch-prediction cost for metrics. TS: the `withMetrics` wrapper checks the env var once at module load and replaces itself with a no-op closure (Rust: the `SITTIR_METRICS` compile-time flag gates the instrumentation at build time. If the env-var-only gating is insufficient, the spec allows an `#[cfg(feature = "metrics")]` Rust feature gate.
- **Large fixture threshold**: "Over 50 KB" is a rough heuristic for fixtures that exercise allocation meaningfully. The threshold is configurable via `SITTIR_METRICS_HEAP_WARN_KB` (default 50 × 1024). If no fixture in the current grammar exceeds the threshold, the `memory` block is still emitted (with zeros) rather than omitted — a missing block would cause spurious schema-validation failures.
- **Baseline format version**: `baselines/perf-native.json` carries a `schemaVersion: 1` field. The regression-checker rejects any comparison between two files with different `schemaVersion` values and exits 2 (distinct from 1 = regression). Future schema additions bump the version.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: A new `packages/core/src/metrics.ts` module MUST export a `withMetrics<T>(kind: string, grammar: string, fn: () => T): T` wrapper. When `SITTIR_METRICS=1` is set, the wrapper records wall-clock time (via `performance.now()`), accumulates per-kind call count and timing into a module-level `MetricsStore`, and returns the result of `fn()` unchanged. When `SITTIR_METRICS=1` is unset, the wrapper is a transparent passthrough (`return fn()`). The env-var check MUST occur once at module initialisation, not inside the hot path.

- **FR-002**: A `dumpMetrics(backend: 'ts' | 'native', outDir?: string): void` export MUST write the accumulated `MetricsStore` to `metrics-{ts,native}.json` in `outDir` (defaulting to `process.cwd()`). The JSON schema MUST match the `MetricsFile` interface defined in the spec contracts (see Key Entities). `dumpMetrics` is a no-op when `SITTIR_METRICS=1` is unset.

- **FR-003**: The corpus validators (`validateRoundTrip`, `validateFromCorpus`, `validateFactoryRoundTrip`, `validateReadNodeRoundTrip`) MUST call `dumpMetrics` after their final render pass when running under `SITTIR_METRICS=1`. This MUST be implemented in the existing validator entry points, not in a separate script, so the metrics reflect exactly the same render calls that produce the pass/fail counts.

- **FR-004**: The TS-side memory capture MUST use `process.memoryUsage().heapUsed` deltas bracketing each `withMetrics` call. The delta is accumulated per kind and stored in `MetricsStore.perKind[k].heapDeltaBytes`. The per-kind accumulation MUST be additive (not averaged) so the top-level `memory.tsHeapDeltaBytes` is the sum over all per-kind values, not a re-measurement.

- **FR-005**: The native-backend `RenderInput` marshal/unmarshal cost MUST be captured at the napi call site in `packages/core/src/render.ts` (the existing `createNunjucksEnvironment`-adjacent render path for the native backend), not inside Rust. The TS-side timer brackets the `napi.render(input)` call; `napiCopyBytes` is estimated as `JSON.stringify(input).length` (UTF-8 byte count), not as a wire-format size. This is a proxy — the spec notes the approximation in the JSON as `napiCopyBytesEstimate: true`.

- **FR-006**: A `specs/054-post-016-perf-tracking/baselines/perf-native.json` file MUST be committed as part of the first implementation commit. It is the regression baseline for US3's gate and carries `schemaVersion`, `warnOnlyUntil`, `collectedOn`, and a `ffi` block (the `PerfBaseline` shape — see Key Entities). A companion `perf-ts.json` file is committed alongside it as the full `MetricsFile` snapshot (no `ffi`, no regression gate — provided for cross-backend per-kind comparison only). **Initial baseline collected on darwin/Apple-M4-Pro 2026-04-26**; the linux/ubuntu-22.04 baseline is deferred — until it lands, the CI `perf-regression-checker` job hits the `[INFO] platform mismatch — perf gate skipped` branch on every run, which is the documented degenerate case (see edge case "Non-deterministic timing across machines"). Linux baseline collection is captured as a follow-up task in plan.md.

- **FR-007**: A regression-checker script (`packages/codegen/src/scripts/check-perf-baseline.ts`) MUST read a committed `baselines/perf-native.json` and a freshly produced `metrics-native.json`, compare `ffi.meanRoundtripMs` and `ffi.totalCalls`, and exit 1 if either has increased by >10% AND `SITTIR_METRICS_FFI_WARN_ONLY` is unset. When `SITTIR_METRICS_FFI_WARN_ONLY=1`, it MUST exit 0 and print a `[WARN]` line to stderr. When `collectedOn.platform` differs between the two files, it MUST exit 0 and print `[INFO] platform mismatch — perf gate skipped`.

- **FR-008**: The `.github/workflows/ci.yml` MUST be extended with a new job `perf-regression-checker` that runs after the `napi-build` and `test` jobs. For the first month (until `warnOnlyUntil` in `baselines/perf-native.json`), the job sets `SITTIR_METRICS_FFI_WARN_ONLY=1`. After that date, the flag is unset and the job becomes blocking. The job MUST be skipped when `SITTIR_BACKEND` is not `native` (no napi bridge to measure).

- **FR-009**: The `MetricsFile` and `MetricsStore` interfaces MUST each have exactly one definition — in `packages/core/src/metrics.ts`. Generated grammar packages (`@sittir/rust`, `@sittir/typescript`, `@sittir/python`) MUST NOT define their own metrics types. The codegen pipeline MUST NOT emit metrics instrumentation into generated files — the `withMetrics` wrapper is imported from `@sittir/core`, not inlined per kind.

- **FR-010**: No hand-edits to generated files under `packages/{rust,typescript,python}/src/` or `packages/{rust,typescript,python}/templates/*.jinja`. If the metrics instrumentation requires changes to how templates are invoked, the change goes into `packages/core/src/render.ts` (the render engine) or `packages/codegen/src/emitters/templates.ts` (the template emitter), never into generated output.

- **FR-011**: The `withMetrics` wrapper MUST NOT catch exceptions thrown by `fn()`. If a render call throws, the exception propagates unchanged; no metrics entry is written for that call. This preserves the existing error-surface contract for both backends.

### Key Entities _(include if feature involves data)_

**MetricsFile** — top-level JSON written to `metrics-{ts,native}.json`:

```ts
interface MetricsFile {
  schemaVersion: 1;
  backend: 'ts' | 'native';
  collectedAt: string;           // ISO 8601, UTC
  collectedOn: {
    platform: string;            // process.platform
    nodeVersion: string;         // process.version
    cpuModel: string;            // os.cpus()[0].model
  };
  memory: {
    tsHeapDeltaBytes: number;
    rustResidentDeltaBytes?: number;   // native only
    napiCopyBytes?: number;            // native only
    napiCopyBytesEstimate: boolean;    // always true for native
  };
  ffi?: {                        // native only
    totalCalls: number;
    meanRoundtripMs: number;
    p99RoundtripMs: number;
    meanPayloadBytes: number;
  };
  perKind: Record<string, {
    grammar: string;
    callCount: number;
    meanMs: number;
    p99Ms: number;
    templateParseMs: number;
    renderMs: number;
    heapDeltaBytes: number;
    napiCopyBytes?: number;      // native only
  }>;
}
```

**PerfBaseline** — committed to `specs/054-post-016-perf-tracking/baselines/perf-native.json`:

```ts
interface PerfBaseline {
  schemaVersion: 1;
  warnOnlyUntil: string;         // ISO 8601 date — gate is warn-only before this
  collectedOn: {
    platform: string;
    nodeVersion: string;
    cpuModel: string;
  };
  ffi: {
    totalCalls: number;
    meanRoundtripMs: number;
    p99RoundtripMs: number;
    meanPayloadBytes: number;
  };
}
```

**MetricsStore** — in-process accumulator (module-private, not exported):

An opaque Map from `"${grammar}:${kind}"` to accumulated timing and memory buckets. `dumpMetrics` serialises it to `MetricsFile`. One instance per process lifetime; not reset between validator passes so the file reflects the full run.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Running `SITTIR_METRICS=1 SITTIR_BACKEND=typescript pnpm test` in a clean checkout produces `metrics-ts.json` in the working directory with at least one `perKind` entry per grammar (rust, typescript, python), all mandatory fields present, and no `ffi` block. Verified by a new vitest test in `packages/codegen/src/__tests__/metrics-schema.test.ts` that validates the emitted JSON against the `MetricsFile` interface.

- **SC-002**: Running `SITTIR_METRICS=1 SITTIR_BACKEND=native pnpm test` produces `metrics-native.json` with a `ffi` block and `memory.rustResidentDeltaBytes` and `memory.napiCopyBytes` present. Verified by the same schema test extended for the native backend.

- **SC-003**: Running `pnpm test` (no `SITTIR_METRICS=1`) has test wall-time within ±5% of the committed baseline across 10 consecutive runs on the same machine. Verified by the `perf-regression-checker` CI job using the baseline from `baselines/perf-native.json`. Tolerance is 10% for CI (GHA runners are noisier than local machines).

- **SC-004**: `check-perf-baseline.ts` exits 0 when `meanRoundtripMs` and `totalCalls` in the fresh metrics are at or below the committed baseline (plus 10% tolerance). Exits 1 (or 0 + `[WARN]`) on regression. Exits 2 on schema-version mismatch. Verified by a unit test that stubs both input files.

- **SC-005**: The existing `specs/016-parity-regressions/baselines/{ts,native}.json` pass/fail counts are not affected by this feature. Verified by running the 016 regression-checker after implementing FR-001 through FR-011 and confirming zero count changes.

- **SC-006**: No `as any`, `@ts-ignore`, or `@ts-nocheck` in `packages/core/src/metrics.ts` or `packages/codegen/src/scripts/check-perf-baseline.ts`. Verified by `oxlint --deny-warnings` (which already catches `no-explicit-any`).

- **SC-007**: The `MetricsFile` schema is defined exactly once in `packages/core/src/metrics.ts` and imported (not re-declared) in `check-perf-baseline.ts` and `metrics-schema.test.ts`. No generated file references `MetricsFile`. Verified by `grep -r 'MetricsFile' packages/{rust,typescript,python}/src/` returning zero matches.

## Out of Scope

- **Optimising any specific render kind**: this is a measurement spec. No template, walker, or emitter change may be justified as "performance optimisation" under this spec's umbrella. Changes that incidentally improve timing are acceptable only if they are required to implement the measurement infrastructure (e.g. restructuring the render-call entry point to accept a `withMetrics` hook).
- **Replacing or modifying the napi bridge**: the bridge interface (marshalling shape, napi-rs version) is out of scope. FFI cost tracking measures the existing bridge; it does not justify changing it.
- **Changing the public NodeData shape**: `$type`, `$source`, `$fields`, `$text`, `$children`, `$variant` are frozen. The metrics wrapper does not read these fields except through the existing render-call interface.
- **Cross-platform perf comparison**: timing and memory numbers differ across OS/CPU/memory configurations. This spec explicitly skips the regression gate when `collectedOn.platform` differs between baseline and fresh measurement.
- **Rust-side compile-time metrics** (e.g. template-compile time for Askama, which is zero at runtime because Askama compiles templates at build time): the `templateParseMs` field in `MetricsFile.perKind` is 0 for the native backend and non-zero only for the TS backend (Nunjucks parses templates at first use).
- **Real-time dashboards or persistent telemetry storage**: metrics are ephemeral per-run JSON files. No metrics aggregation service, no time-series database, no remote upload.
- **Validating Rust-side allocation counts via jemalloc API**: Rust's allocator API is unstable; the Rust-side memory proxy falls back to TS-side `process.memoryUsage().rss` delta per FR-005's fallback clause. Integrating jemalloc stats directly is a follow-up (spec 060+).

## Assumptions

- `016-parity-regressions` has merged to master and `specs/016-parity-regressions/baselines/` is committed. This spec inherits the dual-backend baseline format conventions (sorted keys, no timestamps, `failingKinds` arrays) and extends them with a new `perf.json` file in its own `baselines/` subdirectory.
- `@sittir/core` is the correct home for the `metrics.ts` module. It is a zero-runtime-dep package and the metrics module adds only `node:os` and `node:perf_hooks` (both stdlib) to its import surface.
- The napi boundary is stable — `packages/core/src/render.ts` already contains the call site where the TS side invokes the native render function. No new napi entry points are needed for this spec; `withMetrics` wraps the existing call.
- `performance.now()` resolution is sufficient for p99 per-kind timing. On Node 18+ (the project's target), `performance.now()` returns sub-millisecond resolution. Kinds with <0.01 ms mean will appear as `0.00` in the JSON but will not cause errors.
- The vitest test suite (`pnpm test`) runs all validators for all three grammars. The metrics collection therefore captures a representative cross-grammar sample within a single `pnpm test` invocation.

## Dependencies

- `016-parity-regressions` — provides the dual-backend baseline JSON format and the regression-checker pattern that `check-perf-baseline.ts` extends.
- `@sittir/core` (existing) — new `metrics.ts` module lives here.
- `node:perf_hooks` (`performance.now()`) — stdlib, no new deps.
- `node:os` (`os.cpus()[0].model`) — stdlib, no new deps.
- napi-rs build pipeline (existing `packages/codegen/src/cli.ts --buildNative`) — the `perf-regression-checker` CI job runs after `napi-build`; it does not modify the build pipeline.

## Open Questions

1. **Metrics file placement**: The spec defaults to `process.cwd()` for the metrics JSON output. CI workflows typically run from the repo root, which works. But `pnpm test` is often run from a package subdirectory (`cd packages/rust && pnpm test`). Should `SITTIR_METRICS_OUT` default to the repo root (resolved from `packages/core`'s `__dirname`) rather than `process.cwd()`? **Needs resolution before plan.md** — the answer affects the `dumpMetrics` signature and the CI job's artefact-upload path.

2. **Template-parse cost attribution for Nunjucks**: Nunjucks caches compiled templates after first use. `templateParseMs` is meaningful only on the first call per kind per process lifetime. Should the per-kind schema have a boolean `templateWarmCache` field to distinguish first-call vs cached-hit timing? If yes, the regression gate becomes more complex (first-call regression vs hot-path regression). **Needs resolution before plan.md**.

3. **`warnOnlyUntil` date in `perf.json`**: ~~The spec says "first month." What is the concrete date?~~ **RESOLVED 2026-04-26 during initial implementation.** The committed `baselines/perf-native.json` carries `warnOnlyUntil: "2026-05-26"` (collection date + 30 days). The `perf-regression-checker` job in `.github/workflows/ci.yml` sets `SITTIR_METRICS_FFI_WARN_ONLY=1` for the duration of this window — flip to enforcing by removing that env block on or after the date. Hardcoding the date in both the JSON and the CI env is acceptable because the regression-checker prints a `[WARN]` line regardless of mode; a forgotten-to-flip scenario shows up in PR review.

4. **Rust resident memory fallback accuracy**: the `process.memoryUsage().rss` delta measured around a single napi call is a coarse proxy that includes GC activity, unrelated allocations, and OS page rounding. Is this accuracy sufficient, or should the spec defer `rustResidentDeltaBytes` to a follow-up that integrates real Rust allocator stats? If deferred, the `memory` block omits the field rather than emitting an inaccurate proxy. **Resolution preferred before plan.md** (affects implementation scope of US2).

5. **FFI regression threshold (10%)**: The 10% threshold was chosen as a round number. CI runners (GHA ubuntu-latest) have significant variance — 10% may fire false positives. Should the threshold be 15% or 20% for CI, with 10% reserved for local runs? Alternatively, should the gate use absolute millisecond thresholds rather than percentages? **Needs empirical calibration post-implementation; threshold is configurable via `perf.json` once committed.**
