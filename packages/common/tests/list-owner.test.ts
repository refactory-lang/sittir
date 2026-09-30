import { describe, expect, it } from 'vitest';
import { Delimiter, storedSlotReader, withListOwner } from '../src/utils.ts';

const made: unknown[][] = [];
const spec = {
	list: 'items',
	elements: 'elements',
	kind: 9,
	options: [
		{ key: 'delimiter', default: Delimiter.None },
		{ key: 'separator', default: undefined }
	],
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
		expect(node.items()).toEqual(['a', 'b']);
		expect(node.length).toBe(2);
		expect(node.at(-1)).toBe('b');
		expect(node.delimiter).toBe(Delimiter.Trailing);
		expect(node.separator).toBe(7);
	});
	it('a list that stored no option reads the default its spec stamps', () => {
		const stamped = withListOwner({ $type: 1, items: () => ({ elements: () => [] }) } as Record<string, unknown>, {
			...spec,
			options: [
				{ key: 'delimiter', default: Delimiter.Trailing },
				{ key: 'separator', default: 7 }
			]
		}) as any;
		expect(stamped.delimiter).toBe(Delimiter.Trailing);
		expect(stamped.separator).toBe(7);
	});
	it('an absent list iterates nothing and reads no delimiter', () => {
		const node = owner(undefined);
		expect([...node]).toEqual([]);
		expect(node.length).toBe(0);
		expect(node.at(0)).toBeUndefined();
		expect(node.items()).toBeUndefined();
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
		expect(Object.keys(node.$with)).toEqual(['items']);
	});
	it('the list setter takes the factory shapes: items, options and items, a whole list node, nothing', () => {
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
		const whole = { $type: 9, list: [] };
		expect(node.$with.items('a', 'b')).toBe('rebuilt');
		expect(node.$with.items({ delimiter: 2 }, 'a')).toBe('rebuilt');
		expect(made).toEqual([['a', 'b'], [{ delimiter: 2 }, 'a']]);
		expect(node.$with.items(whole)).toBe('rebuilt');
		expect(node.$with.items()).toBe('rebuilt');
		expect(node.$with(whole)).toBe('rebuilt');
		expect(made).toHaveLength(2);
		expect(seated.slice(2)).toEqual([whole, undefined, whole]);
	});
	it('reads an undecorated wrapper element as its content arm and keeps a decorated one', () => {
		const wrapper = { kind: 5, content: 'content', decorations: ['_attribute'] };
		const plain = { $type: 5, _attribute: undefined, content: () => 'arm' };
		const decorated = { $type: 5, _attribute: 'attr', content: () => 'arm' };
		const other = { $type: 6 };
		const node = withListOwner({ $type: 1, items: () => ({ elements: () => [plain, decorated, other] }) } as Record<string, unknown>, {
			...spec,
			wrapper
		}) as any;
		expect(node.items()).toEqual(['arm', decorated, other]);
		expect([...node]).toEqual(['arm', decorated, other]);
	});
	it('keeps the list node the accessor replaced reachable as the stored value of its slot', () => {
		const list = { elements: () => ['a', 'b'] };
		const node = owner(list);
		expect(node.items()).toEqual(['a', 'b']);
		expect((storedSlotReader(node, 'items') as () => unknown).call(node)).toBe(list);
		expect(storedSlotReader(node, 'other')).toBeUndefined();
		const plain = { other: () => 1 };
		expect(storedSlotReader(plain, 'other')).toBe(plain.other);
	});
	it('leaves a node without $with alone', () => {
		expect(() => owner({ elements: () => [] })).not.toThrow();
	});
});
