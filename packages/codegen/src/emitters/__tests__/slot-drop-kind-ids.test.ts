import { describe, expect, it } from 'vitest';
import { AbstractAssembledCompound, extractSeparatorKindId } from '../../compiler/model/node-map.ts';
import { fieldTaggedLiterals, slotDropKindIds } from '../shared.ts';

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

describe('the stamps a separator and a field-tagged literal carry', () => {
	const string = (stamp: { aliasedToId?: number; resolvedKindId?: number }) => ({ type: 'STRING', value: ',', ...stamp });

	it('takes an aliased separator\'s public symbol before the underlying one', () => {
		expect(extractSeparatorKindId({ value: string({ aliasedToId: 70, resolvedKindId: 11 }) } as never)).toBe(70);
		expect(extractSeparatorKindId({ value: string({ resolvedKindId: 11 }) } as never)).toBe(11);
		expect(extractSeparatorKindId({ value: string({}) } as never)).toBeUndefined();
	});

	it('keeps two stamped symbols of one spelling under a field', () => {
		const owner = {
			lexedInterior: false,
			renderRule: {
				type: 'FIELD',
				fieldName: 'right',
				members: [string({ resolvedKindId: 11 }), string({ resolvedKindId: 12 })]
			}
		};
		Object.setPrototypeOf(owner, AbstractAssembledCompound.prototype);
		const wrapped = { ...owner, renderRule: { type: 'SEQ', fieldName: 'right', members: owner.renderRule.members } };
		Object.setPrototypeOf(wrapped, AbstractAssembledCompound.prototype);
		expect(fieldTaggedLiterals(wrapped as never).get('right')).toEqual([
			{ text: ',', kindId: 11 },
			{ text: ',', kindId: 12 }
		]);
		const items = { name: 'right', fieldName: 'right', values: [] } as never;
		expect(slotDropKindIds(items, wrapped as never, false)).toEqual([11, 12]);
	});
});
