import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { Delimiter } from '@sittir/common/utils';
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
	it('takes its items, its list node or its wrapper through the setter', async () => {
		using engine = await source();
		const { e, fn } = engine;
		const [first] = fn.parameters();
		const text = (node: { $render(): string }) => node.$render();
		expect(text(fn.$with.parameters(first!))).toBe('fn g<A, B>(a: u8) {}');
		expect(text(fn.$with.parameters(e.build.parametersElements(first!)))).toBe('fn g<A, B>(a: u8) {}');
		expect(text(fn.$with.parameters(e.build.parameters(first!)))).toBe('fn g<A, B>(a: u8) {}');
	});

	it('sets a list slot\'s delimiter on its list node and gives the node back through the holder', async () => {
		using engine = await source();
		const { e } = engine;
		const tuple = e.parse('const A: (u8, u16) = x;\n').statements()[0];
		if (tuple === undefined || !e.is.constItem(tuple)) throw new Error('expected a const item');
		const type = tuple.type();
		if (!e.is.tupleType(type)) throw new Error('expected a tuple type');
		const list = type.$query().$descendants.ofType(e.kinds.Types).at(0);
		if (list === undefined) throw new Error('expected the type list');
		expect(type.$with.types(list.$with.delimiter(Delimiter.Trailing)).$render()).toBe('(u8, u16,)');
	});
});
