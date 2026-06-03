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
| `packages/codegen/src/dsl/group-classify.ts` | `isInlineSafe(seqBody)` + `ruleMatchesEmpty(rule)` — the shared predicates. Pure, no I/O. | **Create** |
| `packages/codegen/src/dsl/enrich.ts` | Generalize `applyClauseHoist`: inline-safe `optional/repeat(seq)` → hidden symbol (today's path); inline-**unsafe** → wrap content in `alias(<content>, $.<name>)` (name = `groups:` config or auto-default); `ruleMatchesEmpty` guards both. | Modify (`applyClauseHoist` ~1372) |
| `packages/codegen/src/compiler/link.ts` | **NEW pass:** while traversing the rule tree, for each `alias(<non-symbol content>, $.<name>)` add `<name> = <content>` to the linked rules (mint the visible kind). Runs before `classifyHiddenRule`/`assemble`. Symbol aliases (`aliasedFrom`) untouched. | Modify |
| `packages/codegen/src/compiler/group-synthesis.ts` | Declared `groups:` entries become **naming-only** for the alias (no `derefGroupLift` body rewrite). Confirm no double-handling with the existing body-pattern alias path. | Modify |
| `packages/codegen/src/dsl/wire/wire.ts` | Disable (Task 2.0) then remove the `applyAutoGroups` call (~701). | Modify |
| `packages/codegen/src/dsl/wire/auto-groups.ts` | Deleted once enrich (inline-safe + inline-unsafe alias) + the link pass subsume it. | **Delete** (Chunk 3) |

---

## Chunk 1: Shared predicates + enrich inline-safe hoist + the content-alias form

Increment 1 of the spec. Outcome: enrich hoists inline-safe `optional(seq)` (generalizing the clause path) and wraps inline-unsafe content in a `alias(content, …)` of the form Task 1.0 settles; inline-unsafe kinds still render wrong until Chunk 2's link pass mints them. Gate: **"no NEW hard errors, py holds; rust/ts may dip by the inline-unsafe count, recovered in Chunk 2"**; record the exact dip.

### Task 1.0 (SPIKE): Settle the tree-sitter form for a content-alias visible node

**THE one confirmation.** We already KNOW `alias($.source, $.target)` (symbol → target) mints a real kindId for `target` in `parser.c` — that is the existing body-pattern-groups mechanism. The only unknown is whether **`alias(<content>, $.target)`** — aliasing inline CONTENT rather than a symbol — does the same. (Content is preferred: a symbol target reintroduces a rule and its LR-conflict risk.) Read `.claude/grammar-workflow.md` first.

- [ ] **Step 1 — Hand-wire the content-alias** for ONE case (rust `visibility_modifier`'s parens seq) in `packages/rust/overrides.ts` as `alias(<the parens seq content>, $.parens)`; `pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all`. Confirm: (a) `tree-sitter generate` accepts it, (b) `parens` appears as a visible kind in `packages/rust/.sittir/src/node-types.json` (→ a kindId in `parser.c`), (c) the native build compiles.

- [ ] **Step 2 — If the content form mints the kind → done; record it.** If NOT, fall back in order:
  1. string name: `alias(<content>, 'parens')`;
  2. register a placeholder rule **`parens: ($) => blank()`** in the rule tree (so the symbol `$.parens` exists), then `alias(<content>, $.parens)`. **Caveat:** named empty rules are normally rejected at `tree-sitter generate` — confirm it accepts a `blank()` rule used *only* as an alias target; if not, use a minimal non-empty body.

  Record the winning form as a docstring at the alias-creation site (`enrich.ts`); it decides Chunk 1's emission and Chunk 2's link-pass key (`$.name` symbol vs `'name'` string).

- [ ] **Step 3 — Revert the hand-wire** (`git checkout HEAD -- packages/rust`). The spike's only output is the recorded decision.

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

- [ ] **Step 1 — Update the hoist** so the `if (peeled !== null)` branch recurses into the seq body (post-order), then: `ruleMatchesEmpty(recursedBody)` → leave un-hoisted; else `isInlineSafe(recursedBody)` → hoist via `makeGroupLiftSymbol` (tagged) + `clauseHoistSynthName` (today's inline+gate path); else (inline-**unsafe**) → wrap the content in `alias(<content>, $.<auto-name>)` (auto-name `_<parent>_<kind>N`, dedup via canonical-stringify). Use the native `alias()` DSL. Import the shared predicates; keep `setGroupLiftRuleMap` intact. NOTE: the alias kind isn't minted until Chunk 2's link pass — so inline-unsafe kinds still render wrong after Chunk 1 (expected dip).

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

### Task 2.1: New link pass — mint visible kinds from content-aliases

**Files:**
- Modify: `packages/codegen/src/compiler/link.ts` (add the pass — after `resolveRule`, before `classifyHiddenRule`)
- Modify: `packages/codegen/src/compiler/group-synthesis.ts` (declared `groups:` → rename the alias target to the friendly name; naming-only)
- Test: `packages/codegen/src/compiler/__tests__/link-content-alias.test.ts`

- [ ] **Step 1 — Failing test.** Given a linked rules map containing: `parentA = seq(field('pub',…), alias(seq("(", choice($.self,$.super), ")"), $.parens))` (content-alias, declared name), `parentB = seq("{", optional(alias(repeat1(choice(field('name',…), $.enum_assignment)), $._enum_body_group1)), "}")` (content-alias, default name), and `parentC = alias($._hidden, $.relabeled)` (SYMBOL alias) — the new link pass:
  - adds `parens = seq("(", choice(self,super), ")")` to the linked rules;
  - adds `_enum_body_group1 = repeat1(choice(...))` to the linked rules;
  - **does NOT** add/alter anything for `alias($._hidden, …)` — symbol aliases keep their `aliasedFrom` handling;
  - leaves an existing body-pattern group body (`type_argument` / `attributed_*`) **byte-unchanged**.

- [ ] **Step 2 — Run, verify fail.**

- [ ] **Step 3 — Implement** the pass in `link.ts`: walk every rule body; for each `alias(child, $.name)` where `child` is **non-symbol content** (`child.type` is not `symbol`/`SYMBOL`), register `rules[name] = child` when `name` is absent. Place it after `resolveRule`, before `classifyHiddenRule`, so the minted kind classifies + assembles via the normal path. Keep it a small focused helper. In `group-synthesis.ts`, declared `groups:` only **rename** the alias target to the friendly name (naming-only; no body dereference/rewrite — the reverted `derefGroupLift` is the anti-pattern).

- [ ] **Step 4 — Run unit test, verify pass** (incl. the symbol-alias-untouched + sibling-body guards).

- [ ] **Step 5 — Regen all 3** (debug-safe); confirm no hard errors; inspect witnesses: `packages/typescript/templates/enum_body.jinja` renders the members; the rust `parens`/`_visibility_modifier_pub*` template renders the choice via its own visible-kind template.

- [ ] **Step 6 — RELEASE gate.** Acceptance: **rust ≥ 111, ts ≥ 69, py ≥ 74**. Witnesses pass deep AST: ts `enum_body` (`enum E { A, B }`), rust `visibility_modifier` (`pub(super)`). `cargo check --workspace --features napi-bindings` independently green (verify yourself). If `unknown node <keyword>` → Task 2.2.

- [ ] **Step 7 — Commit** source + artifacts (NOT test-fixtures), explicit pathspec.

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
