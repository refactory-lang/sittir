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
**moves into `dsl/`** (design authority: the shared Rule-transform ops belong
with the DSL that defines the Rule types they operate on), NOT a new
`compiler/shared.ts`. This is
the axis the reorg rows realize: the de-scatter (R7) folds each scattered
phase-method file INTO its owning phase module — *consolidation toward the
phase module*, not redistribution into ad-hoc consumers. Two layers sit
OUTSIDE this axis: **emitters** keep the emitter-pattern-consistency
convention (R5's `render-module` split is emitter hygiene, orthogonal — not a
phase), and **`node-map` stays the model container** (the `NodeMap` class +
lookup surface; R6 migrates only its phase-ish *derivation* passes to the
owning phase module, leaving genuine model-build in `node-map`).

**Genuine tensions — flagged for user decision before the affected rows
start:**

1. **Phase modules will re-grow.** R7's fold pushes `simplify.ts` /
   `evaluate.ts` back toward whale size. The principle says
   one-module-per-phase wins over line-count aversion — confirm that
   ordering, or set a size threshold at which a phase adopts an internal
   section convention (still one file) instead of a second file.
2. **Construction-time passes with no named phase.** Some node-map
   internals (e.g., the factory-map build) run at `NodeMap` construction,
   after assemble — no existing phase module owns them. Default taken
   above: they stay in `node-map.ts` as part of the container. Alternatives
   if node-map stays whale-sized after R6: a dedicated `model-build.ts`
   phase module (Model #0 construction IS arguably a phase), or `dsl/`.
   User picks at R6 time.
3. **Helpers shared between a phase and an emitter.** Cross-phase shared ops
   live in `dsl/`; emitter-shared code has its own homes. A helper used by
   BOTH axes has no clean home — propose case-by-case at fold time,
   defaulting to `dsl/` with the emitter importing it.
4. **`dsl/` dependency direction (transforms move, tension 4).** The
   `transforms.ts` ops must not import from `compiler/` once they live in
   `dsl/` (that would make `dsl → compiler`, inverting the foundational
   direction). Extract any compiler-side dep (e.g. `rule-attrs`) the ops need
   into `dsl/` first, or keep that dep injected — resolve before the move.

| PR | Concern (1-liner) | Depends-on | Gate | Notes |
|----|-------------------|-----------|------|-------|
| **R0** | **Ratchet guard first**: `propose-14` conformance counter + committed baseline; pre-commit + CI fail on REGRESSION (count may only decrease) | — | counter self-test; zero behavior change | §3. Lands BEFORE any sweep so new code can't re-deviate while the sweep runs |
| **R1** | **#14 sweep: `node-map.ts`** (0/93). Step 1: mechanical classification (getter / method / dead) emitted by the R0 tool; Step 2: pure node-self reads → class getters (per #14's getter-vs-method line); cross-node fns → `(target, ctx)` with `nodeMap` in ctx | R0 | validate:native HOLD + tests + ratchet ↓ | Highest traffic; many of the 93 are getter candidates, so the (target,ctx) count to convert is realistically ~40-60 |
| **R2** | **#14 sweep: `evaluate.ts`** (0/66) + declare `EvaluateCtx` (extends the §7.7 pattern — the design's "`NormalizeCtx`, `SimplifyCtx`, `AssembleCtx`, …" ellipsis) folding the loose `rules` (31×) / `wordMatcher` args | R0 | same | evaluate is upstream of everything; converting it removes most of the loose-`rules` plumbing in one row |
| **R3** | **#14 sweep: `simplify.ts` (0/36) + `normalize.ts` finish (4/26) + `transforms.ts` (0/4)**; declare `SimplifyCtx` per §7.7; **moves `compiler/transforms.ts` → `dsl/`** (design authority — shared Rule-transform ops live with the DSL; resolve the name vs the existing `dsl/transform/` override module, and the tension-4 `dsl → compiler` direction first) and **completes PR-O M1's deferred 4** — with helpers on `(target, ctx)` the wrapper+helper clusters move into `dsl/` without the import cycle | R0; absorbs PR-O M1 remainder (flag to user: M1-remainder closes here, not as its own row) | same + regen byte-identical | §7.7 CW6 is binding: `inField`-style recursion-LOCAL traversal state stays an explicit third parameter — do NOT stuff per-node traversal state into ctx |
| **R4** | **#14 sweep: `link.ts` (1/60) + `assemble.ts` finish (1/31)**; `AssembleCtx` already declared — convert remaining call sites; fold `kindEntries` loose args | R1 (nodeMap getters land first — link/assemble consume them) | same | After R4 the ratchet baseline reaches ~0 for compiler/ |
| **R5** | **Split `render-module.ts` (4845)** along its existing seams: transport emission (AnyTransport + supertype/per-slot enums + leaf impls + VerbatimTransport) → `render-transport-emit.ts`; typed dispatch + per-kind render fns → `render-dispatch-emit.ts`; libRs/hash/template-copy assembly stays in `render-module.ts` as the thin assembler | — (independent of R1-R4) | regen **byte-identical** ×3 grammars + cargo check + validate:native HOLD | Pure file move of emitter internals; no signature changes (emitters excluded from #14) |
| **R6** | **Slim `node-map.ts` (3937) to the model container** (per the module-organization target): the `NodeMap` class + lookup surface stays; phase-ish *derivation* passes (slot registration walks, etc.) move to their OWNING phase module; construction-time model-build (factory-map build) stays in `node-map.ts` by default — see tension 2 | R1 (sweep first so moved fns move in their FINAL shape — avoids double-touch); tension 2 decided | validate:native HOLD + tests | Replaces the earlier `node-map-build.ts` sibling-split idea — destinations follow the phase axis, not a second node-map file |
| **R7** | **De-scatter into phase modules** (per the module-organization target): compiler/ files under ~150 lines fold INTO their owning **phase module**; genuinely cross-phase helpers → **`dsl/`** (where `transforms.ts` moves, R3); emitter small-files fold per the emitter convention. Inventory + ownership map emitted by the R0 tool; fold list reviewed before execution | R3 | validate:native HOLD + tests | Evidence-based: 19+15 candidate files; pass files that ARE a phase (e.g. `lift-separators.ts`) stay as the phase module |
| **R8** | **Dead-code removal** (repo-wide): R0's classifier already buckets `dead` functions — delete them, confirming **zero callers via `lsproxy textDocument references`** before each removal (the closed-subgraph method proven in #71's alias-override cleanup, −414 LOC: trace the dead subgraph → delete). R1–R4 also drop their own module's `dead` bucket inline as they sweep; R8 sweeps the remainder (emitters / dsl / grammar-shapes / scripts) | R0 (classifier) | validate:native HOLD + tests + `rg` shows zero refs to each removed symbol | byte-neutral (dead code has no callers by definition); LSP find-references is the gate — TS `noUnusedLocals` misses module-level dead functions, the exact blind spot that hid the alias-override island in #71 |
| **R9** | **Relocate `validate/` + `scripts/` out of codegen → `packages/tools`**: `packages/codegen/src/validate/**` (the corpus validators) and `packages/codegen/src/scripts/**` (dev/tool scripts) are developer **tooling**, not codegen — move them into `packages/tools/` (where `tools/src/validate/diff.ts` etc. already live) and re-point the CLI + `rt-breakdown`/`diff` imports. Moves via `lsproxy` (move-symbol / import-fixups). | independent of the #14 sweep; sequence **after R1–R4** so validate internals have settled (don't move churning files) | validate:native HOLD + full suite + `pnpm -r build` + **no new package import cycle** | **Dependency-direction risk to resolve IN-ROW:** `emitters/parity-fixtures.ts` calls `validateReadRenderParse` at codegen time, and `tools/src/validate/diff.ts` already imports codegen — a naive move makes `codegen → tools` on top of `tools → codegen` (a cycle). Resolve FIRST by extracting the validator core the fixture pass needs (or inverting fixture extraction so codegen doesn't call the validator), then move the rest; gate explicitly on no new cycle |
| **R10** | **Comment cleanup → glossary** (DRY for docs): prune excessive inline code comments across the pipeline; durable per-function design rationale **migrates to `docs/compiler-phase-glossary.md`** (the canonical home, gate item 6); inline comments keep only non-obvious *local* intent. Runs WITH the sweep — R1–R4 prune each method's comments as they're already touching it (content → glossary) — plus a final repo-wide pass for untouched modules | R1–R4 (touch-as-you-sweep); R0's per-function table targets the rest | validate:native HOLD + tests (comments are non-semantic → byte-neutral on generated output); migrated rationale present in the glossary | the glossary is the single source for per-function rationale (`feedback_compiler_glossary_first`); inline comments that duplicate it are noise — DRY applied to documentation, and it keeps the glossary (not scattered comments) the thing future readers/agents consult |

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
