import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

describe.each(['arena', 'object'] as const)('the rust hoist builds through its wrappers, %s storage', (nodeStorage) => {
	const source = async () => {
		const e = await createEngine(rust, { nodeStorage });
		const fn = e.parse('fn g<A, B>(a: u8, b: u16) {}\n').statements()[0]!;
		if (!e.is.functionItem(fn)) throw new Error('expected a function');
		return { e, fn, [Symbol.dispose]: () => e[Symbol.dispose]() };
	};

	it('builds a function from its parameters as a list', async () => {
		using engine = await source();
		const { e, fn } = engine;
		const built = e.build.functionItem({ name: 'f', parameters: fn.parameters(), body: { statements: [] } });
		expect(String(e.render(built))).toBe('fn f(a: u8, b: u16) {}');
	});

	it('builds a function from no parameters', async () => {
		using engine = await source();
		const { e } = engine;
		const built = e.build.functionItem({ name: 'f', parameters: [], body: { statements: [] } });
		expect(String(e.render(built))).toBe('fn f() {}');
	});

	it('builds a function from several type parameters', async () => {
		using engine = await source();
		const { e, fn } = engine;
		const built = e.build.functionItem({ name: 'f', typeParameters: fn.typeParameters(), parameters: [], body: { statements: [] } });
		expect(String(e.render(built))).toBe('fn f<A, B>() {}');
	});
});
