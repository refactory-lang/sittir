import { describe, expect, it } from 'vitest';
import { holdReadItems } from '../src/utils.ts';
import { undoIfFillFails } from '../src/list-fills.ts';

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

describe('undoIfFillFails', () => {
	const write = <K, V>(cache: Map<K, V> | Record<string, unknown>, key: K & string, value: V): void => {
		if (cache instanceof Map) {
			undoIfFillFails(cache, key, cache.get(key));
			cache.set(key, value);
		} else {
			undoIfFillFails(cache, key, cache[key]);
			cache[key] = value;
		}
	};

	it('takes back every cache write made while the fills ran when one of them throws', () => {
		const map = new Map<string, string>([['kept', 'before']]);
		const weak = new WeakMap<object, string>();
		const weakKey = {};
		const record: Record<string, unknown> = { kept: 'before' };
		expect(() =>
			listOf(() => {
				write(map, 'kept', 'during');
				write(map, 'added', 'during');
				undoIfFillFails(weak, weakKey, undefined);
				weak.set(weakKey, 'during');
				listOf(() => {
					write(record, 'kept', 'during');
					write(record, 'added', 'during');
					listOf(() => {
						throw new Error('refused');
					});
					return [];
				});
				return [];
			})
		).toThrow('refused');
		expect([...map]).toEqual([['kept', 'before']]);
		expect(weak.has(weakKey)).toBe(false);
		expect(record).toEqual({ kept: 'before' });
	});

	it('keeps the cache writes of fills that all return, and writes made while no fill runs', () => {
		const record: Record<string, unknown> = {};
		write(record, 'outside', 'kept');
		listOf(() => (write(record, 'during', 'kept'), []));
		expect(() =>
			listOf(() => {
				throw new Error('refused');
			})
		).toThrow('refused');
		expect(record).toEqual({ outside: 'kept', during: 'kept' });
	});
});
