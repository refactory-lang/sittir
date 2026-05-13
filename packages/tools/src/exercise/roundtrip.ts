import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { createRenderer } from '@sittir/core';
import type { AnyNodeData } from '@sittir/types';

type GrammarName = 'rust' | 'typescript' | 'python';
type FactoryShape = 'config' | 'spread' | 'text' | 'direct';
type FactoryFn = (...args: readonly unknown[]) => unknown;
type FactorySlotMeta = {
	readonly unnamed: boolean;
	readonly required: boolean;
	readonly multiple: boolean;
	readonly nonEmpty: boolean;
	readonly slotCount: number;
};

interface ExerciseCase {
	readonly kind: string;
	readonly find: string;
	readonly source: string;
	readonly label?: string;
}

interface ReadHandle {
	readonly read?: (nodeHandle?: number, childIndex?: number) => unknown;
}

interface NativeCoords {
	readonly handle?: number;
	readonly childIndex?: number;
}

interface ReadNodeLike {
	readonly $type?: string | number;
	readonly $text?: string;
}

interface CommonModule {
	loadLanguageForGrammar(grammar: string): Promise<{
		Parser: new () => {
			setLanguage(language: unknown): void;
			parse(source: string): { rootNode: TreeSitterNode } | null;
		};
		lang: unknown;
	}>;
	loadCorpusEntries(grammar: string): readonly { name: string; source: string }[];
	loadKindIdFromName(grammar: string): Promise<((name: string) => number) | undefined>;
	loadKindNameFromId(grammar: string): Promise<((id: number) => string | undefined) | undefined>;
	loadKindNames(grammar: string): Promise<ReadonlyMap<number, string> | undefined>;
	buildReadHandle(
		grammar: string,
		tree: unknown,
		source: string,
		backend?: 'native' | 'typescript',
		kindIdFromName?: (kind: string) => number | undefined
	): ReadHandle;
	findNativeNodeId(
		handle: ReadHandle,
		kind: string,
		kindNameFromId?: (id: number) => string | undefined
	): NativeCoords | null;
	adaptNode(node: TreeSitterNode): unknown;
	findFirst(node: TreeSitterNode, kind: string): TreeSitterNode | null;
	readNodeAt(handle: ReadHandle, node: unknown, nativeCoords: NativeCoords | null): ReadNodeLike;
	nodeToConfig(
		data: ReadNodeLike,
		opts?: {
			tree?: ReadHandle;
			factoryMap?: Record<string, FactoryFn>;
			factoryShapes?: Record<string, FactoryShape>;
			fieldAliasMap?: Record<string, Record<string, string>>;
			factoryFields?: Record<string, readonly string[]>;
			factorySlots?: Record<string, Record<string, FactorySlotMeta>>;
			polymorphVariants?: Record<string, unknown>;
			kindNameFromId?: (id: number) => string | undefined;
		}
	): Record<string, unknown>;
	getChildFactoryArgs(
		kind: string,
		childConfig: Record<string, unknown>,
		factorySlots?: Record<string, Record<string, FactorySlotMeta>>
	): readonly unknown[];
}

interface TreeSitterNode {
	readonly text: string;
	readonly isNamed: boolean;
	readonly type: string;
	readonly children: readonly TreeSitterNode[];
}

interface FactoryMapJson {
	readonly factoryShapes?: Record<string, FactoryShape>;
	readonly fieldAliasMap?: Record<string, Record<string, string>>;
	readonly factoryFields?: Record<string, readonly string[]>;
	readonly factorySlots?: Record<string, Record<string, FactorySlotMeta>>;
	readonly polymorphVariants?: Record<string, unknown>;
}

interface FactoryArtifacts {
	readonly factoryMap: Record<string, FactoryFn>;
	readonly factoryShapes: Record<string, FactoryShape>;
	readonly fieldAliasMap: Record<string, Record<string, string>>;
	readonly factoryFields: Record<string, readonly string[]>;
	readonly factorySlots: Record<string, Record<string, FactorySlotMeta>>;
	readonly polymorphVariants: Record<string, unknown>;
}

interface ParsedArgs {
	readonly grammar: GrammarName;
	readonly kinds: readonly string[];
	readonly showHelp: boolean;
}

