# PR-H — Phase Rename + `transforms.ts` + ctx + node-behavior→class — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename `compiler/optimize.ts`→`compiler/normalize.ts`, extract the shared idempotent rule-transforms into a new `compiler/transforms.ts`, introduce the `(target, ctx)` phase-context signatures (carrying PR-G's `DiagnosticSink`), and move two node-behavior facts onto the `AssembledNode` classes — all behavior-preserving except the `markParameterlessKinds`-fixpoint→memoized-getter reimplementation.

**Architecture:** Strangler step on the spine `…→ G → H → M → I → …`. This PR is **mostly a name/location reorg** (spec §3/§7.7, principle #13/#14). The hard constraint: **every name/location change is executed by the copilot CLI's LSP (read/WRITE), NOT by hand-edits and NOT by Claude Code's read-only LSP** — hand text-edits miss re-exports, aliased imports, type-only imports, and JSDoc `{@link}` references. Claude Code preps the skeleton and does all *signature/logic* changes in place on the OLD filenames/names; copilot does all *pure moves/renames* LAST.

**Tech Stack:** TypeScript (ESM, `.ts` local imports), `pnpm`, the codegen pipeline in `packages/codegen/src/compiler/`, vitest, the `pnpm validate:native` gate.

**Source of truth:** spec `docs/superpowers/specs/2026-05-22-compiler-simplification-design.md` §3 (module org), §5 PR-H row (line 1519), §7.1/§7.3/§7.7 (method/class inventory + ctx types); master plan `docs/superpowers/plans/2026-05-26-compiler-simplification-master-plan.md`.

---

## ★★★ CRITICAL EXECUTION CONSTRAINT — copilot-CLI does the renames ★★★

**Read this before touching anything.** Per `feedback_use_ts_lsp_for_moves` + the master-plan execution rule (line 23), the **mechanical name/location changes in PR-H** — the `optimize.ts`→`normalize.ts` file move and the `optimize`→`normalizeGrammar` symbol rename and the five symbol-moves into `transforms.ts` — **MUST be executed via the copilot CLI**, which has LSP read/WRITE. Claude Code's LSP is effectively read-only. Hand text-edits miss:

- **Re-exports** (e.g. `optimize.ts:845` re-exports `tokenToName` from `link.ts`; `node-map.ts:52` imports `tokenToName` *from* `optimize.ts` — a pass-through that hand-edits silently break).
- **Aliased imports** (`import { X as Y }`).
- **Type-only imports** (look different from value imports).
- **JSDoc `{@link Foo}` references.**

### The exact taxonomy (the core deliverable)

The line is NOT "rename = copilot, logic = hand". The precise rule:

> **A *name or location* change → copilot LSP. A *signature/body* change → hand-edit (Claude Code), even when the symbol name is unchanged.**

**COPILOT LSP steps (pure name/location, no body change):**

| Op | From → To | Notes |
|---|---|---|
| `move-file` | `compiler/optimize.ts` → `compiler/normalize.ts` | updates all ~16 importers + the re-export chain |
| `move-file` | `__tests__/optimize.test.ts` → `__tests__/normalize.test.ts` | the test file follows its subject |
| `rename-symbol` | `optimize` → `normalizeGrammar` | the phase entry point (§7.7); updates all call sites + imports |
| `move-symbol-to-file` ×4 | `collapseSeq`, `canonicalizeSeqOfLeaves`, `inlineRefs`, `pushAttrsToLeaves` → `transforms.ts` | shared Normalize∩Simplify ops (§3) — currently in `simplify.ts`/`wrapper-deletion.ts` |
| `move-symbol-to-file` + `rename-symbol` | `deleteWrapper`/`applyWrapperDeletion` → `transforms.ts` as `pushdownWrappers` | a move AND a rename |

**HAND-EDIT steps (Claude Code) — NOT copilot:**

- Defining the ctx interfaces `TransformCtx` / `NormalizeCtx` / `SimplifyCtx` / `AssembleCtx` (new code).
- **Every `(target, ctx)` signature change.** Critically, `fanOutSeqChoices` / `factorChoiceBranches` / `dedupeSeqMembers` / `collapseWrappers` **keep their names** — they only *gain* a `ctx` parameter and lose their positional args. These are **signature-only → ZERO copilot steps.** LSP `rename-symbol` does nothing for them and cannot rewrite call-site argument lists. Do NOT list them as rename steps. Same for `link`, `computeSimplifiedRules`, `assembleModel`'s arg-list changes.
- The node-behavior→class moves (`markUserFacing` method shape; the `markParameterlessKinds`→getter reimplementation).
- The final stale-prose grep-sweep (LSP catches `{@link}`, not bare-backtick prose).

### Why the ordering matters (chicken-and-egg)

`TransformCtx` must **exist** before any signature can thread it. And you cannot attribute a gate failure if move+rename+resignature land in one copilot shot. Therefore the verifiable order is:

1. **(hand)** create `transforms.ts` containing ONLY the ctx interfaces (importing `DiagnosticSink` from PR-G's `diagnostics.ts`).
2. **(hand)** thread ctx + change ALL signatures **in place on the OLD `optimize.ts` / OLD symbol names**. Gate: compiles + counts hold.
3. **(hand)** node-behavior→class (incl. the characterized parameterless-getter swap). Gate: counts hold.
4. **(copilot, LAST)** all pure moves/renames in one coordinated pass. Gate: generated byte-diff empty.

This also satisfies the sequencing note below: every hand-edit lands on the OLD filename; copilot renames the file *after*, which is far cleaner than the reverse.

### Copilot invocation reference (`reference_copilot_cli_connect`)

```bash
GITHUB_TOKEN= copilot --connect=<sessionId> -p "<prompt>" -s --allow-all-tools
```
- `--connect=<sessionId>` attaches to the live MC-backed session (dir under `~/.copilot/session-state/<sessionId>/`); requires `workspace.yaml` `remote_steerable: true`.
- Each invocation bills a turn and is visible in the target session's transcript. Treat it as a coordination tool, not a heartbeat.
- The exact per-step prompts are in **Task 5** below.

---

## ⚠ SEQUENCING — PR-H implements AFTER two upstream merges

PR-H **must not start** until BOTH have merged to `master`:

1. **PR-G** (`pr-g-diagnostics-gate`, worktree `../sittir-prg`, plan `docs/superpowers/plans/2026-05-30-pr-g-diagnostics-gate.md`) — adds `DiagnosticSink` (class, `emit()`/`all()`/`hasBlocking()`), `EmitHaltedError`, and widens `Severity` to include `'fail'`, all in `compiler/diagnostics.ts`; adds `emit-gate.ts::assertEmittable(nodeMap, sink)`; and `generate.ts` constructs an **empty** sink and calls the gate at the Assemble→Emit boundary. **PR-H threads that sink into the phase ctxs.** PR-G routes nothing into the sink — PR-H is the first PR to put diagnostics through it (the `collect-slots.ts:92` module-global `unnamedChoiceWarner` moves into `AssembleCtx.diagnostics`).
2. **The in-flight `patternReplacementKinds`/`inlineSingleUseHidden` cleanup** — it edits `optimize.ts`'s `inlineSingleUseHidden`/`applyNormalizationPasses` `preserveKinds` path (`optimize.ts:85/110/134/471`, `link.ts:516/544`). Doing that small edit on the **OLD `optimize.ts` filename** and then letting copilot rename the file is far cleaner than rebasing a file-rename under it. Reference it abstractly — do not pin a branch.

**Re-measure the baseline at PR-H start** (master may have moved). Carry-forward gate target: **rust ast 125 · ts ast 72 · python ast 76** (native deep read-render-parse).

---

## Gate (bifurcated — state both explicitly)

- **Rename portions (Task 5):** **generated byte-diff EMPTY** — a pure name/location move changes no emitted code. Verify with `git diff --stat packages/*/src packages/*/.sittir` after regen; expect no change. **Baseline note:** "empty" here is measured **relative to the post-Task-4 tree** (the committed state after Chunks 1–2), NOT relative to `master`. Tasks 1–4 legitimately change behavior and are count-gated, not byte-gated; only Task 5's pure rename is byte-gated.
- **ctx-threading + node-behavior→class portions (Tasks 1–4):** **`pnpm validate:native` counts hold-or-improve** (rust 125 / ts 72 / py 76) + full `pnpm --filter @sittir/codegen test` green. These portions may add behavior (the parameterless getter is a reimplementation), so they are count-gated, not byte-gated.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `packages/codegen/src/compiler/transforms.ts` | NEW — the shared ctx interfaces + the idempotent ops both Normalize & Simplify call | Create (ctx in Task 1; ops moved in by copilot, Task 5) |
| `packages/codegen/src/compiler/optimize.ts` → `normalize.ts` | the Normalize phase (RenderRule production); `normalizeGrammar` entry | hand-resignature in place (Tasks 2–3); copilot renames file + `optimize`→`normalizeGrammar` (Task 5) |
| `packages/codegen/src/compiler/simplify.ts` | the Simplify phase; loses the 4 shared ops to `transforms.ts` | signatures → `(rule, ctx, inField?)` (hand, Task 2); 3 ops move out (copilot, Task 5) |
| `packages/codegen/src/compiler/wrapper-deletion.ts` | leaf-attribute push; `deleteWrapper`/`applyWrapperDeletion` → `pushdownWrappers` in `transforms.ts` | source of `pushdownWrappers` move (Task 5) |
| `packages/codegen/src/compiler/assemble.ts` | the Assemble phase; `markUserFacing` method; DELETE `markParameterlessKinds` fixpoint | hand (Tasks 3–4) |
| `packages/codegen/src/compiler/node-map.ts` | the `AssembledNode*` classes; NEW memoized getters | hand (Task 3) |
| `packages/codegen/src/compiler/generate.ts` | pipeline driver; constructs the ctxs and passes them | hand (Task 2) |
| `packages/codegen/src/compiler/diagnostics.ts` | (PR-G) `DiagnosticSink` — imported by `transforms.ts` | read-only dependency |

---

## Chunk 1: ctx skeleton + signature threading (hand-edit, OLD names)

### Task 1: Create `transforms.ts` with ONLY the ctx interfaces

**Files:**
- Create: `packages/codegen/src/compiler/transforms.ts`
- Reference: `packages/codegen/src/compiler/diagnostics.ts` (PR-G's `DiagnosticSink`)
- Reference: spec §7.7 lines 2079–2112

> **Why ctx-only first:** the shared ops can't move here until copilot's pass (Task 5), and the signatures can't thread a ctx that doesn't exist yet. So this file is born holding only the interfaces; the ops arrive by LSP move last.

- [ ] **Step 1: Write the failing test**

Create `packages/codegen/src/compiler/transforms.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import type { TransformCtx, NormalizeCtx, SimplifyCtx } from './transforms.ts';
import { DiagnosticSink } from './diagnostics.ts';

describe('transform ctx shapes', () => {
  it('TransformCtx carries rules, inlineKinds, optional wordMatcher, diagnostics', () => {
    const ctx: TransformCtx = {
      rules: {},
      inlineKinds: new Set<string>(),
      diagnostics: new DiagnosticSink(),
    };
    expect(ctx.diagnostics).toBeInstanceOf(DiagnosticSink);
    // NormalizeCtx is an alias; SimplifyCtx extends — both ARE a TransformCtx.
    const n: NormalizeCtx = ctx;
    const s: SimplifyCtx = ctx;
    expect(n).toBe(s);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sittir/codegen test transforms`
Expected: FAIL — `transforms.ts` does not export `TransformCtx`.

- [ ] **Step 3: Write minimal implementation**

Create `packages/codegen/src/compiler/transforms.ts`:
```ts
/**
 * compiler/transforms.ts — shared, idempotent rule transforms (#13a) +
 * the phase-context base type (#14 / §7.7). The transform BODIES move in via
 * the copilot LSP pass (PR-H Task 5); this file is born holding only the ctx
 * contract so signatures across normalize/simplify can thread it.
 */
import type { Rule } from './types.ts';
import type { DiagnosticSink } from './diagnostics.ts';

/** The shared base ctx, declared ONCE (spec §7.7 / CW5). */
export interface TransformCtx {
  readonly rules: Record<string, Rule>;
  readonly inlineKinds: ReadonlySet<string>;
  readonly wordMatcher?: (s: string) => boolean;
  readonly diagnostics: DiagnosticSink;
}

/** Normalize adds no phase-shared state of its own. */
export type NormalizeCtx = TransformCtx;

/**
 * Simplify carries the same phase-shared state. `inField` is NOT here — it is
 * recursion-LOCAL traversal state, kept an explicit recursion param (CW6).
 */
export interface SimplifyCtx extends TransformCtx {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @sittir/codegen test transforms`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/compiler/transforms.ts packages/codegen/src/compiler/transforms.test.ts
git commit -m "feat(compiler): add transforms.ts ctx skeleton (TransformCtx/NormalizeCtx/SimplifyCtx)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 2: Define `AssembleCtx` and thread ctx through the phase signatures (in place, OLD names)

**Files:**
- Modify: `packages/codegen/src/compiler/assemble.ts` (define `AssembleCtx`; resignature `collectSlots`, `classifyNode`, the post-passes)
- Modify: `packages/codegen/src/compiler/optimize.ts` (resignature `fanOutSeqChoices`/`factorChoiceBranches`/`dedupeSeqMembers`/`collapseWrappers`/`inlineSingleUseHidden` to take `ctx`; `optimize(linked, ctx)`)
- Modify: `packages/codegen/src/compiler/simplify.ts` (`simplifyRule(rule, ctx, inField?)`, `collapseSeq(rule, ctx, inField?)`; the module-global slot-grouping accumulator moves into `ctx.diagnostics`)
- Modify: `packages/codegen/src/compiler/link.ts` (`link(raw, ctx)`; `resolveRule`/`classifyHiddenRule` extra args → ctx — per §7.7 line 2156-7)
- Modify: `packages/codegen/src/compiler/collect-slots.ts` (the `unnamedChoiceWarner` module-global at `:92` → read from `AssembleCtx.diagnostics`)
- Modify: `packages/codegen/src/compiler/generate.ts` (construct the ctxs from `linked`/`inlinableKinds`/`wordMatcher`/`kindEntries` + the PR-G sink; pass to each phase)
- Reference: spec §7.7 lines 2130–2186 (the exhaustive end-state method map)

> **Keep names, change shapes.** None of these functions is renamed in this task. `optimize` keeps its name here (copilot renames it to `normalizeGrammar` in Task 5). The point is to make every pipeline method `(target, ctx[, inField?])` while still on the old filename, so the copilot move in Task 5 is purely positional.

- [ ] **Step 1: Write the failing test**

Add to `packages/codegen/src/__tests__/optimize.test.ts` (still the OLD filename) a ctx-shape assertion:
```ts
it('optimize accepts a ctx carrying the diagnostics sink', () => {
  const ctx = { rules: {}, inlineKinds: new Set<string>(), diagnostics: new DiagnosticSink() };
  // signature compiles only after the resignature lands
  const out = optimize(linkedFixture, ctx);
  expect(out.rules).toBeDefined();
});
```
(Import `DiagnosticSink` from `../compiler/diagnostics.ts`; `linkedFixture` from the existing harness.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sittir/codegen test optimize`
Expected: FAIL — `optimize` still takes `(linked, inlineKinds?, polymorphsConfigSkip?)`.

- [ ] **Step 3: Implement the resignatures**

For each function, fold its positional/optional args into the ctx and read them off `ctx`:
- `optimize(linked, inlinableKinds, polymorphsConfigSkip)` → `optimize(linked, ctx: NormalizeCtx)` where `inlineKinds`/`patternReplacementKinds`/`wordMatcher` live on `ctx`. Internal calls `inlineSingleUseHidden(rules, ctx)`, `applyNormalizationPasses(rules, ctx)` (the `preserveKinds`/`patternReplacementKinds` becomes `ctx`-carried — coordinate with the upstream cleanup).
- `fanOutSeqChoices(rule)` / `factorChoiceBranches(rule)` / `dedupeSeqMembers(rule)` / `collapseWrappers(rule)` → add `ctx` param (currently pure-`rule`; ctx is unused-but-uniform, enabling the single trace wrapper #14). **These keep their names.**
- `simplifyRule(rule, wordMatcher?, inField?)` → `simplifyRule(rule, ctx, inField?)`; `collapseSeq(rule, wordMatcher?, inField?)` → `collapseSeq(rule, ctx, inField?)` (`inField` stays an explicit recursion param, CW6).
- `collectSlots(rule, kindForName?, kindEntries?, inherited?, sep?)` → `collectSlots(rule, ctx: AssembleCtx)`.
- The `collect-slots.ts:92` `unnamedChoiceWarner` module-global → a call onto `ctx.diagnostics` (PR-G sink). Same for the `simplify.ts:48-82` slot-grouping accumulator: drain into `ctx.diagnostics` instead of the module-level mutable.
- Define `AssembleCtx` in `assemble.ts` per §7.7 lines 2102–2111 (`kindEntries?`, `nodeMap`, `diagnostics`).
- `generate.ts`: build a `NormalizeCtx`/`SimplifyCtx`/`AssembleCtx` from the locals already present (`inlinableKinds`, the word matcher, `kindEntries`) + the empty `DiagnosticSink` PR-G constructs, and pass them down.

- [ ] **Step 4: Run tests + the native gate**

Run: `pnpm --filter @sittir/codegen test`
Expected: PASS.
Run: `pnpm validate:native`
Expected: counts hold — **rust ast 125 · ts ast 72 · python ast 76**.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/compiler packages/codegen/src/__tests__/optimize.test.ts
git commit -m "refactor(compiler): thread (target, ctx) signatures + AssembleCtx; route diagnostics to PR-G sink

Behavior-preserving signature reshape on the OLD optimize.ts filename; copilot
performs the file/symbol rename in a later step. Module-global warners (collect-slots,
slot-grouping) move into ctx.diagnostics.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Chunk 2: node-behavior → class (hand-edit)

### Task 3: `markParameterlessKinds` fixpoint → memoized cycle-guarded getter

**Files:**
- Modify: `packages/codegen/src/compiler/node-map.ts` (`AssembledNodeBase` — add memoized `isParameterless`/`stampExpression`/`stampChildExpression` getters; `AssembledKeyword:3250`/`AssembledToken:3289` override the base case)
- Modify: `packages/codegen/src/compiler/assemble.ts` (DELETE `markParameterlessKinds:761`, `_isParameterlessSlot:688`-area, `_stampExpressionForSlot:716`, `markNodeParameterless:742`, the call at `:256`)
- Test: `packages/codegen/src/compiler/__tests__/parameterless-characterization.test.ts` (NEW)
- Reference: spec §7.3 line 1803/1813/1814, §7.7 line 2181/2191

> **This is the one genuinely behavioral change in PR-H — a reimplementation, not a rename.** The fixpoint→DFS-with-cycle-guard is where "behavior-preserving" can silently break. Characterize FIRST, then delete.

- [ ] **Step 1: Write the characterization test (snapshot the CURRENT fixpoint output)**

```ts
// Run the CURRENT pipeline (fixpoint still in place) and snapshot, for every
// kind in each grammar, { isParameterless, stampExpression, stampChildExpression }.
import { describe, it, expect } from 'vitest';
import { buildNodeMapForGrammar } from '<existing harness>';

describe.each(['rust', 'typescript', 'python'])('parameterless characterization: %s', (g) => {
  it('snapshot', () => {
    const nm = buildNodeMapForGrammar(g);
    const snap = [...nm.nodes.values()]
      .map((n) => [n.kind, n.isParameterless ?? false, n.stampExpression ?? null, n.stampChildExpression ?? null])
      .sort();
    expect(snap).toMatchSnapshot();
  });
});
```

- [ ] **Step 2: Run to capture the baseline snapshot (PASS, writes `.snap`)**

Run: `pnpm --filter @sittir/codegen test parameterless-characterization`
Expected: PASS — `.snap` written from the **current fixpoint**. Commit this snapshot as the contract.

- [ ] **Step 3: Implement the memoized getter; delete the fixpoint**

On `AssembledNodeBase` (§7.3): add a memoized, cycle-guarded `isParameterless` getter computed by DFS over `slot.values[].node` (resolved by `hydrateSlotRefs`, so no `nodeMap`/`ctx` needed — a true pure getter). **Cycle rule:** a node whose computation is *in progress* is **NOT parameterless** (a required cyclic reference genuinely needs a parameter — this terminates without convergence iteration and matches the fixpoint's never-marks-a-cycle behavior). `stampExpression` likewise memoized; `stampChildExpression` stays the existing getter wrapper. Convert the former helpers (`isAutoStampSlot`/`getSlotsForParameterless`/`_stampExpressionForSlot`) to private methods backing the getter. In `AssembledKeyword`/`AssembledToken`, replace the constructor field-sets (`node-map.ts:3250/3289`) with getter **overrides** returning `true` + the literal stamp (base case). Delete `markParameterlessKinds` + helpers + the `assemble.ts:256` call.

> **Verify two invariants explicitly:** (a) the getter runs only AFTER `hydrateSlotRefs` (slot refs resolved) — assert ordering in `assemble.ts`; (b) the cycle rule matches the fixpoint (cycle ⇒ not-parameterless).

- [ ] **Step 4: Run the characterization test against the getter (must reproduce the snapshot byte-for-byte)**

Run: `pnpm --filter @sittir/codegen test parameterless-characterization`
Expected: PASS — getter output **identical** to the committed fixpoint snapshot. If it diverges, the cycle rule or DFS is wrong; do NOT update the snapshot to match.
Run: `pnpm validate:native`
Expected: counts hold (factory auto-stamp output unchanged → rust 125 / ts 72 / py 76).

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/compiler/node-map.ts packages/codegen/src/compiler/assemble.ts packages/codegen/src/compiler/__tests__/parameterless-characterization.test.ts
git commit -m "refactor(compiler): markParameterlessKinds fixpoint -> memoized cycle-guarded getter

Pure re-derivation (Principle #1): parameterless iff every required slot references
a parameterless kind. Cycle = not-parameterless (matches fixpoint's never-marks-a-cycle).
Characterization snapshot proves byte-identical factory auto-stamp output.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

### Task 4: `markUserFacing` → `(node, ctx)` method (+ merge `markVariantChildrenUserFacing`, M3)

**Files:**
- Modify: `packages/codegen/src/compiler/assemble.ts` (`markUserFacing:1118` → `(node, ctx)`; merge `markVariantChildrenUserFacing:1159` into it — M3; the `:257`/`:258` calls become the single pass)
- Reference: spec §7.7 line 2180, §4 lines 851–871 (`markUserFacing` flags `_`-prefixed-but-visible groups)

> **Stays a method, NOT a getter** — `userFacing` is computed from *cross-node* state (is this hidden kind an alias source in some *other* node's slot), so per #14 it is `(node, ctx)` with `ctx.nodeMap`, never a getter-with-arg. Emitters keep reading the populated `node.userFacing` field (field-read) — no read-site migration.

- [ ] **Step 1: Write the failing test**

Assert that after the single merged pass, both the alias-source hidden kinds AND the variant children are `userFacing` (snapshot the set per grammar; compare to the current two-pass result).

- [ ] **Step 2: Run to verify it fails** (signature mismatch / merged pass not present).

- [ ] **Step 3: Implement** — one `markUserFacing(node, ctx)` method marking both the alias-source kinds and the variant children in a single pass (M3); the per-pair helpers stay private. Update the `assemble.ts` post-pass driver to call it `(node, ctx)`-style.

- [ ] **Step 4: Run tests + native gate**

Run: `pnpm --filter @sittir/codegen test` → PASS.
Run: `pnpm validate:native` → counts hold.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/compiler/assemble.ts
git commit -m "refactor(compiler): markUserFacing -> (node, ctx) method; merge markVariantChildrenUserFacing (M3)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Chunk 3: the copilot LSP pass (name/location ONLY — LAST)

### Task 5: copilot executes all moves + renames

> **Pre-flight:** Chunks 1–2 are merged/green. The tree compiles with the NEW signatures on the OLD filenames/names. Now and ONLY now does copilot run. Do each move as a SEPARATE copilot invocation so a gate failure is attributable. Verify the byte-diff after EACH.

**Files moved/renamed (no body changes):**
- `compiler/optimize.ts` → `compiler/normalize.ts`
- `__tests__/optimize.test.ts` → `__tests__/normalize.test.ts`
- symbol `optimize` → `normalizeGrammar`
- `collapseSeq` / `canonicalizeSeqOfLeaves` / `inlineRefs` → `transforms.ts`
- `deleteWrapper`/`applyWrapperDeletion` → `transforms.ts` as `pushdownWrappers`
- `pushAttrsToLeaves` → `transforms.ts`

- [ ] **Step 1: Confirm copilot session eligibility**

Identify the live remote-steerable copilot session id (`~/.copilot/session-state/<id>/`, `workspace.yaml` `remote_steerable: true`). If none is live, the user must start one in this worktree first.

- [ ] **Step 2: copilot — move the four shared ops into `transforms.ts`**

```bash
GITHUB_TOKEN= copilot --connect=<sessionId> -p "Using the TypeScript LSP move-symbol-to-file refactor (NOT text edits), move these symbols into packages/codegen/src/compiler/transforms.ts, updating every importer/re-export/aliased-import/type-only-import/{@link}: (1) collapseSeq and canonicalizeSeqOfLeaves and inlineRefs from compiler/simplify.ts; (2) pushAttrsToLeaves from compiler/wrapper-deletion.ts; (3) deleteWrapper/applyWrapperDeletion from compiler/wrapper-deletion.ts, renaming it to pushdownWrappers. Do NOT change any function body. Run pnpm --filter @sittir/codegen build to confirm no dangling imports." -s --allow-all-tools
```

- [ ] **Step 3: Verify after the move**

Run: `pnpm --filter @sittir/codegen test` → PASS.
Run: `git diff --stat packages/{rust,python,typescript}/src packages/*/. sittir 2>/dev/null` after a regen → **no generated change**.

- [ ] **Step 4: copilot — rename the symbol `optimize` → `normalizeGrammar`**

```bash
GITHUB_TOKEN= copilot --connect=<sessionId> -p "Using the TypeScript LSP rename-symbol refactor (NOT text edits), rename the exported function 'optimize' in packages/codegen/src/compiler/optimize.ts to 'normalizeGrammar'. Update ALL call sites, imports, re-exports, aliased imports, type-only imports, and JSDoc {@link} references across packages/codegen/src. Do NOT change the body. Then run pnpm --filter @sittir/codegen build." -s --allow-all-tools
```

- [ ] **Step 5: copilot — move the file `optimize.ts` → `normalize.ts` (+ the test file)**

```bash
GITHUB_TOKEN= copilot --connect=<sessionId> -p "Using the TypeScript LSP move-file refactor (NOT text edits), move packages/codegen/src/compiler/optimize.ts to packages/codegen/src/compiler/normalize.ts and packages/codegen/src/__tests__/optimize.test.ts to packages/codegen/src/__tests__/normalize.test.ts. Update ALL importers including the re-export of tokenToName (node-map.ts imports it from optimize.ts which re-exports it from link.ts — keep that pass-through intact, do NOT delete tokenToName), aliased imports, type-only imports, and {@link} references. Do NOT change any body. Then run pnpm --filter @sittir/codegen build." -s --allow-all-tools
```

> **`tokenToName` is the canonical re-export trap** (`optimize.ts:845` re-exports it from `link.ts`; `node-map.ts:52` imports it from `optimize.ts`). Hand-edits drop the pass-through; copilot's LSP carries it. Keep it a pass-through — its deletion is PR-I, not here.

- [ ] **Step 6: Verify the byte-diff EMPTY for the whole rename**

Run: `pnpm --filter @sittir/codegen build` → no dangling imports.
Run: `pnpm --filter @sittir/codegen test` → PASS.
Run a full regen, then `git diff --stat packages/*/src packages/*/.sittir` → **EMPTY** (a pure name/location move emits identical code; measured vs the post-Task-4 tree).
Run: `pnpm validate:native` → counts hold (rust 125 / ts 72 / py 76).

**Importer inventory — confirm copilot touched EVERY site (17 grep hits; `optimize.test.ts` itself moves, leaving 16 importers).** The two off-the-beaten-path script importers are the easiest to miss:
- `compiler/generate.ts:11`, `compiler/grammar-diagnostics.ts:3`, `compiler/node-map.ts:52` (the `tokenToName` pass-through), `compiler/diagnose-parsekind-collisions.test.ts:5`
- `compiler/__tests__/slot-structural-signals.test.ts:5`, `compiler/__tests__/node-map-backpointers.test.ts:5`
- `__tests__/render-module-emit.test.ts:29`, `__tests__/kindid-emit.test.ts:7`, `__tests__/factory-surface.test.ts:4`, `__tests__/evaluate.test.ts:20`, `__tests__/real-grammar.test.ts:4`, `__tests__/taxonomy.test.ts:4`, `__tests__/refine-emit.test.ts:19`, `__tests__/kind-id-rust-emit.test.ts:6`
- **`scripts/reconcile-naming.ts:28`, `scripts/regen-templates-rs.ts:18`** ← off `compiler/`+`__tests__/`; verify copilot updated the `scripts/` dir specifically.

After the move, `rg -n "from.*optimize" packages/codegen/src` must return zero hits.

- [ ] **Step 7: Final stale-prose grep-sweep (hand — LSP does NOT catch bare prose)**

LSP catches `{@link}`; it does NOT catch bare-backtick `` `optimize()` `` / "optimize phase" prose. Sweep and fix manually:
```bash
rg -n "optimize" packages/codegen/src --glob '*.ts' | rg -iv "optimizat"
```
Expected stale sites to fix to `normalize`/`normalizeGrammar`: `simplify.ts:30/46/48/71/82/236/238/669/779/1172/1244`, `generate.ts:4/135/161/213/214/307`, `rule-attrs.ts:7`, `types.ts:219/413/422`, `wrapper-deletion.ts:298`, `rule.ts:135`, `node-map.ts:3303`, `assemble.ts:135`, `link.ts:127`, `index.ts:4`, `diagnose-slot-grouping.test.ts:166/187`. (Comment-only — no behavior; keeps the tree honest so the byte-diff-empty claim isn't undercut by a stale-reading source.)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(compiler): rename optimize.ts->normalize.ts + optimize->normalizeGrammar; relocate shared ops to transforms.ts (copilot LSP)

Pure name/location move via copilot LSP (move-file/rename-symbol/move-symbol-to-file)
to catch re-exports/aliased/type-only imports + {@link}. Generated byte-diff empty.
Final manual sweep of stale 'optimize' prose comments.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification

- [ ] `pnpm --filter @sittir/codegen test` — full suite green (incl. the parameterless characterization snapshot).
- [ ] `pnpm validate:native` — **rust ast 125 · ts ast 72 · python ast 76** (hold-or-improve).
- [ ] Generated byte-diff over the rename portion — EMPTY.
- [ ] `rg "from.*optimize" packages/codegen/src` — no remaining importers of the old path.
- [ ] `rg "\boptimize\b" packages/codegen/src --glob '*.ts' | rg -iv optimizat` — no stale prose.
- [ ] Update the master-plan PR-H row to ✅ + record the gate numbers + link this plan.

## Out of scope (explicit YAGNI)

- `node`→`kind` field rename — **PR-P** (the `kind`-discriminant collision; PR-H does not touch it).
- Deleting `tokenToName`/`TOKEN_NAMES`/`charFallback` — **PR-I** (keep the re-export pass-through here).
- Folding `collect-slots.ts` into `assemble.ts` / deleting `slot-model.ts` — separate spec items, not PR-H.
- Routing `propose-*` `fail` diagnostics — **PR-L** (PR-H only threads the sink; severities stay non-fail).
- `wrapper-deletion.ts` fully folding into `normalize.ts` — §3 names it but only `pushdownWrappers` relocates here; the full fold is a later structural-dedup step (PR-O).
