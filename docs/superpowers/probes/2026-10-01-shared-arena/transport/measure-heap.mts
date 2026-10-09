/**
 * Retained JS heap of fixed node populations, runnable unchanged at either commit, so the
 * 2026-10-01 (69b821c18) and 2026-10-04 (106475358) heap rows compare like for like.
 *
 *   cd <checkout> && SITTIR_ROOT=$PWD pnpm exec tsx --expose-gc <this file> <grammar> <source file>
 *
 * Populations (each warmed once, then the median of 5 runs, double gc around each):
 *   raw            JSON.parse of the deep raw read: read data only, nothing wrapped
 *   deep parse     engine.parse(source, WHOLE_TREE), root held, nothing touched
 *   deep walked    the same, every accessor touched once, root held (the 2026-10-01 method)
 *   deep kept      the same walk, every distinct wrapped node also kept in an array
 *   shallow kept   engine.parse(source), every accessor touched, every wrapped node kept
 *
 * "kept" pins the population: whatever a commit caches or discards, every wrapped node the walk
 * reached stays reachable, so per-node figures divide the same objects at both commits.
 *
 * WHOLE_TREE names a whole-tree read in both option forms: `deep` before `depth: number` replaces
 * it, `depth: Infinity` after; each commit reads the one it knows.
 *
 * The raw read takes whichever native read the commit has: `parseAndRead` and `readRoot`'s JSON
 * where they exist, else `parse` and the transport object `read(treeId, 0, Infinity)` returns. Its
 * node count includes the trivia entries a layout holds (`$_layout.trivia`) as it does `$_trivia`'s.
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';

const REPO = process.env.SITTIR_ROOT ?? process.cwd();
const [grammar = 'rust', sourcePath = `${REPO}/rust/crates/sittir-core/src/engine.rs`] = process.argv.slice(2);
process.env.NODE_ENV ??= 'production';

const req = createRequire(import.meta.url);
const loaderPath = [`${REPO}/packages/${grammar}/native/index.cjs`, `${REPO}/rust/crates/sittir-${grammar}/index.js`].find(existsSync);
if (!loaderPath) throw new Error(`no native loader under ${REPO}`);
const native = req(loaderPath) as {
	SittirEngine: new () => {
		parseAndRead?(source: string, depth?: number): string;
		readRoot?(treeId: number, depth?: number): string;
		parse?(source: string): string;
		read?(treeId: number, index: number, depth?: number): object;
		disposeTree?(treeId: number): void;
		buildProfile: string;
	};
	disposeTree?(treeId: number): void;
};
const { createEngine } = (await import(`${REPO}/packages/common/src/index.ts`)) as {
	createEngine: (language: unknown) => Promise<any>;
};
const language = ((await import(`${REPO}/packages/${grammar}/src/index.ts`)) as { default: unknown }).default;

const WHOLE_TREE = { deep: true, depth: Infinity };
const gc = (globalThis as { gc?: () => void }).gc;
if (!gc) throw new Error('run with --expose-gc');
const source = readFileSync(sourcePath, 'utf8');

function countRaw(value: unknown): number {
	if (Array.isArray(value)) return value.reduce((n: number, v) => n + countRaw(v), 0);
	if (value === null || typeof value !== 'object') return 0;
	const rec = value as Record<string, unknown>;
	let n = typeof rec.$type === 'number' ? 1 : 0;
	for (const [key, child] of Object.entries(rec)) {
		if (key.startsWith('_') || key === '$other') n += countRaw(child);
		else if (key === '$_trivia' && child && typeof child === 'object') n += countLists(child);
		else if (key === '$_layout' && child && typeof child === 'object') n += countLists((child as { trivia?: unknown }).trivia);
	}
	return n;
}

/** The nodes in a trivia record's lists, however its sides nest them. */
function countLists(value: unknown): number {
	if (Array.isArray(value)) return countRaw(value);
	if (value === null || typeof value !== 'object') return 0;
	return Object.values(value as Record<string, unknown>).reduce((n: number, v) => n + countLists(v), 0);
}

