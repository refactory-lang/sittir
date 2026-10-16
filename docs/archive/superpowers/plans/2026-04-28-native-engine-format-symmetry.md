# Native Engine Format Symmetry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore format-aware JS/native engine symmetry with a stateful engine whose client-side `render(...)` call stays contextless, while keeping native `NodeData` free of per-node `$format`.

**Architecture:** Add a canonical **engine** surface to each grammar package, where the engine owns reader + renderer state and tree-handle associations. JS and native must expose the same engine/handle behavior and precedence rules: engine config is fixed at engine creation, engine config wins over inferred tree format, and detached `NodeData` only sees engine defaults.

**Tech Stack:** TypeScript ESM, Vitest, tree-sitter grammar runtimes, existing `@sittir/core` renderer, Rust napi-rs engines, existing format-roundtrip parity suite

---

## File Structure

- **Create:** `packages/core/src/engine.ts` — shared engine/handle contracts and helpers for immutable engine format, contextless render dispatch, and default-engine wrappers.
- **Modify:** `packages/core/src/index.ts` — export the shared engine helpers.
- **Modify:** `packages/core/src/readNode.ts` — tighten handle-owned state so parsed handles stay associated with their engine and inferred tree-level format.
- **Modify:** `packages/core/src/native-boundary.ts` — keep native node payloads format-free while allowing engine-owned format on the engine side rather than on `NodeData`.
- **Modify:** `packages/types/src/core-types.ts` — add engine-facing types for immutable engine format config, engine handles, and parse/read results.
- **Create:** `packages/rust/src/engine.ts`
- **Create:** `packages/typescript/src/engine.ts`
- **Create:** `packages/python/src/engine.ts`
  - grammar-specific engine factories that compose reader + renderer, expose `parseAndRead`, `readNode`, `render`, `applyEdits`, and `dispose`, and delegate to native when active
- **Modify:** `packages/rust/src/index.ts`
- **Modify:** `packages/typescript/src/index.ts`
- **Modify:** `packages/python/src/index.ts`
  - export `createEngine` and keep existing convenience wrappers delegating to a default engine
- **Modify:** `packages/rust/src/backend.ts`
- **Modify:** `packages/typescript/src/backend.ts`
- **Modify:** `packages/python/src/backend.ts`
  - extend the typed native engine surface to cover immutable engine config, parse/read state, and disposal
- **Modify:** `packages/rust/src/boundary.ts`
- **Modify:** `packages/typescript/src/boundary.ts`
- **Modify:** `packages/python/src/boundary.ts`
  - route top-level `render` / `toEdit` / `applyEdits` through a lazily-created default engine instead of module-scoped ad hoc renderer/native-engine globals
- **Modify:** `packages/rust/package.json`
- **Modify:** `packages/typescript/package.json`
- **Modify:** `packages/python/package.json`
  - move any parser/runtime dependencies needed by `createEngine` from dev-only to runtime dependencies
- **Modify:** `rust/crates/sittir-{lang}/src/lib.rs`
  - add engine-owned format/options state and contextless render behavior on the native engine side
- **Modify:** `rust/crates/sittir-{lang}/index.d.ts`
  - keep generated TS declarations aligned with the napi surface
- **Modify:** `packages/core/tests/render-format.test.ts`
- **Modify:** `packages/core/tests/native-boundary.test.ts`
- **Modify:** `packages/rust/tests/backend-boundary.test.ts`
- **Modify:** `packages/typescript/tests/backend-boundary.test.ts`
- **Modify:** `packages/python/tests/backend-boundary.test.ts`
  - contract tests for engine config precedence, detached-node behavior, and contextless render
- **Modify:** `tests/format-roundtrip/helpers.ts`
- **Modify:** `tests/format-roundtrip/rust.test.ts`
- **Modify:** `tests/format-roundtrip/typescript.test.ts`
- **Modify:** `tests/format-roundtrip/python.test.ts`
  - parity tests must assert engine-driven behavior directly instead of external post-processing on native output
