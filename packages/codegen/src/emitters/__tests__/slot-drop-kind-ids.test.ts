import { describe, expect, it } from 'vitest';
import { slotDropKindIds } from '../shared.ts';

const slot = (values: object[]) => ({ name: 'items', fieldName: undefined, values }) as never;
const list = (...values: object[]) => slot(values.map((value) => ({ multiplicity: 'array', ...value })));

describe('slotDropKindIds', () => {
	it('reads the separator ids from the stamps on the slot values, once each', () => {
		const items = list({ separator: ',', separatorKindId: 11 }, { separator: ',', separatorKindId: 11 }, { separator: ';', separatorKindId: 12 });
		expect(slotDropKindIds(items, undefined, false)).toEqual([11, 12]);
	});

	it('keeps to the elided values when asked for them', () => {
		const items = list({ separator: ',', separatorKindId: 11 }, { separator: ';', separatorKindId: 12, optionalElement: true });
		expect(slotDropKindIds(items, undefined, true)).toEqual([12]);
	});

	it('refuses a separator with no stamp, naming it', () => {
		expect(() => slotDropKindIds(list({ separator: ',' }), undefined, false)).toThrow(/separator "," has no stamped kind id/);
	});
});
