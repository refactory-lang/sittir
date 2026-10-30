import { describe, expect, it } from 'vitest';
import { holdReadItems } from '../src/utils.ts';

type Held = Record<number, unknown>;

const listOf = (read: () => ArrayLike<unknown>): Held => {
	const node: Held = {};
	holdReadItems(node, read);
	return node;
};

describe('holdReadItems', () => {
	it('fills a list whose items fill lists in turn without nesting its calls, however deep', () => {
		const depth = 100_000;
		const make = (level: number): Held => listOf(() => (level < depth ? [make(level + 1)] : []));
		let at = make(0);
		for (let level = 0; level < depth; level++) at = at[0] as Held;
		expect(at[0]).toBeUndefined();
	});

	it('fills lists in the order they were made, so a list read after another was made finds it filled', () => {
		const order: string[] = [];
		let owner: Held = {};
		listOf(() => {
			order.push('outer');
			const inner = listOf(() => (order.push('inner'), ['x']));
			owner = listOf(() => (order.push('owner'), [inner[0]]));
			return [inner, owner];
		});
		expect(order).toEqual(['outer', 'inner', 'owner']);
		expect(owner[0]).toBe('x');
	});

	it('fills again after a read throws', () => {
		expect(() =>
			listOf(() => {
				listOf(() => ['never']);
				throw new Error('refused');
			})
		).toThrow('refused');
		expect(listOf(() => ['a'])[0]).toBe('a');
	});
});
