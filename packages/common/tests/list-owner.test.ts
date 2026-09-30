import { describe, expect, it } from 'vitest';
import { Delimiter, withListOwner } from '../src/utils.ts';

const made: unknown[][] = [];
const spec = {
	list: 'items',
	elements: 'elements',
	options: ['delimiter', 'separator'],
	make: (...args: unknown[]) => {
		made.push(args);
		return { list: args };
	}
} as const;

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

	it('makes $with callable: the arguments build the list, the list setter seats it, the setters stay', () => {
		made.length = 0;
		const seated: unknown[] = [];
		const node = withListOwner(
			{
				$type: 1,
				items: () => undefined,
				$with: { items: (list: unknown) => (seated.push(list), 'rebuilt') }
			} as Record<string, unknown>,
			spec
		) as any;
		expect(node.$with({ delimiter: 2 }, 'a', 'b')).toBe('rebuilt');
		expect(made).toEqual([[{ delimiter: 2 }, 'a', 'b']]);
		expect(seated).toEqual([{ list: [{ delimiter: 2 }, 'a', 'b'] }]);
		expect(node.$with.items({ list: [] })).toBe('rebuilt');
		expect(Object.keys(node.$with)).toEqual(['items']);
	});
	it('leaves a node without $with alone', () => {
		expect(() => owner({ elements: () => [] })).not.toThrow();
	});
});
