import { spanOf } from '@sittir/common/utils';
import type { FactoryEntry, ReadNodeLike } from '../validate/common.ts';

import { assertGrammar, type GrammarName } from '@sittir/codegen/grammars';
import type { FactoryShape } from '../codegen-surface.ts';
import { nativeShownKindId } from '../validate/shown-kind.ts';
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

interface ParsedNode {
	readonly $type: number;
	readonly $named?: boolean;
}

interface ExerciseEngine {
	parse(source: string): unknown;
	render(node: unknown): { toString(): string };
}

interface CommonModule {
	loadNativeEngine(grammar: string): Promise<ExerciseEngine>;
	loadCorpusEntries(grammar: string): readonly { name: string; source: string }[];
	loadKindNameFromId(grammar: string): Promise<((id: number) => string | undefined) | undefined>;
	walkWrappedTree(root: unknown, visit: (node: ParsedNode) => void): void;
	loadScopedFactoryMap<T extends Record<string, unknown>>(grammar: string, map: T): Promise<T>;
	loadNodeModel(grammar: string): Promise<{
		factoryShapes: Record<string, FactoryShape>;
		factoryFields: Record<string, readonly string[]>;
		factorySlots: Record<string, Record<string, FactorySlotMeta>>;
		fieldAliasMap: Record<string, Record<string, string>>;
		polymorphVariants: Record<string, unknown>;
	}>;
	buildFactoryNodeFromReference(
		referenceData: ReadNodeLike,
		kind: string,
		artifacts: FactoryArtifacts,
		opts?: {
			kindNameFromId?: (id: number) => string | undefined;
		}
	): unknown | null;
}

interface FactoryArtifacts {
	readonly factoryMap: Record<string, FactoryEntry>;
	readonly factoryShapes: Record<string, FactoryShape>;
	readonly fieldAliasMap: Record<string, Record<string, string>>;
	readonly factoryFields: Record<string, readonly string[]>;
	readonly factorySlots: Record<string, Record<string, FactorySlotMeta>>;
	readonly polymorphVariants: Record<string, unknown>;
}

export interface ExerciseOptions {
	grammar: string;
	kinds: string[];
}

