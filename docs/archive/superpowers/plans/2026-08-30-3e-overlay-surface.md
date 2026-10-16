# Factory Overlays Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the ergonomic construction surface (form constructors, enum-member constructors, grouped namespaces) as generated overlay modules layered over the plain builders, without touching storage, `from()`, wrap, transport, render, or the validators.

**Architecture:** The core `factories` emitter keeps producing plain builders, now written to `factories/raw.ts`. Three generated overlay modules chain on top (`overlays/refines.ts` → `overlays/polymorphs.ts` → `overlays/supertypes.ts`), each importing the previous layer, attaching properties onto builders with `attachProps`, and re-exporting everything; `factories/index.ts` re-exports the chain head. `ir.ts` composes coercing bundles as `bundle(FR.x, F.x)` so every attached property surfaces on `ir.x.*` automatically. One compiler change makes `_statement`-shaped hidden choices first-class supertypes so they group like declared ones.

**Tech Stack:** TypeScript (ESM, `.ts` imports), vitest, tsx, pnpm; generated packages `packages/{rust,typescript,python}`; Rust render engine untouched.

**Spec:** `docs/superpowers/specs/2026-08-30-3e-overlay-surface.md`

> **Architecture revision (2026-08-30, supersedes Tasks 2/3/5 as written):**
> bundles are plain `{ strict, coerce }` objects made by one generic
> `bundle()` helper; sub-factories are generic combinators (`form`,
> `member`, residual-merge) applied identically to both flavors; overlays
> decorate bundles by object spread (no `attachProps`, no namespace
> merging, no callable bundles); `from.ts` moves to `factories/coerce.ts`;
> a new `factories/bundle.ts` holds the per-kind bundle lines; `ir.ts`
> only assembles. The spec's "One principle" and layout sections are the
> authority; the task texts below predate the revision and are being
> executed inline by the controller against the revised spec.

## Global Constraints

- Never hand-edit generated output: `packages/{rust,python,typescript}/src/*`, `templates/*.jinja`, `.sittir/*`, `overrides.suggested.ts`. Regenerate with `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <rust|typescript|python> --all --output packages/<lang>/src`.
- No comments in `packages/codegen/src`; every new declaration gets a `###` section in `docs/glossary/emitters.md` (or `compiler.md` / `dsl.md` for compiler changes), keyed `packages/codegen/src/<path>::<name>`.
- Comments and docs never cite spec/plan/PR/task numbers.
- Commit by pathspec (`git commit -- <paths>`); never commit `TODO.md`, `examples/*`, `tsconfig.json`, `packages/tools/validation-report.json`.
- Unit suite: `pnpm exec vitest run --root packages/codegen` (from repo root). Type-check: `pnpm run type-check` — baseline is 4 errors after this plan (126 before).
- Validator gate: `pnpm run validate:native` at floor — coverage 208/208 · 194/194 · 142/142; factory-render-parse 1519 · 1202 · 1390; read-render-parse 134/137 · 112/114 · 115/116; from() 149 · 144/145 · 126. Compare with `pnpm run validate:history` (numbers, not eyeballs).
- Native: after any regeneration, run `cargo check` in `rust/` (the SubagentStop gate does not).
- A failed gate stops for review; never auto-revert.
- Spec amendment recorded by this plan (Task 6): supertype **derivation** moves out of `ir.ts` into the overlays; `ir.ts` keeps a projection of the same derivation onto coercing bundles, because `ir.<group>.<member>` must stay a coercing bundle carrying `.strict` (the examples call both `ir.statement.function({...})` and `.strict({...})`). Update the spec's "Supertypes" paragraph accordingly in Task 6.

---

## File structure

| File | Responsibility |
| --- | --- |
| `packages/codegen/src/emitters/overlays/module.ts` | Text emission shared by every overlay: `Attachment` type, `emitOverlayModule`, `emitFactoriesIndex`, the chain order. |
| `packages/codegen/src/emitters/overlays/refines.ts` | Refine-form attachments from `nodeMap.refineForms`. |
| `packages/codegen/src/emitters/overlays/sub-factories.ts` | Pure derivation: eligible parents, arms, residual, recursion, diagnostics. No text. |
| `packages/codegen/src/emitters/overlays/polymorphs.ts` | Emits the polymorph overlay from `sub-factories.ts`. |
| `packages/codegen/src/emitters/overlays/supertype-groups.ts` | Pure derivation of grouped namespaces (name, member keys, member kinds) — consumed by the supertypes overlay and by `ir.ts`. `groupNameFor` / `memberKeyFor` move here from `ir.ts`. |
| `packages/codegen/src/emitters/overlays/supertypes.ts` | Emits strict grouped namespaces over the decorated builders. |
| `packages/codegen/src/emitters/ir.ts` | Bundles only: `bundle(FR.x, F.x)`; group projection onto bundles from `supertype-groups.ts`; synonyms unchanged. |
| `packages/codegen/src/emitters/client-utils.ts` | Adds the `bundle` runtime helper beside `attachProps`. |
| `packages/codegen/src/emitters/emit.ts`, `compiler/generate.ts`, `run-codegen.ts` | New `GeneratedFiles` fields and the writer for the `factories/` directory. |
| `packages/codegen/src/emitters/test.ts` | Per-sub-factory generated tests. |
| `packages/codegen/src/compiler/link.ts`, `compiler/assemble.ts`, `dsl/rule-patterns.ts` | Hidden choice-of-kinds rules survive pruning and assemble as `AssembledSupertype`. |

---

### Task 1: `factories/raw.ts` + `factories/index.ts` layout

**Files:**
- Modify: `packages/codegen/src/compiler/generate.ts:40-60` (`GeneratedFiles`), `:168-190` (assembly)
- Modify: `packages/codegen/src/emitters/emit.ts:37-50` (`EmitAllResult`), `:130-150`
- Modify: `packages/codegen/src/run-codegen.ts:218-231` (writer)
- Modify: `packages/codegen/src/emitters/ir.ts:64`, `packages/codegen/src/emitters/from.ts:115`, `packages/codegen/src/emitters/types.ts:286`
- Create: `packages/codegen/src/emitters/overlays/module.ts`
- Modify: `packages/rust/tests/namespace-map-convergence.test.ts:43`, `packages/typescript/tests/namespace-map-convergence.test.ts:35`, `packages/python/tests/namespace-map-convergence.test.ts:34`, `packages/rust/tests/trivia.test.ts:6`, `packages/python/tests/from-loose.test.ts:12`
- Test: `packages/codegen/src/emitters/__tests__/overlay-module.test.ts`

