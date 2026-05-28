# Wrap Diagnostic Location Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Emit richer wrap-layer diagnostics from codegen so all generated `wrap.ts` helpers report line/column plus a short source snippet when a wrap helper throws.

**Architecture:** Keep the behavior centralized in `packages/codegen/src/emitters/wrap.ts` by extending the shared emitted helper layer instead of customizing per-kind wrap functions. Validate the change in two ways: emitted-source assertions against the codegen emitter, then one runtime-style test that imports a generated wrap module and checks the thrown `TypeError` text.

**Tech Stack:** TypeScript ESM, Vitest, tsx codegen CLI, generated grammar wrap modules

---

## File structure

- Modify: `packages/codegen/src/emitters/wrap.ts`
  - Shared source of truth for emitted `wrap.ts` helper functions and per-slot normalization call sites.
- Modify: `packages/codegen/src/__tests__/wrap-slot-arity.test.ts`
  - Best existing emitter-source assertion file for helper-function text and generated call-site shape.
- Modify: `packages/codegen/src/__tests__/wrapped-tree-materialization.test.ts`
  - Existing runtime-style test seam that imports generated wrap modules and can assert thrown diagnostic text.
- Modify later via regeneration: `packages/python/src/wrap.ts`
  - Generated output witness for source-backed diagnostics.
- Modify later via regeneration: `packages/rust/src/wrap.ts`
  - Generated output witness for shared helper parity.
- Modify later via regeneration: `packages/typescript/src/wrap.ts`
  - Generated output witness for shared helper parity.

### Task 1: Emit location-aware wrap helper code

**Files:**

- Modify: `packages/codegen/src/__tests__/wrap-slot-arity.test.ts`
- Modify: `packages/codegen/src/emitters/wrap.ts`

- [ ] **Step 1: Write the failing emitter-source test**

```ts
it('emits location-aware wrap diagnostics for helper violations', () => {
	const source = emitWrap({ grammar: 'synth', nodeMap: makeRequiredSingleChildNodeMap() });

	expect(source).toContain('function describeWrapLocation(');
	expect(source).toContain('function describeWrapSnippet(');
	expect(source).toContain('function buildWrapDiagnostic(');
	expect(source).toContain('tree.source');
	expect(source).toContain('normalizeSingularWrapSlot(');
	expect(source).toContain('normalizeRepeatedWrapSlot(');
	expect(source).toContain('buildWrapDiagnostic(message, context)');
	expect(source).toContain('slotName: "children"');
	expect(source).toContain('nodeType: data.$type');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm --dir packages/codegen exec vitest run src/__tests__/wrap-slot-arity.test.ts
```

Expected: FAIL on the new `describeWrapLocation` / `buildWrapDiagnostic` assertions because the emitter still outputs the old helper set.

- [ ] **Step 3: Implement the shared emitted helper context**

Update the emitted helper block in `packages/codegen/src/emitters/wrap.ts` so the generated source includes a context-carrying diagnostic path:

```ts
interface WrapDiagnosticContext {
	tree?: TreeHandle;
	nodeType: string | number;
	slotName?: string;
	span?: { start?: number; end?: number };
}

function describeWrapLocation(context: WrapDiagnosticContext): string | undefined {
	const source = context.tree?.source;
	const start = context.span?.start;
	if (source == null || start == null) return undefined;
	const lines = source.slice(0, start).split('\n');
	const line = lines.length;
	const column = (lines[lines.length - 1]?.length ?? 0) + 1;
	return `${line}:${column}`;
}

function describeWrapSnippet(context: WrapDiagnosticContext): string | undefined {
	const source = context.tree?.source;
	const start = context.span?.start;
	const end = context.span?.end;
	if (source == null || start == null || end == null) return undefined;
	return JSON.stringify(source.slice(start, end));
}

function buildWrapDiagnostic(message: string, context: WrapDiagnosticContext): string {
	const location = describeWrapLocation(context);
	const snippet = describeWrapSnippet(context);
	if (location === undefined && snippet === undefined) return message;
	const parts = [message];
	if (location !== undefined) parts.push(`at ${location}`);
	if (snippet !== undefined) parts.push(`near ${snippet}`);
	return parts.join(' — ');
}
```

Then update emitted helper signatures/call sites so both singular and repeated normalization paths pass:

```ts
normalizeSingularWrapSlot(value, "children", true, data.$type, {
	tree,
	nodeType: data.$type,
	slotName: "children",
	span: data.$span
})
```

- [ ] **Step 4: Run the emitter-source test to verify it passes**

Run:

```bash
pnpm --dir packages/codegen exec vitest run src/__tests__/wrap-slot-arity.test.ts
```

Expected: PASS with the new helper-string assertions green.

- [ ] **Step 5: Commit the emitter/helper change**

```bash
git add packages/codegen/src/emitters/wrap.ts packages/codegen/src/__tests__/wrap-slot-arity.test.ts
git commit -m "feat: emit wrap diagnostic context"
```

### Task 2: Prove the generated runtime message includes location and snippet

**Files:**

- Modify: `packages/codegen/src/__tests__/wrapped-tree-materialization.test.ts`
- Modify: `packages/codegen/src/emitters/wrap.ts`

- [ ] **Step 1: Write the failing runtime-style test**

Add a test that imports a generated wrap module and triggers a real wrap violation with source-backed context:

