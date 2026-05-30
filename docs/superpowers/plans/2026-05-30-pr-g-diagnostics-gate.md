# PR-G — Diagnostics severity model + Assemble→Project gate (additive)

> Per-PR plan under the compiler-simplification master plan
> (`docs/superpowers/plans/2026-05-26-compiler-simplification-master-plan.md`, row **PR-G**)
> and design spec `docs/superpowers/specs/2026-05-22-compiler-simplification-design.md` §4b / §7.5 / §E.
> Branch: `pr-g-diagnostics-gate` (off `master` `536ac796`). Execute via
> superpowers:subagent-driven-development; this doc is written per superpowers:writing-plans.

## Goal

Land the **inert** Assemble→Project gate and the **severity-model foundation** the
rest of the strangler needs, **without changing any emitted code**. PR-G is pure
additive infrastructure: a diagnostics **sink**, an emit **gate**, and **one**
wire-in to `generate.ts`. Nothing emits `fail` until **PR-L**, so the gate is
**wired but inert** today — it exists, can be unit-tested, and logs/throws only on
a `fail` severity that no producer currently sets. PR-G **must land before PR-H**,
which threads this sink into the phase contexts.

## Architecture

The strangler builds the diagnostics channel beside the existing one. Two blocking
notions coexist **by design** through to PR-L:

- **Legacy preflight** (`run-codegen.ts::runGrammarDiagnosticsPreflight`) keys on
  `Diagnostic.canProceed === false`. It runs its **own** `assemble(optimize(link(...)))`
  pass (`grammar-diagnostics.ts::collectGrammarDiagnosticsForGrammar`), surfaces
  non-blocking diagnostics on stderr, and throws `GrammarDiagnosticError` on a
  blocking one. **PR-G does not touch it.**
- **New gate** (`emit-gate.ts::assertEmittable`) keys on `severity === 'fail'`. It
  runs inside the real `generate()` pipeline driver at the Assemble→Emit boundary,
  consuming a `DiagnosticSink`. **PR-G adds this.**

These converge at PR-L (which flips the heuristics to `propose-*` `fail`-diagnostics
and renames the vocabulary). Until then the duality is intentional, **not** a bug.

### The one real design decision: severity reconciliation, and why the gate keys on `fail`

Spec §4b was authored **before PR-C** and assumed `diagnostics.ts` was greenfield
with `DiagnosticSeverity = 'fail' | 'warn' | 'info'`. PR-C (`4794a48f`) actually
shipped:

```ts
// packages/codegen/src/compiler/diagnostics.ts (CURRENT)
export type Severity = 'error' | 'warning' | 'info';
export interface Diagnostic {
  readonly code: string; readonly severity: Severity; readonly message: string;
  readonly canProceed: boolean; readonly proposal?: string; readonly details?: …;
}
// GrammarDiagnostic / CompilerDiagnostic / RuntimeDiagnostic + a `phase` enum.
// There is NO DiagnosticSink, NO EmitHaltedError.
```

**Landmine to avoid:** `diagnose-derive-shapes.ts` already emits `canProceed: false`
(lines 46/65/84/103/121). If the gate keyed on `canProceed`, then the instant
PR-H routes real diagnostics into the sink, derive-shape's existing `canProceed:false`
would **halt emit**. That violates "inert until PR-L". Therefore the gate **must
key on a `fail` severity that nothing currently emits.**

**Resolution (additive, byte-neutral, satisfies "extend don't duplicate"):**
- **Widen** `Severity` to `'error' | 'warning' | 'info' | 'fail'` — a pure member
  ADD. No existing producer emits `'fail'`, so no behavior changes.
- **Add** `DiagnosticSink` (class) + `EmitHaltedError` to `diagnostics.ts`.
- `DiagnosticSink.hasBlocking()` returns `items.some(d => d.severity === 'fail')`.
- **Do NOT** rename `warning`→`warn` or `error`→… now — that would edit the
  diagnose passes + `grammar-diagnostics.ts` + the live preflight (not additive).
  The spec's exact `fail|warn|info` rename is **PR-L's** job; note it here.

