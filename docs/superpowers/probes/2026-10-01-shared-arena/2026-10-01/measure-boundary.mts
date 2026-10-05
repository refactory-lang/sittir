/**
 * Stage breakdown of the JS <-> native boundary on current master.
 * Run from the repo root: pnpm exec tsx <this file> <grammar> <source file>
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const REPO = process.env.SITTIR_ROOT ?? process.cwd();
const [grammar = 'rust', sourcePath = `${REPO}/rust/crates/sittir-core/src/engine.rs`] = process.argv.slice(2);

process.env.NODE_ENV ??= 'production';

const req = createRequire(import.meta.url);
const native = req(`${REPO}/rust/crates/sittir-${grammar}/index.js`) as {
	SittirEngine: new () => {
		parseAndRead(source: string, depth?: number): string;
		readRoot(treeId: number, depth?: number): string;
		readUntypedNode(handle: number, childIndex: number, depth?: number): string;
		render(transport: unknown, treeId?: number, options?: unknown): string;
		disposeTree(treeId: number): void;
		buildProfile: string;
	};
};
const { createEngine } = (await import(`${REPO}/packages/common/src/index.ts`)) as {
	createEngine: (language: unknown) => Promise<any>;
};
const { toTransportData } = (await import(`${REPO}/packages/common/src/transport-data.ts`)) as {
	toTransportData: (node: any) => any;
};
const language = ((await import(`${REPO}/packages/${grammar}/src/index.ts`)) as { default: unknown }).default;

const source = readFileSync(sourcePath, 'utf8');
const bytes = Buffer.byteLength(source, 'utf8');

function median(xs: number[]): number {
	const s = [...xs].sort((a, b) => a - b);
	return s[Math.floor(s.length / 2)]!;
}
/** Median wall time of `fn` in milliseconds over `n` runs after `warm` warmups. */
function time<T>(n: number, fn: () => T, warm = 3): { ms: number; last: T } {
	let last!: T;
	for (let i = 0; i < warm; i++) last = fn();
	const samples: number[] = [];
	for (let i = 0; i < n; i++) {
		const t0 = performance.now();
		last = fn();
		samples.push(performance.now() - t0);
	}
	return { ms: median(samples), last };
}
const fmt = (ms: number) => (ms >= 1 ? `${ms.toFixed(2)} ms` : `${(ms * 1000).toFixed(1)} us`);

function countNodes(value: unknown): number {
	if (Array.isArray(value)) return value.reduce((n: number, v) => n + countNodes(v), 0);
	if (value === null || typeof value !== 'object') return 0;
	const rec = value as Record<string, unknown>;
	let n = typeof rec.$type === 'number' ? 1 : 0;
	for (const [key, child] of Object.entries(rec)) {
		if (key.startsWith('_') || key === '$other') n += countNodes(child);
		else if (key === '$_trivia' && child && typeof child === 'object') {
			for (const list of Object.values(child as Record<string, unknown>)) n += countNodes(list);
		}
	}
	return n;
}