```ts
it('includes line/column and snippet in generated wrap violations when source is available', async () => {
	const wrapModulePath = new URL('../../../python/src/wrap.ts', import.meta.url).pathname;
	const typesModulePath = new URL('../../../python/src/types.ts', import.meta.url).pathname;
	const { wrapListSplat } = (await import(wrapModulePath)) as {
		wrapListSplat: (node: unknown, tree: TreeHandle) => unknown;
	};
	const { TSKindId } = (await import(typesModulePath)) as {
		TSKindId: Record<string, number>;
	};
	const tree = {
		get rootNode(): never {
			throw new Error('unused');
		},
		source: 'print(*f)\\n',
	} satisfies TreeHandle;

	expect(() =>
		wrapListSplat(
			{
				$type: TSKindId.ListSplat,
				$span: { start: 6, end: 8 },
			},
			tree,
		),
	).toThrow(/list_splat/);

	expect(() =>
		wrapListSplat(
			{
				$type: TSKindId.ListSplat,
				$span: { start: 6, end: 8 },
			},
			tree,
		),
	).toThrow(/1:7/);

	expect(() =>
		wrapListSplat(
			{
				$type: TSKindId.ListSplat,
				$span: { start: 6, end: 8 },
			},
			tree,
		),
	).toThrow(/"\\*f"/);
});
```

Also add the fallback guard:

```ts
it('falls back to the old message shape when source is unavailable', async () => {
	// same module imports as above
	const tree = {
		get rootNode(): never {
			throw new Error('unused');
		},
	} satisfies TreeHandle;

	expect(() =>
		wrapListSplat(
			{
				$type: TSKindId.ListSplat,
			},
			tree,
		),
	).toThrow(/requires one value; got undefined/);
});
```

- [ ] **Step 2: Run the runtime-style test to verify it fails**

Run:

```bash
pnpm --dir packages/codegen exec vitest run src/__tests__/wrapped-tree-materialization.test.ts
```

Expected: FAIL because generated `python/src/wrap.ts` still throws the old message without `1:7` and `"*f"`.

- [ ] **Step 3: Finish the helper formatting details**

Adjust the emitted helper implementation until the runtime message is stable and human-facing:

```ts
function buildWrapDiagnostic(message: string, context: WrapDiagnosticContext): string {
	const location = describeWrapLocation(context);
	const snippet = describeWrapSnippet(context);
	if (location === undefined && snippet === undefined) return message;
	return [
		message,
		location !== undefined ? `at ${location}` : undefined,
		snippet !== undefined ? `near ${snippet}` : undefined,
	].filter(Boolean).join(' — ');
}
```

Make sure every emitted helper call uses the current node span:

```ts
span: data.$span
```

and not the mismatched slot value span, so diagnostics anchor to the throwing node even when the value is `undefined`.

- [ ] **Step 4: Run the runtime-style test to verify it passes**

Run:

```bash
pnpm --dir packages/codegen exec vitest run src/__tests__/wrapped-tree-materialization.test.ts
```

Expected: PASS with one assertion matching `1:7` and one matching `"*f"`.

- [ ] **Step 5: Commit the runtime diagnostic test change**

```bash
git add packages/codegen/src/emitters/wrap.ts packages/codegen/src/__tests__/wrapped-tree-materialization.test.ts
git commit -m "test: cover generated wrap diagnostic locations"
```

### Task 3: Regenerate all grammar wraps and verify shared output

**Files:**

- Modify: `packages/codegen/src/emitters/wrap.ts`
- Modify: `packages/python/src/wrap.ts`
- Modify: `packages/rust/src/wrap.ts`
- Modify: `packages/typescript/src/wrap.ts`
- Test: `packages/codegen/src/__tests__/wrap-slot-arity.test.ts`
- Test: `packages/codegen/src/__tests__/wrapped-tree-materialization.test.ts`

- [ ] **Step 1: Regenerate all grammar wrap outputs**

Run:

```bash
pnpm --dir packages/codegen exec tsx src/cli.ts --grammar rust --all --output packages/rust/src
pnpm --dir packages/codegen exec tsx src/cli.ts --grammar typescript --all --output packages/typescript/src
pnpm --dir packages/codegen exec tsx src/cli.ts --grammar python --all --output packages/python/src
```

Expected: the generated `packages/{rust,typescript,python}/src/wrap.ts` files now include the new diagnostic helpers and context-passing call sites.

- [ ] **Step 2: Run the focused validation bundle**

Run:

```bash
pnpm --dir packages/codegen exec vitest run \
  src/__tests__/wrap-slot-arity.test.ts \
  src/__tests__/wrapped-tree-materialization.test.ts
```

Expected: PASS for both files.

- [ ] **Step 3: Spot-check generated witnesses**

Run:

```bash
rg 'buildWrapDiagnostic|describeWrapLocation|describeWrapSnippet' \
  packages/rust/src/wrap.ts \
  packages/typescript/src/wrap.ts \
  packages/python/src/wrap.ts
```

Expected: matches in all three generated wrap files.

- [ ] **Step 4: Review the final diff for scope**

Run:

```bash
git --no-pager diff -- packages/codegen/src/emitters/wrap.ts \
  packages/codegen/src/__tests__/wrap-slot-arity.test.ts \
  packages/codegen/src/__tests__/wrapped-tree-materialization.test.ts \
  packages/rust/src/wrap.ts \
  packages/typescript/src/wrap.ts \
  packages/python/src/wrap.ts
```

Expected: only emitter/tests/generated wrap files changed for this feature.

- [ ] **Step 5: Commit the regenerated outputs**

```bash
git add \
  packages/codegen/src/emitters/wrap.ts \
  packages/codegen/src/__tests__/wrap-slot-arity.test.ts \
  packages/codegen/src/__tests__/wrapped-tree-materialization.test.ts \
  packages/rust/src/wrap.ts \
  packages/typescript/src/wrap.ts \
  packages/python/src/wrap.ts
git commit -m "feat: add location-aware wrap diagnostics"
```
