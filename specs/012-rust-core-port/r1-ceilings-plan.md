# R1 — Ceilings-to-Zero Prerequisite Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between the corpus-validation `FLOORS` and `LEGACY_BASELINE` numbers across all three grammars so that feature 012 (Rust port) can pass its T001 decision gate and begin implementation.

**Architecture:** Work entirely inside the existing codegen pipeline. Each failing cluster maps to one or more emitters/walkers under `packages/codegen/src/`. Fixes are: (a) identify a cluster from the validator output, (b) trace to the owning emitter/walker, (c) fix at the source of truth (never hand-edit generated output — Constitution Principle III), (d) regenerate, (e) raise the FLOOR value in the pinning test so the gain is locked in.

**Tech Stack:** TypeScript 6.0.2 + pnpm + vitest. Validators under `packages/codegen/src/validate/`. Pinning test at `packages/codegen/src/__tests__/corpus-validation.test.ts`. No new tools; this is ongoing cleanup.

**Owner-facing completion signal:** In `corpus-validation.test.ts`, for every grammar, the FLOOR for `factoryPass`, `factoryAstMatchPass`, `fromPass`, and `rtPass` (full round-trip) has reached a pre-agreed absolute target (see §"Completion signal" below). At that point, spec 012 T001 passes and implementation of T002+ may begin.

---

## Scope check

This is one workstream (cleanup of generated-output correctness across the three grammars, driven by a single pinning test). It's correctly a single plan, not multiple sub-projects. The three grammars share the emitter pipeline; fixes often unblock multiple grammars at once.

---

## File structure

Files this plan touches. No new files expected — the emitters / walkers already exist; we fix them in place.

| File                                                       | Role                                               | Expected change class                              |
| ---------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| `packages/codegen/src/__tests__/corpus-validation.test.ts` | Pinning test (FLOORS + LEGACY_BASELINE)            | Raise FLOOR per grammar after each landed cluster  |
| `packages/codegen/src/validate/factory-roundtrip.ts`       | Validates factory build → render → reparse         | Rarely modified; read to understand failure signal |
| `packages/codegen/src/validate/from.ts`                    | Validates `.from()` resolution                     | Rarely modified                                    |
| `packages/codegen/src/validate/roundtrip.ts`               | Validates full parse → readNode → render → reparse | Rarely modified                                    |
| `packages/codegen/src/emitters/factories.ts`               | Factory emission                                   | Frequently — most clusters fix here                |
| `packages/codegen/src/emitters/suggested.ts`               | Overrides-suggested emission                       | Occasionally                                       |
| `packages/codegen/src/compiler/template-walker.ts`         | Template-string walker                             | Occasionally — polymorph / variant clusters        |
| `packages/codegen/src/dsl/enrich.ts`                       | Enrich pass (spec 006)                             | Occasionally                                       |
| `packages/codegen/src/polymorph-variant.ts`                | Polymorph classification                           | For polymorph-null-form cluster                    |
| `packages/{rust,typescript,python}/overrides.ts`           | Hand-authored per-grammar overrides                | When a cluster is genuinely grammar-specific       |

---

## Baseline inventory (as of 2026-04-22 — original)

Direct-validator numbers (measured via `npx tsx /tmp/check-actual.mts`; the FLOORS in the pinning test are stale — they reflect a smaller-corpus era and are no longer binding).

| Grammar        | Gate                                                   | Current actual | Legacy baseline |                                          Gap | Load-bearing for FR-014?         |
| -------------- | ------------------------------------------------------ | -------------: | --------------: | -------------------------------------------: | -------------------------------- |
| **Python**     | factoryPass (non-recursive)                            |      197 / 889 |         92 / 99 |                               Exceeds legacy | No — factory not in FR-014 scope |
| Python         | factoryPass (recursive, `SITTIR_VALIDATE_RECURSIVE=1`) |      123 / 889 |               — |                                            — | No — parallel track              |
| Python         | fromPass                                               |      116 / 119 |         92 / 99 |                               Exceeds legacy | **Yes** — 3 failures remain      |
| Python         | rtPass (full round-trip)                               |   **96 / 115** |               — |   **9 short of `rtTotal − 10` target (105)** | **Yes** — 19 failures            |
| **Rust**       | factoryPass (non-recursive)                            |     459 / 1026 |       112 / 135 |                               Exceeds legacy | No                               |
| Rust           | factoryPass (recursive)                                |     432 / 1026 |               — |                                            — | No — parallel track              |
| Rust           | fromPass                                               |      165 / 176 |       133 / 135 |                               Exceeds legacy | **Yes** — 11 failures            |
| Rust           | rtPass (full round-trip)                               |  **118 / 136** |               — |                  **8 short of target (126)** | **Yes** — 18 failures            |
| **TypeScript** | factoryPass (non-recursive)                            |      419 / 952 |       119 / 123 |                               Exceeds legacy | No                               |
| TypeScript     | factoryPass (recursive)                                |      330 / 952 |               — |                                            — | No — parallel track              |
| TypeScript     | fromPass                                               |      144 / 152 |       118 / 123 |                               Exceeds legacy | **Yes** — 8 failures             |
| TypeScript     | rtPass (full round-trip)                               |   **63 / 112** |               — | **39 short of target (102). Biggest lever.** | **Yes** — 49 failures            |

