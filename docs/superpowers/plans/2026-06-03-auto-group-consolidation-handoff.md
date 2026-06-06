# Handoff — Consolidate auto-group synthesis into enrich + retire applyAutoGroups

**For a fresh session.** Branch `pr-m-phi2-enrich-clause-convergence` (PR **#61**, open, release-green at floor rust 111 / ts 69 / py 74). This handoff is the *next* increment after PR-M-φ2 (ClauseRule deletion) shipped.

---

## Goal (one sentence)

Make **enrich the single home for ALL auto-group synthesis** (`optional(seq)`, `repeat(seq)`, `repeat1(seq)`) and **retire `applyAutoGroups`** (`dsl/wire/auto-groups.ts`), so there is one synthesizer, one `_<parent>_optionalN`/`_repeatN` namespace, and one counter — reaching both the parser (`base.grammar.rules` injection) and the IR.

## Why (the duplication is now real — user confirmed 2026-06-03)

After PR-M-φ2, enrich already hoists `optional(seq(STRING,FIELD))` clauses, AND the composition-unify activated `applyAutoGroups` on all 3 grammars. The two synthesizers now **overlap** on `optional(seq)` and **collide**: they share the `_<parent>_optionalN` namespace with independent counters. This is the **Codex P2 review finding on #61** (enrich.ts:1489): a parent with *both* a clause-shaped and a non-clause `optional(seq)` → enrich emits `_<parent>_optional1` for the clause, applyAutoGroups starts ITS counter at 1 for the non-clause position and rewrites it to the same name; since the name already exists in `rulesBag`, auto-groups skips creating the correct body → the non-clause branch points at the clause body. Consolidation dissolves this.

Bonus: retiring `applyAutoGroups` removes the **`outRules`-only path** — the source of ~half this session's wire/IR-divergence pain (it writes to `outRules`, never `base.grammar.rules`, so its groups reach the parser but not the IR; enrich injects into `base.grammar.rules` and reaches both).

## THE KEY DESIGN CONSTRAINT (user, 2026-06-03) — declared groups merge with auto-gen'd groups

> "declared group application needs to be smart enough to simply update names / apply only the visible alias to auto gen'd groups."

- **auto-gen owns synthesis** — the group *body* + the hidden `_<parent>_optionalN` rule.
- **declared `groups:` owns naming/visibility** — when an authored `groups:` declaration corresponds to an already-auto-gen'd group, the application must NOT re-synthesize a second group (that IS the collision). It **finds the matching auto-gen'd group and applies only the visible alias** (promotes the hidden auto-gen'd group to a visible/named node, reusing its body).

This is what makes the **visible-group treatment DRY**: instead of hand-rewriting a rule (as `use_wildcard` does now — `626df447`), the author just declares "make `_<parent>_optionalN` visible as `<name>`," and the application aliases the existing auto-gen'd group. No second body, no name collision.

## The single-slot-vs-visible rule (governs WHEN a group must be visible)

(memory `project_hoisted_group_slot_visibility_rule`) — a hoisted group with a **single MANDATORY slot** inlines + gates by that slot (works today, e.g. abstract_type). An **optional-single-slot OR multi-slot** group must be **VISIBLE (not inlined)** — inlining loses group-presence (render dual-path surfaces the direct inner field; gating the unpopulated inline group slot regressed 111→79). The declared-alias mechanism above is how a group becomes visible.

---

## Implementation steps

1. **Generalize enrich's hoist** (`dsl/enrich.ts`, `applyClauseHoist` + the pass list ~line 236): currently fires only on `optional(seq)` with `some(isString) && some(isField)`. Extend to ALL `optional(seq)` / `repeat(seq)` / `repeat1(seq)` (subsuming applyAutoGroups's trigger). Reuse applyAutoGroups's `synthesizeGroupName` + `canonicalStringify` cross-parent dedupe (extract to a shared helper — DRY). Keep injecting into `base.grammar.rules` so it reaches parser+IR.
2. **Rework declared-`groups:` application** to **merge-by-match + apply-visible-alias** over auto-gen'd groups (the key constraint above). The body-pattern `groups:` path is in `dsl/wire/wire.ts` (`applyWirePatternReplacement`) — it must detect when its target is an existing auto-gen'd `_<parent>_optionalN` and just alias-to-visible, not synthesize.
3. **Retire `applyAutoGroups`**: delete `dsl/wire/auto-groups.ts` + its call site in `wire.ts` (~line 685) + the `collectAuthoredSynthesisKinds`/`syntheticInline` plumbing if now dead. Migrate any unique `auto-groups.test.ts` assertions to `enrich-clause-hoist.test.ts`.
4. **Re-verify the 3 #61 regression witnesses** (all corpus-blind today — gate held — but reviewer-confirmed real):
   - **jsx (`<Foo>` → `<>`):** root localized to hidden helper **`_jsx_start_opening_element`** (TS), restructured by `applyAutoGroups`-on-TS so the name gates on attribute presence. Check whether enrich's (more targeted) synthesis avoids the mis-hoist; if not, the name must NOT be gated on attribute — only the separating space is conditional. Witness: `packages/typescript/templates/jsx_opening_element.jinja` should render `<{name} {attrs}>` / `<{name}>`, never `<>`. Same for `jsx_self_closing_element`.
   - **except_clause (`except E:` → `except E as:`, python):** the `_except_clause_as` polymorph arm's `optional(seq('as', field('alias', $.expression)))` renders `as` ungated. It IS `optional(seq(STRING, base-FIELD))` so it *should* be enrich-hoistable, but isn't — suspect is the **choice-arm nesting + polymorph variant split** (`polymorphs: { except_clause: { '2/0/0':'as', '2/0/1':'list' } }` in `packages/python/overrides.ts:162`). Either make enrich's recurse reach the nested arm clause, or apply the visible-alias mechanism to it. Witness: `_except_clause_as.jinja` must gate `as` on alias presence.
   - **Codex collision:** dissolved by step 1+2 (single counter/namespace). Add a regression test: a parent with both a clause-shaped and a non-clause `optional(seq)`.
5. **Gate every step on RELEASE** (`env -u SITTIR_NATIVE_DEBUG pnpm validate:native`, deep `read-render-parseAstMatchPass` ≥ floor rust 111 / ts 69 / py 74). The jsx/except_clause fixes should *raise* shallow counts (they fix real render bugs). Debug build segfaults (unrelated napi/Node-v24 issue — see memory) — gate release only.

---

## Critical facts / gotchas (do not relitigate)

- **GATE ON RELEASE.** Debug `validate:native` SIGSEGVs from a Node-v24 + napi-rs `transport.rs` `JSON::stringify` issue (NOT engine.rs — the engine.rs transmute UB was already removed in `b4778bb5`). `env -u SITTIR_NATIVE_DEBUG` is unreliable alone — confirm `profile [optimized]` in the build log + the explicit exit line. See memory `project_debug_validation_segfault_gate_release`.
- **enrich runs BEFORE wire/`rules:`** — `grammar(enrich(base), wire(cfg))`. A `rules:` override is post-enrich and CLOBBERS an enrich-hoist (this is why use_wildcard needed a *visible-node* hand-rewrite, not a `rules:` redefinition). The consolidation's declared-alias mechanism must live where it can see the auto-gen'd groups (wire, post-enrich, reading the injected `base.grammar.rules`).
- **Composition is unified** (all 3 grammars: `const enrichedBase = enrich(base); grammar(enrichedBase, wire({…}, enrichedBase))`). The deferred `sittirGrammar(base, cfg)` single-entry cleanup (kills the double-pass footgun) is a separate follow-up.
- **Never stage** `rust/crates/sittir-*/test-fixtures.json` / `packages/validator/validation-history.jsonl`. **Stray-file DANGER:** the working tree had ~396 leaked compiled `.js`/`.d.ts` under `packages/codegen/src` (build leakage from a `@to-skills/cli` install) — deleted, but do NOT `git add` broad paths; commit by explicit pathspec. A validator hook auto-commits `chore(validator)` after gates — drop with `git reset --soft HEAD~1`.
- The `package.json`/`pnpm-lock.yaml` working-tree changes + `scripts/gen-cli-skill.mts` + `skills/` are the environmental `@to-skills/cli` install — not part of this work.

## Current branch state (key commits, newest→oldest)

`28026f06` --isolate robustness nit · `b4778bb5` engine.rs transmute→coords (release-green, debug still 139) · `78c3611e` **ClauseRule fully deleted** · `626df447` use_wildcard visible-group (hand-rewrite — replace with declared-alias mechanism) · `6976f7e6` detectClause deleted / ClauseRule deprecated · `d77e0d25` **enrich hoist-ordering fix** (the core) · `c20001ef`+`1b833cce` --isolate harness. Plus interleaved `chore(validator)` records (benign).

## Deferred (NOT this increment)

- **engine.rs perf** (Copilot #61): `NodeCoords` clones the path `Vec<u32>` per `read_child` (O(depth) alloc). Optional opt to `(parent_handle, child_index)` + parent-link walk. `b4778bb5` is correct + release-green; this is perf only.
- The Node-v24/napi debug-FFI `transport.rs` segfault (separate, larger).
- Optional wrapper-aware classification + runtime-variant-dispatch removal (no longer segfault-driven).
- PR-I-φ2 (count recovery to ≥125 + match_arm residual) and PR-P (terminal/enum) — separate PRs.
