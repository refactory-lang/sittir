import { describe, expect, it } from 'vitest';
import { materialize, slotAccessorOf, type LoadedNodeModel } from '../validate/common.ts';
import { collectChildren } from '../exercise/walk.ts';

const LIST_ITEMS = Symbol('items');
const accessorOf = slotAccessorOf({ slotAccessors: { owner: { _body: 'body' }, leaf: {} }, listDefaults: {}, listSeparators: {} } as unknown as LoadedNodeModel, (id) => (id === 7 ? 'owner' : id === 3 ? 'leaf' : undefined));

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

describe('the tools walkers read a node through its model slots\' accessors', () => {
	it('materialize copies $ metadata and each model slot as its accessor reads it', () => {
		expect(materialize(owner(leaf('a')), accessorOf)).toEqual({
			$type: 7,
			
			$named: true,
			_body: { $type: 3, $named: true, $text: 'a' }
		});
	});

	it('collectChildren calls the model slots\' accessors and no other member', () => {
		const child = leaf('a');
		expect(collectChildren(owner(child) as never, accessorOf)).toEqual([child]);
	});

	it('copies a stored member the model has no slot for as data, and refuses a kind the model does not have', () => {
		expect(materialize({ ...owner(leaf('a')), _delimiter: 2 }, accessorOf)).toMatchObject({ _delimiter: 2 });
		expect(() => materialize({ ...owner(leaf('a')), $type: 9 }, accessorOf)).toThrow('kind id 9 is not in the node model');
	});

	it('refuses a slot whose model-named accessor the node does not have as a reader', () => {
		const { body: _body, ...withoutReader } = owner(leaf('a'));
		expect(() => materialize(withoutReader, accessorOf)).toThrow('owner stores _body, but has no reader body()');
	});
});
