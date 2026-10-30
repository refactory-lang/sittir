import { setFlagsFromString } from 'node:v8';
import { describe, expect, it } from 'vitest';
import { keepExemplar, keepLayout, layoutShell } from '../src/exemplars.ts';
import { Source } from '../src/source.ts';
import { SOURCE } from '../src/source-stamp.ts';
import { TREE } from '../src/tree-token.ts';

setFlagsFromString('--allow-natives-syntax');
const haveSameMap = new Function('a', 'b', 'return %HaveSameMap(a, b);') as (a: object, b: object) => boolean;

function listOf(items: readonly object[], text: string) {
	const node = {
		$type: 7,
		_item: items,
		_text: text,
		$_layout: undefined,
		$with: { items: () => node },
		items: () => node._item,
		length: items.length,
		$render: () => node._text,
		$trivia: { leading: () => node },
		[SOURCE]: Source.Factory
	};
	const held = node as unknown as Record<number, object>;
	for (let index = 0; index < items.length; index++) held[index] = items[index]!;
	return node;
}

function leafOf(kind: number, text: string) {
	const node = { $type: kind, $_layout: undefined, $text: () => text, $render: () => text, [SOURCE]: Source.Factory };
	return node;
}

function parsedOf(kind: number) {
	return { $type: kind, $render: () => '', [TREE]: { treeId: 1 }, [SOURCE]: Source.Ts };
}

const itemsOf = (count: number) => Array.from({ length: count }, (_, index) => leafOf(3, `x${index}`));

describe('a layout shell', () => {
	it('has the layout of the node it is made from', () => {
		const node = listOf(itemsOf(500), 'x'.repeat(1000));
		const shell = layoutShell(node);
		expect(haveSameMap(shell, node)).toBe(true);
		expect(haveSameMap(shell, listOf(itemsOf(3), 'y'))).toBe(true);
	});

	it('holds none of its data: no items, no closure of the node, no object and no text', () => {
		const node = listOf(itemsOf(500), 'x'.repeat(1000)) as unknown as Record<PropertyKey, unknown>;
		const shell = layoutShell(node) as Record<PropertyKey, unknown>;
		expect(Reflect.ownKeys(shell)).toEqual(Reflect.ownKeys(node).filter((key) => !/^\d+$/.test(String(key))));
		for (const key of Reflect.ownKeys(shell)) {
			const value = shell[key];
			if (typeof value === 'function') expect(value).not.toBe(node[key]);
			else expect(typeof value === 'object' && value !== null).toBe(false);
		}
		expect(shell._text).toBe('');
		expect(shell.$type).toBe(7);
		expect(shell.length).toBe(500);
		expect(shell[SOURCE]).toBe(Source.Factory);
	});
});

describe('keepLayout', () => {
	it('keeps a shell of the first built node of each kind, its built children included, and returns each node unchanged', () => {
		const layouts: object[] = [];
		const first = listOf([leafOf(3, 'a'), parsedOf(4)], 'a');
		expect(keepLayout(layouts, first)).toBe(first);
		const kept = layouts[7];
		const second = listOf(itemsOf(2), 'b');
		expect(keepLayout(layouts, second)).toBe(second);
		expect(layouts[7]).toBe(kept);
		expect(haveSameMap(layouts[7]!, first)).toBe(true);
		expect(layouts[7]).not.toBe(first);
		expect(haveSameMap(layouts[3]!, leafOf(3, 'c'))).toBe(true);
		expect(layouts[4]).toBeUndefined();
		expect(keepLayout(layouts, parsedOf(5))).toBeDefined();
		expect(layouts[5]).toBeUndefined();
	});

	it('goes no deeper than the kinds it has not kept, however deep the first node nests', () => {
		let node: object = leafOf(3, 'x');
		for (let depth = 0; depth < 100_000; depth++) node = listOf([node], 'n');
		const layouts: object[] = [];
		expect(keepLayout(layouts, node)).toBe(node);
		expect(Object.keys(layouts)).toEqual(['7']);
		expect(keepLayout(layouts, listOf([leafOf(3, 'y')], 'm'))).toBeDefined();
		expect(Object.keys(layouts)).toEqual(['7']);
	});
});

describe('keepExemplar', () => {
	it('keeps the first node of a kind itself, and returns each node unchanged', () => {
		const exemplars: object[] = [];
		const first = listOf(itemsOf(2), 'a');
		expect(keepExemplar(exemplars, first)).toBe(first);
		expect(keepExemplar(exemplars, listOf(itemsOf(2), 'b'))).not.toBe(first);
		expect(exemplars[7]).toBe(first);
	});
});
