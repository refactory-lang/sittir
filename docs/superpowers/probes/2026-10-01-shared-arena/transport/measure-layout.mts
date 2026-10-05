/**
 * The layout wire across commits: measure-rebuilt.mts's two stages over the parity render
 * fixtures, plus controlled populations, for the checkout in SITTIR_ROOT. Run it through
 * layout-rounds.sh, which alternates checkouts, and read the rounds with layout-report.py.
 *
 *   SITTIR_ROOT=<checkout> BASE_ROOT=<base checkout> pnpm exec tsx measure-layout.mts <grammar>
 *
 * Populations (slot values counted as measure-rebuilt.mts counts them; layout keys are not slots):
 *   own          the commit's own fixture inputs (measure-rebuilt.mts as written)
 *   stripped     the same inputs with every layout key removed: identical JSON at every commit
 *   emptyLayout  the stripped inputs with an empty `$_layout` on every node: what decoding a present
 *                layout costs a commit, beyond the facts it holds; timed in alternation with
 *                stripped, so the difference is paired pass by pass
 *   baseForm     the base commit's fixture inputs, whose trivia sits at `$_trivia`, the storage key
 *                every commit reads; only the JS stage is timed on it
 * Prints one JSON line.
 */
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const REPO = process.env.SITTIR_ROOT!;
const BASE = process.env.BASE_ROOT!;
const [grammar = 'rust'] = process.argv.slice(2);
const N = Number(process.env.N ?? 40);
process.env.NODE_ENV ??= 'production';
const req = createRequire(import.meta.url);
const native = req(`${REPO}/packages/${grammar}/native/index.cjs`);
const raw = new native.SittirEngine();
const { toTransportData: toTransportDataWith, STORED_TRIVIA } = await import(`${REPO}/packages/common/src/transport-data.ts`);
const toTransportData = (node: unknown) => toTransportDataWith(node, STORED_TRIVIA);

type Fixture = { kind: string; input: unknown; expectedOutput: string };
const load = (root: string) =>
	(JSON.parse(readFileSync(`${root}/rust/crates/sittir-${grammar}/test-fixtures.json`, 'utf8')) as Fixture[]).filter(
		(f) => f.kind === 'render'
	);
const fixtures = load(REPO);
const baseFixtures = load(BASE);
if (baseFixtures.length !== fixtures.length) throw new Error(`fixture count differs: ${fixtures.length} vs base ${baseFixtures.length}`);

const LAYOUT_KEYS = new Set(['$_layout', '$_trivia', '$_gap', '$_flank', '$_edges']);
function strip(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(strip);
	if (value === null || typeof value !== 'object') return value;
	const out: Record<string, unknown> = {};
	for (const [key, child] of Object.entries(value)) if (!LAYOUT_KEYS.has(key)) out[key] = strip(child);
	return out;
}
const isNode = (value: object): boolean => typeof (value as { $type?: unknown }).$type === 'number';
function withEmptyLayout(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(withEmptyLayout);
	if (value === null || typeof value !== 'object') return value;
	const out: Record<string, unknown> = {};
	for (const [key, child] of Object.entries(value)) out[key] = withEmptyLayout(child);
	if (isNode(value)) out.$_layout = {};
	return out;
}
function countNodes(value: unknown): number {
	if (Array.isArray(value)) return value.reduce((n: number, v) => n + countNodes(v), 0);
	if (value === null || typeof value !== 'object') return typeof value === 'string' || typeof value === 'number' ? 1 : 0;
	let n = 1;
	for (const [key, child] of Object.entries(value)) if (key.startsWith('_') || key === '$other') n += countNodes(child);
	return n;
}
function countWhere(value: unknown, test: (record: Record<string, unknown>) => boolean): number {
	if (Array.isArray(value)) return value.reduce((n: number, v) => n + countWhere(v, test), 0);
	if (value === null || typeof value !== 'object') return 0;
	const rec = value as Record<string, unknown>;
	let n = test(rec) ? 1 : 0;
	for (const [key, child] of Object.entries(rec)) if (key.startsWith('_') || key === '$other') n += countWhere(child, test);
	return n;
}
const sha = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 12);

