# Handoff — Chunk 2 content-alias visible groups (one fix from done)

**For a fresh session.** Branch `pr-m-phi2-enrich-clause-convergence`. This finishes **Chunk 2** of the auto-group-visibility consolidation. Spec/plan: `docs/superpowers/specs/2026-06-03-auto-group-visibility-design.md`, `docs/superpowers/plans/2026-06-03-auto-group-visibility.md`. Live state memory: `project_content_alias_visible_group_state` (+ `project_hoisted_group_slot_visibility_rule`, `project_1a_coupled_to_visible_groups`).

## Goal (one line)
Retire `applyAutoGroups`; enrich is the single group synthesizer. Inline-unsafe **co-optional** groups (e.g. rust `visibility_modifier` = bare `choice`) become **visible CST kinds** via `alias(content, $.name)` (spike-proven: tree-sitter mints a real kindId in `parser.c`); the link pass registers the IR kind. Inline-safe bodies (clauses, lists) stay flat.

## Floor (the gate — RELEASE ONLY)
`env -u SITTIR_NATIVE_DEBUG pnpm validate:native` → confirm `Finished release profile [optimized]` ×3 + read deep `read-render-parseAstMatchPass=` lines. **Floor: rust 111 / ts 69 / py 74.** The DEBUG napi build SIGSEGVs at validation runtime (Node-v24/napi) — NOT a regression; gate on RELEASE only. `validate counts` alone reuses a stale `.node` — don't trust it.

## Committed (safe) on the branch
- `e4eec346` Chunk 1: `dsl/group-classify.ts` (`isInlineSafe`/`ruleMatchesEmpty`) + enrich hoists inline-safe `optional(seq)` → hidden symbol. Floor held.
- `d1906326` agent rule: **sittir-codegen must follow the prescribed mechanism + STOP at blockers; never substitute a mechanism to pass counts** (added after an agent silently swapped content-alias for symbol-hoist and shipped a broken witness — that rule has paid off repeatedly since).
- `85b8b267` two design-fix prereqs: (1) `isInlineSafe` treats a **separated/comma list** (`E, repeat(seq(SEP,E)), optional(SEP)?`) as one flat slot → inline-safe (aliasing a repeat-bearing seq makes tree-sitter DISTRIBUTE the alias per-element); (2) `transform-path.ts` makes enrich content-aliases (`metadata.source:'enrich'`) **transparent to authored path-patches** (`isEnrichContentAlias`/`descendThroughEnrichContentAlias`, mirrors the SYMBOL travel-through) so visibility's `1/1/0/1/3` doesn't die on `descendThroughAlias`'s index-0 limit.

## UNCOMMITTED working-tree state (7 source files — KEEP, build on it)
The mechanism + Fixes 1 & 2 + a test, all uncommitted (generated restored to `85b8b267`, nothing staged):
- `packages/codegen/src/dsl/enrich.ts` — `makeContentAlias` (`{type:detectCase()?'ALIAS':'alias', content, named:true, value, metadata:{source:'enrich'}}`) + `visibleGroupSynthName` (**non-`_` name** `<parent>_group<N>`, per-parent counter, cross-parent dedupe); `applyClauseHoist` inline-unsafe branch emits it. `peelSeqWrapper`/`rebuildSeqWrapper` extend hoisting to optional/repeat/repeat1.
- `packages/codegen/src/compiler/link.ts` — `mintContentAliasKinds` (after the resolveRule loop): for `alias(non-symbol content, $.value)` tagged `metadata.source:'enrich'`, register `rules[value]=resolveRule(content)`; + `resolveRule` `case 'alias'` enrich branch. Both guard `content.type !== 'symbol'`.
- `packages/codegen/src/compiler/evaluate.ts` — **Fix 1** (~953-965): `rewriteInlineAliases` `case 'alias'` early-guard `if (aliasMeta?.source === 'enrich') return { ...rule, content: recurse(rule.content) }` BEFORE the synthesis logic (uses the `(rule as unknown as {metadata?:{source?:string}}).metadata` cast — RuleBase has no typed `metadata`).
- `packages/codegen/src/dsl/group-classify.ts` — **Fix 2** (~223-231): bare `repeat`/`repeat1` body → `isInlineSafe` returns true (via `isRepeatLike`) before the `!isSeqType` bail.
- `packages/codegen/src/dsl/wire/wire.ts` — `applyAutoGroups` call (~701) commented out.
- `packages/codegen/src/dsl/transform/transform-path.ts` — `isEnrichGroupLiftSymbol` type-guarded on `symbol`/`SYMBOL` (so content-aliases, which share `metadata.source==='enrich'`, don't match the symbol dispatch).
- `packages/codegen/src/compiler/__tests__/link-content-alias.test.ts` — new TDD test.

Unit tests PASS (group-classify + link-content-alias). **Fix 1 VERIFIED** via `probe-stages`: `visibility_modifier_group1` mints under a non-`_` name, `modelType:branch`, **slot populated** (self/super/crate/visibility_modifier_in_path).

## THE REMAINING WORK — Fix 3 (multiplicity push-down) — the ONLY blocker
`cargo check --workspace --features napi-bindings` fails with **exactly 2 jsx errors**:
```
error[E0277]: the trait bound `Vec<_JsxAttributeTransport>: RenderableTransport` is not satisfied
  rust/crates/sittir-typescript/src/render/transport.rs (render_jsx_opening_element / render_jsx_self_closing_element)
```
**Root cause:** a genuine multi-slot group containing an ARRAY sub-slot — `__jsx_start_opening_element_group1`'s inner `attribute` slot is a `repeat` (`Vec<_JsxAttributeTransport>`) — has its **parent surface slot mis-derive optional-single instead of list**. So `emitters/render-module.ts:2329-2333` (the group-lift hoist-fallback dual-path) emits `Renderable::Transport(&Vec<…>)`, but `&Vec<…>` isn't `RenderableTransport`. This is the only kind that breaks.

**Fix (two parts):**
1. **Slot derivation** — `compiler/collect-slots.ts` `collectSlots`/`buildSlot`: when a content-alias group's inner slot is a `repeat`/`repeat1`, mark the **parent surface slot** `multiple` / `view='list'` (push the array multiplicity up from the group's inner slot). Verify `node-model.json5`'s parent slot derives `multiple:true`.
2. **Render emit** — `emitters/render-module.ts:2329-2333`: add a **list-aware branch** to the group-lift dual-path — source the helper's `Vec` into a `ListNonterminalView` (join), not `OptionalNonterminalView`.

