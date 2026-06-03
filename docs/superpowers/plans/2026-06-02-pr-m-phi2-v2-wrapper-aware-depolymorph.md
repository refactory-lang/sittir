# PR-M-φ2 (re-scoped) — Wrapper-aware classification + runtime-variant-dispatch removal — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. Implementer = **sittir-codegen**; root-cause diagnosis = **sittir-research**. Supersedes the un-finished Chunk 1 of `2026-06-02-pr-m-phi2-enrich-clause-convergence.md`; that plan's clause-hoist is already landed as WIP checkpoint `d9a1a5cc`.

**Goal:** Make the enrich clause-hoist safe end-to-end by (a) removing the stale runtime variant dispatch in the validator, (b) making compile-time polymorph/group/transform classification wrapper-aware (resolve through enrich's `source:'enriched'`/`source:'group-lift'` wrappers), and (c) hardening the native gate to report crashing kinds — then finishing the ClauseRule cut.

**Architecture:** Enrich hoists `optional(seq(…))` uniformly and upstream (already done). Every downstream consumer becomes *wrapper-aware* via one shared `isTransparentWrapper` primitive instead of special-case exclusions. The validator stops re-deriving variants at runtime (`nodeToConfig` sniffing) — variant is a compile-time fact. The native validator is process-isolated so a SIGSEGV names the crashing kind.

**Tech Stack:** TypeScript (ESM, `.ts` imports), vitest, tree-sitter grammar DSL, Rust napi render engine.

**Spec:** `docs/superpowers/specs/2026-06-02-pr-m-phi2-enrich-clause-group-convergence-design.md` (needs a scope amendment — see Task 0.0).

**Branch:** `pr-m-phi2-enrich-clause-convergence` (continue; WIP checkpoint `d9a1a5cc` is the base state — validation RED).

---

## Critical operating facts (learned this session — do not relitigate)

- **GATE ON RELEASE, NOT DEBUG.** `SITTIR_NATIVE_DEBUG=1` (set in `.claude/settings.local.json`) builds the napi crate in debug — the debug binary **segfaults at validation runtime** (a separate, unrelated defect). Always gate with `env -u SITTIR_NATIVE_DEBUG pnpm validate:native`. Debug regen is fine for the fast inner loop (cargo-build/`git diff` artifacts); only the *validation runtime* is debug-broken.
- **Current RED state (`d9a1a5cc`):** all 3 grammars GENERATE + cargo-build clean; release `validate:native` SEGFAULTS (exit 139) during rust validation. `function_type` is NOT the culprit (probe-kind clean). Culprit unlocalized → Task 1.x exists to bisect it.
- **Composition is now unified** to the rust pattern (`const enrichedBase = enrich(base); grammar(enrichedBase, wire({…}, enrichedBase))`) across all 3 grammars. This newly **activated `applyAutoGroups` on TS/python** — a real scope expansion already baked into the checkpoint. The `sittirGrammar(base, cfg)` single-entry cleanup (kills the double-pass footgun + the `__enrichedClauseGroups__` side-channel) is a deferred follow-up, NOT in this plan.
- **`$variant` is consumed** by the generated dispatcher's `switch (config.$variant)`. Removing the runtime *inference* requires `$variant` to be available from a compile-time source — confirm in Task 0.1 before deleting (Task 2.x).
- **Never stage** `rust/crates/sittir-*/test-fixtures.json` or `packages/validator/validation-history.jsonl` (`git checkout -- <path>` to restore). Commit by explicit pathspec. End commits with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Avoid literal `tsc` in commit messages (hook).

---

## Chunk 0: Diagnosis + spec alignment (no destructive change)

### Task 0.0: Amend the spec for the expanded scope
**Files:** Modify `docs/superpowers/specs/2026-06-02-pr-m-phi2-enrich-clause-group-convergence-design.md`
- [ ] Add a section recording: (1) runtime variant dispatch removal (outright, decided 2026-06-02), (2) `isTransparentWrapper` generalized to a shared primitive consumed by polymorph dispatch + group classification + transform path-addressing (not just transforms), (3) composition-unification reality + applyAutoGroups activation on TS/py, (4) native-validation process-isolation as a gate-hardening requirement.
- [ ] Commit (docs-only; `--no-verify` if the manifest hook trips).

### Task 0.1: Diagnose — what does removing the runtime variant dispatch break? (sittir-research)
**Goal:** Prove whether `$variant` is available compile-time post-de-polymorph, so outright removal of the `source='override'` runtime inference (common.ts:1691–2215) is safe.
- [ ] `findReferences` on `polymorphVariants`, `$variant`, the `nodeToConfig` override-inference helpers — map every consumer.
- [ ] Determine: when the runtime inference is gone, does the generated `switch (config.$variant)` still get a `$variant` from the `polymorphVariants` descriptor stamping (common.ts:2056–2071), or from compile-time classification, or does the `switch` itself need to be removed/replaced?
- [ ] Report the precise removal boundary + what (if anything) must replace the `$variant` source. Confidence + what's ruled out. **No edits.**

### Task 0.2: Diagnose — localize the release-build segfault (sittir-research)
**Goal:** Name the crashing kind(s) so Chunk 2/3 fixes are targeted.
- [ ] Bisect via per-kind `probe-kind --grammar rust` (and ts/py) over the kinds the clause-hoist/applyAutoGroups reshaped (diff `node-model.json5` vs `d6d69174` to get the changed set). Identify which kind segfaults in isolation.
- [ ] Hypothesis to test: wrapper-unaware classification → empty/`<none>` variant → bad config → rust render null-deref. Confirm the layer (wrap/transport/render) with probe-kind stage output.
- [ ] Report crashing kind(s) + the layer + the codegen source responsible. **No edits.**

---

## Chunk 1: Harden the native gate (process isolation)

### Task 1.1: Process-isolate native validation so a SIGSEGV reports the kind
**Files:** Modify the native validation runner (`packages/codegen/src/validate/*` + the `validate:native` entry; confirm exact file via `rg "validate:native"` + the counts/validator entry).
- [ ] **Write the failing test / repro:** a validation run where one kind segfaults currently yields opaque exit 139 with no per-kind attribution.
- [ ] Implement per-grammar (and, where feasible, per-kind) subprocess isolation: run native validation in a child process; on child exit 139, the parent reports `grammar=<g> kind=<last-attempted>` and continues to the next unit instead of dying. (SIGSEGV can't be caught in-process — observe it via child exit code.)
- [ ] Verify against the current `d9a1a5cc` RED state: the run now prints the crashing kind instead of bare exit 139.
- [ ] Gate: this is harness-only (no Rust emission) — fast signals + a manual RED-repro suffice. Commit.

---

## Chunk 2: Remove runtime variant dispatch (outright)

### Task 2.1: Delete the `source='override'` runtime variant inference
**Files:** Modify `packages/codegen/src/validate/common.ts` (remove `resolveOverrideVariantFromKind`, `inferOverrideVariantFromHelperChildKinds`, `inferFromStructuralMarkers`, `findOverrideVariantChildNode`, `buildVariantHelperData`, `resolveFromSingleChildSpine`, the `[nodeToConfig] no variant matched` warning, and the recursive variant-child descent — per Task 0.1's boundary).
- [ ] Apply Task 0.1's removal boundary exactly. Replace the `$variant` source with the compile-time path Task 0.1 identified (descriptor stamping or compile-time classification) — do NOT leave the `switch (config.$variant)` without a tag source.
- [ ] `findReferences` confirms no live caller of the deleted helpers remains.
- [ ] Type check green; `rg "no variant matched"` → zero.
- [ ] **Gate (RELEASE):** `env -u SITTIR_NATIVE_DEBUG pnpm validate:native` — does removing the runtime sniffing clear the segfault (the no-variant→bad-config→crash path)? Report deep-AST vs floor (rust 111 / ts 69 / py 74) + exit code. If still RED, Task 0.2's localized kind guides Chunk 3.
- [ ] Commit (Rust-emitting if it changes generated dispatch — cargo-verify).

---

## Chunk 3: Wrapper-aware compile-time classification

### Task 3.1: Build the shared `isTransparentWrapper` primitive
**Files:** Create `packages/codegen/src/dsl/wire/transparent-wrapper.ts` (+ test).
- [ ] TDD: `isTransparentWrapper(rule)` true for prec wrappers, `source:'enriched'` in-place wraps, 2-member `CHOICE[X,BLANK]`; plus a `resolveThroughWrappers(rule)` that follows a `source:'group-lift'` SYMBOL to its `base.grammar.rules` body and returns the real underlying node. False/identity for plain seq/choice/field/symbol.
- [ ] Pure unit-tested helper — no native gate needed. Commit.

### Task 3.2: Make polymorph classification + dispatch wrapper-aware
**Files:** Modify `packages/codegen/src/compiler/link.ts` (`promotePolymorph`/`applyOverridePolymorphs`) and the polymorph dispatch emitter (`emitters/factories.ts` `emitPolymorphDispatch`) + `factory-map.ts` childKind derivation.
- [ ] Where these read "first child kind" / discriminating member to classify or emit variant dispatch, route through `resolveThroughWrappers` so an enrich-hoisted `optional(SYMBOL(_…optionalN))` resolves to the real first child (not `<none>`).
- [ ] Use Task 0.2's crashing kind as the witness fixture (probe-kind must render it post-fix).
- [ ] **Gate (RELEASE):** deep-AST hold-or-improve; the localized segfault kind no longer crashes. cargo-verify. Commit.

### Task 3.3: Make group classification + transform path-addressing wrapper-aware
**Files:** Modify `packages/codegen/src/compiler/link.ts` (`classifyHiddenSeqRule` + group paths) and `packages/codegen/src/dsl/transform/transform.ts` + `transform-path.ts` (consolidate the scattered prec/optional/choice-blank transparency onto `isTransparentWrapper`; add `source:'group-lift'` follow-through).
- [ ] Route group classification + transform path-addressing through the shared primitive. WIDE override probe → 0-unexpected.
- [ ] **Gate (RELEASE):** deep-AST hold-or-improve; cargo-verify. Commit.

---

## Chunk 4: Finish the ClauseRule cut + close out

### Task 4.1: Delete ClauseRule/detectClause + fold the 23 `'clause'` arms
(As in the original plan Chunk 1 Tasks 1.3–1.4, now safe because enrich owns hoisting and classification is wrapper-aware.)
- [ ] Delete `detectClause` (link.ts), `ClauseRule`/`isClause` (rule.ts), `emitClause` (templates.ts); fold the 23 `'clause'` arms into `'group'`. `rg "'clause'"` → zero.
- [ ] **Gate (RELEASE):** deep-AST hold-or-improve vs floor; target recovery toward rust 125 / ts 72 / py 76. Byte-diff: clause keyword off the parent factory. cargo-verify. Commit.

### Task 4.2: Final review + finish branch
- [ ] Final `feature-dev:code-reviewer` over the whole branch diff (base = `master`).
- [ ] Update the master plan (`2026-05-26-compiler-simplification-master-plan.md` §φ2): PR-M-φ2 landed; record applyAutoGroups-on-TS/py activation + the deferred `sittirGrammar` single-entry cleanup as the next item.
- [ ] superpowers:finishing-a-development-branch → PR (`GITHUB_TOKEN= gh pr create`). Final native counts vs floor in the body.

---

## Acceptance criteria
1. `env -u SITTIR_NATIVE_DEBUG pnpm validate:native` exit 0, **no segfault**, deep `read-render-parseAstMatchPass` hold-or-improve vs floor (rust 111 / ts 69 / py 74); report finals.
2. `cargo check --workspace --features napi-bindings` passes.
3. `rg "no variant matched"` → zero; the `source='override'` runtime inference deleted from `validate/common.ts`.
4. `isTransparentWrapper`/`resolveThroughWrappers` is the single transparency primitive consumed by transform path-addressing, polymorph dispatch, and group classification.
5. Native validation process-isolation: a per-kind SIGSEGV reports the kind, not opaque exit 139.
6. `rg "'clause'"` in `packages/codegen/src` → zero; `ClauseRule`/`detectClause`/`emitClause` deleted.

## Out of scope / deferred
- `sittirGrammar(base, cfg)` single composition entry (kills the double-pass footgun + `__enrichedClauseGroups__` side-channel) — separate follow-up.
- The debug-build validation-runtime segfault (orthogonal infra defect; release is the gate).
- Surface-types cleanup; the 6 `[6133]` node-map.ts warnings.
