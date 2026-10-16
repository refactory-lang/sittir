# Rust Slot Audit Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disable the false-positive JS-side native preflight, then complete the remaining Rust slot-surface audit so the next real matrix violation is exposed by native counts instead of being masked at the JS boundary.

**Architecture:** Keep the raw native payload unchanged and treat the JS-side native preflight as a temporary debug gate, not a source of slot truth. The real contract work stays in grammar-aware layers: wrap, validator reconstruction, and the Rust render transport/template surfaces must all consume the same slot model for named and unnamed slots, with no fallback reconstruction path for `children`.

**Tech Stack:** TypeScript 6 ESM, pnpm workspaces, Vitest, tsgo, tree-sitter codegen, Rust native render crates, validator CLI

---

## Follow-up scope boundary

This is a **delta plan** for the remaining work after the earlier `docs/superpowers/plans/2026-05-13-rust-slot-surface-contract.md` tasks landed.

Already complete before this follow-up:

- wrap normalization moved onto the shared slot path
- validator reconstruction moved onto the shared slot path
- raw native payload was explicitly kept raw

Still in scope here:

- disable the JS-side preflight that is masking downstream failures
- finish the remaining Rust render transport/template audit for unnamed slots
- regenerate and rerun native counts so the next real blocker is visible

## File Structure

- Modify: `packages/common/src/engine.ts`
  - Remove the JS-side `assertRenderableNodeData(...)` call from the native render path.
- Modify: `packages/core/tests/engine-native-boundary.test.ts`
  - Lock that the native engine now forwards inputs through transport projection without the JS preflight.
- Modify: `packages/codegen/src/emitters/render-module.ts`
  - Keep singular/repeated `children` handling on the same slot-model path as named fields and delete synthetic render-time fallbacks that contradict the matrix.
- Modify: `packages/codegen/src/__tests__/native-transport-emit.test.ts`
  - Lock required/optional/repeated unnamed-child transport shapes against the shared slot model.
- Modify: `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts`
  - Lock the typed template-input surface for unnamed children and forbid synthetic `Renderable::Text("")` fallbacks.
- Regenerate: `packages/rust/src/*`
  - Refresh the generated Rust package after the shared render-module change.
- Regenerate: `rust/crates/sittir-rust/src/render/{transport,templates,bridge,dispatch,mod}.rs`
  - Refresh native render transport/template outputs after the codegen fix.

### Task 1: Disable the JS-side native preflight gate

**Files:**

- Modify: `packages/common/src/engine.ts`
- Modify: `packages/core/tests/engine-native-boundary.test.ts`

- [ ] **Step 1: Rewrite the engine boundary test so it fails under the current preflight**

```ts
// packages/core/tests/engine-native-boundary.test.ts
it('forwards native render inputs through transport projection without JS preflight rejection', () => {
	const render = vi.fn((_node: unknown) => 'ok');
	const toNativeRenderTransport = vi.fn((node: AnyNodeData) => node);
	const config = {
		templatesPath: '.',
		kindNames: new Map<number, string>(),
		toNativeRenderTransport,
		getActiveBackend: () => ({
			name: 'native' as const,
			hashMatch: true as const,
			native: {
				SittirEngine: class {
					render(node: unknown): string {
						return render(node);
					}
					parseAndRead(_source: string): string {
						return JSON.stringify({
							nodeData: { $type: 1, $source: 0, $named: true, $text: 'x' }
						});
					}
					readNode(_handle: number, _childIndex: number): string {
						return JSON.stringify({ $type: 1, $source: 0, $named: true, $text: 'x' });
					}
					applyEdits(source: string): string {
						return source;
					}
					dispose(): void {}
				}
			}
		})
	} satisfies GrammarEngineConfig;
	const engine = createNativeEngine(config);
	const invalid = {
		$type: 1 as const,
		$source: 2 as const,
		$named: true,
		$text: 'x',
		render() {
			return 'nope';
		}
	};

	expect(engine).not.toBeNull();
	expect(engine!.render(invalid).toString()).toBe('ok');
	expect(toNativeRenderTransport).toHaveBeenCalledWith(invalid);
	expect(render).toHaveBeenCalledWith(invalid);
});
```

- [ ] **Step 2: Run the focused engine test to verify it fails**

Run:

```bash
pnpm exec vitest run packages/core/tests/engine-native-boundary.test.ts
```

Expected: FAIL because `createNativeEngine(...).render(...)` still throws from `assertRenderableNodeData(...)` before transport projection runs.

- [ ] **Step 3: Remove the JS-side preflight call from the native engine render path**

