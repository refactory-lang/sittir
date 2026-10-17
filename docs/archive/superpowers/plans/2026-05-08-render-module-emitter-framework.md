# Render-Module Emitter Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `render-module` onto the same class-based emitter framework as the other loop-driven emitters so `emit.ts` owns the only production taxonomy/orchestration path.

**Architecture:** Introduce a shared class-based emitter contract for the loop-driven emitters, instantiate those emitters inside `emit.ts`, and refactor `render-module` from a singleton/batch helper into a collector emitter whose `finalize(...)` synthesizes the Rust bundle from state collected during the shared loop. Keep file synthesis pure and deterministic, but remove alternate production orchestration paths.

**Tech Stack:** TypeScript 6 / tsgo, pnpm workspaces, Vitest, sittir codegen emitters, existing render-module fixture tests

---

## File structure

- `packages/codegen/src/emitters/emitter.ts` — shared class/interface contract for loop-driven emitters
- `packages/codegen/src/emitters/factories.ts` — `FactoryEmitter` class; no module-global singleton state
- `packages/codegen/src/emitters/from.ts` — `FromEmitter` class; no module-global singleton state
- `packages/codegen/src/emitters/wrap.ts` — `WrapEmitter` class; no module-global singleton state
- `packages/codegen/src/emitters/templates.ts` — `TemplateEmitter` class; no module-global singleton state
- `packages/codegen/src/emitters/render-module.ts` — `RenderModuleEmitter` class plus pure finalize-time synthesis helpers
- `packages/codegen/src/emitters/emit.ts` — instantiate emitters, run the single taxonomy loop, finalize in dependency order
- `packages/codegen/src/emitters/render-module-runner.ts` — thin adapter that drives the class-based emitter contract for tests/scripts
- `packages/codegen/src/compiler/generate.ts` — continue to consume `emitAll()` only; no render-module side path
- `packages/codegen/src/scripts/regen-templates-rs.ts` — switch from direct bundle helper to the shared adapter
- `packages/codegen/src/__tests__/emitter-framework.test.ts` — new focused tests for instance-owned emitter state
- `packages/codegen/src/__tests__/render-module-emit.test.ts` — switch tests to the adapter/shared contract
- `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts` — update any direct render-module helper usage
- `packages/codegen/src/__tests__/native-transport-emit.test.ts` — update any direct render-module helper usage

---

### Task 1: Introduce the shared emitter contract and prove instance-owned state

**Files:**

- Create: `packages/codegen/src/emitters/emitter.ts`
- Create: `packages/codegen/src/__tests__/emitter-framework.test.ts`
- Modify: `packages/codegen/src/emitters/templates.ts`

- [ ] **Step 1: Write the failing emitter-state isolation test**

```ts
// packages/codegen/src/__tests__/emitter-framework.test.ts
import { describe, expect, it } from 'vitest';
import { TemplateEmitter } from '../emitters/templates.ts';

describe('loop-driven emitters', () => {
	it('store collection state on the instance, not in module globals', () => {
		const nodeMap = {
			name: 'test',
			nodes: new Map(),
			signatures: { signatures: new Map() },
			derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
			rules: {},
			externals: new Set(),
			word: undefined,
			polymorphFormKinds: new Set()
		} as any;

		const left = new TemplateEmitter({ grammar: 'rust', nodeMap });
		const right = new TemplateEmitter({ grammar: 'rust', nodeMap });

		(left as any).bodies.set('left_kind', 'left body');
		(right as any).bodies.set('right_kind', 'right body');

		expect(left.finalize().bodies.has('left_kind')).toBe(true);
		expect(left.finalize().bodies.has('right_kind')).toBe(false);
		expect(right.finalize().bodies.has('right_kind')).toBe(true);
		expect(right.finalize().bodies.has('left_kind')).toBe(false);
	});
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm --filter @sittir/codegen exec vitest run src/__tests__/emitter-framework.test.ts`

Expected: FAIL because `TemplateEmitter` is not yet a constructible class with instance-owned state.

- [ ] **Step 3: Add the shared emitter interface and convert `TemplateEmitter` first**

```ts
// packages/codegen/src/emitters/emitter.ts
import type { AssembledNode } from '../compiler/node-map.ts';

export interface CodegenEmitter<TResult, TFinalizeArg = void> {
	emitLeaf?(node: Extract<AssembledNode, { modelType: 'pattern' | 'keyword' | 'enum' }>): void;
	emitBranch?(node: Extract<AssembledNode, { modelType: 'branch' }>): void;
	emitPolymorph?(node: Extract<AssembledNode, { modelType: 'polymorph' }>): void;
	emitGroup?(node: Extract<AssembledNode, { modelType: 'group' }>): void;
	finalize(arg: TFinalizeArg): TResult;
}
```

