# Repeated-Slot Grouping Diagnostic — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Simplify-time propose-promotion diagnostic that enforces "a slot never contains multiple slots; a multi-slot substructure must be a group," surfacing visible-group / field-naming / ambiguous proposals to the author without changing codegen behavior.

**Architecture:** A pure, shared `countSlots(rule)` (built on the existing `isNonterminalRuleType` Table-1 predicate) is the single source of truth for the slot count. A new `diagnoseSlotGrouping` pass runs inside `computeSimplifiedRules` (Simplify), walks each `SimplifiedRule`, and emits propose-promotion records through the existing derivation-log/console channel. Nothing drives codegen — native counts must hold exactly.

**Tech Stack:** TypeScript (ESM, `.ts` local imports), tsx + tsconfig paths (no build needed), vitest, the sittir codegen compiler pipeline.

**Spec:** `docs/superpowers/specs/2026-05-25-repeated-slot-grouping-diagnostic-design.md`

**Read first:** `@docs/compiler-phase-glossary.md` (Phase 3.5 Simplify, `rule-catalog.ts` Table 1), `feedback_metadata_not_behavior`, `feedback_synthesis_and_fact_taxonomy`.

---

## File Structure

- **Create** `packages/codegen/src/compiler/slot-count.ts` — `countSlots(rule): number`, the shared recursive counter mirroring `collectSlots` distribution, built on `isNonterminalRuleType`.
- **Create** `packages/codegen/src/compiler/slot-count.test.ts` — unit tests for the Table-1-aligned distribution + a convergence assertion against `collectSlots`.
- **Create** `packages/codegen/src/compiler/diagnose-slot-grouping.ts` — `diagnoseSlotGrouping(rules): SlotGroupingDiagnostic[]`, the three-shape walk.
- **Create** `packages/codegen/src/compiler/diagnose-slot-grouping.test.ts` — per-shape detection tests.
- **Modify** `packages/codegen/src/compiler/simplify.ts` — invoke `diagnoseSlotGrouping` in/after `computeSimplifiedRules`; thread records to the derivation log; print during regen.
- **Modify** `packages/codegen/src/compiler/collect-slots.ts` — (Task 5, optional/guarded) route its slot-count logic through `countSlots` to remove the duplicated distribution.

---

## Chunk 1: Shared count + diagnostic

### Task 1: `countSlots` shared primitive

**Files:**
- Create: `packages/codegen/src/compiler/slot-count.ts`
- Test: `packages/codegen/src/compiler/slot-count.test.ts`

- [ ] **Step 1: Write failing tests** for the Table-1 distribution:

```ts
import { describe, it, expect } from 'vitest';
import { countSlots } from './slot-count.ts';

const sym = (name: string) => ({ type: 'symbol', name }) as any;
const str = (v: string) => ({ type: 'string', value: v }) as any;
const seq = (...m: any[]) => ({ type: 'seq', members: m }) as any;
const choice = (...m: any[]) => ({ type: 'choice', members: m }) as any;
const repeat = (content: any) => ({ type: 'repeat', content }) as any;
const field = (fieldName: string, content: any) => ({ type: 'field', fieldName, content }) as any;

describe('countSlots — Table 1 distribution', () => {
  it('symbol = 1', () => expect(countSlots(sym('x'))).toBe(1));
  it('bare literal = 0', () => expect(countSlots(str(','))).toBe(0));
  it('seq distributes nested seq', () =>
    expect(countSlots(seq(str('('), seq(sym('a'), str(','), sym('b')), str(')')))).toBe(2));
  it('choice is ONE union slot (not distributed)', () =>
    expect(countSlots(choice(sym('a'), sym('b'), str('lit')))).toBe(1));
  it('literal-only choice still 1 slot', () =>
    expect(countSlots(choice(str('<'), str('>')))).toBe(1));
  it('field = 1', () => expect(countSlots(field('n', seq(sym('a'), sym('b'))))).toBe(1));
  it('repeat of single symbol = 1', () => expect(countSlots(repeat(sym('x')))).toBe(1));
  it('seq of only literals = 0', () => expect(countSlots(seq(str(','), str(';')))).toBe(0));
});
```

- [ ] **Step 2: Run, verify fail** — `pnpm exec vitest run packages/codegen/src/compiler/slot-count.test.ts` → FAIL (module/function missing).
- [ ] **Step 3: Implement `countSlots`** mirroring the spec table: `seq` → sum of children; `choice`/`symbol`/`supertype`/`pattern`/`enum`/`field`/`optional`/`repeat`/`repeat1` → 1 (recurse for the inner group question but contribute 1); `variant`/`group`/`clause` → transparent recurse; `string`/`terminal`/`indent`/`dedent`/`newline` → 0. Build leaf-slot detection on `isNonterminalRuleType` from `rule-catalog.ts` (do not re-derive terminality).
- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** — `git add packages/codegen/src/compiler/slot-count.ts packages/codegen/src/compiler/slot-count.test.ts && git commit -m "feat(compiler): countSlots shared slot counter (Table-1 distribution)"`

### Task 2: convergence test — `countSlots` agrees with `collectSlots`

