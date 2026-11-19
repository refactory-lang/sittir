import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const items = (read: unknown): never[] => [...(read as Iterable<never>)];

describe.each(['arena', 'object'] as const)('an empty hoisted list reads as the empty list, an absent wrapper as undefined, %s storage', (nodeStorage) => {
	const open = async () => {
		const e = await createEngine(rust, { nodeStorage });
		return { e, [Symbol.dispose]: () => e[Symbol.dispose]() };
	};
	const functionOf = (e: Awaited<ReturnType<typeof open>>['e'], source: string) => {
		const fn = e.parse(source).statements()[0];
		if (fn === undefined || !e.is.functionItem(fn)) throw new Error('expected a function');
		return fn;
	};

	it('reads a parsed `()` as the empty list and an absent `<…>` as undefined', async () => {
		using opened = await open();
		const fn = functionOf(opened.e, 'fn f() {}\n');
		expect(fn.parameters()).toEqual([]);
		expect(fn.typeParameters()).toBeUndefined();
	});

	it('reads the same empty list on every read, frozen like an ordinary empty list', async () => {
		using opened = await open();
		const fn = functionOf(opened.e, 'fn f() {}\n');
		expect(fn.parameters()).toBe(fn.parameters());
		expect(Object.isFrozen(fn.parameters())).toBe(true);
		expect(Object.isFrozen(opened.e.parse('').statements())).toBe(true);
	});

	it('reads a built function the same, given [] or no parameters', async () => {
		using opened = await open();
		const { build } = opened.e;
		const given = build.statement.function({ name: 'f', parameters: [], body: {} });
		const omitted = build.statement.function({ name: 'f', parameters: undefined, body: {} } as never);
		expect(given.parameters()).toEqual([]);
		expect(omitted.parameters()).toEqual([]);
		expect(given.typeParameters()).toBeUndefined();
	});
	it('iterates and measures both arms of the read the same way', async () => {
		using opened = await open();
		const present = functionOf(opened.e, 'fn f(a: u8, b: u8) {}\n').parameters();
		const empty = functionOf(opened.e, 'fn f() {}\n').parameters();
		for (const list of [items(present), items(empty)]) {
			expect(list.length).toBe([...list].length);
			let count = 0;
			for (const _ of list) count++;
			expect(count).toBe(list.length);
			expect(list.map((item: { readonly $type: number }) => item.$type)).toHaveLength(list.length);
		}
		expect(items(present).length).toBe(2);
		expect(items(empty).length).toBe(0);
	});
});
