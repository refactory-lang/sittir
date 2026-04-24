# 013 — Next Session Prompt

**Goal:** finish spec 013. Remaining 4 typescript audit flags need iterative grammar-author work (split heterogeneous choice → add GLR conflict → re-split inner → repeat). Pipeline infra is now in place.

## Context

Spec 013 Phase 1 is done + Phase 2 pipeline work landed this session:
- Infra (A) — compose polymorphs onto hidden-rule parents (commit `be602c05`).
- Infra (B) — `applyPath` descends through `alias` (commit `c5d121c2`).

Corpus floors at 7 pre-existing failures. Audit went from 7 → 4 flags this session:
- rust clean (`_visibility_modifier_pub` resolved via nested split)
- python clean (`_match_block` and `dict_pattern` both resolved)
- typescript unchanged at 4 flags

## Session Log

**Landed this session** (infra + kind adoptions):
- Infra (A): `buildPolymorphParentFn` reads `context.deposits` fallback for hidden-name parents; `injectHiddenRulePlaceholders` skips keys compose already filled; `injectSyntheticRules` (evaluate.ts) skips keys rule-fn already wrote. `polymorphVisibleName`/`polymorphHiddenName` helpers strip leading `_` from hidden parent kinds.
- Infra (B): `descendThroughAlias` + `reconstructAlias` in transform-path.ts; applyPath dispatches `alias` for index/wildcard descents.
- Rust: `_visibility_modifier_pub: { '1/0/1/3': 'in_path' }` — nested split of `seq('in', _path)` arm.
- Python: `_match_block: { 0: 'block' }` — split the block-form arm.
- Python: `dict_pattern: { '1/0/0/0': 'kv' }` — split inlined `_key_value_pattern` choice arm.
- Corpus test: added `dict_pattern_kv` to python's ALIAS_VARIANT_KINDS exclusion set.

**Attempted and reverted** (needs iterative splitting):
- TS `_for_header: { '1/0': 'lhs', '1/1': 'var_kind', '1/2': 'let_const_kind' }` — exposed multiple GLR conflicts against `primary_expression` / `variable_declarator`. Each added conflict surfaced another. Reverted after 3 rounds; this kind needs ~5+ conflict declarations to settle.
- TS `_export_statement_default: { 0: 'from_clause', 1: 'declaration' }` — split worked but each sub-kind (`_from_clause`, `_declaration`) has its OWN heterogeneous inner choice, each with its own GLR conflicts. Net flag count went 4 → 5. Reverted.

## Remaining Audit Hits (4 — all typescript)

- `_for_header` — `seq-member-optional-wrapping-choice` (3-arm inner choice, each with fields + optionals)
- `public_field_definition` — `seq-member-optional-wrapping-choice` (complex optional-choice shapes)
- `class_body` — `repeat-wrapping-choice` (body repeats a 4-arm heterogeneous choice)
- `_export_statement_default` — `choice-needs-variant` (top-level 2-arm choice with deeply nested inner heterogeneity)

Each of these needs:
1. Split outer choice into variant arms (`polymorphs: { kind: { 'path': 'name' } }`).
2. Add the required tree-sitter GLR conflicts for each new variant.
3. Repeat at the next level until the inner choices are all symbol-like / token-like.

## Strategy for Remaining Work

These are tractable but deep — each kind likely needs 2-4 levels of split + ~5-10 conflict entries per level. Budget ~2-3 hours per kind. Approach:

1. Start with one kind, ideally the shallowest (`_export_statement_default` has only 2 outer arms).
2. Split, regen, watch tree-sitter fail with a conflict, add the conflict.
3. Repeat until generate succeeds. Check audit: if inner sub-kinds are flagged, split them too.
4. Add each new `*_variant_name` kind to `ALIAS_VARIANT_KINDS[typescript]` in corpus-validation.test.ts if the renderability test complains about a missing template.
5. Once that kind is clean, move to the next.

**Watch out for:**
- Conflict cascade: each split splits LR states, which can expose conflicts you didn't create. If the same symbol keeps appearing in the conflict message, add a higher-level group conflict (`[$.A, $.B, $.C, $.newVariant]`) rather than many 2-way ones.
- Corpus test renderability failure: synthesized variants whose body is a pass-through alias don't emit their own templates — add them to `ALIAS_VARIANT_KINDS`.

## Starting Command

```bash
cd /Users/pmouli/GitHub.nosync/refactory-lang/sittir
git log --oneline -20 | grep "013:"  # review landed work
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src 2>&1 | tail -10
```

Probe tool (recreate if needed — it's trivial and got deleted after each use):

```ts
// packages/codegen/src/scripts/probe-rule.ts
import { evaluate } from '../compiler/evaluate.ts'
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts'
const raw = await evaluate(resolveOverridesPath(process.argv[2]))
console.log(JSON.stringify(raw.rules[process.argv[3]], (k, v) => k === '_ref' ? undefined : v, 2))
```

## Phase 2 Walker Shrink

Still blocked — walker can't assume canonical input until all 4 TS kinds resolve. Once the audit is clean:

1. Flip `DERIVE_AUDIT_MODE` default to `strict` in `packages/codegen/src/compiler/node-map.ts:230`.
2. Shrink `deriveFields` / `deriveChildren` to the 4-line target from `plan.md` lines 135-149. Delete `deriveFieldsRaw`'s `case 'choice'` per-branch+downgrade logic, `walkForChildren`'s same, `toOptionalMultiplicity`, and `deriveFields`'s merge loop (check python commaSep still works).
3. Add a `## Delivered` section to `plan.md`.