**Files:**
- Test: `packages/codegen/src/compiler/slot-count.test.ts` (extend)

- [ ] **Step 1: Add a test** that, for a set of representative simplified rules (including a multi-slot nested seq, a field-named choice, a supertype repeat), `countSlots(rule)` equals `deriveSlots(rule).length`. This pins the DRY contract WITHOUT yet refactoring `collectSlots` (lower risk).
- [ ] **Step 2: Run** — if any case disagrees, reconcile `countSlots` to `collectSlots` semantics (collectSlots is the reference). Expected: PASS.
- [ ] **Step 3: Commit** — `feat(compiler): pin countSlots ≡ collectSlots length`

### Task 3: `diagnoseSlotGrouping` — three-shape detection

**Files:**
- Create: `packages/codegen/src/compiler/diagnose-slot-grouping.ts`
- Test: `packages/codegen/src/compiler/diagnose-slot-grouping.test.ts`

- [ ] **Step 1: Define the record type + write failing tests**:

```ts
export type SlotGroupingShape = 'multi-slot-nested-seq' | 'supertype-list' | 'repeat-choice-with-literal';
export interface SlotGroupingDiagnostic {
  readonly ownerKind: string;
  readonly shape: SlotGroupingShape;
  readonly slotCount: number;
  readonly proposal: string; // human-readable propose-promotion text
}
```
Tests: a rule with `repeat(seq(sym a, sym b))` → one `multi-slot-nested-seq` (slotCount 2); `repeat(sym _type)` (single supertype symbol) → one `supertype-list`; `repeat(choice(sym a, str ','))` → one `repeat-choice-with-literal`; a single-slot `repeat(seq(str ',', sym a))` → **no** diagnostic.

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement the walk** over each rule: visit nested `seq` nodes (any depth) and `repeat`/`repeat1` nodes. Per node: ① nested seq with `countSlots ≥ 2` and not already a `group` → `multi-slot-nested-seq`, proposal = the `groups:` recipe; ② `repeat`/`repeat1` of a single non-field-named supertype/symbol → `supertype-list`, proposal = the `transforms: { kind: { '(_sym)': field('name') } }` recipe; ③ `repeat(choice(... ≥1 literal ...))` → `repeat-choice-with-literal`, proposal = "field or visible group; author decides." A node already field-named or already a registered group is silent.
- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** — `feat(compiler): diagnoseSlotGrouping three-shape detection`

### Task 4: wire into Simplify + regen console output

**Files:**
- Modify: `packages/codegen/src/compiler/simplify.ts`

- [ ] **Step 1: Write a failing test** (extend an existing simplify or compiler test) asserting that compiling a grammar fixture containing a multi-slot `repeat(seq)` yields a `multi-slot-nested-seq` diagnostic in the returned/logged records.
- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement** — call `diagnoseSlotGrouping(simplifiedRules)` at the end of `computeSimplifiedRules`; attach records to the derivation log (reuse the existing channel; do NOT add behavior). Print a concise per-record line during regen (guarded so it's informational, not an error). Per `feedback_metadata_not_behavior`, the records must not feed any downstream decision.
- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** — `feat(compiler): surface slot-grouping diagnostics at Simplify`

## Chunk 2: Verification + (guarded) DRY consolidation

### Task 5: regen all 3 + native counts hold exactly

**Files:** none (verification)

- [ ] **Step 1:** Full `--all` regen for rust/python/typescript.
- [ ] **Step 2:** **Real** `napi build` per crate (force `pnpm -C rust/crates/<crate> run build`, ~20s; reject cached no-ops) + `cargo check --workspace --features napi-bindings`.
- [ ] **Step 3:** `SITTIR_INTERNAL_CODEGEN_RUN=1 SITTIR_AUDIT_DERIVE=1 pnpm exec tsx packages/validator/src/cli.ts counts --backend native <g>` for all 3. **MUST hold EXACTLY: rust 181/134/125, python 107/96/74, ts 174/82/75.** Any movement = the diagnostic accidentally drove behavior → fix before proceeding.
- [ ] **Step 4:** Eyeball the regen console: confirm `tuple_type` is **silent** (already field-named), and the rust multi-slot auto-group helpers + `type_arguments`/`object_type` surface as expected proposals.
- [ ] **Step 5: Commit** the regenerated artifacts (stage by explicit grammar paths; `--no-verify` only if `git status` confirms the staged set is exactly the intended artifacts vs the unrelated `test-fixtures.json` drift).

### Task 6 (optional, guarded): route `collectSlots` through `countSlots`

**Files:**
- Modify: `packages/codegen/src/compiler/collect-slots.ts`

- [ ] Only if Task 2's convergence holds cleanly AND there's a single obvious count site in `collectSlots`. Replace the inline count with `countSlots` to remove the duplicated distribution (the full DRY win). Re-run Task 5's count gate — must still hold exactly. If the refactor risks the field-named-choice / `mergeChoiceArms` logic, STOP and leave Task 2's convergence test as the DRY guarantee instead.

---

## Plan Review

After Chunk 1 and Chunk 2, dispatch `plan-document-reviewer` (or self-review) against the spec; fix and re-review until approved. Then execution handoff.
