# Dogfood Examples and Factory Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Tasks 2–4 are hand-rolling tasks the lead executes inline (the friction met while writing is the deliverable); Tasks 1 and 5–9 are delegable.

**Goal:** Prove the construction surface is complete for real code by hand-rolling `ir.*` programs that rebuild three real repo files, and land the two surface changes the spec already fixes: the `factoryInline` grammar section and shared per-field resolvers giving `engine.parse` nodes loose `$with` setters.

**Architecture:** Each dogfood example is a TypeScript module returning a rebuilt root node; a per-grammar `examples-verify.test.ts` asserts reparse-equality (`structuralShape`) and whitespace-normalized identity against the real file. Gaps are `// GAP <class>` markers pinned by `it.fails`, inventoried into a work list. `factoryInline` flows wire config → evaluate sinks → `RawGrammar` → `LinkedGrammar` → an assembled-node attribute the `ir`, `namespaced-constructors`, `from`, `factories` and `wrap` emitters read. Per-field resolvers are lifted out of `coerceTo<Kind>` into exported `resolve<Kind>_<field>` functions that `wrap`'s `$with` also calls.

**Tech Stack:** TypeScript (ESM, `.ts` imports), vitest, sittir codegen (`packages/codegen`), tree-sitter grammars for rust/typescript/python, native engine via napi.

**Spec:** `docs/superpowers/specs/2026-08-25-dogfood-examples-and-factory-surface-design.md`

## Global Constraints

- Generated files under `packages/{rust,typescript,python}/src/*`, `packages/<lang>/templates/*.jinja`, `packages/<lang>/.sittir/*` are NEVER hand-edited. Change the emitter under `packages/codegen/src` and regenerate all three grammars after ANY codegen edit: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <g> --all --output packages/<g>/src` for `g` in `rust typescript python`, serially, checking each exit code (`| tail` hides failures).
- Root `tsconfig.json` carries an UNCOMMITTED `incremental:false` toggle — never commit `tsconfig.json`. Per-package builds: `cd packages/<pkg> && pnpm exec tsc -p tsconfig.build.json --incremental`. Plain `pnpm run build` fails (TS6379).
- vitest resolves `@sittir/common` to its `dist`: rebuild `packages/common` after editing it. `@sittir/types` resolves to source.
- Serialize `vitest` and `validate:native`; never run both at once.
- Commit only with pathspecs: `git commit -- <paths>`. No PRs, no merges, no pushes unless the user says so.
- Gates before every commit: targeted probes; `pnpm run validate:history` numbers compared against the prior run and not regressed (current floors: rust 146/146 206/206 134/137 1519/1519; typescript 142/143 194/194 112/114 1202/1202; python 122/122 142/142 115/116 1385/1390); full suite `pnpm exec vitest run` (0 failed baseline, plus any `it.fails` pins this plan adds). A failed gate stops the work for review — never revert/stash to make it pass.
- Comments state live constraints only — no spec/plan/ADR/PR numbers, no history. No `as unknown` / `as any` casts.
- Branch: all work on `parse-api` after its three steps land (prerequisite: `engine.parse`, `engine.diagnostics`, verbatim slot carrier, `deep` flag). Task 1 may start before that using `engine.diagnostics.parseAndRead` + `wrapNode` only if `parse` is not yet available — but the committed harness must use `engine.parse`.
- `// GAP <A|B|C|D|E>: <what>` markers are working notes: deleted when the gap closes, never left in a commit that claims the example green.

---

### Task 1: Dogfood test contract helper

**Files:**
- Modify: `examples/helpers.ts` (append)
- Test: `packages/rust/tests/examples-verify.test.ts` (add one describe block that exercises the helper on an existing example)

**Interfaces:**
- Consumes: `engine.parse(source): <wrapped root>` (from the parse-api branch); `structuralShape(node)` already in `examples/helpers.ts`.
- Produces: `dogfoodContract(engine, rebuilt, targetPath): { reparsesEqual: boolean; sameModuloWhitespace: boolean; rendered: string; firstDifference?: string }` — used by every dogfood test in Tasks 2–4.

- [ ] **Step 1: Write the failing test**

Append to `packages/rust/tests/examples-verify.test.ts`:

```ts
import { dogfoodContract } from '../../../examples/helpers.ts';
import { createEngine, ir } from '../src/index.ts';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('dogfoodContract helper', () => {
	it('reports equality for a node that reproduces its own file', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-dogfood-'));
		const target = join(dir, 'main.rs');
		writeFileSync(target, 'pub fn main() { }\n');
		const rebuilt = ir.sourceFile.from({
			statements: [
				ir.functionItem.from({
					visibilityModifier: 'pub',
					name: 'main',
					parameters: ir.parameters.strict(),
					body: ir.block.strict()
				})
			]
		});
		const result = dogfoodContract(createEngine(), rebuilt, target);
		expect(result.reparsesEqual).toBe(true);
		expect(result.sameModuloWhitespace).toBe(true);
		expect(result.firstDifference).toBeUndefined();
	});
	it('names the first token that differs', () => {
		const dir = mkdtempSync(join(tmpdir(), 'sittir-dogfood-'));
		const target = join(dir, 'main.rs');
		writeFileSync(target, 'pub fn other() { }\n');
		const rebuilt = ir.functionItem.from({
			visibilityModifier: 'pub',
			name: 'main',
			parameters: ir.parameters.strict(),
			body: ir.block.strict()
		});
		const result = dogfoodContract(createEngine(), rebuilt, target);
		expect(result.sameModuloWhitespace).toBe(false);
		expect(result.firstDifference).toContain('other');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/rust/tests/examples-verify.test.ts -t dogfoodContract`
Expected: FAIL — `dogfoodContract` is not exported.

