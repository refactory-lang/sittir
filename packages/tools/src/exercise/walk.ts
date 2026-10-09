import type { AnyUntypedNode } from '@sittir/types';
import { isCoordinate, type TreeHandle } from '@sittir/common/utils';

import { assertGrammar, type GrammarName } from '@sittir/codegen/grammars';
import { accessorCandidatesForStorageKey } from '../validate/common.ts';

interface CommonModule {
	buildReadHandle(grammar: string, source: string): Promise<TreeHandle>;
	loadNativeRender(grammar: string): Promise<(node: AnyUntypedNode) => string>;
	readNodeOf(grammar: string): Promise<((tree: TreeHandle) => unknown) | null>;
	loadKindNameFromId(grammar: string): Promise<((id: number) => string | undefined) | undefined>;
	loadKindNames(grammar: string): Promise<ReadonlyMap<number, string> | undefined>;
	materialize(root: unknown, onAccessorThrow?: (rec: AccessorThrowRecord) => void): AnyUntypedNode;
}

interface AccessorThrowRecord {
	readonly key: string;
	readonly accessor: string;
	readonly type: unknown;
	readonly message: string;
}

interface WalkNode {
	readonly $type: string | number;
	readonly [key: string]: unknown;
}

export interface WalkOptions {
	grammar: string;
	source?: string;
	render: boolean;
}

const COMMON_MODULE_PATH = '../validate/common.ts';
const DEFAULT_SOURCES: Partial<Record<GrammarName, string>> = {
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

function resolveKindName(node: WalkNode, kindNameFromId: ((id: number) => string | undefined) | undefined): string {
	return typeof node.$type === 'number' ? (kindNameFromId?.(node.$type) ?? String(node.$type)) : node.$type;
}

export function collectChildren(node: WalkNode): unknown[] {
	const children: unknown[] = [];
	const members = node as unknown as Record<string, unknown>;
	const readers = new Set(Object.keys(members).flatMap((key) => accessorCandidatesForStorageKey(key)));
	for (const name of readers) {
		const reader = members[name];
		if (typeof reader !== 'function' || reader.length !== 0) continue;
		try {
			children.push(reader.call(node));
		} catch {
			// Ignore hydration failures; traversal is best-effort diagnostic output.
		}
	}
	return children;
}

function walkTree(root: unknown, visit: (node: WalkNode) => void): void {
	const seenCoords = new Set<number>();
	const seenRefs = new WeakSet<object>();

	const visitValue = (value: unknown): void => {
		if (Array.isArray(value)) {
			for (const entry of value) visitValue(entry);
			return;
		}
		if (!isWalkNode(value)) return;
		const ref = value as object;
		if (seenRefs.has(ref)) return;
		const coordKey = isCoordinate(value) ? value.$treeHandle : undefined;
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
	const grammar = assertGrammar(opts.grammar);
	const source = opts.source ?? DEFAULT_SOURCES[grammar] ?? '';
	const render = opts.render;

	const common = await loadCommon();
	const readNode = await common.readNodeOf(grammar);
	if (readNode === null) {
		process.stderr.write(`walk: no wrap module available for grammar '${grammar}'\n`);
		return 1;
	}

	const kindNameFromId = await common.loadKindNameFromId(grammar);
	// Native engine render — same engine the validators use; the
	// removed legacy-core renderer had no SpacingWriter, so its output was
	// seam-less garbage for any grammar with word-word seams.
	const renderNode = await common.loadNativeRender(grammar);
	const handle = await common.buildReadHandle(grammar, source);
	const root = readNode(handle);
	const counts = new Map<string, number>();
	let total = 0;
	let renderFailures = 0;
	const accessorThrows: AccessorThrowRecord[] = [];
	const onAccessorThrow = (rec: AccessorThrowRecord): void => {
		accessorThrows.push(rec);
	};

	walkTree(root, (node) => {
		const kind = resolveKindName(node, kindNameFromId);
		counts.set(kind, (counts.get(kind) ?? 0) + 1);
		total += 1;
		if (!render) return;
		try {
			const renderable = common.materialize(node, onAccessorThrow);
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
	if (accessorThrows.length > 0) {
		process.stdout.write(`\n${accessorThrows.length} accessor-throw(s) (slot masked, fell back to raw stub):\n`);
		for (const t of accessorThrows) {
			process.stdout.write(`  key=${t.key} accessor=${t.accessor} type=${t.type}: ${t.message}\n`);
		}
	}
	process.stdout.write(
		`\n${total} node(s), ${counts.size} distinct kind(s)` +
			(render ? `, ${renderFailures} render failure(s)` : '') +
			'\n'
	);
	return renderFailures === 0 ? 0 : 1;
}
