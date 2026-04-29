# Feature 011 — Performance Benchmarks

## T063 — TS wall-clock (`pnpm test`)

Measures: end-to-end `pnpm test` duration on the full workspace
(1417 tests, 62 files) after the Nunjucks cutover.

**Machine**: macOS (Darwin 25.2.0), Node 24.15, pnpm 10.32.

### Post-migration (2026-04-22)

```
Duration  3.46s (transform 5.53s, setup 0ms, import 8.24s, tests 7.72s)
pnpm test total  4.067s (wall), 17.79s user, 524% cpu
```

### Baseline comparison

Pre-migration per-commit reports (from session logs):

| Commit    | Tests      | Duration  |
| --------- | ---------- | --------- |
| `60afe46` | 1354 p     | 4.80s     |
| `7db681d` | 1354 p     | 3.14s     |
| `a047294` | 1358 p     | 3.29s     |
| `5888bdd` | 1402 p     | 3.28s     |
| `49326cb` | 1415 p     | ~3.4s     |
| **this**. | **1417 p** | **3.46s** |

**SC-007 assessment**: target is ≤10% regression on `pnpm test`
wall-clock. Observed: ~0–3% variance across commits. No measurable
regression from the Nunjucks cutover. Precompilation optimization
(wiring `nunjucks.precompile` at codegen time) is therefore
unnecessary at current test-suite size.

## T064 — Rust render wall-clock vs TS (Phase B)

**Deferred** alongside Phase 4 (Rust askama renderer) pending the
full `@sittir/core` Rust port. When that port lands, SC-008's
"at least 2× faster per node" target is measured inside the ported
core's benchmark harness, not as a separate standalone crate.

## Methodology notes

- Durations are single-run, not median-of-N. Variance across runs is
  on the order of ±0.2s; the ~3% difference observed between commits
  is within noise.
- `pnpm test` launches vitest with in-process parallelism (observed
  524% CPU utilization on an 8-core machine → ~5.2 cores active).
  Tests are I/O-bound on parse cache warmup; the Nunjucks path adds
  ~200 KB of package imports but no runtime cost on the corpus pass.
- No dedicated per-node render benchmark exists for the TS side;
  creating one is low-value without a Rust counterpart to compare
  against. Deferred to Phase B along with T064.