- [ ] **Step 3: Implement the helper**

Append to `examples/helpers.ts`:

```ts
import { readFileSync } from 'node:fs';

export interface DogfoodResult {
	readonly rendered: string;
	readonly reparsesEqual: boolean;
	readonly sameModuloWhitespace: boolean;
	/** The 80-character window around the first whitespace-insensitive
	 *  difference, `<target> ⟷ <rendered>`; absent when identical. */
	readonly firstDifference?: string;
}

function collapseWhitespace(s: string): string {
	return s.replace(/\s+/g, '');
}

/**
 * The dogfood contract: a rebuilt node renders to text that (1) re-parses
 * to the same tree as the target file and (2) is identical to the target
 * after collapsing whitespace. Layout is not the claim — canonical render
 * whitespace may differ from the author's.
 */
export function dogfoodContract(
	engine: { parse(source: string): unknown },
	rebuilt: { $render(): string },
	targetPath: string
): DogfoodResult {
	const target = readFileSync(targetPath, 'utf8');
	const rendered = rebuilt.$render();
	const reparsesEqual =
		JSON.stringify(structuralShape(engine.parse(rendered))) ===
		JSON.stringify(structuralShape(engine.parse(target)));
	const a = collapseWhitespace(target);
	const b = collapseWhitespace(rendered);
	if (a === b) return { rendered, reparsesEqual, sameModuloWhitespace: true };
	let i = 0;
	while (i < a.length && a[i] === b[i]) i++;
	const firstDifference = `${a.slice(Math.max(0, i - 40), i + 40)} ⟷ ${b.slice(Math.max(0, i - 40), i + 40)}`;
	return { rendered, reparsesEqual, sameModuloWhitespace: false, firstDifference };
}
```

`structuralShape` must also carry trivia: in its body, after the `_`-key loop, add

```ts
	if (record.$triviaData !== undefined) shape.$triviaData = structuralShape(record.$triviaData);
```

so comments participate in reparse-equality.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run packages/rust/tests/examples-verify.test.ts`
Expected: PASS (all previous cases plus the two new ones).

- [ ] **Step 5: Commit**

```bash
git commit -m "test(examples): dogfood contract helper (reparse-equal + whitespace-normalized identity)" -- examples/helpers.ts packages/rust/tests/examples-verify.test.ts
```

---

### Task 2: Hand-roll `examples/17-dogfood-rust.ts` (rebuilds `rust/crates/sittir-core/src/splice.rs`)

**Files:**
- Create: `examples/17-dogfood-rust.ts`
- Modify: `examples/tsconfig.json` (add `./17-dogfood-rust.ts` to `include`), `examples/README.md` (table row), `examples/index.ts` (export line)
- Test: `packages/rust/tests/examples-verify.test.ts`

**Interfaces:**
- Consumes: `dogfoodContract` (Task 1); `ir.*` from `@sittir/rust`.
- Produces: `export function rebuildSplice(): <SourceFileBuilt>`; a `// GAP` inventory inside the file.

- [ ] **Step 1: Write the failing test**

Append to `packages/rust/tests/examples-verify.test.ts`:

```ts
import { rebuildSplice } from '../../../examples/17-dogfood-rust.ts';

describe('examples/17 dogfood rust (splice.rs)', () => {
	const target = new URL('../../../rust/crates/sittir-core/src/splice.rs', import.meta.url).pathname;
	it('re-parses to the same tree as the real file', () => {
		expect(dogfoodContract(createEngine(), rebuildSplice(), target).reparsesEqual).toBe(true);
	});
	it('is identical to the real file modulo whitespace', () => {
		const r = dogfoodContract(createEngine(), rebuildSplice(), target);
		expect(r.firstDifference).toBeUndefined();
		expect(r.sameModuloWhitespace).toBe(true);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/rust/tests/examples-verify.test.ts -t "examples/17"`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the module skeleton with the first two items**

`examples/17-dogfood-rust.ts` — the file is rebuilt top-down, one top-level item per helper function so each item can be probed alone. Start with the module doc comment and the `use` declaration:

```ts
import { ir } from '@sittir/rust';

/** The `//!` module doc block — every line is one inner doc comment on the
 *  first item (rendered before it). */
const moduleDoc = [
	' Byte-level `apply_edits` on a source string. Spec 012 T024.',
	'',
	' Sorts edits by `start_pos` descending, applies each as a raw byte',
	// … one entry per `//!` line of splice.rs, verbatim after the `//!`
];

function useEdit() {
	return ir.useDeclaration.from({
		argument: ir.scopedIdentifier.from({
			path: ir.scopedIdentifier.from({ path: ir.crate(), name: 'types' }),
			name: 'Edit'
		})
	}).$trivia({ leading: moduleDoc.map((doc) => ir.lineComment.innerDoc({ doc })) });
}

export function rebuildSplice() {
	return ir.sourceFile.from({
		statements: [useEdit()]
	});
}
```

Where a name above does not type-check (`ir.crate`, `ir.lineComment.innerDoc`, the `scopedIdentifier` shape), do NOT guess around it: open `packages/rust/src/ir.ts` / `types.ts` for the kind, use the form the surface actually offers, and if no form expresses the construct, write the closest legal shape and mark it:

```ts
	// GAP B: no loose form for `crate` as a scoped_identifier path segment
```

- [ ] **Step 4: Run the targeted test and read the first difference**

Run: `pnpm exec vitest run packages/rust/tests/examples-verify.test.ts -t "modulo whitespace"`
Expected: FAIL with `firstDifference` pointing at the first missing item (`#[derive(...)]` / `pub enum SpliceError`).

- [ ] **Step 5: Add the next item, re-run, repeat**

Work through splice.rs in order, one helper per item, each committed to the `statements` array:

1. `#[derive(Debug, Clone, PartialEq, Eq)] pub enum SpliceError { … }` — three struct-variant arms, each carrying a `///` doc comment via `$trivia(ir.lineComment.doc({ doc }))`; the attribute is `ir.attributeItem.from({ attribute: { path: 'derive', arguments: … } })` — the `arguments` token tree is the first expected class-E/C finding (author has to build a `delimTokenTree`; note the shape you had to write).
2. `impl std::fmt::Display for SpliceError { fn fmt(…) -> … { match self { … } } }` — `match` arms with struct patterns (`SpliceError::InvalidRange { start, end }`), `write!` macro invocations with a `tokenTree` body (expect class C/E on the macro body).
3. `impl std::error::Error for SpliceError {}`.
4. `pub fn apply_edits(source: &str, mut edits: Vec<Edit>) -> Result<String, SpliceError> { … }` — `let` with type, `for e in &edits`, `if`/`return Err(SpliceError::OutOfBounds { … })`, `!source.is_char_boundary(...) || !…`, `edits.sort_by(|a, b| b.start_pos.cmp(&a.start_pos).then_with(|| …))`, `buf.replace_range(start..end, &e.inserted_text)`, `Ok(buf)`. Every `//` comment in the body attaches to the statement it precedes.

After each item: run the `modulo whitespace` test; when `firstDifference` moves past the item, run the `re-parses` test too (a token-identical render can still reparse differently if a comment landed on the wrong node).

- [ ] **Step 6: Pin the gaps**

When the file is complete and any `// GAP` remains, the two tests stay red. Change them to `it.fails(...)` and add, above the describe, a comment listing the GAP count per class so the number is visible in the test file:

```ts
// GAP inventory (examples/17): E=3 C=2 B=1 — see the markers in the example.
```

- [ ] **Step 7: Register the example**

`examples/tsconfig.json` `include`: add `"./17-dogfood-rust.ts"`. `examples/index.ts`: add `export * from './17-dogfood-rust.ts';`. `examples/README.md`: add the row `| \`17-dogfood-rust.ts\` | Dogfooding — rebuild \`sittir-core/src/splice.rs\` with \`ir.*\` |` and list it under compile-checked examples.

Run: `pnpm run type-check:examples`
Expected: PASS (GAP-marked lines must still type-check — they are legal-but-wrong shapes, never invalid TypeScript).

- [ ] **Step 8: Commit**

```bash
git commit -m "docs(examples): hand-rolled rust dogfood (splice.rs) with GAP inventory" -- examples/17-dogfood-rust.ts examples/tsconfig.json examples/index.ts examples/README.md packages/rust/tests/examples-verify.test.ts
```

---

### Task 3: Hand-roll `examples/18-dogfood-typescript.ts` (rebuilds `packages/common/src/format.ts`)

**Files:**
- Create: `examples/18-dogfood-typescript.ts`, `packages/typescript/tests/examples-verify.test.ts`
- Modify: `examples/tsconfig.json`, `examples/README.md`, `examples/index.ts`

**Interfaces:**
- Consumes: `dogfoodContract`; `ir.*`, `createEngine` from `@sittir/typescript` (root factory is `ir.program`).
- Produces: `export function rebuildFormat(): <ProgramBuilt>`.

- [ ] **Step 1: Write the failing test**

Create `packages/typescript/tests/examples-verify.test.ts`:

```ts
// Runtime verification of the compile-checked TypeScript use-case examples
// against the native engine.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/index.ts';
import { dogfoodContract } from '../../../examples/helpers.ts';
import { rebuildFormat } from '../../../examples/18-dogfood-typescript.ts';

describe('examples/18 dogfood typescript (format.ts)', () => {
	const target = new URL('../../common/src/format.ts', import.meta.url).pathname;
	it('re-parses to the same tree as the real file', () => {
		expect(dogfoodContract(createEngine(), rebuildFormat(), target).reparsesEqual).toBe(true);
	});
	it('is identical to the real file modulo whitespace', () => {
		const r = dogfoodContract(createEngine(), rebuildFormat(), target);
		expect(r.firstDifference).toBeUndefined();
		expect(r.sameModuloWhitespace).toBe(true);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/typescript/tests/examples-verify.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the module with the import and `applyFormat`**

```ts
import { ir } from '@sittir/typescript';

function importTypes() {
	return ir.importStatement.from({
		type: true,
		importClause: { namedImports: [{ name: 'FormatRecord' }, { name: 'FormatTrivia' }] },
		source: ir.string.from('@sittir/types')
	});
}

function applyFormat() {
	return ir.exportStatement.from({
		declaration: ir.functionDeclaration.from({
			name: 'applyFormat',
			parameters: [
				{ pattern: 'canonicalRender', type: 'string' },
				{ pattern: 'format', type: 'FormatRecord' }
			],
			returnType: 'string',
			body: [
				ir.lexicalDeclaration.from({ kind: 'let', declarations: [{ name: 'result', value: 'canonicalRender' }] }),
				ir.expressionStatement.from(ir.assignmentExpression.from({ left: 'result', right: ir.callExpression.from({ function: 'applyTrivia', arguments: ['result', 'format'] }) })),
				ir.expressionStatement.from(ir.assignmentExpression.from({ left: 'result', right: ir.callExpression.from({ function: 'applyBoundary', arguments: ['result', 'format'] }) })),
				ir.returnStatement.from('result')
			]
		})
	}).$trivia({ leading: [ir.comment('/**\n * Apply a {@link FormatRecord} to a canonical render string.\n …\n */')] });
}

export function rebuildFormat() {
	return ir.program.from({ statements: [importTypes(), applyFormat()] });
}
```

The JSDoc block comment is one `comment` node whose text is the verbatim block from format.ts. Where the loose shapes above don't type-check, use the surface's real form or mark `// GAP`.

