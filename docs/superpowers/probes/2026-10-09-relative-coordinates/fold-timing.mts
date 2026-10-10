/**
 * The fold's render time, runnable unchanged at either commit: a whole-tree read rendered untouched,
 * then rendered again after one leading comment on its deepest statement.
 *
 *   cd <checkout> && SITTIR_ROOT=$PWD pnpm exec tsx <this file> <source file>...
 *
 * The grammar is the source file's: `.rs` rust, `.ts` typescript. Each render is timed after 5
 * warm-ups, and the median of 31 is reported; each render is forced to its text (`$render()` is a lazy
 * handle). The deepest statement is reached through the
 * accessors, the route a write is accepted on at both commits; a statement is a node whose kind
 * name ends in `Statement` or `Declaration`. WHOLE_TREE names a whole-tree read in both option
 * forms, as `measure-heap.mts` does.
 */
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const REPO = process.env.SITTIR_ROOT ?? process.cwd();
const inputs = process.argv.slice(2);
process.env.NODE_ENV ??= 'production';
const WHOLE_TREE = { deep: true, depth: Infinity };
const WARMUPS = 5;
const RUNS = 31;

const { createEngine } = (await import(`${REPO}/packages/common/src/index.ts`)) as {
	createEngine: (language: unknown) => Promise<any>;
};

const camel = (slot: string) => slot.replace(/^_/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** The deepest node reached through the accessors whose kind is a statement, and its depth. */
function deepestStatement(node: any, isStatement: (kind: number) => boolean, depth = 0, seen = new Set<object>()): { node: any; depth: number } | undefined {
	if (node === null || typeof node !== 'object' || seen.has(node)) return undefined;
	seen.add(node);
	if (Array.isArray(node)) {
		let best: { node: any; depth: number } | undefined;
		for (const entry of node) {
			const found = deepestStatement(entry, isStatement, depth, seen);
			if (found !== undefined && (best === undefined || found.depth > best.depth)) best = found;
		}
		return best;
	}
	let best = typeof node.$type === 'number' && isStatement(node.$type) && node.$trivia !== undefined ? { node, depth } : undefined;
	for (const key of Object.keys(node)) {
		if (!key.startsWith('_') || node[key] == null) continue;
		const accessor = node[camel(key)];
		if (typeof accessor !== 'function') continue;
		let child: unknown;
		try {
			child = accessor.call(node);
		} catch {
			continue;
		}
		const found = deepestStatement(child, isStatement, depth + 1, seen);
		if (found !== undefined && (best === undefined || found.depth > best.depth)) best = found;
	}
	return best;
}

function medianMs(render: () => unknown): number {
	for (let i = 0; i < WARMUPS; i++) render();
	const samples: number[] = [];
	for (let i = 0; i < RUNS; i++) {
		const start = performance.now();
		render();
		samples.push(performance.now() - start);
	}
	samples.sort((a, b) => a - b);
	return samples[Math.floor(samples.length / 2)]!;
}

for (const path of inputs) {
	const grammar = path.endsWith('.rs') ? 'rust' : 'typescript';
	const language = ((await import(`${REPO}/packages/${grammar}/src/index.ts`)) as { default: unknown }).default;
	const engine = await createEngine(language);
	const kindNames = new Map<number, string>(Object.entries(engine.kinds as Record<string, number>).map(([name, id]) => [id, name]));
	const isStatement = (kind: number): boolean => /(?:Statement|Declaration)$/.test(kindNames.get(kind) ?? '');
	const source = readFileSync(path, 'utf8');
	const root = engine.parse(source, WHOLE_TREE);
	const untouched = medianMs(() => String(root.$render()));
	const deepest = deepestStatement(root, isStatement);
	if (deepest === undefined) throw new Error(`${path}: no statement reached`);
	deepest.node.$trivia.leading('// probe');
	const written = medianMs(() => String(root.$render()));
	const text = String(root.$render());
	if (!text.includes('// probe')) throw new Error(`${path}: the written comment did not render`);
	console.log(
		JSON.stringify({
			input: path.split('/').pop(),
			bytes: Buffer.byteLength(source),
			deepestAt: deepest.depth,
			deepestKind: kindNames.get(deepest.node.$type),
			untouchedMs: Number(untouched.toFixed(3)),
			writtenMs: Number(written.toFixed(3))
		})
	);
}
