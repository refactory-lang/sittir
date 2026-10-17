# PR3 — Delete the legacy render walker + `ClauseRule`

**Date**: 2026-05-22
**Branch**: `026-pr3-delete-legacy-render-walker` (off master `bbadd99b`, which has the PR2 merge `#35`)
**Status**: design (pre-implementation)
**Supersedes**: the PR3 section of [`2026-05-18-rule-attributes-and-template-emitter-design.md`](./2026-05-18-rule-attributes-and-template-emitter-design.md), which framed PR3 as "delete the wrapper rule types." That framing is **dropped** — see Non-goals.

## Problem

PR2 (#35) shipped the new `TemplateEmitter` (`emitters/templates.ts`, `runTemplateEmitter` → `emitBranchTemplate`/`emitGroupTemplate` → `emitRule(node.renderRule)`) as the cli's render path (`cli.ts:311 → writeJinjaTemplates(result.jinjaTemplates)`). It consumes the wrapper-free **`renderRule`** (RawRule + `applyWrapperDeletion` push-down).

But PR2 left the **legacy render walker in place, unused by the cli**:

- `template-walker.ts`'s `renderRuleTemplate` / `deriveWalkSlots` — the old ~1250-line RawRule walker.
- `AssembledNode.renderTemplate()` methods (node-map.ts) + their translation helpers — thin wrappers over `renderRuleTemplate`.
- `emitJinjaTemplates` + `emitBodyForNode` + the `legacyBody` diff-gate (templates.ts) — the old per-node emit, now only reachable from **test fixtures** (per its own docstring).
- `deriveSlotsRaw` — the legacy slot walker, **0 real refs** (`collectSlots` replaced it).

These were kept as a diagnostic/diff safety net during PR1/PR2. **`probe-stages` now covers the diagnostics**, so the net is no longer needed.

Separately, **`ClauseRule`** (`type: 'clause'`) is a **sittir-invented** rule type (synthesized at `link.ts:2301`), not a tree-sitter shape. It exists only to mark an optional clause with flanking literals (e.g. `impl_item`'s `optional(seq(negative, field('trait'), 'for'))`). That role is now subsumed by the canonical `optional(seq(...))` + the seq-of-leaves shape (PR2's `canonicalizeSeqOfLeaves`), so the bespoke type is dead weight with ~20 special-case sites across the compiler + emitters.

## Goals

1. **Delete the dead legacy render walker** (pure dead-code removal; the cli uses the new emitter).
2. **Delete `ClauseRule`** by replacing its one production site with the canonical `optional(seq(...))` shape, then sweeping the now-dead `'clause'` cases and the type itself.

## Non-goals

- **Do NOT delete the wrapper rule types** (`OptionalRule`/`FieldRule`/`RepeatRule`/`Repeat1Rule`). They are **transient intermediates**: `RawRule` carries them, and `applyWrapperDeletion` push-down consumes/removes them to produce `RenderRule`. They are a legitimate pipeline stage, not dead code. (This reverses the original spec's PR3 framing.)
- No `node-model.json5` schema bump, no cross-process re-wrap, no edge cases (d)/(e)/(f) — those were tied to the wrapper-type deletion, which is out of scope.

## Design

### Part 1 — delete the dead legacy render walker

Reachability from the cli (`runTemplateEmitter`) is the deadness test. Delete everything not reachable:

| Symbol | File | Note |
|---|---|---|
| `renderRuleTemplate`, `deriveWalkSlots` | `compiler/template-walker.ts` | **Keep** `findRepeatSeparator` / `findRepeatFlag` / `findFieldsWithRepeatFlag` — still imported by `collect-slots` / `node-map`. File shrinks to those helpers (or move them to a `repeat-flags.ts`). |
| `AssembledNode.renderTemplate()` methods | `compiler/node-map.ts` (1524, 2748, 3217) | + the render-translation call sites (2343, 2364) and walker-only helpers (`inlineJinjaClauses`, `normalizeChildrenPlaceholderArity`, `normalizeChildrenClausePlaceholderArity`) — delete the ones with no remaining caller. |
| `emitJinjaTemplates`, `emitBodyForNode`, the `legacyBody` diff-gate | `emitters/templates.ts` | the legacy emit + the new-vs-legacy comparison. |
| stale `deriveSlotsRaw` comment references | `node-map.ts` / `simplify.ts` / `wrapper-deletion.ts` / `collect-slots.ts` | the function is **already removed** (0 non-comment refs); sweep the comments that still name it. |
| `template-walker-frozen.test.ts`, `rule-walker.test.ts`, emitJinjaTemplates fixtures | `__tests__/` | delete — they test the deleted walker. |

`probe-stages` already imports `runTemplateEmitter`; remove any `renderTemplate` use there.

### Part 2 — delete `ClauseRule`

1. **Replace the production** at `link.ts:2301` (`type: 'clause'`) with the canonical `optional(seq(...))` shape. This is the single source of `'clause'` rules.
2. **Sweep the `~20` `'clause'` consumer cases** — they become unreachable once production stops. Sites: `wrapper-deletion.ts`, `simplify.ts` (×7), `collect-slots.ts` (×2), `node-map.ts`, `optimize.ts`, `list-fusion.ts`, `link-refine.ts`, `field-shape.ts`, `group-synthesis.ts`, `dsl/wire/auto-groups.ts`, `evaluate.ts`, **`emitClause` in `templates.ts`**, `emitters/node-model.ts`, `emitters/suggested.ts`, `rule-catalog.ts`. (Many overlap Part 1's deleted walker.)
3. **Delete the type**: `ClauseRule` interface + `isClause` guard + `'clause'` from the `Rule` union (`rule.ts` 113/232/440).

## Data flow (after)

`RawRule` (wrappers + `optional(seq)` where `'clause'` used to be) → `applyWrapperDeletion` → `RenderRule` (wrapper-free) → `TemplateEmitter.emitRule(renderRule)` → `.jinja`. No `renderTemplate`, no `renderRuleTemplate`, no `'clause'` anywhere.

## Drift gate

- **Part 1**: zero-drift by construction (deleting code the cli never calls).
- **Part 2**: the `'clause'` → `optional(seq(...))` swap **must produce byte-identical generated output**. Verify via regen + native counts holding at the PR2-merge baseline: **rust 178/134/107, python 95/73, ts 172/81/59** (covPass + read-render-parse + AstMatch). Any drift here is a bug, not an improvement — fix the swap, don't ledger it.

## Build / measure sequence

1. Part 1 (delete walker + tests) → regen all 3 → counts identical. Commit.
2. Part 2a: replace the `link.ts` production → regen → counts identical (this is the risky step). Commit.
3. Part 2b: sweep dead `'clause'` cases + delete the type → `pnpm type-check` + regen → counts identical. Commit.

## Risks

- **`'clause'` carried info beyond `optional(seq)`** (e.g. the field binding to flanking literals). If counts drift after 2a, the canonical shape isn't capturing something the `'clause'` case did — inspect the affected kinds (`impl_item` and siblings) and adjust the replacement before sweeping consumers.
- **`template-walker.ts` helpers**: `findRepeat*` are live — must survive the file deletion (extract or keep a slim file).
