# Design Spec — Canonicalize the `separator` rule-shape

> **Status:** spec for a strangler PR. Slots into **PR-O** (`pr-o-structural-dedup`) as the named sub-item **`separator-canonical`** (or its own letter), gated on PR-H. Non-rust-emitting (compiler-side data shape; rust render is the *gate*, not edited).

**Goal:** Collapse the 3-way `RuleBase.separator` union to **one canonical form** so every walker/render consumer stops branching on separator *shape* — the same shape-variance reduction class as PR-C (`origin`/`aliasSources` → `parseKind`/`isUnnamed`) and the `patternReplacementKinds` cut.

## ⚠ Reframing — the target is NOT `Rule[]`

The original ask was "separator as `Rule[]`." **The survey rejects that** on evidence:

1. **The bare `readonly Rule[]` union member has ZERO producers.** `sg -p 'separator: [$$$]'` + `rg 'separator:\s*\['` over `packages/codegen/src` → no assignments. It's a *phantom* member consumers defensively branch on.
2. **Every terminal consumer reduces separator to a `string`** (`extractSeparatorString` node-map.ts:1051, `separatorToString` templates.ts:1067, consumed `NodeRef.separator: string` node-map.ts:280). The *structure* is never consumed as structure — even the alias-walk over `sep.rules` can never fire on a real `,`/`;`/`\n` literal.
3. **`RepeatRule`/`Repeat1Rule`, `NodeRef`, `TerminalValue` ALL already use `separator: string` + sibling `trailing?`/`leading?` booleans.** The object-union on `RuleBase` is the lone outlier.

So `Rule[]` is the *least* clean target (no producer, no structural consumer, would force every `string` producer to wrap as `StringRule` for zero benefit, *diverging further* from the existing majority). **Recommended target: option B — string + sibling flags.**

## Current shape (the problem)

`packages/codegen/src/compiler/rule.ts:80-87`:
```ts
readonly separator?:
  | string
  | readonly Rule[]
  | { readonly rules: readonly Rule[]; readonly trailing?: boolean; readonly leading?: boolean };
```
But `RepeatRule`/`Repeat1Rule` already **override** this to `separator?: string` + sibling `trailing?`/`leading?` (rule.ts:186-196). Two separator vocabularies coexist. Cost: ~10 consumers each carry a bespoke shape-branch (`typeof === 'string'` / `Array.isArray` / `'rules' in sep`); `rule-attrs.ts:135` resorts to `JSON.stringify` comparison because the shape is non-uniform.

## Target canonical form (B — string + sibling flags)

Make `RuleBase.separator` match the existing majority:
```ts
readonly separator?: string;
readonly trailing?: boolean;
readonly leading?: boolean;
```
- Deletes the union outright — no consumer branches on shape again.
- Makes `RuleBase` match `RepeatRule` exactly → the `RepeatRule`/`Repeat1Rule` field *overrides* become deletable (true unification).
- Aligns with `NodeRef`/`TerminalValue` and directly satisfies [[feedback_rule_slot_vocabulary_alignment]] ("same concept both sides → identical field names: `trailing`/`leading`/`separator`, no divergence").

