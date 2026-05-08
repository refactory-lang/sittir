# Runtime Package Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split shared runtime contracts from the JS backend so `@sittir/types` stays type-only, `@sittir/common` becomes the internal shared runtime package, `@sittir/core` becomes the JS backend package, and `packages/validator` can later sit on top of the cleaned-up boundaries.

**Architecture:** Treat the current native/emitter repair as a prerequisite, not part of this implementation. Move backend-neutral runtime pieces out of `packages/core` into a new `packages/common`, narrow `packages/core` to JS-engine implementation only, then update the generated grammar engine wrappers to select native or dynamically load the JS backend explicitly. After the runtime split is stable, create `packages/validator` as the single canonical validation facade with explicit backend propagation and append-only JSONL history.

**Tech Stack:** TypeScript 6 / tsgo, pnpm workspaces, Vitest, web-tree-sitter, generated grammar packages, codegen emitters

---

## File structure

- `packages/common/package.json` — new internal shared runtime package manifest
- `packages/common/src/index.ts` — shared runtime public surface (`readNode`, edit/format/CST primitives, native-read helpers, engine interfaces)
- `packages/common/src/engine.ts` — backend-neutral engine interfaces and shared engine option types
- `packages/common/src/engine-boundary.ts` — backend-neutral engine types/exports
- `packages/common/src/*.ts` — migrated backend-neutral runtime files from `packages/core/src/`
- `packages/common/tests/*.test.ts` — focused tests for the new internal shared package
- `packages/core/package.json` — narrowed to JS backend semantics and dependencies
- `packages/core/src/index.ts` — JS-backend-only exports
- `packages/core/src/engine.ts` — JS backend implementation only; no generic grammar orchestration
- `packages/core/tests/*.test.ts` — JS backend tests after extraction
- `packages/codegen/src/emitters/engine.ts` — generated grammar engine wrapper emitter
- `packages/codegen/src/emitters/index-file.ts` — generated grammar package exports if engine export paths change
- `packages/codegen/src/cli.ts` — validator invocation path; must pass backend explicitly
- `packages/codegen/package.json` — dependency move from `@sittir/core` to `@sittir/common` where appropriate
- `packages/{rust,python,typescript}/src/engine.ts` — regenerated engine wrappers that import shared contracts from `@sittir/common` and dynamically load `@sittir/core`
- `packages/validator/package.json` — canonical validator facade package
- `packages/validator/src/index.ts` — validator entrypoint
- `packages/validator/src/history.ts` — append-only JSONL write/read helpers
- `packages/validator/src/run.ts` — single canonical counts/log runner
- `packages/validator/tests/*.test.ts` — validator facade and history tests
- `packages/validator/validation-history.jsonl` — durable checked-in append-only log
- `package.json` — root scripts for the canonical validator entrypoint

## Prerequisite gate

Do **not** start this plan until the active `023-native-read-parity` work is done enough that validator output is trustworthy again.

Minimum gate:

- `pnpm --filter @sittir/codegen exec vitest run src/__tests__/corpus-validation.test.ts`
- explicit-backend validator counts are stable and reproducible

---

### Task 1: Create `@sittir/common` as the internal shared runtime package

**Files:**

- Create: `packages/common/package.json`
- Create: `packages/common/tsconfig.json`
- Create: `packages/common/tsconfig.build.json`
- Create: `packages/common/src/index.ts`
- Create: `packages/common/src/engine.ts`
- Create: `packages/common/src/engine-boundary.ts`
- Create: `packages/common/tests/public-api.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing package-surface test**

```ts
// packages/common/tests/public-api.test.ts
import { describe, expect, it } from 'vitest';

