# node-map.ts dead-code inventory (post-PR2, pre-PR3)

**Audit date:** 2026-05-20
**Branch:** `025-pr2-canonicalize-template-emitter`
**node-map.ts path:** `/Users/pmouli/GitHub.nosync/refactory-lang/sittir/packages/codegen/src/compiler/node-map.ts`
**node-map.ts LOC:** 4,319
**Estimated removable LOC:** ~1,050–1,150 from node-map.ts alone (plus ~1,767 from template-walker.ts, deleted as a whole file)

---

## Category 1: AssembledXxx.renderTemplate() methods

### AssembledNodeBase.renderTemplate (lines 1838–1852, ~15 LOC)

Base no-op override:
```ts
renderTemplate(_rules?, _wordMatcher?, _externals?): RenderTemplateEntry | undefined {
  return undefined;
}
```

- **Callers:** `emitters/templates.ts:890` (`emitBodyForNode` calls `node.renderTemplate(...)`) and `emitters/render-module.ts:2314` (same pattern).
- **Dead because:** `emitBodyForNode` is itself part of the legacy skip-emit gate inside `TemplateEmitter.#emitNode`. After PR3, the skip-emit decision migrates to `classifyTemplateEmission` (already in `shared.ts:1292`).
- **Priority:** TRANSITIVELY DEAD — only reachable once the three subclass overrides below are deleted.

### AssembledBranch.renderTemplate (lines 3068–3139, ~72 LOC)

- **Callers (non-test):**
  - `emitters/templates.ts:890` — legacy skip-emit gate
  - `emitters/render-module.ts:2314` — produces `rendered?.surface` for `mergeTemplateSurfaceFromBody`
  - `compiler/node-map.ts:2718` — `inlineSingleParameterlessChildTemplate` calls `value.node.renderTemplate(...)` (itself transitively dead)
  - `compiler/node-map.ts:2739` — `inlineFixedParameterlessSlotPlaceholders` (transitively dead)
- **Dead because:** New `TemplateEmitter` consumes `node.renderRule` via `emitBranchTemplate` / `emitRule`. PR3 spec §4 deletes it.
- **Priority:** DEFINITELY DEAD from new-emitter perspective. **render-module.ts:2314 is LIVE** — see surprise finding below.

### AssembledPolymorph.renderTemplate (lines 3524–3680, ~157 LOC)

- **Callers:** Same as AssembledBranch.
- **Dead because:** New `emitPolymorphTemplate` (templates.ts:264) consumes `form.renderRule` directly.
- **Priority:** DEFINITELY DEAD for template emission. MAYBE DEAD for render-module surface.

### AssembledGroup.renderTemplate (lines 4059–4106, ~48 LOC)

- **Callers:** Same — templates.ts:890 and render-module.ts:2314.
- **Dead because:** New `emitGroupTemplate` (templates.ts:224) consumes `node.renderRule`.
- **Priority:** DEFINITELY DEAD for template emission. MAYBE DEAD for render-module surface.

### AssembledGroup.renderParts (lines 4107–4135, ~29 LOC)

- **Callers:** Only `AssembledPolymorph.renderTemplate` (node-map.ts:3617).
- **Priority:** TRANSITIVELY DEAD.

### AssembledNodeBase.isTextTemplate + protected textTemplate (lines 1749–1803, ~55 LOC)

- **Callers of isTextTemplate:** Only `textTemplate` (line 1791), which is called from dead renderTemplate methods.
- **Priority:** TRANSITIVELY DEAD — once renderTemplate methods go, these die. The `hasOptionalPunctPrefix` / `isVerbatimTokenStream` / `hasHiddenExternalRef` sub-functions (lines 3159–3411) are also reachable only through `isTextTemplate`.

---

## Category 2: Translation pipeline functions

### inlineJinjaClauses (lines 1933–2027, ~95 LOC)
- **Callers in node-map.ts:** Three dead renderTemplate methods (lines 3104, 3649, 4083).
- **Callers outside node-map.ts:** None.
- **Priority:** TRANSITIVELY DEAD.

### JinjaTranslateMeta interface (lines 2046–2081, ~36 LOC)
- **Callers:** `jinja-translate.test.ts` (direct import + tests), node-map.ts dead pipeline functions, comment-only in templates.ts:430.
- **Priority:** MAYBE DEAD — the test file directly imports it; tests must be deleted alongside.

