# Factory source emitter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `sittir tool emit-factory-source` prints, for any source file, the strict factory source that rebuilds it, and each grammar's dogfood target is checked in as a generated rebuild that the verify tests hold to the target's parse tree.

**Architecture:** The validator's `buildFactoryNodeFromReference` already decides how every node is rebuilt; the emitter runs it with a factory map whose entries return printed-call markers instead of nodes, then serialises the resulting config tree. No second node-to-call derivation exists. A thin tool wrapper parses and reads a file; a `gen:examples` script writes the generated dogfood modules; the examples type-check and the package verify tests gate them.

**Tech Stack:** TypeScript (ESM), vitest, web-tree-sitter through the validators' loaders (`loadLanguageForGrammar`, `buildReadHandle`, `loadReadTreeNode`, `loadNodeModel`), commander (CLI), oxfmt.

**Spec:** `docs/superpowers/specs/2026-09-07-strict-rebuild-from-source-design.md`

## Global Constraints

- The plan `2026-09-07-enum-arms-through-supertypes.md` lands first (kind-id punctuation in token trees; `ir.stringLiteralOpen`; examples type-checked).
- No explanatory comments in `packages/codegen/src/`; `packages/tools/src` follows the same rule — document in `docs/glossary/tools.md` if it exists, else in the tool's JSDoc kept to the contract.
- No spec/plan/PR numbers in code or docs.
- Generated example modules are never hand-edited; a surface gap they expose is filed as a row in `docs/factory-surface-issues.md`.
- Commit by pathspec. Gates as in the storage plan; the emitter changes no generated package output, so the byte gate and counts must be identical.
- Tools are exported from `packages/tools/src/index.ts` as `export { run as <camelName>, type <Name>Options } from './<dir>/<file>.ts';` and registered in `packages/cli/src/commands/tool/index.ts`'s `toolModules` array via a `CommandModule` in `packages/cli/src/commands/tool/<name>.ts` (see `probe-stages.ts`).

---

### Task 1: Printing factory map and call printer

**Files:**
- Create: `packages/tools/src/emit/factory-source.ts`
- Test: `packages/tools/tests/emit/factory-source-printer.test.ts` (create)

**Interfaces:**
- Consumes: `buildFactoryNodeFromReference(referenceData, kind, artifacts: FactoryDispatchArtifacts, opts: FactoryDispatchOpts)` from `packages/tools/src/validate/common.ts` (artifacts: `{ factoryMap, factoryShapes, fieldAliasMap, factoryFields, factorySlots, polymorphVariants }`; opts: `{ cstNodeKindHint?, firstNamedChildKindHint?, namedChildKindHints?, kindNameFromId?, tree? }`), `FactoryShape` (`'config' | 'direct' | 'forwarded' | 'elements' | 'spread' | 'text'`), `PolymorphVariantMap` (`desc.helperKind?: Record<variant, kind>`), `separatedListFactoryOptions`.
- Produces:

```ts
export interface PrintContext {
	readonly grammar: string;
	readonly kindNameFromId: (id: number) => string | undefined;
	readonly memberNameOfId: (id: number) => string | undefined; // TSKindId member name
	readonly irPathOfKind: (kind: string) => string;             // 'ir.functionItem' | 'ir.expressionStatement.withSemi'
	readonly delimiterArmOfId: (id: number) => string | undefined; // 'Delimiter.Trailing'
}
export class Printed { readonly $type: number | string; readonly $named = true; readonly source: string; }
export function printingFactoryMap(realShapes: Record<string, FactoryShape>, kindIdOfName: (kind: string) => number | undefined, ctx: PrintContext): Record<string, (...args: unknown[]) => Printed>;
export function printValue(value: unknown, ctx: PrintContext, depth: number): string;
export function printFactorySource(root: ReadNodeLike, rootKind: string, artifacts: FactoryDispatchArtifacts, opts: FactoryDispatchOpts, ctx: PrintContext): string;
```

- [ ] **Step 1: Write the failing test**

