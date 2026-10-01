import { describe, expect, it, vi } from 'vitest';
import type { AnyUntypedNode } from '@sittir/types';
import { inEngine } from '../src/engine-scope.ts';
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
	triviaInnerAt,
	triviaSide,
	withMethods
} from '../src/utils.ts';

const comment = (text: string): AnyUntypedNode => ({ $type: 9, $source: 2, $text: text });
const facts = (gaps: Record<string, readonly string[]> = {}) => ({
	kindName: (type: unknown) => (type === 9 ? 'comment' : type === 1 ? 'block' : undefined),
	kinds: new Set(['comment']),
	innerGaps: gaps
});
const handleOf = (gaps?: Record<string, readonly string[]>) => liveHandle({ render: () => 'rendered', trivia: facts(gaps) });

describe('renderText', () => {
	it('renders through the handle it is given, and refuses with none', () => {
		const render = vi.fn(() => 'rendered');
		const handle = liveHandle({ render, trivia: facts() });
		const node = { $type: 1, $source: 2, _name: 'x' } as AnyUntypedNode;
		expect(renderText(handle, node)).toBe('rendered');
		expect(render).toHaveBeenCalledWith(node);
		expect(() => renderText(undefined, node)).toThrow('node has no engine');
	});
});

describe('rebuilt', () => {
	it('hands the source node trivia to the node it returns', () => {
		const handle = handleOf();
		const source = { $type: 1, $source: 2, _a: undefined, $_trivia: { leading: [comment('// c')] } } as unknown as AnyUntypedNode;
		const result = rebuilt(source, handle, () => ({ $type: 1, $source: 2, _a: 'v' }) as unknown as AnyUntypedNode);
		expect(result.$_trivia).toBe(source.$_trivia);
	});

	it('runs the rebuild inside the engine of the node, and with no engine just runs it', () => {
		const handle = handleOf();
		const seen: unknown[] = [];
		const node = { $type: 1, $source: 2 } as AnyUntypedNode;
		rebuilt(node, handle, () => seen.push(inEngine(handle, () => 1)));
		expect(rebuilt(node, undefined, () => 5)).toBe(5);
	});

	it('refuses inner comments on a node that is no longer empty', () => {
		const handle = handleOf();
		const source = { $type: 1, $source: 2, $_trivia: { inner: { body: [comment('// c')] } } } as unknown as AnyUntypedNode;
		expect(() => rebuilt(source, handle, () => ({ $type: 1, $source: 2, _a: 'v' }) as unknown as AnyUntypedNode)).toThrow(
			'holds inner comments'
		);
		expect(rebuilt(source, handle, () => ({ $type: 1, $source: 2 }) as AnyUntypedNode).$_trivia).toBe(source.$_trivia);
	});
});

describe('trivia positions', () => {
	it('set a position and keep the other, return the node, and read back with no items', () => {
		const handle = handleOf();
		const node = { $type: 1, $source: 2 } as AnyUntypedNode;
		expect(triviaSide(node, handle, 'leading', [comment('// a')])).toBe(node);
		expect(triviaSide(node, handle, 'trailing', [comment('// b')])).toBe(node);
		expect(node.$_trivia?.leading).toHaveLength(1);
		expect(triviaSide(node, handle, 'trailing', [])).toBe(node.$_trivia?.trailing);
		expect(triviaSide({ $type: 1, $source: 2 } as AnyUntypedNode, handle, 'leading', [])).toEqual([]);
	});

	it('refuse with no engine', () => {
		const node = { $type: 1, $source: 2 } as AnyUntypedNode;
		expect(() => triviaSide(node, undefined, 'leading', [])).toThrow('node has no engine');
	});

	it('write inner entries only to an empty node of a kind with inner gaps', () => {
		const handle = handleOf({ block: ['body', 'tail'] });
		const empty = { $type: 1, $source: 2, _statements: [] } as unknown as AnyUntypedNode;
		expect(triviaInner(empty, handle, [comment('// x')])).toBe(empty);
		expect(empty.$_trivia?.inner?.body).toHaveLength(1);
		expect(triviaInnerAt(empty, handle, 'tail', [comment('// y')])).toBe(empty);
		expect(triviaInnerAt(empty, handle, 'tail', [])).toHaveLength(1);
		expect(() => triviaInnerAt(empty, handle, 'nope', [comment('// z')])).toThrow("has no gap 'nope'");
		const full = { $type: 1, $source: 2, _statements: [1] } as unknown as AnyUntypedNode;
		expect(() => triviaInner(full, handle, [comment('// x')])).toThrow('not empty');
		expect(() => triviaInner({ $type: 2, $source: 2 } as AnyUntypedNode, handle, [comment('// x')])).toThrow('no inner gap');
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
		expect(seatWith(spec, spec.keys[0]!, ['L'], seat, () => group)).toEqual({ seated: { $type: 7, left: 'L' } });
		expect(() => seatWith(spec, spec.keys[0]!, ['L'], seat, () => undefined)).toThrow("without its required right");
		expect(seatWith(spec, spec.keys[1]!, ['R'], seat, () => undefined)).toEqual({ seated: { $type: 7, right: 'R' } });
		expect(seatWith(spec, spec.keys[1]!, [], seat, () => undefined)).toEqual({ seated: undefined });
		const whole = { $type: 7 };
		expect(seatWith({ ...spec, keys: [{ name: 'seat', rest: false }] }, { name: 'seat', rest: false }, [whole], seat, () => undefined)).toEqual({ seated: whole });
	});
});

describe('withMethods still serves the old helpers through the same functions', () => {
	it('attaches positions that use the shared writers', () => {
		const handle = handleOf();
		const node = inEngine(handle, () => withMethods({ $type: 1, $source: 2 } as AnyUntypedNode));
		expect(node.$trivia.leading(comment('// a'))).toBe(node);
	});
});
