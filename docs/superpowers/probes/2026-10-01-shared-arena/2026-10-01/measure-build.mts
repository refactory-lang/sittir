/** What constructing a built node costs today: per factory call, loose and strict. */
import { performance } from 'node:perf_hooks';

const REPO = process.env.SITTIR_ROOT ?? process.cwd();
process.env.NODE_ENV ??= 'production';
const { createEngine } = (await import(`${REPO}/packages/common/src/index.ts`)) as {
	createEngine: (language: unknown, options?: unknown) => Promise<any>;
};
const language = ((await import(`${REPO}/packages/rust/src/index.ts`)) as { default: unknown }).default;
const rs = await createEngine(language);
const strict = await createEngine(language, { api: 'strict' }).catch(() => undefined);
const b = rs.build;

function perCall(n: number, fn: () => unknown): number {
	for (let i = 0; i < 2000; i++) fn();
	const t0 = performance.now();
	let keep: unknown;
	for (let i = 0; i < n; i++) keep = fn();
	void keep;
	return ((performance.now() - t0) / n) * 1e6;
}

function countNodes(value: unknown): number {
	if (Array.isArray(value)) return value.reduce((n: number, v) => n + countNodes(v), 0);
	if (value === null || typeof value !== 'object') return 0;
	const rec = value as Record<string, unknown>;
	let n = typeof rec.$type === 'number' ? 1 : 0;
	for (const key of Object.keys(rec)) if (key.startsWith('_')) n += countNodes(rec[key]);
	return n;
}

const cases: [string, () => unknown][] = [
	['identifier("x") (text leaf)', () => b.identifier('x')],
	['binaryExpression (loose: 3 slots)', () => b.binaryExpression({ left: 'a', operator: '+', right: 'b' })],
	[
		'callExpression f(a, b) (loose)',
		() => b.callExpression({ function: 'f', arguments: ['a', 'b'] })
	],
	[
		'functionItem fn f() {} (loose)',
		() => b.functionItem({ name: 'f', parameters: b.parameters(), body: b.block() })
	],
	[
		'letDeclaration let x = f(a, b); (loose)',
		() => b.letDeclaration({ pattern: 'x', value: b.callExpression({ function: 'f', arguments: ['a', 'b'] }) })
	]
];

console.log('# rust: cost of constructing built nodes today');
for (const [label, make] of cases) {
	let sample: unknown;
	try {
		sample = make();
	} catch (error) {
		console.log(`${label}: skipped (${(error as Error).message.slice(0, 90)})`);
		continue;
	}
	const nodes = Math.max(1, countNodes(sample));
	const ns = perCall(20000, make);
	const text = String((sample as { $render(): unknown }).$render());
	console.log(`${label}: ${ns.toFixed(0)} ns per call, ${nodes} nodes => ${(ns / nodes).toFixed(0)} ns per node   renders ${JSON.stringify(text)}`);
}
if (strict) {
	const s = strict.build;
	const id = s.identifier('x');
	try {
		const ns = perCall(20000, () => s.identifier('x'));
		console.log(`strict identifier("x"): ${ns.toFixed(0)} ns per call`);
		void id;
	} catch (error) {
		console.log(`strict surface: skipped (${(error as Error).message.slice(0, 90)})`);
	}
}
rs.dispose();
