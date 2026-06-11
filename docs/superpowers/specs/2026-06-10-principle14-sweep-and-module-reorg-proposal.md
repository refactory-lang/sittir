# Principle #14 Sweep + Module Reorg — Proposal (execution rows for review)

> **Status: PROPOSAL — not authorized for implementation.** Companion to the
> compiler-simplification design (`2026-05-22-compiler-simplification-design.md`,
> §7.7 + Principle #14) and the master plan
> (`2026-05-26-compiler-simplification-master-plan.md`). This doc proposes the
> follow-on wave that the design already specifies but PR-H never executed:
> the repo-wide `<operation><ObjectType>(target, ctx)` sweep, the module
> consolidation, and the guard that keeps both from re-deviating. It invents
> NO new conventions — every rule referenced below already exists in §7.7 /
> emitter-pattern-consistency / the master-plan execution rules.

---

## 1. The gap, verified (2026-06-10, `origin/master` @ 8c58bc8f)

**(A) #14 adoption is ~2%.** PR-H (#54) landed `TransformCtx` /
`NormalizeCtx` (+`AssembleCtx` in assemble.ts) and renamed the phase files,
but the call-site sweep never happened:

| module | fns taking a `*Ctx` / total fns | note |
|---|---|---|
| `compiler/node-map.ts` | **0 / 93** | the model container — highest-traffic module |
| `compiler/evaluate.ts` | **0 / 66** | |
| `compiler/link.ts` | **1 / 60** | |
| `compiler/simplify.ts` | **0 / 36** | `SimplifyCtx` isn't even declared yet (§7.7 specifies it) |
| `compiler/assemble.ts` | **1 / 31** | `AssembleCtx` declared, one consumer |
| `compiler/normalize.ts` | **4 / 26** | the PR-H beachhead |
| `compiler/transforms.ts` | 0 / 4 | the 4 ops de-scattered by PR-O M1 take `(rule, rules, …)` loose args |

The recurring loose argument is exactly what `TransformCtx` absorbs: `rules`
appears as a loose parameter in **31** compiler function signatures (plus
`nodeMap` ×3, `kindEntries` ×2, `seen`/`visited`/`depth` traversal state).
Lead's independent count: ~41 fns with 3+ loose params. Root cause of the
drift: **PR-H's gate proved the new path compiles but never required old
call sites to convert, and nothing fails when a new fn is added in the old
shape.** (§3 fixes that first.)

**(B) Module shape.** Whales: `emitters/render-module.ts` 4845,
`compiler/node-map.ts` 3937, `compiler/evaluate.ts` 2474, `compiler/link.ts`
2310, `emitters/from.ts` 2263, `emitters/factories.ts` 2070,
`emitters/templates.ts` 1871. Scatter: compiler/ 43 files (19 under 150
lines), emitters/ 35 files (15 under 150 lines), dsl/ 11, grammar-shapes/ 6.
PR-O M1 de-scattered 4 of 8 shared ops into `transforms.ts` and **deferred 4
on a real cycle hazard** (`collapseSeq`/`inlineRefs`/`canonicalizeSeqOfLeaves`/
`deleteWrapper` are thin wrappers over private recursive helpers that would
drag `transforms.ts → simplify.ts` imports). The sweep dissolves that hazard
(§2, row R3): once the recursive helpers take `(target, ctx)` they no longer
close over module-local state, so helper clusters move WITH their wrappers.

**Explicit scope exclusion:** emitters do NOT take phase ctxs. The emitter
convention is separate and already enforced by review
(`feedback_emitter_pattern_consistency`: iterate `nodeMap.nodes`, dispatch on
`modelType`, own ALL string generation). The #14 sweep is the COMPILER
pipeline (normalize/simplify/evaluate/link/assemble/node-map). Emitters
appear only in the module-reorg rows.

---

## 2. Proposed PR rows (master-plan format)

Execution rules: identical to the master plan — branch off `origin/master`;
gate **`pnpm validate:native` HOLD for all 3 grammars** (pure refactor —
counts MUST hold exactly, deep `read-render-parsePass`/AST quoted); full test
suite; **renames + cross-module moves go through `lsproxy`** (`textDocument
rename` / move-symbol), not text edits, so call-sites update mechanically
(`feedback_use_ts_lsp_for_moves`); rows touching `emitters/render-module.ts`
additionally gate on **regen byte-identical** (the PR-O M1 gate) + an
independent `cargo check --workspace --features napi-bindings`.

**Module-organization target (design authority, 2026-06-10).** The compiler
pipeline organizes as **one module per phase** — `evaluate` / `link` /
`normalize` / `simplify` / `assemble`, each owning that phase's methods — with
**methods reused across phases live in `dsl/`** — `compiler/transforms.ts`
**moves into `dsl/`** (clean once **R11** extracts the shared IR types to
`codegen/src/types/`; transforms then imports `types/`, not `compiler/`, so the
move introduces no `dsl → compiler` cycle), NOT a new `compiler/shared.ts`.
This is
the axis the reorg rows realize: the de-scatter (R7) folds each scattered
phase-method file INTO its owning phase module — *consolidation toward the
phase module*, not redistribution into ad-hoc consumers. Two layers sit
OUTSIDE this axis: **emitters** keep the emitter-pattern-consistency
convention (R5's `render-module` split is emitter hygiene, orthogonal — not a
phase), and **`node-map` is the model layer, not a phase** — R6 moves it (the
`NodeMap` class + lookup surface + construction) into a **`compiler/model/`**
folder (decision 2); R6 migrates only its phase-ish *derivation* passes out to
the owning phase module.

**Decisions (resolved 2026-06-11 with the design authority):**

1. **Phase-module size — one file + internal sections.** One-module-per-phase
   wins over line-count aversion; a large phase (`simplify`/`evaluate` after
   R7's fold) organizes with an **internal section convention** (banners /
   regions), **never a second file**. Size is managed by structure, not splitting.
2. **Model-build home — a `compiler/model/` folder.** The construction-time
   passes (run at `NodeMap` construction, after assemble) build **Model #0**,
   so they live in `compiler/model/` holding the container (`node-map.ts`) +
   construction (`model-build.ts`) + derivation passes. **NOT** `metadata/`
   (that names the serialized OUTPUT — `node-model.json5` — a separate emitter
   concern). ⚠ **`factory-map` is DEPRECATED** (PR-K φ2 absorbs it into
   node-model), so its build inside `model/` is **transitional** — do not
   enshrine factory-map as a permanent `model/` fixture; it dissolves as PR-K φ2
   lands.
3. **Phase+emitter shared helpers — case-by-case at fold time.** No blanket
   rule; decide each helper's home when R7 folds it (default: extract just the
   shared piece → `dsl/` or `codegen/src/types/`, the emitter imports it — don't
   move a whole phase to satisfy an emitter).
