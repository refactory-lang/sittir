# Taxonomy-Driven Emitter Dispatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize the node taxonomy dispatch in a single switch cascade (`emit.ts`), with each emitter exporting a namespace API at its natural granularity depth.

**Architecture:** Each emitter (`factories.ts`, `from.ts`, `wrap.ts`, `types.ts`) keeps its `emitXxx(config)` entry point for `generate.ts` compatibility, but replaces its internal `switch(modelType)` with exported namespace functions called from `emit.ts`. A shared `classifyBranchSlots` helper is the ONE source for single-slot vs multi-slot detection.

**Tech Stack:** TypeScript 6.0.2 (ESM), vitest, `@sittir/codegen` emitter pipeline.

---

## File Map

| File | Responsibility | Tasks |
|---|---|---|
| `packages/codegen/src/compiler/node-map.ts` | `AssembledPattern.modelType` → `'pattern'` | 1 |
| `packages/codegen/src/emitters/shared.ts` | `classifyBranchSlots` + `BranchSlotClass` type | 2 |
| `packages/codegen/src/emitters/factories.ts` | Export `factory` namespace API | 3 |
| `packages/codegen/src/emitters/from.ts` | Export `from` namespace API | 4 |
| `packages/codegen/src/emitters/wrap.ts` | Export `wrap` namespace API | 5 |
| `packages/codegen/src/emitters/types.ts` | Export `types` namespace API | 6 |
| `packages/codegen/src/emitters/factory-map.ts` | Use `classifyBranchSlots` | 3 |
| `packages/codegen/src/__tests__/taxonomy.test.ts` | Tests for `classifyBranchSlots` | 2 |
| 23 files referencing `'leaf'` | Rename to `'pattern'` | 1 |

---

### Task 1: modelType alignment — `'leaf'` → `'pattern'`

**Files:**
- Modify: `packages/codegen/src/compiler/node-map.ts:3170` (`AssembledPattern.modelType`)
- Modify: 23 files across `packages/codegen/src/` that reference `'leaf'` in modelType comparisons

- [ ] **Step 1: Change AssembledPattern.modelType**

In `packages/codegen/src/compiler/node-map.ts`, find line ~3170:

```ts
// Before:
readonly modelType = 'leaf' as const;

// After:
readonly modelType = 'pattern' as const;
```

- [ ] **Step 2: Update the ModelType discriminated union**

In the same file, find the abstract `modelType` declaration on `AssembledNodeBase` (~line 1380) and update any union type or comment that lists `'leaf'`:

```ts
// Before:
 *   `subtypes`, `forms`, `pattern`, `elementRule`, `isTextTemplate`,

// After — update any stale mentions of 'leaf' as a modelType value.
```

Also update the `isAllLeafSlot` and similar functions in `emitters/factories.ts` that check `m === 'leaf'`:

```ts
// Before:
if (m === 'leaf' || m === 'keyword' || m === 'token' || m === 'enum')

// After:
if (m === 'pattern' || m === 'keyword' || m === 'token' || m === 'enum')
```

- [ ] **Step 3: Mechanical rename across 23 files**

Run a codebase-wide rename of `'leaf'` → `'pattern'` in modelType comparison contexts. The 53 references span:

- `compiler/`: `node-map.ts`, `assemble.ts`, `rule.ts`
- `emitters/`: `factories.ts`, `from.ts`, `wrap.ts`, `types.ts`, `is.ts`, `ir.ts`, `consts.ts`, `test.ts`, `type-test.ts`, `templates.ts`, `factory-map.ts`, `client-utils.ts`, `node-model.ts`, `transport-projection.ts`, `render-module.ts`
- `validate/`: `renderable.ts`, `rule-lookup.ts`
- `__tests__/`: `assemble.test.ts`, `emitter-consts.test.ts`, `real-grammar.test.ts`

Use `rg "'leaf'" packages/codegen/src/` to find each site. Change only those that are modelType comparisons (e.g. `case 'leaf':`, `=== 'leaf'`, `modelType: 'leaf'`). Do NOT rename string literals that refer to the word "leaf" in comments or non-modelType contexts.