Create `packages/tools/tests/emit/factory-source-printer.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { Printed, printValue, printingFactoryMap, printFactorySource, type PrintContext } from '../../src/emit/factory-source.ts';

const ctx: PrintContext = {
	grammar: 'test',
	kindNameFromId: (id) => ({ 1: 'source_file', 2: 'function_item', 3: 'identifier', 4: 'comma', 5: 'arguments' })[id],
	memberNameOfId: (id) => ({ 1: 'SourceFile', 2: 'FunctionItem', 3: 'Identifier', 4: 'Comma', 5: 'Arguments' })[id],
	irPathOfKind: (kind) => ({ source_file: 'ir.sourceFile', function_item: 'ir.functionItem', identifier: 'ir.identifier', arguments: 'ir.arguments' })[kind] ?? `ir.${kind}`,
	delimiterArmOfId: (id) => ({ 8: 'Delimiter.Trailing' })[id]
};

describe('printValue', () => {
	it('prints a catalog kind id as a TSKindId member', () => {
		expect(printValue(4, ctx, 0)).toBe('TSKindId.Comma');
	});
	it('prints strings, booleans and arrays', () => {
		expect(printValue('a"b', ctx, 0)).toBe('"a\\"b"');
		expect(printValue(true, ctx, 0)).toBe('true');
		expect(printValue([4, 'x'], ctx, 0)).toBe('[TSKindId.Comma, "x"]');
	});
	it('prints a printed marker as its source', () => {
		expect(printValue(new Printed(3, 'ir.identifier("f")'), ctx, 0)).toBe('ir.identifier("f")');
	});
	it('prints a config as a strict call and omits undefined slots', () => {
		const map = printingFactoryMap({ function_item: 'config', identifier: 'text' }, (k) => ({ function_item: 2, identifier: 3 })[k], ctx);
		const printed = map.function_item!({ name: map.identifier!('main'), body: undefined });
		expect(printed.source).toBe('ir.functionItem.strict({\n\tname: ir.identifier("main"),\n})');
	});
	it('prints direct, spread and elements shapes', () => {
		const map = printingFactoryMap(
			{ wrapper: 'direct', bag: 'spread', arguments: 'elements', identifier: 'text' },
			(k) => ({ wrapper: 9, bag: 10, arguments: 5, identifier: 3 })[k],
			ctx
		);
		expect(map.wrapper!(map.identifier!('x')).source).toBe('ir.wrapper.strict(ir.identifier("x"))');
		expect(map.bag!(map.identifier!('x'), map.identifier!('y')).source).toBe('ir.bag.strict(ir.identifier("x"), ir.identifier("y"))');
		expect(map.arguments!({ delimiter: 8 }, map.identifier!('x')).source).toBe(
			'ir.arguments.strict({ delimiter: Delimiter.Trailing }, ir.identifier("x"))'
		);
		expect(map.arguments!(map.identifier!('x')).source).toBe('ir.arguments.strict(ir.identifier("x"))');
	});
});

describe('printFactorySource', () => {
	it('prints a leaf root through the validator dispatcher', () => {
		const artifacts = {
			factoryMap: printingFactoryMap({ identifier: 'text' }, (k) => ({ identifier: 3 })[k], ctx),
			factoryShapes: { identifier: 'text' as const },
			fieldAliasMap: {},
			factoryFields: {},
			factorySlots: {},
			polymorphVariants: {}
		};
		const source = printFactorySource({ $type: 3, $text: 'main' }, 'identifier', artifacts, { kindNameFromId: ctx.kindNameFromId }, ctx);
		expect(source).toBe('ir.identifier("main")');
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run packages/tools/tests/emit/factory-source-printer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the printer**

Create `packages/tools/src/emit/factory-source.ts`:

```ts
import {
	buildFactoryNodeFromReference,
	type FactoryDispatchArtifacts,
	type FactoryDispatchOpts
} from '../validate/common.ts';
import type { FactoryShape } from '../codegen-surface.ts';

export interface PrintContext {
	readonly grammar: string;
	readonly kindNameFromId: (id: number) => string | undefined;
	readonly memberNameOfId: (id: number) => string | undefined;
	readonly irPathOfKind: (kind: string) => string;
	readonly delimiterArmOfId: (id: number) => string | undefined;
}

export class Printed {
	readonly $named = true as const;
	constructor(
		readonly $type: number | string,
		readonly source: string
	) {}
}

