# Utils Common Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the shared `utils` runtime into `@sittir/common/utils` and align the stable helper contract to `withMethods(node, engine)` where `engine` is the narrow `{ render, toEdit }` callback surface.

**Architecture:** `@sittir/common/utils` owns the grammar-agnostic runtime implementation, including `withMethods(node, engine)`, guards, and storage coercers. Generated grammar `utils.ts` becomes a typed facade that re-exports shared runtime helpers, exposes a grammar-local `methodsEngine`, and keeps grammar-specific narrowing and trivia typing local. Generated `factories.ts` and `wrap.ts` must pass that engine explicitly so the public surface and generated internals use the same contract.

**Tech Stack:** TypeScript 6 / tsgo, pnpm workspaces, Vitest, `@sittir/common`, `@sittir/codegen`, generated grammar packages

---

## File structure

- `packages/common/src/utils.ts` — shared runtime owner of `withMethods(node, engine)`, guards, and coercers
- `packages/common/tests/utils-runtime.test.ts` — focused runtime tests for the common utils contract
- `packages/codegen/src/emitters/client-utils.ts` — emits grammar `utils.ts` as a typed facade over `@sittir/common/utils`
- `packages/codegen/src/emitters/factories.ts` — emits `withMethods(node, methodsEngine)` in generated factory surfaces
- `packages/codegen/src/emitters/wrap.ts` — emits `withMethods(node, methodsEngine)` in generated wrap surfaces
- `packages/codegen/src/__tests__/utils-engine-emit.test.ts` — focused codegen assertions for the emitted `utils.ts`, `factories.ts`, and `wrap.ts` shapes
- `packages/rust/package.json` — preserves the public `./utils` export path
- `packages/python/package.json` — preserves the public `./utils` export path
- `packages/typescript/package.json` — preserves the public `./utils` export path
- `packages/{rust,python,typescript}/src/utils.ts` — generated typed facade exporting `withMethods(node, engine)` and `methodsEngine`
- `packages/{rust,python,typescript}/src/factories.ts` — generated call sites pass `methodsEngine`
- `packages/{rust,python,typescript}/src/wrap.ts` — generated call sites pass `methodsEngine`
- `packages/rust/tests/utils-engine.test.ts` — consumer-facing regression for explicit `withMethods(node, methodsEngine)`
- `packages/rust/tests/trivia.test.ts` — regression coverage that `$trivia()` still behaves after the engine split

---

### Task 1: Revise the shared runtime contract in `@sittir/common/utils`

**Files:**

- Modify: `packages/common/src/utils.ts`
- Modify: `packages/common/tests/utils-runtime.test.ts`

- [ ] **Step 1: Write the failing common-runtime test for `withMethods(node, engine)`**

```ts
// packages/common/tests/utils-runtime.test.ts
import { describe, expect, it, vi } from 'vitest';
import { withMethods } from '../src/utils.ts';

describe('@sittir/common/utils runtime surface', () => {
	it('attaches render/edit helpers from the explicit engine surface', () => {
		const render = vi.fn(() => 'rendered');
		const toEdit = vi.fn((_node, startOrRange, endPos) => ({
			startPos: typeof startOrRange === 'number' ? startOrRange : startOrRange.startPos,
			endPos: typeof startOrRange === 'number' ? (endPos ?? startOrRange) : startOrRange.endPos,
			insertedText: 'rendered',
		}));
		const node = withMethods({ $type: 1, $source: 2, _name: 'x' }, { render, toEdit });

		expect(node.$render()).toBe('rendered');
		expect(node.$toEdit({ startPos: 0, endPos: 3 })).toEqual({
			startPos: 0,
			endPos: 3,
			insertedText: 'rendered',
		});
		expect(
			node.$replace({
				range: () => ({ startPos: 4, endPos: 7 }),
			}),
		).toEqual({
			startPos: 4,
			endPos: 7,
			insertedText: 'rendered',
		});
		expect(render).toHaveBeenCalledTimes(1);
		expect(toEdit).toHaveBeenCalledTimes(2);
	});
});
```

- [ ] **Step 2: Run the focused common test to verify it fails**

Run:

```bash
pnpm --filter @sittir/common exec vitest run tests/utils-runtime.test.ts -t "attaches render/edit helpers from the explicit engine surface"
```