describe('@sittir/common public API', () => {
	it('exports backend-neutral runtime primitives', async () => {
		const mod = await import('../src/index.ts');

		expect(typeof mod.readNode).toBe('function');
		expect(typeof mod.applyEdits).toBe('function');
		expect(typeof mod.applyFormat).toBe('function');
		expect(typeof mod.assertRenderableNodeData).toBe('function');
	});

	it('exports engine-boundary types/helpers from the engine subpath', async () => {
		const mod = await import('../src/engine-boundary.ts');
		expect(mod).toBeDefined();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sittir/common exec vitest run tests/public-api.test.ts`
Expected: FAIL because `packages/common` does not exist yet.

- [ ] **Step 3: Create the package skeleton**

```json
// packages/common/package.json
{
  "name": "@sittir/common",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./engine": {
      "types": "./dist/engine-boundary.d.ts",
      "import": "./dist/engine-boundary.js",
      "default": "./dist/engine-boundary.js"
    }
  },
  "scripts": {
    "build": "tsgo -p tsconfig.build.json",
    "clean": "rm -rf dist tsconfig.build.tsbuildinfo tsconfig.tsbuildinfo",
    "dev": "tsgo -p tsconfig.build.json --watch",
    "type-check": "tsgo --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@sittir/types": "workspace:*"
  }
}
```

```ts
// packages/common/src/engine.ts
export interface EngineOptions {
	readonly format?: FormatRecord;
	readonly backend?: 'auto' | 'native' | 'js' | 'wasm';
}

export interface SittirEngineReader {
	parseAndRead(source: string): ParseAndReadResult;
	readNode(handle: number, childIndex?: number): AnyNodeData;
}

export interface SittirEngineLike {
	render(node: AnyNodeData, options?: { ignoreFormat?: boolean }): string;
	applyEdits(source: string, edits: readonly Edit[]): string;
	dispose(): void;
	readonly reader?: SittirEngineReader;
}
```

```ts
// packages/common/src/index.ts
export { readNode } from './readNode.ts';
export type { TreeHandle } from './readNode.ts';
export { replace, bindRange, replaceField, applyEdits } from './edit.ts';
export { toCst } from './cst.ts';
export { applyFormat, rebaseTrivia } from './format.ts';
export { freezeNodeData, buildWithNamespace } from './nodeData.ts';
export { withMetrics, recordFfi, dumpMetrics, metricsEnabled } from './metrics.ts';
export {
	assertRenderableNodeData,
	isRenderableNodeData,
	assertNativeNodeData,
	isNativeNodeData
} from './native-boundary.ts';
```

```ts
// packages/common/src/engine-boundary.ts
export type {
	SittirEngineLike,
	SittirEngineReader,
	ParseAndReadResult,
	EngineOptions
} from './engine.ts';
```

- [ ] **Step 4: Move backend-neutral source files into `packages/common/src/`**

```text
Move/copy these files from packages/core/src/ into packages/common/src/:
- cst.ts
- edit.ts
- extract the shared interfaces from the current `packages/core/src/engine.ts` into the new `packages/common/src/engine.ts`
- format.ts
- metrics.ts
- native-boundary.ts
- native-read.ts
- nodeData.ts
- readNode.ts
```

- [ ] **Step 5: Run tests and type-check**

Run:

```bash
pnpm --filter @sittir/common run type-check
pnpm --filter @sittir/common exec vitest run tests/public-api.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add package.json packages/common
git commit -m "refactor: add shared runtime common package"
```

---

### Task 2: Narrow `@sittir/core` to the JS backend only

**Files:**

- Modify: `packages/core/package.json`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/engine.ts`
- Modify: `packages/core/src/engine-boundary.ts`
- Create: `packages/core/tests/js-backend-surface.test.ts`

- [ ] **Step 1: Write the failing JS-backend-surface test**

```ts
// packages/core/tests/js-backend-surface.test.ts
import { describe, expect, it } from 'vitest';

describe('@sittir/core JS backend surface', () => {
	it('exports JS-engine creation helpers', async () => {
		const mod = await import('../src/engine-boundary.ts');
		expect(typeof mod.createJsEngine).toBe('function');
	});

	it('does not re-export shared runtime primitives from the root entrypoint', async () => {
		const mod = await import('../src/index.ts');
		expect('readNode' in mod).toBe(false);
		expect('applyEdits' in mod).toBe(false);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sittir/core exec vitest run tests/js-backend-surface.test.ts`
Expected: FAIL because `packages/core` still exports shared primitives.

- [ ] **Step 3: Rewrite package exports and descriptions**

```json
// packages/core/package.json
{
  "description": "JavaScript backend implementation for sittir",
  "dependencies": {
    "@sittir/common": "workspace:*",
    "@sittir/types": "workspace:*",
    "nunjucks": "^3.2.4",
    "yaml": "^2.8.3",
    "web-tree-sitter": "^0.26.8"
  }
}
```

```ts
// packages/core/src/index.ts
export { createJsEngine, resolveEngineFormat } from './engine.ts';
export type { JsEngineOptions } from './engine.ts';
export { createRenderer } from './loader.ts';
export { createRendererFromConfig } from './render.ts';
export type { BoundRenderer, RulesConfig } from './render.ts';
```

```ts
// packages/core/src/engine-boundary.ts
export { createJsEngine, resolveEngineFormat } from './engine.ts';
export type {
	SittirEngineLike,
	SittirEngineReader,
	ParseAndReadResult,
	JsEngineOptions,
	EngineOptions
} from '@sittir/common/engine';
```

- [ ] **Step 4: Remove generic grammar orchestration from `packages/core/src/engine.ts`**

```ts
// packages/core/src/engine.ts
import type { JsEngineOptions, SittirEngineLike } from '@sittir/common/engine';
import { createRenderer } from './loader.ts';

export function createJsEngine(options: JsEngineOptions): SittirEngineLike {
	// keep JS parse/read/render ownership here
	// remove createGrammarEngine and generic native-selection wiring
}
```

- [ ] **Step 5: Run tests and type-check**

Run:

```bash
pnpm --filter @sittir/core run type-check
pnpm --filter @sittir/core exec vitest run tests/js-backend-surface.test.ts tests/*.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core
git commit -m "refactor: narrow core to js backend"
```

---

### Task 3: Update generated grammar engine wrappers to use `@sittir/common` and dynamic JS loading

**Files:**

- Modify: `packages/codegen/src/emitters/engine.ts`
- Modify: `packages/codegen/src/emitters/index-file.ts`
- Modify: `packages/codegen/package.json`
- Modify: `packages/rust/src/engine.ts` (generated)
- Modify: `packages/python/src/engine.ts` (generated)
- Modify: `packages/typescript/src/engine.ts` (generated)
- Test: `packages/rust/tests/engine.test.ts`
- Test: `packages/python/tests/engine.test.ts`
- Test: `packages/typescript/tests/engine.test.ts`

- [ ] **Step 1: Write the failing generated-engine expectation**

```ts
// packages/codegen/src/__tests__/engine-emit.test.ts
import { describe, expect, it } from 'vitest';
import { emitEngine } from '../emitters/engine.ts';

describe('engine emitter', () => {
	it('emits grammar wrappers against common contracts and a lazy JS backend loader', () => {
		const contents = emitEngine({ grammar: 'rust' });
		expect(contents).toContain("from '@sittir/common/engine'");
		expect(contents).toContain('loadJsBackend');
		expect(contents).not.toContain('createGrammarEngine(');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sittir/codegen exec vitest run src/__tests__/engine-emit.test.ts`
Expected: FAIL because the emitter still targets `@sittir/core/engine`.

- [ ] **Step 3: Change the engine emitter**

```ts
// packages/codegen/src/emitters/engine.ts
import type { SittirEngineLike, EngineOptions } from '@sittir/common/engine';

function loadJsBackend(): typeof import('@sittir/core') {
	return createRequire(import.meta.url)('@sittir/core') as typeof import('@sittir/core');
}

export function createEngine(options?: EngineOptions): SittirEngineLike {
	const backend = options?.backend ?? resolveBackendChoice();
	if (backend === 'native') return createNativeEngine(options);

	const { createJsEngine } = loadJsBackend();
	return createJsEngine({
		templatesPath: join(__dirname, '..', 'templates'),
		kindNames: KIND_NAMES,
		format: options?.format
	});
}
```

- [ ] **Step 4: Regenerate grammar engine files**

Run:

```bash
pnpm --filter @sittir/codegen run generate:rust
pnpm --filter @sittir/codegen run generate:ts
pnpm --filter @sittir/codegen run generate:python
```

Expected: regenerated `packages/{rust,python,typescript}/src/engine.ts` files import the new shared boundary and dynamically load the JS backend.

- [ ] **Step 5: Run engine tests and type-check**

Run:

```bash
pnpm --filter @sittir/codegen run type-check
pnpm --filter @sittir/rust exec vitest run tests/engine.test.ts
pnpm --filter @sittir/python exec vitest run tests/engine.test.ts
pnpm --filter @sittir/typescript exec vitest run tests/engine.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/codegen packages/rust/src/engine.ts packages/python/src/engine.ts packages/typescript/src/engine.ts
git commit -m "refactor: generate engines against common and js backend split"
```

---

### Task 4: Create `packages/validator` as the canonical validation facade

**Files:**

- Create: `packages/validator/package.json`
- Create: `packages/validator/src/index.ts`
- Create: `packages/validator/src/history.ts`
- Create: `packages/validator/src/run.ts`
- Create: `packages/validator/tests/history.test.ts`
- Create: `packages/validator/tests/run.test.ts`
- Create: `packages/validator/validation-history.jsonl`
- Modify: `package.json`
- Modify: `packages/codegen/src/scripts/counts.ts`
- Modify: `packages/codegen/src/scripts/probe-factory-rt.ts`
- Modify: `packages/codegen/src/cli.ts`

- [ ] **Step 1: Write the failing validator facade tests**

```ts
// packages/validator/tests/run.test.ts
import { describe, expect, it } from 'vitest';

describe('validator facade', () => {
	it('passes backend explicitly to every validator', async () => {
		const mod = await import('../src/run.ts');
		expect(typeof mod.collectValidatorsForGrammar).toBe('function');
	});
});
```

```ts
// packages/validator/tests/history.test.ts
import { describe, expect, it } from 'vitest';

describe('validator history', () => {
	it('appends one JSON object per line', async () => {
		const mod = await import('../src/history.ts');
		expect(typeof mod.appendHistoryEntry).toBe('function');
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @sittir/validator exec vitest run tests/run.test.ts tests/history.test.ts
```

Expected: FAIL because `packages/validator` does not exist yet.

- [ ] **Step 3: Implement the validator facade and JSONL history**

```ts
// packages/validator/src/history.ts
import { appendFileSync, existsSync, writeFileSync } from 'node:fs';

export function appendHistoryEntry(path: string, entry: object): void {
	if (!existsSync(path)) writeFileSync(path, '');
	appendFileSync(path, `${JSON.stringify(entry)}\n`);
}
```

```ts
// packages/validator/src/run.ts
import { validateFactoryRoundTrip } from '@sittir/codegen/src/validate/factory-roundtrip.ts';
import { validateFrom } from '@sittir/codegen/src/validate/from.ts';
import { validateRoundTrip } from '@sittir/codegen/src/validate/roundtrip.ts';
import { validateTemplateCoverage } from '@sittir/codegen/src/validate/template-coverage.ts';

export async function collectValidatorsForGrammar(grammar: string, backend: 'native' | 'typescript') {
	const templatesPath = new URL(`../../${grammar}/templates`, import.meta.url).pathname;
	return Promise.all([
		validateFrom(grammar, backend),
		validateTemplateCoverage(grammar, templatesPath),
		validateRoundTrip(grammar, templatesPath, { backend }),
		validateFactoryRoundTrip(grammar, templatesPath, backend)
	]);
}
```

- [ ] **Step 4: Seed the durable log file and root script**

```json
// package.json
{
  "scripts": {
    "validate:counts": "pnpm --filter @sittir/validator exec tsx src/run.ts",
    "validate:history": "pnpm --filter @sittir/validator exec tsx src/run.ts --append"
  }
}
```

```json
// packages/validator/validation-history.jsonl
{"schema":"validator-history-v1"}
```

- [ ] **Step 5: Redirect ad hoc wrappers to the canonical facade**

```ts
// packages/codegen/src/scripts/counts.ts
export { main } from '@sittir/validator/src/run.ts';
```

```ts
// packages/codegen/src/scripts/probe-factory-rt.ts
import { runFactoryRoundTripProbe } from '@sittir/validator/src/run.ts';

await runFactoryRoundTripProbe({
	grammars: process.argv.slice(2),
	backend: 'native'
});
```

- [ ] **Step 6: Run tests and the canonical script**

Run:

```bash
pnpm --filter @sittir/validator run type-check
pnpm --filter @sittir/validator exec vitest run tests/run.test.ts tests/history.test.ts
pnpm run validate:counts
```

Expected: PASS, with one canonical counts report and explicit backend propagation everywhere.

- [ ] **Step 7: Commit**

```bash
git add package.json packages/validator packages/codegen/src/scripts/counts.ts packages/codegen/src/scripts/probe-factory-rt.ts packages/codegen/src/cli.ts
git commit -m "refactor: add canonical validator facade and history log"
```

---

### Task 5: Full regression pass after the split

**Files:**

- Modify: `packages/validator/validation-history.jsonl`
- Test: `packages/codegen/src/__tests__/corpus-validation.test.ts`
- Test: `packages/codegen/src/__tests__/native-node-coords.test.ts`
- Test: `packages/{rust,python,typescript}/tests/engine.test.ts`

- [ ] **Step 1: Run the authoritative validation suite**

Run:

```bash
pnpm -r run type-check
pnpm --filter @sittir/codegen exec vitest run src/__tests__/corpus-validation.test.ts src/__tests__/native-node-coords.test.ts
pnpm --filter @sittir/rust exec vitest run tests/engine.test.ts
pnpm --filter @sittir/python exec vitest run tests/engine.test.ts
pnpm --filter @sittir/typescript exec vitest run tests/engine.test.ts
pnpm run validate:counts
```

Expected: PASS

- [ ] **Step 2: Append the run to the durable history**

```ts
// append object shape
{
  "timestamp": "2026-05-07T00:00:00.000Z",
  "branch": "023-native-read-parity",
  "backend": "native",
  "grammars": {
    "rust": { "fromPass": 0, "fromTotal": 0, "covPass": 0, "covTotal": 0, "rtPass": 0, "rtTotal": 0, "rtAstMatchPass": 0, "factoryPass": 0, "factoryTotal": 0, "factoryAstMatchPass": 0 },
    "typescript": { "fromPass": 0, "fromTotal": 0, "covPass": 0, "covTotal": 0, "rtPass": 0, "rtTotal": 0, "rtAstMatchPass": 0, "factoryPass": 0, "factoryTotal": 0, "factoryAstMatchPass": 0 },
    "python": { "fromPass": 0, "fromTotal": 0, "covPass": 0, "covTotal": 0, "rtPass": 0, "rtTotal": 0, "rtAstMatchPass": 0, "factoryPass": 0, "factoryTotal": 0, "factoryAstMatchPass": 0 }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/validator/validation-history.jsonl
git commit -m "chore: record validator history after runtime split"
```

---

## Self-review

- Spec coverage:
  - package split covered by Tasks 1-3
  - validator package/log covered by Task 4
  - sequencing respected by prerequisite gate and task order
  - emitter work explicitly remains outside this plan's scope except where engine emitter generation must change
- Placeholder scan:
  - no TBD/TODO markers
  - commands and file paths are explicit
- Type consistency:
  - `@sittir/common` owns shared runtime contracts
  - `@sittir/core` owns JS backend implementation
  - `packages/validator` is the canonical validation facade

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-07-runtime-package-boundaries.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
