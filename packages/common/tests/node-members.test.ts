import { describe, expect, it, vi } from 'vitest';
import type { AnyUntypedNode } from '@sittir/types';
import { inEngine } from '../src/engine-scope.ts';
import { stampBuilt } from '../src/source-stamp.ts';
import { liveHandle } from './support/fake-engine.ts';
import {
	LIST_ITEMS,
	LIST_METHODS,
	elementsWith,
	listItems,
	listIterator,
	listSlotWith,
	rebuilt,
	renderText,
	seatWith,
	triviaInner,
	triviaSide
} from '../src/utils.ts';

const comment = (text: string): AnyUntypedNode => stampBuilt({ $type: 9, $text: text });
const facts = (inner: readonly string[] = []) => ({
	kindName: (type: unknown) => (type === 9 ? 'comment' : type === 1 ? 'block' : undefined),
	kinds: new Set(['comment']),
	innerKinds: new Set(inner),
	rebuildWrappers: new Set<number>(),
	listKinds: new Set<number>(), layout: new Set<number>()
});
const handleOf = (inner?: readonly string[]) => liveHandle({ render: () => 'rendered', trivia: facts(inner) });

describe('renderText', () => {
	it('renders through the handle it is given, and refuses with none', () => {
		const render = vi.fn(() => 'rendered');
		const handle = liveHandle({ render, trivia: facts() });
		const node = stampBuilt({ $type: 1, _name: 'x' }) as AnyUntypedNode;
		expect(renderText(handle, node)).toBe('rendered');
		expect(render).toHaveBeenCalledWith(node);
		expect(() => renderText(undefined, node)).toThrow('node has no engine');
	});
});

describe('rebuilt', () => {
	it('hands the source node trivia to the node it returns', () => {
		const handle = handleOf();
		const source = stampBuilt({ $type: 1, _a: undefined, $_layout: { trivia: { leading: [comment('// c')] } } }) as unknown as AnyUntypedNode;
		const result = rebuilt(source, handle, () => stampBuilt({ $type: 1, _a: 'v' }) as unknown as AnyUntypedNode);
		expect(result.$_layout?.trivia).toBe(source.$_layout?.trivia);
	});

	it('runs the rebuild inside the engine of the node, and with no engine just runs it', () => {
		const handle = handleOf();
		const seen: unknown[] = [];
		const node = stampBuilt({ $type: 1 }) as AnyUntypedNode;
		rebuilt(node, handle, () => seen.push(inEngine(handle, () => 1)));
		expect(rebuilt(node, undefined, () => 5)).toBe(5);
	});

	it('refuses inner comments on a node that is no longer empty', () => {
		const handle = handleOf();
		const source = stampBuilt({ $type: 1, $_layout: { trivia: { inner: [comment('// c')] } } }) as unknown as AnyUntypedNode;
		expect(() => rebuilt(source, handle, () => stampBuilt({ $type: 1, _a: 'v' }) as unknown as AnyUntypedNode)).toThrow(
			'holds inner comments'
		);
		expect(rebuilt(source, handle, () => stampBuilt({ $type: 1 }) as AnyUntypedNode).$_layout?.trivia).toBe(source.$_layout?.trivia);
	});
});

describe('trivia positions', () => {
	it('set a position and keep the other, return the node, and read back with no items', () => {
		const handle = handleOf();
		const node = stampBuilt({ $type: 1 }) as AnyUntypedNode;
		expect(triviaSide(node, handle, 'leading', [comment('// a')])).toBe(node);
		expect(triviaSide(node, handle, 'trailing', [comment('// b')])).toBe(node);
		expect(node.$_layout?.trivia?.leading).toHaveLength(1);
		expect(triviaSide(node, handle, 'trailing', [])).toBe(node.$_layout?.trivia?.trailing);
		expect(triviaSide(stampBuilt({ $type: 1 }) as AnyUntypedNode, handle, 'leading', [])).toEqual([]);
	});

	it('refuse with no engine', () => {
		const node = stampBuilt({ $type: 1 }) as AnyUntypedNode;
		expect(() => triviaSide(node, undefined, 'leading', [])).toThrow('node has no engine');
	});

	it('write inner entries only to an empty node of a kind with an inner site', () => {
		const handle = handleOf(['block']);
		const empty = stampBuilt({ $type: 1, _statements: [] }) as unknown as AnyUntypedNode;
		expect(triviaInner(empty, handle, [comment('// x')])).toBe(empty);
		expect(empty.$_layout?.trivia?.inner).toHaveLength(1);
		expect(triviaInner(empty, handle, [])).toHaveLength(1);
		const full = stampBuilt({ $type: 1, _statements: [1] }) as unknown as AnyUntypedNode;
		expect(() => triviaInner(full, handle, [comment('// x')])).toThrow('not empty');
		expect(() => triviaInner(stampBuilt({ $type: 2 }) as AnyUntypedNode, handle, [comment('// x')])).toThrow('no inner site');
	});
});

