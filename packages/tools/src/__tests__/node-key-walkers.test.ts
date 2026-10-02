import { describe, expect, it } from 'vitest';
import { materialize } from '../validate/common.ts';
import { collectChildren } from '../exercise/walk.ts';

const LIST_ITEMS = Symbol('items');

const leaf = (text: string) => ({
	$type: 3,
	$source: 0,
	$named: true,
	$text: text,
	$render: () => text,
	$trivia: { leading: () => [], trailing: () => [] },
	$engine: undefined
});

const owner = (child: ReturnType<typeof leaf>) => ({
	$type: 7,
	$source: 0,
	$named: true,
	_body: child,
	$with: { body: () => undefined },
	body: () => child,
	length: 1,
	0: child,
	delimiter: 0,
	keys: () => [][Symbol.iterator](),
	values: () => [][Symbol.iterator](),
	toString: () => 'list',
	[LIST_ITEMS]: [child],
	$render: () => 'x',
	$trivia: { leading: () => [], trailing: () => [] },
	$engine: undefined
});

describe('the tools walkers select a node by key', () => {
	it('materialize copies storage and $ metadata only', () => {
		expect(materialize(owner(leaf('a')))).toEqual({
			$type: 7,
			$source: 0,
			$named: true,
			_body: { $type: 3, $source: 0, $named: true, $text: 'a' }
		});
	});

	it('collectChildren calls the readers of the node and no other member', () => {
		const child = leaf('a');
		expect(collectChildren(owner(child) as never)).toEqual([child]);
	});
});