const camel = (slot: string) => slot.replace(/^_/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Touch every accessor once, recursively; returns the distinct wrapped nodes reached (numeric `$type`). */
function walk(node: any, seen: Set<object>, kept?: object[]): number {
	if (node === null || typeof node !== 'object') return 0;
	if (Array.isArray(node)) {
		let v = 0;
		for (const entry of node) v += walk(entry, seen, kept);
		return v;
	}
	if (seen.has(node)) return 0;
	seen.add(node);
	let visited = 0;
	if (typeof node.$type === 'number') {
		visited = 1;
		kept?.push(node);
	}
	for (const key of Object.keys(node)) {
		if (!key.startsWith('_') || node[key] == null) continue;
		const accessor = node[camel(key)];
		let child: unknown;
		if (typeof accessor === 'function') {
			try {
				child = accessor.call(node);
			} catch {
				continue;
			}
		} else child = node[key];
		visited += walk(child, seen, kept);
	}
	return visited;
}

let hold: unknown;
/** Median retained heap of `build()`'s result over 5 runs, after one warm-up. */
function retained(build: () => unknown): number {
	const samples: number[] = [];
	for (let i = 0; i < 6; i++) {
		hold = undefined;
		gc!();
		gc!();
		const before = process.memoryUsage().heapUsed;
		hold = build();
		gc!();
		gc!();
		const after = process.memoryUsage().heapUsed;
		if (i > 0) samples.push(after - before);
	}
	hold = undefined;
	samples.sort((a, b) => a - b);
	return samples[Math.floor(samples.length / 2)]!;
}

const raw = new native.SittirEngine();
const dispose = (treeId: number) => (native.disposeTree ? native.disposeTree(treeId) : raw.disposeTree!(treeId));
const live = JSON.parse(raw.parseAndRead ? raw.parseAndRead(source) : raw.parse!(source)) as { treeId: number };
const readDeep = (): unknown => (raw.readRoot ? JSON.parse(raw.readRoot(live.treeId, Infinity)) : raw.read!(live.treeId, 0, Infinity));
const rawNodes = countRaw(readDeep());

const engine = await createEngine(language);
const deepVisited = walk(engine.parse(source, WHOLE_TREE), new Set());
const shallowVisited = walk(engine.parse(source), new Set());

const rows: [string, number, number, string][] = [
	['raw: the deep read', retained(readDeep), rawNodes, 'raw nodes'],
	['deep parse, untouched', retained(() => engine.parse(source, WHOLE_TREE)), deepVisited, 'deep-walk nodes'],
	[
		'deep parse, walked, root held',
		retained(() => {
			const root = engine.parse(source, WHOLE_TREE);
			walk(root, new Set());
			return root;
		}),
		deepVisited,
		'deep-walk nodes'
	],
	[
		'deep parse, walked, every wrapped node kept',
		retained(() => {
			const root = engine.parse(source, WHOLE_TREE);
			const kept: object[] = [];
			walk(root, new Set(), kept);
			return [root, kept];
		}),
		deepVisited,
		'deep-walk nodes'
	],
	[
		'shallow parse, walked, every wrapped node kept',
		retained(() => {
			const root = engine.parse(source);
			const kept: object[] = [];
			walk(root, new Set(), kept);
			return [root, kept];
		}),
		shallowVisited,
		'shallow-walk nodes'
	]
];
dispose(live.treeId);

console.log(`# ${grammar} — ${sourcePath.split('/').pop()} — ${Buffer.byteLength(source)} bytes — ${REPO.split('/').pop()} — native ${raw.buildProfile}`);
console.log(`raw nodes ${rawNodes}; wrapped nodes reached: deep walk ${deepVisited}, shallow walk ${shallowVisited}`);
for (const [label, bytes, n, unit] of rows)
	console.log(`${label.padEnd(48)} ${(bytes / 1024).toFixed(0).padStart(7)} KB  ${(bytes / Math.max(1, n)).toFixed(0).padStart(6)} B per ${unit}`);
