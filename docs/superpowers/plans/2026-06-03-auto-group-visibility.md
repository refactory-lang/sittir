# Auto-Group Visibility & Declared-Alias Naming — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking. **Implementer agent: `sittir-codegen`. Diagnosis: `sittir-research`. Review: `sittir-review`.**

**Goal:** Let enrich hoist every `optional(seq)`/`repeat(seq)`/`repeat1(seq)` uniformly toward the IR, rendering correctly, by classifying each as **inline-safe** (hidden symbol + inline+gate) or **inline-unsafe** (surfaced as a **visible CST node via `alias()`**, with an explicitly-created rule entry for its kindId), declared `groups:` supplying only the visible name.

**Architecture:** A shared `isInlineSafe`/`ruleMatchesEmpty` predicate drives two branches: enrich hoists inline-safe `optional(seq)` into a hidden `_<parent>_N` symbol (today's clause path, generalized) and leaves inline-unsafe content inline; **link generalizes the existing `applyGroupOverrides` from declared-only to every inline-unsafe position**, reconstructing it into a visible **IR-only** synthesized kind (no tree-sitter grammar change → no LR conflict, no separate rule entry — the kind lives in the link rules map exactly as today's declared-group kinds do). Declared `groups:` entries only rename (no body rewrite).

**Tech Stack:** TypeScript ESM (`.ts` imports), tree-sitter grammar DSL, Askama/Jinja render templates, Rust napi native bindings.

**Spec:** `docs/superpowers/specs/2026-06-03-auto-group-visibility-design.md`. Read it first.

---

## CRITICAL conventions (read before any task)

- **Authoritative gate = RELEASE only:** `env -u SITTIR_NATIVE_DEBUG pnpm validate:native`. Confirm `Finished release profile [optimized]` in the build log AND read the explicit deep `read-render-parseAstMatchPass=` lines. **Debug builds segfault** (Node-v24/napi) — that is NOT a regression; never gate on debug. Floor: **rust 111 / ts 69 / py 74**; every increment must hold-or-improve.
- **Fast inner loop is debug-safe** for non-validation checks: regen (`pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src`), `cargo check`, `git diff` of generated artifacts, vitest. Only the validation RUNTIME is debug-broken.
- **Never stage** `rust/crates/sittir-*/test-fixtures.json` or `packages/validator/validation-history.jsonl`. Restore with `git checkout HEAD -- <path>`. **Commit by explicit pathspec** (`git commit -m … -- <files>`); never `git add` broad paths (stray compiled `.js` under `packages/codegen/src` is build leakage). A validator hook auto-commits benign `chore(validator)` records — leave them.
- **Generated artifacts are derived** — never hand-edit `packages/{rust,python,typescript}/src/*`, `templates/*.jinja`, `.sittir/*`, `factory-map.json5`. Fix codegen or `overrides.ts` and regen.
- The manifest pre-commit hook may flag a pre-existing `.node`/test-fixtures drift; for docs/plan commits use `--no-verify`; for code commits, regen the affected grammars and stage their outputs (NOT test-fixtures).
- **DRY is the #1 correctness rule.** One predicate, one synthesizer, one classification — consumed everywhere, re-derived nowhere.

## What is already committed (build on it, don't redo)

- `e6a096da` — travel-through infra (tag `metadata.source='enrich'` + `setGroupLiftRuleMap` lookup-and-patch). RELEASE-green at floor.
- The reverted 1a attempt is gone; the working tree is at clean floor. Re-derive the empty-guard + generalization here.

## File structure

| File | Responsibility | Action |
|---|---|---|
| `packages/codegen/src/dsl/group-classify.ts` | `isInlineSafe(seqBody)` + `ruleMatchesEmpty(rule)` — the shared predicates. Pure, no I/O. Used by enrich AND link. | **Create** |
| `packages/codegen/src/dsl/enrich.ts` | Generalize `applyClauseHoist`: hoist inline-safe `optional(seq)`; leave inline-unsafe in place; apply `ruleMatchesEmpty` guard. | Modify (`applyClauseHoist` ~1372) |
| `packages/codegen/src/compiler/group-synthesis.ts` | Generalize `applyGroupOverrides` from declared-only to **every inline-unsafe** `optional/repeat(seq)`: reconstruct → visible IR-only kind; declared entries rename-only (no `derefGroupLift` body rewrite). | Modify (`applyGroupOverrides` ~247) |
| `packages/codegen/src/compiler/link.ts` | Its `applyGroupOverrides` call site (~144) now also feeds the auto-discovered inline-unsafe positions, not just `groups:` keys. | Modify |
| `packages/codegen/src/dsl/wire/wire.ts` | Remove the `applyAutoGroups` call (~701). | Modify (Chunk 3) |
| `packages/codegen/src/dsl/wire/auto-groups.ts` | Deleted once enrich (inline-safe) + link (inline-unsafe) subsume it. | **Delete** (Chunk 3) |

