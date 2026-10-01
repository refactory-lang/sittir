import { describe, expect, it } from 'vitest';
import { Delimiter, LIST_VIEW_MEMBERS, withListSlots, withListView } from '../src/utils.ts';

const options = [
	{ key: 'delimiter', default: Delimiter.None },
	{ key: 'separator', default: undefined }
];

const listNode = (elements: readonly unknown[], stored: Record<string, unknown> = {}) => ({
	_element: elements,
	elements: () => elements,
	...stored
});

const ownerSpec = { list: { accessor: 'items', storage: '_items' }, elements: 'elements', count: '_element', options };

const owner = (list: object | undefined, wrapper?: { kind: number; content: string; decorations: string[] }) =>
	withListView({ $type: 1, _items: list, items: () => list } as Record<string, unknown>, {
		...ownerSpec,
		...(wrapper === undefined ? {} : { wrapper })
	}) as any;

describe('withListView', () => {
	it('reads an owner as a ReadonlyArray of its list items, with the list options', () => {
		const node = owner(listNode(['a', 'b', 'c'], { _delimiter: Delimiter.Trailing, _separator: 7 }));
		expect(node.length).toBe(3);
		expect([node[0], node[1], node[2], node[3]]).toEqual(['a', 'b', 'c', undefined]);
		expect([...node]).toEqual(['a', 'b', 'c']);
		expect(node.map((item: string) => item.toUpperCase())).toEqual(['A', 'B', 'C']);
		expect(node.slice(1)).toEqual(['b', 'c']);
		expect(node.toReversed()).toEqual(['c', 'b', 'a']);
		expect(node.with(0, 'z')).toEqual(['z', 'b', 'c']);
		expect([...node.entries()]).toEqual([
			[0, 'a'],
			[1, 'b'],
			[2, 'c']
		]);
		expect(node.at(-1)).toBe('c');
		expect(node.delimiter).toBe(Delimiter.Trailing);
		expect(node.separator).toBe(7);
		expect(node.items().elements()).toEqual(['a', 'b', 'c']);
	});

	it('reads a list node as its own items when the spec names no list accessor', () => {
		const node = withListView(listNode(['a', 'b'], { _delimiter: Delimiter.Trailing }), {
			elements: 'elements',
			count: '_element',
			options
		}) as any;
		expect([...node]).toEqual(['a', 'b']);
		expect(node[1]).toBe('b');
		expect(node.delimiter).toBe(Delimiter.Trailing);
	});

	it('reads an absent list as empty, with the option defaults', () => {
		const node = owner(undefined);
		expect(node.length).toBe(0);
		expect(node[0]).toBeUndefined();
		expect([...node]).toEqual([]);
		expect(node.delimiter).toBe(Delimiter.None);
	});

	it('reads an undecorated wrapper element as its content and keeps a decorated one', () => {
		const wrapper = { kind: 5, content: 'content', decorations: ['_attribute'] };
		const plain = { $type: 5, _attribute: undefined, content: () => 'arm' };
		const decorated = { $type: 5, _attribute: 'attr', content: () => 'arm' };
		const node = owner(listNode([plain, decorated]), wrapper);
		expect([...node]).toEqual(['arm', decorated]);
		expect(node[0]).toBe('arm');
	});

	it('sizes an owner over a read stub from its list node read one level, without reading the items', () => {
		const reads: [number | undefined, number | undefined][] = [];
		const tree = {
			read: (handle?: number, childIndex?: number) => (reads.push([handle, childIndex]), { $type: 9, _element: [{ $type: 2 }, { $type: 2 }] })
		};
		let itemReads = 0;
		const node = withListView(
			{
				$type: 1,
				_items: { $type: 9, $parentHandle: 4, $childIndex: 1 },
				items: () => (itemReads++, listNode(['a', 'b']))
			} as Record<string, unknown>,
			ownerSpec,
			tree as never
		) as any;
		expect(node.length).toBe(2);
		expect(reads).toEqual([[4, 1]]);
		expect(itemReads).toBe(0);
		expect(node[1]).toBe('b');
	});

	it('builds an owner over a read stub no tree can read, and refuses to count it', () => {
		const node = withListView(
			{ $type: 1, _items: { $type: 9, $parentHandle: 4, $childIndex: 1 }, items: () => undefined },
			ownerSpec
		) as any;
		expect(() => node.length).toThrow(/read stub/);
		expect(node[0]).toBeUndefined();
	});

	it('reads an empty list node that carries its own handle as empty, not as a stub', () => {
		const node = withListView({ $type: 9, $handle: 3, elements: () => [] } as Record<string, unknown>, {
			elements: 'elements',
			count: '_element'
		}) as any;
		expect(node.length).toBe(0);
	});

	it('counts a lone element the reader stores as a single node', () => {
		const node = withListView(
			{ $type: 1, _items: { $type: 9, _element: { $type: 2 } }, items: () => listNode(['a']) } as Record<string, unknown>,
			ownerSpec
		) as any;
		expect(node.length).toBe(1);
		expect(node[0]).toBe('a');
	});

	it('prints and concatenates as its items', () => {
		const node = owner(listNode(['a', 'b']));
		expect(String(node)).toBe('a,b');
		expect(node.toLocaleString()).toBe('a,b');
		expect(node.concat(owner(listNode(['c'])))).toEqual(['a', 'b', 'c']);
		expect(['z'].concat(node)).toEqual(['z', 'a', 'b']);
	});

	it('keeps every view member off the enumerable keys', () => {
		const node = owner(listNode(['a']));
		expect(Object.keys(node)).toEqual(['$type', '_items', 'items']);
		expect(Object.getOwnPropertySymbols({ ...node })).toEqual([]);
	});

	it('names the members a list accessor must not collide with', () => {
		expect(LIST_VIEW_MEMBERS).toContain('entries');
		expect(LIST_VIEW_MEMBERS).toContain('length');
		expect(LIST_VIEW_MEMBERS).toContain('toString');
	});
});