const COMMON_MODULE_PATH = '../../../codegen/src/validate/common.ts';
const FACTORY_MODULE_PATHS: Record<GrammarName, string> = {
	rust: '../../../rust/src/factories.ts',
	typescript: '../../../typescript/src/factories.ts',
	python: '../../../python/src/factories.ts'
};
const FACTORY_MAP_PATHS: Record<GrammarName, string> = {
	rust: '../../../rust/factory-map.json5',
	typescript: '../../../typescript/factory-map.json5',
	python: '../../../python/factory-map.json5'
};
const TEMPLATE_DIR_PATHS: Record<GrammarName, string> = {
	rust: '../../../rust/templates',
	typescript: '../../../typescript/templates',
	python: '../../../python/templates'
};
const BUILTIN_CASES: Record<GrammarName, readonly ExerciseCase[]> = {
	rust: [
		{ kind: 'identifier', find: 'identifier', source: 'fn foo() {}' },
		{ kind: 'parameters', find: 'parameters', source: 'fn foo() {}' }
	],
	typescript: [
		{
			kind: 'function_declaration',
			find: 'function_declaration',
			source: 'function foo(a: string, b: number) {}'
		},
		{ kind: 'type_alias_declaration', find: 'type_alias_declaration', source: 'type T = Foo<Bar>;' }
	],
	python: [
		{ kind: 'import_statement', find: 'import_statement', source: 'import a, b' },
		{ kind: 'import_from_statement', find: 'import_from_statement', source: 'from a import b, c' },
		{
			kind: 'future_import_statement',
			find: 'future_import_statement',
			source: 'from __future__ import annotations, generators'
		},
		{ kind: 'dict_pattern', find: 'dict_pattern', source: 'match x:\n  case {1: a, 2: b}: pass' },
		{ kind: 'comparison_operator', find: 'comparison_operator', source: 'x = a not in b' },
		{ kind: 'comparison_operator', find: 'comparison_operator', source: 'x = a is not b' },
		{ kind: 'list_comprehension', find: 'list_comprehension', source: 'x = [a for a in b if a > 0]' },
		{
			kind: 'dictionary_comprehension',
			find: 'dictionary_comprehension',
			source: 'x = {a: b for a, b in c}'
		},
		{ kind: 'set_comprehension', find: 'set_comprehension', source: 'x = {a for a in b}' },
		{ kind: 'generator_expression', find: 'generator_expression', source: 'x = list(a for a in b)' }
	]
};

async function loadCommon(): Promise<CommonModule> {
	const mod: CommonModule = await import(new URL(COMMON_MODULE_PATH, import.meta.url).pathname);
	return mod;
}

async function loadFactoryArtifacts(grammar: GrammarName): Promise<FactoryArtifacts> {
	const factoryModule: { _factoryMap?: Record<string, FactoryFn> } = await import(
		new URL(FACTORY_MODULE_PATHS[grammar], import.meta.url).pathname
	);
	const factoryMapPath = new URL(FACTORY_MAP_PATHS[grammar], import.meta.url);
	const rawJson = readFileSync(factoryMapPath, 'utf8')
		.replace(/^\s*\/\/.*$/gm, '')
		.trim();
	const data = JSON.parse(rawJson) as FactoryMapJson;
	return {
		factoryMap: factoryModule._factoryMap ?? {},
		factoryShapes: data.factoryShapes ?? {},
		fieldAliasMap: data.fieldAliasMap ?? {},
		factoryFields: data.factoryFields ?? {},
		factorySlots: data.factorySlots ?? {},
		polymorphVariants: data.polymorphVariants ?? {}
	};
}

function isGrammarName(value: string): value is GrammarName {
	return value === 'rust' || value === 'typescript' || value === 'python';
}

function parseCliArgs(argv: string[]): ParsedArgs {
	const { values } = parseArgs({
		args: argv,
		options: {
			grammar: { type: 'string', short: 'g', default: 'rust' },
			kinds: { type: 'string', short: 'k' },
			help: { type: 'boolean', short: 'h', default: false }
		}
	});
	const grammarValue = values.grammar;
	const grammar = typeof grammarValue === 'string' && isGrammarName(grammarValue) ? grammarValue : 'rust';
	const kindsValue = values.kinds;
	const kinds =
		typeof kindsValue === 'string'
			? kindsValue
					.split(',')
					.map((kind) => kind.trim())
					.filter((kind): kind is string => kind.length > 0)
			: [];
	return { grammar, kinds, showHelp: values.help === true };
}