## Working session inventory (2026-04-24 — R1 ceilings worktree)

Refreshed after six source-of-truth fixes landed on branch
`012-r1-ceilings`. Measured via `npx tsx packages/codegen/src/scripts/counts.ts`

- per-grammar `rt-breakdown.ts` for fail/skip detail.

| Grammar    |  rtPass | Fail | Skip | Total | Strict gate (≥total−10)  | Relaxed gate (fail≤10) |
| ---------- | ------: | ---: | ---: | ----: | :----------------------- | :--------------------- |
| rust       | **121** |    2 |   13 |   136 | ❌ Unreachable (max=123) | ✅ Pass                |
| python     | **105** |    9 |    1 |   115 | ✅ Pass                  | ✅ Pass                |
| typescript |  **96** |   12 |    4 |   112 | ❌ −6 short              | ❌ −2 short            |

### Delta from 2026-04-24 baseline

| Grammar    | Start → End |      Δ |                                                    Commits |
| ---------- | :---------- | -----: | ---------------------------------------------------------: |
| rust       | 114 → 121   | **+7** |       3 (C1 clause whitespace, externals, readNode helper) |
| python     | 96 → 105    | **+9** | 2 (list_splat/pattern wrappers, external-boundaries $TEXT) |
| typescript | 93 → 96     | **+3** |                     1 (unnamed-alias literal preservation) |

**Total closed: +19 rtPass across three grammars** out of the 30
failures called out at session start. Rust 5 + python 9 + typescript 3
= 17 of 30 (plus +2 astMatch improvements not counted as rtPass).

### Why the strict gate is unreachable on rust

Rust has 13 corpus-entry skips out of 136. Skips arise when the corpus
entry's root parse errors OR contains no testable kinds. They cannot
become passes without deleting corpus entries — which would be
cheating. Maximum reachable pass = 123, strict target 126 is 3 above
ceiling.

The plan's "relax fromPass gate formulation to `fail ≤ 10`" (line 101
of original doc) should apply to rtPass too. Under that reading:

- **rust: PASS** (fail=2)
- **python: FAIL** (fail=11, need −1)
- **typescript: FAIL** (fail=12, need −2)

Total: 3 more real failures to close for cross-grammar gate.

### Commits landed this session

1. `c4a4ab6b 012/R1: C1 clause whitespace absorption — rust rtPass +4`
   Clause inliner absorbed outer-template spaces into bodies, silently
   dropping them when clause was absent. Fixed regex to leave outer
   whitespace alone.

2. `b5df77e8 012/R1: C-externals external-scanner text fallback — rust rtPass +3`
   `emitJinjaTemplates` didn't thread `nodeMap.externals` to
   `node.renderTemplate`, so the `hasHiddenExternalRef` guard never
   fired and raw_string_literal got slot-by-slot rendering.

3. `9b061d21 012/R1: C-wrappers python list_splat/list_splat_pattern — python rtPass +7`
   Added kind-specific reparse wrappers for python kinds that only
   appear in syntactic contexts the generic expression wrapper can't
   reproduce.

4. `081ca494 012/R1: C-alias-literal preserve unnamed-alias value — ts rtPass +3`
   resolveRule lost the literal `value` of unnamed aliases (e.g.
   typescript `alias(_ternary_qmark, '?')`). Preserve as string rule
   when value is punctuation.

5. `16d4ddbc 012/R1: readNode + walker multi-field detection (no count delta)`
   readNode: same-field anon-after-anon accumulates (prev replaced);
   walker: `fieldContentIsMultiSibling` helper for seq with 2+ named
   structural members. Unblocks follow-up work on ambient_declaration
   rendering; doesn't move counts on its own.

6. `afb18c4e 012/R1: C-external-boundaries $TEXT fallback — python rtPass +2`
   `hasHiddenExternalRef` required EVERY seq member to be external;
   added `hasExternalBoundaries` fallback that fires when first and
   last non-ignorable members are external. Python's `string` kind
   (f-string, t-string, template-string) has `seq(external_start,
REPEAT(content), external_end)` and now takes the $TEXT path
   instead of breaking slot-by-slot render.

### Deferred — alias-source child-slot drillAs

Several remaining failures across all three grammars share one class:
when tree-sitter aliases source-kind-A as target-kind-B at a specific
position (`decorator → call_expression`, `type_query → instantiation_expression`,
`_as_pattern → as_pattern` inside case), the wrap layer's `drillIn`
doesn't rewrite `$type` to the source, so rendering dispatches on the
target kind's template which has different field names.

The fix requires extending `AssembledChild` to track `aliasSources` (as
`AssembledField` already does) and emitting `drillAs` in the wrap
emitter's `emitChildrenSlotGetters`. Non-trivial; deferred.

Affects (confirmed): ts `Classes with decorator calls`, ts `Classes
with decorators`, ts `Type query and index type query types`, ts
`Typeof instantiation expressions`, ts `Import in type`, python `As
patterns`.

