# Examples and `.from()` Coercion Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the checked-in examples compile and reflect the intended strict-vs-`.from()` API across Rust, TypeScript, and Python, while only broadening `.from()` for grammar-safe hoisted strings and explicit marker booleans.

**Architecture:** Add a durable examples compile gate first, then lock the desired API/coercion behavior in codegen tests. Implement the behavior in the codegen emitters (`shared.ts`, `from.ts`, `ir.ts`), regenerate the language packages, and finally repair the example files and docs to the new truth surface. Keep strict factories primary where `.from()` adds no ergonomic value, and keep marker booleans limited to existing optional syntax-marker fields.

**Tech Stack:** TypeScript ESM, pnpm workspaces, `@sittir/codegen`, generated packages `@sittir/{rust,typescript,python}`, Vitest, `tsc`, existing codegen regeneration CLI

---

## File Structure

### Validation / tooling

- `examples/tsconfig.json` — dedicated compile target for all example files
- `package.json` — root `type-check:examples` script

### Codegen behavior

- `packages/codegen/src/emitters/shared.ts` — shared classification helpers for safe hoisted forms and boolean keyword markers
- `packages/codegen/src/emitters/from.ts` — emits `FromInput`/resolver behavior for safe string and marker-boolean coercions
- `packages/codegen/src/emitters/ir.ts` — emits `ir.*` callable bundles and the `.strict` vs `.from()` surface rules
- `packages/codegen/src/__tests__/factory-ergonomics.test.ts` — generated-surface regression tests for `.from()` and `ir` behavior

### Regenerated language output

- `packages/rust/src/{from,ir,types,factories,index}.ts`
- `packages/typescript/src/{from,ir,types,factories,index}.ts`
- `packages/python/src/{from,ir,types,factories,index}.ts`

### Example and docs surface

- `examples/01-construct-nodes.ts`
- `examples/03-trivia.ts`
- `examples/04-precompiled-templates.ts`
- `examples/05-inline-templates.ts`
- `examples/06-composition.ts`
- `examples/12-cross-language-migration.ts`
- `examples/13-bulk-file-processing.ts`
- `examples/14-format-preserving-transform.ts`
- `examples/15-generate-file.ts`
- `examples/README.md`
- `docs/use-cases-and-examples.md`

These are the files already known to be using `.from()`, strict construction, templates, or cross-language examples in ways that can drift with the API. The compile gate added in Task 1 must also be rerun against the currently untouched companions `examples/02-render-round-trip.ts`, `examples/07-read-source.ts`, `examples/08-find-patterns.ts`, `examples/09-type-guards.ts`, `examples/10-codemod-unwrap-to-try.ts`, `examples/11-codemod-template-wrapper.ts`, and `examples/16-dogfooding.ts` to confirm they remain valid without edits.

---

### Task 1: Add a durable examples compile gate

**Files:**

- Create: `examples/tsconfig.json`
- Modify: `package.json`

