import { describe, expect, it } from 'vitest';
import { STORED_TRIVIA, toTransportData } from '../src/transport-data.ts';
import { isDataKey, isEmptyNode, isNode } from '../src/utils.ts';

const LIST_ITEMS = Symbol('items');

const newShapeList = () => {
	const items = ['a', 'b'];
	return {
		$type: 7,
		$source: 2,
		$named: true,
		_elements: items,
		$with: { elements: () => undefined },
		elements: () => items,
		length: 2,
		0: 'a',
		1: 'b',
		delimiter: 0,
		map: () => [],
		at: () => undefined,
		[LIST_ITEMS]: items,
		$render: () => 'x',
		$trivia: { leading: () => [], trailing: () => [] },
		$engine: undefined
	};
};

describe('a node is selected by key', () => {
	it('names storage and $ metadata as data, and members as not', () => {
		for (const key of ['_elements', '$other', '$type', '$source', '$named', '$text', '$span', '$handle', '$_trivia', '$format']) {
			expect(isDataKey(key)).toBe(true);
		}
		for (const key of ['$with', '$trivia', '$engine', '$render', 'elements', 'length', '0', 'delimiter', 'map']) {
			expect(isDataKey(key)).toBe(false);
		}
	});

	it('toTransportData copies storage and $ metadata and nothing else', () => {
		expect(toTransportData(newShapeList() as never, STORED_TRIVIA)).toEqual({ $type: 7, $source: 2, $named: true, _elements: ['a', 'b'] });
	});

	it('reads only the keys it selects, so a getter that throws is never called', () => {
		const owner = newShapeList();
		Object.defineProperty(owner, 'length', {
			get() {
				throw new Error('read stub');
			},
			enumerable: true
		});
		expect(() => toTransportData(owner as never, STORED_TRIVIA)).not.toThrow();
	});

	it('isEmptyNode and isNode agree for a node with every member enumerable', () => {
		expect(isNode(newShapeList())).toBe(true);
		expect(isEmptyNode({ ...newShapeList(), _elements: [] } as never)).toBe(true);
		expect(isEmptyNode(newShapeList() as never)).toBe(false);
	});
});
