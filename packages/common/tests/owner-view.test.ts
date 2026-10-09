import { describe, expect, it } from 'vitest';
import { ownerView } from '../src/utils.ts';

const a = { $type: 1 };
const b = { $type: 2 };
const coordinate = { $type: 7, $treeHandle: 1, $span: { start: 0, end: 3 } };

describe('ownerView', () => {
	it('reads a list past the read\'s depth through the hydrator, so its items are counted', () => {
		const hydrate = (list: object): unknown => (list === coordinate ? { $type: 7, _item: [a, b] } : list);
		const view = ownerView(coordinate, '_item', hydrate);
		expect(view.stored).toEqual([a, b]);
		expect(view.list).toMatchObject({ $type: 7, _item: [a, b] });
	});

	it('leaves a coordinate unread without a hydrator', () => {
		expect(ownerView(coordinate, '_item')).toEqual({ list: undefined, stored: undefined });
	});
});
