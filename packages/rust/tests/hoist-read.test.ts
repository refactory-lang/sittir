import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const items = (read: unknown): never[] => [...(read as Iterable<never>)];

describe.each(['arena', 'object'] as const)('the rust hoist reads through its wrappers, %s storage', (nodeStorage) => {
	const firstItem = async (code: string) => {
		const e = await createEngine(rust, { nodeStorage });
		return { e, item: e.parse(code).statements()[0]! };
	};

	it('reads a generic item\'s type parameters through two wrappers', async () => {
		const { e, item } = await firstItem('fn f<T, U>() {}\n');
		if (!e.is.functionItem(item)) throw new Error('expected a function');
		expect(items(item.typeParameters()).map((parameter) => String(e.render(parameter)))).toEqual(['T', 'U']);
		e[Symbol.dispose]();
	});

	it('reads absent type parameters as undefined', async () => {
		const { e, item } = await firstItem('fn f() {}\n');
		if (!e.is.functionItem(item)) throw new Error('expected a function');
		expect(item.typeParameters()).toBeUndefined();
		e[Symbol.dispose]();
	});

	it('reads a visibility modifier as its form and its absence as undefined', async () => {
		const open = await firstItem('pub fn f() {}\n');
		if (!open.e.is.functionItem(open.item)) throw new Error('expected a function');
		expect(String(open.e.render(open.item.visibilityModifier()!))).toBe('pub');
		open.e[Symbol.dispose]();
		const closed = await firstItem('fn f() {}\n');
		if (!closed.e.is.functionItem(closed.item)) throw new Error('expected a function');
		expect(closed.item.visibilityModifier()).toBeUndefined();
		closed.e[Symbol.dispose]();
	});

	it('reads an extern modifier as its ABI, and a bare one as undefined', async () => {
		const abi = await firstItem('extern "C" { fn g(); }\n');
		if (!abi.e.is.foreignModItemBody(abi.item)) throw new Error('expected a foreign module');
		expect(String(abi.e.render(abi.item.externModifier()!))).toBe('"C"');
		abi.e[Symbol.dispose]();
		const bare = await firstItem('extern { fn g(); }\n');
		if (!bare.e.is.foreignModItemBody(bare.item)) throw new Error('expected a foreign module');
		expect(bare.item.externModifier()).toBeUndefined();
		bare.e[Symbol.dispose]();
	});

	it('leaves the wrapper in the tree with its own range', async () => {
		const { e, item } = await firstItem('fn f<T, U>() {}\n');
		if (typeof item !== 'object') throw new Error('expected a node');
		const wrappers = [...e.query(item).$descendants.ofType(e.kinds.TypeParameters)];
		expect(wrappers.map((wrapper) => String(e.render(wrapper)))).toEqual(['<T, U>']);
		e[Symbol.dispose]();
	});
});