4. **`dsl/` dependency direction — RESOLVED via R11 (decided 2026-06-11).**
   `transforms.ts` imports the Rule IR from `compiler/` (`rule-types`, `rule`,
   Rule-level `diagnostics`), so a bare move would make `dsl → compiler`.
   **R11 extracts those IR types + `dsl/runtime-shapes` into `codegen/src/types/`**
   (a foundational layer both `dsl` and `compiler` import down into), turning
   today's `dsl ⇄ compiler` tangle — which already leaks via `runtime-shapes` ×1
   and `enrich` ×2 — into a clean `dsl → types ← compiler` DAG. R3 and R9's
   cycle-fixes therefore depend on R11; the remaining open tensions are 1–3.

| PR | Concern (1-liner) | Depends-on | Gate | Notes |
|----|-------------------|-----------|------|-------|
| **R0** | **Ratchet guard first**: `propose-14` conformance counter + committed baseline; pre-commit + CI fail on REGRESSION (count may only decrease) | — | counter self-test; zero behavior change | §3. Lands BEFORE any sweep so new code can't re-deviate while the sweep runs |
| **R1** | **#14 sweep: `node-map.ts`** (real conversion surface **~22, not 93** — task #8: 129/158 fns are already getter-shaped). Step 1: mechanical classification (getter / method / dead) emitted by the R0 tool; Step 2: pure node-self reads → class getters (per #14's getter-vs-method line); cross-node fns → `(target, ctx)` with `nodeMap` in ctx | R0 | validate:native HOLD + tests + ratchet ↓ | **Downgraded to S–M** by the task-#8 count (~22 conversions, not ~93); the real sweep mass is R2 `evaluate` 36 / R4 `link` 35 + `assemble` 21 |
| **R2** | **#14 sweep: `evaluate.ts`** (0/66) + declare `EvaluateCtx` (extends the §7.7 pattern — the design's "`NormalizeCtx`, `SimplifyCtx`, `AssembleCtx`, …" ellipsis) folding the loose `rules` (31×) / `wordMatcher` args | R0 | same | evaluate is upstream of everything; converting it removes most of the loose-`rules` plumbing in one row |
| **R3** | **#14 sweep: `simplify.ts` (0/36) + `normalize.ts` finish (4/26) + `transforms.ts` (0/4)**; declare `SimplifyCtx` per §7.7; **moves `compiler/transforms.ts` → `dsl/`** (clean AFTER **R11** extracts the IR types to `codegen/src/types/` — transforms then imports `types/`, not `compiler/`; resolve the name vs the existing `dsl/transform/` override module) and **completes PR-O M1's deferred 4** — with helpers on `(target, ctx)` the wrapper+helper clusters move into `dsl/` without the import cycle | R0, **R11**; absorbs PR-O M1 remainder (flag to user: M1-remainder closes here, not as its own row) | same + regen byte-identical | §7.7 CW6 is binding: `inField`-style recursion-LOCAL traversal state stays an explicit third parameter — do NOT stuff per-node traversal state into ctx |
| **R4** | **#14 sweep: `link.ts` (1/60) + `assemble.ts` finish (1/31)**; `AssembleCtx` already declared — convert remaining call sites; fold `kindEntries` loose args | R1 (nodeMap getters land first — link/assemble consume them) | same | After R4 the ratchet baseline reaches ~0 for compiler/ |
| **R5** | **Split `render-module.ts` (4845)** along its seams: transport emission (AnyTransport + supertype/per-slot enums + leaf impls + VerbatimTransport) → `render-transport-emit.ts`; the libRs/hash/template-copy assembly stays as the thin assembler. **⚠ The typed-dispatch + per-kind render path is believed DEPRECATED** (same class as the sunset `bridge.rs`, PR-E2) — but **R5 MUST VERIFY this first, not assume it**: reachability check — is it emitted into the shipped engine / reached by production render, or only `@deprecated` / test-only? **If confirmed dead → DELETE it** (do NOT preserve it as a permanent `render-dispatch-emit.ts`); **if actually live → split it out** as originally planned. | — (independent of R1-R4) | regen **byte-identical** ×3 grammars + cargo check + validate:native HOLD | emitter file split, no signature changes (emitters excluded from #14); the dispatch-path verdict decides whether R5 is a 2-way split or a transport-extract + dead-path delete |
| **R6** | **`node-map.ts` → `compiler/model/`** (decision 2): a `compiler/model/` folder holds the `NodeMap` container (`node-map.ts`) + construction (`model-build.ts`) + derivation passes. Phase-ish *derivation* passes that belong to a pipeline phase move to that phase module instead. (factory-map build is **transitional** — deprecated by PR-K φ2, dissolves into node-model.) | R1 (sweep first so moved fns move in their FINAL shape); decision 2 | validate:native HOLD + tests | Destinations: model layer → `compiler/model/`; phase-derivations → their phase module — not a second node-map sibling file |
| **R7** | **De-scatter into phase modules** (per the module-organization target): compiler/ files under ~150 lines fold INTO their owning **phase module**; genuinely cross-phase helpers → **`dsl/`** (where `transforms.ts` moves, R3); emitter small-files fold per the emitter convention. Inventory + ownership map emitted by the R0 tool; fold list reviewed before execution | R3 | validate:native HOLD + tests | Evidence-based: 19+15 candidate files; pass files that ARE a phase (e.g. `lift-separators.ts`) stay as the phase module |
| **R8** | **Dead-code removal** (repo-wide): R0's classifier already buckets `dead` functions — delete them, confirming **zero callers via `lsproxy textDocument references`** before each removal (the closed-subgraph method proven in #71's alias-override cleanup, −414 LOC: trace the dead subgraph → delete). R1–R4 also drop their own module's `dead` bucket inline as they sweep; R8 sweeps the remainder. **Task-#8 targets:** 16 truly-dead fns (incl. a closed family of 6 unused type guards in `rule.ts` + legacy `emitFrom`), the `emitFrom`/`emitWrap` superseded pre-class subgraph (`emitWrap` = 20 test refs, 0 production callers — tests of a dead path), ~70 dead type exports, 180 un-export candidates | R0 (classifier) | validate:native HOLD + tests + **`lsproxy textDocument references` RE-VERIFY per candidate** | byte-neutral (dead code has no callers); **CAVEAT (task #8): its zero-caller list is tokenization-based, NOT LSP-confirmed — the lsproxy daemon failed its positive control, so R8 MUST independently re-verify each deletion with the working invocation (`--no-proxy --server "typescript-language-server --stdio"`)**; TS `noUnusedLocals` misses module-level dead fns (the #71 blind spot) |
| **R9** | **Relocate the TOOL parts of `validate/` + `scripts/` → `packages/tools`** (PARTIAL — codegen-run infrastructure STAYS): the corpus **validator logic** and the **genuine dev scripts** move; but **codegen-run infrastructure stays in codegen** — `validate/common.ts`'s parser/engine loading (`loadWebTreeSitter`, used by `generated-metadata`/`compile-parser`) and `scripts/{generated-manifest,emit-diff,native-binary-freshness}` (the manifest stamp IS part of the codegen run — moving it makes the stamp the cycle). So R9 **splits `validate/common.ts`** (loader stays, validator logic moves) and **partitions `scripts/`** (run-infra stays, dev tools move). Re-point `ci.yml`'s 5 script invocations (lines 112/116/190/194/247) + the CLI / `rt-breakdown` / `diff` imports. Moves via `lsproxy`. | after R1–R4 (validate internals settled); **R11** (so the moved validator imports `types/`, not codegen) | validate:native HOLD + full suite + `pnpm -r build` + **no new package cycle** | 7 real `codegen-core → validate\|scripts` edges inventoried (run-codegen→validate/renderable + scripts/generated-manifest + scripts/emit-diff; parity-fixtures→validate/read-render-parse; generated-metadata + compile-parser→validate/common loader; types + grammar→validate/node-types-loader) — the split + partition keeps each on its correct side. **PLUS 3 DYNAMIC `import()` edges** invisible to static-graph tools (`run-codegen→parity-fixtures`, `read-render-parse→collect-baseline`, `common→generated-manifest`) — R9 must handle these explicitly. Note `parity-fixtures.ts` has **ZERO static importers** (dynamically invoked — don't let R8 misclassify it as dead). R0's `propose-14` tool is **birthed in `packages/tools`** so R9 doesn't relocate what it just placed |
| **R10** | **Comment cleanup → glossary** (DRY for docs): prune excessive inline code comments across the pipeline; durable per-function design rationale **migrates to `docs/compiler-phase-glossary.md`** (the canonical home, gate item 6); inline comments keep only non-obvious *local* intent. **Scope: TS-side comments only** — comments INSIDE emitter template literals are generated OUTPUT (emitted Rust `//` in `transport.rs` etc.), out of scope. Runs WITH the sweep — R1–R4 prune each method's comments as they're already touching it (content → glossary) — plus a final repo-wide pass for untouched modules | R1–R4 (touch-as-you-sweep); R0's per-function table targets the rest | validate:native HOLD + tests (TS comments are non-semantic); **any prune touching `emitters/` additionally gates regen byte-identical** (template-literal comments are emitted content); migrated rationale present in the glossary | the glossary is the single source for per-function rationale (`feedback_compiler_glossary_first`); inline comments that duplicate it are noise — DRY applied to documentation, and it keeps the glossary (not scattered comments) the thing future readers/agents consult |
| **R11** | **Extract shared IR types → `codegen/src/types/` + DRY-dedupe** (foundational — **lands before R3/R9**): move `compiler/rule-types.ts` + `compiler/rule.ts` + the Rule-level `diagnostics` types + `dsl/runtime-shapes.ts` into a new `packages/codegen/src/types/` module that BOTH `dsl/` and `compiler/` import down into → today's `dsl ⇄ compiler` tangle (it already leaks via `runtime-shapes` ×1 / `enrich` ×2) becomes a clean `dsl → types ← compiler` DAG. **NOT** `packages/types` (that's the generated OUTPUT surface — a different audience). DRY-dedupe scattered / near-duplicate type defs as they move — **scope from the task-#8 inventory's duplication findings**, not guessed. Moves via `lsproxy`. | — (foundational) | validate:native HOLD + `pnpm -r build` + **no import cycle** (the DAG IS the gate) + full suite | the cycle risk in R3 (transforms→dsl), R9 (validate→tools), and the `dsl→compiler` leaks all trace to IR types living in the wrong layer — fixing the type layer ONCE collapses three "resolve-in-row" caveats into "they import `types/` now". DRY at the architecture level (DRY is the #1 rule). **Residual (task #8):** R11 erases the 8 dsl→compiler TYPE imports, but the ONE VALUE import — `enrich.ts` importing `sym` from `compiler/evaluate.ts` (a runtime dep on a phase module) — is NOT closed by type extraction; move `sym` into `types/` if foundational, else invert, as part of R11 |