Expected: FAIL because `withMethods` still treats the second argument as an arbitrary methods object instead of the `{ render, toEdit }` engine contract.

- [ ] **Step 3: Implement the narrow engine contract in common utils**

```ts
// packages/common/src/utils.ts
import type { AnyNodeData, AnyTreeNodeOf, ByteRange, Edit } from '@sittir/types';

export interface WithMethodsEngine {
	render(node: AnyNodeData): string;
	toEdit(node: AnyNodeData, startOrRange: number | ByteRange, endPos?: number): Edit;
}

export interface WithMethodsRuntime {
	$render(): string;
	$toEdit(startOrRange: number | ByteRange, endPos?: number): Edit;
	$replace(target: { range(): ByteRange }): Edit;
	$trivia(...args: unknown[]): unknown;
}

export function withMethods<T extends object>(node: T, engine: WithMethodsEngine): T & WithMethodsRuntime {
	return Object.assign(node, {
		$render(this: AnyNodeData): string {
			return engine.render(this);
		},
		$toEdit(this: AnyNodeData, startOrRange: number | ByteRange, endPos?: number): Edit {
			return engine.toEdit(this, startOrRange, endPos);
		},
		$replace(this: AnyNodeData, target: { range(): ByteRange }): Edit {
			return engine.toEdit(this, target.range());
		},
		$trivia(this: AnyNodeData, ...items: unknown[]): AnyNodeData {
			if (items.length === 1 && typeof items[0] === 'object' && items[0] !== null && ('leading' in items[0] || 'trailing' in items[0])) {
				(this as Record<string, unknown>).$triviaData = items[0];
			} else {
				(this as Record<string, unknown>).$triviaData = { leading: items as AnyNodeData[] };
			}
			return this;
		},
	});
}
```

- [ ] **Step 4: Run common type-check and the focused runtime test**

Run:

```bash
pnpm --filter @sittir/common run type-check
pnpm --filter @sittir/common exec vitest run tests/utils-runtime.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the common-runtime contract change**

```bash
git add packages/common/src/utils.ts packages/common/tests/utils-runtime.test.ts
git commit -m "refactor: make common withMethods use engine callbacks"
```

---

### Task 2: Emit grammar `utils.ts` as a typed facade over the common runtime

**Files:**

- Modify: `packages/codegen/src/emitters/client-utils.ts`
- Create: `packages/codegen/src/__tests__/utils-engine-emit.test.ts`

- [ ] **Step 1: Write the failing codegen emission test for the utils facade**

```ts
// packages/codegen/src/__tests__/utils-engine-emit.test.ts
import { describe, expect, it } from 'vitest';
import { emitClientUtils } from '../emitters/client-utils.ts';
import { makeMinimalNodeMap } from './native-transport-emit.test.ts';

describe('utils engine facade emission', () => {
	it('emits a grammar-local methodsEngine plus explicit withMethods(node, engine)', () => {
		const contents = emitClientUtils({ nodeMap: makeMinimalNodeMap() });

		expect(contents).toContain("import { withMethods as withCommonMethods");
		expect(contents).toContain("from '@sittir/common/utils'");
		expect(contents).toContain('export const methodsEngine = {');
		expect(contents).toContain('export function withMethods<T extends object>(');
		expect(contents).toContain('engine: typeof methodsEngine');
		expect(contents).toContain('return withCommonMethods(node, engine);');
		expect(contents).not.toContain('$render(this: AnyNodeData): string { return render(this); }');
	});
});
```

- [ ] **Step 2: Run the focused codegen test to verify it fails**

Run:

```bash
pnpm --filter @sittir/codegen exec vitest run src/__tests__/utils-engine-emit.test.ts -t "emits a grammar-local methodsEngine plus explicit withMethods(node, engine)"
```

Expected: FAIL because `client-utils.ts` still emits the runtime body inline and does not emit `methodsEngine`.

- [ ] **Step 3: Rewrite the emitted utils surface around common runtime + local engine**

```ts
// packages/codegen/src/emitters/client-utils.ts
lines.push("import { withMethods as withCommonMethods, isNodeData, isTreeNode, hasKind, coerceBooleanKeywordStorage, coerceBitflagStorage } from '@sittir/common/utils';");
lines.push("import type { WithMethodsEngine } from '@sittir/common/utils';");
lines.push("import { kindIdFromName } from './types.js';");
lines.push("import { render, toEdit } from './boundary.ts';");
lines.push('');
lines.push('export const methodsEngine: WithMethodsEngine = {');
lines.push('  render(node) { return render(node); },');
lines.push('  toEdit(node, startOrRange, endPos) { return toEdit(node, startOrRange, endPos); },');
lines.push('};');
lines.push('');
lines.push('export function withMethods<T extends object>(');
lines.push('  node: T,');
lines.push('  engine: typeof methodsEngine');
lines.push(`): T & {
  $render(): string;
  $toEdit(startOrRange: number | ByteRange, endPos?: number): Edit;
  $replace(target: { range(): ByteRange }): Edit;
  $trivia(...args: ${buildTriviaParamType(triviaTypeNames)}[]): AnyNodeData;
} {`);
lines.push('  return withCommonMethods(node, engine);');
lines.push('}');
```

- [ ] **Step 4: Run codegen type-check and the focused facade test**

Run:

```bash
pnpm --filter @sittir/codegen run type-check
pnpm --filter @sittir/codegen exec vitest run src/__tests__/utils-engine-emit.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the utils-emitter facade change**