- [ ] **Step 4: Add the remaining functions one at a time**

`applyBoundary` (destructuring `const { boundary } = format;`, `??`, template literal with three substitutions), `applyTrivia` (`[...trivia].sort((a, b) => b.offset - a.offset)`, `for (const item of sorted)`, `Math.max(0, Math.min(...))`), `rebaseTrivia` (object spread with `...(trivia !== undefined && { trivia })`), `rebaseTriviaItems` (arrow returning object literal with spread), `rebaseKinds` (`Record<string, FormatRecord>` type args, `Object.entries` destructured `for..of`). After each: run the `modulo whitespace` test and read `firstDifference`.

- [ ] **Step 5: Pin gaps, register, commit**

As in Task 2 steps 6–8, with `./18-dogfood-typescript.ts`:

```bash
git commit -m "docs(examples): hand-rolled typescript dogfood (format.ts) with GAP inventory" -- examples/18-dogfood-typescript.ts examples/tsconfig.json examples/index.ts examples/README.md packages/typescript/tests/examples-verify.test.ts
```

---

### Task 4: Hand-roll `examples/19-dogfood-python.ts` (rebuilds `packages/tools/scripts/probe-sweep.py`)

**Files:**
- Create: `examples/19-dogfood-python.ts`, `packages/python/tests/examples-verify.test.ts`
- Modify: `examples/tsconfig.json`, `examples/README.md`, `examples/index.ts`

**Interfaces:**
- Consumes: `dogfoodContract`; `ir.*`, `createEngine` from `@sittir/python` (root factory `ir.module`).
- Produces: `export function rebuildProbeSweep(): <ModuleBuilt>`.

- [ ] **Step 1: Write the failing test**

Create `packages/python/tests/examples-verify.test.ts`:

```ts
// Runtime verification of the compile-checked Python use-case examples
// against the native engine.
import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/index.ts';
import { dogfoodContract } from '../../../examples/helpers.ts';
import { rebuildProbeSweep } from '../../../examples/19-dogfood-python.ts';

describe('examples/19 dogfood python (probe-sweep.py)', () => {
	const target = new URL('../../tools/scripts/probe-sweep.py', import.meta.url).pathname;
	it('re-parses to the same tree as the real file', () => {
		expect(dogfoodContract(createEngine(), rebuildProbeSweep(), target).reparsesEqual).toBe(true);
	});
	it('is identical to the real file modulo whitespace', () => {
		const r = dogfoodContract(createEngine(), rebuildProbeSweep(), target);
		expect(r.firstDifference).toBeUndefined();
		expect(r.sameModuloWhitespace).toBe(true);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/python/tests/examples-verify.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the module with the shebang, docstring and imports**

```ts
import { ir } from '@sittir/python';

const docstring = `"""Cross-tree probe-kind sweep for regression diffing.
…verbatim module docstring from probe-sweep.py…
"""`;

function header() {
	return [
		ir.expressionStatement.from(ir.string.from(docstring)),
		ir.importStatement.from({ name: 'argparse' }),
		ir.importStatement.from({ name: 'difflib' }),
		ir.importStatement.from({ name: 'json' }),
		ir.importStatement.from({ name: 'os' }),
		ir.importStatement.from({ name: 're' }),
		ir.importStatement.from({ name: 'subprocess' }),
		ir.importStatement.from({ name: 'sys' })
	];
}

export function rebuildProbeSweep() {
	return ir.module.from({ statements: [...header()] }).$trivia({ leading: [ir.comment('#!/usr/bin/env python3')] });
}
```

The shebang: check how `engine.parse` reads it (a `comment` leaf vs a dedicated kind) with a one-line probe before deciding how to attach it; the read shape wins.

- [ ] **Step 4: Add the remaining statements one at a time**

`FALLBACK_KIND = {...}` (dictionary with string keys), `env = {k: v for … if …}` (dictionary comprehension), `def probe(...)` (list literal of strings, `try`/`except subprocess.TimeoutExpired`, `with open(srcfile) as f:`, keyword arguments, tuple return), `def rendered_of`, `def tokens` (raw regex string `r"\S+"`), `def label` (chained `if`s returning tuples, set comparison `s3 < s2`, f-strings), `def main` (argparse calls with keyword args, nested `for`, `os.path.join`, slicing `[:120]`, `print(..., flush=True)`, `with open(...) as mf:`), `if __name__ == "__main__": main()`. After each: run the `modulo whitespace` test.

- [ ] **Step 5: Pin gaps, register, commit**

As in Task 2 steps 6–8, with `./19-dogfood-python.ts`:

```bash
git commit -m "docs(examples): hand-rolled python dogfood (probe-sweep.py) with GAP inventory" -- examples/19-dogfood-python.ts examples/tsconfig.json examples/index.ts examples/README.md packages/python/tests/examples-verify.test.ts
```

---

### Task 5: GAP work list

**Files:**
- Create: `docs/superpowers/plans/2026-08-25-dogfood-gap-worklist.md`

**Interfaces:**
- Consumes: every `// GAP` marker in `examples/17-*.ts`, `18-*.ts`, `19-*.ts`.
- Produces: the deduplicated work list grouped by class A–E, each entry with `file:line`, the construct, the closest-legal shape that was written, and the emitter root per the spec's §2 table. This document is the input for the follow-up plan covering classes A–D; class E entries feed Task 7's `factoryInline` lists directly.

- [ ] **Step 1: Collect the markers**

Run: `rg -n 'GAP [A-E]:' examples/1[789]-*.ts`

- [ ] **Step 2: Write the list**

One table per class with columns `example:line | construct | shape written | root`. Duplicate constructs across languages collapse to one row with all locations. Close with the per-class totals — the numbers the `it.fails` pins claim.