interface ReadNodeLike {
	readonly $type?: string | number;
	readonly $text?: string;
	readonly $triviaData?: { leading?: readonly unknown[]; trailing?: readonly unknown[] };
}

const INDENT = '\t';

function pad(depth: number): string {
	return INDENT.repeat(depth);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Printed);
}

export function printValue(value: unknown, ctx: PrintContext, depth: number): string {
	if (value instanceof Printed) return value.source;
	if (typeof value === 'string') return JSON.stringify(value);
	if (typeof value === 'boolean') return String(value);
	if (typeof value === 'number') {
		const member = ctx.memberNameOfId(value);
		return member !== undefined ? `TSKindId.${member}` : String(value);
	}
	if (Array.isArray(value)) return `[${value.map((v) => printValue(v, ctx, depth)).join(', ')}]`;
	if (isPlainObject(value)) {
		const entries = Object.entries(value).filter(([k, v]) => v !== undefined && !k.startsWith('$'));
		if (entries.length === 0) return '{}';
		const body = entries.map(([k, v]) => `${pad(depth + 1)}${k}: ${printValue(v, ctx, depth + 1)},`).join('\n');
		return `{\n${body}\n${pad(depth)}}`;
	}
	return String(value);
}

function printListOptions(options: Record<string, unknown>, ctx: PrintContext): string {
	const parts: string[] = [];
	if (typeof options.delimiter === 'number') parts.push(`delimiter: ${ctx.delimiterArmOfId(options.delimiter) ?? options.delimiter}`);
	if (typeof options.separator === 'number') parts.push(`separator: ${printValue(options.separator, ctx, 0)}`);
	return `{ ${parts.join(', ')} }`;
}

function withTrivia(source: string, node: ReadNodeLike | undefined, ctx: PrintContext): string {
	const trivia = node?.$triviaData;
	if (!trivia) return source;
	const texts = (list: readonly unknown[] | undefined): string[] =>
		(list ?? []).map((t) => (t as ReadNodeLike).$text).filter((t): t is string => typeof t === 'string');
	const leading = texts(trivia.leading);
	const trailing = texts(trivia.trailing);
	if (leading.length === 0 && trailing.length === 0) return source;
	const parts: string[] = [];
	if (leading.length > 0) parts.push(`leading: ${printValue(leading, ctx, 0)}`);
	if (trailing.length > 0) parts.push(`trailing: ${printValue(trailing, ctx, 0)}`);
	return `${source}.$trivia({ ${parts.join(', ')} })`;
}

export function printingFactoryMap(
	realShapes: Record<string, FactoryShape>,
	kindIdOfName: (kind: string) => number | undefined,
	ctx: PrintContext
): Record<string, (...args: unknown[]) => Printed> {
	const map: Record<string, (...args: unknown[]) => Printed> = {};
	for (const kind of Object.keys(realShapes)) {
		const shape = realShapes[kind]!;
		const path = ctx.irPathOfKind(kind);
		const id = kindIdOfName(kind) ?? kind;
		map[kind] = (...args: unknown[]): Printed => {
			switch (shape) {
				case 'text':
					return new Printed(id, `${path}(${JSON.stringify(String(args[0] ?? ''))})`);
				case 'direct':
				case 'forwarded':
					return new Printed(id, `${path}.strict(${printValue(args[0], ctx, 0)})`);
				case 'spread':
					return new Printed(id, `${path}.strict(${args.map((a) => printValue(a, ctx, 0)).join(', ')})`);
				case 'elements': {
					const [first, ...rest] = args;
					const hasOptions = isPlainObject(first) && !('$type' in first) && ('delimiter' in first || 'separator' in first);
					const elements = (hasOptions ? rest : args).map((a) => printValue(a, ctx, 0));
					const head = hasOptions ? [printListOptions(first as Record<string, unknown>, ctx)] : [];
					return new Printed(id, `${path}.strict(${[...head, ...elements].join(', ')})`);
				}
				case 'config':
				default:
					return new Printed(id, `${path}.strict(${printValue(args[0] ?? {}, ctx, 0)})`);
			}
		};
	}
	return map;
}