---

## Chunk 1: Shared predicates + enrich inline-safe hoist

Increment 1 of the spec. Outcome: enrich hoists inline-safe `optional(seq)` (generalizing the clause path), guarded against empty-matching bodies; inline-unsafe positions are left untouched for Chunk 2. Gate must hold-or-improve (inline-unsafe cases regress until Chunk 2 — so this chunk is gated as **"no NEW hard errors, py holds; rust/ts may dip by the inline-unsafe count, recovered in Chunk 2"**; record the exact dip).

### Task 1.1: Shared predicates

**Files:**
- Create: `packages/codegen/src/dsl/group-classify.ts`
- Test: `packages/codegen/src/dsl/__tests__/group-classify.test.ts`

- [ ] **Step 1 — Write failing tests** for `ruleMatchesEmpty` and `isInlineSafe`:

```ts
import { describe, it, expect } from 'vitest';
import { ruleMatchesEmpty, isInlineSafe } from '../group-classify.ts';

const str = (v: string) => ({ type: 'string', value: v });
const sym = (n: string) => ({ type: 'symbol', name: n });
const field = (n: string, c: any) => ({ type: 'field', name: n, content: c });
const seq = (...m: any[]) => ({ type: 'seq', members: m });
const choice = (...m: any[]) => ({ type: 'choice', members: m });
const opt = (c: any) => ({ type: 'optional', content: c });

describe('ruleMatchesEmpty', () => {
  it('non-empty string seq is not empty', () => expect(ruleMatchesEmpty(seq(str('as'), sym('x')))).toBe(false));
  it('all-optional seq matches empty', () => expect(ruleMatchesEmpty(seq(opt(sym('a')), opt(sym('b'))))).toBe(true));
  it('symbol is conservatively non-empty', () => expect(ruleMatchesEmpty(sym('x'))).toBe(false));
});

describe('isInlineSafe — exactly 1 non-choice field/symbol slot after dropping literals', () => {
  it('clause seq(STRING, field) is inline-safe', () => expect(isInlineSafe(seq(str('as'), field('alias', sym('expr'))))).toBe(true));
  it('bare choice slot is NOT inline-safe', () => expect(isInlineSafe(seq(str('('), choice(sym('self'), sym('super')), str(')')))).toBe(false));
  it('two slots is NOT inline-safe', () => expect(isInlineSafe(seq(field('name', sym('id')), field('val', sym('expr'))))).toBe(false));
  it('repeat1(choice(...)) body is NOT inline-safe', () => expect(isInlineSafe(seq({ type: 'repeat1', content: choice(field('name', sym('id')), sym('enum_assignment')) }))).toBe(false));
});
```

- [ ] **Step 2 — Run, verify they fail** (`function not defined`):
  `npx vitest run packages/codegen/src/dsl/__tests__/group-classify.test.ts`

- [ ] **Step 3 — Implement** `group-classify.ts`. Port `ruleMatchesEmpty` from the reverted 1a (conservative: `optional`/`repeat`/`blank` → empty; `repeat1` → content; non-empty `string`/`symbol`/`token`/`pattern` → not empty; `seq` → all members empty; `choice` → any member empty; `field`/prec → content). Implement `isInlineSafe(seqBody)`: collect slots = members that are `field`/`symbol`/`choice` (after descending prec/field), dropping `string`/`token` literals and `blank`; inline-safe iff exactly one slot AND that slot's type is `field` or `symbol` (NOT `choice`). Use the dual-case `runtime-shapes.ts` predicates so it works on both sittir-lowercase and tree-sitter-uppercase forms.

- [ ] **Step 4 — Run, verify pass.**

- [ ] **Step 5 — Commit:** `git commit -m "feat(codegen): shared isInlineSafe/ruleMatchesEmpty group predicates" -- packages/codegen/src/dsl/group-classify.ts packages/codegen/src/dsl/__tests__/group-classify.test.ts`

### Task 1.2: enrich hoists inline-safe (generalize the clause path)

**Files:**
- Modify: `packages/codegen/src/dsl/enrich.ts` (`applyClauseHoist` ~1372; remove the now-dead `isClauseSeq`)
- Test: `packages/codegen/src/dsl/__tests__/enrich-clause-hoist.test.ts` (update the two predicate-exactness assertions to the generalized behavior)

- [ ] **Step 1 — Update the hoist** so the `if (peeled !== null)` branch: recurses into the seq body (post-order) → if `ruleMatchesEmpty(recursedBody)` OR `!isInlineSafe(recursedBody)` → leave the position un-hoisted (return rule / rebuilt-with-recursed-body), else hoist via `makeGroupLiftSymbol` (tagged) + `clauseHoistSynthName`. Import the shared predicates. Keep `setGroupLiftRuleMap` registration intact.

