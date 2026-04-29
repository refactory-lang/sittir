# Handoff — `016-parity-regressions` branch

**Date**: 2026-04-26
**Branch**: `016-parity-regressions` (HEAD `15d92f0e`, pushed to origin)
**Base**: `master` (the 016 branch is stacked on the older `012-rust-core-port` line via base-branch convention)

This document captures everything the next operator needs to inherit the load-bearing context: what shipped this session, what remains open, and the durable rules/decisions that govern how to proceed.

---

## 1. What shipped this session (commits, newest first)

Push-ready on origin already except where noted.

| SHA        | Title                                                                    | What it actually does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `15d92f0e` | un-renderable A+B: leaf-check fixes 21 validator false positives         | `validate/renderable.ts` — `isPureLeafEntry` from `node-types.json` makes the NodeMap-based validator agree with the file-based one. Un-renderable count 25→4. Zero behavioral delta — these all already rendered correctly via the text fast-path.                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `37c77ddc` | T054: gate branch `$text` behind `SITTIR_DEBUG_TEXT=1`                   | `readNode.ts` — top-level branch nodes no longer carry `$text` by default; leaves still do; child stubs always do (intentional, materialize-on-receipt symmetry). Required collateral fixes: `render.ts` synthesizes text from anon children; `validate/from.ts` slices source for text-shaped factory kinds; `client-utils.ts` widens `isNodeData` discriminant.                                                                                                                                                                                                                                                                                                                                     |
| `43cc6f58` | T047: python `_simple_pattern.negative` via variant() adoption           | Two generator fixes: `assemble.ts:markVariantChildrenUserFacing` (variant children of supertypes weren't marked userFacing), and `node-map.ts:isTextTemplate` extended to recognise `seq(optional(punct), …)` shapes so the `-1` minus token isn't dropped. Python coverage 103/105→104/106.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `af8b1ee8` | T049: jinja-conditional spacing for empty-body kinds                     | `node-map.ts:childrenMayBeEmpty` + `absorbFlankingChildrenSpaces` — containers with `repeat()`/`optional()` children now wrap the children placeholder in `{% if children \| isPresent %} … {% endif %}`. Affected ts/python container templates regenerated.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `ba7ea88d` | T048: TS `override_modifier` position + `accessibility_modifier` pinning | `typescript/overrides.ts` — `method_definition`, `method_signature`, `property_signature` had position 1 mislabeled as `override_modifier` when it was actually `optional('static')`. Relabeled position 1 as `static_marker`; let enrich auto-promote the real `override_modifier` at position 2. `node-types.json` is now structurally correct (no more `static` contaminating the `override_modifier` field). Counts unchanged — corpus doesn't exercise the bug.                                                                                                                                                                                                                                  |
| `c5407b74` | T051: derive `hasTrailing`/`hasLeading` on `AssembledField` (DRY)        | `node-map.ts` derives the two flags from `simplifiedRule` (the same tree the walker uses — see Section 4 trap below). 4 callers in `template-walker.ts` migrated to `this.fields.filter(f => f.hasTrailing)`. Pure refactor — byte-equal output across both backends, zero count change.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `0180021a` | chore: project-wide oxfmt sweep + tooling drift sync                     | 1125 files. Quote-style + indent + semicolons across `.agents/`, `.claude/`, `.specify/`, `packages/`, `tests/`, `docs/`. Behavior unchanged. Was deferred during the long 016 session.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `8cb69dca` | spec 053: trailing/leading anon synthesized-field architecture           | Spec only — captures the architectural fix to replace the `MutableFlankedChildArray._trailing_anon` JS-side-channel (which `JSON.stringify` strips at the napi boundary, breaking native parity) with a true synthesized field. Implementation pending (#52).                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `bcab7daf` | spec 054: post-016 perf/memory/FFI tracking landing                      | Spec + implementation. New `packages/core/src/metrics.ts` (env-gated, zero overhead when off). `withMetrics` wraps `boundRender`; `recordFfi` instruments napi calls; `dumpMetrics` writes JSON. Validators (`validateRoundTrip`, `validateFactoryRoundTrip`, `validateFrom`, `validateReadNodeRoundTrip`) and `collect-baseline.ts` call `emitValidatorMetrics()` (DRY shared helper in `validate/common.ts`). New `check-perf-baseline.ts` regression-checker with 10 unit tests. New CI job `perf-regression-checker` (warn-only via `SITTIR_METRICS_FFI_WARN_ONLY=1` until 2026-05-26). Baselines: `perf-ts.json` (386 kinds, darwin/M4 Pro), `perf-native.json` (893 FFI calls, mean 0.0045 ms). |

**Pre-this-session, also on the branch**: `433bf34c` (T046 hidden-group factories, ships +6 net passes).

**Current counts** (as of `15d92f0e`):

- TS-mode: 84 test files / 4451 tests pass / 12 expected-fail. Un-renderable per-grammar: rust 0, ts 1, python 3 (total 4 — the real failures).
- **Native: 8 test files FAIL / 4142 pass / 300 fail / 12 expected-fail.** All 300 failures cascade from one unimplemented stub at `packages/codegen/src/validate/common.ts:209`: `nativeTreeHandle.nodeById()` throws. This is THE top blocker — see §2.0.

---

## 2.0. **TOP BLOCKER: native `nodeById()` is unimplemented**

`packages/codegen/src/validate/common.ts:209` defines a stub that throws:

```ts
nodeById(_id: number): AnyTreeNode {
  throw new Error("nativeTreeHandle: nodeById() unavailable — native handle reads via tree.read()");
}
```

This blocks `readNode()` whenever it's called on a native tree, which cascades into 300 native test failures across 8 files: `validate-all.test.ts` (factory round-trip × 3 grammars), `nodes.test.ts` × 3 grammars, `corpus-validation.test.ts`, `collect-baseline.test.ts`, `us1-codemod.test.ts`, `us1-hash-mismatch.test.ts`. Until this stub is replaced with a real implementation, native parity for ANY new render-side change cannot be verified beyond the basic `tree.read()` path.

What works in native mode today: rendering (perf-tracking collected 893 FFI calls successfully), basic tree iteration. What's blocked: any drill-down that resolves a node by ID — which is the entire post-readNode validator suite.

**Fix scope** (deferred from 012 rust-core-port):

- Likely implementation in `packages/core/src/loader.ts` or `cst.ts` (the native-handle adapter).
- May need a Rust-side index (HashMap<NodeId, NodeRef>) in `rust/crates/sittir-rust-napi/src/lib.rs` so the napi binding can answer the lookup in O(1).
- The TS handle has the same method working (`packages/codegen/src/validate/common.ts` — search for the TS-side handle implementation as the reference).

**Sequence implication**: ship `nodeById()` BEFORE C1/C2 land — otherwise the un-renderable kind regressions can't be verified in native mode, and the handoff's "zero regression" guarantee on those clusters is unenforceable.

**Risk**: medium. Touches FFI surface. Must coordinate with napi rebuild (`pnpm -C rust/crates/sittir-rust-napi run build`).

---

## 2. Open tasks — prioritised

The branch should be ready for PR after the un-renderable C1+C2 land and the linux perf baseline gets collected on first CI run. Everything else can be follow-up PRs.

### 2a. In-flight (already in spec/tasks framing)

#### **C1 — un-renderable polymorph-child kinds** (Python `with_clause_bare`, `expression_statement_tuple`)

- **Status**: agent failed mid-task on org monthly usage limit; nothing committed; no partial state.
- **Location**: `packages/codegen/src/compiler/assemble.ts` polymorph branch.
- **Fix**: after building `AssembledPolymorph` and its internal `${parent}__form_${child}` `AssembledGroup`s, register each visible variant child kind (`${parent}_${child}`) as its own NodeMap entry. The hidden source rule (`_${parent}_${child}`) already exists in `optimized.rules` as a structural SEQ.
- **Acceptance**: un-renderable count 4→2; templates `with_clause_bare.jinja` + `expression_statement_tuple.jinja` regenerate; zero regression.
- **Risk**: medium. Needs to NOT touch `compiler/{node-map,template-walker}.ts` if at all possible — those are sensitive. If template-walker changes are needed, coordinate.

#### **C2 — un-renderable structural symbol-aliases** (TS `interface_body`, Python `format_expression`)

- **Status**: not started.
- **Location**: `packages/codegen/src/compiler/evaluate.ts:synthesizeInlineAliasSources`.
- **Fix**: extend the synthesis pass (or add a companion) to handle bare-symbol aliases. `alias($.object_type, $.interface_body)` should synthesize `_interface_body: symbol(object_type)` so link/assemble see it. Must NOT re-synthesize kinds that already have rules (check `synthesizeAliasTargetRules` interaction).
- **Acceptance**: un-renderable count 2→0 (after C1); zero regression on TS or python counts.
- **Risk**: medium-high. The synthesis pass is delicate. Read `feedback_synthesize_hidden_for_inline_alias` memory note before editing.

#### **#52 — Trailing-anon synthesized field** (impl of spec 053)

- **Status**: spec authored (`8cb69dca`). Implementation pending.
- **Why it matters**: the current `MutableFlankedChildArray._trailing_anon` JS-side-channel in `render.ts` works for TS but is stripped by `JSON.stringify` at the napi boundary — breaks native parity for `tuple_expression` et al.
- **Fix direction**: trailing/leading anons become true fields, created by enrich (auto-promotion) or explicit override. First-class — survives the marshal.
- **Risk**: high. Touches enrich + override DSL + render walker. Plan TDD-style; the prior `walker_refactor_blockers` memory note documents two architectural pitfalls (nested-optional detection, hardcoded `CLAUSE_PUNCT_NAMES`).

### 2b. Open architectural specs (not yet authored)

#### **#16 — Spec 021: slot IDs at evaluate stage**

- Design direction documented in MEMORY.md (`project_slot_ids_in_rule_tree`).
- Foundation work — replaces ad-hoc walkers with slot-table lookups. Cleans up multi-field ClauseRule, nested-optional detection, walker spacing.
- DRY anti-pattern that this resolves: per-pass partial projections (multiple walkers each extracting same-shaped info differently — see MEMORY.md DRY section).
- Substantial. Read `feedback_rule_type_discrimination` and `feedback_no_node_types_json_fallback` first.

#### **#17 — Spec 022: collapse fields/children bifurcation**

- Architectural — depends on #16 landing first. The current `$fields` (named) vs `$children` (unnamed/positional) split is a derivation duplication; slot IDs let us collapse to a single ordered slot array with provenance metadata per slot.
- Substantial.

#### **#31 — Spec 020: drop `_list` suffix divergence**

- Concrete + scoped. TS templates use `{{ override_modifier }}`; rust-render mirrors use `{{ override_modifier_list }}` via `cli.ts:rewriteListUsage`. Two names for one fact (DRY anti-pattern).
- Per memory note `project_template_list_suffix_divergence`: option 1 is to drop the suffix entirely.
- Small spec. Worktree may already be staged at `.worktrees/020-*` per `project_pending_specs_post_016`.

### 2c. Open implementation work (no spec needed)

#### **#43 — `wrap.ts` setters**

- Currently read-only; asymmetric with factories. `wrap()` produces NodeData with getters but no setters; factories produce NodeData with both. Implement setters following the factory pattern.
- Touches `packages/codegen/src/emitters/wrap.ts` (codegen, NOT the generated `packages/{lang}/src/wrap.ts`).
- Medium scope.

### 2d. Spec 054 perf-tracking gaps (deferred at landing)

- **Linux baseline**: only darwin/Apple-M4 baseline committed in `perf-native.json`. Until a linux baseline is collected on first CI run, the gate auto-skips on linux via the `[INFO] platform mismatch — perf gate skipped` branch. Resolution: collect once on a successful CI run, copy the `metrics-native.json` artifact into `specs/054-post-016-perf-tracking/baselines/perf-native.json` (or maintain platform-keyed baselines).
- **Open questions still in spec.md** (need user resolution before plan.md):
  1. Output dir default (`cwd()` vs repo root)
  2. `templateWarmCache` field for Nunjucks first-call vs cached-hit distinction
  3. _(resolved this session: `warnOnlyUntil = 2026-05-26` hardcoded)_
  4. `rustResidentDeltaBytes` accuracy (RSS proxy is coarse; defer to jemalloc integration?)
  5. FFI threshold (10% may false-positive on GHA; absolute ms vs %?)

### 2e. Stale labels (already done, label hasn't been cleared)

- **#41** — `applyOverridePolymorphs` push-down: `pushAmbientScaffoldIntoVariantChildren` is implemented at `link.ts:899`. Closed.
- **#46** — Hidden-group fragment factories: closed at `433bf34c`. Closed.

### 2f. Lower priority / unattributed

| #   | Task                                                              | Notes                                         |
| --- | ----------------------------------------------------------------- | --------------------------------------------- |
| #29 | Wave 2 follow-up: python `_simple_pattern.negative` via variant() | Closed by T047 (`43cc6f58`).                  |
| #34 | Latent bug: TS method/property override_modifier                  | Closed by T048 (`ba7ea88d`).                  |
| #40 | Empty-body cosmetic spacing                                       | Closed by T049 (`af8b1ee8`).                  |
| #51 | DRY hasTrailing/hasLeading                                        | Closed by T051 (`c5407b74`).                  |
| #54 | Branch $text behind debug flag                                    | Closed by T054 (`37c77ddc`).                  |
| #49 | Post-016 perf spec                                                | Closed by spec 054 (`bcab7daf`); gaps in §2d. |

---

## 3. Pre-PR checklist for `016-parity-regressions`

Before merging to base:

- [ ] Land C1 (un-renderable 4→2)
- [ ] Land C2 (un-renderable 2→0) — optional; can ship as a fast-follow
- [ ] Run `pnpm format:check` — currently fails on baselines/spec files; either accept or fix
- [ ] Verify `git diff --quiet` after a clean regen across all three grammars (SC-006 from spec 016)
- [ ] Update PR description: list cluster commits + un-renderable closure + perf-tracking landing
- [ ] If `#12` (012-rust-core-port) merges to master, GitHub auto-rebases #016; re-run T041–T043 locally per spec 016 task list.

---

## 4. Durable rules / decisions / facts the next operator MUST internalise

These are the load-bearing principles. Violating them silently produces wrong answers — every anti-pattern this codebase has hit reduces to violating one of these. Read this section before writing any code.

### 4a. **DRY — one source, one derivation** (the central correctness principle)

> Every fact about the program has exactly one source, and exactly one definition of how to extract it.

Both clauses matter independently. Storage duplication drifts; derivation duplication disagrees. Specific failure modes that recur:

- **Ad-hoc tree walkers that collect partial projections**. If you find yourself writing a walker that extracts same-shaped information from rules that another walker already produces, **stop**. Consolidate. Bake facts into AssembledNode at construction time so no downstream pass re-walks.
- **String-name references instead of object references**. `contentTypes: string[]` re-derives via `kindMap.get(name)?` at every call site → drift point.
- **Silent `default:` branches in switch on discriminated unions**. End every switch on a `Rule` (or any tagged-union) with `assertNever(x)`. Adding a new variant must fail compilation, not silently contribute nothing.
- **Flattened flags that compress multi-valued facts**. `multiple: true` on a slot whose choice contains mixed single + repeat positions is lossy. The fact belongs on the value, not the slot.

### 4b. **Fix the generator, not the generated output**

Sittir generates a lot per grammar. Never hand-edit:

- `packages/{rust,python,typescript}/src/*` — factories, types, node-model, etc.
- `packages/{rust,python,typescript}/templates/*.jinja` — per-rule render templates (feature 011)
- `packages/{rust,python,typescript}/.sittir/grammar.js` — transpiled overrides bridge
- `packages/{rust,python,typescript}/factory-map.json5` + `overrides.suggested.ts`

If the output is wrong, the fix lives in `packages/codegen/src/` (walker / emitter / link / assemble / evaluate) or in `packages/<lang>/overrides.ts`. Regen via the commands in `CLAUDE.md` "Commands" section. MEMORY.md `feedback_no_hand_edit_yaml` is the long-form rationale.

### 4c. **No type-escape hatches as workarounds**

No `as any`, `as unknown`, `@ts-ignore`, `@ts-nocheck`, `eslint-disable` to silence type errors. The fix is to widen/narrow types honestly OR change code to match. Allowed exceptions: `as const`, `@ts-nocheck` on `overrides.ts` files (tree-sitter grammar.js shape is untyped by design), and `as unknown as Foo` inside `dsl/` cross-runtime shape bridging where `runtime-shapes.ts` guards narrow dual-case shapes (annotate why in a one-line comment).

### 4d. **Wave-style decomposition before commits**

Inline 3+ line comment blocks explaining "what the next chunk does" should be promoted to named private helpers with JSDoc (`@param`, `@returns`, `@throws`, `@remarks`, `@see`). Goal: linear, scannable function bodies — explanations live next to the code they describe, not above it. Reference commits: `60a0f77`, `f72f540`.

### 4e. **The simplifiedRule trap** (cost: 560 fixtures of native parity divergence in a prior attempt)

Several classes (AssembledBranch, AssembledGroup, etc.) hold both `rule` (raw, post-evaluate) and `simplifiedRule` (post-simplify, with field hoisting applied). The template walker walks `simplifiedRule`. Any derivation downstream that needs to agree with the walker MUST also use `simplifiedRule`, not `rule.content`. T051 (`c5407b74`) is the canonical example of doing this right.

### 4f. **Jinja intersection-safe primitives**

Templates are consumed by both Nunjucks (TS) and Askama (Rust). Per memory note `project_jinja_intersection_safe_primitives` (research-jinja-whitespace.md, prototype-verified 2026-04-25):

| Primitive                                            | Status                                                    |
| ---------------------------------------------------- | --------------------------------------------------------- |
| `is defined`, truthy `{% if x %}`, `!= ""`, `if let` | **DIVERGE** — do not use in shared templates              |
| `\| isPresent`                                       | Canonical conditional — works identically in both engines |
| `{% if x \| isPresent %} … {% endif %}`              | Use this for any shared-template conditional              |

Read this before editing any `.jinja` template OR walker emission.

### 4g. **Enrich operates on POST-evaluation Rule-objects only**

Per memory note `feedback_enrich_post_evaluation_only`: enrich changes the TS-side codegen surface; tree-sitter-cli generates `grammar.json` from CALLBACKS before evaluation. Enrich auto-promotions DON'T reach the parser. Retiring grammar overrides after an enrich rename breaks parsing/round-trip. This is why the wave-1/2/3 overrides remain necessary even though enrich appears to subsume them.

### 4h. **No node-types.json fallback**

Per memory note `feedback_no_node_types_json_fallback`: tree-sitter generates `node-types.json` from the same `grammar.json` we read. If our pipeline misses optionality or shape, fix our derivation — don't consult `node-types.json` as a workaround. DRY: one fact, one source, one derivation.

(Caveat: A+B un-renderable fix at `15d92f0e` reads `node-types.json` for the leaf check — but only as a _validator_ concession because the validator can't see the same kind information NodeMap sees. This is the rare exception; do NOT generalize to compiler/render paths.)

### 4i. **Inline `_kw_*` for LR-precedence after field-promotion**

Per memory note `feedback_synthesized_field_inline_for_lr_precedence`: when promoting a standalone optional-punct to `field('name', 'token')` triggers a parse-time ERROR via LR-state divergence with a sibling rule that needs the bare token, add `_kw_<name>` to the grammar's `inline:` array. Field wrapper survives at parse-tree level; hidden rule folds away at LR-table generation. Approaches 2 (extra `prec: -1`) and 3 (`conflict:`) are inferior.

### 4j. **Overrides.ts patterns**

Per memory note `feedback_overrides_and_variants`: read this before editing any grammar's `overrides.ts`. Core recurring patterns:

- `variant()` adoption — the canonical way to split a polymorph
- `conflicts.concat(previous)` — the only safe way to extend conflicts
- `field('semicolon')` — semicolon promotion idiom
- Anti-patterns to avoid: positional clobber on REPEAT(field('decorator')) at pos 0, naïve position swap that triggers field-promotion collisions (T048 is the clean example of how to do it right).

### 4k. **Rule type discrimination — switch first, type guards second**

Per memory note `feedback_rule_type_discrimination` and CLAUDE.md "Rule type discrimination":

1. Switch on `rule.type` with `default: assertNever(rule)` — exhaustive narrowing
2. Per-variant type guards (`isSeq`, `isField`, `isSymbol`, …) for `.filter()` / `.find()` / `.some()` / `.every()`
3. Inline `rule.type === 'seq'` checks inside switch arms or for one-off compound predicates
4. **Never introduce** enum / const mappings for type strings

DSL layer exception: `packages/codegen/src/dsl/*` accepts both lowercase (sittir) and uppercase (tree-sitter CLI) discriminants. Use `dsl/runtime-shapes.ts` dual-case predicates (`isSeqType`, `typeEq`, …). The case difference is a cross-pipeline-leak signal — don't normalize it away.

### 4l. **No silent formatting in templates**

Per memory note `feedback_no_silent_formatting`: never insert unconditional spaces between placeholders. Empty optional fields leave stray whitespace. Use Jinja-conditional spacing (`{% if label \| isPresent %} {{ label }}{% endif %}`) based on field optionality. T049 (`af8b1ee8`) is the canonical landed example.

### 4m. **TS post-processing reset** (memory note: `project_post_processing_reset`)

`collapse_inner_spaces` + `.trim()` were removed from both TS and Rust core render entry points. This surfaced ~308 walker-debt failures previously hidden behind cosmetic cleanup. Floors lowered to honest baseline (rust rt 121→59, ts rt 96→56). Subsequent walker work has been lifting these back up. **Do NOT re-add cosmetic post-processing as a workaround for whitespace bugs** — fix the walker.

### 4n. **Use probe-kind.ts for diagnostics**

Per memory note `feedback_use_probe_kind`: `packages/codegen/src/scripts/probe-kind.ts` dumps CST + NodeData + render output as JSON. USE IT before writing any `/tmp/probe-*.ts` script. Extend it when needed; don't fork.

### 4o. **Promote scratch scripts to tooling**

Per memory note `feedback_promote_scratch_scripts`: before writing a `/tmp/probe-X.ts`, pause and check if it exists in `packages/codegen/src/scripts/` or should be promoted. Recurring shapes: kind lineage, RT failure clustering, metrics. Promote > re-implement.

### 4p. **Unset `GITHUB_TOKEN` for `gh` PR-writes**

Per memory note `feedback_unset_github_token_for_gh`: env-var PAT lacks PR-creation scope. Prefix `GITHUB_TOKEN= gh pr create/merge/...` so it falls through to the keyring `gho_…` token.

### 4q. **Use TS LSP for moves/renames**

Per memory note `feedback_use_ts_lsp_for_moves`: non-trivial structural refactors go through LSP, not sed/grep. Prep target structure in code edits; user runs LSP "Move to file" / "Rename".

### 4r. **Raw per-grammar counts when iterating tests**

Per memory note `feedback_raw_counts_per_grammar`: report `fromPass/fromTotal`, `covPass/covTotal`, `rtPass/rtTotal/rtAstMatchPass`, `factoryPass/factoryTotal` per grammar on every regen/rerun. Aggregate pass/fail hides total-dropping regressions and floor-vs-actual output is hard to read.

### 4s. **Architectural decisions made this session**

These are landed and shouldn't be relitigated without strong reason:

- **Option Y canonicalization** (`1d41138c`): hidden `_x` kind names are CANONICAL throughout the codegen surface. Wrap remaps parser output (visible→hidden) on receipt. Rationale: gives the codegen pipeline one source of truth for kind identity; aliases are presentation, not identity.
- **Branch `$text` is debug-gated by default** (`37c77ddc`): top-level branches don't carry `$text`; child stubs do (intentional, for materialize-on-receipt). `SITTIR_DEBUG_TEXT=1` re-enables for debugging.
- **`hasTrailing`/`hasLeading` on AssembledField** (`c5407b74`): derived from `simplifiedRule` at construction. Replaces the previous walker-side `findFieldsWithRepeatFlag` per-pass projection (DRY anti-pattern resolved).
- **Spec 054 perf metrics** (`bcab7daf`): env-flag-gated (`SITTIR_METRICS=1`); zero overhead when off; emitted from validators (not just CLI); per-backend MetricsFile JSON; FFI regression gate warn-only through 2026-05-26 then enforcing.
- **`warnOnlyUntil = 2026-05-26`** is hardcoded in `perf-native.json` — flip to enforcing by removing the env block in `.github/workflows/ci.yml` after that date.

---

## 5. Quick command reference

```bash
# Regenerate all three grammars
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src

# Run tests per backend
SITTIR_BACKEND=js pnpm test
SITTIR_BACKEND=native pnpm test

# Collect baselines
SITTIR_BACKEND=js npx tsx packages/codegen/src/scripts/collect-baseline.ts
SITTIR_BACKEND=native npx tsx packages/codegen/src/scripts/collect-baseline.ts

# Probe a single kind
npx tsx packages/codegen/src/scripts/probe-kind.ts <grammar> <kind>

# Collect perf metrics
SITTIR_METRICS=1 SITTIR_BACKEND=js pnpm test     # writes metrics-ts.json
SITTIR_METRICS=1 SITTIR_BACKEND=native pnpm test         # writes metrics-native.json

# Check perf baseline
npx tsx packages/codegen/src/scripts/check-perf-baseline.ts

# Push (note: env unset is required — keychain token has the right scope)
GITHUB_TOKEN= git push origin 016-parity-regressions
```

---

## 6. Files / paths the next operator should know about

- **Pipeline source**: `packages/codegen/src/compiler/{walker,evaluate,link,assemble,simplify,enrich,node-map,template-walker}.ts`
- **Emitters**: `packages/codegen/src/emitters/{templates,factories,wrap,types,is,from,…}.ts`
- **Render runtime**: `packages/core/src/{render,readNode,metrics}.ts`
- **Per-grammar overrides**: `packages/{rust,python,typescript}/overrides.ts` (hand-authored)
- **Generated** (NEVER hand-edit): `packages/{rust,python,typescript}/src/*`, `packages/{rust,python,typescript}/templates/*.jinja`, `packages/{rust,python,typescript}/.sittir/grammar.js`
- **Validators**: `packages/codegen/src/validate/{roundtrip,factory-roundtrip,from,readnode-roundtrip,renderable,template-coverage}.ts` + shared `common.ts`
- **Scripts**: `packages/codegen/src/scripts/{collect-baseline,check-baseline-regression,check-perf-baseline,probe-kind,probe-stages,probe-rule}.ts`
- **Baselines** (committed contracts): `specs/016-parity-regressions/baselines/{ts,native}.json`, `specs/054-post-016-perf-tracking/baselines/perf-{ts,native}.json`
- **Memory** (load-bearing context): `~/.claude/projects/-Users-pmouli-GitHub-nosync-refactory-lang-sittir/memory/MEMORY.md` + per-entry files in same dir

---

## 7. Recommended next-session sequencing

0. **`nativeTreeHandle.nodeById()`** — implement (§2.0). This is the prerequisite — without it, native parity can't be verified on subsequent changes.
1. **C1** — un-renderable polymorph children (assemble.ts). Ship after #0; small, scoped, clears 2 of 4 remaining.
2. **C2** — un-renderable structural symbol-aliases (evaluate.ts). Ship next; clears the last 2.
3. **Open PR** for `016-parity-regressions` with the cluster commits enumerated.
4. **First CI run** — collect linux `metrics-native.json` artifact, commit as the linux baseline (or per-platform baseline structure).
5. **Spec 020** (#31) — small spec authoring; drops `_list` suffix divergence. Easy win.
6. **#43** wrap.ts setters — straightforward impl.
7. **#52** trailing-anon synthesized field — substantial; needs careful TDD per `walker_refactor_blockers` memory note.
8. **#16/#17** specs 021/022 — large arch work; do these last (or split into a separate branch).

---

End of handoff.
