import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';

describe.each(['arena', 'object'] as const)('the typescript hoist reads through its wrappers, %s storage', (nodeStorage) => {
	const firstStatement = async (code: string) => {
		const e = await createEngine(typescript, { nodeStorage });
		return { e, item: e.parse(code).statements()[0]! };
	};

	it('reads a class\'s type parameters through two wrappers', async () => {
		const { e, item } = await firstStatement('class A<T, U> {}\n');
		if (!e.is.classDeclaration(item)) throw new Error('expected a class');
		expect(item.typeParameters().map((parameter) => String(e.render(parameter)))).toEqual(['T', 'U']);
		e[Symbol.dispose]();
	});

	it('reads no type parameters as an empty list', async () => {
		const { e, item } = await firstStatement('class A {}\n');
		if (!e.is.classDeclaration(item)) throw new Error('expected a class');
		expect(item.typeParameters()).toEqual([]);
		e[Symbol.dispose]();
	});

	it('reads a class heritage as its form and its absence as undefined', async () => {
		const extended = await firstStatement('class A extends B {}\n');
		if (!extended.e.is.classDeclaration(extended.item)) throw new Error('expected a class');
		expect(String(extended.e.render(extended.item.heritage()!))).toBe('extends B');
		extended.e[Symbol.dispose]();
		const bare = await firstStatement('class A {}\n');
		if (!bare.e.is.classDeclaration(bare.item)) throw new Error('expected a class');
		expect(bare.item.heritage()).toBeUndefined();
		bare.e[Symbol.dispose]();
	});

	it('reads a finalizer as the block it holds', async () => {
		const { e, item } = await firstStatement('try {} finally { a(); }\n');
		if (!e.is.tryStatement(item)) throw new Error('expected a try statement');
		expect(String(e.render(item.finalizer()!))).toBe('{ a(); }');
		e[Symbol.dispose]();
	});

	it('leaves the wrapper in the tree with its own range', async () => {
		const { e, item } = await firstStatement('class A<T, U> {}\n');
		const wrappers = [...e.query(item).$descendants.ofType(e.kinds.TypeParameters)];
		expect(wrappers.map((wrapper) => String(e.render(wrapper)))).toEqual(['<T, U>']);
		e[Symbol.dispose]();
	});
});
