# Handoff — PR-M φ2 (auto-group-visibility) merge-ready + what's next

**For a fresh session.** Branch `pr-m-phi2-enrich-clause-convergence`, HEAD `10f93bf0`, PR **#61** (pushed, CI running). Live-state memory: `project_content_alias_visible_group_state`. This doc is the single entry point.

## TL;DR
φ2 (the auto-group-visibility consolidation that PR #61's triage deferred to "the next increment") is **landed and merge-ready at floor**. RELEASE deep-AST gate: **rust 111 / ts 69 / py 74**. One tracked follow-up remains (A1, the `visibility_modifier` witness), which is slotted into the next phase (`pr-m-rule-ir-cut`), not φ2.

## The gate (read before measuring anything)
- `env -u SITTIR_NATIVE_DEBUG pnpm validate:native` → confirm `Finished \`release\` profile [optimized]` ×3 + read the DEEP `read-render-parseAstMatchPass=` lines. **Floor: rust 111 / ts 69 / py 74.**
- **RELEASE only.** The DEBUG napi `.node` build SIGSEGVs at validation runtime (Node v24/napi) — NOT a regression. `validate counts` alone reuses a stale `.node`.
- Manifest **no longer tracks `test-fixtures.json`** (fixed this session, `10f93bf0`) — so `probe-kind` / `validate:native` / the pre-commit hook pass on a clean tree without `--no-verify`. `test-fixtures.json` is still git-tracked but derived; never stage it.
- Commit discipline: explicit pathspec; **never** stage `rust/crates/sittir-*/test-fixtures.json` or `packages/validator/validation-history.jsonl`; no broad `git add`; commit messages end `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## Commit ledger (this branch, the φ2 work)
- `78ea43eb` — **visible-group mechanism.** Inline-unsafe co-optional groups mint as one clean visible CST kind via `alias($._name, $.name)` (a symbol-ref alias to a hidden `_<parent>_group<N>` rule). **tree-sitter mints the kindId** from the alias; **`link` coerces** the (nested) aliased kind to a top-level `rules` entry (`mintContentAliasKinds`, resolving through the symbol to the hidden body). NEVER alias a multi-member seq directly — tree-sitter distributes the alias across members. `sittir-review`: ship.
- `51b0347d` — **deleted `applyAutoGroups`** (enrich is the sole group synthesizer; `auto-groups.ts` + wire plumbing gone; `syntheticInline` kept) + **DRY cleanup** (`group-classify.ts`: `isSeparatedList` subsumed by `seqHasTopLevelRepeat`, removed). `sittir-review`: ship.
- `c148d98f` — **A2: `enum_body` / the ts −1 (68→69).** `pickConditionalKey` (`templates.ts`) gained a `choice` case so inlined optional groups gate on the populated field (`name`), not the unpopulated group slot. Also fixed **JSX** (`<div>`/`<Foo>` no longer drop the tag name — gate keys on `name`, not `attribute`).
- `d65764e2` — **`engine.rs` `NodeCoords` perf** (Copilot review): per-`read_child` O(depth) `Vec` clone → `Copy` `(parent, child_index)` back-link (O(1), zero-alloc), byte-identical resolution, no `unsafe`/transmute reintroduced (preserves the `b4778bb5` UB-fix invariant: re-resolve, never cache a lifetime-erased `Node`).
- `10f93bf0` — **manifest stops tracking `test-fixtures.json`** (`generated-manifest.ts:collectFiles` excludes it — write + verify both via that one fn). Dissolves the recurring `project_native_fixtures_regen_gap` drift.
- Plus doc commits (`b64f5b54`, `29b0cec5`) and a benign `chore(validator)` auto-commit.

PR #61 has a comment (issuecomment-4622455312) recording all of the above and the triage-bug resolutions: JSX ✅, name-collision ✅ (dissolved with `applyAutoGroups`), `except_clause` ✅, `engine.rs` clone ✅.

## To actually merge φ2
1. Confirm **CI green** on PR #61 (`gh pr checks 61`).
2. Merge (user-authorized action). The final `sittir-review` already says ship; gate's at floor; nothing regresses.
3. A1 (below) is a tracked follow-up, NOT a merge-blocker — `visibility_modifier` never AST-matched before this work either (FR-011 exception).

## A1 — the one remaining φ2 witness (do this in the rule-IR-cut phase)
`visibility_modifier` renders **`pub ()`** for `pub(crate)` / `pub(in crate::foo)`.

**Diagnosis (high confidence — NOT polymorph registration):** the choice IS already correctly distributed into 4 slots — `visibility_modifier_group1` is a `branch` (not a polymorph) with `self/super/crate/path` slots; transport + `node-model.json5` carry all four. The bug is purely the **template walker** (`emitChoice`, `templates.ts:~1602`): the choice-root slot id is never registered (`assemble.ts:289-292` registers per-ARM ids only), so it falls to the **first-arm fallback** (`:1634-1638`) and emits only `self` → `pub ()`.

**The naive fix is WRONG (attempted + reverted, no commit):** routing structural choices to all-arms-concat (the `__synthetic_exclusive_choice__` path) via a shared `isStructuralChoice` regresses — concatenation re-emits *shared* slots once per arm (no `mergeChoiceArms` on the template side), so `binary_expression` exploded to `{{left}} {{operator}}` ×24 (ts 68→67); and seq-arm literals emit ungated (`in` from `in_path=seq('in',path)` leaked → `pub (cratein crate)`).

**Correct fix:** **per-arm-guarded** emission — each arm wrapped in its own presence guard with its literals *inside* the guard — restricted to genuinely mutually-exclusive DISTRIBUTED structural choices (not a blanket `isStructuralChoice` route). Also investigate the slot-model smell: `pub(crate)` populates BOTH `_crate:true` AND `_path:"crate"` (double-population). **This is diagnosis-adjacent → `sittir-research` or do it yourself, NOT `sittir-codegen`** (codegen does mechanical/specified work; it correctly BLOCKED on the naive fix). It shares the choice-arms-as-forms shape with the rule-IR-cut's `discriminatingSlot`/`AssembledBranch`, so solve it there.

## Next phase — `pr-m-rule-ir-cut` (the bulk of PR-M)
Plan: `docs/superpowers/plans/2026-05-31-pr-m-rule-ir-cut.md`. Goal: cut the sittir-invented Rule-IR types (`PolymorphRule`/`VariantRule`/`ClauseRule`/GroupRule-classifier) + collapse `AssembledPolymorph → AssembledBranch` with a `discriminatingSlot` whose choice-slot arms ARE its former forms. **`M ≺ I` is a HARD GATE** — PR-M is the byte-neutral model restructure; the emitter rewrite that consumes the new shape is PR-I, separate.

- **Entry = Task 0 (BLOCKING empirical inventory):** dump `{grammar, kind, formIndex, fieldCount}` for every polymorph. **All `fieldCount === 1` ⇒ the byte-neutral `forms`-getter seam is sound, proceed. Any `fieldCount > 1` ⇒ a fused multi-field form** the derived getter would drop → STOP / re-scope (elevate to a wire group kind, or carve that kind out). Read-only — a clean `sittir-research` job. Do NOT start Task 2 until answered.
- **A1 folds in here** (same arms-as-forms shape).
- **Build on this session's engine change:** the native read path is now `(parent, child_index)` coordinate re-resolution (`d65764e2`), not the old Vec-path.

## Agent roles (this repo)
- `sittir-codegen` — mechanical/specified codegen changes; edits `packages/codegen/src/**` or `packages/<lang>/overrides.ts` only; regen + gate discipline baked in. **NOT for open-ended diagnosis** — it correctly reports BLOCKED instead of improvising.
- `sittir-research` — read-only root-cause diagnosis; pinpoints a fix location. Use BEFORE a codegen fix when the mechanism isn't already specified.
- `sittir-review` — read-only audit of a committed diff; DRY/design/gate/hygiene + verdict.
- Hand-written native (`rust/crates/sittir-core/src/**`, e.g. `engine.rs`) is editable directly / by a general-purpose agent — it's NOT a generated crate (those are `sittir-{rust,typescript,python}/src/**`).
