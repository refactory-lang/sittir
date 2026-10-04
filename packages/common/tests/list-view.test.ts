import { describe, expect, it } from 'vitest';
import {
	Delimiter,
	LIST_ITEMS,
	LIST_METHODS,
	LIST_READ,
	LIST_VIEW_MEMBERS,
	defineListIndices,
	listIterator,
	listItems,
	listOption,
	ownerElements,
	ownerView,
	refuseReadStub
} from '../src/utils.ts';

const wrapperSpec = { kind: 5, content: 'content', decorations: ['_attribute'] };

const listNode = (elements: readonly unknown[], stored: Record<string, unknown> = {}) => ({
	_element: elements,
	elements: () => elements,
	...stored
});

const sharedMembers = (view: ReturnType<typeof ownerView>) => ({
	...LIST_METHODS,
	[Symbol.iterator]: listIterator,
	[Symbol.isConcatSpreadable]: true,
	[Symbol.unscopables]: Array.prototype[Symbol.unscopables],
	delimiter: listOption(view.list, 'delimiter', Delimiter.None),
	separator: listOption(view.list, 'separator', undefined)
});

const wrappedOwner = (list: object | undefined, wrapper?: typeof wrapperSpec, tree?: never) => {
	const view = ownerView(list, '_element', tree);
	const node: Record<PropertyKey, unknown> = {
		$type: 1,
		_items: list,
		items: () => list,
		length: view.stored?.length,
		[LIST_ITEMS]: undefined,
		[LIST_READ]: () => listItems(ownerElements((node.items as () => unknown)(), 'elements'), wrapper),
		...sharedMembers(view)
	};
	defineListIndices(node, view.stored?.length ?? 0);
	return node as any;
};

const builtOwner = (list: object | undefined, storage = '_items') => {
	const view = ownerView(list, '_element');
	if (view.stored === undefined) refuseReadStub(storage);
	const items = listItems(ownerElements(view.list, 'elements'), undefined);
	const node: Record<PropertyKey, unknown> = { $type: 1, _items: list, length: items.length, [LIST_ITEMS]: items, ...sharedMembers(view) };
	for (let index = 0; index < items.length; index++) node[index] = items[index];
	return node as any;
};

describe('a list owner', () => {
	it('reads as a ReadonlyArray of its list items, with the list options', () => {
		const node = wrappedOwner(listNode(['a', 'b', 'c'], { _delimiter: Delimiter.Trailing, _separator: 7 }));
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

	it('reads an absent list as empty, with the option defaults', () => {
		const node = wrappedOwner(undefined);
		expect(node.length).toBe(0);
		expect(node[0]).toBeUndefined();
		expect([...node]).toEqual([]);
		expect(node.delimiter).toBe(Delimiter.None);
	});

	it('reads an undecorated wrapper element as its content and keeps a decorated one', () => {
		const plain = { $type: 5, _attribute: undefined, content: () => 'arm' };
		const decorated = { $type: 5, _attribute: 'attr', content: () => 'arm' };
		const node = wrappedOwner(listNode([plain, decorated]), wrapperSpec);
		expect([...node]).toEqual(['arm', decorated]);
		expect(node[0]).toBe('arm');
	});

	it('sizes an owner over a read stub from its list node hydrated once, without reading the items', () => {
		const reads: [number | undefined, number | undefined][] = [];
		const hydrate = (list: { $parentHandle?: number; $childIndex?: number }) => (
			reads.push([list.$parentHandle, list.$childIndex]), { $type: 9, _element: [{ $type: 2 }, { $type: 2 }] }
		);
		let itemReads = 0;
		const view = ownerView({ $type: 9, $parentHandle: 4, $childIndex: 1 }, '_element', hydrate);
		const node: Record<PropertyKey, unknown> = {
			$type: 1,
			items: () => (itemReads++, listNode(['a', 'b'])),
			length: view.stored?.length,
			[LIST_ITEMS]: undefined,
			[LIST_READ]: () => listItems(ownerElements((node.items as () => unknown)(), 'elements'), undefined),
			...sharedMembers(view)
		};
		defineListIndices(node, view.stored?.length ?? 0);
		expect((node as any).length).toBe(2);
		expect(reads).toEqual([[4, 1]]);
		expect(itemReads).toBe(0);
		expect((node as any)[1]).toBe('b');
	});

	it('built over a read stub no tree can read, is refused at the build', () => {
		expect(() => builtOwner({ $type: 9, $parentHandle: 4, $childIndex: 1 })).toThrow(/read stub/);
	});

	it('reads an empty list node that carries its own handle as empty, not as a stub', () => {
		const view = ownerView({ $type: 9, $handle: 3, _element: [] }, '_element');
		expect(view.stored).toEqual([]);
	});

	it('counts a lone element the reader stores as a single node', () => {
		const node = wrappedOwner({ ...listNode(['a']), _element: { $type: 2 } });
		expect(node.length).toBe(1);
		expect(node[0]).toBe('a');
	});

	it('prints and concatenates as its items', () => {
		const node = wrappedOwner(listNode(['a', 'b']));
		expect(String(node)).toBe('a,b');
		expect(node.toLocaleString()).toBe('a,b');
		expect(node.concat(wrappedOwner(listNode(['c'])))).toEqual(['a', 'b', 'c']);
		expect(['z'].concat(node)).toEqual(['z', 'a', 'b']);
	});

	it('keeps its index getters off the enumerable keys', () => {
		const node = wrappedOwner(listNode(['a']));
		expect(Object.keys(node)).not.toContain('0');
	});

	it('names the members a list accessor must not collide with', () => {
		expect(LIST_VIEW_MEMBERS).toContain('entries');
		expect(LIST_VIEW_MEMBERS).toContain('length');
		expect(LIST_VIEW_MEMBERS).toContain('toString');
	});
});