### translateToJinja (lines 2255–2278, ~24 LOC)
- **Callers:** `jinja-translate.test.ts` (unit tests), three dead renderTemplate methods.
- **Priority:** MAYBE DEAD — has direct unit tests covering the legacy two-pass behavior.

### absorbFlankingChildrenSpaces (lines 2163–2205, ~43 LOC)
- **Callers:** Only `translateToJinja:2274`.
- **Priority:** TRANSITIVELY DEAD.

### absorbHeadConditionalTrailingSpace (lines 2300–2321, ~22 LOC)
- **Callers:** Only `translateToJinja:2276`.
- **Priority:** TRANSITIVELY DEAD.

### absorbHeadConditionalLeadingSpace (lines 2323–2354, ~32 LOC)
- **Callers:** Only `translateToJinja`.
- **Priority:** TRANSITIVELY DEAD.

> Note: spec mentions `absorbLeadingSeparatorIntoJinjaConditional` / `absorbTrailingSeparatorIntoJinjaConditional` / `absorbHeadLeadingSeparatorIntoConditionals` — those three are in `template-walker.ts`, not node-map.ts.

### wrapOptionalFieldPlaceholders (lines 2380–2420, ~41 LOC)
- **Callers:** `translateToJinja:2256`, `AssembledPolymorph.renderTemplate:3584`.
- **Priority:** TRANSITIVELY DEAD.

### computeGuardedRanges (lines 2424–2443, ~20 LOC)
- **Callers:** Only `wrapOptionalFieldPlaceholders`.
- **Priority:** TRANSITIVELY DEAD.

### isWithinGuardedRange (lines 2445–2452, ~8 LOC)
- **Callers:** Only `wrapOptionalFieldPlaceholders`.
- **Priority:** TRANSITIVELY DEAD.

### filterForFlanks (lines 2454–2483, ~30 LOC)
- **Callers:** `translateToJinja:2269`, `jinja-translate.test.ts:4` (tested).
- **Priority:** MAYBE DEAD — has unit tests.

### applySelfDelimitedJoinOverrides (lines 2517–2527, ~11 LOC)
- **Callers:** `jinja-translate.test.ts:3,70` (tested), `AssembledBranch.renderTemplate:3120`, `AssembledGroup.renderTemplate:4093`.
- **Priority:** MAYBE DEAD — has direct unit tests.

### childrenMayBeEmpty (lines 2095–2133, ~39 LOC)
- **Callers:** Only `AssembledBranch.renderTemplate:3128`.
- **Priority:** TRANSITIVELY DEAD.

### hasSingularChildrenSlot (lines 2137–2143, ~7 LOC)
- **Callers:** `normalizeChildrenPlaceholderArity` and `normalizeChildrenClausePlaceholderArity`.
- **Priority:** TRANSITIVELY DEAD.

### normalizeChildrenPlaceholderArity (lines 2145–2155, ~11 LOC)
- **Callers:** All in dead renderTemplate methods.
- **Priority:** TRANSITIVELY DEAD.

### normalizeChildrenClausePlaceholderArity (lines 2157–2162, ~6 LOC)
- **Callers:** Same as `normalizeChildrenPlaceholderArity`.
- **Priority:** TRANSITIVELY DEAD.

### deriveOptionalSlotNames + deriveOptionalFieldNames (lines ~2495–2515, ~21 LOC)
- **Callers:** All in dead renderTemplate methods.
- **Priority:** TRANSITIVELY DEAD.

### buildRenderSurface (lines 2528–2556, ~29 LOC)
- **Callers:** All in dead renderTemplate methods. **But: produces RenderTemplateSurface, which has a LIVE render-module.ts consumer (Category 6).**
- **Priority:** TRANSITIVELY DEAD from node-map.ts perspective, but the surface type itself is LIVE.

### deriveCrossFormOptionalFields (lines ~2570–2579, ~10 LOC)
- **Callers:** Only `AssembledPolymorph.renderTemplate:3543`.
- **Priority:** TRANSITIVELY DEAD.

### tryCrossFormOptionalCollapse (lines ~2600–2637, ~38 LOC)
- **Callers:** Only `AssembledPolymorph.renderTemplate:3622`.
- **Priority:** TRANSITIVELY DEAD.

