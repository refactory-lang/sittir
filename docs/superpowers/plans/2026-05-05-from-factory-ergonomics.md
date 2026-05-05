# `.from()` & Factory Ergonomics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close five ergonomic gaps in the factory and `.from()` resolver APIs — optional config, default-empty required fields, array/single auto-wrap, and single-field direct signatures.

**Architecture:** All changes are in two codegen emitter files (`factories.ts` and `from.ts`). No core runtime changes. The emitters inspect the assembled model and emit different signatures/bodies based on slot cardinality, optionality, and container shape. A new `_wrapWithChildren` dispatch table is generated per grammar into `from.ts`.

**Tech Stack:** TypeScript 6.0.2, `@sittir/codegen` emitter pipeline, vitest for testing.

---

## File Map

| File | Responsibility | Tasks |
|---|---|---|
| `packages/codegen/src/emitters/factories.ts` | Factory signature emission | 1, 3 |
| `packages/codegen/src/emitters/from.ts` | `.from()` resolver emission | 2, 4, 5 |
| `packages/codegen/src/__tests__/factory-ergonomics.test.ts` | Unit tests for all 5 gaps | 1–5 |

No new files created. Two emitter files modified, one test file created.

---

### Task 1: Gap 1 — Optional config on all-optional-field factories

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts` (~line 1197–1250)
- Test: `packages/codegen/src/__tests__/factory-ergonomics.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// packages/codegen/src/__tests__/factory-ergonomics.test.ts
import { describe, it, expect } from 'vitest';