export function printFactorySource(
	root: ReadNodeLike,
	rootKind: string,
	artifacts: FactoryDispatchArtifacts,
	opts: FactoryDispatchOpts,
	ctx: PrintContext
): string {
	const printed = buildFactoryNodeFromReference(root, rootKind, artifacts, opts);
	if (!(printed instanceof Printed)) {
		throw new Error(`emit-factory-source: no factory for root kind '${rootKind}'`);
	}
	return withTrivia(printed.source, root, ctx);
}
```

If `FactoryDispatchArtifacts` / `FactoryDispatchOpts` are not exported from `common.ts`, export them (they are the parameter types of `buildFactoryNodeFromReference`).

Trivia on inner nodes: `resolveChild` hands a child factory only the child's config, never the drilled read node, so a marker made here cannot see the child's `$triviaData`. In this task the markers carry no trivia and only the root's trivia prints (`withTrivia` above). Task 2 adds the inner-trivia table (`triviaByHandle`, keyed by `$nodeHandle`) and the `Printed.handle` field that `printValue` consults.

- [ ] **Step 4: Run the test**

Run: `pnpm exec vitest run packages/tools/tests/emit/factory-source-printer.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(tools): a printing factory map turns the validator's rebuild into strict factory source" -- packages/tools/src/emit/factory-source.ts packages/tools/tests/emit/factory-source-printer.test.ts
```

---

### Task 2: Emit a file: parse, read, resolve ir paths, print a module

**Files:**
- Modify: `packages/tools/src/emit/factory-source.ts` (add `emitFactorySource`, `run`)
- Modify: `packages/tools/src/index.ts` (export)
- Test: `packages/tools/tests/emit/factory-source-emit.test.ts` (create)

**Interfaces:**
- Consumes: `loadLanguageForGrammar(grammar) → { Parser, lang }`, `buildReadHandle(grammar, tree, source, 'native')`, `loadReadTreeNode(grammar)`, `loadNodeModel(grammar) → { factoryShapes, fieldAliasMap, factoryFields, factorySlots, polymorphVariants, … }` (all in `packages/tools/src/validate/common.ts`; `loadNodeModel` is exported there), the grammar's `types.ts` module (`KIND_NAMES: Map<number, string>`, `TSKindId` numeric enum, `Delimiter` enum), the node model's `irKey` per kind (from `loadNodeModel`'s raw entries — read `nodes` from the loaded model or `buildNodeMap(grammar)` from `codegen-surface.ts`).
- Produces:

```ts
export interface EmitFactorySourceOptions {
	readonly grammar: string;
	readonly file: string;          // path to the source file
	readonly exportName?: string;   // default: 'rebuild' + PascalCase(basename)
	readonly out?: string;          // write here instead of stdout
}
export async function emitFactorySource(grammar: string, source: string, exportName: string): Promise<string>;
export async function run(opts: EmitFactorySourceOptions): Promise<number>;
```

- [ ] **Step 1: Write the failing test**

Create `packages/tools/tests/emit/factory-source-emit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { emitFactorySource } from '../../src/emit/factory-source.ts';

