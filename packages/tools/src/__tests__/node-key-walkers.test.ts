import { describe, expect, it } from 'vitest';
import { materialize, type SlotReaders } from '../validate/common.ts';
import { collectChildren } from '../exercise/walk.ts';

const LIST_ITEMS = Symbol('items');

const leaf = (text: string) => ({
	$type: 3,
	
	$named: true,
	$text: text,
	$render: () => text,
	$trivia: { leading: () => [], trailing: () => [] },
	$engine: undefined
});

const owner = (child: ReturnType<typeof leaf>) => ({
	$type: 7,
	
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

const readers: SlotReaders = (typeId) => (typeId === 7 ? [{ storageKey: '_body', accessor: 'body' }] : []);

describe('the tools walkers read a node through its model slots\' accessors', () => {
	it('materialize copies $ metadata and each model slot as its accessor reads it', () => {
		expect(materialize(owner(leaf('a')), readers)).toEqual({
			$type: 7,
			
			$named: true,
			_body: { $type: 3, $named: true, $text: 'a' }
		});
	});

	it('collectChildren calls the model slots\' accessors and no other member', () => {
		const child = leaf('a');
		expect(collectChildren(owner(child) as never, readers)).toEqual([child]);
	});
});