describe('list members', () => {
	const node = (items: readonly unknown[]) => ({ length: items.length, [LIST_ITEMS]: items, ...LIST_METHODS, [Symbol.iterator]: listIterator });

	it('read the items the node holds', () => {
		const list = node(['a', 'b', 'c']) as any;
		expect(list.map((item: string) => item.toUpperCase())).toEqual(['A', 'B', 'C']);
		expect(list.at(-1)).toBe('c');
		expect([...list]).toEqual(['a', 'b', 'c']);
		expect(list.slice(1)).toEqual(['b', 'c']);
		expect(list.with(0, 'z')).toEqual(['z', 'b', 'c']);
	});

	it('listItems freezes the elements and reads a content-only wrapper as its content', () => {
		const content = { $type: 5 };
		const wrapped = { $type: 8, _attr: undefined, expression: () => content };
		const items = listItems([wrapped, 'x'], { kind: 8, content: 'expression', decorations: ['_attr'] });
		expect(items).toEqual([content, 'x']);
		expect(Object.isFrozen(items)).toBe(true);
		const decorated = { ...wrapped, _attr: 'a' };
		expect(listItems([decorated], { kind: 8, content: 'expression', decorations: ['_attr'] })[0]).toBe(decorated);
	});
});

describe('setter bodies', () => {
	const slot = { kind: 3, optional: true, make: (...items: unknown[]) => ({ $type: 3, items }) };

	it('listSlotWith: no arguments clear an optional slot, the list itself is set whole, items build the list', () => {
		const set = vi.fn((value?: unknown) => value);
		expect(listSlotWith([], slot, set)).toBeUndefined();
		expect(listSlotWith([], { ...slot, optional: false }, set)).toEqual({ $type: 3, items: [] });
		const whole = { $type: 3, items: [1] };
		expect(listSlotWith([whole], slot, set)).toBe(whole);
		expect(listSlotWith([1, 2], slot, set)).toEqual({ $type: 3, items: [1, 2] });
	});

	it('elementsWith: refuses one array, and builds element groups into elements', () => {
		const set = vi.fn((...values: unknown[]) => values);
		const spec = { slot: 'items', keys: ['a'], make: (config: never) => ({ built: config }) };
		expect(() => elementsWith([[1, 2]], spec, set)).toThrow('rest arguments');
		expect(elementsWith([{ a: 1 }, 'x'], spec, set)).toEqual([{ built: { a: 1 } }, 'x']);
	});

	it('seatWith: writes through a present group, and builds an absent one from a lone field', () => {
		const spec = { slot: 'seat', stored: '_seat', kind: 7, make: (config: never) => ({ $type: 7, ...(config as object) }), keys: [{ name: 'left', rest: false }, { name: 'right', rest: false, required: true }] };
		const seat = vi.fn((value?: unknown) => ({ seated: value }));
		const group = { $type: 7, $with: { left: (v: string) => ({ $type: 7, left: v }) } } as never;
		expect(seatWith(spec, 'left', ['L'], seat, () => group)).toEqual({ seated: { $type: 7, left: 'L' } });
		expect(() => seatWith(spec, 'left', ['L'], seat, () => undefined)).toThrow("without its required right");
		expect(seatWith(spec, 'right', ['R'], seat, () => undefined)).toEqual({ seated: { $type: 7, right: 'R' } });
		expect(seatWith(spec, 'right', [], seat, () => undefined)).toEqual({ seated: undefined });
		const whole = { $type: 7 };
		expect(seatWith({ ...spec, keys: [{ name: 'seat', rest: false }] }, 'seat', [whole], seat, () => undefined)).toEqual({ seated: whole });
	});
});

describe('kindIdStorage', () => {
	it('keeps absent and ids, and leaves text for the slot to refuse; a list maps it item by item', async () => {
		const { kindIdStorage, listStorage } = await import('../src/utils.ts');
		expect(kindIdStorage(undefined)).toBeUndefined();
		expect(kindIdStorage(null)).toBeUndefined();
		expect(kindIdStorage(7)).toBe(7);
		expect(listStorage([1, null, 2], kindIdStorage)).toEqual([1, 2]);
		expect(kindIdStorage('+')).toBe('+');
	});
});

describe('listStorage', () => {
	it('stores a new array of the items, each through the item function, dropping the absent ones', async () => {
		const { listStorage } = await import('../src/utils.ts');
		const input = [1, undefined, 2];
		const stored = listStorage<number[]>(input);
		expect(stored).toEqual([1, 2]);
		expect(stored).not.toBe(input);
		expect(listStorage([1, 2], (item) => (item === 1 ? undefined : (item as number) * 10))).toEqual([20]);
	});

	it('stores a value that is not an array through the item function alone', async () => {
		const { listStorage } = await import('../src/utils.ts');
		expect(listStorage(undefined)).toBeUndefined();
		expect(listStorage(3, (item) => (item as number) + 1)).toBe(4);
	});
});
