/** Are nodes built by today's factories fast-properties objects, and what does it cost the projection? */
import v8 from 'node:v8';
import { performance } from 'node:perf_hooks';
v8.setFlagsFromString('--allow-natives-syntax');
const fast = new Function('o', 'return %HasFastProperties(o)') as (o: object) => boolean;

const WT = process.env.SITTIR_ROOT ?? process.cwd();
process.env.NODE_ENV ??= 'production';
const { createEngine } = (await import(`${WT}/packages/common/src/index.ts`)) as { createEngine: (l: unknown, o?: unknown) => Promise<any> };
const { toTransportData } = (await import(`${WT}/packages/common/src/transport-data.ts`)) as { toTransportData: (n: unknown) => unknown };
const language = ((await import(`${WT}/packages/rust/src/index.ts`)) as { default: unknown }).default;
const rs = await createEngine(language);
const b = rs.build;

const chain = (depth: number): unknown =>
	depth === 0 ? b.identifier('a') : b.binaryExpression({ left: chain(depth - 1), operator: '+', right: b.callExpression({ function: b.identifier('f'), arguments: [b.identifier('x'), b.identifier('y')] }) });
const trees: unknown[] = [];
for (let i = 0; i < 400; i++) trees.push(b.letDeclaration({ pattern: b.identifier('v'), value: chain(6) }));

const nodesOf = (value: unknown, out: object[] = []): object[] => {
	if (Array.isArray(value)) { for (const v of value) nodesOf(v, out); return out; }
	if (value === null || typeof value !== 'object') return out;
	const rec = value as Record<string, unknown>;
	if (typeof rec.$type === 'number') out.push(rec);
	for (const key of Object.keys(rec)) if (key.charCodeAt(0) === 95) nodesOf(rec[key], out);
	return out;
};
const all = nodesOf(trees);
const byKind = new Map<string, [number, number]>();
for (const node of all) {
	const name = String(rs.kindName?.((node as { $type: number }).$type) ?? (node as { $type: number }).$type);
	const row = byKind.get(name) ?? [0, 0];
	row[0]++; if (fast(node)) row[1]++;
	byKind.set(name, row);
}
console.log(`built nodes: ${all.length}; fast-properties: ${all.filter(fast).length}`);
for (const [name, [n, f]] of byKind) console.log(`  kind ${name}: ${n} nodes, ${f} fast`);
console.log('own keys of a binary expression:', Reflect.ownKeys(all.find((n) => Object.keys(n).includes('_operator'))!).map(String).join(','));

// the same nodes as fast objects of one shape per kind: own enumerable keys copied in order
const shaped = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(shaped);
	if (value === null || typeof value !== 'object') return value;
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(value)) {
		const raw = (value as Record<string, unknown>)[key];
		out[key] = key.charCodeAt(0) === 95 ? shaped(raw) : raw;
	}
	return out;
};
const shapedTrees = trees.map(shaped);
const shapedAll = nodesOf(shapedTrees);
console.log(`shape-shared copies: ${shapedAll.length}; fast-properties: ${shapedAll.filter(fast).length}`);
const same = JSON.stringify(trees.map((t) => toTransportData(t))) === JSON.stringify(shapedTrees.map((t) => toTransportData(t)));
console.log('projection output identical:', same);

const time = (list: unknown[]): number => {
	let best = Infinity;
	for (let r = 0; r < 9; r++) {
		const t0 = performance.now();
		for (let k = 0; k < 20; k++) for (const tree of list) toTransportData(tree);
		best = Math.min(best, (performance.now() - t0) / 20);
	}
	return best;
};
time(trees); time(shapedTrees);
const real = time(trees), clean = time(shapedTrees);
console.log(`toTransportData, as built today:   ${((real * 1e6) / all.length).toFixed(0)} ns per node`);
console.log(`toTransportData, fast shared shape: ${((clean * 1e6) / all.length).toFixed(0)} ns per node`);
const renderAll = (list: unknown[]): [number, string] => {
	let best = Infinity, text = '';
	for (let r = 0; r < 9; r++) {
		const t0 = performance.now();
		let out = '';
		for (const tree of list) out += String(rs.render(tree));
		best = Math.min(best, performance.now() - t0);
		text = out;
	}
	return [best, text];
};
renderAll(trees); renderAll(shapedTrees);
const [realRender, realText] = renderAll(trees);
const [cleanRender, cleanText] = renderAll(shapedTrees);
console.log('rendered text identical:', realText === cleanText, `(${realText.length} chars; first tree: ${String(rs.render(trees[0])).slice(0, 60)}...)`);
console.log(`engine.render, as built today:    ${((realRender * 1e6) / all.length).toFixed(0)} ns per node`);
console.log(`engine.render, fast shared shape: ${((cleanRender * 1e6) / all.length).toFixed(0)} ns per node`);