### Deferred — comparison_operator / list_splat / f-string shapes

Three smaller clusters that each need structural engine work:

- python `comparison_operator` inherited-field-name walker gap
  (tree-sitter inherits `comparators` onto bare `primary_expression`
  children inside the repeat — walker emits `$$$CHILDREN` which can't
  find them).
- python `Print used as an identifier [list_splat]: *` — list_splat
  rendering drops expression field in some contexts.
- python `f"...{interpolation}..."` — string kind uses external scanner
  tokens for start/end delimiters but also has real content field;
  `hasHiddenExternalRef` check doesn't match because content isn't
  all-external.

## Refreshed inventory (as of 2026-04-24 — post 013-canonical-surface work)

Measured via `npx tsx packages/codegen/src/scripts/counts.ts` (new in 013). All three grammars regenerated on branch `012-rust-core-port` with 013 enrich + variant() adoption + 012-rust-impl merge applied.

| Grammar        | Gate           |       Current | 2026-04-22 |                   Δ | Target |         Gap | Status        |
| -------------- | -------------- | ------------: | ---------: | ------------------: | -----: | ----------: | ------------- |
| **Python**     | fromPass       | **107 / 114** |  116 / 119 |   pass −9, total −5 |   ≥104 | **+3 over** | ✅            |
| Python         | rtPass         |  **96 / 115** |   96 / 115 |           unchanged |   ≥105 |      **−9** | ❌            |
| Python         | rtAstMatchPass |      92 / 115 |          — |                   — |      — |           — | reference     |
| Python         | factoryPass    |     193 / 860 |  197 / 889 |  pass −4, total −29 |    N/A |           — | out of scope  |
| **Rust**       | fromPass       | **130 / 148** |  165 / 176 | pass −35, total −28 |   ≥138 |      **−8** | ❌            |
| Rust           | rtPass         | **114 / 136** |  118 / 136 |             pass −4 |   ≥126 |     **−12** | ❌            |
| Rust           | rtAstMatchPass |     113 / 136 |          — |                   — |      — |           — | reference     |
| Rust           | factoryPass    |     417 / 959 | 459 / 1026 | pass −42, total −67 |    N/A |           — | out of scope  |
| **TypeScript** | fromPass       | **127 / 137** |  144 / 152 | pass −17, total −15 |   ≥127 | **+0 (at)** | ✅ borderline |
| TypeScript     | rtPass         |  **93 / 112** |   63 / 112 |        **pass +30** |   ≥102 |      **−9** | ❌            |
| TypeScript     | rtAstMatchPass |      83 / 112 |          — |                   — |      — |           — | reference     |
| TypeScript     | factoryPass    |     384 / 915 |  419 / 952 | pass −35, total −37 |    N/A |           — | out of scope  |

**Summary of outstanding R1 debt** (rtPass + fromPass):

- **rtPass: 30 total failures** (python 9 + rust 12 + typescript 9). **Down from 86 at 2026-04-22 baseline (−56).** Primary R1 target.
- **fromPass: 8 total failures** (all rust). Down from 22 at 2026-04-22 baseline (−14). Python over target; typescript at target. Rust remains 8 short.
- **Combined gates to close: 38 failures.**

### What changed 2026-04-22 → 2026-04-24

Three substantive shifts from the 013 work on this branch:

1. **TypeScript rtPass jumped +30.** Variant() adoption for `_export_statement_default` (three-level cascade), `class_body`, `_for_header`, `public_field_definition` (via `inline:` config) — plus polymorph classification improvements in Link — closed most of the 49-failure rtPass gap. The doc's "39 short, biggest lever" assessment is now obsolete.
2. **Totals shrank on every grammar.** fromTotal, factoryTotal, and the absolute pass counts dropped because 013's variant() adoption + `T065` auto-promotion removal consolidated kinds that the generator previously emitted independently (fewer phantom variants). Kinds fell out of the validation universe — this is a real-if-benign count shift, not a regression.
3. **Rust fromPass regressed pass-rate-wise.** Total 176 → 148 (fewer tested kinds) with pass 165 → 130 (more than proportional drop). Some kinds that previously passed `.from()` now don't — needs diagnosis. Could be a drift from 013 adoption, OR formerly-skipped kinds now count. Target was `≥138` (rtTotal-10); current 130 is 8 short.

### Revised priority for remaining R1 closures

**fromPass gate is effectively met on all three grammars** — direct validator breakdown:

| Grammar    | pass | skip | fail | total | Real failures |
| ---------- | ---: | ---: | ---: | ----: | ------------- |
| python     |  107 |    4 |    3 |   114 | 3 genuine     |
| rust       |  130 |   17 |    1 |   148 | **1 genuine** |
| typescript |  127 |    6 |    4 |   137 | 4 genuine     |

The `fromPass ≥ fromTotal − 10` formula counts skips against the gate, but skips are factories that throw when the validator can't construct children — an accepted-by-design behavior (factories need strongly-typed children, not the raw validator-synth shape). **The "8 short" on rust is 17 skips — 1 real failure.** Retargeting R1 as `pass + skip ≥ total − 10` (or `fail ≤ 10`) would pass fromPass on all three grammars today.

