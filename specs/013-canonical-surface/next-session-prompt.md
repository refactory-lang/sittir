# 013 — Next Session Prompt

**Goal:** finish spec 013. All remaining audit hits need PIPELINE infrastructure work, not just grammar-author overrides.

## Context

Spec 013 Phase 1 is done + Phase 2 starter landed (commit `ef3ce731`, branch `012-rust-core-port`). Simplify + canonicalize merged, cross-branch field hoist, single-wrapper field hoist, auto-tagging (`tagAllRulesVariants`) and T065 auto-polymorph promotion both disabled and dead code deleted. Corpus floors at 7 pre-existing failures.

## Session Log

**Landed this session** (kind adoptions):
- `visibility_modifier` (rust top-level, commit `982d9cff` by subagent)
- `range_pattern_left` nested split to `left_with_right` / `left_bare` / `prefix` (commit `a6c0422e`)

**Attempted and reverted** (blocked on pipeline infra):
- `_visibility_modifier_pub` (rust): wire system doesn't compose polymorphs onto deferred-content hidden-rule kinds. `composeOrSynthesizePolymorphParents` runs before `injectHiddenRulePlaceholders`, so `original` is undefined for synthesized hidden kinds.
- `_export_statement_default` (ts): split to `default_specifier` + `default_declaration` at paths `0/0` / `0/1` just moved the audit flag one level deeper — each sub-arm has inner heterogeneous choices that need THEIR own variants. Adoption on polymorph-synthesized kinds isn't supported end-to-end.
- `dict_pattern` (python): `applyPath` throws `ApplyPathSkip: cannot descend into 'alias' rule` — the inner paths target a choice wrapped in an alias that applyPath can't traverse.

## Remaining Audit Hits (7)

- **rust (1)**: `_visibility_modifier_pub`
- **typescript (4)**: `_for_header`, `public_field_definition`, `class_body`, `_export_statement_default`
- **python (2)**: `_match_block`, `dict_pattern`

Every one of these needs a specific pipeline change first:

## Infrastructure Work Required

### (A) Compose polymorphs onto deferred-content hidden rules
Unblocks: `_visibility_modifier_pub`, likely `_match_block`.

In `packages/codegen/src/dsl/wire/wire.ts`, `composeOrSynthesizePolymorphParents` currently runs before `injectHiddenRulePlaceholders`. When a polymorphs entry targets a rule like `_visibility_modifier_pub` (synthesized by an outer `visibility_modifier` adoption), the hidden rule's body isn't available yet. Reorder the passes, or extend the polymorph-composer to defer adoption until after hidden-rule placeholders are injected.

### (B) Teach `applyPath` to descend through `alias`
Unblocks: `dict_pattern`, likely any grammar using `alias()` wrappers around inner choices.

In `packages/codegen/src/dsl/transform/transform-path.ts`, `descendThroughSingleWrapper` handles `optional` / `repeat` / `field` but not `alias`. Add an `alias` case that recurses into the alias content (the aliased-from body) and reconstructs the alias wrapper on the way back up. Symmetric to how `field` is handled.

### (C) Multi-level polymorph adoption
Unblocks: `_export_statement_default`, `_for_header`, `public_field_definition`, `class_body`.

The current `polymorphs: { kind: { 'path': 'name' } }` model hits original-rule paths. When an adoption produces a new hidden kind whose body has its own heterogeneous choice, there's no path to reach the inner choice from the original rule's perspective. Two options:

1. **Nested-path syntax**: extend polymorph paths to address positions within synthesized kinds — e.g. `{ '0/0/1/0': 'name' }` drills through arm 0 of arm 0 of the original rule. Some of these already work (see `range_pattern` doing `'0/1/0'` at depth 3); the failures are where depth crosses the boundary into a hidden rule's content.
2. **Adopt-on-synthesized**: allow `polymorphs: { _synthesized_kind: { 'path': 'name' } }` to work. Wire pipeline currently can't find the rule. This is (A) in different words.

## Starting Command

```bash
cd /Users/pmouli/GitHub.nosync/refactory-lang/sittir
git log --oneline -20 | grep "013:"  # review what's landed
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -10
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src 2>&1 | tail -10
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src 2>&1 | tail -10
```

Start with infra (A) — it unblocks 2 kinds directly (`_visibility_modifier_pub`, `_match_block`) and lays groundwork for (C). Then (B) for `dict_pattern`. (C) last; may subsume (A) depending on design.

## Phase 2 Walker Shrink

Still blocked — the walker can't assume canonical input until all 7 kinds are resolved. Once the audit is clean:

1. Flip `DERIVE_AUDIT_MODE` default to `strict` in `packages/codegen/src/compiler/node-map.ts:230`.
2. Shrink `deriveFields` / `deriveChildren` to the 4-line target from `plan.md` lines 135-149. Delete `deriveFieldsRaw`'s `case 'choice'` per-branch+downgrade logic, `walkForChildren`'s same, `toOptionalMultiplicity`, and `deriveFields`'s merge loop (check python commaSep still works).
3. Add a `## Delivered` section to `plan.md`.