### inlineSingleParameterlessChildTemplate (lines 2638–2657, ~20 LOC)
- **Callers:** Only `AssembledPolymorph.renderTemplate:3561`.
- **Priority:** TRANSITIVELY DEAD.

### inlineFixedParameterlessSlotPlaceholders (lines 2659–2684, ~26 LOC)
- **Callers:** Only `AssembledPolymorph.renderTemplate:3568`.
- **Priority:** TRANSITIVELY DEAD.

### resolveStampedLiteral (lines ~2686–2694, ~9 LOC)
- **Callers:** `inlineSingleParameterlessChildTemplate` and `inlineFixedParameterlessSlotPlaceholders`.
- **Priority:** TRANSITIVELY DEAD.

### longestCommonPrefix (lines ~2696–2706, ~11 LOC)
- **Callers:** Only `tryChildrenPresenceCollapse`.
- **Priority:** TRANSITIVELY DEAD.

### tryChildrenPresenceCollapse (lines ~2707–2727, ~21 LOC)
- **Callers:** Only `AssembledPolymorph.renderTemplate:3626`.
- **Priority:** TRANSITIVELY DEAD.

### escapeJinjaBraceCollisions (lines 2734–2751, ~18 LOC)
- **Callers:** Only `translateToJinja:2277`.
- **Priority:** TRANSITIVELY DEAD.

---

## Category 3: template-walker.ts imports (lines 50–51)

```ts
import { renderRuleTemplate, deriveWalkSlots, findRepeatSeparator, findRepeatFlag } from './template-walker.ts';
import type { WalkSlotUse } from './template-walker.ts';
```

- **renderRuleTemplate:** Used only in dead renderTemplate methods (lines 3091, 4074, 4127). DEAD.
- **deriveWalkSlots:** Used only at `AssembledPolymorph.renderTemplate:3578`. DEAD.
- **WalkSlotUse:** Used in `buildRenderSurface` (dead), `AssembledPolymorph.renderTemplate:3547`, `AssembledGroup.renderParts:4124`. DEAD.
- **findRepeatFlag:** Used at lines 934/939 in `deriveSlotsRawFromLeafAttr` (LIVE) AND in dead renderTemplate methods (3112, 3113, 4087, 4088). **LIVE** — must migrate when deleting template-walker.ts.
- **findRepeatSeparator:** Used at lines 3110, 4085 (both in dead renderTemplate methods inside node-map.ts). Also imported by render-module.ts:41 (LIVE). **LIVE via render-module.ts.**

---

## Category 4: ClauseRule + isClause + detectClause

ClauseRule (rule.ts:218), isClause (rule.ts:426), detectClause (link.ts:2285) live outside node-map.ts but `case 'clause':` sites are scattered through node-map.ts.

| Line | Function | Status |
|------|----------|--------|
| 438 | `hasAnyField` | LIVE |
| 463 | `hasAnyChild` | LIVE |
| 586 | `classifyTopLevelShape` | LIVE |
| 1103 | `deriveSlotsRaw` | LIVE (PR2 comment: "kept until PR3 deletes ClauseRule") |
| 1424 | `deriveValuesForRule` | LIVE |
| 2127 | `childrenMayBeEmpty` | TRANSITIVELY DEAD |
| 3219 | inside `isAllPunct` | LIVE for `hasOptionalPunctPrefix` → `isTextTemplate` (transitively dead via renderTemplate deletion) |
| 3258 | `isAllPunct` | LIVE for same reason |

All active-derivation `case 'clause':` arms are LIVE — they handle `ClauseRule` nodes that still flow through the pipeline. PR3 deletes ClauseRule globally.

---

## Category 5: AssembledNode.rule field (RawRule snapshot)

`AssembledNodeBase.rule` (line 1699, `protected readonly rule: R`).

### Live usages (cannot delete the field):
- **AssembledBranch.members** getter (line 3060)
- **AssembledBranch.isContainerShape** getter (line 3093, calls `hasAnyField(this.rule)`)
- **AssembledKeyword/Token/Enum/Multi** internal getters (text, immediate, tokenized, elementRule, nonEmpty, separator, trailing, leading, stampChildExpression)

### Dead usages (delete with renderTemplate):
- **isTextTemplate** sub-functions (lines 1761, 1764, 1772)
- All `renderRuleTemplate(this.rule, ...)` calls (3153, 4136)

### Other emitter usages:
- **emitters/templates.ts:238** — `const repeat = node.rule` in `emitMultiTemplate`. Per template comment, output is discarded by legacy null-gate; MAYBE DEAD.

