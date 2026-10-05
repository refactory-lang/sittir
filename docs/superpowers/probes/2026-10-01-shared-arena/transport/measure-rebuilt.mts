/**
 * Rebuilt-tree render: where the time goes between the JS projection and the native call.
 * Same fixtures and stages as ../2026-10-01/measure-rebuilt.mts (master 69b821c18), adapted to the
 * current loader path and `toTransportData(node, view)`.
 *
 *   SITTIR_ROOT=<checkout> pnpm exec tsx <this file> <grammar>
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const REPO = process.env.SITTIR_ROOT ?? process.cwd();
const [grammar = 'rust'] = process.argv.slice(2);
process.env.NODE_ENV ??= 'production';
const req = createRequire(import.meta.url);
const native = req(`${REPO}/packages/${grammar}/native/index.cjs`);
const raw = new native.SittirEngine();
const { toTransportData: toTransportDataWith, STORED_TRIVIA } = await import(`${REPO}/packages/common/src/transport-data.ts`);
const toTransportData = (node: unknown) => toTransportDataWith(node, STORED_TRIVIA);

const fixtures = (
	JSON.parse(readFileSync(`${REPO}/rust/crates/sittir-${grammar}/test-fixtures.json`, 'utf8')) as {
		kind: string;
		input: unknown;
	}[]
).filter((f) => f.kind === 'render');

function countNodes(value: unknown): number {
	if (Array.isArray(value)) return value.reduce((n: number, v) => n + countNodes(v), 0);
	if (value === null || typeof value !== 'object') return typeof value === 'string' || typeof value === 'number' ? 1 : 0;
	const rec = value as Record<string, unknown>;
	let n = 1;
	for (const [key, child] of Object.entries(rec)) {
		if (key.startsWith('_') || key === '$other') n += countNodes(child);
	}
	return n;
}

const inputs = fixtures.map((f) => f.input);
const nodes = inputs.reduce((n: number, i) => n + countNodes(i), 0);
const transports = inputs.map((i) => toTransportData(i));
const wireChars = transports.reduce((n, t) => n + JSON.stringify(t).length, 0);

function loop(n: number, fn: () => void): number {
	for (let i = 0; i < 3; i++) fn();
	const t0 = performance.now();
	for (let i = 0; i < n; i++) fn();
	return (performance.now() - t0) / n;
}
const N = 40;
const project = loop(N, () => {
	for (const input of inputs) toTransportData(input);
});
let outChars = 0;
const nativeCall = loop(N, () => {
	outChars = 0;
	for (const t of transports) outChars += (raw.render(t) as string).length;
});
const both = loop(N, () => {
	for (const input of inputs) raw.render(toTransportData(input));
});

console.log(`# ${grammar}: ${inputs.length} parity render fixtures, ${nodes} slot values (nodes + scalars), ${wireChars} chars as JSON, ${outChars} chars rendered`);
console.log(`JS projection (toTransportData): ${(project * 1000 / inputs.length).toFixed(2)} us per fixture  (${((project * 1e6) / nodes).toFixed(0)} ns per slot value)`);
console.log(`native render call:              ${(nativeCall * 1000 / inputs.length).toFixed(2)} us per fixture  (${((nativeCall * 1e6) / nodes).toFixed(0)} ns per slot value)`);
console.log(`both (what engine.render does):  ${(both * 1000 / inputs.length).toFixed(2)} us per fixture  -> ${Math.round((inputs.length / both) * 1000)} renders/s`);
console.log(`projection share of the wall: ${((project / (project + nativeCall)) * 100).toFixed(0)}%`);

// the largest fixtures, for per-node scaling
const sized = inputs.map((input, i) => ({ i, n: countNodes(input) })).sort((a, b) => b.n - a.n).slice(0, 5);
for (const { i, n } of sized) {
	const input = inputs[i];
	const t = transports[i];
	const p = loop(300, () => void toTransportData(input));
	const r = loop(300, () => void raw.render(t));
	console.log(`  fixture #${i}: ${n} slot values — projection ${(p * 1000).toFixed(1)} us, native ${(r * 1000).toFixed(1)} us (${((r * 1e6) / n).toFixed(0)} ns per slot value), output ${(raw.render(t) as string).length} chars`);
}
