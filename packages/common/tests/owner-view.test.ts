import { describe, expect, it } from 'vitest';
import { modelSlots, ownerView } from '../src/utils.ts';

const a = { $type: 1 };
const b = { $type: 2 };

describe('ownerView', () => {
	it('reads a stub list through the hydrator, so items the wrap routes from a parser key are counted', () => {
		const stub = { $type: 7, $parentHandle: 1, $childIndex: 0 };
		const hydrate = (list: object): unknown =>
			list === stub ? modelSlots({ $type: 7, _entry: [a, b] }, ['_item'], { _entry: '_item' }) : list;
		const view = ownerView(stub, '_item', hydrate);
		expect(view.stored).toEqual([a, b]);
		expect(view.list).toMatchObject({ $type: 7, _item: [a, b] });
	});

	it('leaves a stub unread without a hydrator', () => {
		expect(ownerView({ $type: 7, $parentHandle: 1, $childIndex: 0 }, '_item')).toEqual({ list: undefined, stored: undefined });
	});
});