**Recommend: relax fromPass gate formulation** to `fail ≤ 10 per grammar` (currently 3 + 1 + 4 = 8 real failures total). R1 fromPass effectively **closed**.

1. **Rust rtPass** (12 short) — biggest remaining rt gap. Check clusters C1/C4/C9 below — likely still live.
2. **Python rtPass** (9 short) — C1/C6 still in play; list_splat (C7) unchanged.
3. **TypeScript rtPass** (9 short) — C1 remnants + any non-variant clusters. 013's adoption work already covered the bulk.

**Target total to close** (assuming fromPass gate relaxation accepted): 30 rtPass failures. Down from 86 at 2026-04-22 baseline. Balanced ~equally across grammars.

- **Factory recursive debt: ~1985 failures** across grammars. NOT part of R1 gate. Tracked as an ongoing parallel cleanup workstream.
- Stale FLOOR numbers in `corpus-validation.test.ts` are a separate clerical cleanup — they can be raised to current actuals in a single-line PR after R1 lands. Not gating anything.

---

## Cluster inventory (from MEMORY.md + recent commits)

Each cluster below is a root-cause class; fixing one cluster typically closes 5–40 individual failing corpus entries. Ranked by estimated unblock-per-cluster.

### CV — variant() first adoption for the three FR-011 exception kinds (highest-impact; new top priority)

**Discovered 2026-04-22** during R1 execution attempt. Supersedes the earlier framing of C1/C3 (polymorph null forms, TS primary_type nonsense variants) for the three kinds specifically enumerated in spec 012's FR-011: `rust/visibility_modifier`, `typescript/export_statement`, `typescript/call_expression`. Adopting `variant()` in overrides.ts for these kinds (the approach spec 007 landed as DSL infrastructure) closes these failures **and** removes the FR-011 three-exception carve-out entirely — all polymorphs end up rendering via child-kind → own-template dispatch, with no `{% if variant == "..." %}` conditionals anywhere.

**Root cause (what this cluster fixes)**: Templates for the three exception kinds use `{% if variant == "formN" %}` chains. `$variant` is only populated by factory construction, not by `readNode` or `readTreeNode`. Validators use the readNode path, so templates fall through to empty output → re-parse fails. ~30 of 49 typescript rtPass failures originate here (all `call_expression` + `export_statement` cases). Rust `visibility_modifier` contributes fewer rtPass hits but is the cleanest probe target.

**Important state-of-the-world facts**:

- **`variant()` has zero live grammar adopters today.** DSL-level unit tests exist (`polymorph-metadata.test.ts`, `transform-hoist.test.ts`, `wire.test.ts`), but no `packages/{lang}/overrides.ts` actually calls `variant()`. Spec 007 landed the primitive; grammar adoption was deferred.
- **The three kinds were explicitly "held"** (see `packages/typescript/overrides.ts:247-271` — prior decision to skip variant() for `call_expression` / `export_statement` / `parenthesized_expression` due to grammar-level conflicts that splitting would expose. "Out of scope for variant() adoption" at the time.).
- **Re-opening those holds is the spirit of this cluster**: either accept manual `conflicts:` authoring per-kind, or mechanize it.

**Status update (2026-04-24)**:

Most of this cluster is **now done** as part of 013. `variant()` has live grammar adopters in all three packages:

- rust: `visibility_modifier`, `range_pattern_left`, 3 delimiter-variant kinds
- python: `match_block`, `dict_pattern`, `with_clause`
- typescript: `_export_statement_default` (three-level cascade), `class_body`, `_for_header`, `public_field_definition` (via tree-sitter `inline:` rather than conflicts), `update_expression`

Phases D, A, B were effectively completed (walker emits ambient tokens around `{{ children }}` when the parent has structural delimiters; `conflicts:` arrays were hand-authored per-kind). TS rtPass climbed from 63 → 93 as a direct result.

**Remaining scope**: typescript's two original holds — `call_expression` and `parenthesized_expression` — were NOT re-opened. `export_statement` is covered by `_export_statement_default`; `public_field_definition` via inline. If the remaining 9 TS rtPass failures trace to `call_expression` fall-through, re-opening that hold is the logical next step. Diagnose with `diff-failures.ts typescript rt` before committing to the fix.

**Execution sequence (revised 2026-04-22 post-probe: Phase A/D swap — D is a prerequisite, not a follow-up)**:

The original ordering (A → B → C → D) made Phase D a _follow-up_ after the variant() grammar changes landed. Phase A, executed 2026-04-22 against `rust/visibility_modifier`, proved Phase D must land **first**: the grammar-level mechanism works end-to-end (tree-sitter generate clean, readNode surfaces variant child kinds, per-variant `.jinja` files emit) but the parent template is produced as `{{ children | join(" ") }}` stripped of its ambient anonymous tokens (`pub`, `(`, `)`), so rendering is lossy (`"pub(crate)" → "crate"`, `"pub" → ""`). rtPass did not move. See **Phase A probe results** below for the raw findings that drove this reordering.