- [ ] **Step 1: Create the examples-only TypeScript project**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "noEmit": true,
    "composite": false,
    "declaration": false,
    "declarationMap": false,
    "incremental": false
  },
  "include": ["./*.ts"],
  "exclude": []
}
```

- [ ] **Step 2: Add a root script for the new gate**

Add this entry under the existing root scripts in `package.json`:

```json
"type-check:examples": "tsc -p examples/tsconfig.json --noEmit"
```

- [ ] **Step 3: Run the gate to verify the current examples fail**

Run: `pnpm run type-check:examples`

Expected: FAIL. At the time this plan was written, the first syntax blockers were:

```text
examples/01-construct-nodes.ts(23,45): error TS1003: Identifier expected.
examples/01-construct-nodes.ts(51,32): error TS1003: Identifier expected.
examples/04-precompiled-templates.ts(7,4): error TS1005: ',' expected.
examples/06-composition.ts(6,41): error TS1005: ',' expected.
```

- [ ] **Step 4: Commit the compile gate**

```bash
git add examples/tsconfig.json package.json
git commit -m "test: add dedicated examples compile gate"
```

---

### Task 2: Lock the desired `.from()` and `ir` contract in tests

**Files:**

- Modify: `packages/codegen/src/__tests__/factory-ergonomics.test.ts`

- [ ] **Step 1: Add failing generated-surface regressions for safe string coercion, marker booleans, and IR bundling**

Append a new describe block to `packages/codegen/src/__tests__/factory-ergonomics.test.ts`:

```ts
describe('examples cleanup contract', () => {
	it('keeps safe hoisted string fields on branch/polymorph from() resolvers', async () => {
		const { readFileSync } = await import('node:fs');
		const { resolve } = await import('node:path');
		const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/from.ts'), 'utf-8');

		expect(content).toMatch(
			/visibilityModifier: _resolveOneBranch<T\\.VisibilityModifier>\\(input\\.visibilityModifier, "visibility_modifier"\\)/
		);
		expect(content).toMatch(/name: _resolveOne<T\\.Identifier \\| T\\.Metavariable>\\(input\\.name,/);
	});

	it('keeps boolean keyword coercion scoped to explicit marker fields', async () => {
		const { readFileSync } = await import('node:fs');
		const { resolve } = await import('node:path');
		const content = readFileSync(resolve(import.meta.dirname, '../../../typescript/src/from.ts'), 'utf-8');

		expect(content).toMatch(/readonlyMarker: _resolveBooleanKeyword\\(input\\.readonlyMarker\\)/);
		expect(content).toMatch(/asyncMarker: _resolveBooleanKeyword\\(input\\.asyncMarker\\)/);
		expect(content).not.toMatch(/name: _resolveBooleanKeyword/);
	});

	it('keeps branch and polymorph ir bundles exposing strict explicitly', async () => {
		const { readFileSync } = await import('node:fs');
		const { resolve } = await import('node:path');
		const content = readFileSync(resolve(import.meta.dirname, '../../../rust/src/ir.ts'), 'utf-8');

		expect(content).toContain('.strict');
		expect(content).toContain('from: FR.');
	});
});
```

- [ ] **Step 2: Run the focused test file and verify it fails**

Run: `pnpm test packages/codegen/src/__tests__/factory-ergonomics.test.ts`

Expected: FAIL on at least one new assertion. If all three new assertions already pass unchanged, replace the weakest assertion with a stricter check against the exact generated line you are about to modify before moving on.

- [ ] **Step 3: Commit the failing regression**

```bash
git add packages/codegen/src/__tests__/factory-ergonomics.test.ts
git commit -m "test(codegen): lock examples coercion contract"
```

---

### Task 3: Implement codegen changes and regenerate packages

**Files:**

- Modify: `packages/codegen/src/emitters/shared.ts`
- Modify: `packages/codegen/src/emitters/from.ts`
- Modify: `packages/codegen/src/emitters/ir.ts`
- Modify: `packages/rust/src/{from,ir,types,factories,index}.ts`
- Modify: `packages/typescript/src/{from,ir,types,factories,index}.ts`
- Modify: `packages/python/src/{from,ir,types,factories,index}.ts`

- [ ] **Step 1: Tighten the shared classification helpers that decide what is safe to coerce**

In `packages/codegen/src/emitters/shared.ts`, keep the string/boolean rules explicit and mechanical. The relevant helper block should stay in this shape:

```ts
export function keywordPresenceKind(field: AssembledNonterminal, nodeMap: NodeMap): 'boolean' | 'bitflag' | null {
	// only explicit keyword-marker fields qualify
}

export function resolveHoistedForm(form: AssembledGroup, nodeMap: NodeMap): HoistedForm | undefined {
	// only hoist when the target slot stays unambiguous after generation
}

export function classifyFromEmission(kind: string, node: AssembledNode, context: FromDispatchContext): FromEmission {
	// branch/polymorph vs leaf/direct emission stays derived here
}
```

Use this step to ensure:

1. hoisted string coercion remains limited to slots with one clear target node
2. marker booleans remain tied to `keywordPresenceKind(...) === 'boolean'`
3. ambiguous slots fall back to explicit config/node construction instead of broad coercion

- [ ] **Step 2: Emit the updated `.from()` behavior**

In `packages/codegen/src/emitters/from.ts`, update the resolver generation at the helper and per-kind emission sites. The emitted patterns should continue to look like:

```ts
return F.functionItem({
	visibilityModifier: _resolveOneBranch<T.VisibilityModifier>(input.visibilityModifier, 'visibility_modifier'),
	name: _resolveOne<T.Identifier | T.Metavariable>(input.name, _K22, _K0),
	parameters: _resolveOneBranch<T.Parameters>(input.parameters, 'parameters') ?? F.parameters(),
	body: _resolveOneBranch<T.Block>(input.body, 'block') ?? F.block()
});
```

and marker booleans should continue to route through the boolean keyword helper:

```ts
readonlyMarker: _resolveBooleanKeyword(input.readonlyMarker),
asyncMarker: _resolveBooleanKeyword(input.asyncMarker),
moveMarker: _resolveBooleanKeyword(input.moveMarker)
```

Do not add generic boolean guessing outside those explicit marker fields.

- [ ] **Step 3: Normalize the `ir` bundle rules**

In `packages/codegen/src/emitters/ir.ts`, update the `bundleExpr(...)` path so the emitted `ir.*` surface matches the spec:

```ts
// branch / polymorph entries default to from() and expose the strict factory as .strict
return `_attach(FR.${node.fromFunctionName}, { strict: F.${node.rawFactoryName} })`;
```

Use this step to enforce:

1. branch/polymorph entries expose `.strict` consistently
2. leaf/direct cases do not pretend to have a second surface when `.from()` and strict are identical
3. grouped namespace members such as `ir.expression.binary` and `ir.pattern.reference` follow the same bundling rule as flat `ir.*`

- [ ] **Step 4: Regenerate all three grammars**

Run:

```bash
npx tsx packages/codegen/src/cli.ts --grammar rust --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python --all --output packages/python/src
```

Expected: PASS. Generated files under `packages/{rust,typescript,python}/src/` update; no hand edits.

- [ ] **Step 5: Rerun the focused codegen regression**

Run: `pnpm test packages/codegen/src/__tests__/factory-ergonomics.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the codegen/regeneration change**

```bash
git add packages/codegen/src/emitters/shared.ts \
        packages/codegen/src/emitters/from.ts \
        packages/codegen/src/emitters/ir.ts \
        packages/codegen/src/__tests__/factory-ergonomics.test.ts \
        packages/rust/src \
        packages/typescript/src \
        packages/python/src
git commit -m "feat(codegen): align from coercion and ir bundle surfaces"
```

---

### Task 4: Repair the first-wave example blockers and Rust-facing API examples

**Files:**

- Modify: `examples/01-construct-nodes.ts`
- Modify: `examples/03-trivia.ts`
- Modify: `examples/04-precompiled-templates.ts`
- Modify: `examples/05-inline-templates.ts`
- Modify: `examples/06-composition.ts`
- Modify: `examples/14-format-preserving-transform.ts`
- Modify: `examples/15-generate-file.ts`

- [ ] **Step 1: Fix the current syntax blockers exactly where the compile gate reports them**

Apply these shape fixes first:

```ts
// examples/01-construct-nodes.ts
visibilityModifier: ir.visibilityModifier(),
body: ir.expressionStatement({
	children: [
		ir.macroInvocation({
			macro: ir.identifier('format!'),
			args: ir.tokenTree([ir.stringLiteral('"Hello, {}!"'), ir.identifier('name')])
		})
	]
})
```

```ts
// examples/04-precompiled-templates.ts
return snippets.implDisplay
	.fill({
		TYPE: ir.typeItem.from('Config'),
		EXPR: ir.fieldExpression({
			value: ir.selfExpression(),
			field: ir.fieldIdentifier('host')
		})
	})
	.render();
```

```ts
// examples/06-composition.ts
const method = snippets.pubMethod.fill({
	NAME: ir.identifier('new'),
	PARAMS: ir.parameter.from({ pattern: 'host', type: 'String' }),
	RET: ir.identifier('Self'),
	BODY: template('Self { $...FIELDS }')
		.fill({
			FIELDS: [ir.fieldInitializer.from({ name: 'host', value: '"host"' })]
		})
		.read()
});
```

The goal of this step is not to make the final examples beautiful yet; it is to remove the parse blockers so the compile gate can expose the next layer of truth.

- [ ] **Step 2: Normalize the Rust examples to the strict-vs-`.from()` contract**

Use `examples/01-construct-nodes.ts`, `03-trivia.ts`, `14-format-preserving-transform.ts`, and `15-generate-file.ts` to demonstrate the intended split:

```ts
// strict surface when there is no meaningful ergonomic difference
const fn = ir.functionItem({
	visibilityModifier: ir.visibilityModifier(),
	name: ir.identifier('main'),
	parameters: ir.parameters(),
	body: ir.block()
});

// from surface only where it materially reduces ceremony
const fromStruct = ir.structItem.from({
	visibilityModifier: 'pub',
	name: 'Cache',
	body: { name: 'entries', type: 'HashMap<String, String>' }
});
```

In this step, also revisit Rust string-literal examples so they show the least awkward truthful construction after the regenerated API lands.

- [ ] **Step 3: Run the examples compile gate**

Run: `pnpm run type-check:examples`

Expected: FAIL if more semantic issues remain, but the original syntax errors in `01-construct-nodes.ts`, `04-precompiled-templates.ts`, and `06-composition.ts` should be gone.

- [ ] **Step 4: Commit the first-wave example repairs**

```bash
git add examples/01-construct-nodes.ts \
        examples/03-trivia.ts \
        examples/04-precompiled-templates.ts \
        examples/05-inline-templates.ts \
        examples/06-composition.ts \
        examples/14-format-preserving-transform.ts \
        examples/15-generate-file.ts
git commit -m "docs(examples): repair rust construction examples"
```

---

### Task 5: Finish cross-language examples and make the docs non-aspirational

**Files:**

- Modify: `examples/12-cross-language-migration.ts`
- Modify: `examples/13-bulk-file-processing.ts`
- Modify: `examples/index.ts`
- Modify: `examples/README.md`
- Modify: `docs/use-cases-and-examples.md`

- [ ] **Step 1: Make sure the checked-in examples visibly cover all three grammars**

Update the cross-language examples so the public surface is demonstrated for Rust, TypeScript, and Python in runnable form:

```ts
// examples/12-cross-language-migration.ts
import { ir as rustIr } from '@sittir/rust';
import { ir as tsIr } from '@sittir/typescript';
import { ir as pyIr } from '@sittir/python';
```

Use the same strict-vs-`.from()` rule here: if the strict and `.from()` surfaces are identical for a leaf/identifier-style example, show the strict form only.

- [ ] **Step 2: Remove the “examples may not compile yet” framing**

Update the status text in both docs files:

```md
> **Status:** These examples are executable companions to the current public API.
> They are compile-checked in the repository and should be kept truthful as the
> generated surfaces evolve.
```

and in `examples/README.md`:

```md
These files are intentionally written as executable TypeScript modules.
They are compile-checked under `pnpm run type-check:examples` and should track
the current public API rather than aspirational future surfaces.
```

- [ ] **Step 3: Rerun the examples compile gate until it passes**

Run: `pnpm run type-check:examples`

Expected: PASS.

- [ ] **Step 4: Commit the cross-language/doc cleanup**

```bash
git add examples/12-cross-language-migration.ts \
        examples/13-bulk-file-processing.ts \
        examples/index.ts \
        examples/README.md \
        docs/use-cases-and-examples.md
git commit -m "docs(examples): make compile-checked examples truthful"
```

---

### Task 6: Run the targeted validation suite

**Files:**

- Modify: none
- Test: `packages/codegen/src/__tests__/factory-ergonomics.test.ts`
- Test: `examples/tsconfig.json`

- [ ] **Step 1: Run the focused codegen and examples checks**

Run:

```bash
pnpm test packages/codegen/src/__tests__/factory-ergonomics.test.ts
pnpm run type-check:examples
pnpm --filter @sittir/codegen run type-check
```

Expected: PASS.

- [ ] **Step 2: Run the repo-level validation most relevant to this change**

Run:

```bash
pnpm run validate
pnpm exec tsx packages/tools/src/validate/jinja.ts
```

Expected: PASS. If unrelated pre-existing root build/lint/test failures remain, record them separately rather than treating them as regressions from this change.

- [ ] **Step 3: Commit the validation checkpoint**

```bash
git add -A
git commit -m "test: validate examples and from coercion cleanup"
```

---

## Self-Review Checklist

- **Spec coverage:** The plan covers compile-checked examples, safe hoisted string coercion, explicit marker booleans, strict-vs-`.from()` reconciliation, Rust string-literal ergonomics review, all-three-grammar example coverage, and doc cleanup.
- **Placeholder scan:** No `TODO`/`TBD` placeholders remain; every task names exact files and commands.
- **Type consistency:** The plan uses the current public camelCase marker names (`asyncMarker`, `moveMarker`, `readonlyMarker`) and the current codegen emitter entrypoints (`shared.ts`, `from.ts`, `ir.ts`) consistently.
