import { createRenderer } from '@sittir/core';
import type { AnyNodeData } from '@sittir/types';

type GrammarName = 'rust' | 'typescript' | 'python';

type ReadTreeNode = (
	handle: unknown,
	nodeHandle?: number,
	childIndex?: number,
	asType?: { from: string; to: string }
) => unknown;

interface CommonModule {
	loadLanguageForGrammar(grammar: string): Promise<{
		Parser: new () => { setLanguage(language: unknown): void; parse(source: string): { rootNode: unknown } | null };
		lang: unknown;
	}>;
	treeHandle(tree: unknown, source?: string, kindIdFromName?: (kind: string) => number | undefined): unknown;
	loadReadTreeNode(grammar: string): Promise<ReadTreeNode | null>;
	loadKindIdFromName(grammar: string): Promise<((name: string) => number) | undefined>;
	loadKindNameFromId(grammar: string): Promise<((id: number) => string | undefined) | undefined>;
	loadKindNames(grammar: string): Promise<ReadonlyMap<number, string> | undefined>;
}

interface WalkNode {
	readonly $type: string | number;
	readonly $nodeHandle?: number;
	readonly $childIndex?: number;
	readonly $children?: readonly unknown[];
	readonly [key: string]: unknown;
}

export interface WalkOptions {
	grammar: string;
	source?: string;
	render: boolean;
}

const COMMON_MODULE_PATH = '../../../codegen/src/validate/common.ts';
const TEMPLATE_DIR_PATHS: Record<GrammarName, string> = {
	rust: '../../../rust/templates',
	typescript: '../../../typescript/templates',
	python: '../../../python/templates'
};
const DEFAULT_SOURCES: Record<GrammarName, string> = {
	rust: 'type T = Bar::<X>::Baz;',
	typescript: 'type T = Foo<Bar>;',
	python: 'x = foo(bar)'
};

async function loadCommon(): Promise<CommonModule> {
	const mod: CommonModule = await import(new URL(COMMON_MODULE_PATH, import.meta.url).pathname);
	return mod;
}

function isWalkNode(value: unknown): value is WalkNode {
	return (
		value !== null &&
		typeof value === 'object' &&
		'$type' in value &&
		(typeof (value as { $type?: unknown }).$type === 'string' ||
			typeof (value as { $type?: unknown }).$type === 'number')
	);
}

function isAnyNodeData(value: unknown): value is AnyNodeData {
	return value !== null && typeof value === 'object' && '$type' in value;
}

function resolveKindName(node: WalkNode, kindNameFromId: ((id: number) => string | undefined) | undefined): string {
	return typeof node.$type === 'number' ? (kindNameFromId?.(node.$type) ?? String(node.$type)) : node.$type;
}

function collectChildren(node: WalkNode): unknown[] {
	const children: unknown[] = [];
	if (Array.isArray(node.$children)) {
		children.push(...node.$children);
	}
	for (const [key, value] of Object.entries(node)) {
		if (key.startsWith('$') || key.startsWith('_')) continue;
		if (typeof value !== 'function' || value.length !== 0) continue;
		try {
			children.push(value.call(node));
		} catch {
			// Ignore drill-in failures; traversal is best-effort diagnostic output.
		}
	}
	return children;
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

function walkTree(root: unknown, visit: (node: WalkNode) => void): void {
	const seenCoords = new Set<string>();
	const seenRefs = new WeakSet<object>();

	const visitValue = (value: unknown): void => {
		if (Array.isArray(value)) {
			for (const entry of value) visitValue(entry);
			return;
		}
		if (!isWalkNode(value)) return;
		const ref = value as object;
		if (seenRefs.has(ref)) return;
		const coordKey =
			value.$nodeHandle !== undefined && value.$childIndex !== undefined
				? `${value.$nodeHandle}:${value.$childIndex}`
				: undefined;
		if (coordKey !== undefined && seenCoords.has(coordKey)) return;
		seenRefs.add(ref);
		if (coordKey !== undefined) seenCoords.add(coordKey);
		visit(value);
		for (const child of collectChildren(value)) {
			visitValue(child);
		}
	};

	visitValue(root);
}

export async function run(opts: WalkOptions): Promise<number> {
	const grammar = opts.grammar as GrammarName;
	const source = opts.source ?? DEFAULT_SOURCES[grammar] ?? '';
	const render = opts.render;

	const common = await loadCommon();
	const readTreeNode = await common.loadReadTreeNode(grammar);
	if (readTreeNode === null) {
		process.stderr.write(`walk: no wrap module available for grammar '${grammar}'\n`);
		return 1;
	}

	const rawKindIdFromName = await common.loadKindIdFromName(grammar);
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
	const kindNameFromId = await common.loadKindNameFromId(grammar);
	const kindNames = await common.loadKindNames(grammar);
	const { render: renderNode } = createRenderer(new URL(TEMPLATE_DIR_PATHS[grammar], import.meta.url).pathname, {
		kindNames
	});
	const { Parser, lang } = await common.loadLanguageForGrammar(grammar);
	const parser = new Parser();
	parser.setLanguage(lang);
	const tree = parser.parse(source);
	if (tree === null) {
		process.stderr.write('walk: parse returned null\n');
		return 1;
	}

	const handle = common.treeHandle(tree, source, kindIdFromName);
	const root = readTreeNode(handle);
	const counts = new Map<string, number>();
	let total = 0;
	let renderFailures = 0;

	walkTree(root, (node) => {
		const kind = resolveKindName(node, kindNameFromId);
		counts.set(kind, (counts.get(kind) ?? 0) + 1);
		total += 1;
		if (!render) return;
		try {
			const renderable = toRenderableNode(node);
			if (!isAnyNodeData(renderable)) {
				throw new Error('failed to materialize wrapped node as NodeData');
			}
			const rendered = renderNode(renderable);
			process.stdout.write(`${kind}: ${JSON.stringify(rendered)}\n`);
		} catch (error) {
			renderFailures += 1;
			process.stdout.write(`${kind}: <render error: ${(error as Error).message ?? String(error)}>\n`);
		}
	});

	process.stdout.write('\nWrapped-tree kind counts:\n');
	for (const [kind, count] of [...counts.entries()].sort(([left], [right]) => left.localeCompare(right))) {
		process.stdout.write(`  ${String(count).padStart(3)}  ${kind}\n`);
	}
	process.stdout.write(
		`\n${total} node(s), ${counts.size} distinct kind(s)` +
			(render ? `, ${renderFailures} render failure(s)` : '') +
			'\n'
	);
	return renderFailures === 0 ? 0 : 1;
}