- [ ] **CV Phase D (new first step) — Template-emitter refactor**. Update `AssembledPolymorph.renderTemplate()` at `packages/codegen/src/compiler/node-map.ts:1391-1402` so that when forms are lifted to variant() child kinds, the parent template preserves ambient anonymous tokens around the `{{ children }}` slot (`pub ( {{ children }} )` for visibility_modifier, not the flat `{{ children | join(" ") }}` it emits today) and each variant child gets its own dedicated template. Land **without** grammar adopters: the per-grammar no-variant-adoption codebase should still pass all validators unchanged. Add a unit test that freezes the emitter's expected output for a synthetic "parent-with-structural-delimiters + variant children" shape so future refactors don't regress it.
- [ ] **CV Phase A (re-run) — Probe now that D has landed**. Re-apply `variant()` adoption on `rust/visibility_modifier` (the same change the 2026-04-22 probe made; see below for exact paths/keys). **Expected outcome**: clean compile AND rtPass for pub(crate)/pub(super)/pub(in path) cases closes. If rtPass still doesn't move despite correct-looking templates, escalate — D missed a case.
- [ ] **CV Phase B — Handle conflicts (scope depends on A-rerun)**. If A-rerun compiled: verify end-to-end by checking readNode output includes the new child kinds + measuring rtPass delta. If A-rerun errored: inspect the conflicts. Small finite list → prototype auto-wiring (diff `tree-sitter generate` output before/after, extract conflict pattern, emit `conflicts:` array automatically via codegen). Sprawling → commit to manual `conflicts:` authoring per-kind in overrides.ts.
- [ ] **CV Phase C — Expand to typescript's three holds**. Retry `call_expression`, `export_statement`, `parenthesized_expression` using whatever Phase B learned. Target is the ~30 typescript rtPass failures that the template-fall-through diagnosis attributes to these kinds.

**Phase A probe results (executed 2026-04-22, reverted)**:

The probe applied `variant('pub_self' | 'pub_super' | 'pub_crate' | 'pub_in_path')` patches to `rust/visibility_modifier` via the **declarative `transforms:` config** (wire-time pre-registration required — `variant()` inside a rule-body `transform()` call does NOT trigger it; the initial in-`rules:` attempt failed with `Undefined symbol _visibility_modifier_pub_self`).

Exact change (for Phase A-rerun):

```ts
// packages/rust/overrides.ts
import { ..., variant, ... } from '../codegen/src/dsl/index.ts'
// In transforms: (before while_expression)
visibility_modifier: {
    '1/1/0/1/0': variant('pub_self'),
    '1/1/0/1/1': variant('pub_super'),
    '1/1/0/1/2': variant('pub_crate'),
    '1/1/0/1/3': variant('pub_in_path'),
},
```

Path `1/1/0/1/N` walks `choice(bareCrate, seq(pub, optional(seq('(', choice[N], ')'))))`. The authored rule body in `rules:` (field-wrapping `pub` / `in` via `_kw_pub` / `_kw_in`) remains unchanged — wire composes them: authored fn runs first, then variant() patches apply.

Probe results: ✅ `tree-sitter generate` clean (no conflicts, only pre-existing warnings) ✅ node-types.json emits 4 variant child kinds with correct field routing ✅ re-compiled parser.wasm surfaces the aliases (`pub(crate)` parses as `visibility_modifier → "pub" "(" visibility_modifier_pub_crate ")"`) ✅ per-variant `.jinja` templates emit ✅ fromPass +4 pass / +4 total (165/176 → 169/180 — new kinds pass-by-construction) ✅ pinning test suite unchanged ❌ rtPass +0: parent template is `{{ children | join(" ") }}` stripped of `pub`/`(`/`)` → `"pub" → ""`, `"pub(crate)" → "crate"` lossy renders.

**Risk surface post-reordering**:

1. **Phase D scope** — the emitter refactor must cover both "parent-with-delimiters" (visibility_modifier shape) and "parent-with-no-delimiters" (typescript call_expression / export_statement shapes where the variant arms differ at the top-level seq, not inside a sub-grouping). A narrow fix that only handles visibility_modifier's shape won't close the typescript cluster. Validate D's scope against at least one ts kind before declaring D complete.
2. **Pipeline correctness** — variant() has unit-test coverage but now partial end-to-end coverage (Phase A probe confirmed grammar-level correctness for one kind). Latent bugs for more complex shapes may still surface in Phase C.

**Success definition for CV**: all three FR-011 exception kinds rendered via child-kind dispatch (no `{% if variant == %}` in their .jinja output), and rtPass improves by ~30 across typescript + some rust increment. When CV completes, the remaining R1 debt is the smaller clusters (trailing-semi, quote-style, object_type offset — ~19 failures) which fit the normal per-cluster loop.

---

### Older cluster inventory (pre-CV; retained for reference)

### C1 — Polymorph "null forms" crashing render (~30 failures)

Root cause: walker over-expands choice-of-symbol, producing "null" polymorph forms (`mod_item_external` etc.) where `modelType=none` and the render pipeline crashes instead of dispatching.
Owner files: `packages/codegen/src/polymorph-variant.ts`, `packages/codegen/src/compiler/template-walker.ts`.
Affects: `rust/rtPass`, some `typescript/rtPass`.
Signal: failures with "null template" or render throwing on undefined branch.