describe('withListSlots', () => {
	const setup = (optional: boolean) => {
		const made: unknown[][] = [];
		const seated: unknown[] = [];
		const node = withListSlots(
			{ $type: 1, $with: { items: (value?: unknown) => (seated.push(value), 'rebuilt') } } as Record<string, unknown>,
			[{ slot: 'items', kind: 9, optional, make: (...args: unknown[]) => (made.push(args), { $type: 9, args }) }]
		) as any;
		return { node, made, seated };
	};

	it('builds the list from the builder arguments: items, or options then items', () => {
		const { node, made, seated } = setup(false);
		expect(node.$with.items('a', 'b')).toBe('rebuilt');
		expect(node.$with.items({ delimiter: 2 }, 'a')).toBe('rebuilt');
		expect(made).toEqual([['a', 'b'], [{ delimiter: 2 }, 'a']]);
		expect(seated).toEqual([
			{ $type: 9, args: ['a', 'b'] },
			{ $type: 9, args: [{ delimiter: 2 }, 'a'] }
		]);
	});

	it('seats a whole node of the slot kind as it is', () => {
		const { node, made, seated } = setup(false);
		const whole = { $type: 9 };
		node.$with.items(whole);
		expect(made).toEqual([]);
		expect(seated).toEqual([whole]);
	});

	it('clears an optional slot with no arguments, and builds an empty list for a required one', () => {
		const optional = setup(true);
		optional.node.$with.items();
		expect(optional.seated).toEqual([undefined]);
		const required = setup(false);
		required.node.$with.items();
		expect(required.made).toEqual([[]]);
	});

	it('leaves a node without $with alone', () => {
		expect(() => withListSlots({ $type: 1 }, [{ slot: 'items', kind: 9, optional: true, make: () => undefined }])).not.toThrow();
	});
});