- [ ] **Step 2 — Update unit tests:** the two "does NOT fire on optional(seq(field,field))/(symbol,symbol)" assertions now assert the inline-safe rule — `seq(field,field)` (2 slots) stays un-hoisted; a single-field `optional(seq(STRING, field))` now hoists. Run vitest.

- [ ] **Step 3 — Regen all 3** (debug-safe) and inspect: byte-diff generated artifacts; confirm no `matches the empty string` hard error at `tree-sitter generate`. Inline-unsafe kinds (enum_body, visibility) render wrong here — EXPECTED, recovered in Chunk 2.

- [ ] **Step 4 — RELEASE gate**, record exact counts. Acceptance: py holds (74); rust/ts dip equals the inline-unsafe count only (no hard errors, no unrelated drops). Verify the dip is exactly the inline-unsafe kinds via `tool diff-failures rt -g <grammar>` vs HEAD.

- [ ] **Step 5 — Commit** source + regenerated artifacts (NOT test-fixtures): `git commit -m "feat(enrich): hoist inline-safe optional(seq); leave inline-unsafe for wire" -- packages/codegen/src/dsl/enrich.ts packages/codegen/src/dsl/__tests__/enrich-clause-hoist.test.ts packages/{rust,python,typescript}/.sittir/grammar.js packages/{rust,python,typescript}/.sittir/src/grammar.json packages/{rust,python,typescript}/.sittir/generated.manifest.json packages/{rust,python,typescript}/src packages/{rust,python,typescript}/templates`

---

## Chunk 2: Link reconstructs inline-unsafe content as visible IR kinds

Increment 2 — the core. Generalize the existing `applyGroupOverrides` (link) from declared-only to **every** inline-unsafe `optional/repeat(seq)` position. This is the proven pre-1a mechanism (declared groups → IR-only synthesized kinds, parser-inline + reconstructed), just widened. Outcome: enum_body + visibility render via their own `AssembledGroup` templates; gate back to floor. No tree-sitter grammar change.

> **CRITICAL ordering:** `applyAutoGroups` runs at **wire, BEFORE link**. It hoists inline-unsafe `optional/repeat(seq)` into *inline hidden helpers* — which would pre-consume the very seqs link needs to see as inline content. So `applyAutoGroups` must be **disabled before link reconstructs** (Task 2.0), not deleted later. (It currently skips `authoredSynthesisKinds`, so authored kinds like `visibility_modifier` already survive to link; non-authored inline-unsafe kinds like a bare `enum_body` would not unless it is disabled.)

### Task 2.0: Disable `applyAutoGroups`; confirm enrich+link cover its cases

**Files:** Modify `packages/codegen/src/dsl/wire/wire.ts` (early-return / skip the `applyAutoGroups` call ~701).

- [ ] **Step 1 — Disable** the `applyAutoGroups` call (comment/early-return; do not delete yet). Regen all 3.
- [ ] **Step 2 — RELEASE gate + `diff-failures`** to enumerate what regressed: these are the cases enrich (inline-safe) + link (inline-unsafe, not yet generalized) don't cover. Expected: inline-unsafe kinds (recovered in Task 2.1) **and** any inline-safe `repeat(seq)`/`repeat1(seq)` that `applyAutoGroups` was hoisting but enrich's optional-only clause path is not.
- [ ] **Step 3 — If inline-safe `repeat(seq)` gaps appear:** generalize enrich's hoist (Chunk 1's `applyClauseHoist`) to inline-safe `repeat(seq)`/`repeat1(seq)` as well, so retiring `applyAutoGroups` loses nothing. (Advisor flag: repeat is *new to the IR* — gate each addition separately and attribute any drop.) Commit the enrich extension + the disable together.

### Task 2.1: Generalize `applyGroupOverrides` to auto-discover inline-unsafe positions

**Files:**
- Modify: `packages/codegen/src/compiler/group-synthesis.ts` (`applyGroupOverrides` ~247), `packages/codegen/src/compiler/link.ts` (call site ~144)
- Test: `packages/codegen/src/compiler/__tests__/group-synthesis-autovisible.test.ts`

- [ ] **Step 1 — Failing test.** Given a rules map where enrich left an inline-unsafe `optional(seq("(", choice($.self,$.super), ")"))` inline in `parentA`, an inline-unsafe `repeat1(choice(field('name', …), $.enum_assignment))` inline in `parentB` (no declaration), an inline-SAFE `optional(seq("as", field('alias', …)))` symbol in `parentC`, and `groups: { parentA: { '1': 'parens' } }` — the generalized `applyGroupOverrides`:
  - synthesizes a visible IR kind for `parentA`'s position **named `parens`** (declared);
  - synthesizes a visible IR kind for `parentB`'s position with an **auto-derived default name** (no declaration);
  - leaves `parentC`'s inline-safe symbol **untouched**;
  - leaves a registered **body-pattern group** (`type_argument` / `attributed_*` shape) body **byte-unchanged** (the `derefGroupLift`-corruption regression guard).