**Verdict:** `AssembledNodeBase.rule` itself is LIVE. Per spec PR3 §7, callsites that can switch to `.renderRule` should, but the field stays until callers migrate. The specific dead sites are the `isTextTemplate` and legacy `renderTemplate` calls.

---

## Category 6: RenderTemplateSurface / RenderTemplateEntry / RenderTemplateSlot (LIVE in render-module.ts)

Three interfaces at lines 319–337. **The most important surprise finding.**

- **render-module.ts:22** — imports `RenderTemplateSurface`
- **render-module.ts:622** — `function emitStruct(kind, node, surface: RenderTemplateSurface)`
- **render-module.ts:717** — `function mergeTemplateSurfaceFromBody(body, surface: RenderTemplateSurface)`
- **render-module.ts:2314** — `const rendered = node?.renderTemplate(...)` → `mergeTemplateSurfaceFromBody(f.content, rendered?.surface)`

**render-module.ts uses `renderTemplate()` not for the template body but for the `RenderTemplateSurface` — slot metadata that drives the Rust template struct emission.**

Until `render-module.ts` is migrated to derive surface metadata from slots/renderRule directly, these interfaces and the renderTemplate methods cannot be fully deleted. This is the **PR3 BLOCKER** that must be addressed first.

---

## Category 7: hoistInnerFieldsForTemplate (in simplify.ts)

`hoistInnerFieldsForTemplate` lives in `simplify.ts:712`.

- **Callers:** `assemble.ts:56,106` (raw rule for legacy template walking), `assemble.ts:479` (group/polymorph forms).
- **Dead because:** The raw `inlinedRule` is still stored as `node.rule` for legacy `renderTemplate`. Once those go, this collapses.
- **Priority:** TRANSITIVELY DEAD — lives in simplify.ts, deleted alongside renderTemplate deletion.

---

## Category 8: Additional findings

### emitBodyForNode in templates.ts (lines 858–900) — TRANSITIVELY DEAD

Calls `node.renderTemplate(...)`. Called by `TemplateEmitter.#emitNode` (legacy skip-emit gate) and standalone `emitJinjaTemplates`. PR3 must migrate skip-emit to `classifyTemplateEmission` alone.

### emitMultiTemplate in templates.ts (lines 229–262) — MAYBE DEAD

Handles `multi` modelType in new emitter, but output is discarded by legacy null-gate. PR3 should either delete or migrate skip logic.

### AssembledBranch.isContainerShape (line 3092) — LIVE but reads `this.rule`

After PR3, must switch to `!hasAnyField(this.renderRule)` or equivalent when `node.rule` is renamed/deleted.

### Test files for dead code
- `__tests__/rule-walker.test.ts` — tests `renderRuleTemplate` / `findRepeatFlag` from template-walker.ts. Delete with template-walker.ts.
- `__tests__/jinja-translate.test.ts` — tests `translateToJinja` / `filterForFlanks` / `applySelfDelimitedJoinOverrides` / `JinjaTranslateMeta`. Delete alongside translation pipeline.

---

## Summary

| Metric | Value |
|--------|-------|
| node-map.ts total LOC | 4,319 |
| Inventoried candidate LOC | ~1,060 |
| DEFINITELY DEAD | ~277 LOC (renderTemplate method bodies in Branch/Polymorph/Group) |
| TRANSITIVELY DEAD | ~700 LOC (translation pipeline, normalize/derive/buildSurface helpers, absorbXxx, escapeJinja, computeGuarded, isWithinGuarded, base no-op, renderParts) |
| MAYBE DEAD | ~130 LOC (translateToJinja + filterForFlanks + applySelfDelimitedJoinOverrides — unit-tested; JinjaTranslateMeta export; isTextTemplate/textTemplate; RenderTemplateSurface/Entry/Slot types) |
| LIVE (surprising) | render-module.ts dependency on renderTemplate for RenderTemplateSurface; findRepeatFlag/findRepeatSeparator still needed |

**Estimated removable from node-map.ts in PR3:** ~950–1,050 LOC, contingent on completing the render-module.ts migration.

---

## Top surprising findings

1. **`render-module.ts:2314` calls `node.renderTemplate()` for `RenderTemplateSurface`**, not the body. This is a live caller that blocks renderTemplate deletion. **PR3 must add a non-renderTemplate path for surface metadata first.**