- [ ] **Step 3: Commit**

```bash
git commit -m "docs(plans): dogfood GAP work list from examples 17-19" -- docs/superpowers/plans/2026-08-25-dogfood-gap-worklist.md
```

---

### Task 6: `factoryInline` — config → model attribute → link diagnostic

**Files:**
- Modify: `packages/codegen/src/dsl/wire/wire.ts:255-300` (`WireConfig`, `WiredOpts`), `packages/codegen/src/compiler/evaluate.ts:493-620` (`MetadataSinks`), `packages/codegen/src/compiler/types.ts:108-125` (`RawGrammar`), `:180-200` (`LinkedGrammar`), `packages/codegen/src/compiler/link.ts:140-200`, `packages/codegen/src/compiler/model/node-map.ts:1532-1560` (`AssembledNodeBase`), `packages/codegen/src/compiler/assemble.ts` (post-pass that stamps the attribute)
- Test: `packages/codegen/src/compiler/__tests__/factory-inline.test.ts`

**Interfaces:**
- Consumes: the existing `supertypes` plumbing as the pattern (`WiredOpts.supertypes: DollarFn<unknown[]>` → `MetadataSinks.supertypes` → `RawGrammar.supertypes: string[]` → `LinkedGrammar.supertypes: Set<string>`).
- Produces: `WireConfig.factoryInline?: ($: ShapedSymbols<B>) => unknown[]`; `RawGrammar.factoryInline: string[]`; `LinkedGrammar.factoryInline: ReadonlySet<string>`; `AssembledNodeBase.factoryInline: boolean` (writable like `irKey`, stamped in assemble); link diagnostic code `'factory-inline-unnestable'` (severity `error`, `canProceed: false`).

- [ ] **Step 1: Write the failing tests**

`packages/codegen/src/compiler/__tests__/factory-inline.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { compileGrammarForTest } from './helpers.ts'; // the existing test helper that runs evaluate→link→assemble on an inline DSL grammar; if it has a different name in this directory, use that one

describe('factoryInline', () => {
	it('stamps the attribute on the listed kind', () => {
		const { nodeMap } = compileGrammarForTest({
			name: 'fi',
			rules: {
				root: ($) => $.seq($.visibility, 'x'),
				visibility: ($) => $.seq('pub', $.optional($.in_path)),
				in_path: ($) => $.seq('(', 'in', $.path, ')'),
				path: () => /[a-z]+/
			},
			factoryInline: ($) => [$.in_path]
		});
		expect(nodeMap.nodes.get('in_path')?.factoryInline).toBe(true);
		expect(nodeMap.nodes.get('visibility')?.factoryInline).toBe(false);
	});
	it('rejects an inline kind that is the root', () => {
		expect(() =>
			compileGrammarForTest({
				name: 'fi',
				rules: { root: () => 'x' },
				factoryInline: ($) => [$.root]
			})
		).toThrow(/factory-inline-unnestable/);
	});
	it('rejects an inline kind referenced by no slot', () => {
		expect(() =>
			compileGrammarForTest({
				name: 'fi',
				rules: { root: () => 'x', orphan: () => 'y' },
				factoryInline: ($) => [$.orphan]
			})
		).toThrow(/factory-inline-unnestable/);
	});
});
```

Before writing this, open `packages/codegen/src/compiler/__tests__/` and reuse whichever helper the existing link/assemble tests use to compile a small DSL grammar; write the test against that helper's real name and signature.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/factory-inline.test.ts`
Expected: FAIL — `factoryInline` is not a known config key / attribute undefined.

- [ ] **Step 3: Thread the section**