describe('emitFactorySource (real rust grammar)', () => {
	it('prints a strict module for a one-function file', async () => {
		const source = await emitFactorySource('rust', 'fn main() {}\n', 'rebuildMain');
		expect(source).toContain("import { ir, TSKindId, Delimiter } from '@sittir/rust';");
		expect(source).toContain('export function rebuildMain() {');
		expect(source).toContain('ir.sourceFile.strict(');
		expect(source).toContain('ir.identifier("main")');
		expect(source).not.toContain('.coerce(');
	});
	it('prints a leading comment as verbatim trivia', async () => {
		const source = await emitFactorySource('rust', '// hello\nfn main() {}\n', 'rebuildMain');
		expect(source).toContain('$trivia({ leading: ["// hello"] })');
	});
	it('prints a token tree comma as a kind id', async () => {
		const source = await emitFactorySource('rust', '#[derive(Debug, Clone)]\nstruct S;\n', 'rebuildDerive');
		expect(source).toContain('TSKindId.Comma');
		expect(source).not.toContain('tokenTreePunctuation');
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run packages/tools/tests/emit/factory-source-emit.test.ts`
Expected: FAIL — `emitFactorySource` is not exported.

- [ ] **Step 3: Implement**

Append to `packages/tools/src/emit/factory-source.ts`:

```ts
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import {
	buildReadHandle,
	loadLanguageForGrammar,
	loadNodeModel,
	loadReadTreeNode
} from '../validate/common.ts';

const TYPES_MODULE_PATHS: Record<string, string> = {
	rust: '../../../rust/src/types.ts',
	typescript: '../../../typescript/src/types.ts',
	python: '../../../python/src/types.ts'
};

interface TypesModule {
	readonly KIND_NAMES: ReadonlyMap<number, string>;
	readonly TSKindId: Record<number, string> & Record<string, number>;
	readonly Delimiter: Record<number, string>;
}

function camelCase(kind: string): string {
	return kind.replace(/^_+/, '').replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
}

function pascalCase(name: string): string {
	const c = camelCase(name.replace(/[^A-Za-z0-9_]+/g, '_'));
	return c.charAt(0).toUpperCase() + c.slice(1);
}

function irPathResolver(
	irKeyOfKind: ReadonlyMap<string, string>,
	polymorphVariants: Record<string, { helperKind?: Record<string, string> }>
): (kind: string) => string {
	const formOfKind = new Map<string, { parent: string; form: string }>();
	for (const [parent, desc] of Object.entries(polymorphVariants)) {
		for (const [variant, helperKind] of Object.entries(desc.helperKind ?? {})) {
			formOfKind.set(helperKind, { parent, form: camelCase(variant) });
		}
	}
	return (kind: string): string => {
		const form = formOfKind.get(kind);
		if (form) return `ir.${irKeyOfKind.get(form.parent) ?? camelCase(form.parent)}.${form.form}`;
		return `ir.${irKeyOfKind.get(kind) ?? camelCase(kind)}`;
	};
}

export async function emitFactorySource(grammar: string, source: string, exportName: string): Promise<string> {
	const { Parser, lang } = await loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const tree = parser.parse(source);
	if (!tree || tree.rootNode.hasError) throw new Error(`emit-factory-source: the ${grammar} parse has errors`);
	const readTreeNode = await loadReadTreeNode(grammar);
	if (!readTreeNode) throw new Error(`emit-factory-source: no wrap module for ${grammar}`);
	const handle = buildReadHandle(grammar, tree, source, 'native');
	const root = readTreeNode(handle) as { $type: number };

	const model = await loadNodeModel(grammar);
	const types = (await import(new URL(TYPES_MODULE_PATHS[grammar]!, import.meta.url).pathname)) as TypesModule;
	const kindNameFromId = (id: number): string | undefined => types.KIND_NAMES.get(id);
	const kindIdOfName = (kind: string): number | undefined => {
		for (const [id, name] of types.KIND_NAMES) if (name === kind) return id;
		return undefined;
	};
	const irKeyOfKind = new Map<string, string>();
	for (const entry of model.nodes ?? []) if (entry.irKey) irKeyOfKind.set(entry.kind, entry.irKey);
	const ctx: PrintContext = {
		grammar,
		kindNameFromId,
		memberNameOfId: (id) => (typeof types.TSKindId[id] === 'string' ? (types.TSKindId[id] as string) : undefined),
		irPathOfKind: irPathResolver(irKeyOfKind, model.polymorphVariants as never),
		delimiterArmOfId: (id) => (typeof types.Delimiter[id] === 'string' ? `Delimiter.${types.Delimiter[id]}` : undefined)
	};
	const artifacts = {
		factoryMap: printingFactoryMap(model.factoryShapes, kindIdOfName, ctx),
		factoryShapes: model.factoryShapes,
		fieldAliasMap: model.fieldAliasMap,
		factoryFields: model.factoryFields,
		factorySlots: model.factorySlots,
		polymorphVariants: model.polymorphVariants
	};
	const rootKind = kindNameFromId(root.$type);
	if (!rootKind) throw new Error(`emit-factory-source: root kind id ${root.$type} is not in the catalog`);
	const body = printFactorySource(root, rootKind, artifacts, { kindNameFromId, tree: handle }, ctx);
	return [
		'// @generated by `sittir tool emit-factory-source`; do not edit.',
		`import { ir, TSKindId, Delimiter } from '@sittir/${grammar}';`,
		'',
		`export function ${exportName}() {`,
		`\treturn ${body.replace(/\n/g, '\n\t')};`,
		'}',
		''
	].join('\n');
}

export interface EmitFactorySourceOptions {
	readonly grammar: string;
	readonly file: string;
	readonly exportName?: string;
	readonly out?: string;
}

export async function run(opts: EmitFactorySourceOptions): Promise<number> {
	const file = resolve(opts.file);
	const source = readFileSync(file, 'utf8');
	const exportName = opts.exportName ?? `rebuild${pascalCase(basename(file).replace(/\.[^.]+$/, ''))}`;
	const printed = await emitFactorySource(opts.grammar, source, exportName);
	if (opts.out) writeFileSync(resolve(opts.out), printed);
	else process.stdout.write(printed);
	return 0;
}
```

`loadNodeModel`'s return type: read `LoadedNodeModel` in `common.ts`; if it does not expose the raw entries as `nodes`, add `nodes: entries` to it (the parsed `node-model.json5` array is already in hand there) so `irKey` per kind is one lookup, and adjust the loop above to that field name.

Inner trivia: before printing, walk the read tree (`walkWrappedTree` in `common.ts`, or a plain recursive walk over `_`-prefixed keys and `$other`) and build `triviaByHandle: Map<number, { leading: string[]; trailing: string[] }>` from each node's `$triviaData` entries' `$text`; give `Printed` an optional `handle` set by the printing factory from `args[0]?.$nodeHandle` when the config carries it, and in `printValue`'s `Printed` branch append `.$trivia({ … })` when `triviaByHandle` has the handle. Thread `triviaByHandle` through `PrintContext` as an optional field.

Export from `packages/tools/src/index.ts`:

```ts
export { run as emitFactorySource, type EmitFactorySourceOptions } from './emit/factory-source.ts';
```

(rename the internal `emitFactorySource` function to `emitFactorySourceText` if the export name collides).

- [ ] **Step 4: Run the test**

Run: `pnpm exec vitest run packages/tools/tests/emit/factory-source-emit.test.ts`
Expected: PASS (3 tests). If the derive case prints `tokenTreePunctuation`, the storage plan has not landed; stop.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(tools): emit-factory-source prints the strict rebuild of a source file" -- packages/tools/src/emit/factory-source.ts packages/tools/src/index.ts packages/tools/tests/emit/factory-source-emit.test.ts packages/tools/src/validate/common.ts
```

---

### Task 3: CLI command

**Files:**
- Create: `packages/cli/src/commands/tool/emit-factory-source.ts`
- Modify: `packages/cli/src/commands/tool/index.ts` (import + `toolModules` entry, alphabetical)
- Modify: `docs/cli-command-glossary.md` (regenerated)
- Test: `packages/cli/tests/` — the existing command-tree test that lists `sittir tool` subcommands, if present; else `pnpm exec tsx packages/cli/src/cli.ts tool emit-factory-source --help`.

- [ ] **Step 1: Create the command module**

```ts
import { type CommandModule, defineCommand } from '../../framework/command-module.ts';
import { withGrammar } from '../../framework/options.ts';
import { emitFactorySource as runEmitFactorySource } from '@sittir/tools';

export const emitFactorySource: CommandModule = {
	name: 'emit-factory-source',
	describe: 'Print the strict factory source that rebuilds a source file',
	register: (program) => {
		withGrammar(defineCommand(program, emitFactorySource))
			.requiredOption('-f, --file <path>', 'Source file to rebuild')
			.option('-e, --export <name>', 'Exported function name (default: rebuild<Basename>)')
			.option('-o, --out <path>', 'Write the module here instead of stdout')
			.action(async (opts: { grammar?: string; file: string; export?: string; out?: string }) => {
				const code = await runEmitFactorySource({
					grammar: opts.grammar ?? 'rust',
					file: opts.file,
					exportName: opts.export,
					out: opts.out
				});
				if (code !== 0) process.exitCode = code;
			});
	}
};
```

Add `import { emitFactorySource } from './emit-factory-source.ts';` and the entry to `toolModules` in `index.ts`.

- [ ] **Step 2: Run it**

Run: `pnpm exec tsx packages/cli/src/cli.ts tool emit-factory-source --grammar rust --file rust/crates/sittir-core/src/splice.rs | head -20`
Expected: the module header and `export function rebuildSplice() {` followed by `return ir.sourceFile.strict({`.

- [ ] **Step 3: Regenerate the CLI glossary**

Find the script that generates `docs/cli-command-glossary.md` (search `package.json` scripts and `packages/cli/package.json` for `glossary`); run it; the new command appears under `sittir tool`.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(cli): sittir tool emit-factory-source" -- packages/cli/src/commands/tool/emit-factory-source.ts packages/cli/src/commands/tool/index.ts docs/cli-command-glossary.md
```

---

### Task 4: Generated dogfood rebuilds, type-checked and verified

**Files:**
- Modify: `package.json` (`gen:examples`, `type-check:generated-examples` scripts)
- Create: `examples/tsconfig.generated.json`, `examples/17-dogfood-rust.generated.ts`, `examples/18-dogfood-typescript.generated.ts`, `examples/19-dogfood-python.generated.ts`, `examples/generated-typecheck-ceiling.json`
- Modify: `packages/rust/tests/examples-verify.test.ts`, `packages/typescript/tests/examples-verify.test.ts`, `packages/python/tests/examples-verify.test.ts`
- Test: `packages/tools/tests/emit/generated-examples.test.ts` (create)
- Modify: `docs/factory-surface-issues.md` (rows for every type error the generated modules report)

**Interfaces:**
- Consumes: Task 3.
- Produces: `pnpm run gen:examples` rewrites the three generated modules; `pnpm run type-check:generated-examples` reports their errors; the ceiling file records the count per grammar.

- [ ] **Step 1: Scripts and tsconfig**

Add to root `package.json` scripts:

```json
"gen:examples": "tsx packages/cli/src/cli.ts tool emit-factory-source --grammar rust --file rust/crates/sittir-core/src/splice.rs --export rebuildSpliceGenerated --out examples/17-dogfood-rust.generated.ts && tsx packages/cli/src/cli.ts tool emit-factory-source --grammar typescript --file packages/common/src/format.ts --export rebuildFormatGenerated --out examples/18-dogfood-typescript.generated.ts && tsx packages/cli/src/cli.ts tool emit-factory-source --grammar python --file packages/tools/scripts/probe-sweep.py --export rebuildProbeSweepGenerated --out examples/19-dogfood-python.generated.ts && oxfmt examples/*.generated.ts",
"type-check:generated-examples": "tsc -p examples/tsconfig.generated.json --noEmit"
```

Create `examples/tsconfig.generated.json`:

```json
{
	"extends": "./tsconfig.json",
	"include": ["./17-dogfood-rust.generated.ts", "./18-dogfood-typescript.generated.ts", "./19-dogfood-python.generated.ts"]
}
```

- [ ] **Step 2: Generate and measure**

Run: `pnpm run gen:examples` — expected: three files written, formatted.
Run: `pnpm run type-check:generated-examples 2>&1 | awk '/error TS/' | sed -E 's/^([0-9]+-dogfood-[a-z]+)\.generated\.ts.*error (TS[0-9]+).*/\1 \2/' | sort | uniq -c`
Record the per-file counts in `examples/generated-typecheck-ceiling.json`:

```json
{ "17-dogfood-rust.generated.ts": <n>, "18-dogfood-typescript.generated.ts": <n>, "19-dogfood-python.generated.ts": <n> }
```

For each distinct error, read the kind and slot it names and add a row to `docs/factory-surface-issues.md` under `## Strict surface` (`### S<n> — <one-line title>`, the exact generated call, the error, the factory signature from `raw.ts`). Do not edit the generated files.

- [ ] **Step 3: Verify tests become real gates**

In each `examples-verify.test.ts` add, importing the generated module:

```ts
import { rebuildSpliceGenerated } from '../../../examples/17-dogfood-rust.generated.ts';

describe('examples/17 generated rebuild (splice.rs)', () => {
	const target = new URL('../../../rust/crates/sittir-core/src/splice.rs', import.meta.url).pathname;
	it('renders', () => {
		expect(rebuildSpliceGenerated().$render()).toContain('pub enum SpliceError');
	});
	it('re-parses to the same tree as the real file', () => {
		expect(dogfoodContract(createEngine(), rebuildSpliceGenerated(), target).reparsesEqual).toBe(true);
	});
});
```

(typescript: `rebuildFormatGenerated`, target `../../common/src/format.ts`, contains `function applyFormat`; python: `rebuildProbeSweepGenerated`, target `../../tools/scripts/probe-sweep.py`, contains `def main`.) A generated module that does not type-check still runs under vitest; if `reparsesEqual` is false for a grammar, mark that one case `it.fails` with the reason in the test name (`… — open rows S<n>, S<m>`) so the ratchet direction is visible.

- [ ] **Step 4: Freshness and ceiling test**

Create `packages/tools/tests/emit/generated-examples.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { emitFactorySource } from '../../src/emit/factory-source.ts';

const ROOT = new URL('../../../../', import.meta.url).pathname;
const CASES = [
	['rust', 'rust/crates/sittir-core/src/splice.rs', 'rebuildSpliceGenerated', 'examples/17-dogfood-rust.generated.ts'],
	['typescript', 'packages/common/src/format.ts', 'rebuildFormatGenerated', 'examples/18-dogfood-typescript.generated.ts'],
	['python', 'packages/tools/scripts/probe-sweep.py', 'rebuildProbeSweepGenerated', 'examples/19-dogfood-python.generated.ts']
] as const;

describe('generated dogfood rebuilds', () => {
	for (const [grammar, target, exportName, generated] of CASES) {
		it(`${generated} is a fresh emit of ${target} (modulo formatting)`, async () => {
			const fresh = await emitFactorySource(grammar, readFileSync(ROOT + target, 'utf8'), exportName);
			const checkedIn = readFileSync(ROOT + generated, 'utf8');
			const norm = (s: string) => s.replace(/\s+/g, '');
			expect(norm(checkedIn)).toBe(norm(fresh));
		});
	}
	it('type errors do not exceed the recorded ceiling', () => {
		const ceiling = JSON.parse(readFileSync(ROOT + 'examples/generated-typecheck-ceiling.json', 'utf8')) as Record<string, number>;
		let out = '';
		try {
			out = execFileSync('pnpm', ['run', 'type-check:generated-examples'], { cwd: ROOT, encoding: 'utf8' });
		} catch (e) {
			out = String((e as { stdout?: string }).stdout ?? '');
		}
		for (const [file, max] of Object.entries(ceiling)) {
			const count = out.split('\n').filter((l) => l.startsWith(file) && l.includes('error TS')).length;
			expect(count, file).toBeLessThanOrEqual(max);
		}
	});
});
```

Run: `pnpm exec vitest run packages/tools/tests/emit/generated-examples.test.ts` — expected: PASS.

- [ ] **Step 5: Gates and commit**

Byte gate identical; `validate counts` identical; the six vitest suites; `pnpm run type-check && pnpm run type-check:examples`.

```bash
git commit -m "feat(examples): generated strict rebuilds of the dogfood targets, type-checked under a ceiling and held to the target's tree" -- package.json examples/tsconfig.generated.json examples/17-dogfood-rust.generated.ts examples/18-dogfood-typescript.generated.ts examples/19-dogfood-python.generated.ts examples/generated-typecheck-ceiling.json packages/rust/tests/examples-verify.test.ts packages/typescript/tests/examples-verify.test.ts packages/python/tests/examples-verify.test.ts packages/tools/tests/emit/generated-examples.test.ts docs/factory-surface-issues.md
```

---

### Task 5: Spec status and handoff of the work list

- [ ] **Step 1:** Update the spec status to `Landed (…); open strict-surface rows S<n>–S<m> in docs/factory-surface-issues.md are the work list.` and commit:

```bash
git commit -m "docs(spec): the factory emitter is landed; the generated rebuilds' type errors are the strict-surface work list" -- docs/superpowers/specs/2026-09-07-strict-rebuild-from-source-design.md
```
