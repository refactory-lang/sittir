/** What the real builders cost today for a list owner (rust `arguments`) and a plain three-slot node. */
import v8 from 'node:v8';
import { performance } from 'node:perf_hooks';
v8.setFlagsFromString('--allow-natives-syntax');
const fast = new Function('o', 'return %HasFastProperties(o)') as (o: object) => boolean;
const WT = process.env.SITTIR_ROOT ?? process.cwd();
process.env.NODE_ENV ??= 'production';
const { createEngine } = (await import(`${WT}/packages/common/src/index.ts`)) as { createEngine: (l: unknown, o?: unknown) => Promise<any> };
const language = ((await import(`${WT}/packages/rust/src/index.ts`)) as { default: unknown }).default;
const rs = await createEngine(language);
const b = rs.build;
const x = b.identifier('x'), y = b.identifier('y'), z = b.identifier('z');
const elements = b.argumentsElements?.(x, y, z);
const time = (fn: () => unknown): number => {
	for (let i = 0; i < 3000; i++) fn();
	let best = Infinity;
	for (let r = 0; r < 9; r++) { const t0 = performance.now(); for (let i = 0; i < 5000; i++) fn(); best = Math.min(best, ((performance.now() - t0) / 5000) * 1e6); }
	return best;
};
const sample = b.arguments(x, y, z);
console.log('arguments renders:', String(rs.render(sample)), '| length', sample.length, '| own property count', Reflect.ownKeys(sample).length, '| fast', fast(sample));
console.log(`b.binaryExpression({left, operator, right}) from built children: ${time(() => b.binaryExpression({ left: x, operator: '+', right: y })).toFixed(0)} ns`);
console.log(`b.arguments(x, y, z) (builds the elements list and its owner):   ${time(() => b.arguments(x, y, z)).toFixed(0)} ns`);
if (elements !== undefined) console.log(`b.arguments(prebuilt elements list) (the owner alone):            ${time(() => b.arguments(elements)).toFixed(0)} ns`);
console.log(`b.arguments() (empty owner):                                     ${time(() => b.arguments()).toFixed(0)} ns`);