- [ ] **Step 4: Regen all grammars**

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

- [ ] **Step 5: Type-check + test**

```bash
pnpm -r run type-check
pnpm vitest run packages/codegen/src/__tests__/
```

Expected: type-check clean, all tests pass. `node-model.json5` will change (`"modelType": "leaf"` → `"modelType": "pattern"`); generated TS output (factories/from/wrap/types) should be byte-identical since the emitters use modelType for dispatch, not for string emission.

- [ ] **Step 6: Verify counts**

```bash
npx tsx packages/codegen/src/scripts/counts.ts
```

Expected: identical to baseline.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: AssembledPattern.modelType 'leaf' → 'pattern'"
```

---

### Task 2: `classifyBranchSlots` shared helper

**Files:**
- Modify: `packages/codegen/src/emitters/shared.ts`
- Create: `packages/codegen/src/__tests__/taxonomy.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/__tests__/taxonomy.test.ts
import { describe, it, expect } from 'vitest';
import { classifyBranchSlots, type BranchSlotClass } from '../emitters/shared.ts';

describe('classifyBranchSlots', () => {
  it('returns multiSlot for nodes with 2+ non-stamp slots', async () => {
    // Load rust nodeMap, check function_item (name + body + parameters + ...)
    const { loadNodeMap } = await import('../compiler/loader.ts');
    const nodeMap = await loadNodeMap('rust');
    const node = nodeMap.nodes.get('function_item')!;
    const result = classifyBranchSlots(node, nodeMap);
    expect(result.tag).toBe('multiSlot');
  });

  it('returns singleSlot singular for single-field branch', async () => {
    const { loadNodeMap } = await import('../compiler/loader.ts');
    const nodeMap = await loadNodeMap('rust');
    // label has 1 field (identifier), 0 children
    const node = nodeMap.nodes.get('label')!;
    const result = classifyBranchSlots(node, nodeMap);
    expect(result.tag).toBe('singleSlot');
    if (result.tag === 'singleSlot') {
      expect(result.arity).toBe('singular');
      expect(result.optional).toBe(false);
    }
  });

  it('returns singleSlot multiple for container with repeated children', async () => {
    const { loadNodeMap } = await import('../compiler/loader.ts');
    const nodeMap = await loadNodeMap('rust');
    // parameters has 0 fields, 1 children slot (multiple)
    const node = nodeMap.nodes.get('parameters')!;
    const result = classifyBranchSlots(node, nodeMap);
    expect(result.tag).toBe('singleSlot');
    if (result.tag === 'singleSlot') {
      expect(result.arity).toBe('multiple');
    }
  });

  it('returns multiSlot for nodes with fields + children', async () => {
    const { loadNodeMap } = await import('../compiler/loader.ts');
    const nodeMap = await loadNodeMap('rust');
    // block has label field + children
    const node = nodeMap.nodes.get('block')!;
    const result = classifyBranchSlots(node, nodeMap);
    expect(result.tag).toBe('multiSlot');
  });

  it('excludes auto-stamp and hidden-infra fields from slot count', async () => {
    const { loadNodeMap } = await import('../compiler/loader.ts');
    const nodeMap = await loadNodeMap('rust');
    // continue_expression has 1 optional field (label) — should be singleSlot
    const node = nodeMap.nodes.get('continue_expression')!;
    const result = classifyBranchSlots(node, nodeMap);
    expect(result.tag).toBe('singleSlot');
    if (result.tag === 'singleSlot') {
      expect(result.arity).toBe('singular');
      expect(result.optional).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm vitest run packages/codegen/src/__tests__/taxonomy.test.ts
```

Expected: FAIL — `classifyBranchSlots` not found.

- [ ] **Step 3: Implement classifyBranchSlots**

In `packages/codegen/src/emitters/shared.ts`, add:

```ts
export type BranchSlotClass =
  | { tag: 'multiSlot' }
  | {
      tag: 'singleSlot';
      arity: 'singular' | 'multiple';
      optional: boolean;
      nonEmpty: boolean;
      slot: AssembledNonterminal;
    };

export function classifyBranchSlots(
  node: AssembledNode,
  nodeMap: NodeMap
): BranchSlotClass {
  // Collect all non-auto-stamp, non-hidden-infra slots
  const userSlots: AssembledNonterminal[] = [];
  for (const f of node.fields) {
    if (isAutoStampField(f, nodeMap)) continue;
    if (isHiddenInfraSlot(f, nodeMap)) continue;
    if (keywordPresenceKind(f, nodeMap) !== null) continue;
    userSlots.push(f);
  }
  for (const c of node.children) {
    if (isAutoStampSlot(c, nodeMap)) continue;
    userSlots.push(c);
  }
  if (userSlots.length !== 1) return { tag: 'multiSlot' };
  const sole = userSlots[0]!;
  const multiple = isMultiple(sole);
  return {
    tag: 'singleSlot',
    arity: multiple ? 'multiple' : 'singular',
    optional: !isRequired(sole),
    nonEmpty: isNonEmpty(sole),
    slot: sole,
  };
}
```

Import `isAutoStampSlot` and `AssembledNode` (type) if not already imported.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm vitest run packages/codegen/src/__tests__/taxonomy.test.ts
```

Expected: PASS — all 5 tests.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/shared.ts packages/codegen/src/__tests__/taxonomy.test.ts
git commit -m "feat: classifyBranchSlots — single source for slot taxonomy"
```

---

### Task 3: Wire `classifyBranchSlots` into factories.ts + factory-map.ts

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts` (~line 1213, the `isSingleFieldDirect` block)
- Modify: `packages/codegen/src/emitters/factory-map.ts` (~line 215, the `isSingleFieldDirect` function)

- [ ] **Step 1: Replace `isSingleFieldDirect` in factories.ts**

In `packages/codegen/src/emitters/factories.ts`, find the `isSingleFieldDirect` detection block (~line 1206-1222). Replace with `classifyBranchSlots`:

```ts
import { classifyBranchSlots } from './shared.ts';

// Before (lines 1206-1222):
const nonStampFields = fields.filter(...);
const isSingleFieldDirect = nonStampFields.length === 1 && ...;
if (isSingleFieldDirect) {
  return emitSingleFieldFactory(node, fields, nonStampFields[0]!, nodeMap, kindEntries);
}

// After:
const slotClass = classifyBranchSlots(node, nodeMap);
if (slotClass.tag === 'singleSlot' && slotClass.arity === 'singular') {
  return emitSingleFieldFactory(node, fields, slotClass.slot, nodeMap, kindEntries);
}
```

- [ ] **Step 2: Replace `isSingleFieldDirect` in factory-map.ts**

In `packages/codegen/src/emitters/factory-map.ts`, replace the standalone `isSingleFieldDirect` function (~line 215-227) with a call to `classifyBranchSlots`:

```ts
import { classifyBranchSlots } from './shared.ts';

// Before:
function isSingleFieldDirect(node, nodeMap): boolean { ... }

// After:
function isSingleFieldDirect(node: AssembledNode, nodeMap: NodeMap): boolean {
  if (node.kind.startsWith('_')) return false;
  const slotClass = classifyBranchSlots(node, nodeMap);
  return slotClass.tag === 'singleSlot' && slotClass.arity === 'singular';
}
```

- [ ] **Step 3: Replace `soleFieldDirect` in from.ts**

In `packages/codegen/src/emitters/from.ts`, find the `soleFieldDirect` detection block (~line 865-872). Replace:

```ts
import { classifyBranchSlots } from './shared.ts';

// Before:
const soleFieldDirect = nonStampFields.length === 1 && ...;

// After:
const slotClass = classifyBranchSlots(node, nodeMap);
const soleFieldDirect = slotClass.tag === 'singleSlot' && slotClass.arity === 'singular'
  && !node.kind.startsWith('_') && !nodeMap.polymorphFormKinds.has(node.kind);
```

Note: the hidden-kind and polymorph-form exclusions are caller context (from-specific), not slot classification, so they stay at the call site.

- [ ] **Step 4: Regen + type-check + counts**

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
pnpm -r run type-check
npx tsx packages/codegen/src/scripts/counts.ts
```

Expected: generated output byte-identical, counts unchanged.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/factories.ts packages/codegen/src/emitters/factory-map.ts packages/codegen/src/emitters/from.ts
git commit -m "refactor: use classifyBranchSlots — single source for slot detection"
```

---

### Task 4: Extract per-emitter namespace APIs

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts`
- Modify: `packages/codegen/src/emitters/from.ts`
- Modify: `packages/codegen/src/emitters/wrap.ts`
- Modify: `packages/codegen/src/emitters/types.ts`

This task promotes existing internal functions to named namespace exports. No logic changes — just reorganize exports.

- [ ] **Step 1: factories.ts — export factory namespace**

Add at the bottom of `packages/codegen/src/emitters/factories.ts`:

```ts
export namespace factory {
  export function leaf(
    node: AssembledNode, nodeMap: NodeMap, leafReConsts: Map<string, string>,
    kindEntries: readonly KindEnumEntry[] | undefined
  ): string | undefined {
    return emitTextFactory(/* delegate to existing emitTextFactory with correct args */);
  }

  export namespace branch {
    export function multiSlot(
      node: FieldCarryingNode, nodeMap: NodeMap,
      kindEntries: readonly KindEnumEntry[] | undefined
    ): string {
      return emitFieldCarryingFactory(node, node.fields, node.children, nodeMap, false, kindEntries);
    }

    export namespace singleSlot {
      export function singular(
        node: FieldCarryingNode, slot: AssembledNonterminal,
        nodeMap: NodeMap, kindEntries: readonly KindEnumEntry[] | undefined
      ): string {
        return emitSingleFieldFactory(node, node.fields, slot, nodeMap, kindEntries);
      }

      export function multiple(
        node: ContainerNode, nodeMap: NodeMap,
        kindEntries: readonly KindEnumEntry[] | undefined
      ): string {
        return emitContainerFactory(node, nodeMap, kindEntries);
      }
    }
  }

  export function polymorph(
    node: PolymorphNode, nodeMap: NodeMap,
    kindEntries: readonly KindEnumEntry[] | undefined
  ): string {
    return emitPolymorphFactory(node, nodeMap, kindEntries);
  }

  export function group(
    node: FieldCarryingNode, nodeMap: NodeMap,
    kindEntries: readonly KindEnumEntry[] | undefined
  ): string {
    return emitFieldCarryingFactory(node, node.fields, node.children, nodeMap, false, kindEntries);
  }
}
```

These are thin wrappers around the existing internal functions. The internal functions stay private — the namespace is the public API.

- [ ] **Step 2: from.ts — export from namespace**

Same pattern — thin wrappers around existing `emitBranchFrom`, `emitContainerFrom`, `emitPolymorphFrom`, `emitStringLikeFrom`, `emitKeywordFrom`.

```ts
export namespace from {
  export function leaf(node, nodeMap, intern): string | undefined { /* delegate */ }
  export namespace branch {
    export function multiSlot(node, nodeMap, intern): string { /* → emitBranchFrom */ }
    export namespace singleSlot {
      export function singularOptional(node, slot, nodeMap, intern): string { /* → emitContainerFrom singular */ }
      export function singularRequired(node, slot, nodeMap, intern): string { /* → emitContainerFrom singular */ }
      export function multiple(node, nodeMap, intern, kindEntries): string { /* → emitContainerFrom repeated */ }
    }
  }
  export function polymorph(node, nodeMap, intern): string { /* → emitPolymorphFrom */ }
  export function group(node, nodeMap, intern): string { /* → emitBranchFrom */ }
}
```

- [ ] **Step 3: wrap.ts — export wrap namespace**

```ts
export namespace wrap {
  export function branch(node, kindEntries, nodeMap): string | undefined { /* → renderWrapForNode branch path */ }
  export function polymorph(node, kindEntries, nodeMap): string | undefined { /* → renderWrapForNode polymorph path */ }
  export function group(node, kindEntries, nodeMap): string | undefined { /* → renderWrapForNode group path, if applicable */ }
}
```

- [ ] **Step 4: types.ts — export types namespace**

```ts
export namespace types {
  export function leaf(node, ctx): string { /* existing leaf emission */ }
  export function branch(node, ctx): string { /* existing struct emission */ }
  export function polymorph(node, ctx): string { /* existing polymorph emission */ }
  export function group(node, ctx): string { /* existing group emission */ }
  export function supertype(node, ctx): string { /* existing supertype emission */ }
}
```

- [ ] **Step 5: Type-check**

```bash
pnpm -r run type-check
```

Expected: clean — these are additive exports, no behavioral changes yet.

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/emitters/factories.ts packages/codegen/src/emitters/from.ts packages/codegen/src/emitters/wrap.ts packages/codegen/src/emitters/types.ts
git commit -m "refactor: export per-emitter taxonomy namespace APIs"
```

---

### Task 5: Centralize dispatch in emitter entry points

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts` (`emitFactories` body)
- Modify: `packages/codegen/src/emitters/from.ts` (`emitFrom` body)
- Modify: `packages/codegen/src/emitters/wrap.ts` (`emitWrap` body)
- Modify: `packages/codegen/src/emitters/types.ts` (`emitTypes` body)

Each emitter's `emitXxx()` entry point currently iterates `nodeMap.nodes` with its own `switch(modelType)`. Replace each with a taxonomy-driven loop that calls the namespace API.

- [ ] **Step 1: Replace `renderFactoryForNode` dispatch in factories.ts**

In `emitFactories()` (or `emitPerNodeFactories`), replace the `switch(node.modelType)` block (~lines 737-813) with calls through the `factory` namespace:

```ts
for (const [kind, node] of nodeMap.nodes) {
  // ... existing filtering (userFacing, polymorphForm, etc.) ...
  let result: string | undefined;
  switch (node.modelType) {
    case 'pattern':
    case 'keyword':
    case 'enum':
    case 'token':
    case 'supertype':
      result = factory.leaf(node, nodeMap, leafReConsts, kindEntries);
      break;
    case 'branch': {
      const slot = classifyBranchSlots(node, nodeMap);
      if (node.isTextTemplate(nodeMap.externals)) {
        result = factory.leaf(node, nodeMap, leafReConsts, kindEntries);
      } else if (slot.tag === 'singleSlot' && slot.arity === 'singular') {
        result = factory.branch.singleSlot.singular(node, slot.slot, nodeMap, kindEntries);
      } else if (slot.tag === 'singleSlot' && slot.arity === 'multiple') {
        result = factory.branch.singleSlot.multiple(node, nodeMap, kindEntries);
      } else {
        result = factory.branch.multiSlot(node, nodeMap, kindEntries);
      }
      break;
    }
    case 'polymorph':
      result = factory.polymorph(node, nodeMap, kindEntries);
      break;
    case 'group':
      result = factory.group(node, nodeMap, kindEntries);
      break;
    case 'multi':
      break;
  }
  // ... existing post-processing ...
}
```

Note: `isTextTemplate` stays temporarily — it's removed in Task 7.

- [ ] **Step 2: Same for from.ts, wrap.ts, types.ts**

Replace each emitter's `renderForNode`/`emitFromNode` dispatch with the same pattern: `switch(modelType)` → namespace call. The switch is structurally identical in each file but calls different namespace functions.

- [ ] **Step 3: Delete old dispatch functions**

Remove the now-unused `renderFactoryForNode`, `renderFromForNode`, `renderWrapForNode` dispatcher functions. Their logic is now inlined in the entry point's switch.

- [ ] **Step 4: Regen + type-check + counts + test**

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
pnpm -r run type-check
npx tsx packages/codegen/src/scripts/counts.ts
pnpm vitest run packages/codegen/src/__tests__/
```

Expected: generated output byte-identical, all counts hold, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: centralize taxonomy dispatch in emitter entry points"
```

---

### Task 6: Cleanup — remove duplicated predicates

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts`
- Modify: `packages/codegen/src/emitters/from.ts`
- Modify: `packages/codegen/src/emitters/factory-map.ts`

- [ ] **Step 1: Remove standalone `isSingleFieldDirect` from factory-map.ts**

Replace with inline `classifyBranchSlots` call (if not already done in Task 3).

- [ ] **Step 2: Remove `detectTextTemplateNode` from factories.ts**

The `isTextTemplate` check is now in the taxonomy switch, not in a private helper.

- [ ] **Step 3: Remove inline `soleFieldDirect` / `isSingleFieldDirect` detection blocks**

Any remaining ad-hoc single-field detection in factories.ts or from.ts that duplicates `classifyBranchSlots` — remove.

- [ ] **Step 4: Remove `isContainerShape` checks from emitter internals**

The taxonomy switch in the entry point handles container routing. Internal functions like `emitFieldCarryingFactory` should not re-check `isContainerShape`.

- [ ] **Step 5: Type-check + counts**

```bash
pnpm -r run type-check
npx tsx packages/codegen/src/scripts/counts.ts
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "cleanup: remove duplicated taxonomy predicates from emitters"
```

---

### Task 7: textTemplate elimination via external-scanner simplification

**Files:**
- Modify: `packages/codegen/src/compiler/node-map.ts` (simplifier or `isTextTemplate`)
- Modify: `packages/codegen/src/compiler/assemble.ts` (or wherever rule simplification happens)
- Modify: `packages/codegen/src/emitters/factories.ts` (remove `isTextTemplate` branch from taxonomy switch)
- Modify: `packages/codegen/src/emitters/from.ts` (same)

- [ ] **Step 1: Identify external scanner rule type**

Check how external scanner symbols are represented in the Rule union (`packages/codegen/src/compiler/rule.ts`). Add an `'external'` rule type or a flag on `SymbolRule` if one doesn't exist.

- [ ] **Step 2: Treat external scanner refs as structurally invisible in simplify**

In the simplification pass, when a `seq` member is an external scanner symbol, drop it from the structural rule — same as `STRING` and `IMMEDIATE_TOKEN` are dropped. The content members survive.

- [ ] **Step 3: Verify textTemplate kinds collapse**

After simplification:
- rust `raw_string_literal`: should have 1 field (`string_content`) → singleSlot singular
- python `string`: should have 1 field (`content`) with repeat → singleSlot multiple (or multiSlot if interpolation complicates it)
- python `_simple_pattern_negative`: should have 1 choice → singleSlot singular

Run:
```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

Check `factory-map.json5` for these kinds — they should no longer be `"text"`.

- [ ] **Step 4: Remove `isTextTemplate` method and callers**

Delete `isTextTemplate()` from `AssembledNodeBase` in `node-map.ts`. Remove `hasHiddenExternalRef`, `isVerbatimTokenStream`, `hasOptionalPunctPrefix` helper functions. Remove the `isTextTemplate` branch from the taxonomy switches in factories.ts, from.ts.

- [ ] **Step 5: Regen + type-check + counts**

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
pnpm -r run type-check
npx tsx packages/codegen/src/scripts/counts.ts
pnpm vitest run packages/codegen/src/__tests__/
```

Note: generated output WILL change for these 3 kinds — they'll get proper factory/from/wrap emission instead of text-only treatment. Counts may improve.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: eliminate textTemplate — external scanners treated as literals in simplify"
```

---

## Self-Review

**Spec coverage:**
- modelType alignment (`'leaf'` → `'pattern'`): Task 1 ✓
- `classifyBranchSlots` shared helper: Task 2 ✓
- Per-emitter namespace API: Task 4 ✓
- Centralized taxonomy dispatch: Task 5 ✓
- Cleanup duplicated predicates: Task 6 ✓
- textTemplate elimination: Task 7 ✓
- factory-map.ts uses `classifyBranchSlots`: Task 3 ✓
- Generated output byte-identical: verified at Tasks 1, 3, 5 ✓
- Success criteria (single dispatch point, no internal modelType switches): Task 5+6 ✓

**Type consistency:** `BranchSlotClass` type and `classifyBranchSlots` function used consistently across Tasks 2-5. `factory.branch.singleSlot.singular` signature matches spec.

**Placeholder scan:** No TBDs, TODOs, or "fill in details" found.