After Fix 3: regen all 3, `cargo check` green, RELEASE gate **≥ floor 111/69/74** (target meet-or-beat), then commit (the whole Chunk 2 — source + regenerated artifacts, explicit pathspec, NEVER test-fixtures).

## Witnesses (verify with `probe-kind`, not just counts)
- `visibility_modifier` renders `pub(super)` (no renderError; choice content present) — a minted visible group, non-`_` name, slot populated. [Fix 1 — already verified at IR level]
- `formal_parameters` renders `( a: number, b: string )` (inline-flat list, NOT empty `( )`); `enum_body` renders `{ A, B }`. [Fix 2 routes these off the alias path]
- `__jsx_start_opening_element` / jsx opening element renders its attributes (the Fix-3 target).
- `mintContentAliasKinds` fires for genuine groups under a non-`_` name.

## Execution discipline (hard rules)
- Dispatch `sittir-codegen` (model: opus — sonnet stalled on this integration twice) for the implementation; it now carries the "follow the mechanism / STOP at blockers / never substitute" rule. `sittir-research` (read-only) for any further diagnosis.
- Commit by EXPLICIT pathspec; **NEVER stage `rust/crates/sittir-*/test-fixtures.json` or `packages/validator/validation-history.jsonl`** (restore via `git checkout HEAD --`). No broad `git add` (stray compiled `.js` under `packages/codegen/src` is build leakage). Commit messages end `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`; avoid the literal compiler name `tsc` (hooked).
- lspeasy for renames/moves; native LSP for symbol reads.
- A validator hook auto-commits benign `chore(validator)` records — leave them.
- The `scripts/gen-cli-skill.mts` + `skills/` + `package.json`/`pnpm-lock.yaml` working-tree residue is an environmental `@to-skills/cli` install — NOT ours, don't commit.

## Fallback (always available)
The **scaffolding alone holds floor** (enrich inline-safe + separated-list/bare-repeat guards + `applyAutoGroups` disabled + link pass idle = 111/69/74 exactly, A/B-verified). So the original consolidation goal (**retire `applyAutoGroups`**) can land at floor anytime by gating the content-alias emission OFF — if Fix 3's render work proves not worth it. The visible-alias is wanted for **co-optionality** (user, design authority), not because inline-unsafe kinds render broken.

## Deferred (NOT this chunk)
- Chunk 3: delete `applyAutoGroups` (assert no-op first) + `sittir-review`.
- Polymorph simplification via content-alias (the spike unlocked it — variants could surface from content-aliases with no hidden `_*_variant` rules). Separate follow-up.
- Sunset the legacy top-level `source:'group-lift'` once IR readers migrate to `metadata.source`.
