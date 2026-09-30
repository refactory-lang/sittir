import { describe, expect, it } from 'vitest';
import { Delimiter, withListOwner } from '../src/utils.ts';

const spec = { list: 'items', elements: 'elements', options: ['delimiter', 'separator'] } as const;

const owner = (list: object | undefined) =>
	withListOwner({ $type: 1, items: () => list } as Record<string, unknown>, spec) as any;

describe('withListOwner', () => {
	it('iterates the list through its own accessor and reports length and at', () => {
		const node = owner({ elements: () => ['a', 'b'], _delimiter: Delimiter.Trailing, _separator: 7 });
		expect([...node]).toEqual(['a', 'b']);
		expect(node.length).toBe(2);
		expect(node.at(-1)).toBe('b');
		expect(node.delimiter).toBe(Delimiter.Trailing);
		expect(node.separator).toBe(7);
	});
	it('an absent list iterates nothing and reads no delimiter', () => {
		const node = owner(undefined);
		expect([...node]).toEqual([]);
		expect(node.length).toBe(0);
		expect(node.at(0)).toBeUndefined();
		expect(node.delimiter).toBe(Delimiter.None);
		expect(node.separator).toBeUndefined();
	});
	it('defines every member non-enumerable so spreads and serialisation are unchanged', () => {
		const node = owner({ elements: () => [] });
		expect(Object.keys(node)).toEqual(['$type', 'items']);
		for (const key of ['length', 'at', 'delimiter', 'separator']) expect(Object.keys(node)).not.toContain(key);
		expect(Object.getOwnPropertySymbols({ ...node })).toEqual([]);
	});
});
