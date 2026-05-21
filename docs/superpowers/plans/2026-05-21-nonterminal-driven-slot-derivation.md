# Nonterminal-Driven Slot Derivation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the complex `deriveSlots` walker (folding / first-arm naming / `effectiveMultiplicity`) with a "slot = a `nonterminal`-flagged node" model, fixing the `comparison_operator` operator-fold and the choice-naming class of bugs.

**Architecture:** `classifyIntrinsic` (rule-catalog) defines per-rule-type terminality (refined); `wrapper-deletion` pushes `nonterminal` onto the wrappee (single source of truth); a new `collectSlots` enumerates `nonterminal` leaves → one slot each (choice = 1 union slot, seq distributes); `autoApplyGroups` owns multi-slot `repeat(seq)` grouping. Polymorph metadata becomes type-surface-only (render just renders the `content` slot).

**Tech Stack:** TypeScript ESM (tsx, `.ts` imports), tree-sitter, rust napi. **No build needed** — tsx + tsconfig paths resolve `@sittir/*` to source.

**Spec:** `docs/superpowers/specs/2026-05-21-nonterminal-driven-slot-derivation-design.md` (read Tables 1 & 2 first).

**Sequencing — REVISED after Chunk C execution (2026-05-21):** A (predicate, DONE: `d5b70a4d`/`f8202e64`/`343c06d6`) → **C+D TOGETHER** → B (cleanliness, last). C and D are NOT independently gatable: `collectSlots` (C) *creates* the operator `content` slots (binary_expression / comparison_operator), and only D (operator-enum + `emitSymbol fieldName===undefined` gate) makes them render/read — C alone regresses covPass ("singular slot 'content' requires one value"). C1 (`4a3549b5`) + C2 (`92b1e1b0`) are committed + inert; the C3 swap is in `git stash@{0}` ("C3-WIP-collectSlots-swap-BLOCKED-regression"). **covPass is gated after C3+D land together**, not after C alone. Also retain the one-level seq→member multiplicity/separator inherit the C agent added inside `collectSlots` — it handles un-grouped multi-slot `repeat(seq)`/`optional(seq)` (the loss B would otherwise prevent) and is needed until B groups them.

**Project commands (memorize):**
- Regen one grammar: `pnpm exec tsx packages/codegen/src/cli.ts --grammar <rust|python|typescript> -a --output packages/<g>/src` (needs sandbox disabled — spawns tree-sitter + cargo).
- Counts (sandbox-ok): `SITTIR_AUDIT_DERIVE=1 pnpm exec tsx packages/validator/src/cli.ts counts --backend native <g>` → read `covPass`, `read-render-parsePass`, `read-render-parseAstMatchPass`.
- Unit tests: `pnpm exec vitest run packages/codegen/src/<path>` .
- **NEVER** hand-edit `packages/{rust,python,typescript}/src/*`, `templates/*.jinja`, `.sittir/*`, `factory-map.json5`, `overrides.suggested.ts`, `rust/crates/sittir-*/src/**`, `validation-history.jsonl`, `test-fixtures.json`. Fix codegen + regenerate.

---

## Task 0: Capture fresh baselines (do this BEFORE any change)

**Files:** none (measurement only)