const camel = (slot: string) => slot.replace(/^_/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Touch every accessor of a wrapped node, recursively; returns [nodes visited, accessor misses]. */
function walk(node: any, seen = new Set<object>()): [number, number] {
	if (node === null || typeof node !== 'object') return [0, 0];
	if (Array.isArray(node)) {
		let v = 0;
		let m = 0;
		for (const entry of node) {
			const [a, b] = walk(entry, seen);
			v += a;
			m += b;
		}
		return [v, m];
	}
	if (seen.has(node)) return [0, 0];
	seen.add(node);
	let visited = typeof node.$type === 'number' ? 1 : 0;
	let misses = 0;
	for (const key of Object.keys(node)) {
		if (!key.startsWith('_')) continue;
		if (node[key] == null) continue;
		const accessor = node[camel(key)];
		let child: unknown;
		if (typeof accessor === 'function') {
			try {
				child = accessor.call(node);
			} catch {
				misses++;
				continue;
			}
		} else {
			misses++;
			child = node[key];
		}
		const [a, b] = walk(child, seen);
		visited += a;
		misses += b;
	}
	return [visited, misses];
}

console.log(`# ${grammar} — ${sourcePath.replace(REPO + '/', '')} — ${bytes} bytes`);

// --- A. the raw boundary -------------------------------------------------------------------
const raw = new native.SittirEngine();
console.log(`native build profile: ${raw.buildProfile}`);

const shallow = time(30, () => {
	const json = raw.parseAndRead(source);
	raw.disposeTree((JSON.parse(json) as { treeId: number }).treeId);
	return json;
});
const deep = time(30, () => {
	const json = raw.parseAndRead(source, Infinity);
	raw.disposeTree((JSON.parse(json) as { treeId: number }).treeId);
	return json;
});
// These two include one small JSON.parse for the tree id; time the pure calls on a live tree.
const liveJson = raw.parseAndRead(source);
const liveId = (JSON.parse(liveJson) as { treeId: number }).treeId;
const reReadShallow = time(30, () => raw.readRoot(liveId));
const reReadDeep = time(30, () => raw.readRoot(liveId, Infinity));
const deepJson = reReadDeep.last;
const jsonParseDeep = time(30, () => JSON.parse(deepJson));
const jsonParseShallow = time(30, () => JSON.parse(reReadShallow.last));
const deepData = jsonParseDeep.last as unknown;
const nodeCount = countNodes(deepData);

console.log('\n## A. read, raw boundary');
console.log(`nodes in the deep read (storage + trivia entries): ${nodeCount}`);
console.log(`read wire shallow: ${reReadShallow.last.length} chars; deep: ${deepJson.length} chars (${(deepJson.length / bytes).toFixed(1)}x source)`);
console.log(`native parse + shallow read + serialize: ${fmt(shallow.ms)}`);
console.log(`native shallow re-read of a live tree:   ${fmt(reReadShallow.ms)}`);
console.log(`=> tree-sitter parse (difference):       ${fmt(shallow.ms - reReadShallow.ms)}`);
console.log(`native deep read + serialize (live tree): ${fmt(reReadDeep.ms)}  (${((reReadDeep.ms * 1e6) / nodeCount).toFixed(0)} ns/node)`);
console.log(`JSON.parse of the deep wire:              ${fmt(jsonParseDeep.ms)}  (${((jsonParseDeep.ms * 1e6) / nodeCount).toFixed(0)} ns/node)`);
console.log(`JSON.parse of the shallow wire:           ${fmt(jsonParseShallow.ms)}`);
console.log(`native parse + deep read + serialize:     ${fmt(deep.ms)}`);

// --- B. the engine surface -----------------------------------------------------------------
const engine = await createEngine(language);
const parseShallow = time(20, () => engine.parse(source));
const parseDeep = time(20, () => engine.parse(source, { deep: true }));
const walkShallow = time(5, () => walk(engine.parse(source)), 1);
const walkDeep = time(5, () => walk(engine.parse(source, { deep: true })), 1);

console.log('\n## B. read, engine surface (parse + wrap)');
console.log(`engine.parse shallow:                 ${fmt(parseShallow.ms)}`);
console.log(`engine.parse deep:                    ${fmt(parseDeep.ms)}`);
console.log(`parse shallow + touch every accessor: ${fmt(walkShallow.ms)}  (visited ${walkShallow.last[0]}, accessor misses ${walkShallow.last[1]})`);
console.log(`parse deep + touch every accessor:    ${fmt(walkDeep.ms)}  (visited ${walkDeep.last[0]}, accessor misses ${walkDeep.last[1]})`);
if (walkDeep.last[0] > 0) {
	console.log(`=> per visited node, deep:    ${(((walkDeep.ms) * 1e6) / walkDeep.last[0]).toFixed(0)} ns`);
	console.log(`=> per visited node, shallow: ${(((walkShallow.ms) * 1e6) / Math.max(1, walkShallow.last[0])).toFixed(0)} ns`);
}

// retained JS heap of a fully walked deep tree
const gc = (globalThis as { gc?: () => void }).gc;
if (gc) {
	gc();
	const before = process.memoryUsage().heapUsed;
	const held = engine.parse(source, { deep: true });
	const [visited] = walk(held);
	gc();
	const after = process.memoryUsage().heapUsed;
	console.log(`retained JS heap, deep tree fully walked: ${((after - before) / 1024).toFixed(0)} KB (${((after - before) / Math.max(1, visited)).toFixed(0)} B per visited node)`);
	void held;
}

// --- C. render of an untouched tree --------------------------------------------------------
const shallowRoot = engine.parse(source);
const deepRoot = engine.parse(source, { deep: true });
const renderShallow = time(50, () => engine.render(shallowRoot).toString());
const renderDeep = time(20, () => engine.render(deepRoot).toString());
const projectShallow = time(50, () => toTransportData(shallowRoot));
const projectDeep = time(20, () => toTransportData(deepRoot));
const byteExact = renderShallow.last === source && renderDeep.last === source;

console.log('\n## C. render of an untouched tree');
console.log(`byte-exact (shallow and deep): ${byteExact}`);
console.log(`shallow root: render ${fmt(renderShallow.ms)}; of which the JS projection ${fmt(projectShallow.ms)}`);
console.log(`deep root:    render ${fmt(renderDeep.ms)}; of which the JS projection ${fmt(projectDeep.ms)} (${((projectDeep.ms / renderDeep.ms) * 100).toFixed(0)}%)`);
console.log(`what crosses for the deep root: ${JSON.stringify(projectDeep.last).length} chars`);

engine.dispose();