**Engage `rule.ts:54-57` on the record:** it documents a prior "universal-shape decision" (flags on the structured object) that was **never fully applied** — `RepeatRule`/`NodeRef`/`TerminalValue` contradict it with siblings today. This spec resolves the contradiction by aligning to the de-facto majority (siblings) and rewriting that comment. (Alt option A — "object-always," migrating the three sibling-form types onto the object — honors the comment's cohesion but reverses the gravity of ~all existing code + keeps a nested object the renderer must destructure. Rejected: higher churn, lower DRY.)

## Where normalization happens — no new pass

Stop producing the object form at its **two** source sites; emit siblings instead:
- `wrapper-deletion.ts:88-131` (`repeat`/`repeat1`) — PRIMARY producer. Replace `sep = { rules, trailing, leading }` (97-101, 119-123) with carrying `separator: string` + siblings through `WrapperAttrs` (extend `WrapperAttrs` :35-42 with `trailing?`/`leading?`; stamp in `stampAttrs` :258-277).
- `list-fusion.ts:108` — the only OTHER object producer. Replace `separator: { rules, trailing:true }` with `separator: sepStr, trailing: true`.

All other producers already emit string+siblings (`evaluate.ts`, `link.ts:2209`, `group-synthesis.ts:293,298`, `optimize.ts:675,774`) — unchanged.

## Consumer migration (every shape-branch site)

| # | Site | Today | After |
|---|------|-------|-------|
| 1 | `evaluate.ts:2094-2101` (the PRK walker) | `Array.isArray`/`'rules' in sep` walk | delete both branches — separator is a string literal |
| 2 | `templates.ts:1067-1075` `separatorToString` | string/array/object | return `rule.separator` directly |
| 3 | `templates.ts:1088-1127` `selectJoinFilter` | object `sep.trailing/leading` (1098-1105) | drop object branch; read sibling flags |
| 4 | `node-map.ts:1051-1062` `extractSeparatorString` | string/array/object | return string |
| 5 | `collect-slots.ts:60-80` `findNestedSeparator` | passes union through | return `string \| undefined` |
| 6 | `collect-slots.ts:403-416` | object flags else fallback | sibling flags |
| 7 | `list-fusion.ts:69-78` `separatorString` | string/object | string |
| 8 | `rule-attrs.ts:132-137` `sharedArmAttrs` | `JSON.stringify` compare | `===` on separator + per-flag |
| 9 | `template-walker.ts:65-92` `findRepeatFlag` | object pre-check (70-73) | delete; sibling flags |
| 10 | `template-walker.ts:26-48` `findRepeatSeparator` | typed `string` but could return object (**latent bug**) | returns string cleanly (bug dissolves) |

Pass-throughs needing only the type change: `wrapper-deletion.ts:38`, `simplify.ts:1015/1021/1082/1102/1129`, `node-map.ts:683-691`, `transform-path.ts:670-686`.

## Flags-preservation (the crux)

`trailing`/`leading` move to **sibling booleans on `RuleBase`** alongside `separator: string` — preserved by construction at the 2 producer sites, read by `selectJoinFilter` (which `joinWithTrailing`/`joinWithLeading`/`joinWithFlanks` depend on) directly. The slot-level rollup is untouched: `collect-slots.ts:405-414` already derives `hasTrailing`/`hasLeading`; `stampSeparatorOnValues` (node-map.ts:1068) already stamps per-value. No new home needed — siblings ARE the home the codebase already uses. Orphan-flag risk (`trailing:true` with no separator) is contained: both producers set flags only inside the `separator !== undefined` branch. (cf. [[project_preserve_token_wrappers]].)

## Gate

- `pnpm validate:native` holds **rust 125 / ts 72 / py 76** (deep).
- **Generated render byte-identical** — the two diff targets: `selectJoinFilter` filter-name per slot, and `emitListSlot` (`templates.ts:1180`) emitted `{{ name | <filter>("<sep>") }}`.
- **Co-migrate** the 2 object-form fixtures: `compiler/__tests__/rule-attributes.test.ts:29`, `emitters/__tests__/templates-emitter-emitRule.test.ts:415` (update to sibling form — not a regression).
- Run `dump-ast-mismatches` pre/post (the `findRepeatSeparator` latent bug could hide a behavioral shift).

## Risks
1. `selectJoinFilter` ordering — if any rule carries the object form but NOT siblings, deleting the object branch needs the producers to stamp siblings (both do, inside the same conditional — verify per-site).
2. The 2 fixtures encode the object form — co-migrate or the gate trips on the fixtures.
3. `findRepeatSeparator` latent type bug — migration fixes + surfaces it; `dump-ast-mismatches` confirms no hidden shift.
4. Phantom `Rule[]` removal safe (no producer; `rg` confirms none) — double-check `__tests__`.

## Placement
**PR-O `separator-canonical` sub-item.** Depends-on: **PR-B ✅** + **PR-H ⬜** (PR-H renames `optimize.ts`→`normalize.ts` + relocates transforms; `optimize.ts:675,774` are separator producers; plan already serializes PR-O after "PR-B value model + PR-H transforms.ts settle"). Lands after PR-H. Does NOT depend on the M→I→K polymorph chain.