- [ ] **Step 1:** Run counts for all three at HEAD `1279c95f` and record covPass / read-render-parsePass / AstMatchPass:
  ```
  for g in rust python typescript; do SITTIR_AUDIT_DERIVE=1 pnpm exec tsx packages/validator/src/cli.ts counts --backend native $g; done
  ```
  Expected (verify, don't trust prior drafts): rust ~172/180 cov, python ~104/109 cov, ts ~172/182 cov. Record EXACT numbers — they are the regression gate for every subsequent task.
- [ ] **Step 2:** Record the `comparison_operator` generated type (the bug witness): `rg -A4 "interface ComparisonOperator" packages/python/src/types.ts`. Note `_operators` currently leaks into `_comparators` and references phantom kinds.

---

## Chunk A: Predicate refinement + wrapper push-down

### Task A1: Refine `classifyIntrinsic`

**Files:**
- Modify: `packages/codegen/src/compiler/rule-catalog.ts` (`classifyIntrinsic` ~244-273)
- Test: `packages/codegen/src/compiler/__tests__/rule-attributes.test.ts` (or a new `rule-catalog.test.ts`)

Per Spec Table 1, the deltas: `pattern`→nonterminal, `enum`→nonterminal, `token`→recursive (was terminal), `choice`+`repeat`+`repeat1`→unconditional nonterminal (were iff-child). `optional`/`seq`/`field`/`alias`/`variant`/`clause`/`group`/`polymorph` stay recursive; `string`/`terminal`/indent/dedent/newline stay terminal.

- [ ] **Step 1: Write failing tests** — one assertion per delta:
  ```ts
  expect(classifyIntrinsicKind(pattern('/x/'))).toBe('nonterminal');
  expect(classifyIntrinsicKind(enumRule(['a','b']))).toBe('nonterminal');
  expect(classifyIntrinsicKind(token(string('fn')))).toBe('terminal');       // recursive: literal content
  expect(classifyIntrinsicKind(token(pattern('/x/')))).toBe('nonterminal');  // recursive: value content
  expect(classifyIntrinsicKind(choice([string('<'), string('>')]))).toBe('nonterminal'); // all-literal still nonterminal
  expect(classifyIntrinsicKind(repeat(string(',')))).toBe('nonterminal');    // terminal content still nonterminal
  expect(classifyIntrinsicKind(optional(string(',')))).toBe('terminal');     // optional stays recursive → terminal
  ```
  (Use the smallest harness that exposes `classifyIntrinsic`'s result; if it's not exported, export it or test via `buildRuleCatalog` and read `.classification.kind`.)
- [ ] **Step 2: Run, verify fail** — `pnpm exec vitest run packages/codegen/src/compiler/__tests__/rule-attributes.test.ts`. Expected: the 5 changed cases fail.
- [ ] **Step 3: Implement** — in `classifyIntrinsic`: move `pattern` to return `'nonterminal'`; add `enum` → `'nonterminal'`; move `token` from the terminal arm into the recursive arm (`children.some(... nonterminal)`); add `choice`/`repeat`/`repeat1` as unconditional `'nonterminal'` returns BEFORE the recursive `children.some` arm.
- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** — `git add packages/codegen/src/compiler/rule-catalog.ts packages/codegen/src/compiler/__tests__/rule-attributes.test.ts && git commit` (`feat(rule-catalog): refine intrinsic terminality — pattern/enum nonterminal, token recursive, choice/repeat unconditional`).

### Task A2: Push `nonterminal` down in wrapper-deletion

**Files:**
- Modify: `packages/codegen/src/compiler/wrapper-deletion.ts` (`WrapperAttrs`, `deleteWrapperWith`, `stampAttrs`)
- Test: `packages/codegen/src/dsl/__tests__/enrich-field-wrappers.test.ts` style — new `wrapper-deletion-nonterminal.test.ts`

Per Spec Table 2: `field`/`repeat`/`repeat1` push `nonterminal:true`; `optional` pushes `nonterminal:true` ONLY if content intrinsically nonterminal (call the Task-A1 predicate on the content); `alias` named → true. Leaf `symbol`/`choice`/`pattern`/`enum` are nonterminal intrinsically (don't need a stamp, but stamping is harmless/consistent — decide: stamp on push-down only, leave intrinsics to the predicate at collection).

- [ ] **Step 1: Write failing tests:**
  ```ts
  expect(deleteWrapper(field('x', symbol('y'))).nonterminal).toBe(true);
  expect(deleteWrapper(repeat(string(','))).nonterminal).toBe(true);          // repeat(terminal) → slot
  expect(deleteWrapper(optional(string(','))).nonterminal).toBeUndefined();   // optional(terminal) → no slot
  expect(deleteWrapper(optional(symbol('y'))).nonterminal).toBe(true);        // optional(nonterminal) → slot
  ```
- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement** — add `nonterminal?: boolean` to `WrapperAttrs`; in the `field`/`repeat`/`repeat1` cases set `nonterminal: true` in `next`; in the `optional` case set `nonterminal: attrs.nonterminal ?? isIntrinsicallyNonterminal(rule.content)` (import the predicate from rule-catalog — extract a pure `isNonterminalRuleType(rule): boolean` helper if needed); in `alias` set `nonterminal: rule.named ? true : attrs.nonterminal`; add `nonterminal` to `stampAttrs`' patch.
- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** (`feat(wrapper-deletion): push nonterminal onto wrappee per Table 2`).

### Task A3: Regen + gate (no derivation change yet — should be inert)

- [ ] **Step 1:** Regen all 3 (`--grammar rust|python|typescript`). A1/A2 only add an attribute consumed in Chunk C, so output should be UNCHANGED.
- [ ] **Step 2:** Counts all 3. **Gate: covPass + read-render-parse must equal Task 0 baselines exactly.** If anything moved, an existing consumer is already reading `nonterminal` — investigate before proceeding.
- [ ] **Step 3:** Commit any regenerated artifacts if (and only if) they're identical-or-explained.

---

## Chunk C: `collectSlots` — the core swap

### Task C1: Implement `collectSlots`

**Files:**
- Create: `packages/codegen/src/compiler/collect-slots.ts`
- Test: `packages/codegen/src/compiler/__tests__/collect-slots.test.ts`

Walk a wrapper-free `RenderRule`; emit `AssembledNonterminal[]`:
- node with `nonterminal` (symbol/choice/pattern/enum, or push-down-stamped) → ONE slot. name = `fieldName` ?? kind-synthesized storageName; type = self (choice → union of arms); multiplicity/separator = leaf attrs. **Choice arms are NOT recursed** — the choice is the slot.
- `seq` → `flatMap` member slots (distribute). seq itself emits no slot.
- non-nonterminal leaf → `[]`.
- NO `effectiveMultiplicity` threading, NO fold, NO `mergeChoiceArmSlots`, NO first-arm naming.

- [ ] **Step 1: Write failing tests** against the witness shapes:
  ```ts
  // comparison_operator inner: seq{f:comparators,m:nonEmpty}(choice{f:operators}, symbol(primary_expression))
  // → operators slot (choice, nonEmpty) + comparators/primary_expression slot (symbol, nonEmpty); operators NOT folded in.
  // field('body', symbol('_suite')) → one 'body' slot.
  // repeat(string('kw')) → one array slot (enum), name from kind/fieldName.
  // optional(string(',')) → [] (no slot).
  ```
- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement** `collectSlots`. Reuse existing slot-shape helpers where possible (`deriveValuesForRule` for a SINGLE node's value/union, `deriveAliasSources`, `snakeToCamel`, `pluralize`, `safeParamName`) — but call them per-nonterminal-node, not via the old recursive walker. storageName-from-kind is synthesized in assemble (existing) — collectSlots sets `name`/`fieldName` and lets assemble name it.
- [ ] **Step 4: Run, verify pass.**
- [ ] **Step 5: Commit** (`feat(compiler): collectSlots — nonterminal-node slot enumeration`).

### Task C2: Choice naming (content + warn)

**Files:** Modify `collect-slots.ts`; Test add to `collect-slots.test.ts`

- [ ] **Step 1: Failing tests:** polymorph/unnamed-choice-of-groups → slot name `content`; a plain unnamed choice in a branch → emits a warning (capture via a spy/collector) and still produces a slot (named `content` or elided per design — pick: name `content`, warn).
- [ ] **Step 2-4:** Implement: if a choice has no `fieldName` → name `content` + (if not a registered polymorph) emit `console.warn`/audit "unnamed choice slot found in branch '<kind>'". Verify.
- [ ] **Step 5: Commit** (`feat(collect-slots): choice → content slot + unnamed-choice warning`).

### Task C3: Swap deriveSlots → collectSlots; delete dead code

**Files:**
- Modify: `packages/codegen/src/compiler/node-map.ts` (route slot derivation through `collectSlots`)
- Delete: `deriveSlotsRawFromLeafAttr` fold path, `mergeChoiceArmSlots`, `effectiveMultiplicity` threading, first-arm naming in the choice case
- Check (do NOT break): `templates.ts:1452` slot-preservation gate, `simplify.ts` multiplicity coherence (leaf attrs must stay correct), the synthetic-field-wrapper cases (`isSyntheticFieldWrapper`)

- [ ] **Step 1:** Wire `node-map`'s slot entry point to `collectSlots`. Keep `AssembledNonterminal` shape identical (4 emitters depend on `storageName`/`propertyName`).
- [ ] **Step 2:** Remove the dead functions (verify via `rg` they're referenced only in comments outside node-map).
- [ ] **Step 3:** `pnpm exec tsx packages/codegen/src/cli.ts --grammar python -a --output packages/python/src`. Check: `_operators` is its OWN slot (enum), NOT folded into `_comparators`; `except_clause` has a `content` slot; no codegen crash.
- [ ] **Step 4:** Regen rust + ts. Counts all 3. **Gate: covPass must NOT regress vs Task 0.** Investigate any read-render-parse delta (target: recovery + operator phantom-refs gone). Spot-check synthetic-field-wrapper kinds (ts `field('constraint', optional(seq('extends', field('type', …))))`) didn't lose a slot.
- [ ] **Step 5: Commit** (`feat(node-map): swap to collectSlots; delete fold/merge/effectiveMultiplicity`).

---

## Chunk D: Operator enum (depends on C)

**Files:** `packages/codegen/src/compiler/link.ts` (`canonicalizeRuleLiterals` / `deriveValuesForRule` for link-symbols), `packages/codegen/src/compiler/assemble.ts` (kindId lookup), `packages/codegen/src/emitters/templates.ts` (`emitSymbol` link gate)

- [ ] **Task D1:** The now-separate `operators` choice slot's values are operator literals. Emit them as an ENUM of the source strings (not phantom kind refs). Per user: look up the real **kindId at assemble** for each enum value (runtime `$type` is the alias target `lt`/`eq_eq`), so read-time matching works. TDD: comparison_operator `_operators` type = `"<" | "<=" | … | "not in" | "is not"`, no phantom `Lt`/`LtEq`. Confirm the 8 `unresolved slot reference` warnings are gone.
- [ ] **Task D2 (companion — MUST land with D1):** gate `emitSymbol`'s `if (rule.source === 'link')` branch (`templates.ts:~1168`) with `&& rule.fieldName === undefined`, so a field-wrapped operator literal renders `{{ operator }}` via the slot path, not the hard-coded literal. (D1 alone regressed rust per UPDATE 4 — land both.)
- [ ] **Step:** Regen + counts all 3. Gate: covPass hold; rust/ts not regressed; python read-render-parse improved. Commit.

---

## Chunk B: autoApplyGroups + authored kinds (riskiest — standalone, do last)

**Files:** `packages/codegen/src/dsl/wire/auto-groups.ts`, `packages/codegen/src/dsl/wire/wire.ts` (`collectAuthoredSynthesisKinds`)

- [ ] **Task B1:** The skip is the authored-status guard (`auto-groups.ts:131`), NOT a member filter. Do NOT remove the skip wholesale. Make grouping COOPERATE with authored transform order: synthesize the `repeat(seq)` group for authored kinds AFTER the author's positional `transforms` resolve (so `comparison_operator`'s positional `0`/`1` patches stay valid), OR have the transform pipeline emit the group. TDD: `comparison_operator`'s `repeat1(seq(operators, operand))` becomes a synthesized group; the positional transforms still apply.
- [ ] **Step:** Regen all 3. **Gate: override-parser PARSE-pass must not regress** (rust LR sensitivity) + covPass hold. Measure parse-pass before/after explicitly. Commit only if green.

---

## Final review

- [ ] After all chunks: dispatch a code-reviewer over the full diff (focus: no hand-edited generated artifacts; the 4 emitters still consume `AssembledNonterminal` correctly; no silent slot loss).
- [ ] Use superpowers:finishing-a-development-branch.

## Risks (from spec review)
1. "always nonterminal" over-creating slots — mitigated by `optional` staying recursive + the terminal carve-out (Table 1). Watch for phantom slots after C3.
2. autoApplyGroups firing under authored transforms — Chunk B is isolated + parse-pass-gated for this reason.
3. Variant/polymorph: render must NOT do `$variant` dispatch — it renders `content`; polymorph metadata is type-surface-only. Verify the polymorph type emitters still get their metadata after C3.