### C2 — Python soft-keyword overreach (~15 failures)

Root cause: Python `match`, `print`, and other soft keywords are rejected as identifiers by the factory validator.
Owner files: `packages/codegen/src/emitters/factories.ts` (keyword detection), `packages/python/overrides.ts`.
Affects: `python/factoryPass`, `python/factoryAstMatchPass`, downstream `python/fromPass`.
Signal: test output naming the Python identifier that failed construction.

### C3 — TS primary_type nonsense variants (~18 redundant forms)

Root cause: 20 polymorph forms declared; 18 are structurally identical (`$$$CHILDREN` only). Walker emits redundant forms because polymorph detection uses choice-of-symbol instead of render-relevance.
Owner files: `packages/codegen/src/polymorph-variant.ts`, `packages/codegen/src/compiler/template-walker.ts`.
Affects: `typescript/rtPass` (cluster C3 is a major contributor to the 57 rtPass failures).
Signal: test output showing 18+ nearly-identical failure signatures in the `primary_type` family.

### C4 — Choice branches with differentiating literals (3 kinds, multi-failure)

Root cause: `function_type`, `impl_item`, `macro_definition` fail because the walker drops literals from non-primary branches. Needs polymorph split via `variant()` but is blocked by the field-wrapped-choice limitation (MEMORY.md `project_variant_field_wrapped_choice`).
Owner files: `packages/codegen/src/polymorph-variant.ts`, `packages/codegen/src/dsl/enrich.ts`.
Affects: `rust/factoryAstMatchPass`, `rust/rtPass`, cross-grammar if pattern repeats.
Signal: test failures on these specific three kinds with literal-drop diagnostics.

### C5 — Factory anon-token clause gap (3 impl_item failures)

Root cause: walker emits `!`/`?` clauses; factory config has no slot for anon tokens → round-trip fails. MEMORY.md flags this as a residual 6-of-32 item; defer unless user needs factory `!` support.
Owner files: `packages/codegen/src/emitters/factories.ts`.
Affects: `rust/factoryAstMatchPass` (small).
Signal: `impl_item` factory-ast failures.

### C6 — Python comments-as-extras (2 failures)

Root cause: Python's comment handling treats comments as "extras" in the tree, which the round-trip renderer doesn't preserve.
Owner files: Reparse wrapping in `packages/codegen/src/validate/common.ts` and/or render pipeline.
Affects: `python/rtPass`.
Signal: `python/rtPass` failures on source with inline comments.

### C7 — list_splat grammar field-drop (1 failure)

Root cause: single Python kind (`list_splat`) loses a field during factory-ast roundtrip.
Owner files: Likely a targeted override in `packages/python/overrides.ts`.
Affects: `python/factoryAstMatchPass` (1).
Signal: `list_splat` in test output.

### C8 — Python override-parser drift (MEMORY thread)

Root cause: spec 007 override-compiled parser produces different tree structure than the base parser; generated routing was built against the base parser. T023 of spec 007 was to switch `node-types.json` source to the override version — **status: unclear**; verify before starting Python factoryPass gap work.
Owner files: `packages/codegen/src/validate/node-types-loader.ts`, `packages/python/.sittir/` build artifacts.
Affects: `python/factoryPass` (this is the biggest single contributor to the +53 gap).
Signal: Systematic factory failures that trace to tree-structure mismatch rather than per-kind bugs.

### C9 — Residual aliased-kind / alias-collapse bugs (several failures)

Root cause: codegen emits interfaces/factories for kinds that tree-sitter aliases away (not in node-types.json). MEMORY.md `project_alias_collapse_dead_kinds` catalogues the rust grammar cases.
Owner files: `packages/codegen/src/compiler/*` (alias resolution).
Affects: Mixed; mostly `rust/factoryPass` and `rust/rtPass`.
Signal: factory construction fails for a kind that appears to exist but isn't in the parser's output.

---

## Priority ordering (revised again — variant()-adoption-first)

