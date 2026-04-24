# 013 — Next Session Prompt

**Goal:** finish spec 013 by adopting the 8 remaining non-canonical kinds as named polymorphs and then shrinking the derive walker to trivial form.

## Context

Spec 013 Phase 1 is done. Simplify + canonicalize merged into one pass, cross-branch field hoist (`hoistSharedFieldAcrossChoiceBranches`) and single-wrapper hoist (`hoistFieldOutOfSingleContentWrapper`) both live in `simplifyRule`, auto-tagging (`tagAllRulesVariants`) and T065 auto-polymorph promotion both removed. Corpus floors improved from 9 → 7 pre-existing failures. Phase 2 starter landed (exhaustive walker switches, `SITTIR_AUDIT_DERIVE=strict` mode that throws on non-canonical input). Full commit history is the `013:` prefix on `012-rust-core-port` branch, last commit `8c26f33b`.

## Remaining Work

### 1. Adopt the 8 audit-flagged kinds as named polymorphs

Run `SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts --grammar X --all --output packages/X/src` to refresh the current list for each of rust/typescript/python. The list as of last commit:

- **rust (2)**:
  - `visibility_modifier` — outer polymorph: arm 0 is bare `$.crate`, arm 1 is `seq(field('pub', ...), optional(...))`. Suggested adoption: `polymorphs: { visibility_modifier: { '0': 'crate', '1': 'pub' } }` in `packages/rust/overrides.ts`.
  - `_range_pattern_left` — already a variant form synthesized by existing `range_pattern: { '0': 'left', '1': 'prefix' }`. Its interior has a nested sub-polymorph: `dotdot_bare` (just `'..'` alone) vs `with_right` (`enum('...', '..=', '..')` + `field('right', ...)`). The asymmetry (`..=`/`...` cannot appear alone) means this is genuine polymorph territory, NOT a simplify case. Adoption path: either declare nested variants under the existing adoption or restructure the `range_pattern` entry to include the inner split.

- **typescript (4)**:
  - `_for_header` — hidden variant body with a `var` / `let` / `const` discriminator + optional `_initializer` / `_automatic_semicolon`. Adopt the kind discriminator as a named sub-variant.
  - `public_field_definition` — has an inner `optional(choice(...))` with modifier-bearing arms. Check `SITTIR_AUDIT_DUMP=public_field_definition` for the exact shape.
  - `class_body` — `repeat(choice(member-kinds))` where branches are distinct member types.
  - `_export_statement_default` — nested within the already-adopted `export_statement` polymorph. Needs second-level variant adoption similar to `_range_pattern_left`.

- **python (2)**:
  - `_match_block` — hidden; check if actually reachable (if not in node-types.json, may be an audit false positive).
  - `dict_pattern` — deeply nested shape `optional(repeat1(choice(...)))` with entries of different forms (key/value pairs vs splat patterns).

For each kind: dump the rule with `SITTIR_AUDIT_DUMP=<kind> SITTIR_AUDIT_DERIVE=1 ...`, pick names that match grammar semantics, add the `polymorphs: { ... }` entry in the grammar's `overrides.ts`, regen with `--all`, confirm audit drops the kind.

### 2. Flip the audit to strict-by-default

In `packages/codegen/src/compiler/node-map.ts:230`, change `DERIVE_AUDIT_MODE` so `strict` runs even without `SITTIR_AUDIT_DERIVE=strict`. Keeps `=report` as an escape hatch. This locks in the canonical-input invariant so future regressions throw loudly.

### 3. Shrink the derive walker to the spec's 4-line target

`specs/013-canonical-surface/plan.md` lines 135-149:

```ts
function deriveFields(rule: Rule): AssembledField[] {
    const members = rule.type === 'seq' ? rule.members : [rule]
    return members.filter(isField).map(buildAssembledField)
}
```

Delete from `packages/codegen/src/compiler/node-map.ts`:

- `deriveFieldsRaw`'s per-case merge logic (the `case 'choice'` per-branch + in-all-branches check).
- `walkForChildren`'s per-branch + downgrade logic (same pattern).
- `toOptionalMultiplicity` helper — only called from the choice cases.
- `deriveFields` wrapper's merge loop — canonical form guarantees no cross-branch same-name fields (except python commaSep pattern: `seq(field('name', x), repeat(seq(',', field('name', x))))` — check post-hoist this collapses to one entry).

Multiplicity now comes from reading the field's content (repeat → array, optional → optional, etc.), already done by `fieldContentMultiplicity`.

### 4. Phase 3 verification

- All emitter tests pass without modification.
- Corpus floors don't drop (still 7 pre-existing).
- `SITTIR_AUDIT_DERIVE=1` on all three grammars reports zero non-canonical.

### 5. Update spec

Add a "Post-landing" section to `specs/013-canonical-surface/plan.md` listing what was delivered vs. deferred. Phase 4 (separator-metadata) stays optional future work.

## Starting Command

```bash
cd /Users/pmouli/GitHub.nosync/refactory-lang/sittir
git log --oneline -20 | grep "013:"  # review what's landed
SITTIR_AUDIT_DERIVE=1 npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src 2>&1 | tail -10
```

Start with rust's `visibility_modifier` — simplest adoption, establishes the pattern.