function printUsage(): void {
	process.stdout.write(
		[
			'Usage: exercise [--grammar <rust|typescript|python>] [--kinds <kind,...>]',
			'',
			'  --grammar, -g  grammar name (default: rust)',
			'  --kinds,   -k  optional comma-separated kind list'
		].join('\n') + '\n'
	);
}

function normalize(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

function isAnyNodeData(value: unknown): value is AnyNodeData {
	return value !== null && typeof value === 'object' && '$type' in value;
}

function toRenderableNode(value: unknown, seen = new WeakMap<object, unknown>()): unknown {
	if (Array.isArray(value)) {
		return value.map((entry) => toRenderableNode(entry, seen));
	}
	if (value === null || typeof value !== 'object') {
		return value;
	}
	const ref = value as Record<string, unknown>;
	const cached = seen.get(ref);
	if (cached !== undefined) {
		return cached;
	}
	const out: Record<string, unknown> = {};
	seen.set(ref, out);
	for (const [key, entry] of Object.entries(ref)) {
		if (!key.startsWith('$')) continue;
		if (key === '$children') {
			const childReader = ref['children'];
			const renderedChildren =
				typeof childReader === 'function' && childReader.length === 0 ? childReader.call(ref) : entry;
			out.$children = toRenderableNode(renderedChildren, seen);
			continue;
		}
		if (typeof entry === 'function') continue;
		out[key] = toRenderableNode(entry, seen);
	}
	for (const [key, entry] of Object.entries(ref)) {
		if (!key.startsWith('_')) continue;
		const getterName = key.slice(1).replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
		const getter = ref[getterName];
		const fieldValue = typeof getter === 'function' && getter.length === 0 ? getter.call(ref) : entry;
		out[key] = toRenderableNode(fieldValue, seen);
	}
	return out;
}

function resolveFactory(
	factoryMap: Record<string, FactoryFn>,
	kind: string
): {
	readonly factory: FactoryFn | undefined;
	readonly resolvedKind: string;
} {
	const direct = factoryMap[kind];
	if (direct !== undefined) return { factory: direct, resolvedKind: kind };
	if (kind.startsWith('_')) {
		const strippedKind = kind.slice(1);
		return { factory: factoryMap[strippedKind], resolvedKind: strippedKind };
	}
	return { factory: undefined, resolvedKind: kind };
}

function buildFactoryNode(
	kind: string,
	readData: ReadNodeLike,
	handle: ReadHandle,
	artifacts: FactoryArtifacts,
	common: CommonModule,
	kindNameFromId: ((id: number) => string | undefined) | undefined
): unknown {
	const { factory, resolvedKind } = resolveFactory(artifacts.factoryMap, kind);
	if (factory === undefined) {
		throw new Error(`no factory registered for '${kind}'`);
	}
	const shape = artifacts.factoryShapes[resolvedKind] ?? 'config';
	if (shape === 'text') {
		return factory(readData.$text ?? '');
	}
	const config = common.nodeToConfig(readData, {
		tree: handle,
		factoryMap: artifacts.factoryMap,
		factoryShapes: artifacts.factoryShapes,
		fieldAliasMap: artifacts.fieldAliasMap,
		factoryFields: artifacts.factoryFields,
		factorySlots: artifacts.factorySlots,
		polymorphVariants: artifacts.polymorphVariants,
		kindNameFromId
	});
	const childArgs = common.getChildFactoryArgs(resolvedKind, config, artifacts.factorySlots);
	if (shape === 'spread') {
		return factory(...childArgs);
	}
	if (shape === 'direct') {
		const fieldNames = artifacts.factoryFields[resolvedKind];
		const rawName = fieldNames?.[0];
		const camelName = rawName?.replace(/_([a-z])/g, (_m: string, c: string) => c.toUpperCase());
		const value = camelName ? (config as Record<string, unknown>)[camelName] : childArgs[0];
		return factory(value);
	}
	return factory(config);
}

async function resolveCorpusCase(
	grammar: GrammarName,
	kind: string,
	common: CommonModule,
	parser: { parse(source: string): { rootNode: TreeSitterNode } | null }
): Promise<ExerciseCase | null> {
	for (const entry of common.loadCorpusEntries(grammar)) {
		const tree = parser.parse(entry.source);
		if (tree === null) continue;
		const node = common.findFirst(tree.rootNode, kind);
		if (node !== null) {
			return { kind, find: kind, source: entry.source, label: entry.name };
		}
	}
	return null;
}

async function resolveCases(
	grammar: GrammarName,
	kinds: readonly string[],
	common: CommonModule,
	parser: { parse(source: string): { rootNode: TreeSitterNode } | null }
): Promise<readonly ExerciseCase[]> {
	if (kinds.length === 0) return BUILTIN_CASES[grammar];
	const selected: ExerciseCase[] = [];
	for (const kind of kinds) {
		const builtinMatches = BUILTIN_CASES[grammar].filter((entry) => entry.kind === kind);
		if (builtinMatches.length > 0) {
			selected.push(...builtinMatches);
			continue;
		}
		const corpusCase = await resolveCorpusCase(grammar, kind, common, parser);
		if (corpusCase !== null) {
			selected.push(corpusCase);
			continue;
		}
		selected.push({ kind, find: kind, source: '', label: 'no matching built-in or corpus case' });
	}
	return selected;
}

export async function run(argv: string[]): Promise<number> {
	const args = parseCliArgs(argv);
	if (args.showHelp) {
		printUsage();
		return 0;
	}

	const common = await loadCommon();
	const artifacts = await loadFactoryArtifacts(args.grammar);
	const rawKindIdFromName = await common.loadKindIdFromName(args.grammar);
	const kindIdFromName =
		rawKindIdFromName === undefined
			? undefined
			: (kind: string): number | undefined => {
					try {
						return rawKindIdFromName(kind);
					} catch {
						return undefined;
					}
				};
	const kindNameFromId = await common.loadKindNameFromId(args.grammar);
	const kindNames = await common.loadKindNames(args.grammar);
	const { render } = createRenderer(new URL(TEMPLATE_DIR_PATHS[args.grammar], import.meta.url).pathname, {
		kindNames
	});
	const { Parser, lang } = await common.loadLanguageForGrammar(args.grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const cases = await resolveCases(args.grammar, args.kinds, common, parser);
	if (cases.length === 0) {
		process.stderr.write(`exercise: no cases available for grammar '${args.grammar}'\n`);
		return 1;
	}

	let pass = 0;
	let fail = 0;
	let skip = 0;
	for (const exercise of cases) {
		if (exercise.source.length === 0) {
			skip += 1;
			process.stdout.write(`SKIP  ${exercise.kind}: ${exercise.label ?? 'no source'}\n`);
			continue;
		}
		const tree = parser.parse(exercise.source);
		if (tree === null) {
			fail += 1;
			process.stdout.write(`FAIL  ${exercise.kind}: parse returned null\n`);
			continue;
		}
		const node = common.findFirst(tree.rootNode, exercise.find);
		if (node === null) {
			skip += 1;
			process.stdout.write(
				`SKIP  ${exercise.kind}: could not find ${exercise.find} in ${JSON.stringify(exercise.source)}\n`
			);
			continue;
		}
		const handle = common.buildReadHandle(args.grammar, tree, exercise.source, undefined, kindIdFromName);
		const nativeCoords = common.findNativeNodeId(handle, exercise.find, kindNameFromId);
		const readData = common.readNodeAt(handle, common.adaptNode(node), nativeCoords);
		let rendered: string;
		try {
			const factoryNode = buildFactoryNode(exercise.kind, readData, handle, artifacts, common, kindNameFromId);
			const renderable = toRenderableNode(factoryNode);
			if (!isAnyNodeData(renderable)) {
				throw new Error('factory result did not materialize to NodeData');
			}
			rendered = render(renderable);
		} catch (error) {
			fail += 1;
			process.stdout.write(`FAIL  ${exercise.kind}: ${(error as Error).message ?? String(error)}\n`);
			continue;
		}
		const ok = normalize(node.text) === normalize(rendered);
		process.stdout.write(
			`${ok ? 'PASS ' : 'FAIL '} ${exercise.kind.padEnd(24)} input=${JSON.stringify(node.text).padEnd(40)} rendered=${JSON.stringify(rendered)}` +
				(exercise.label ? `  # ${exercise.label}` : '') +
				'\n'
		);
		if (ok) {
			pass += 1;
		} else {
			fail += 1;
		}
	}

	process.stdout.write(`\n${pass} pass, ${fail} fail, ${skip} skip\n`);
	return fail === 0 ? 0 : 1;
}

const _isMain = import.meta.url === `file://${process.argv[1]}`;
if (_isMain) {
	run(process.argv.slice(2))
		.then(process.exit)
		.catch((error: unknown) => {
			process.stderr.write(`exercise: ${(error as Error).stack ?? error}\n`);
			process.exit(1);
		});
}