```ts
// packages/common/src/engine.ts
import type { AnyNodeData, Edit, FormatRecord } from '@sittir/types';
import type { TreeHandle } from './readNode.ts';

// ...

function renderNativeNode(
	node: Parameters<SittirEngineLike['render']>[0],
	opts?: Parameters<SittirEngineLike['render']>[1]
): RenderHandle {
	if (opts?.ignoreFormat === true) {
		throw new Error(
			'ignoreFormat option not yet supported by native engine. ' +
				'Use JS engine or wait for Task 4 (engine-owned format state).'
		);
	}
	const transport = config.toNativeRenderTransport(node);
	return createRenderHandle(
		() => engine.render(transport),
		(path) => {
			if (engine.renderToFile) {
				engine.renderToFile(transport, path);
				return true;
			}
			return false;
		}
	);
}
```

- [ ] **Step 4: Run the focused boundary tests**

Run:

```bash
pnpm exec vitest run \
  packages/core/tests/engine-native-boundary.test.ts \
  packages/core/tests/native-boundary.test.ts \
  packages/common/tests/native-boundary.test.ts
```

Expected: PASS. The engine test now proves the JS preflight is gone, while the standalone boundary helpers still behave exactly as documented.

- [ ] **Step 5: Commit**

```bash
git add packages/common/src/engine.ts \
        packages/core/tests/engine-native-boundary.test.ts
git commit -m "fix: disable native preflight gate"
```

### Task 2: Finish the Rust render-module audit for unnamed slots

**Files:**

- Modify: `packages/codegen/src/emitters/render-module.ts`
- Modify: `packages/codegen/src/__tests__/native-transport-emit.test.ts`
- Modify: `packages/codegen/src/__tests__/render-pipeline-optimization.test.ts`

- [ ] **Step 1: Add failing emitter tests for singular unnamed children**

```ts
// packages/codegen/src/__tests__/native-transport-emit.test.ts
it('emits required singular unnamed children as bare transport values', () => {
	const rust = emitRenderModule(
		'rust',
		[{ filename: 'child_parent.jinja', content: '{# @generated #}\n{{ children }}' }],
		makeRequiredChildrenNodeMap()
	);

	expect(rust.transportRs.contents).toContain('pub children: IdentifierTransport,');
	expect(rust.transportRs.contents).not.toContain('pub children: Vec<IdentifierTransport>,');
	expect(rust.transportRs.contents).not.toContain('pub children: Option<Vec<IdentifierTransport>>,');
});
```

```ts
// packages/codegen/src/__tests__/render-pipeline-optimization.test.ts
it('does not synthesize empty text for required singular unnamed children', () => {
	const emitted = emitRenderModule(
		'rust',
		[{ filename: 'required_child_parent.jinja', content: '{# @generated #}\n{{ children }}' }],
		makeRequiredChildrenNodeMap(),
		{
			kindIds: {
				required_child_parent: {
					id: 7,
					parser: {
						cSymbol: 'sym_required_child_parent',
						parserName: 'required_child_parent',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				},
				identifier: {
					id: 1,
					parser: {
						cSymbol: 'sym_identifier',
						parserName: 'identifier',
						anon: false,
						aux: false,
						alias: false,
						hidden: false
					}
				}
			},
			sourceArtifact: 'parser.wasm'
		}
	);

	expect(emitted.transportRs.contents).toContain(
		'children: SingleNonterminalView(::sittir_core::filters::Renderable::Transport(&node.children)),'
	);
	expect(emitted.transportRs.contents).not.toContain(
		'children: SingleNonterminalView(::sittir_core::filters::Renderable::Text("")),'
	);
});
```

- [ ] **Step 2: Run the focused codegen tests to verify they fail**

Run:

```bash
pnpm --dir packages/codegen exec vitest --config vitest.config.ts run \
  src/__tests__/native-transport-emit.test.ts \
  src/__tests__/render-pipeline-optimization.test.ts
```

Expected: FAIL because the typed template-input path still contains a synthetic `Renderable::Text("")` fallback or another split unnamed-child branch that does not fully honor the shared slot model.

- [ ] **Step 3: Remove the synthetic fallback and keep `children` on the shared slot-model path**