```ts
// packages/codegen/src/emitters/templates.ts
export class TemplateEmitter implements CodegenEmitter<EmittedTemplates> {
	readonly #grammar: string;
	readonly #nodeMap: NodeMap;
	readonly #bodies = new Map<string, string>();

	constructor(config: EmitTemplatesConfig) {
		this.#grammar = config.grammar;
		this.#nodeMap = config.nodeMap;
	}

	emitLeaf(node: AssembledNode): void {
		collectTemplateBody(this.#bodies, this.#grammar, this.#nodeMap, node);
	}

	emitBranch(node: AssembledNode): void {
		collectTemplateBody(this.#bodies, this.#grammar, this.#nodeMap, node);
	}

	emitPolymorph(node: AssembledNode): void {
		collectTemplateBody(this.#bodies, this.#grammar, this.#nodeMap, node);
	}

	emitGroup(node: AssembledNode): void {
		collectTemplateBody(this.#bodies, this.#grammar, this.#nodeMap, node);
	}

	finalize(): EmittedTemplates {
		return { bodies: new Map(this.#bodies) };
	}
}
```

- [ ] **Step 4: Run the focused test and the existing template tests**

Run: `pnpm --filter @sittir/codegen exec vitest run src/__tests__/emitter-framework.test.ts src/__tests__/render-pipeline-optimization.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/emitter.ts \
        packages/codegen/src/emitters/templates.ts \
        packages/codegen/src/__tests__/emitter-framework.test.ts
git commit -m "refactor: add class-based emitter contract"
```

---

### Task 2: Convert the loop-driven TS emitters and `emit.ts` to class instances

**Files:**

- Modify: `packages/codegen/src/emitters/factories.ts`
- Modify: `packages/codegen/src/emitters/from.ts`
- Modify: `packages/codegen/src/emitters/wrap.ts`
- Modify: `packages/codegen/src/emitters/emit.ts`
- Test: `packages/codegen/src/__tests__/emitter-framework.test.ts`

- [ ] **Step 1: Extend the framework test to exercise `emitAll()` with emitter instances**

```ts
// packages/codegen/src/__tests__/emitter-framework.test.ts
import { emitAll } from '../emitters/emit.ts';

it('emitAll creates fresh loop-driven emitter instances per run', () => {
	const nodeMap = {
		name: 'test',
		nodes: new Map(),
		signatures: { signatures: new Map() },
		derivations: { inferredFields: [], promotedRules: [], repeatedShapes: [] },
		rules: {},
		externals: new Set(),
		word: undefined,
		polymorphFormKinds: new Set()
	} as any;

	const first = emitAll({ grammar: 'rust', nodeMap });
	const second = emitAll({ grammar: 'rust', nodeMap });

	expect(first.jinjaTemplates.bodies).not.toBe(second.jinjaTemplates.bodies);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm --filter @sittir/codegen exec vitest run src/__tests__/emitter-framework.test.ts`

Expected: FAIL because `emit.ts` still drives module-level singleton emitters via `init()`.

- [ ] **Step 3: Convert `FactoryEmitter`, `FromEmitter`, and `WrapEmitter` to classes and instantiate them in `emit.ts`**

```ts
// packages/codegen/src/emitters/factories.ts
export class FactoryEmitter implements CodegenEmitter<string> {
	readonly #config: EmitFactoriesConfig;
	readonly #state: FactoryCollectState;

	constructor(config: EmitFactoriesConfig) {
		this.#config = config;
		this.#state = createFactoryCollectState(config);
	}

	emitLeaf(node: Extract<AssembledNode, { modelType: 'pattern' | 'keyword' | 'enum' }>): void {
		collectFactoryLeaf(this.#state, node);
	}

	emitBranch(node: Extract<AssembledNode, { modelType: 'branch' }>): void {
		collectFactoryBranch(this.#state, node);
	}

	finalize(): string {
		return finalizeFactorySource(this.#state, this.#config);
	}
}
```

```ts
// packages/codegen/src/emitters/emit.ts
const factoryEmitter = new FactoryEmitter({
	grammar,
	nodeMap,
	strict,
	generatedIdTables,
	kindEntries,
	inlineKinds,
	synthesizedKinds
});
const fromEmitter = new FromEmitter({ grammar, nodeMap, generatedIdTables, kindEntries });
const wrapEmitter = new WrapEmitter({ grammar, nodeMap, generatedIdTables, kindEntries, inlineKinds, synthesizedKinds });
const templateEmitter = new TemplateEmitter({ grammar, nodeMap });
```

- [ ] **Step 4: Run type-check and focused emitter tests**

Run:

```bash
pnpm --filter @sittir/codegen run type-check
pnpm --filter @sittir/codegen exec vitest run \
  src/__tests__/emitter-framework.test.ts \
  src/__tests__/render-pipeline-optimization.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/factories.ts \
        packages/codegen/src/emitters/from.ts \
        packages/codegen/src/emitters/wrap.ts \
        packages/codegen/src/emitters/emit.ts \
        packages/codegen/src/__tests__/emitter-framework.test.ts
git commit -m "refactor: instantiate loop-driven emitters as classes"
```

---

### Task 3: Refactor `RenderModuleEmitter` into a collecting loop participant

**Files:**

- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `packages/codegen/src/emitters/emit.ts`
- Create: `packages/codegen/src/emitters/render-module-runner.ts`
- Test: `packages/codegen/src/__tests__/render-module-emit.test.ts`

- [ ] **Step 1: Write the failing parity test for `emitAll()` vs the render-module adapter**

```ts
// packages/codegen/src/__tests__/render-module-emit.test.ts
import { emitAll } from '../emitters/emit.ts';
import { runRenderModuleEmitter } from '../emitters/render-module-runner.ts';
import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { optimize } from '../compiler/optimize.ts';
import { assemble } from '../compiler/assemble.ts';
import { resolveGrammarJsPath, resolveOverridesPath } from '../compiler/resolve-grammar.ts';
import { loadGeneratedIdTables } from '../compiler/generated-metadata.ts';
import { emitJinjaTemplates } from '../emitters/templates.ts';
import { existsSync } from 'node:fs';

async function buildRustFixture() {
	const grammar = 'rust';
	const grammarJsPath = resolveGrammarJsPath(grammar);
	const overridesPath = resolveOverridesPath(grammar);
	const entryPath = existsSync(overridesPath) ? overridesPath : grammarJsPath;
	const raw = await evaluate(entryPath);
	const linked = link(raw);
	const optimized = optimize(linked);
	const nodeMap = assemble(optimized);
	const generatedIdTables = await loadGeneratedIdTables(grammar);
	const jinjaTemplates = emitJinjaTemplates({ grammar, nodeMap });
	return { grammar, nodeMap, generatedIdTables, jinjaTemplates };
}

it('adapter path matches emitAll render-module output', async () => {
	const { nodeMap, generatedIdTables, jinjaTemplates } = await buildRustFixture();

	const viaEmitAll = emitAll({
		grammar: 'rust',
		nodeMap,
		generatedIdTables,
		emitRenderModule: true
	}).renderModule;

	const viaAdapter = runRenderModuleEmitter({
		grammar,
		nodeMap,
		generatedIdTables,
		jinjaTemplates
	});

	expect(viaAdapter).toEqual(viaEmitAll);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm --filter @sittir/codegen exec vitest run src/__tests__/render-module-emit.test.ts`

Expected: FAIL because there is no shared adapter and `render-module` still uses a separate orchestration surface.

- [ ] **Step 3: Convert `RenderModuleEmitter` to a class and add the shared adapter**

```ts
// packages/codegen/src/emitters/render-module.ts
export class RenderModuleEmitter implements CodegenEmitter<RenderModuleBundle, EmittedTemplates> {
	readonly #grammar: Grammar;
	readonly #nodeMap: NodeMap;
	readonly #generatedIdTables?: GeneratedIdTables;
	readonly #entries: RenderModuleCollectedEntry[] = [];

	constructor(config: RenderModuleEmitterConfig) {
		this.#grammar = config.grammar;
		this.#nodeMap = config.nodeMap;
		this.#generatedIdTables = config.generatedIdTables;
	}

	emitLeaf(node: Extract<AssembledNode, { modelType: 'pattern' | 'keyword' | 'enum' }>): void {
		this.#entries.push(collectRenderModuleEntry(node, this.#nodeMap));
	}

	emitBranch(node: Extract<AssembledNode, { modelType: 'branch' }>): void {
		this.#entries.push(collectRenderModuleEntry(node, this.#nodeMap));
	}

	emitPolymorph(node: Extract<AssembledNode, { modelType: 'polymorph' }>): void {
		this.#entries.push(collectRenderModuleEntry(node, this.#nodeMap));
	}

	emitGroup(node: Extract<AssembledNode, { modelType: 'group' }>): void {
		this.#entries.push(collectRenderModuleEntry(node, this.#nodeMap));
	}

	finalize(templates: EmittedTemplates): RenderModuleBundle {
		return synthesizeRenderModuleBundle({
			grammar: this.#grammar,
			nodeMap: this.#nodeMap,
			generatedIdTables: this.#generatedIdTables,
			entries: this.#entries,
			templates
		});
	}
}
```