- [ ] **Step 2 — Run, verify fail.**

- [ ] **Step 3 — Implement.** Add an **auto-discovery phase to `applyGroupOverrides`, before the declared-`groups:` loop**: walk each rule body for inline-unsafe `optional/repeat(seq)` content (`isInlineSafe(body) === false && ruleMatchesEmpty(body) === false`), and lift each via the **existing `liftRule`/`replaceAtPath` machinery** (same as a declared lift — reuse, don't fork) into a synthesized visible kind. Name = the declared `groups:` entry targeting that exact position if present, else an auto-derived default (`deriveSynthesizedName`-style: parent + ordinal). A declared entry that coincides with an auto-discovered position contributes **only the name** — it is consumed here and must not be re-lifted by the declared loop. **No body dereference/rewrite** (the reverted `derefGroupLift` is the anti-pattern). Inline-safe symbols (enrich's hoists) are skipped by the `isInlineSafe` filter.

- [ ] **Step 4 — Run unit test, verify pass** (incl. the sibling-body regression guard).

- [ ] **Step 5 — Regen all 3** (debug-safe); confirm no hard errors; inspect witnesses: `packages/typescript/templates/enum_body.jinja` renders the members; `packages/rust/templates/_visibility_modifier_pub*.jinja` renders the choice via its own visible-kind template (not the broken inline gate).

- [ ] **Step 6 — RELEASE gate.** Acceptance: **rust ≥ 111, ts ≥ 69, py ≥ 74** (back to floor). Witnesses pass deep AST: ts `enum_body` (`enum E { A, B }`), rust `visibility_modifier` (`pub(super)`). `cargo check --workspace --features napi-bindings` independently green (do NOT trust a self-reported pass — verify cargo yourself). If the native build reports `unknown node <keyword>` → Task 2.2.

- [ ] **Step 7 — Commit** source + regenerated artifacts (NOT test-fixtures), explicit pathspec.

### Task 2.2 (conditional): Rust-keyword slot escaping

Only if Task 2.1 Step 6 surfaced `unknown node <keyword>` (`super`/`crate`/`type`). Expected NOT to occur (the visible-render path avoids the disjunction-gate that named keywords as variables — pre-1a `visibility_modifier` compiled), but guard for it.

- [ ] Add raw-identifier escaping (`r#<name>`) — or a reserved-word rename map — at the Rust slot-name emit sites (`packages/codegen/src/emitters/render-module.ts` / `transport-common.ts`). Add a unit test for a `super`-named slot. Regen + RELEASE gate. Commit.

---

## Chunk 3: Retire applyAutoGroups

### Task 3.1: Prove no-op, then delete

**Files:** Delete `packages/codegen/src/dsl/wire/auto-groups.ts`; modify `wire.ts` (remove the import + the now-disabled call); migrate any unique `auto-groups.test.ts` assertions into the new tests.

`applyAutoGroups` was already **disabled** in Task 2.0 and the gate held — so by here it is provably dead (enrich claims inline-safe, link claims inline-unsafe). This chunk is the physical removal.

- [ ] **Step 1 — Delete** `auto-groups.ts` + its `wire.ts` import/call site + the `collectAuthoredSynthesisKinds`/`syntheticInline` plumbing that is now dead (keep `syntheticInline` itself — enrich's clause-group drain still uses it). Move surviving unique tests.
- [ ] **Step 2 — Regen all 3; RELEASE gate** holds at floor or better; `cargo check --workspace --features napi-bindings` green (verify yourself); vitest green.
- [ ] **Step 3 — Commit** (explicit pathspec) + dispatch `sittir-review` on the full Chunk-1..3 diff (DRY, gate completeness, generated-output hygiene, no stray `.js`).

---

## Done criteria

- RELEASE gate ≥ floor (rust 111 / ts 69 / py 74); witnesses (enum_body, visibility) pass deep AST match.
- `applyAutoGroups` deleted; inline-safe hoists in enrich, inline-unsafe visible kinds reconstructed in link, one shared `isInlineSafe`/`ruleMatchesEmpty` predicate.
- `cargo check --workspace --features napi-bindings` green; no `matches the empty string` / `unknown node` errors.
- No `test-fixtures.json` / `validation-history.jsonl` staged; commits by explicit pathspec.

## Deferred (NOT this plan)

- Sunset legacy top-level `source: 'group-lift'` once IR readers migrate to `metadata.source`.
- PR-I-φ2 count recovery (match_arm residual); PR-P (terminal/enum).
- Single-entry `sittirGrammar(base, cfg)` composition cleanup.