**Interfaces:**
- Produces: `OVERLAY_CHAIN: readonly ['refines', 'polymorphs', 'supertypes']`, `overlayImportPath(index: number): string` (`'../raw.js'` for 0, `./<prev>.js` otherwise), `emitFactoriesIndex(head: string | undefined): string`, `interface Attachment { readonly builder: string; readonly props: readonly AttachedProp[] }`, `interface AttachedProp { readonly key: string; readonly typeExpr: string; readonly valueExpr: string }`, `emitOverlayModule(opts: { importPath: string; attachments: readonly Attachment[]; preamble?: readonly string[] }): string`.
- Produces on `GeneratedFiles` / `EmitAllResult`: `factories` (unchanged: raw content), `overlays: { refines: string; polymorphs: string; supertypes: string }`, `factoriesIndex: string`. In this task the three overlay strings are the trivial pass-through module (no attachments) so the chain already exists end to end.

- [ ] **Step 1: Write the failing test for the module emitter**

```ts
// packages/codegen/src/emitters/__tests__/overlay-module.test.ts
import { describe, it, expect } from 'vitest';
import { emitOverlayModule, emitFactoriesIndex, overlayImportPath, OVERLAY_CHAIN } from '../overlays/module.ts';

describe('overlay module text', () => {
	it('re-exports the previous layer and attaches props with attachProps', () => {
		const text = emitOverlayModule({
			importPath: '../raw.js',
			attachments: [
				{
					builder: 'buildLineComment',
					props: [
						{ key: 'docInner', typeExpr: 'typeof F.buildLineCommentDocInner', valueExpr: 'F.buildLineCommentDocInner' }
					]
				}
			]
		});
		expect(text).toContain("import * as F from '../raw.js';");
		expect(text).toContain("import { attachProps } from '../../utils.js';");
		expect(text).toContain("export * from '../raw.js';");
		expect(text).toContain(
			'export const buildLineComment: typeof F.buildLineComment & {\n  docInner: typeof F.buildLineCommentDocInner;\n} = attachProps(F.buildLineComment, {\n  docInner: F.buildLineCommentDocInner,\n});'
		);
	});

	it('quotes keys that are not identifiers', () => {
		const text = emitOverlayModule({
			importPath: './refines.js',
			attachments: [{ builder: 'buildX', props: [{ key: 'doc-inner', typeExpr: 'number', valueExpr: '1' }] }]
		});
		expect(text).toContain('"doc-inner": number;');
		expect(text).toContain('"doc-inner": 1,');
	});

	it('chain paths and the index re-export', () => {
		expect(OVERLAY_CHAIN).toEqual(['refines', 'polymorphs', 'supertypes']);
		expect(overlayImportPath(0)).toBe('../raw.js');
		expect(overlayImportPath(2)).toBe('./polymorphs.js');
		expect(emitFactoriesIndex('supertypes')).toContain("export * from './overlays/supertypes.js';");
		expect(emitFactoriesIndex(undefined)).toContain("export * from './raw.js';");
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/overlay-module.test.ts`
Expected: FAIL — cannot resolve `../overlays/module.ts`.

- [ ] **Step 3: Write `overlays/module.ts`**