const COMMON_MODULE_PATH = '../validate/common.ts';
const factoryModulePath = (grammar: GrammarName): string => `../../../${grammar}/src/factories/raw.ts`;
const BUILTIN_CASES: Partial<Record<GrammarName, readonly ExerciseCase[]>> = {
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

export async function loadFactoryArtifacts(grammar: GrammarName): Promise<FactoryArtifacts> {
	const factoryModule: { _factoryMap?: Record<string, FactoryEntry> } = await import(
		new URL(factoryModulePath(grammar), import.meta.url).pathname
	);
	const common = await loadCommon();
	const model = await common.loadNodeModel(grammar);
	return {
		factoryMap: await common.loadScopedFactoryMap(grammar, factoryModule._factoryMap ?? {}),
		factoryShapes: model.factoryShapes,
		fieldAliasMap: model.fieldAliasMap,
		factoryFields: model.factoryFields,
		factorySlots: model.factorySlots,
		polymorphVariants: model.polymorphVariants
	};
}

function normalize(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}

type KindNameFromId = ((id: number) => string | undefined) | undefined;

function findFirstOfKind(
	root: unknown,
	kind: string,
	common: CommonModule,
	kindNameFromId: KindNameFromId
): ParsedNode | undefined {
	let found: ParsedNode | undefined;
	common.walkWrappedTree(root, (node) => {
		if (found !== undefined || node.$named === false) return;
		const shown = nativeShownKindId(node);
		if (typeof shown === 'number' && kindNameFromId?.(shown) === kind) found = node;
	});
	return found;
}

function sourceOf(node: ParsedNode, source: string): string {
	const span = spanOf(node);
	if (span === undefined) throw new Error('parsed node carries no span');
	return Buffer.from(source, 'utf8').subarray(span.start, span.end).toString('utf8');
}

function resolveFactory(
	factoryMap: Record<string, FactoryEntry>,
	kind: string
): {
	readonly factory: FactoryEntry | undefined;
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

export function buildFactoryNode(
	kind: string,
	readData: ReadNodeLike,
	artifacts: FactoryArtifacts,
	common: Pick<CommonModule, 'buildFactoryNodeFromReference'>,
	kindNameFromId: KindNameFromId
): unknown {
	const { factory, resolvedKind } = resolveFactory(artifacts.factoryMap, kind);
	if (factory === undefined) {
		throw new Error(`no factory registered for '${kind}'`);
	}
	return common.buildFactoryNodeFromReference(readData, resolvedKind, artifacts, { kindNameFromId });
}

function resolveCorpusCase(
	grammar: GrammarName,
	kind: string,
	common: CommonModule,
	engine: ExerciseEngine,
	kindNameFromId: KindNameFromId
): ExerciseCase | null {
	for (const entry of common.loadCorpusEntries(grammar)) {
		if (findFirstOfKind(engine.parse(entry.source), kind, common, kindNameFromId) !== undefined) {
			return { kind, find: kind, source: entry.source, label: entry.name };
		}
	}
	return null;
}

function resolveCases(
	grammar: GrammarName,
	kinds: readonly string[],
	common: CommonModule,
	engine: ExerciseEngine,
	kindNameFromId: KindNameFromId
): readonly ExerciseCase[] {
	if (kinds.length === 0) return BUILTIN_CASES[grammar] ?? [];
	const selected: ExerciseCase[] = [];
	for (const kind of kinds) {
		const builtinMatches = (BUILTIN_CASES[grammar] ?? []).filter((entry) => entry.kind === kind);
		if (builtinMatches.length > 0) {
			selected.push(...builtinMatches);
			continue;
		}
		const corpusCase = resolveCorpusCase(grammar, kind, common, engine, kindNameFromId);
		selected.push(corpusCase ?? { kind, find: kind, source: '', label: 'no matching built-in or corpus case' });
	}
	return selected;
}

export async function run(opts: ExerciseOptions): Promise<number> {
	const { grammar: grammarStr, kinds } = opts;
	const grammar = assertGrammar(grammarStr);

	const common = await loadCommon();
	const artifacts = await loadFactoryArtifacts(grammar);
	const kindNameFromId = await common.loadKindNameFromId(grammar);
	const engine = await common.loadNativeEngine(grammar);
	const cases = resolveCases(grammar, kinds, common, engine, kindNameFromId);
	if (cases.length === 0) {
		process.stderr.write(`exercise: no cases available for grammar '${grammar}'\n`);
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
		let input: string;
		let rendered: string;
		try {
			const node = findFirstOfKind(engine.parse(exercise.source), exercise.find, common, kindNameFromId);
			if (node === undefined) {
				skip += 1;
				process.stdout.write(
					`SKIP  ${exercise.kind}: could not find ${exercise.find} in ${JSON.stringify(exercise.source)}\n`
				);
				continue;
			}
			input = sourceOf(node, exercise.source);
			const factoryNode = buildFactoryNode(exercise.kind, node as ReadNodeLike, artifacts, common, kindNameFromId);
			if (factoryNode === null) throw new Error('the factory built nothing from the parsed node');
			rendered = engine.render(factoryNode).toString();
		} catch (error) {
			fail += 1;
			process.stdout.write(`FAIL  ${exercise.kind}: ${(error as Error).message ?? String(error)}\n`);
			continue;
		}
		const ok = normalize(input) === normalize(rendered);
		process.stdout.write(
			`${ok ? 'PASS ' : 'FAIL '} ${exercise.kind.padEnd(24)} input=${JSON.stringify(input).padEnd(40)} rendered=${JSON.stringify(rendered)}` +
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
