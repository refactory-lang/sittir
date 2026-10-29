import { describe, expect, it } from 'vitest';
import {
	Delimiter,
	LIST_METHODS,
	LIST_VIEW_MEMBERS,
	holdListItems,
	listIterator,
	listItems,
	listOption,
	ownerElements,
	ownerView,
	refuseReadStub
} from '../src/utils.ts';

const wrapperSpec = { kind: 5, content: 'content', decorations: ['attributes'] };

const listNode = (elements: readonly unknown[], stored: Record<string, unknown> = {}) => ({
	_element: elements,
	elements: () => elements,
	...stored
});

const sharedMembers = (view: ReturnType<typeof ownerView>) => ({
	...LIST_METHODS,
	[Symbol.iterator]: listIterator,
	[Symbol.isConcatSpreadable]: true,
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
		...sharedMembers(view)
	};
	holdListItems(node, listItems(ownerElements((node.items as () => unknown)(), 'elements'), wrapper));
	return node as any;
};

const builtOwner = (list: object | undefined, storage = '_items') => {
	const view = ownerView(list, '_element');
	if (view.stored === undefined) refuseReadStub(storage);
	const items = listItems(ownerElements(view.list, 'elements'), undefined);
	const node: Record<PropertyKey, unknown> = { $type: 1, _items: list, length: items.length, ...sharedMembers(view) };
	holdListItems(node, items);
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
		const plain = { $type: 5, attributes: () => undefined, content: () => 'arm' };
		const empty = { $type: 5, attributes: () => [], content: () => 'bare' };
		const decorated = { $type: 5, attributes: () => ['attr'], content: () => 'arm' };
		const node = wrappedOwner(listNode([plain, empty, decorated]), wrapperSpec);
		expect([...node]).toEqual(['arm', 'bare', decorated]);
		expect(node[0]).toBe('arm');
	});

	it('sizes an owner over a list past the read\'s depth from its list node hydrated once, and holds its items from one read', () => {
		const reads: (number | undefined)[] = [];
		const hydrate = (list: { $treeHandle?: number }) => (reads.push(list.$treeHandle), { $type: 9, _element: [{ $type: 2 }, { $type: 2 }] });
		let itemReads = 0;
		const view = ownerView({ $type: 9, $treeHandle: 4, $span: { start: 0, end: 3 } }, '_element', hydrate);
		const node: Record<PropertyKey, unknown> = {
			$type: 1,
			items: () => (itemReads++, listNode(['a', 'b'])),
			length: view.stored?.length,
			...sharedMembers(view)
		};
		holdListItems(node, listItems(ownerElements((node.items as () => unknown)(), 'elements'), undefined));
		expect((node as any).length).toBe(2);
		expect(reads).toEqual([4]);
		expect(itemReads).toBe(1);
		expect((node as any)[1]).toBe('b');
	});

	it('built over a coordinate no tree can read, is refused at the build', () => {
		expect(() => builtOwner({ $type: 9, $treeHandle: 4, $span: { start: 0, end: 3 } })).toThrow(/read stub/);
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

	it('concatenates and prints locale strings as its items, leaving toString to the node', () => {
		const node = wrappedOwner(listNode(['a', 'b']));
		expect(Object.hasOwn(node, 'toString')).toBe(false);
		expect(node.toLocaleString()).toBe('a,b');
		expect(node.concat(wrappedOwner(listNode(['c'])))).toEqual(['a', 'b', 'c']);
		expect(['z'].concat(node)).toEqual(['z', 'a', 'b']);
	});

	it('holds its items as its own elements, 0 to length - 1', () => {
		const node = wrappedOwner(listNode(['a', 'b']));
		expect(Object.getOwnPropertyDescriptor(node, '1')).toEqual({ value: 'b', writable: true, enumerable: true, configurable: true });
		expect(Object.hasOwn(node, '2')).toBe(false);
	});

	it('names the members a list accessor must not collide with', () => {
		expect(LIST_VIEW_MEMBERS).toContain('entries');
		expect(LIST_VIEW_MEMBERS).toContain('length');
		expect(LIST_VIEW_MEMBERS).toContain('toString');
	});
});