```bash
git add packages/codegen/src/emitters/client-utils.ts packages/codegen/src/__tests__/utils-engine-emit.test.ts
git commit -m "refactor: emit utils facade around common runtime"
```

---

### Task 3: Pass the explicit engine through generated factory and wrap surfaces

**Files:**

- Modify: `packages/codegen/src/emitters/factories.ts`
- Modify: `packages/codegen/src/emitters/wrap.ts`
- Modify: `packages/codegen/src/__tests__/utils-engine-emit.test.ts`

- [ ] **Step 1: Extend the codegen test to assert factory and wrap call sites pass `methodsEngine`**

```ts
// packages/codegen/src/__tests__/utils-engine-emit.test.ts
import { emitFactories } from '../emitters/factories.ts';
import { emitWrap } from '../emitters/wrap.ts';

it('emits factory and wrap call sites with the explicit methodsEngine argument', () => {
	const nodeMap = makeMinimalNodeMap();
	const factoriesSrc = emitFactories({ grammar: 'synth', nodeMap });
	const wrapSrc = emitWrap({ grammar: 'synth', nodeMap });

	expect(factoriesSrc).toContain('import { withMethods, methodsEngine');
	expect(factoriesSrc).toContain('}, methodsEngine);');
	expect(wrapSrc).toContain('import { withMethods, methodsEngine');
	expect(wrapSrc).toContain('}, methodsEngine);');
});
```

- [ ] **Step 2: Run the focused codegen test to verify it fails**

Run:

```bash
pnpm --filter @sittir/codegen exec vitest run src/__tests__/utils-engine-emit.test.ts -t "emits factory and wrap call sites with the explicit methodsEngine argument"
```

Expected: FAIL because both emitters still generate one-arg `withMethods(...)` calls.

- [ ] **Step 3: Update both emitters to import and pass `methodsEngine`**

```ts
// packages/codegen/src/emitters/factories.ts
lines.push("import { withMethods, methodsEngine, coerceBooleanKeywordStorage } from './utils.js';");
lines.push('  return withMethods({');
lines.push(`    $type: ${kindExpr} as const,`);
lines.push(...fieldStorageLines);
lines.push(...methodLines);
lines.push('  }, methodsEngine);');
```

```ts
// packages/codegen/src/emitters/wrap.ts
lines.push("import { withMethods, methodsEngine, coerceBooleanKeywordStorage } from './utils.js';");
lines.push('  const _node = withMethods({');
lines.push('    ...data,');
lines.push(`    $type: ${kindExpr} as const,`);
lines.push(...fieldLines);
lines.push(...accessorLines);
lines.push('  }, methodsEngine);');
```

- [ ] **Step 4: Run codegen type-check and the full focused emission test file**

Run:

```bash
pnpm --filter @sittir/codegen run type-check
pnpm --filter @sittir/codegen exec vitest run src/__tests__/utils-engine-emit.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the explicit-engine emitter changes**

```bash
git add packages/codegen/src/emitters/factories.ts packages/codegen/src/emitters/wrap.ts packages/codegen/src/__tests__/utils-engine-emit.test.ts
git commit -m "refactor: pass methodsEngine through generated surfaces"
```

---

### Task 4: Regenerate grammar packages and prove the public utils surface still works

**Files:**

- Modify: `packages/rust/package.json`
- Modify: `packages/python/package.json`
- Modify: `packages/typescript/package.json`
- Modify: `packages/rust/src/utils.ts`
- Modify: `packages/python/src/utils.ts`
- Modify: `packages/typescript/src/utils.ts`
- Modify: `packages/rust/src/factories.ts`
- Modify: `packages/python/src/factories.ts`
- Modify: `packages/typescript/src/factories.ts`
- Modify: `packages/rust/src/wrap.ts`
- Modify: `packages/python/src/wrap.ts`
- Modify: `packages/typescript/src/wrap.ts`
- Create: `packages/rust/tests/utils-engine.test.ts`
- Modify: `packages/rust/tests/trivia.test.ts`

- [ ] **Step 1: Write the failing consumer regression for explicit `withMethods(node, methodsEngine)`**

```ts
// packages/rust/tests/utils-engine.test.ts
import { describe, expect, it } from 'vitest';
import { TSKindId } from '../src/types.ts';
import { withMethods, methodsEngine } from '../src/utils.ts';

describe('utils facade surface', () => {
	it('attaches render/edit helpers through the exported methodsEngine', () => {
		const node = withMethods(
			{ $type: TSKindId.Identifier, $source: 2, $named: true, $text: 'main' },
			methodsEngine,
		);

		expect(node.$render()).toBe('main');
		expect(node.$toEdit({ startPos: 0, endPos: 4 })).toEqual({
			startPos: 0,
			endPos: 4,
			insertedText: 'main',
		});
		expect(
			node.$replace({
				range: () => ({ startPos: 1, endPos: 3 }),
			}),
		).toEqual({
			startPos: 1,
			endPos: 3,
			insertedText: 'main',
		});
	});
});
```

- [ ] **Step 2: Run the focused consumer test to verify it fails**

Run:

```bash
pnpm --filter @sittir/rust exec vitest run tests/utils-engine.test.ts
```

Expected: FAIL because the generated rust package does not yet export `methodsEngine` or the explicit two-arg `withMethods` facade.

- [ ] **Step 3: Add grammar package exports, regenerate, and preserve the public `./utils` path**

```json
// packages/rust/package.json
{
	"exports": {
		".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
		"./utils": { "types": "./dist/utils.d.ts", "import": "./dist/utils.js" }
	}
}
```

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
```

- [ ] **Step 4: Run grammar-package type-checks and focused regressions**

Run:

```bash
pnpm --filter @sittir/rust run type-check
pnpm --filter @sittir/python run type-check
pnpm --filter @sittir/typescript run type-check
pnpm --filter @sittir/rust exec vitest run tests/utils-engine.test.ts tests/trivia.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the regenerated grammar surfaces**

```bash
git add packages/rust/package.json packages/python/package.json packages/typescript/package.json \
	packages/rust/src/utils.ts packages/python/src/utils.ts packages/typescript/src/utils.ts \
	packages/rust/src/factories.ts packages/python/src/factories.ts packages/typescript/src/factories.ts \
	packages/rust/src/wrap.ts packages/python/src/wrap.ts packages/typescript/src/wrap.ts \
	packages/rust/tests/utils-engine.test.ts packages/rust/tests/trivia.test.ts
git commit -m "refactor: regenerate utils engine surfaces"
```

---

## Self-review checklist

- Spec coverage:
  - shared runtime owner in common → Task 1
  - stable `withMethods(node, engine)` contract → Tasks 1-4
  - grammar-local typed facade + guards/trivia typing → Task 2
  - generated internals passing explicit engine → Task 3
  - regenerated grammar packages + public `./utils` path → Task 4
- Placeholder scan: no `TBD`, `TODO`, or implicit “handle later” steps remain
- Type consistency:
  - shared runtime interface name: `WithMethodsEngine`
  - grammar-local exported engine name: `methodsEngine`
  - stable helper signature: `withMethods(node, engine)`