```ts
// packages/codegen/src/emitters/render-module-runner.ts
export function runRenderModuleEmitter(config: RunRenderModuleEmitterConfig): RenderModuleBundle {
	const templateEmitter = new TemplateEmitter({ grammar: config.grammar, nodeMap: config.nodeMap });
	const renderModuleEmitter = new RenderModuleEmitter({
		grammar: config.grammar,
		nodeMap: config.nodeMap,
		generatedIdTables: config.generatedIdTables
	});

	for (const [, node] of config.nodeMap.nodes) {
		switch (node.modelType) {
			case 'pattern':
			case 'keyword':
			case 'enum':
				templateEmitter.emitLeaf?.(node);
				renderModuleEmitter.emitLeaf?.(node);
				break;
			case 'branch':
				templateEmitter.emitBranch?.(node);
				renderModuleEmitter.emitBranch?.(node);
				break;
			case 'polymorph':
				templateEmitter.emitPolymorph?.(node);
				renderModuleEmitter.emitPolymorph?.(node);
				break;
			case 'group':
				templateEmitter.emitGroup?.(node);
				renderModuleEmitter.emitGroup?.(node);
				break;
			case 'token':
			case 'supertype':
			case 'multi':
				break;
		}
	}

	const templates = config.jinjaTemplates ?? templateEmitter.finalize();
	return renderModuleEmitter.finalize(templates);
}
```

- [ ] **Step 4: Update `emit.ts` to instantiate `RenderModuleEmitter` and remove the redundant grammar guard**

```ts
// packages/codegen/src/emitters/emit.ts
const renderModuleEmitter =
	renderModuleEmission === 'emit'
		? new RenderModuleEmitter({ grammar, nodeMap, generatedIdTables })
		: undefined;

// ...
if (renderModuleEmission === 'emit') {
	renderModuleEmitter.emitLeaf?.(node);
}

// ...
const renderModule =
	renderModuleEmission === 'emit' ? renderModuleEmitter!.finalize(jinjaTemplates) : undefined;
```

- [ ] **Step 5: Run focused render-module tests**

Run:

```bash
pnpm --filter @sittir/codegen exec vitest run \
  src/__tests__/render-module-emit.test.ts \
  src/__tests__/native-transport-emit.test.ts \
  src/__tests__/render-pipeline-optimization.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/emitters/render-module.ts \
        packages/codegen/src/emitters/render-module-runner.ts \
        packages/codegen/src/emitters/emit.ts \
        packages/codegen/src/__tests__/render-module-emit.test.ts
git commit -m "refactor: collect render-module output through emitter loop"
```

---

### Task 4: Replace direct script/test bypasses and lock the byte-identical contract

**Files:**

- Modify: `packages/codegen/src/scripts/regen-templates-rs.ts`
- Modify: `packages/codegen/src/__tests__/render-module-emit.test.ts`
- Modify: `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts`
- Modify: `packages/codegen/src/__tests__/native-transport-emit.test.ts`

- [ ] **Step 1: Write the failing adapter-usage regression test**

```ts
// packages/codegen/src/__tests__/render-module-emit.test.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

it('regen-templates-rs uses the shared render-module runner', () => {
	const script = readFileSync(
		resolve('packages/codegen/src/scripts/regen-templates-rs.ts'),
		'utf8'
	);
	expect(script).toContain("from '../emitters/render-module-runner.ts'");
	expect(script).toContain('runRenderModuleEmitter(');
	expect(script).not.toContain('emitRenderModuleBundle(');
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm --filter @sittir/codegen exec vitest run src/__tests__/render-module-emit.test.ts`

Expected: FAIL because tests/scripts still rely on direct render-module bundle helpers.

- [ ] **Step 3: Switch the script and tests to the adapter path**

```ts
// packages/codegen/src/scripts/regen-templates-rs.ts
import { runRenderModuleEmitter } from '../emitters/render-module-runner.ts';

const renderModule = runRenderModuleEmitter({
	grammar,
	nodeMap,
	generatedIdTables,
	jinjaTemplates
});
```

```ts
// packages/codegen/src/__tests__/native-transport-emit.test.ts
const emitted = runRenderModuleEmitter({
	grammar: 'rust',
	nodeMap,
	generatedIdTables,
	jinjaTemplates
});
```

- [ ] **Step 4: Run type-check plus the focused render-module suite**

Run:

```bash
pnpm --filter @sittir/codegen run type-check
pnpm --filter @sittir/codegen exec vitest run \
  src/__tests__/render-module-emit.test.ts \
  src/__tests__/native-transport-emit.test.ts \
  src/__tests__/render-pipeline-optimization.test.ts
```

Expected: PASS

- [ ] **Step 5: Run the full codegen package test suite**

Run: `pnpm --filter @sittir/codegen test`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/codegen/src/scripts/regen-templates-rs.ts \
        packages/codegen/src/__tests__/render-module-emit.test.ts \
        packages/codegen/src/__tests__/native-transport-emit.test.ts \
        packages/codegen/src/__tests__/render-pipeline-optimization.test.ts
git commit -m "test: route render-module callers through emitter adapter"
```