```ts
// packages/codegen/src/emitters/render-module.ts
if (struct.hasChildren) {
	if (!struct.transportHasChildren) {
		if (struct.childrenRequired) {
			lines.push(
				`    return Err(::askama::Error::Custom(format!("render_transport_dispatch: missing required children on '{}'", ${JSON.stringify(struct.kind)}).into()));`
			);
		} else {
			lines.push(`        children: OptionalNonterminalView::Missing,`);
		}
	} else if (struct.childrenMultiple) {
		lines.push(`        children: ListNonterminalView {`);
		lines.push(`            items: children_buf.as_slice(),`);
		lines.push(`            separator: ${sepLiteral},`);
		lines.push(`            leading: false,`);
		lines.push(`            trailing: false,`);
		lines.push(`        },`);
	} else if (struct.childrenRequired) {
		lines.push(`        children: SingleNonterminalView(${R}Renderable::Transport(&node.children)),`);
	} else {
		lines.push(`        children: match &node.children {`);
		lines.push(`            Some(v) => OptionalNonterminalView::Present(${R}Renderable::Transport(v)),`);
		lines.push(`            None => OptionalNonterminalView::Missing,`);
		lines.push(`        },`);
	}
}
```

```ts
// packages/codegen/src/emitters/render-module.ts
const slotModel = renderSlotModelOf(node);
const hasChildren = slotModel.unnamed.length > 0;
const childrenIsRequired = slotModel.unnamedRequired;
const childrenIsMultiple = slotModel.unnamedMultiple;
```

- [ ] **Step 4: Run the focused codegen tests again**

Run:

```bash
pnpm --dir packages/codegen exec vitest --config vitest.config.ts run \
  src/__tests__/native-transport-emit.test.ts \
  src/__tests__/render-pipeline-optimization.test.ts
```

Expected: PASS. The emitted Rust transport/template surfaces now represent singular unnamed children as single values, repeated unnamed children as lists, and no longer smuggle missing required children through `Renderable::Text("")`.

- [ ] **Step 5: Commit**

```bash
git add packages/codegen/src/emitters/render-module.ts \
        packages/codegen/src/__tests__/native-transport-emit.test.ts \
        packages/codegen/src/__tests__/render-pipeline-optimization.test.ts
git commit -m "fix: align rust unnamed slot render surfaces"
```

### Task 3: Regenerate Rust outputs and verify native counts expose the next real blocker

**Files:**

- Regenerate: `packages/rust/src/*`
- Regenerate: `rust/crates/sittir-rust/src/render/{transport,templates,bridge,dispatch,mod}.rs`

- [ ] **Step 1: Regenerate the Rust grammar outputs from the repo root**

Run:

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
```

Expected: Rust package sources and native render files update to reflect the shared slot-model change.

- [ ] **Step 2: Rebuild the affected packages from a clean dist state**

Run:

```bash
pnpm --filter @sittir/common clean && \
pnpm --filter @sittir/core clean && \
pnpm --filter @sittir/rust clean && \
pnpm --filter @sittir/common build && \
pnpm --filter @sittir/core build && \
pnpm --filter @sittir/rust build
```

Expected: Fresh `dist/` artifacts for the common, core, and Rust packages, with no stale JS output left over from the preflight gate or render-module changes.

- [ ] **Step 3: Run the focused tests plus native counts**

Run:

```bash
pnpm exec vitest run \
  packages/core/tests/engine-native-boundary.test.ts \
  packages/core/tests/native-boundary.test.ts \
  packages/common/tests/native-boundary.test.ts && \
pnpm --dir packages/codegen exec vitest --config vitest.config.ts run \
  src/__tests__/native-transport-emit.test.ts \
  src/__tests__/render-pipeline-optimization.test.ts && \
pnpm exec tsx packages/validator/src/cli.ts counts --backend native
```

Expected: The old `must be an object, got number` preflight failure is gone. Native counts either improve or stop on the next real matrix blocker inside wrap / validator / Rust render transport instead of failing at the JS boundary.

- [ ] **Step 4: Capture the next blocking seam immediately if counts still fail**

Run:

```bash
pnpm exec tsx packages/validator/src/cli.ts counts rust --backend native
```

Expected: A grammar-local Rust failure signature you can trace next without ambiguity about whether the JS preflight caused it.

- [ ] **Step 5: Record the outcome explicitly before committing**

If the counts pass the old JS-boundary seam but still fail later, append the newly exposed failure signature to the current session plan so the next follow-up starts from the real blocker instead of rediscovering it.

- [ ] **Step 6: Commit**

```bash
git add packages/common/src/engine.ts \
        packages/core/tests/engine-native-boundary.test.ts \
        packages/codegen/src/emitters/render-module.ts \
        packages/codegen/src/__tests__/native-transport-emit.test.ts \
        packages/codegen/src/__tests__/render-pipeline-optimization.test.ts \
        packages/rust/src \
        rust/crates/sittir-rust/src/render
git commit -m "fix: continue rust slot audit follow-up"
```