- **Modify:** `specs/012-rust-core-port/contracts/napi-api.md`
- **Modify:** `specs/017-format-inference/spec.md`
- **Modify:** `specs/020-template-engine-converge/spec.md`
  - align the written contracts/specs with the engine terminology and restored engine-owned format behavior

### Task 1: Lock the engine contract in tests and types

**Files:**

- Modify: `packages/core/tests/render-format.test.ts`
- Modify: `packages/core/tests/native-boundary.test.ts`
- Modify: `packages/rust/tests/backend-boundary.test.ts`
- Modify: `packages/typescript/tests/backend-boundary.test.ts`
- Modify: `packages/python/tests/backend-boundary.test.ts`
- Modify: `packages/types/src/core-types.ts`
- Test: `packages/core/tests/render-format.test.ts`
- Test: `packages/core/tests/native-boundary.test.ts`
- Test: `packages/rust/tests/backend-boundary.test.ts`
- Test: `packages/typescript/tests/backend-boundary.test.ts`
- Test: `packages/python/tests/backend-boundary.test.ts`

- [ ] **Step 1: Write the failing engine-format tests in core**

```ts
import { resolveEngineFormat } from '../src/engine.ts';

it('engine format wins over inferred tree format', () => {
	const inferred: FormatRecord = { boundary: { leading: '  ' } };
	const engineFormat: FormatRecord = { boundary: { leading: '\t' } };

	expect(resolveEngineFormat(engineFormat, inferred, false)).toEqual(engineFormat);
});

it('detached NodeData does not borrow inferred tree format', () => {
	const inferred: FormatRecord = { boundary: { leading: '  ' } };

	expect(resolveEngineFormat(undefined, inferred, true)).toBeUndefined();
});
```

Expected: this import fails until Task 2 creates `packages/core/src/engine.ts`; that failure is the intended red state.

- [ ] **Step 2: Add the failing native-boundary regression**

```ts
it('still rejects per-node $format when engine-owned format exists elsewhere', () => {
	const withFormat: AnyNodeData = {
		...leaf,
		$format: { boundary: { leading: '  ' } },
	};

	expect(() => assertNativeNodeData(withFormat)).toThrow(/\$format/);
});
```

- [ ] **Step 3: Add failing backend-boundary tests for contextless engine render**

```ts
it('uses engine-owned format when native render is called without per-call format args', async () => {
	const renderSpy = vi.fn(() => '\tx');
	mockNativeBackend(
		class {
			constructor(_options?: { format?: string }) {}
			render(nodeJson: string): string {
				return renderSpy(nodeJson);
			}
			applyEdits(source: string): string {
				return source;
			}
		}
	);

	const { createEngine } = await import('../src/engine.ts');
	const engine = createEngine({ format: { boundary: { leading: '\t' } } });
	expect(engine.render(identifier)).toBe('\tx');
	expect(renderSpy).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 4: Add the type surface for engine-owned format and handles**

```ts
export interface EngineOptions {
	readonly format?: FormatRecord;
}

export interface EngineTreeHandle {
	readonly format?: FormatRecord;
	readonly render: (options?: { ignoreFormat?: boolean }) => string;
}

export interface ParseAndReadResult {
	readonly nodeData: AnyNodeData;
	readonly format?: FormatRecord;
}
```

- [ ] **Step 5: Run the focused tests and type-check**

Run:

```bash
pnpm vitest run packages/core/tests/render-format.test.ts packages/core/tests/native-boundary.test.ts packages/rust/tests/backend-boundary.test.ts packages/typescript/tests/backend-boundary.test.ts packages/python/tests/backend-boundary.test.ts
pnpm -r run type-check
```

Expected: the new assertions fail on missing engine/handle behavior, but the suite should compile.

- [ ] **Step 6: Commit**

```bash
git add packages/core/tests/render-format.test.ts packages/core/tests/native-boundary.test.ts packages/rust/tests/backend-boundary.test.ts packages/typescript/tests/backend-boundary.test.ts packages/python/tests/backend-boundary.test.ts packages/types/src/core-types.ts
git commit -m "test: lock engine format symmetry contract"
```

### Task 2: Add the shared engine abstraction and JS fallback implementation

**Files:**

- Create: `packages/core/src/engine.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/readNode.ts`
- Modify: `packages/rust/package.json`
- Modify: `packages/typescript/package.json`
- Modify: `packages/python/package.json`
- Test: `packages/core/tests/render-format.test.ts`

- [ ] **Step 1: Create the shared engine helper in core**

```ts
export interface SittirEngineLike {
	parseAndRead(source: string): ParseAndReadResult;
	readNode(nodeId: NodeId): AnyNodeData;
	render(node: AnyNodeData, options?: { ignoreFormat?: boolean }): string;
	applyEdits(source: string, edits: readonly Edit[]): string;
	dispose(): void;
}