We keep the existing `Severity`/`Diagnostic` names (extend, not parallel). The
sink's `fail()/warn()/info()` sugar maps `warn → 'warning'`, `info → 'info'`,
`fail → 'fail'` so PR-H/PR-L can call the spec's vocabulary while the underlying
union stays single-sourced.

### Scope boundary — what PR-G does NOT do

- **NOT** "move the unnamed-choice warner global (`collect-slots.ts:61-68`) into
  the sink." Spec §5's PR-G row lists this, but the **master-plan framing wins**:
  PR-G is "file-disjoint from the naming/emitter core", and `collect-slots.ts` IS
  that core; PR-H is explicitly "threads G's sink into the phase contexts". So the
  warner move is **deferred to PR-H**. (Conflict flagged: master-plan §"Safe to run
  in parallel" item 1 > spec §5 row prose.)
- **NOT** routing anything into the sink. PR-G constructs an **empty** sink in
  `generate.ts` and passes it only to `assertEmittable`. Nothing emits into it →
  `hasBlocking()` is provably `false` → gate trivially inert. This is the additivity
  guarantee.
- **NOT** dependent on the in-flight `patternReplacementKinds`-elimination spike
  (separate; touches `optimize.ts`/`types.ts`/`link.ts`/`evaluate.ts`). PR-G's file
  set (`diagnostics.ts`, `emit-gate.ts`, `generate.ts`) is disjoint from those four
  (verified: the spike does not touch `generate.ts`). **Do not branch off / rebase
  onto the spike.**

## Tech Stack

TypeScript (ESM, `.ts` local imports), Vitest. No Rust, no template, no emitter
changes. `pnpm validate:native` is the regression gate.

## File Structure

```
packages/codegen/src/compiler/
  diagnostics.ts              MODIFY  — widen Severity; add DiagnosticSink + EmitHaltedError
  diagnostics.test.ts         MODIFY  — sink + hasBlocking tests
  emit-gate.ts                NEW     — assertEmittable(nodeMap, sink)
  emit-gate.test.ts           NEW     — gate inert / throws-on-fail tests
  generate.ts                 MODIFY  — construct empty sink; call assertEmittable at Assemble→Emit boundary
```

No other files change. The gate is `assertEmittable(nodeMap, diagnostics)` (the
spec's §7.5 signature; `nodeMap` is accepted for forward-compat — PR-L's
`unslotted-child` check reads it — but PR-G's body only consults the sink).

---

### Task 1 — Severity model + DiagnosticSink + EmitHaltedError (diagnostics.ts)

Extend the existing model; do not duplicate it. The gate keys on `'fail'`.

- [ ] **Write failing test** — extend `packages/codegen/src/compiler/diagnostics.test.ts`:
  - `DiagnosticSink`: `emit()` then `all()` returns the pushed items in order.
  - `fail()/warn()/info()` sugar sets severity `'fail'/'warning'/'info'` respectively.
  - `hasBlocking()` is `true` iff at least one item has `severity === 'fail'`;
    `false` for empty, and `false` for a sink holding only `warning`/`info`/`error`
    items (proves it keys on `fail`, NOT on `error`/`canProceed`).
  - A `Severity` value of `'fail'` typechecks (member-add assertion).
  - `EmitHaltedError` is an `Error` subclass carrying the blocking `Diagnostic[]`.
- [ ] **Run** `pnpm --filter @sittir/codegen test diagnostics` → RED (symbols absent).
- [ ] **Implement** in `diagnostics.ts`:
  - Widen `export type Severity = 'error' | 'warning' | 'info' | 'fail';`.
  - Add `export class DiagnosticSink` with private `items: Diagnostic[]`, methods
    `emit(d)`, `fail(d: Omit<Diagnostic,'severity'>)` → `emit({...d, severity:'fail'})`,
    `warn(...)` → `'warning'`, `info(...)` → `'info'`, `all(): readonly Diagnostic[]`,
    `hasBlocking(): boolean` → `items.some(d => d.severity === 'fail')`.
    (Sugar methods take a `Diagnostic` minus `severity`; `canProceed` stays caller-set
    or defaults — keep it required to match the current interface, or have the sugar
    default `canProceed: false` for `fail` and `true` otherwise. Pick the minimal
    form the tests pin; document the choice in a comment.)
  - Add `export class EmitHaltedError extends Error` taking `readonly blocking: readonly Diagnostic[]`,
    composing `message` from each item's `code`/`message`/`proposal` (mirror
    `GrammarDiagnosticError`'s formatting for consistency).
  - Header comment: note `'fail'` is reserved for PR-L; the legacy `canProceed`
    blocking signal and `'error'/'warning'` vocabulary are untouched this PR.
- [ ] **Run** `pnpm --filter @sittir/codegen test diagnostics` → GREEN.
- [ ] **Typecheck** `pnpm --filter @sittir/codegen exec tsc --noEmit` → clean
  (widening `Severity` must not break `grammar-diagnostics.ts` / diagnose passes —
  they only PRODUCE existing members; verify no exhaustive `switch` over `Severity`
  exists that the new member breaks).
- [ ] **Commit** `feat(diagnostics): add DiagnosticSink + EmitHaltedError; reserve 'fail' severity`.

### Task 2 — The Assemble→Project gate (emit-gate.ts)

- [ ] **Write failing test** — new `packages/codegen/src/compiler/emit-gate.test.ts`:
  - `assertEmittable(nodeMap, emptySink)` does **not** throw (inert case).
  - A sink holding only `warning`/`info` does **not** throw.
  - A sink holding a `fail` diagnostic throws `EmitHaltedError` whose `.blocking`
    contains exactly the `fail` items (filtered).
  - `nodeMap` can be a minimal stub / `{} as NodeMap` (PR-G's body does not read it);
    add a comment that PR-L will exercise the `nodeMap`-reading `unslotted-child`
    path.
- [ ] **Run** `pnpm --filter @sittir/codegen test emit-gate` → RED.
- [ ] **Implement** `emit-gate.ts`:
  ```ts
  import type { NodeMap } from './types.ts';        // (or AssembledNodeMap — match generate.ts's import)
  import { DiagnosticSink, EmitHaltedError } from './diagnostics.ts';
  /** The single Assemble→Project boundary check (spec §4b/§7.5). Inert until PR-L. */
  export function assertEmittable(_nodeMap: NodeMap, diagnostics: DiagnosticSink): void {
    if (diagnostics.hasBlocking()) {
      throw new EmitHaltedError(diagnostics.all().filter((d) => d.severity === 'fail'));
    }
  }
  ```
  (Confirm the `NodeMap`/`AssembledNodeMap` type name against `assemble.ts`'s export
  so the import resolves; `_nodeMap` underscore-prefixed = intentionally-unread now.)
- [ ] **Run** `pnpm --filter @sittir/codegen test emit-gate` → GREEN.
- [ ] **Typecheck** → clean.
- [ ] **Commit** `feat(emit-gate): add inert assertEmittable Assemble→Project gate`.

### Task 3 — Wire the gate into generate.ts (the one wire-in) + prove additivity

- [ ] **Write failing test** — add to an existing generate-level test (or a small
  new `generate-gate.test.ts`): drive `generate(cfg)` (or the smallest harness that
  reaches the boundary) and assert it returns normally (no `EmitHaltedError`) for a
  real grammar — pinning that the inert gate does not break the happy path. If a
  full `generate()` invocation is too heavy for a unit test, instead assert
  structurally that `generate.ts` constructs a `DiagnosticSink` and calls
  `assertEmittable` between `assemble()` and `emitAll()` (e.g. a source-level guard
  test, or rely on Task-3's byte-diff + validate gate as the integration proof and
  keep the unit coverage in Tasks 1–2). Pick the lighter option that still fails
  before the wire-in.
- [ ] **Run** the chosen test → RED.
- [ ] **Implement** the wire-in in `compiler/generate.ts`:
  - Import `DiagnosticSink` from `./diagnostics.ts` and `assertEmittable` from `./emit-gate.ts`.
  - Construct an **empty** sink near the top of `generate()`:
    `const diagnostics = new DiagnosticSink();` (PR-H will populate it via the phase
    ctxs; PR-G leaves it empty).
  - Insert the gate call **after** `const nodeMap = assemble(optimized, …)` (line ~218,
    after `traceAssembleNodes`) and **before** any emit work — i.e. before
    `emitNodeModel` / `hydrateSlotRefs` / `emitAll` (line ~268):
    ```ts
    // Assemble→Project gate (PR-G). Inert until PR-L: nothing emits `fail`, so
    // the sink is empty and this never throws. Threading real diagnostics into
    // `diagnostics` is PR-H's job (phase contexts).
    assertEmittable(nodeMap, diagnostics);
    ```
  - Add a one-line comment on the empty-sink construction pointing at PR-H.
- [ ] **Run** the chosen test → GREEN. Full codegen test suite
  `pnpm --filter @sittir/codegen test` → green.
- [ ] **Commit** `feat(generate): wire inert Assemble→Project gate at assemble boundary`.

### Task 4 — Gate: additivity proof + native counts unchanged

This is the acceptance gate for the whole PR. **Additive infra ⇒ emitted code is
byte-identical.**

- [ ] **Regenerate all three grammars** (the executor runs; this worktree has no
  `node_modules`, so this task is for the merge-time executor, not the planner):
  `pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src`
  (and `typescript`, `python`).
- [ ] **Byte-diff is empty** (THE additivity proof):
  `git diff --stat packages/{rust,python,typescript}/src packages/{rust,python,typescript}/.sittir`
  → **no changes**. If anything differs, PR-G changed emitted output → it is not
  additive → investigate before proceeding.
- [ ] **Native counts unchanged** via `pnpm validate:native` (NOT raw `counts`):
  rust deep AST **125** · ts **72** · python **76**. (Baseline from master-plan.)
- [ ] **Unit tests green:** `diagnostics.test.ts`, `emit-gate.test.ts`, the
  generate-level test, and the full `@sittir/codegen` suite.
- [ ] **Typecheck clean** across the codegen package.
- [ ] **Commit** any validator manifest churn separately if `validate:native` writes
  fixture/manifest files (`chore(validator): record validation run`), keeping the
  feature commits clean. Do **not** sweep unrelated hook-staged files (commit with
  explicit pathspecs: `git commit -- <paths>`).

---

## Acceptance criteria (summary)

1. `diagnostics.ts` exports `DiagnosticSink` + `EmitHaltedError`; `Severity` includes
   `'fail'`; existing `Severity`/`Diagnostic`/`canProceed` and the legacy preflight
   are untouched.
2. `emit-gate.ts` exports `assertEmittable(nodeMap, sink)`, inert when no `fail`,
   throws `EmitHaltedError` on a `fail`.
3. `generate.ts` constructs an empty sink and calls `assertEmittable` exactly once,
   at the Assemble→Emit boundary.
4. **`pnpm validate:native` counts unchanged** (rust 125 / ts 72 / py 76).
5. **Generated output byte-identical** (`git diff --stat` of `packages/*/src` +
   `packages/*/.sittir` empty) — the additivity proof.
6. New unit tests pass; codegen typecheck clean.
7. The `collect-slots.ts:61-68` warner move and any sink-routing are **deferred to
   PR-H**; no severity is `fail` (gate inert) until PR-L.

## Notes for the executor

- This PR is **not rust-emitting**: no `cargo check` needed, but `validate:native`
  still rebuilds the `.node` (the staleness guard), so trust its counts over raw
  `counts --backend native`.
- Keep PR-G off the `patternReplacementKinds` spike branch (disjoint files; do not
  rebase onto it).
- The two-blocking-notions duality (`canProceed` legacy preflight vs `fail` new gate)
  is intentional and converges at PR-L — call it out in the PR description so a
  reviewer doesn't read it as a defect.