describe('factory ergonomics', () => {
  describe('Gap 1: optional config on all-optional-field factories', () => {
    it('emits config?: when all fields are optional and children default to []', async () => {
      // Use rust's `block` — all fields optional, has $children
      const { readFileSync } = await import('node:fs');
      const { resolve } = await import('node:path');
      const content = readFileSync(
        resolve(import.meta.dirname, '../../../rust/src/factories.ts'),
        'utf-8'
      );
      // block(config?: T.Block.Config) — note the ?
      expect(content).toMatch(/export function block\(config\?:/);
      // The body should default config to {}
      expect(content).toMatch(/const _config = config \?\? \{\}/);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/codegen && pnpm test -- --reporter=verbose -t "Gap 1"`
Expected: FAIL — `block(config:` not `block(config?:`

- [ ] **Step 3: Implement — modify `emitFieldCarryingFactory`**

In `packages/codegen/src/emitters/factories.ts`, find the function signature emission at ~line 1202:

```ts
lines.push(`export function ${fn}(config${opt}: ${configType}) {`);
```

When `opt === '?'`, the signature already has `config?:`. But the body reads `config.children`, `config.label` etc. without handling `undefined` config. Add a default:

After the function signature line, when `opt === '?'`, emit:
```ts
if (opt === '?') {
    lines.push(`  const _config = config ?? {};`);
}
```

Then change all `config${opt}.` reads to use `_config.` when opt is `'?'`:
- Storage hoists: `const _label = _config.label;` (instead of `config?.label`)
- Children init: `const children = _config.children ?? [];`

The key insight: with `config ?? {}`, every field read on `_config` is safe because all fields are optional (that's what `opt === '?'` means). No optional chaining needed on `_config`.

- [ ] **Step 4: Regen rust + verify test passes**

```bash
SITTIR_QUIET=1 npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
cd packages/codegen && pnpm test -- -t "Gap 1"
```

- [ ] **Step 5: Verify counts unchanged**

```bash
SITTIR_QUIET=1 npx tsx packages/codegen/src/scripts/counts.ts rust 2>/dev/null
```

Expected: fromPass=154, rtPass=121, factoryPass=424 (unchanged)

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/emitters/factories.ts packages/codegen/src/__tests__/factory-ergonomics.test.ts
git commit -m "feat(ergonomics): Gap 1 — optional config on all-optional-field factories"
```

---

### Task 2: Gap 5 — Single-field factory signatures

**Files:**
- Modify: `packages/codegen/src/emitters/factories.ts` (~line 1197–1300)
- Test: `packages/codegen/src/__tests__/factory-ergonomics.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('Gap 5: single-field factory signatures', () => {
  it('emits direct-value signature for single-field-no-children factories', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const content = readFileSync(
      resolve(import.meta.dirname, '../../../rust/src/factories.ts'),
      'utf-8'
    );
    // label(identifier: ...) — direct value, not label(config: T.Label.Config)
    expect(content).toMatch(/export function label\(identifier:/);
    // Should NOT have a config parameter
    expect(content).not.toMatch(/export function label\(config/);
  });

  it('keeps config form for single-field-with-children factories', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const content = readFileSync(
      resolve(import.meta.dirname, '../../../rust/src/factories.ts'),
      'utf-8'
    );
    // block has label (1 field) + children — must keep config form
    expect(content).toMatch(/export function block\(config/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/codegen && pnpm test -- -t "Gap 5"`
Expected: FAIL — `label(config:` not `label(identifier:`

- [ ] **Step 3: Implement — detect and emit single-field signature**

In `packages/codegen/src/emitters/factories.ts`, in `emitFieldCarryingFactory`, after computing `fields`, `children`, `opt`, add a detection check:

```ts
const nonStampFields = fields.filter((f) => autoStampExpression(f, nodeMap) === undefined);
const isSingleFieldNoChildren = nonStampFields.length === 1 && !hasChildren;
```

When `isSingleFieldNoChildren`, emit a direct-value signature instead of the config-object signature:

```ts
if (isSingleFieldNoChildren) {
    const f = nonStampFields[0]!;
    const elemType = fieldElementType(f, nodeMap);
    const paramType = isAllLeafSlot(f, nodeMap)
        ? elemType  // leaf-typed: take the wrapper, factory hoists .$text
        : elemType;
    lines.push(`export function ${fn}(${f.propertyName}: ${paramType}) {`);
    // Storage hoist uses the param directly
    lines.push(`  const _${f.name} = ${f.propertyName}${isAllLeafSlot(f, nodeMap) ? '.$text' : ''};`);
    // ... rest of literal emission unchanged
}
```

The `$with` setter and `_config` references need to adapt: the setter rebuilds via `fn(value)` (direct call), not `fn({...config, key: value})`.

For auto-stamp fields that are the ONLY field (e.g., stamped constant), skip — those factories already work with no args.

- [ ] **Step 4: Regen + test**

```bash
SITTIR_QUIET=1 npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
cd packages/codegen && pnpm test -- -t "Gap 5"
```

- [ ] **Step 5: Type-check all grammars**

```bash
find packages -name '*.tsbuildinfo' -delete
pnpm -r run type-check
```

- [ ] **Step 6: Verify counts**

```bash
SITTIR_QUIET=1 npx tsx packages/codegen/src/scripts/counts.ts 2>/dev/null
```

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/emitters/factories.ts packages/codegen/src/__tests__/factory-ergonomics.test.ts
git commit -m "feat(ergonomics): Gap 5 — single-field factories take value directly"
```

---

### Task 3: Gap 2 — Default empty for required container fields in `.from()`

**Files:**
- Modify: `packages/codegen/src/emitters/from.ts` (~line 790–800, `resolveFieldFromTypedInput` area)
- Modify: `packages/codegen/src/emitters/factories.ts` (expose `resolveConfigOptional` or add metadata)
- Test: `packages/codegen/src/__tests__/factory-ergonomics.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
describe('Gap 2: omitted required fields default to empty', () => {
  it('emits ?? F.block() fallback for required single-kind container fields', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const content = readFileSync(
      resolve(import.meta.dirname, '../../../rust/src/from.ts'),
      'utf-8'
    );
    // functionItemFrom should default body to F.block()
    expect(content).toMatch(/body:.*\?\? F\.block\(\)/);
    // functionItemFrom should default parameters to F.parameters()
    expect(content).toMatch(/parameters:.*\?\? F\.parameters\(\)/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/codegen && pnpm test -- -t "Gap 2"`
Expected: FAIL — no `?? F.block()` in the output

- [ ] **Step 3: Implement — add default-empty detection**

In `packages/codegen/src/emitters/from.ts`, in the function `resolveFieldFromTypedInput`, after computing the resolver call string, check if the field qualifies for default-empty:

A field qualifies when:
1. `isRequired(field)` is true
2. The field's `values` resolve to exactly ONE kind (single NodeRef, not a union)
3. That kind's factory has an optional config (`resolveConfigOptional` returns `'?'` for it)

Add a helper in `from.ts`:

```ts
function canDefaultToEmpty(
    field: AssembledNonterminal,
    nodeMap: NodeMap
): string | null {
    if (!isRequired(field)) return null;
    const kinds = slotKindNames(field);
    if (kinds.length !== 1) return null;
    const targetKind = kinds[0]!;
    const targetNode = nodeMap.nodes.get(targetKind);
    if (!targetNode) return null;
    if (targetNode.modelType !== 'branch' && targetNode.modelType !== 'group') return null;
    // Check if the target's factory has all-optional config
    const targetFields = targetNode.fields;
    const targetChildren = targetNode.children;
    const allOptional = !targetFields.some(
        (f) => isRequired(f) && autoStampExpression(f, nodeMap) === undefined
    ) && !targetChildren.some((c) => isRequired(c) && !isAutoStampSlot(c, nodeMap));
    if (!allOptional) return null;
    return targetNode.rawFactoryName ?? null;
}
```

Then in the emission site, wrap the resolver call:

```ts
const resolverCall = resolveFieldCall(access, field, isMultiple(field), nodeMap, intern);
const defaultFactory = canDefaultToEmpty(field, nodeMap);
if (defaultFactory) {
    return `${resolverCall} ?? F.${defaultFactory}()`;
}
return resolverCall;
```

- [ ] **Step 4: Regen + test**

```bash
SITTIR_QUIET=1 npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
cd packages/codegen && pnpm test -- -t "Gap 2"
```

- [ ] **Step 5: Verify counts — fromPass should improve**

```bash
SITTIR_QUIET=1 npx tsx packages/codegen/src/scripts/counts.ts rust 2>/dev/null
```

Expected: fromPass >= 154 (may improve if previously-failing kinds now resolve)

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/emitters/from.ts packages/codegen/src/__tests__/factory-ergonomics.test.ts
git commit -m "feat(ergonomics): Gap 2 — default empty for required container fields"
```

---

### Task 4: Gaps 3+4 — Array and single-value auto-wrap with `_wrapWithChildren`

**Files:**
- Modify: `packages/codegen/src/emitters/from.ts` (emit `_wrapWithChildren` table + update `_resolveOneBranch`)
- Test: `packages/codegen/src/__tests__/factory-ergonomics.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
describe('Gap 3: array at wrapper position auto-wraps', () => {
  it('emits _wrapWithChildren dispatch table', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const content = readFileSync(
      resolve(import.meta.dirname, '../../../rust/src/from.ts'),
      'utf-8'
    );
    expect(content).toContain('function _wrapWithChildren');
    // Should have entries for container-shaped kinds
    expect(content).toMatch(/'block':\s*\(children\)/);
    expect(content).toMatch(/'parameters':\s*\(children\)/);
  });

  it('_resolveOneBranch handles arrays by wrapping with children', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const content = readFileSync(
      resolve(import.meta.dirname, '../../../rust/src/from.ts'),
      'utf-8'
    );
    // _resolveOneBranch should check Array.isArray before the object check
    expect(content).toMatch(/Array\.isArray\(v\).*_wrapWithChildren/s);
  });
});

describe('Gap 4: single value at wrapper position auto-wraps', () => {
  it('_resolveOneBranch wraps non-matching NodeData as single child', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const content = readFileSync(
      resolve(import.meta.dirname, '../../../rust/src/from.ts'),
      'utf-8'
    );
    // Should check $type !== kindId and wrap
    expect(content).toMatch(/isNodeData\(v\).*\$type.*_wrapWithChildren/s);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/codegen && pnpm test -- -t "Gap 3|Gap 4"`
Expected: FAIL — no `_wrapWithChildren` in output

- [ ] **Step 3: Implement — emit `_wrapWithChildren` dispatch table**

In `packages/codegen/src/emitters/from.ts`, after the existing helper emission block, add a new function that emits the `_wrapWithChildren` table:

```ts
function emitWrapWithChildrenTable(
    lines: string[],
    nodeMap: NodeMap,
    kindEntries: readonly KindEnumEntry[] | undefined
): void {
    // Collect kinds that have $children (container-shaped or mixed)
    const wrapEntries: { kind: string; factoryName: string; isContainer: boolean }[] = [];
    for (const [kind, node] of nodeMap.nodes) {
        if (!node.userFacing) continue;
        if (!node.rawFactoryName) continue;
        if (node.modelType !== 'branch' && node.modelType !== 'group') continue;
        if (node.children.length === 0) continue;
        wrapEntries.push({
            kind,
            factoryName: node.rawFactoryName,
            isContainer: node.modelType === 'branch' && node.isContainerShape
        });
    }
    if (wrapEntries.length === 0) return;

    lines.push('function _wrapWithChildren(kind: string, children: unknown[]): unknown {');
    lines.push('  switch (kind) {');
    for (const entry of wrapEntries) {
        if (entry.isContainer) {
            // Container factories take rest params
            lines.push(`    case '${entry.kind}': return F.${entry.factoryName}(...children);`);
        } else {
            // Mixed factories take config with children key
            lines.push(`    case '${entry.kind}': return F.${entry.factoryName}({ children } as any);`);
        }
    }
    lines.push('  }');
    lines.push('  return undefined;');
    lines.push('}');
    lines.push('');

    // Also emit the set of kinds that support wrapping
    lines.push('const _wrapKinds = new Set([');
    for (const entry of wrapEntries) {
        lines.push(`  '${entry.kind}',`);
    }
    lines.push(']);');
    lines.push('');
}
```

Call this in `emitFrom`'s helper emission block.

- [ ] **Step 4: Implement — update `_resolveOneBranch`**

In the `_resolveOneBranch` emission (line ~1969), add array handling and $type-mismatch handling:

```ts
// Current:
lines.push('function _resolveOneBranch<T>(v: _FromFieldInput, kind: string): T {');
lines.push('  if (v === undefined || v === null) return v as T;');
lines.push('  if (isNodeData(v)) return v as T;');

// New:
lines.push('function _resolveOneBranch<T>(v: _FromFieldInput, kind: string): T {');
lines.push('  if (v === undefined || v === null) return v as T;');
// Gap 4: NodeData with matching $type → pass through; non-matching + wrapKind → wrap
lines.push('  if (isNodeData(v)) {');
lines.push('    if (_wrapKinds.has(kind) && v.$type !== kindIdFromName(kind)) {');
lines.push('      return _wrapWithChildren(kind, [v]) as T;');
lines.push('    }');
lines.push('    return v as T;');
lines.push('  }');
// Gap 3: Array → resolve each element, wrap
lines.push('  if (Array.isArray(v) && _wrapKinds.has(kind)) {');
lines.push('    const resolved = v.map(e => {');
lines.push('      if (typeof e === "string" || typeof e === "number") return e;');
lines.push('      if (isNodeData(e)) return e;');
lines.push('      if (typeof e === "object" && e !== null) return _resolveByKind(kind, e);');
lines.push('      return e;');
lines.push('    });');
lines.push('    return _wrapWithChildren(kind, resolved) as T;');
lines.push('  }');
// Existing object handling follows...
```

Note: `kindIdFromName` is already imported in the generated from.ts. It returns the numeric TSKindId for a kind string.

- [ ] **Step 5: Regen all grammars + test**

```bash
SITTIR_QUIET=1 npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
SITTIR_QUIET=1 npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
SITTIR_QUIET=1 npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
cd packages/codegen && pnpm test -- -t "Gap 3|Gap 4"
```

- [ ] **Step 6: Type-check + counts**

```bash
find packages -name '*.tsbuildinfo' -delete
pnpm -r run type-check
SITTIR_QUIET=1 npx tsx packages/codegen/src/scripts/counts.ts 2>/dev/null
```

Expected: All counts hold or improve. fromPass may increase (new resolution paths).

- [ ] **Step 7: Commit**

```bash
git add packages/codegen/src/emitters/from.ts packages/codegen/src/__tests__/factory-ergonomics.test.ts
git commit -m "feat(ergonomics): Gaps 3+4 — array/single auto-wrap via _wrapWithChildren"
```

---

### Task 5: Regen all grammars + full verification

**Files:**
- Regen: `packages/{rust,typescript,python}/src/factories.ts`, `from.ts`

- [ ] **Step 1: Regen all 3 grammars with native rebuild**

```bash
SITTIR_QUIET=1 npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
SITTIR_QUIET=1 npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
SITTIR_QUIET=1 npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

- [ ] **Step 2: Full workspace type-check**

```bash
find packages -name '*.tsbuildinfo' -delete
pnpm -r run type-check
```

Expected: Zero errors across all 6 packages.

- [ ] **Step 3: Full test suite**

```bash
cd packages/codegen && pnpm test
```

Expected: 660+ tests pass, 0 failed.

- [ ] **Step 4: Counts report**

```bash
SITTIR_QUIET=1 npx tsx packages/codegen/src/scripts/counts.ts 2>/dev/null
```

Report per-grammar deltas vs baseline:
- rust: fromPass=154, covPass=177, rtPass=121, factoryPass=424
- typescript: fromPass=145, covPass=176, rtPass=99, factoryPass=392
- python: fromPass=111, covPass=106, rtPass=109, factoryPass=180

- [ ] **Step 5: Commit regen**

```bash
git add packages/rust packages/typescript packages/python
git commit -m "regen: factories + from for .from() & factory ergonomics"
```

---

## Self-Review

**Spec coverage:**
- Gap 1 (optional config): Task 1 ✓
- Gap 2 (default empty): Task 3 ✓
- Gap 3 (array wrap): Task 4 ✓
- Gap 4 (single wrap): Task 4 ✓
- Gap 5 (single-field): Task 2 ✓
- Resolution flow diagram: Implemented across Tasks 3+4 ✓
- `.from()` accepts both direct + config for Gap 5: Task 2 note ✓

**Placeholder scan:** No TBD/TODO. All code blocks present.

**Type consistency:** `_wrapWithChildren`, `_wrapKinds`, `canDefaultToEmpty` — used consistently across tasks 3–4. `resolveConfigOptional` return value `'?'` — used consistently in tasks 1 and 3.