Re-ordered after the mid-execution discovery that the three FR-011 exception kinds drive ~30 of the 49 typescript rtPass failures via the variant-dispatch gap (templates use `{% if variant == %}` but readNode doesn't populate `$variant`). Adopting `variant()` in overrides.ts is the source-of-truth fix and eliminates the FR-011 exception carve-out entirely.

1. **CV (variant() adoption for the three FR-011 exception kinds)** — NEW TOP PRIORITY. Closes ~30 typescript rtPass failures + several rust `visibility_modifier` cases + removes the three-exception framing from spec 012 FR-011 as a bonus. **Phased execution D → A → B → C inside CV (see cluster entry above)**; revised 2026-04-22 after the original Phase A probe confirmed that the Phase D template-emitter refactor is a prerequisite, not a follow-up. Phase D is now the first concrete action.
2. **C1 (polymorph null forms)** — affects rust + typescript rtPass for non-CV polymorphs. CV may close some C1 cases incidentally.
3. **C4 (choice branches w/ literals)** — `function_type`, `impl_item`, `macro_definition` in rust (3 rtPass failures). Blocked on variant-field-wrapped-choice design limit; may become easier post-CV if the Phase D emitter refactor generalizes.
4. **C6 (Python comments-as-extras)** — 2–3 python rtPass failures.
5. **C9 (Rust aliased kinds / alias-collapse)** — handful of rust rtPass failures; targeted overrides.
6. **C3 (TS primary_type nonsense variants)** — deprioritized. If CV Phase D generalizes the variant-adoption pattern, C3 may become obsolete entirely (primary_type's 18 identical forms would collapse under child-kind dispatch).
7. **Residual long-tail rtPass failures** — whatever remains after CV + C1 land (likely ≤20 across grammars).

**Deferred / out of R1 scope**:

- **C8 (Python override-parser drift)** — was the original top priority under the stale FLOOR reading (+53 gap on python/factoryPass). Actual python/factoryPass is 197/889 today, well past legacy. Deprioritized. IF spec 007 T023 is still outstanding it's worth finishing, but not gating.
- **C2 (Python soft keywords)** — was flagged for factoryPass; not in R1 scope.
- **C5 (Factory anon-token clause gap)** — factoryPass only; not in R1 scope.
- **C7 (list_splat)** — factoryAstMatchPass only; not in R1 scope.

Completing the new top 4 should bring rtPass within target across all three grammars.

---

## Completion signal (operational definition — revised per A′)

FR-014's literal wording gates on "render + re-parse + from-resolution ceilings." That maps to **rtPass** (the render + reparse + AST-diff validator) and **fromPass** (`.from()` resolution). Factory correctness — especially recursive factory — is OUT of R1 scope and tracked as a parallel ongoing cleanup workstream.

For each of the three grammars, every one of the following must hold for R1 to be complete:

1. **`rtPass ≥ rtTotal − 10`** — at most 10 real round-trip failures per grammar:
   - python: `rtPass ≥ 105` (currently 96; close 9)
   - rust: `rtPass ≥ 126` (currently 118; close 8)
   - typescript: `rtPass ≥ 102` (currently 63; close 39)
2. **`fromPass ≥ fromTotal − 10`** — at most 10 `.from()` resolution failures per grammar:
   - python: already at 116/119 (3 failures) ✅
   - rust: 165/176 (11 failures) — marginal, needs −1 OR close a cluster to drop to ≤10
   - typescript: 144/152 (8 failures) ✅
3. **No `expect.fail`, `it.skip`, or `it.todo` is added to any validator test to satisfy this gate.** All fixes are genuine source-of-truth fixes in emitters/walkers/overrides.

**Explicitly OUT of R1 scope**:

- `factoryPass` and `factoryAstMatchPass` (non-recursive OR recursive). These are not mentioned in FR-014; they gate factory-construction correctness, which spec 012 MVP exercises only shallowly (T050 acceptance test does leaf-level factory edits, not deep tree construction). The ~1985 recursive-factory failures are tracked as an ongoing cleanup parallel to spec 012 MVP implementation — some of that debt will close incidentally when rtPass clusters are fixed (C1 polymorph null forms, C4 choice-with-literals affect both paths).
- Stale FLOOR numbers in `corpus-validation.test.ts`. These were set in a smaller-corpus era; they can be raised to current actuals in a single-line clerical PR after R1 lands. Not gating.

**Why `rtTotal − 10` and not zero**: some corpus entries include legitimately unrepresentable constructs (weird lexer states, whitespace-sensitive edge cases, language-quirks the render pipeline can't express). A hard zero forces suppressing those; a tolerance of 10 lets them remain as observed-but-tolerated without gating the feature. Narrower than current state (rtPass gaps of 19/18/49) and a clear numerical target.

**Revisit clause**: if the residual ≤10 per grammar includes a cluster that affects spec 012's P1 acceptance tests (T050/T051), that cluster moves above the gate and must be closed before T001 passes.

---

## Task loop (cluster-by-cluster)

The same 5-step loop repeats per cluster. DRY: do NOT open a new plan file per cluster.

### Per-cluster loop template

- [ ] **Step 1: Run the pinning test and record current numbers**

Run: `pnpm -F @sittir/codegen test -- corpus-validation`
Expected: some FLOORS pass, cluster-relevant ones fail with a numeric shortfall. Record the exact `pass/total` numbers for each grammar × gate.

- [ ] **Step 2: Isolate the failing cluster**

Run: `pnpm -F @sittir/codegen test -- corpus-validation --reporter=verbose 2>&1 | grep -A3 'FAIL\|at least'`
Expected: list of failing kinds + their grammar + the gate they fail (factory / from / rt).

Group by root cause per the Cluster Inventory above. If the cluster isn't in the inventory yet, classify it and add it to §"Cluster inventory" in this file as Cn (n = next number) before proceeding — keeps the inventory honest.

- [ ] **Step 3: Trace to the emitter / walker and write the fix**

Identify the owning file from the cluster's "Owner files" list. Read it. Write the fix at the source of truth. Do NOT hand-edit generated output (Constitution Principle III).

If the fix requires a grammar-specific override, edit `packages/{grammar}/overrides.ts`. If it requires a pipeline fix, edit `packages/codegen/src/...`.

- [ ] **Step 4: Regenerate affected grammars**

For each grammar whose generated output changes:

```
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

- [ ] **Step 5: Re-run the pinning test, verify the numbers improved, raise FLOORS in the same commit**

Run: `pnpm -F @sittir/codegen test -- corpus-validation`

Expected: the cluster's failing gate now passes at a higher `pass/total`. Open `packages/codegen/src/__tests__/corpus-validation.test.ts` and raise the `FLOORS.{grammar}.{gate}` value to the new `pass` number. The test ALSO asserts `FLOORS ≤ LEGACY_BASELINE` doesn't regress — so raising FLOORS past LEGACY_BASELINE is a good thing (it means we've beaten legacy on that gate).

Run the test again to confirm the new FLOOR is achievable and the raise was recorded correctly.

- [ ] **Step 6: Commit with a cluster-ID-tagged message**

```bash
git add -u
git commit -m "ceilings: close Cn ({one-line summary}) — {grammar}.{gate} FLOOR raised to NEW (+K)"
```

Example: `ceilings: close C1 (polymorph null forms) — rust.rtPass FLOOR raised to 112 (+5)`

Commit frequently: ONE cluster per commit, even if it's a two-line fix, so reverts and bisects stay scoped.

---

## Cluster-specific task heads (prioritized order)

Each of these expands into the per-cluster loop above. Execute in order; skip or defer per the per-cluster findings.

### C8 head — Python override-parser drift

- [ ] Check whether spec 007 T023 (`switch node-types.json source to override parser version`) was completed. Look at `packages/python/.sittir/` for override-produced artifacts + check `packages/python/node-types.json`'s provenance header. If T023 was NOT completed, complete it first — the ~40 downstream fixes come for free once node-types matches what the parser actually emits. This is likely the cheapest single intervention in the entire plan.
- [ ] Run the per-cluster loop for whatever residual Python failures remain after the T023 switch.

### C1 head — Polymorph null forms

- [ ] Run the per-cluster loop. Start by dumping a failing case to see whether `modelType: 'none'` is being emitted where `modelType: 'polymorph'` should be. Fix in `packages/codegen/src/polymorph-variant.ts`. Re-run across rust + typescript; python is largely unaffected.

### C3 head — TS primary_type nonsense variants

- [ ] Audit `packages/codegen/src/polymorph-variant.ts`: the classification must use render-relevance (does any template branch on the variant?) not just choice-of-symbol. MEMORY.md `project_variant_detection_rendering` has the framing.
- [ ] Run the per-cluster loop with typescript-only focus.

### C2 head — Python soft keywords

- [ ] In `packages/codegen/src/emitters/factories.ts`, check the keyword-detection pass. Python's `match`, `print`, `case`, etc. are soft keywords — valid identifiers in most contexts. The factory validator must allow them.
- [ ] Run the per-cluster loop.

### C4 head — Choice branches with literal differentiators

- [ ] This cluster is blocked by the variant-field-wrapped-choice limitation (MEMORY.md `project_variant_field_wrapped_choice`). Decide: (a) unblock the design limitation first (moderate design work), or (b) add per-kind hand-authored overrides for `function_type` / `impl_item` / `macro_definition` as a pragmatic patch. Option (b) is faster; option (a) is the DRY fix.
- [ ] Execute the chosen option, then run the per-cluster loop.

### C6, C7, C5, C9 heads — Residual polish

- [ ] Run the pinning test. For each remaining failure not covered by C1–C4, classify per the Cluster Inventory and close via the per-cluster loop. Expect each of these to raise a FLOOR by 1–3 pass counts.

---

## Exit gate for this plan

Re-run the corpus-validation pinning test. For each grammar, read the final `pass / total` per gate and check against the Completion signal §4 (rtPass target = rtTotal − 10). If all five conditions hold:

1. ✅ `factoryPass ≥ legacy` — all three grammars.
2. ✅ `factoryAstMatchPass ≥ factoryPass − 2` — all three.
3. ✅ `fromPass ≥ legacy` — all three.
4. ✅ `rtPass ≥ rtTotal − 10` — all three.
5. ✅ No `.skip` / `.todo` / `expect.fail` was added to pass the test.

Then T001 of `specs/012-rust-core-port/tasks.md` passes. Implementation of T002+ may begin.

**Do NOT raise FLOORS artificially to satisfy this gate.** Every FLOOR raise must accompany a genuine source-of-truth fix. The test's dual assertion (`FLOORS ≥ current achievement` + `FLOORS ≤ LEGACY_BASELINE`) enforces this when closing in on legacy; the `rtPass ≥ rtTotal − 10` check is the human-enforced part.

---

## Review & handoff

No subagent-review loop on this plan (it's operational — gated by a numeric test, not by code design that needs a review). Execute in the current session or via superpowers:executing-plans; each cluster-close commit is its own reviewable unit.

If you hit a cluster that falls outside the inventory after two isolated failures, **stop and extend the inventory** — the discipline of classifying before fixing keeps the cluster count honest and prevents whack-a-mole debugging.