const own = fixtures.map((f) => f.input);
const stripped = own.map(strip);
const emptyLayout = stripped.map(withEmptyLayout);
const baseForm = baseFixtures.map((f) => f.input);
const nodes = own.reduce((n: number, i) => n + countNodes(i), 0);
const baseNodes = baseForm.reduce((n: number, i) => n + countNodes(i), 0);
const strippedNodes = stripped.reduce((n: number, i) => n + countNodes(i), 0);
const layoutNodes = own.reduce((n: number, i) => n + countWhere(i, (rec) => Object.keys(rec).some((k) => LAYOUT_KEYS.has(k))), 0);
const objectNodes = stripped.reduce((n: number, i) => n + countWhere(i, isNode), 0);

const ownWire = own.map(toTransportData);
const strippedWire = stripped.map(toTransportData);
const emptyLayoutWire = emptyLayout.map(toTransportData);

let mismatches = 0;
for (let i = 0; i < ownWire.length; i++) if ((raw.render(ownWire[i]) as string) !== fixtures[i].expectedOutput) mismatches++;
let strippedRenderErrors = 0;
let emptyLayoutDiffers = 0;
for (let i = 0; i < strippedWire.length; i++) {
	let text: string | undefined;
	try {
		text = raw.render(strippedWire[i]) as string;
	} catch {
		strippedRenderErrors++;
	}
	if (text !== undefined && (raw.render(emptyLayoutWire[i]) as string) !== text) emptyLayoutDiffers++;
}

function loop(n: number, fn: () => void): number {
	for (let i = 0; i < 3; i++) fn();
	const t0 = performance.now();
	for (let i = 0; i < n; i++) fn();
	return (performance.now() - t0) / n;
}
/** Two passes timed in alternation, so drift reaches both alike. */
function paired(n: number, a: () => void, b: () => void): [number, number] {
	for (let i = 0; i < 3; i++) {
		a();
		b();
	}
	let ta = 0;
	let tb = 0;
	for (let i = 0; i < n; i++) {
		const t0 = performance.now();
		a();
		const t1 = performance.now();
		b();
		ta += t1 - t0;
		tb += performance.now() - t1;
	}
	return [ta / n, tb / n];
}
const perSlot = (ms: number, count: number) => (ms * 1e6) / count;

const projectOwn = loop(N, () => {
	for (const input of own) toTransportData(input);
});
const nativeOwn = loop(N, () => {
	for (const t of ownWire) raw.render(t);
});
const projectStripped = loop(N, () => {
	for (const input of stripped) toTransportData(input);
});
const nativeStripped = loop(N, () => {
	for (const t of strippedWire) raw.render(t);
});
const [nativeStrippedPaired, nativeEmptyLayout] = paired(
	N,
	() => {
		for (const t of strippedWire) raw.render(t);
	},
	() => {
		for (const t of emptyLayoutWire) raw.render(t);
	}
);
const projectBaseForm = loop(N, () => {
	for (const input of baseForm) toTransportData(input);
});

console.log(
	JSON.stringify({
		root: REPO,
		grammar,
		fixtures: own.length,
		slotValues: nodes,
		baseFormSlotValues: baseNodes,
		strippedSlotValues: strippedNodes,
		layoutNodes,
		objectNodes,
		strippedSha: sha(stripped),
		mismatches,
		strippedRenderErrors,
		emptyLayoutDiffers,
		ns: {
			projectOwn: perSlot(projectOwn, nodes),
			nativeOwn: perSlot(nativeOwn, nodes),
			projectStripped: perSlot(projectStripped, strippedNodes),
			nativeStripped: perSlot(nativeStripped, strippedNodes),
			nativeStrippedPaired: perSlot(nativeStrippedPaired, strippedNodes),
			nativeEmptyLayout: perSlot(nativeEmptyLayout, strippedNodes),
			projectBaseForm: perSlot(projectBaseForm, baseNodes)
		}
	})
);
