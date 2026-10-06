/**
 * Reads rust through the generated views, builds it back through the generated build entries, and
 * times a view read against the low-level reader it wraps. Type-checked with the generated file, so
 * it is also the consumer's view of the typing.
 *
 *   cd <checkout with fresh natives> && pnpm exec tsx <this folder>/demo.mts
 */
import { performance } from 'node:perf_hooks';
import { createEngine, language } from './out/rust.engine.ts';
import { builder, viewNode } from './out/rust.vocab.ts';

const rust = await createEngine(language);
const text = (v: unknown): string => String(rust.render(v as Parameters<typeof rust.render>[0]));
const kindOf = (v: unknown): string =>
	typeof v === 'object' && v !== null && '$kind' in v && typeof v.$kind === 'string' ? v.$kind : JSON.stringify(v);

const source = 'async fn add(a: i32, b: i32) -> i32 {\n    a + b\n}\n';
const root = rust.parse(source);
const [item] = root.statements();
const module = viewNode(root);
const fn = module.statements()?.[0];
console.log('read', JSON.stringify(source));
if (fn === undefined || typeof fn !== 'object' || fn.$kind !== 'declaration.function') throw new Error(`expected a function, read ${kindOf(fn)}`);
console.log('  kind      ', fn.$kind);
const name = fn.name();
console.log('  name      ', kindOf(name), typeof name === 'string' ? name : (name.$text?.() ?? ''));
console.log('  async     ', fn.async(), ' unsafe', fn.unsafe());
console.log('  parameters', fn.parameters().map(kindOf).join(', '));
const returnType = fn.returnType();
console.log('  returnType', returnType === undefined ? '-' : kindOf(returnType));
const body = fn.body();
console.log('  body      ', kindOf(body));
const tail = typeof body === 'object' && body !== null && 'trailingExpression' in body ? body.trailingExpression() : undefined;
console.log('  tail      ', kindOf(tail), typeof tail === 'object' && tail !== null && 'operator' in tail ? tail.operator() : '');

const from = builder(rust.build);
const sum = from({ $kind: 'expression.binary.arithmetic.add', left: { $kind: 'identifier', $text: 'x' }, right: { $kind: 'identifier', $text: 'y' } });
console.log('build a structure  ', JSON.stringify(text(sum)));
const again = text(from(fn));
if (again !== source.trimEnd()) {
	console.error('build the view back', JSON.stringify(again), 'differs from', JSON.stringify(source.trimEnd()));
	process.exit(1);
}
console.log('build the view back', JSON.stringify(again), '(same text)');

const best = (n: number, f: () => unknown): number => {
	let min = Infinity;
	for (let r = 0; r < 5; r++) {
		const t0 = performance.now();
		for (let i = 0; i < n; i++) f();
		min = Math.min(min, ((performance.now() - t0) / n) * 1e6);
	}
	return min;
};
if (item === undefined || typeof item === 'number' || !rust.is.functionItem(item)) throw new Error('expected a function item');
// @ts-expect-error a function item's claim depends on where it sits, so it is not read back on its own
viewNode(item);
const N = 200_000;
const direct = best(N, () => item.name());
const viewed = best(N, () => viewNode(root));
const viewedRead = best(N, () => fn.name());
console.log(`cost: reader ${direct.toFixed(1)} ns; viewNode(root) ${viewed.toFixed(1)} ns; a view's name ${viewedRead.toFixed(1)} ns (best of 5 over ${N})`);
const spanOf = (v: unknown): string => JSON.stringify(typeof v === 'object' && v !== null && '$span' in v ? v.$span : undefined);
console.log('down-link: fn.$core reads the parsed function item (same span):', spanOf(fn.$core) === spanOf(item));