export function resolveEngineFormat(
	engineFormat: FormatRecord | undefined,
	treeFormat: FormatRecord | undefined,
	detached: boolean
): FormatRecord | undefined {
	if (engineFormat) return engineFormat;
	if (!detached) return treeFormat;
	return undefined;
}
```

- [ ] **Step 2: Thread engine-associated read/format state through `readNode.ts`**

```ts
export interface TreeHandle {
	nodeById(id: NodeId): AnyTreeNode;
	rootNode: AnyTreeNode;
	source?: string;
	read?(nodeId?: NodeId): AnyNodeData;
	render?(nodeId?: NodeId, options?: { ignoreFormat?: boolean }): string;
	format?: FormatRecord;
}
```

- [ ] **Step 3: Add a JS fallback engine shape that keeps format immutable**

Modify: `packages/core/src/engine.ts`

```ts
const engineFormat = options?.format;
const renderer = createRenderer(templatesPath);

function renderNode(node: AnyNodeData, treeFormat?: FormatRecord): string {
	const effective = resolveEngineFormat(engineFormat, treeFormat, treeFormat == null);
	const canonical = renderer.render(node);
	return effective ? applyFormat(canonical, effective) : canonical;
}
```

- [ ] **Step 4: Promote parser/runtime dependencies needed by `createEngine` to runtime dependencies**

```json
{
	"dependencies": {
		"@sittir/core": "workspace:*",
		"@sittir/types": "workspace:*",
		"tree-sitter-rust": "^0.24.0"
	},
	"devDependencies": {
		"@types/node": "^25.6.0",
		"type-fest": "^5.6.0"
	}
}
```

- [ ] **Step 5: Run focused core tests and workspace type-check**

Run:

```bash
pnpm vitest run packages/core/tests/render-format.test.ts packages/core/tests/native-boundary.test.ts
pnpm -r run type-check
```

Expected: core/type tests pass; package boundary tests still fail until the grammar packages and native surface are wired.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/engine.ts packages/core/src/index.ts packages/core/src/readNode.ts packages/core/src/render.ts packages/rust/package.json packages/typescript/package.json packages/python/package.json
git commit -m "feat: add shared engine abstraction"
```

### Task 3: Wire the grammar packages to the new engine API

**Files:**

- Create: `packages/rust/src/engine.ts`
- Create: `packages/typescript/src/engine.ts`
- Create: `packages/python/src/engine.ts`
- Modify: `packages/rust/src/index.ts`
- Modify: `packages/typescript/src/index.ts`
- Modify: `packages/python/src/index.ts`
- Modify: `packages/rust/src/backend.ts`
- Modify: `packages/typescript/src/backend.ts`
- Modify: `packages/python/src/backend.ts`
- Modify: `packages/rust/src/boundary.ts`
- Modify: `packages/typescript/src/boundary.ts`
- Modify: `packages/python/src/boundary.ts`
- Test: `packages/rust/tests/backend-boundary.test.ts`
- Test: `packages/typescript/tests/backend-boundary.test.ts`
- Test: `packages/python/tests/backend-boundary.test.ts`

- [ ] **Step 1: Add a grammar-specific `createEngine` file for one package, then mirror it**

```ts
export function createEngine(options?: EngineOptions) {
	const native = getNativeBackendEngine(options);
	if (native) return native;

	const js = createJsEngine({
		grammar: 'rust',
		templatesPath: join(__dirname, '..', 'templates'),
		readTreeNode,
		parserFactory: () => {
			const parser = new Parser();
			parser.setLanguage(treeSitterRust);
			return parser;
		},
		format: options?.format,
	});
	return js;
}
```