```ts
// packages/codegen/src/emitters/overlays/module.ts
import { isValidIdent } from '../shared.ts';

export const OVERLAY_CHAIN = ['refines', 'polymorphs', 'supertypes'] as const;
export type OverlayName = (typeof OVERLAY_CHAIN)[number];

export interface AttachedProp {
	readonly key: string;
	readonly typeExpr: string;
	readonly valueExpr: string;
}

export interface Attachment {
	readonly builder: string;
	readonly props: readonly AttachedProp[];
}

export interface OverlayModuleOptions {
	readonly importPath: string;
	readonly attachments: readonly Attachment[];
	readonly preamble?: readonly string[];
}

export function overlayImportPath(index: number): string {
	return index === 0 ? '../raw.js' : `./${OVERLAY_CHAIN[index - 1]}.js`;
}

function propKey(key: string): string {
	return isValidIdent(key) ? key : JSON.stringify(key);
}

export function emitOverlayModule(opts: OverlayModuleOptions): string {
	const lines: string[] = [
		'// Auto-generated by @sittir/codegen — do not edit',
		`import * as F from '${opts.importPath}';`,
		"import { attachProps } from '../../utils.js';",
		`export * from '${opts.importPath}';`,
		''
	];
	if (opts.preamble && opts.preamble.length > 0) lines.push(...opts.preamble, '');
	for (const a of opts.attachments) {
		if (a.props.length === 0) continue;
		lines.push(`export const ${a.builder}: typeof F.${a.builder} & {`);
		for (const p of a.props) lines.push(`  ${propKey(p.key)}: ${p.typeExpr};`);
		lines.push(`} = attachProps(F.${a.builder}, {`);
		for (const p of a.props) lines.push(`  ${propKey(p.key)}: ${p.valueExpr},`);
		lines.push('});', '');
	}
	return lines.join('\n');
}

export function emitFactoriesIndex(head: OverlayName | undefined): string {
	const target = head === undefined ? './raw.js' : `./overlays/${head}.js`;
	return ['// Auto-generated by @sittir/codegen — do not edit', `export * from '${target}';`, ''].join('\n');
}
```

Note: `export *` plus a same-named local `export const` is legal ESM/TS — the local declaration shadows the star export, which is exactly the decoration semantics.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/overlay-module.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Thread the new files through `emit.ts`, `generate.ts`, `run-codegen.ts`**

In `emit.ts` `EmitAllResult` add:

```ts
	overlays: { refines: string; polymorphs: string; supertypes: string };
	factoriesIndex: string;
```

and in `emitAll` (after `const utils = ...`):

```ts
	const overlays = {
		refines: emitOverlayModule({ importPath: overlayImportPath(0), attachments: [] }),
		polymorphs: emitOverlayModule({ importPath: overlayImportPath(1), attachments: [] }),
		supertypes: emitOverlayModule({ importPath: overlayImportPath(2), attachments: [] })
	};
	const factoriesIndex = emitFactoriesIndex('supertypes');
```

return them. In `generate.ts` `GeneratedFiles` add the same two fields and copy `emitted.overlays`, `emitted.factoriesIndex` into `result`.

In `run-codegen.ts` replace the `factories.ts` write:

```ts
	const factoriesDir = join(outDir, 'factories');
	mkdirSync(join(factoriesDir, 'overlays'), { recursive: true });
	rmSync(join(outDir, 'factories.ts'), { force: true });
	await writeFile(join(factoriesDir, 'raw.ts'), result.factories);
	await writeFile(join(factoriesDir, 'overlays', 'refines.ts'), result.overlays.refines);
	await writeFile(join(factoriesDir, 'overlays', 'polymorphs.ts'), result.overlays.polymorphs);
	await writeFile(join(factoriesDir, 'overlays', 'supertypes.ts'), result.overlays.supertypes);
	await writeFile(join(factoriesDir, 'index.ts'), result.factoriesIndex);
```

Also update the help text at `run-codegen.ts:372` (`factories.ts` → `factories/`).

- [ ] **Step 6: Repoint importers**

- `emitters/ir.ts:64`: `"import * as F from './factories/index.js';"`
- `emitters/from.ts:115`: `import * as F from './factories/index.js';`
- `emitters/types.ts:286`: `import type * as F$ from './factories/raw.js';` (type-only; stays on raw to avoid a type cycle through the overlays)
- The five package tests listed above: `'../src/factories.ts'` → `'../src/factories/raw.ts'` (`namespace-map-convergence` pins `BuildArgs` aliases, a raw fact); `'../src/factories.js'` → `'../src/factories/index.js'` (`trivia.test.ts`, `from-loose.test.ts`).

- [ ] **Step 7: Regenerate all three grammars and gate**

Run:
```bash
for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; done
git status --short packages/*/src | head
git diff --stat -- packages/rust/src/ir.ts packages/rust/src/from.ts packages/rust/src/types.ts
```
Expected: `factories.ts` deleted, `factories/raw.ts` identical to the old `factories.ts` (`git diff --no-index <(git show HEAD:packages/rust/src/factories.ts) packages/rust/src/factories/raw.ts` is empty except the header if any), `ir.ts`/`from.ts`/`types.ts` differ only in the import line. Then:

```bash
pnpm run validate:native && pnpm run validate:history
pnpm exec vitest run --root packages/codegen
(cd rust && cargo check)
pnpm run type-check 2>&1 | grep -c 'error TS'
```
Expected: floors exact, suite green, cargo clean, type-check count unchanged (126).

- [ ] **Step 8: Glossary + commit**

Add `###` sections to `docs/glossary/emitters.md` for `overlays/module.ts::OVERLAY_CHAIN`, `::emitOverlayModule`, `::emitFactoriesIndex`, `::overlayImportPath` (what each emits; the shadowing-by-local-export rule; the fixed chain order and why).

```bash
git add -- packages/codegen/src docs/glossary/emitters.md packages/rust/src packages/typescript/src packages/python/src packages/rust/tests packages/typescript/tests packages/python/tests
git commit -m "feat(emitters): factories/raw.ts + overlay chain scaffolding; importers on factories/index.js"
```

---

### Task 2: `bundle()` runtime helper and `ir.ts` bundles on it

**Files:**
- Modify: `packages/codegen/src/emitters/client-utils.ts:44-54`
- Modify: `packages/codegen/src/emitters/ir.ts:36-48` (bundleRef), `:66` (import), `:252-283` (`bundleParts`, `hoistedBundleLines`)
- Test: `packages/codegen/src/emitters/__tests__/utils-engine-emit.test.ts` (extend), `packages/codegen/src/emitters/__tests__/refine-emit.test.ts` (update the ir assertions)

**Interfaces:**
- Produces (generated `utils.ts`): `export function bundle<C extends (...a: never[]) => unknown, S extends (...a: never[]) => unknown>(coerce: C, strict: S): C & { strict: S } & Pick<S, keyof S>` — attaches `strict` plus every own enumerable property of `strict` onto `coerce`.
- Produces (generated `ir.ts`): every `_b$<kind>` is `const _b$x = bundle(FR.coerceToX, F.buildX);` (no typeof annotation block); kinds with no raw factory stay `FR.x` bare.

- [ ] **Step 1: Failing test for the emitted helper**

Append to `utils-engine-emit.test.ts`:

```ts
	it('emits bundle() beside attachProps()', () => {
		const text = emitClientUtils({ nodeMap, generatedIdTables: undefined, triviaKinds: [] });
		expect(text).toContain('export function bundle<');
		expect(text).toContain("attachProps(coerce, { strict, ...ownProps(strict) })");
	});
```

(Reuse the `nodeMap` fixture that file already builds; if it names it differently, use that name.)

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/utils-engine-emit.test.ts`
Expected: FAIL on the `bundle<` assertion.

- [ ] **Step 3: Emit the helper**

In `client-utils.ts` `emitAttachProps()` add after the `attachProps` function:

```ts
		'',
		'function ownProps<S extends object>(fn: S): Pick<S, keyof S> {',
		'  const out: Record<string, unknown> = {};',
		'  for (const key of Object.keys(fn)) out[key] = (fn as Record<string, unknown>)[key];',
		'  return out as Pick<S, keyof S>;',
		'}',
		'',
		'export function bundle<C extends (...args: never[]) => unknown, S extends (...args: never[]) => unknown>(coerce: C, strict: S): C & { strict: S } & Pick<S, keyof S> {',
		'  return attachProps(coerce, { strict, ...ownProps(strict) }) as C & { strict: S } & Pick<S, keyof S>;',
		'}'
```

`Object.keys` on a function returns only its enumerable own props — exactly what `attachProps` defines (`enumerable: true`) — so `name`/`length` are never copied.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/utils-engine-emit.test.ts`
Expected: PASS.

- [ ] **Step 5: Rewrite `ir.ts` bundle composition**

Replace `BundleParts`, `bundleParts`, `hoistedBundleLines` with:

```ts
function bundleLine(name: string, node: AssembledNode): string {
	const coerce = `FR.${node.fromFunctionName}`;
	return node.rawFactoryName === undefined
		? `const ${name} = ${coerce};`
		: `const ${name} = bundle(${coerce}, F.${node.rawFactoryName});`;
}
```

`bundleRef` pushes `bundleLine(name, node)` (plus a blank line) instead of `hoistedBundleLines(...)`. Change the utils import to `"import { bundle } from './utils.js';"`. Delete the `refineInfos` / `refineByKind` locals and the `collectRefineKindInfos`, `refineFormFactoryName`, `camelCase`, `RefineKindInfo` imports from `ir.ts` (refine forms reach `ir.x.<form>` through the spread in Task 3).

- [ ] **Step 6: Update `refine-emit.test.ts`**

Its `ir.ts` assertions currently look for the per-form key on the bundle (`"curly": F.buildIfaceBodyCurly` or similar). Change them to assert the bundle line `bundle(FR.coerceToIfaceBody, F.buildIfaceBody)` and move the per-form key assertions to Task 3's refines overlay test. Confirm with stash-and-rerun that the old assertion was pinning the old composition, not a behaviour the spec keeps.

- [ ] **Step 7: Regenerate + gate**

Same commands as Task 1 Step 7. Expected: `ir.ts` shrinks (bundle lines), `packages/*/tests/ir-grouped-equivalence.test.ts` still passes (`ir.binary.strict` exists via `bundle`), validators exact, cargo clean, type-check count unchanged.

- [ ] **Step 8: Glossary + commit**

Glossary: `client-utils.ts::emitAttachProps` (now also `bundle`/`ownProps`; state the invariant "a bundle carries `strict` plus every own enumerable prop of the strict builder"), `ir.ts::bundleLine`; remove the `bundleParts`/`hoistedBundleLines` sections.

```bash
git add -- packages/codegen/src docs/glossary/emitters.md packages/rust/src packages/typescript/src packages/python/src
git commit -m "feat(ir): bundle(FR.x, F.x) — bundles spread the strict builder's own props"
```

---

### Task 3: Refines overlay

**Files:**
- Create: `packages/codegen/src/emitters/overlays/refines.ts`
- Modify: `packages/codegen/src/emitters/emit.ts` (use it for `overlays.refines`)
- Test: `packages/codegen/src/emitters/__tests__/refine-emit.test.ts` (extend)

**Interfaces:**
- Produces: `emitRefinesOverlay(config: { nodeMap: NodeMap }): string` and `refineAttachments(nodeMap: NodeMap): Attachment[]`.
- Keys: `camelCase(form.name)`, plus the raw `form.name` when it differs (the same pair `ir.ts` used to attach). Value/type: `F.<refineFormFactoryName(rawFactoryName, form.name)>` / `typeof F.<…>`.

- [ ] **Step 1: Failing test**

In `refine-emit.test.ts`, add a test that builds the synthetic refined grammar (existing `makeRefineRaw` helper → `link` → `normalizeGrammar` → `assemble`) and asserts:

```ts
import { emitRefinesOverlay } from '../overlays/refines.ts';

	it('refines overlay attaches each form factory on the parent builder', () => {
		const text = emitRefinesOverlay({ nodeMap });
		expect(text).toContain("import * as F from '../raw.js';");
		expect(text).toContain('export const buildIfaceBody: typeof F.buildIfaceBody & {');
		expect(text).toContain('  curly: typeof F.buildIfaceBodyCurly;');
		expect(text).toContain('  curly: F.buildIfaceBodyCurly,');
	});
```

(Use the form names the fixture declares — `curly`/`flow` per the file's header comment.)

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/refine-emit.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// packages/codegen/src/emitters/overlays/refines.ts
import type { NodeMap } from '../../compiler/types.ts';
import { AssembledList } from '../../compiler/model/node-map.ts';
import { isSlotBearingCompound } from '../shared.ts';
import { camelCase, collectRefineKindInfos, refineFormFactoryName } from '../refine-emit.ts';
import { emitOverlayModule, overlayImportPath, type Attachment } from './module.ts';

export function refineAttachments(nodeMap: NodeMap): Attachment[] {
	const out: Attachment[] = [];
	for (const info of collectRefineKindInfos(nodeMap) ?? []) {
		const node = info.node;
		if (!isSlotBearingCompound(node) || node instanceof AssembledList || !node.rawFactoryName) continue;
		const props = [];
		for (const form of info.forms) {
			const fn = `F.${refineFormFactoryName(node.rawFactoryName, form.name)}`;
			const keys = [camelCase(form.name)];
			if (keys[0] !== form.name) keys.push(form.name);
			for (const key of keys) props.push({ key, typeExpr: `typeof ${fn}`, valueExpr: fn });
		}
		out.push({ builder: node.rawFactoryName, props });
	}
	return out;
}

export function emitRefinesOverlay(config: { nodeMap: NodeMap }): string {
	return emitOverlayModule({ importPath: overlayImportPath(0), attachments: refineAttachments(config.nodeMap) });
}
```

Wire `overlays.refines = emitRefinesOverlay({ nodeMap })` in `emit.ts`.

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/refine-emit.test.ts`
Expected: PASS.

- [ ] **Step 5: Regenerate + gate**

Same commands as Task 1 Step 7. Additionally probe:

```bash
pnpm exec tsx -e "import('./packages/typescript/src/index.ts').then(m => { const k = Object.keys(m.ir).find(k => typeof (m.ir as any)[k] === 'function' && Object.keys((m.ir as any)[k]).length > 1); console.log(k, Object.keys((m.ir as any)[k!])); })"
```
Expected: a bundle listing `strict` plus its refine-form keys (typescript declares refine forms; rust/python may have none — then the overlay file contains only the header and `export *`).

- [ ] **Step 6: Glossary + commit**

Glossary: `overlays/refines.ts::refineAttachments`, `::emitRefinesOverlay`.

```bash
git add -- packages/codegen/src docs/glossary/emitters.md packages/rust/src packages/typescript/src packages/python/src
git commit -m "feat(overlays): refines overlay attaches refine-form factories on the parent builder"
```

---

### Task 4: Sub-factory derivation (pure)

**Files:**
- Create: `packages/codegen/src/emitters/overlays/sub-factories.ts`
- Test: `packages/codegen/src/emitters/__tests__/sub-factories.test.ts`

**Interfaces:**
- Produces:

```ts
export interface LiteralArm { readonly via: 'literal'; readonly literal: string }
export interface KindArm { readonly via: 'kind'; readonly child: AssembledNode; readonly path: readonly string[] }
export interface SubFactory {
	readonly name: string;
	readonly slot: AssembledNonterminal;          // the parent's choice slot
	readonly residual: readonly AssembledNonterminal[]; // parent slots minus the choice slot
	readonly arm: LiteralArm | KindArm;
}
export interface SubFactoryDiagnostic {
	readonly parent: string;
	readonly name: string;
	readonly reason: 'ambiguous' | 'slot-collision';
	readonly claimants: readonly string[];
}
export interface SubFactorySet { readonly entries: readonly SubFactory[]; readonly diagnostics: readonly SubFactoryDiagnostic[] }
export function choiceSlotOf(node: AssembledNode): AssembledNonterminal | undefined;
export function armName(parent: AssembledNode, value: NodeOrTerminal, nodeMap: NodeMap): string | undefined;
export function subFactoriesOf(node: AssembledNode, nodeMap: NodeMap, opts?: { isEmitted?: (kind: string) => boolean }): SubFactorySet;
export function armConfigKeys(sub: SubFactory, nodeMap: NodeMap): readonly string[];
```

Rules (from the spec):
- `choiceSlotOf`: the slots of a slot-bearing compound that is not a list; a *choice slot* has `values.length >= 2` and `!isMultiple(slot)`; eligible iff exactly one choice slot exists → return it, else `undefined`.
- `armName`: kind arm → if child is an `AbstractAssembledCompound` with `child.hoisted && child.parentKind === parent.kind` → `camelCase(child.name)`; else `camelCase(prefixNamedSuffix(parent.kind, child.kind) ?? child.kind.replace(/^_+/, ''))` (`prefixNamedSuffix` from `compiler/variant-structural.ts`). Literal arm → `isValidIdent(value)` ? `value` : `camelCase(resolvedKind)` where `resolvedKind` is the ref's resolved token-kind name (the field the removed emitter read as `v.resolvedKind`; if the `NodeRef` type carries it under another name today, use that — never derive it from the literal text) ; `undefined` when neither exists → arm skipped. An authored `variant()` on a literal arm reaches the overlay as a *kind* arm: enrich hoists that arm into `<parent>_<variant>` with the literal fixed inside it, so the rename needs no literal-specific code here — `armName`'s hoisted-child branch already yields the variant name.
- `subFactoriesOf`: parent must satisfy `isSlotBearingCompound && !(instanceof AssembledList) && rawFactoryName && !nodeMap.refineForms?.has(kind)`; for each value of the choice slot: kind arm requires `child.rawFactoryName && isEmitted(child.kind)` and child is `isSlotBearingCompound || isTextLeaf`; literal arm as above. Recursion: for a kind arm whose child is itself eligible (guard with a `visiting` set), each child sub-factory `s` yields a flattened entry `{ name: s.arm.via === 'kind' ? armName(parent, thatChildRef) : s.name, path: [s.name, ...], arm: kind arm of the *direct* child }` — i.e. the flattened entry always targets the direct child and records the path of sub-factory names to call on it. Direct entries win a name over flattened ones (drop the flattened one silently — the direct arm is the canonical claimant); two flattened claimants → neither, diagnostic `ambiguous` listing `<child>.<path>` claimants.
- `armConfigKeys`: the arm's config keys — `[]` for a literal arm or a kind arm whose child surface (`classifyFactoryShape(child)`) is not `config`; otherwise the child's `fields.map(f => f.configKey)` (for a flattened path, the keys of the child's sub-factory: residual of the child ∪ grand-arm keys, recursively). The calling convention itself is never re-derived here: consumers ask `classifyFactoryShape(child)`. Slot collision: any key ∈ `residual.map(f => f.configKey)` → diagnostic `slot-collision`, entry dropped.
- Results are cached per `nodeMap` in a `WeakMap`, like the removed emitter.

- [ ] **Step 1: Failing tests on a synthetic grammar**

Build the grammar the way `refine-emit.test.ts` does (`RawGrammar` → `link` → `normalizeGrammar` → `assemble`). Rules:

```ts
// comment: choice(doc_comment, plain_comment)      → envelope parent, two kind arms
// doc_comment: seq('///', field('text', pattern))  → text-carrying leaf-ish kind
// plain_comment: seq('//', field('text', pattern))
// logic: seq(field('left', identifier), field('op', choice('and', 'or')), field('right', identifier))  → branch parent, literal arms
// identifier: pattern
```

Tests:

```ts
	it('envelope with a kind-choice sole slot yields one kind arm per child', () => {
		const set = subFactoriesOf(nodeMap.nodes.get('comment')!, nodeMap);
		expect(set.entries.map((e) => e.name).sort()).toEqual(['doc', 'plain']);
		expect(set.entries.every((e) => e.residual.length === 0)).toBe(true);
		expect(set.diagnostics).toEqual([]);
	});
	it('branch with an enum slot yields literal arms with the residual', () => {
		const set = subFactoriesOf(nodeMap.nodes.get('logic')!, nodeMap);
		expect(set.entries.map((e) => e.name).sort()).toEqual(['and', 'or']);
		expect(set.entries[0]!.residual.map((f) => f.name).sort()).toEqual(['left', 'right']);
		expect(armConfigKeys(set.entries[0]!, nodeMap)).toEqual([]);
	});
	it('a kind with two choice slots is not eligible', () => { /* add `pair: seq(field('a', choice(x,y)), field('b', choice(x,y)))` */
		expect(choiceSlotOf(nodeMap.nodes.get('pair')!)).toBeUndefined();
	});
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/sub-factories.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `sub-factories.ts`** per the rules above. Skeleton:

```ts
import type { NodeMap } from '../../compiler/types.ts';
import {
	AbstractAssembledCompound, AssembledList, isNodeRef, isTerminalValue, isMultiple, storageKindOfRef,
	type AssembledNode, type AssembledNonterminal, type NodeOrTerminal
} from '../../compiler/model/node-map.ts';
import { isSlotBearingCompound, isTextLeaf, isValidIdent, classifyFactoryShape } from '../shared.ts';
import { camelCase } from '../refine-emit.ts';
import { prefixNamedSuffix } from '../../compiler/variant-structural.ts';

export function choiceSlotOf(node: AssembledNode): AssembledNonterminal | undefined {
	if (!isSlotBearingCompound(node) || node instanceof AssembledList) return undefined;
	const choices = node.fields.filter((f) => f.values.length >= 2 && !isMultiple(f));
	return choices.length === 1 ? choices[0] : undefined;
}
// armName, subFactoriesOf (with the WeakMap cache + visiting set), armConfigKeys as specified.
```

- [ ] **Step 4: Run to verify they pass**

Run: `pnpm exec vitest run --root packages/codegen src/emitters/__tests__/sub-factories.test.ts`
Expected: PASS.

- [ ] **Step 5: Glossary + commit**

Glossary sections for every export in `overlays/sub-factories.ts`, stating the formula "subfactory = parent slots − choice slot ∪ arm slots", the eligibility rule, naming rule, recursion/ambiguity rule, and collision rule.

```bash
git add -- packages/codegen/src docs/glossary/emitters.md
git commit -m "feat(overlays): sub-factory derivation — one choice slot, arms, residual, recursion"
```

---

### Task 5: Polymorphs overlay emitter

**Files:**
- Create: `packages/codegen/src/emitters/overlays/polymorphs.ts`
- Modify: `packages/codegen/src/emitters/emit.ts` (wire `overlays.polymorphs`)
- Test: `packages/codegen/src/emitters/__tests__/polymorphs-overlay.test.ts`

**Interfaces:**
- Produces: `emitPolymorphsOverlay(config: { nodeMap: NodeMap; generatedIdTables?: GeneratedIdTables }): string`, `subFactoryProp(parent, sub, nodeMap, kindEntries): AttachedProp`.
- Emission order: parents are emitted after any child they reference through a flattened path (DFS post-order over `subFactoriesOf` kind arms), so a flattened entry can reference the local decorated `buildChild` const.
- Emit-time diagnostics from `subFactoriesOf(...).diagnostics` are printed with `console.warn('[codegen] <parent>: sub-factory <name> skipped (<reason>): <claimants>')` — same channel the removed emitter used.

Prop shapes (`P` = `F.<parent.rawFactoryName>`, `C` = `F.<child.rawFactoryName>` or `<localChildConst>.<path…>` for flattened, `k` = `slot.configKey`, `Cfg` = `Parameters<typeof P>[0]`, `val(lit)` = `kindEnumConfigValue(lit, kindEntries)`):

| case | valueExpr | typeExpr |
| --- | --- | --- |
| residual ∅, kind arm, parent takes the arm positionally (`resolveDirectFactorySlot(parent) !== undefined`) | `(...args: Parameters<typeof C>) => P(C(...args))` | `(...args: Parameters<typeof C>) => ReturnType<typeof P>` |
| residual ∅, kind arm, parent config-shaped | `(...args: Parameters<typeof C>) => P({ k: C(...args) })` | same |
| residual ∅, literal arm | `() => P(val)` (positional parent) or `() => P({ k: val })` | `() => ReturnType<typeof P>` |
| residual ≠ ∅, literal arm | `(config: Omit<Cfg, 'k'>) => P({ ...config, k: val })` | `(config: Omit<Cfg, 'k'>) => ReturnType<typeof P>` |
| residual ≠ ∅, kind arm, `classifyFactoryShape(child) === 'config'`, `armConfigKeys` = `c1…cn` | `(config: Omit<Cfg, 'k'> & Parameters<typeof C>[0]) => { const { c1, …, cn, ...rest } = config; return P({ ...rest, k: C({ c1, …, cn }) }); }` | `(config: Omit<Cfg, 'k'> & Parameters<typeof C>[0]) => ReturnType<typeof P>` |
| residual ≠ ∅, kind arm, `classifyFactoryShape(child)` ∈ {`text`, `direct`, `forwarded`} | `(config: Omit<Cfg, 'k'> & { k: Parameters<typeof C>[0] }) => { const { k, ...rest } = config; return P({ ...rest, k: C(k) }); }` | analogous |
| residual ≠ ∅, kind arm spread (`spread`/`elements`) | `(config: Omit<Cfg, 'k'> & { k: Parameters<typeof C> }) => { const { k, ...rest } = config; return P({ ...rest, k: C(...k) }); }` | analogous |

When a parent's own factory is `config`-shaped but `Cfg` may be optional (`config?:`), use `NonNullable<Parameters<typeof P>[0]>` for `Cfg`.

- [ ] **Step 1: Failing test** (same synthetic grammar as Task 4):

```ts
	it('emits a form constructor per kind arm and a member constructor per literal', () => {
		const text = emitPolymorphsOverlay({ nodeMap });
		expect(text).toContain("import * as F from './refines.js';");
		expect(text).toContain('export const buildComment: typeof F.buildComment & {');
		expect(text).toContain('  doc: (...args: Parameters<typeof F.buildDocComment>) => F.buildComment(F.buildDocComment(...args)),');
		expect(text).toContain("  and: (config: Omit<NonNullable<Parameters<typeof F.buildLogic>[0]>, 'op'>) => F.buildLogic({ ...config, op: 'and' }),");
	});
```

(Without id tables `kindEnumConfigValue` returns the quoted literal — match that string.)

- [ ] **Step 2: Run to verify it fails.** Expected: module not found.

- [ ] **Step 3: Implement `polymorphs.ts`**: collect `kindEntries` as `ir.ts` does (`collectKindEntries(collectCatalogKinds(generatedIdTables), nodeMap, generatedIdTables)`), `isEmitted = (k) => !kindEntries || hasCatalogEntry(kindEntries, k)`; iterate `nodeMap.nodes` in DFS post-order; build one `Attachment` per parent with ≥1 entry via `subFactoryProp`; `emitOverlayModule({ importPath: overlayImportPath(1), attachments })`. Wire into `emit.ts`.

- [ ] **Step 4: Run to verify it passes.**

- [ ] **Step 5: Regenerate + gate + probes**

Same gate commands as Task 1 Step 7, plus probes (rust):

```bash
pnpm exec tsx -e "import('./packages/rust/src/index.ts').then(({ ir }) => {
  console.log(ir.lineComment.docInner(' hi').\$render());                 // '//! hi'
  console.log(ir.visibilityModifier.inPath(ir.scopedIdentifier({ path: ir.crate(), name: ir.identifier('x') })).\$render()); // 'pub(in crate::x)'
  console.log(ir.expressionStatement.withSemi({ expression: ir.identifier('x') }).\$render()); // 'x;'
  console.log(ir.binaryExpression.ampAmp({ left: ir.identifier('a'), right: ir.identifier('b') }).\$render()); // 'a && b'
  console.log(typeof ir.binaryExpression.in);                              // 'function'
})"
```
Expected output as commented. If `in` is missing, the arm's variant rename is not present in `packages/rust/grammar.sittir.ts` — add `variant('in')` on the `binary_expression` arm path there (authored data, allowed) and regenerate. Print the emit diagnostics count per grammar and record it in the commit message.

- [ ] **Step 6: Glossary + commit**

Glossary: `overlays/polymorphs.ts::emitPolymorphsOverlay`, `::subFactoryProp` (the table above as prose), emission order rule.

```bash
git add -- packages/codegen/src docs/glossary/emitters.md packages/rust/src packages/typescript/src packages/python/src packages/rust/grammar.sittir.ts
git commit -m "feat(overlays): polymorph overlay — form and enum-member constructors on the parent builder"
```

---

### Task 6: Hidden choice-of-kinds rules are supertypes; grouped namespaces move to the overlays

**Files:**
- Modify: `packages/codegen/src/dsl/rule-patterns.ts` (add `isKindChoice` beside `isSupertypeLike`)
- Modify: `packages/codegen/src/compiler/link.ts:745-758` (`pruneInlinedAliasBodies`)
- Modify: `packages/codegen/src/compiler/assemble.ts:900-929` (`classifyNode`)
- Create: `packages/codegen/src/emitters/overlays/supertype-groups.ts` (derivation; `groupNameFor`, `memberKeyFor`, `GROUP_TOKEN_SYNONYMS`, `CATEGORY_TOKENS`, `normalizeGroupToken`, `toCamel` move here from `ir.ts`)
- Create: `packages/codegen/src/emitters/overlays/supertypes.ts`
- Modify: `packages/codegen/src/emitters/ir.ts:80-170` (group loop → projection of `supertypeGroups`), `:289-340` (delete the moved helpers, import them)
- Modify: `docs/superpowers/specs/2026-08-30-3e-overlay-surface.md` "Supertypes" paragraph (amendment in Global Constraints)
- Test: `packages/codegen/src/emitters/__tests__/supertype-groups.test.ts`, `packages/codegen/src/compiler/__tests__/hidden-choice-supertype.test.ts`

**Interfaces:**
- `isKindChoice(rule: Rule<'link'>): boolean` — CHOICE whose every member (after `unwrapPrec`) is a `SYMBOL` or a named `ALIAS`; no STRING members (unlike `isSupertypeLike`).
- `pruneInlinedAliasBodies` keeps a hidden rule when `isKindChoice(rule)`.
- `classifyNode`: in the leading `fieldName === undefined && multiplicity === undefined` block add `case CHOICE: if (kind.startsWith('_') && isKindChoice(rule)) return 'supertype'; break;` — visible kinds with a choice body stay compounds.
- `supertypeGroups(nodeMap, kindEntries): Group[]` with `interface Group { readonly name: string; readonly supertype: AssembledSupertype; readonly members: readonly { key: string; node: AssembledNode }[] }`. Members = the supertype's transitive storage kinds (`node.transitiveParseKinds` mapped through `storageKindOfRef`, falling back to `subtypeNames` when the closure is absent), filtered as `ir.ts` filters today (no `_` kinds, `rawFactoryName`, not `factoryInline`, catalog entry, not a supertype/token), re-keyed by `memberKeyFor(kind, supertype.kind)`, first claimant wins a key.
- `emitSupertypesOverlay({ nodeMap, generatedIdTables })`: for each group, `export const <name>: { readonly <key>: typeof F.<raw>; … } = { <key>: F.<raw>, … };` after the `export *`, via `emitOverlayModule`'s `preamble` (groups are not attachments; they are new consts). Import path `overlayImportPath(2)`.
- `ir.ts`: `for (const g of supertypeGroups(nodeMap, kindEntries))` emits `export const <name> = { key: bundleRef(node) | F.<raw> }` exactly as its loop does today (bundles for compounds/lists, `F.x` for leaves). The short-alias loop also reads `supertypeGroups` instead of re-walking `subtypeNames`.

- [ ] **Step 1: Failing compiler test**

```ts
// packages/codegen/src/compiler/__tests__/hidden-choice-supertype.test.ts
// grammar: source: repeat(_stmt); _stmt: choice(a_stmt, b_stmt); a_stmt: seq('a', field('x', ident)); b_stmt: seq('b', field('x', ident)); ident: pattern
	it('a hidden choice of kinds survives link and assembles as a supertype', () => {
		const nodeMap = assembleFrom(raw);
		const node = nodeMap.nodes.get('_stmt');
		expect(node).toBeInstanceOf(AssembledSupertype);
		expect((node as AssembledSupertype).subtypeNames.sort()).toEqual(['a_stmt', 'b_stmt']);
		// the reference inside `source` is still inlined: its slot unions the two kinds directly
		const source = nodeMap.nodes.get('source') as AbstractAssembledCompound;
		expect(slotKindNames(source.soleSlot!).sort()).toEqual(['a_stmt', 'b_stmt']);
	});
```

- [ ] **Step 2: Run to verify it fails** (`_stmt` is `undefined`).

- [ ] **Step 3: Implement `isKindChoice`, the prune exemption, the classifier case.**

- [ ] **Step 4: Run to verify it passes.**

- [ ] **Step 5: Failing groups test** (same grammar): `supertypeGroups(nodeMap, undefined)` contains `{ name: 'stmt', members: [{ key: 'a' }, { key: 'b' }] }` (keys per `memberKeyFor`), and `emitSupertypesOverlay` text contains `export const stmt: {` with `a: F.buildAStmt`.

- [ ] **Step 6: Implement `supertype-groups.ts`, `supertypes.ts`; rewrite the `ir.ts` group loop and short-alias loop onto `supertypeGroups`; delete the moved helpers from `ir.ts`.**

- [ ] **Step 7: Run both tests + the full unit suite.** Expected: PASS; `ir-emitter`/`refine-emit` tests unaffected.

- [ ] **Step 8: Regenerate + gate.** New supertype nodes appear (`_statement` in rust and python at least; list every new `AssembledSupertype` per grammar with `pnpm exec tsx packages/cli/src/cli.ts tool classify --grammar <g> --modeltype supertype` before/after and put the delta in the commit message). Expected: validators exact at floor (no slot changed — references were already inlined), `cargo check` clean (a new, unreferenced supertype transport enum may emit — if cargo warns on dead code in generated files, that is a finding to record, not silence), unit suite green, `ir.statement` present in rust and python:

```bash
pnpm exec tsx -e "import('./packages/rust/src/index.ts').then(({ ir }) => console.log(Object.keys(ir.statement)))"
```

- [ ] **Step 9: Amend the spec paragraph, glossary, commit.**

Glossary: `dsl/rule-patterns.ts::isKindChoice` (dsl.md), `compiler/link.ts::pruneInlinedAliasBodies` (update: the kind-choice exemption and why — a hidden dispatch union is a namespace even when every reference to it was spliced), `compiler/assemble.ts::classifyNode` (update), `overlays/supertype-groups.ts::*`, `overlays/supertypes.ts::emitSupertypesOverlay`, and move the `ir.ts::groupNameFor` / `memberKeyFor` sections to their new path.

```bash
git add -- packages/codegen/src docs/glossary docs/superpowers/specs/2026-08-30-3e-overlay-surface.md packages/rust/src packages/typescript/src packages/python/src
git commit -m "feat(overlays): hidden choice-of-kinds rules are supertypes; grouped namespaces derive in the overlays"
```

---

### Task 7: Generated per-sub-factory tests

**Files:**
- Modify: `packages/codegen/src/emitters/test.ts:64-128` (dispatch), add `emitSubFactoryTests`
- Test: the generated `tests/generated.test.ts` per grammar (run it), plus `packages/codegen/src/emitters/__tests__/test-emitter-sub-factories.test.ts`

**Interfaces:**
- `emitSubFactoryTests(lines, node, kind, key, nodeMap, kindEntries, expectTestFailures)` called from `emitTests` for `branch`/`envelope`/`polymorph` nodes after `emitBranchTest`. For each `subFactoriesOf(node).entries` with computable args: `it('<name> builds the parent', () => { const node = ir.<key>.<name>(<args>); expect(node.$type).toBe(<discriminant>); expect(node.$render!().length).toBeGreaterThan(0); })` inside `describe('<kind> sub-factories')`. `expectTestFailures['<kind>.<name>']` marks a case `it.skip` with the `// known-failing:` line, as the old emitter did.
- Args: residual ∅ + kind arm → the child's own call args via the existing `factoryCallArgs`/`containerCallArgs`/leaf dummy machinery for the child node (positional or config as `constructorSurface(child)` dictates); residual ∅ + literal → `()`; residual ≠ ∅ → `{ <required residual fields via dummyValue>, <child keys via dummyValue on child fields> }` or `{ …, k: <child dummy> }` for positional arms. Skip an entry when a dummy cannot be built (the same `undefined` rule the old `namespacedCallArgs` used).

- [ ] **Step 1: Failing emitter test** (synthetic grammar from Task 4): generated text contains `describe('comment sub-factories'` and `ir.comment.doc(`.
- [ ] **Step 2: Run to verify it fails.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run to verify it passes.**
- [ ] **Step 5: Regenerate; run each grammar's generated tests**: `pnpm exec vitest run --root packages/rust tests/generated.test.ts` (and typescript, python). Expected: green; any red case is either a real overlay bug (fix at the root) or pinned via `expectTestFailures` in `packages/<lang>/grammar.sittir.ts` with a one-line reason — never deleted.
- [ ] **Step 6: Glossary (`test.ts::emitSubFactoryTests`) + commit** (`feat(test-emitter): one generated test per sub-factory`).

---

### Task 8: Consumers back to green; full gate

**Files:**
- Modify: `examples/17-dogfood-rust*.ts`, `examples/18-dogfood-typescript*.ts`, `examples/19-dogfood-python*.ts`, `examples/01-construct-nodes.ts`, `examples/02-render-round-trip.ts` (never committed — edit in place, keep `GAP` markers only where a construct is still unreachable)
- Modify: `packages/rust/tests/examples-verify.test.ts`, `packages/typescript/tests/examples-verify.test.ts`, `packages/python/tests/examples-verify.test.ts`, `packages/rust/tests/tree-identity-and-verbatim.test.ts`, `packages/*/tests/ir-grouped-equivalence.test.ts`, `packages/*/tests/namespace-map-convergence.test.ts`, `packages/typescript/tests/homogeneity-integration.test.ts`

- [ ] **Step 1: Rewrite the stale shapes only**
  - typescript `ir.identifier.identifier(name)` → `ir.identifier(name)` (18-dogfood-typescript-strict.ts:25,30,35,36,47,57 and 01-construct-nodes.ts:37).
  - `packages/*/tests/ir-grouped-equivalence.test.ts` "covers every supertype" group list: keep `statement` (now real), confirm `declaration` for typescript.
  - `namespace-map-convergence.test.ts` `Comment`/`JsxElement`/`Suite` missing-export errors and `FormalParameter` in `homogeneity-integration`: these predate the overlay (kinds pruned by link or renamed). Verify with `git stash` on the branch base that they fail there too; if so they are baseline errors — record them, do not fix here.
  - Everything else must now type-check unchanged; anything that does not is an overlay defect to fix at its root (Task 4/5/6 modules), not a call-site rewrite.

- [ ] **Step 2: Type-check**

Run: `pnpm run type-check 2>&1 | grep 'error TS' | sed -E 's/\([0-9]+,[0-9]+\)//' | sort | uniq -c | sort -rn`
Expected: only the 4 baseline errors plus any pre-existing ones proven in Step 1.

- [ ] **Step 3: Run the consumer suites**

```bash
pnpm exec vitest run --root packages/rust tests/examples-verify.test.ts tests/tree-identity-and-verbatim.test.ts tests/ir-grouped-equivalence.test.ts
pnpm exec vitest run --root packages/typescript tests/examples-verify.test.ts tests/ir-grouped-equivalence.test.ts
pnpm exec vitest run --root packages/python tests/examples-verify.test.ts tests/ir-grouped-equivalence.test.ts
```
Expected: green, or red only on cases carrying a `GAP` marker whose class is outside this spec (render defects, missing loose forms).

- [ ] **Step 4: Full three-way gate**

```bash
pnpm run validate:native && pnpm run validate:history
pnpm exec vitest run --root packages/codegen
(cd rust && cargo check && cargo test -p sittir-core)
pnpm exec tsx packages/cli/src/cli.ts tool propose-14
```
Expected: floors exact, suite green, cargo clean, ratchet OK.

- [ ] **Step 5: Docs**

- `.claude/architecture.md`: replace `factories.ts` with the `factories/` layout and the chain order.
- `docs/cli-command-glossary.md` if `gen --help` text changed (regenerate per its header).
- `docs/glossary/emitters.md`: remove any section for a declaration this plan deleted (`bundleParts`, `hoistedBundleLines`, `ir.ts::groupNameFor`, `ir.ts::memberKeyFor`).

- [ ] **Step 6: Commit (pathspec — never the examples, `TODO.md`, `tsconfig.json`, `validation-report.json`)**

```bash
git add -- packages/rust/tests packages/typescript/tests packages/python/tests .claude/architecture.md docs
git commit -m "test(consumers): overlay surface back on the examples-verify, identity, and grouped-equivalence suites"
```

- [ ] **Step 7: Record the run** — `save_session` with per-grammar validator numbers, type-check count, new-supertype list, and sub-factory counts per grammar (from the overlay files: `grep -c 'export const build' packages/<lang>/src/factories/overlays/polymorphs.ts`).