**NOT proposed:** splitting `evaluate.ts`/`link.ts`/`from.ts`/`factories.ts`.
evaluate/link are mid-strangler (PR-N, PR-S, PR-L still pending against
them — splitting now creates rebase churn for in-flight rows); from/factories
are single-emitter files that the emitter convention wants cohesive. Revisit
after PR-L closes the strangler.

**Collision notes for sequencing:** R3 absorbs the PR-O M1 remainder
(explicitly flagged — user decides whether M1 stays a separate master-plan
row). PR-N (enrich-widening) and PR-S (separator-canonical; its render half
is PR-T, per #73) touch evaluate/normalize — R2/R3 should land either
before PR-N/PR-S start or after they merge, not interleaved; suggest the
master plan owner picks the slot when scheduling.

---

## 3. The guard (R0) — why the drift happened and how it becomes impossible

Root cause: PR-H introduced the convention as an ADDITIVE path. Nothing
distinguishes "not yet swept" from "newly written in the old shape", so the
sweep debt silently grows. The fix is the repo's existing ratchet idiom
(committed baseline + verifier that fails on increase — same shape as the
manifest verifier wired into pre-commit):

- **`packages/codegen/src/scripts/propose-14.ts`** — walks the six compiler
  pipeline modules, classifies every exported+private function:
  `conforming` (`(target, ctx: *Ctx)` or `(target, ctx, <recursion-local>)`
  per CW6), `getter-candidate` (single param, pure node-self read),
  `dead` (no in-repo references outside its own tests — feeds R8; the
  classifier FLAGS, `lsproxy textDocument references` CONFIRMS zero callers
  before any deletion), `non-conforming` (anything else). Emits: (a) a
  count per module, (b) the
  classification table (drives R1-R4's mechanical step + R8's delete
  list), (c) exit non-zero
  when any module's `non-conforming` count EXCEEDS the committed baseline
  (`packages/codegen/.principle14-baseline.json`).
- **Wiring:** pre-commit (next to `verify-manifests-cli.ts`) + the CI Build
  job. Each sweep row lowers its module's baseline number in the same PR —
  the ratchet only goes down.
- **Name/diagnostic style:** `propose-14` mirrors the existing `propose-*`
  diagnostic family (slot-grouping's `propose-promotion`, PR-L's
  `propose-*` flips) — a REPORTING tool whose findings convert to hard
  failures only via the ratchet, never a heuristic that drives behavior
  (`feedback_metadata_not_behavior`).
- **Out of scope for the guard:** lint-rule enforcement of the
  `<operation><ObjectType>` NAME half. Naming needs semantic judgment
  (operation vocabulary); the ratchet covers the signature half, review
  covers naming, and the classification table makes naming drift visible.

---

## 4. Gate summary (applies to every row)

1. `SITTIR_NATIVE_DEBUG=0 pnpm validate:native` — all 3 grammars; deep
   `read-render-parsePass` + AST-match MUST equal the pre-PR baseline
   exactly (pure refactor; any delta = stop and diagnose).
2. Full test suite (`pnpm test`); tsgo error count must not increase over
   the carried baseline.
3. Rows touching `emitters/render-module.ts` (R5) or the
   `transforms.ts` → `dsl/` move (R3): regen byte-identical across all 3
   grammars + independent
   `cargo check --workspace --features napi-bindings`.
4. R0's ratchet: every row decreases the baseline it touches; CI fails on
   any increase, anywhere, from R0's landing onward.
5. Every rename/move executes via `lsproxy` (rename / move-symbol); every
   R8 deletion is preceded by an `lsproxy textDocument references` check
   returning zero callers (plus the `rg` zero-refs spot-check in the row
   gate).
6. **Glossary sync + comment migration:** any row that moves / renames /
   relocates a method updates `docs/compiler-phase-glossary.md` in the SAME
   PR, AND prunes that method's excessive inline comments — durable rationale
   migrates INTO the glossary entry, not duplicated inline (R10). The glossary
   is the canonical per-function reference (`feedback_compiler_glossary_first`);
   a moved/renamed function with a stale/missing glossary entry, or with
   rationale still trapped in pruned-worthy comments, fails review. Applies to
   R1–R10 (the whole sweep + reorg + relocation + comment cleanup).

## 5. Verification appendix (how the §1 numbers were produced)

Counts measured at `8c58bc8f` with
`rg -c "^(export )?(async )?function …"` per module vs the same pattern
constrained to `ctx: \w*Ctx` parameters; loose-arg recurrence via
`rg -o "function \w+\([^)]*\b(rules|nodeMap|kindEntries|seen|visited|depth)\b"`.
The R0 tool replaces these regex approximations with AST-level
classification (ast-grep), which is also what makes the getter-vs-method
split in R1 mechanical instead of judgment-per-function.