- [ ] **Step 2: Extend the typed native engine interface to accept engine options and disposal**

```ts
export interface NativeEngine {
	readonly templateBundleHash: string;
	parseAndRead(source: string): string;
	readNode(nodeId: NodeId): string;
	render(nodeJson: string): string;
	applyEdits(
		source: string,
		edits: { startPos: number; endPos: number; insertedText: string }[]
	): string;
	dispose(): void;
}

export interface NativeModule {
	SittirEngine: new (options?: { format?: string }) => NativeEngine;
}
```

The `parseAndRead(source)` JSON contract stays `{"nodeData": ..., "format": ...}`; only engine construction and render/dispose semantics change here.

- [ ] **Step 3: Rework boundary helpers to delegate through a default engine**

```ts
let defaultEngine: ReturnType<typeof createEngine> | null = null;

function getDefaultEngine() {
	if (defaultEngine === null) defaultEngine = createEngine();
	return defaultEngine;
}

export function render(node: AnyNodeData): string {
	return getDefaultEngine().render(node);
}
```

- [ ] **Step 4: Export `createEngine` from each package index**

```ts
export { createEngine } from './engine.js';
export { render, toEdit, applyEdits } from './boundary.js';
```

- [ ] **Step 5: Run the grammar boundary tests**

Run:

```bash
pnpm vitest run packages/rust/tests/backend-boundary.test.ts packages/typescript/tests/backend-boundary.test.ts packages/python/tests/backend-boundary.test.ts
pnpm -r run type-check
```

Expected: JS-side engine wiring passes; native-backed assertions still fail until the napi engines own format state.

- [ ] **Step 6: Commit**

```bash
git add packages/rust/src/engine.ts packages/typescript/src/engine.ts packages/python/src/engine.ts packages/rust/src/index.ts packages/typescript/src/index.ts packages/python/src/index.ts packages/rust/src/backend.ts packages/typescript/src/backend.ts packages/python/src/backend.ts packages/rust/src/boundary.ts packages/typescript/src/boundary.ts packages/python/src/boundary.ts
git commit -m "feat: expose symmetric engine API"
```

### Task 4: Make the native engines own immutable engine format and contextless render

**Files:**

- Modify: `rust/crates/sittir-{lang}/src/lib.rs`
- Modify: `rust/crates/sittir-{lang}/index.d.ts`
- Modify: `specs/012-rust-core-port/contracts/napi-api.md`
- Test: `packages/rust/tests/backend-boundary.test.ts`
- Test: `packages/typescript/tests/backend-boundary.test.ts`
- Test: `packages/python/tests/backend-boundary.test.ts`

- [ ] **Step 1: Add immutable engine format state to one napi crate, then mirror it**

```rust
#[napi(object)]
pub struct EngineOptions {
    pub format: Option<String>,
}

pub struct SittirEngine {
    syntax: tree_sitter::Parser,
    source: Option<String>,
    tree: Option<tree_sitter::Tree>,
    engine_format: Option<FormatRecord>,
    tree_format: Option<FormatRecord>,
}

#[napi(constructor)]
pub fn new(options: Option<EngineOptions>) -> Result<Self> {
    let engine_format = options
        .and_then(|opts| opts.format)
        .map(|json| serde_json::from_str(&json))
        .transpose()
        .map_err(|e| Error::from_reason(format!("parse engine format failed: {e}")))?;
    // internal tree-sitter runtime init unchanged
}
```

- [ ] **Step 2: Cache inferred tree format during `parse_and_read` and use it during `render`**

```rust
use sittir_core::format::{apply_format, extract_format};

self.tree_format = Some(sittir_core::format::extract_format(
    self.source.as_ref().unwrap(),
    self.tree.as_ref().unwrap(),
));

let effective_format = self
    .engine_format
    .as_ref()
    .or(self.tree_format.as_ref());

let canonical = render_dispatch(&node)
    .map_err(|e| Error::from_reason(format!("render_dispatch failed: {e}")))?;
Ok(match effective_format {
    Some(format) => apply_format(&canonical, format),
    None => canonical,
})
```

