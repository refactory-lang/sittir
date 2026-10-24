import { isCoordinate } from '@sittir/common/utils';

import { assertGrammar, type GrammarName } from '@sittir/codegen/grammars';
import { slotValuesOf, type AccessorThrowRecord, type SlotAccessorOf } from '../validate/common.ts';

type CommonModule = typeof import('../validate/common.ts');

interface WalkNode {
	readonly $type: number;
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
		typeof (value as { $type?: unknown }).$type === 'number'
	);
}

function resolveKindName(node: WalkNode, kindNameFromId: (id: number) => string): string {
	return kindNameFromId(node.$type);
}

export function collectChildren(node: WalkNode, accessorOf: SlotAccessorOf): unknown[] {
	return slotValuesOf(node, accessorOf).map(([, value]) => value);
}

function walkTree(root: unknown, accessorOf: SlotAccessorOf, visit: (node: WalkNode) => void): void {
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
		for (const child of collectChildren(value, accessorOf)) {
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

	const kindNameFromId = await common.loadKindNameFromId(grammar);
	const accessorOf = await common.loadSlotAccessorOf(grammar);
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

	walkTree(root, accessorOf, (node) => {
		const kind = resolveKindName(node, kindNameFromId);
		counts.set(kind, (counts.get(kind) ?? 0) + 1);
		total += 1;
		if (!render) return;
		try {
			const renderable = common.materialize(node, accessorOf, onAccessorThrow);
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