1. `wire.ts` `WireConfig`: add `readonly factoryInline?: ($: ShapedSymbols<B>) => unknown[];` next to `supertypes`; `WiredOpts`: `readonly factoryInline?: DollarFn<unknown[]>;`; in `wire()` pass it through exactly as `supertypes` is passed.
2. `evaluate.ts`: add `factoryInline: string[]` to `MetadataSinks` and the evaluated-grammar result, collected by the same helper that turns the `supertypes` callback result into names (the shared `supertypes`/`inline` callback-result normalizer near line 1372).
3. `types.ts`: `RawGrammar.factoryInline: string[]`; `LinkedGrammar.factoryInline: ReadonlySet<string>`.
4. `link.ts` `link()`: `const factoryInline = new Set(raw.factoryInline);` carried into the returned `LinkedGrammar` beside `supertypes`.
5. `node-map.ts` `AssembledNodeBase`: `factoryInline = false;` (writable, documented like `irKey`: stamped by assemble's post-pass).
6. `assemble.ts`: after `resolveIrKeys()`, a post-pass `stampFactoryInline(nodes, linked.factoryInline, roles)` that sets `node.factoryInline = true` for each listed kind.

- [ ] **Step 4: Add the diagnostic**

In the same assemble post-pass, for each listed kind compute the referencing slots: every `AssembledNonterminal` field on every node whose `values` contain a `NodeRef` with `storageKindOfRef(value.node) === kind` (use `isNodeRef` and `storageKindOfRef` from `node-map.ts`), plus supertype memberships (`AssembledSupertype.subtypeNames`). Emit `ctx.diagnostics.emit({ code: 'factory-inline-unnestable', severity: 'error', canProceed: false, scope: 'compiler', phase: 'assemble', message: ... })` when the kind is the grammar root, is a member of a supertype that is itself referenced from a slot not owned by the kind's parent(s), or has zero referencing slots. The message names the kind and the reason.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm exec vitest run packages/codegen/src/compiler/__tests__/factory-inline.test.ts`
Expected: PASS.

Run: `pnpm exec vitest run packages/codegen`
Expected: PASS — no other compiler test changes (the section is empty for every real grammar so far).

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(compiler): factoryInline grammar section stamped as an assembled-node attribute" -- packages/codegen/src/dsl/wire/wire.ts packages/codegen/src/compiler/evaluate.ts packages/codegen/src/compiler/types.ts packages/codegen/src/compiler/link.ts packages/codegen/src/compiler/model/node-map.ts packages/codegen/src/compiler/assemble.ts packages/codegen/src/compiler/__tests__/factory-inline.test.ts
```

---

### Task 7: `factoryInline` — emitter consumption and the first entry

**Files:**
- Modify: `packages/codegen/src/emitters/ir.ts:100-175` (flat + group loops), `packages/codegen/src/emitters/namespaced-constructors.ts` (`derive`), `packages/codegen/src/emitters/factories.ts` (`namespaceOf`, `namespacedEntryEligible`), `packages/codegen/src/emitters/from.ts:455-500` (coerce body — nested config for inline children), `packages/codegen/src/emitters/wrap.ts:1135-1160` (`$with` accepts the nested config for inline slots), `packages/rust/grammar.sittir.ts` (add `factoryInline: ($) => [$.visibility_modifier_in_path]` to the `wire(...)` config)
- Test: `packages/codegen/src/emitters/__tests__/factory-inline-emit.test.ts`, `packages/rust/tests/examples-verify.test.ts`

**Interfaces:**
- Consumes: `node.factoryInline` (Task 6).
- Produces: no `ir.*` entry for an inline kind; the parent slot's `from()` accepts the child's `Config` object (`ir.visibilityModifier.pub({ in: 'crate::x' })` renders `pub(in crate::x)`); `ir` entry count per grammar recorded as a ratchet.

- [ ] **Step 1: Write the failing tests**

`packages/codegen/src/emitters/__tests__/factory-inline-emit.test.ts` (using the same compile helper as Task 6, then `emitIr`):

```ts
it('omits an inline kind from ir.* and from supertype groups', () => {
	const { nodeMap } = compileGrammarForTest({ /* the Task 6 grammar */ });
	const out = emitIr({ grammar: 'fi', nodeMap });
	expect(out).not.toMatch(/\binPath: _b\$inPath\b/);
	expect(out).toContain('visibility: _b$visibility');
});
```

`packages/rust/tests/examples-verify.test.ts` (runtime, after regen):

```ts
describe('factoryInline: visibility_modifier_in_path', () => {
	it('is not a top-level builder', () => {
		expect('visibilityModifierInPath' in ir).toBe(false);
	});
	it('is constructed through the parent config', () => {
		expect(ir.visibilityModifier.pub({ in: 'crate::x' }).$render()).toBe('pub(in crate::x)');
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/factory-inline-emit.test.ts packages/rust/tests/examples-verify.test.ts -t factoryInline`
Expected: FAIL.

- [ ] **Step 3: Make the emitters skip inline kinds as top-level entries**

- `ir.ts` flat loop (`for (const [kind, node] of nodeMap.nodes)` building `flatKeys`) and both supertype-member loops: `if (node.factoryInline) continue;`.
- `namespaced-constructors.ts` `derive`: an inline kind never becomes a hoisted namespaced constructor of a *grandparent*; it remains a form of its direct parent (that is how `pub` reaches it).
- `factories.ts`: the child's `build*` function stays exported (the parent factory calls it); `namespaceOf` filters inline kinds from `entries` so `_fromMap`/`ir` bundles agree.
- `from.ts` coerce body: for a slot whose values include an inline kind, the resolver already dispatches an object input to the child's `coerceTo<Child>` via `_resolveOneBranch` — verify with the runtime test; if the object form is rejected, add the child's config keys to the parent's `__fromInputHints__` for that slot in `types.ts` emission so the loose type admits `{ in: 'crate::x' }`.
- `wrap.ts` `$with` (Task 9 makes tree-node setters loose; until then the strict setter still takes the child node).

- [ ] **Step 4: Add the rust entry and regenerate**

`packages/rust/grammar.sittir.ts`, inside the `wire<…>({ name: 'rust', … })` object: `factoryInline: ($) => [$.visibility_modifier_in_path],`.

Run, serially, checking each exit code:
```bash
for g in rust typescript python; do pnpm exec tsx packages/cli/src/cli.ts gen --grammar $g --all --output packages/$g/src; echo "$g rc=$?"; done
```

- [ ] **Step 5: Run tests, update the API-surface snapshot deliberately**

Run: `pnpm exec vitest run packages/rust/tests`
Expected: `examples-verify` PASS; `api-surface.test.ts` FAILS because `visibilityModifierInPath` left the surface — that is the intended change: run `pnpm exec vitest run packages/rust/tests/api-surface.test.ts --update` and confirm the snapshot diff removes exactly that one entry.

- [ ] **Step 6: Record the ratchet**

Add to `packages/rust/tests/examples-verify.test.ts` (and the TS/Python files once they have entries):

```ts
it('ir entry count only shrinks (ratchet)', () => {
	// Ceiling = the count at the time factoryInline landed; lower it when entries move inline, never raise it.
	expect(Object.keys(ir).length).toBeLessThanOrEqual(415);
});
```

using the real count printed by `node -e "import('@sittir/rust').then(m => console.log(Object.keys(m.ir).length))"` after regen.

- [ ] **Step 7: Gates and commit**

Run `pnpm run validate:history` after `pnpm run validate:native`; compare all four numbers per grammar to the floors in Global Constraints. Run `pnpm exec vitest run`.

```bash
git commit -m "feat(codegen): factoryInline kinds construct only through parent config; first entry visibility_modifier_in_path" -- packages/codegen/src/emitters packages/rust/grammar.sittir.ts packages/rust/src packages/typescript/src packages/python/src packages/rust/tests packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir
```

---

### Task 8: Enrich mints stamp themselves into `factoryInline`

**Files:**
- Modify: `packages/codegen/src/dsl/enrich.ts` (mint record sites inside `applyClauseHoist` and the arm/group mint sites near lines 228–350), `packages/codegen/src/dsl/wire/wire.ts` (merge the enrich-provided set into the config's `factoryInline`, the way `ENRICH_CLAUSE_GROUP_OWNERS_KEY` is consumed)
- Test: `packages/codegen/src/dsl/__tests__/enrich-factory-inline.test.ts`

**Interfaces:**
- Consumes: `ENRICH_CLAUSE_GROUP_OWNERS_KEY` as the existing pattern for enrich → wire hand-off.
- Produces: `ENRICH_FACTORY_INLINE_KEY` on the enrich result: `ReadonlySet<string>` of minted kind names (`armN`/`groupN` arm mints, clause-hoist groups, marker mints); `wire()` unions it with the hand-authored `factoryInline` callback result.

- [ ] **Step 1: Write the failing test**

```ts
it('records every minted kind as factoryInline', () => {
	const enriched = enrich(baseWithAChoiceArmAndAClauseHoist);
	const minted = enriched[ENRICH_FACTORY_INLINE_KEY];
	expect([...minted]).toEqual(expect.arrayContaining(['<the arm mint name>', '<the clause group name>']));
});
it('wire unions enrich mints with the hand-authored list', () => {
	const raw = evaluateForTest(wire(enriched, { name: 'x', factoryInline: ($) => [$.hand_listed] }));
	expect(raw.factoryInline).toEqual(expect.arrayContaining(['hand_listed', '<the arm mint name>']));
});
```

Use the existing enrich tests in `packages/codegen/src/dsl/__tests__/` for a base grammar fixture that produces at least one arm mint and one clause-hoist group; name the expected mints from what those tests already assert.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run packages/codegen/src/dsl/__tests__/enrich-factory-inline.test.ts`
Expected: FAIL — key undefined.

- [ ] **Step 3: Record at every mint site**

In `enrich.ts`, one `const factoryInlineMints = new Set<string>()` per `enrich()` call; add the minted name at each site that creates a new rule name (the same places that populate `visibleGroupHiddenNames`, `clauseGroupOwners`, and the arm/literal-arm mints), attach it to the result under `ENRICH_FACTORY_INLINE_KEY`. In `wire()`, read the key from the enriched input and produce `factoryInline` as the union with the callback result.

- [ ] **Step 4: Regenerate all three grammars and inspect the delta**

Run the regen loop. Then: `git diff --stat packages/*/src/ir.ts packages/*/tests/__snapshots__` — every removed `ir` entry must be a mint name (`arm`/`group`/marker); any other removal means a mint site recorded a grammar-native kind — fix the site, do not proceed.

- [ ] **Step 5: Gates, snapshots, ratchets, commit**

Update the three `api-surface` snapshots deliberately (`--update`, inspect), lower the three ratchet ceilings to the new counts, run `validate:native` + `validate:history` (numbers must hold — inline kinds still have factories, templates, and types), full suite.

```bash
git commit -m "feat(enrich): minted kinds declare themselves factoryInline at mint time" -- packages/codegen/src/dsl packages/rust/src packages/typescript/src packages/python/src packages/rust/tests packages/typescript/tests packages/python/tests packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir
```

---

### Task 9: Shared per-field resolvers and loose `$with` on `engine.parse` nodes

**Files:**
- Modify: `packages/codegen/src/emitters/from.ts:455-500` (coerce body), `:1080-1140` (`resolveFieldCall` / `resolveFieldFromTypedInput`), `packages/codegen/src/emitters/wrap.ts:1135-1160` (`emitInlineWithProperty` field setters)
- Test: `packages/codegen/src/emitters/__tests__/from-field-resolvers.test.ts`, `packages/rust/tests/examples-verify.test.ts`

**Interfaces:**
- Consumes: `resolveFieldFromTypedInput(f, nodeMap, typeName, intern, 'input', inputOptional, kindEntries): string` (the per-field resolver expression the coerce body inlines today).
- Produces: in generated `from.ts`, one exported function per (kind, field): `export function resolve<TypeName>_<propertyName>(value: <loose field input type>): <strict field type>` whose body is the expression `resolveFieldFromTypedInput` produced (with `input.<configKey>` replaced by `value`); `coerceTo<Kind>` calls it; generated `wrap.ts` imports `* as FR from './from.js'` (already imported? check the wrap preamble — add if absent) and each tree-node setter becomes `<field>: (v: <loose field input type>) => wrap<Kind>({ ...data, _<storage>: FR.resolve<Kind>_<field>(v) }, tree)`.

- [ ] **Step 1: Write the failing tests**

Emitter test:

```ts
it('emits one exported resolver per field and calls it from coerceTo', () => {
	const out = emitFromForTest(nodeMapWithFunctionItem);
	expect(out).toContain('export function resolveFunctionItem_name(');
	expect(out).toMatch(/name: _requireField\("function_item", "name", resolveFunctionItem_name\(input\.name\)\)/);
});
```

Runtime test (`packages/rust/tests/examples-verify.test.ts`):

```ts
describe('loose $with on parsed nodes', () => {
	it('accepts the from() form of a field on a tree node', () => {
		const file = createEngine().parse('pub fn main() { }\n');
		const fn0 = file.statements()[0];
		if (!is.functionItem(fn0)) throw new Error('expected function_item');
		const renamed = fn0.$with.name('run');
		expect(renamed.$render()).toBe('pub fn run(){ }');
	});
	it('factory-built $with stays strict', () => {
		const built = ir.functionItem.from({ name: 'main', parameters: ir.parameters.strict(), body: ir.block.strict() });
		// @ts-expect-error strict setter: a bare string is not an Identifier node
		built.$with.name('run');
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run packages/codegen/src/emitters/__tests__/from-field-resolvers.test.ts packages/rust/tests/examples-verify.test.ts -t "loose \$with"`
Expected: FAIL.

- [ ] **Step 3: Lift the resolvers**

In `from.ts` emitter, where the coerce body loops `for (const f of fields)`: instead of inlining `call`, first emit (once per kind, before `coerceTo<Kind>`) `export function resolve${typeName}_${f.propertyName}(value: ${looseFieldType}): ${strictFieldType} { return ${callWithValue}; }` where `callWithValue` is `resolveFieldFromTypedInput` rendered against the identifier `value` instead of `input.<configKey>`, `looseFieldType` is the field's member type of `T.${typeName}.Loose` (`NonNullable<Extract<T.${typeName}.Loose, object>[${JSON.stringify(configKey)}]>` — verify this projection compiles against a real kind before applying it everywhere), and `strictFieldType` is the existing storage element type (`fieldElementType(f, nodeMap)` with array wrapping per `isMultiple`). Then the coerce body line becomes `${f.configKey}: resolve${typeName}_${f.propertyName}(input.${f.configKey})` wrapped in the same `_requireField` / `?? F.default()` guards as before. The direct-call sole-field path uses the same function.

- [ ] **Step 4: Point tree-node setters at them**

In `wrap.ts` `emitInlineWithProperty`, field-carrying branch: setter parameter type becomes the loose type above; body becomes `${wrapFn}({ ${spreadData}, ${f.storageKey}: FR.resolve${node.typeName}_${method}(v) }, tree)` (rest-args setters map each element). Add `import * as FR from './from.js';` to the wrap preamble if not present. Factory `$with` (factories emitter) is untouched.

- [ ] **Step 5: Regenerate, rebuild common if touched, run tests**

Regen loop; `pnpm exec vitest run packages/codegen packages/rust/tests`.
Expected: PASS, including the `@ts-expect-error` pin (vitest's TS transform does not type-check — also run `pnpm exec tsc -p packages/rust/tsconfig.json --noEmit` or the package's `type-check` script so the `@ts-expect-error` line is actually verified).

- [ ] **Step 6: Gates and commit**

`validate:native` + `validate:history` (from-pass numbers must not move: the resolvers are the same expressions, relocated) + full suite.

```bash
git commit -m "feat(codegen): per-field resolvers shared by from() and tree-node \$with setters" -- packages/codegen/src/emitters packages/rust/src packages/typescript/src packages/python/src packages/rust/tests packages/rust/.sittir packages/typescript/.sittir packages/python/.sittir
```

---

### Task 10: Promote the pending examples that need no new surface

**Files:**
- Modify: `examples/03-trivia.ts`, `examples/06-composition.ts`, `examples/12-cross-language-migration.ts`, `examples/14-format-preserving-transform.ts`, `examples/15-generate-file.ts`, `examples/tsconfig.json`, `examples/README.md`, `docs/use-cases-and-examples.md` (§3, §6, §12, §14, §15 snippets mirror the modules)
- Test: the per-grammar `examples-verify.test.ts` files

**Interfaces:**
- Consumes: `engine.parse`, loose `$with` on tree nodes (Task 9), `$replace` + `applyEdits` from the package boundary.
- Produces: five more compile-checked, runtime-verified examples.

- [ ] **Step 1: Write the failing tests** — one `it` per exported function, asserting the guide's promised output, e.g. for 14:

```ts
it('adds a parameter while preserving the untouched bytes', () => {
	const source = 'fn process(input: &str) {\n    // keep me\n    println!("{}", input);\n}\n';
	const out = addVerboseParameterToProcess(source);
	expect(out).toContain('fn process(input: &str, verbose: bool)');
	expect(out).toContain('    // keep me\n');
});
```

- [ ] **Step 2: Run to verify they fail** (`it` names not exported / stale APIs).

- [ ] **Step 3: Rewrite each module onto the current surface** — 14 becomes:

```ts
import { createEngine, ir, is } from '@sittir/rust';

export function addVerboseParameterToProcess(source: string) {
	const engine = createEngine();
	const file = engine.parse(source);
	const target = file.statements().find((s) => is.functionItem(s) && s.name().$text === 'process');
	if (target === undefined || !is.functionItem(target)) return source;
	const params = target.parameters();
	const updated = params.$with.parameters(...params.parameters(), { pattern: 'verbose', type: 'bool' });
	return engine.applyEdits(source, [params.$replace(updated)]);
}
```

(`$replace` direction: check the boundary's `replace(target, replacement)` signature in `packages/common/src/edit.ts` and use the one the package exports; the example must read naturally, so if the exported shape is `replace(target, replacement)` use that.)

- [ ] **Step 4: Run tests, add the five modules to `examples/tsconfig.json`, update README rows and guide snippets, `pnpm run type-check:examples`.**

- [ ] **Step 5: Commit**

```bash
git commit -m "docs(examples): promote trivia, composition, migration, format-preserving and generate-file examples to compile-checked" -- examples docs/use-cases-and-examples.md packages/rust/tests/examples-verify.test.ts packages/typescript/tests/examples-verify.test.ts packages/python/tests/examples-verify.test.ts
```

---

## Follow-up plan

Classes A–D from the Task 5 work list get their own plan (`docs/superpowers/plans/2026-08-xx-dogfood-gap-classes-a-d.md`) once the inventory exists; each class is one slice at its emitter root, regenerating all three grammars, deleting the `// GAP` markers it closes and flipping the corresponding `it.fails` pins.