- [ ] **Step 3: Add explicit disposal/reset behavior**

```rust
#[napi]
pub fn dispose(&mut self) {
    self.source = None;
    self.tree = None;
    self.tree_format = None;
}
```

- [ ] **Step 4: Update the written napi contract**

```md
### `new SittirEngine(options?: { format?: string })`

- `format`, when present, is parsed once at engine creation and remains fixed for that engine instance.
- `render(nodeJson)` remains contextless from the JS caller's perspective.
- The engine resolves effective format as engine config first, cached tree-level inferred format second.
```

- [ ] **Step 5: Run the boundary tests after the native surface changes**

Run:

```bash
pnpm vitest run packages/rust/tests/backend-boundary.test.ts packages/typescript/tests/backend-boundary.test.ts packages/python/tests/backend-boundary.test.ts packages/core/tests/native-boundary.test.ts
pnpm -r run type-check
```

Expected: package boundary tests pass on mocked native engines and TS types align with the new constructor/dispose surface.

- [ ] **Step 6: Commit**

```bash
git add rust/crates/sittir-{lang}/src/lib.rs rust/crates/sittir-{lang}/index.d.ts specs/012-rust-core-port/contracts/napi-api.md
git commit -m "feat: make native engines own format state"
```

### Task 5: Restore parity through the engine API and update the feature specs

**Files:**

- Modify: `tests/format-roundtrip/helpers.ts`
- Modify: `tests/format-roundtrip/rust.test.ts`
- Modify: `tests/format-roundtrip/typescript.test.ts`
- Modify: `tests/format-roundtrip/python.test.ts`
- Test: `tests/format-roundtrip/native-node-id.test.ts`
- Modify: `specs/017-format-inference/spec.md`
- Modify: `specs/020-template-engine-converge/spec.md`
- Test: `tests/format-roundtrip/rust.test.ts`
- Test: `tests/format-roundtrip/typescript.test.ts`
- Test: `tests/format-roundtrip/python.test.ts`

- [ ] **Step 1: Update the format-roundtrip helper to use engines instead of external post-processing**

```ts
export function renderNativeNodeData(engine: NativeEngine, nodeData: object): string {
	return engine.render(JSON.stringify(nodeData));
}

export function renderTsNodeData(engine: ReturnType<typeof createEngine>, nodeData: object): string {
	return engine.render(nodeData as never);
}
```

- [ ] **Step 2: Rework the parity tests to assert engine-owned behavior directly**

```ts
const engine = createEngine();
const parsed = parseNativeFixture(nativeEngine, source);

expect(engine.render(parsed.nodeData as never)).toBe(
	renderNativeNodeData(nativeEngine, toBoundaryNodeData(parsed.nodeData))
);
```

- [ ] **Step 3: Update the feature specs to match the restored engine contract**

```md
- Existing format-aware behavior is restored through engine-owned state, not by attaching `$format` to native `NodeData`.
- Engine config is immutable after engine creation.
- Contextless `engine.render(...)` is the supported public shape on both backends.
```

- [ ] **Step 4: Run the focused parity slice**

Run:

```bash
pnpm vitest run tests/format-roundtrip/rust.test.ts tests/format-roundtrip/typescript.test.ts tests/format-roundtrip/python.test.ts tests/format-roundtrip/native-node-id.test.ts
```

Expected: the roundtrip tests pass without calling `applyFormat(...)` on native output in the harness.

- [ ] **Step 5: Run full verification**

Run:

```bash
pnpm run build
pnpm -r run type-check
pnpm test
```

Expected: build, type-check, and full Vitest suite pass with JS/native engine behavior aligned.

- [ ] **Step 6: Commit**

```bash
git add tests/format-roundtrip/helpers.ts tests/format-roundtrip/rust.test.ts tests/format-roundtrip/typescript.test.ts tests/format-roundtrip/python.test.ts specs/017-format-inference/spec.md specs/020-template-engine-converge/spec.md
git commit -m "feat: restore engine-owned format parity"
```