2. ~~**`findRepeatSeparator` has live render-module.ts callers** (4 sites). Cannot delete template-walker.ts wholesale — must migrate this function.~~ **REDUNDANT** (user confirmed 2026-05-20): per-slot separator stamping (NodeRef/TerminalValue.separator) — established by B-complete — replaces `findRepeatSeparator` entirely. PR3 callers in render-module.ts:128/131/1608/1614 switch to slot.values reads. Delete the function, don't migrate.

3. **`findRepeatFlag` is LIVE in `deriveSlotsRawFromLeafAttr`** (node-map.ts:934,939). Import on line 50 cannot be fully removed yet.

4. **`isTextTemplate` / `textTemplate`** — transitively dead via renderTemplate deletion. The `hasOptionalPunctPrefix` / `isVerbatimTokenStream` / `hasHiddenExternalRef` sub-functions (3159–3411) also die in the same wave.

5. **`jinja-translate.test.ts` blocks "DEFINITELY DEAD" classification** for `translateToJinja` / `filterForFlanks` / `applySelfDelimitedJoinOverrides`. Tests must be deleted with the functions.

---

## Suggested PR3 deletion order

1. **Migrate `render-module.ts` surface derivation** — Replace `node?.renderTemplate(...)?.surface` at render-module.ts:2314 with direct slot-to-surface mapping from `node.slots` / `node.renderRule`. **Unblocks the rest.**
2. **Delete `AssembledGroup.renderParts`** (lines 4107–4135) — only called from polymorph renderTemplate.
3. **Delete `AssembledBranch.renderTemplate`** (lines 3068–3139).
4. **Delete `AssembledGroup.renderTemplate`** (lines 4059–4106).
5. **Delete `AssembledPolymorph.renderTemplate`** (lines 3524–3680).
6. **Delete `AssembledNodeBase.renderTemplate` + `isTextTemplate` + `textTemplate`** + their sub-functions (`isVerbatimTokenStream`, `hasOptionalPunctPrefix`, `hasHiddenExternalRef`, `hasExternalBoundaries`, `isExternalTerminalMember`).
7. **Delete translation pipeline** (bottom-up): `escapeJinjaBraceCollisions`, `computeGuardedRanges` + `isWithinGuardedRange`, `wrapOptionalFieldPlaceholders`, `absorbFlankingChildrenSpaces`, `absorbHeadConditional*Space`, then `translateToJinja`, then `JinjaTranslateMeta`.
8. **Delete `filterForFlanks` + `applySelfDelimitedJoinOverrides`** — delete unit tests first.
9. **Delete remaining dead helpers**: `inlineJinjaClauses`, `childrenMayBeEmpty`, `hasSingularChildrenSlot`, `normalizeChildren*PlaceholderArity`, `deriveOptional*`, `buildRenderSurface`, `deriveCrossFormOptionalFields`, `tryCrossFormOptionalCollapse`, `inlineSingleParameterlessChildTemplate`, `inlineFixedParameterlessSlotPlaceholders`, `resolveStampedLiteral`, `longestCommonPrefix`, `tryChildrenPresenceCollapse`.
10. **Remove dead imports from line 50** (`renderRuleTemplate`, `deriveWalkSlots`).
11. **`findRepeatSeparator` deletes outright** — B-complete establishes per-slot separator stamping on NodeRef/TerminalValue; render-module callers (lines 128/131/1608/1614) switch to `slot.values[*].separator` reads. No migration needed.
    **`findRepeatFlag`** has only ONE LIVE caller (`deriveSlotsRawFromLeafAttr` at lines 934/939 of node-map.ts) — investigate whether the slot.values trailing/leading flags (NodeRef.trailing/leading) make this redundant too. If yes, delete. If not, inline its ~20 LOC body into node-map.ts before deleting template-walker.ts.
12. **Delete `template-walker.ts`** (~1,767 LOC) + delete `rule-walker.test.ts`.
13. **Delete `jinja-translate.test.ts`**.
14. **Delete `emitBodyForNode` from `templates.ts`** + migrate skip-emit to `classifyTemplateEmission` alone.
15. **PR3 §7 — `node.rule` migration**: switch `AssembledBranch.isContainerShape` + `AssembledBranch.members` to read `.renderRule`; then remove RawRule snapshot from `optimize()` output.
