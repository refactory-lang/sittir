import { describe, expect, it } from 'vitest';
import { droppedFields, fieldNamesOf } from '../../__tests__/helpers/reauthored-fields.ts';

const field = (name: string, extra: object = {}) => ({ type: 'FIELD', name, content: { type: 'SYMBOL', name: 'x' }, ...extra });
const keptOf = (rule: unknown) => {
	const out = { own: new Set<string>(), renamedFrom: new Set<string>() };
	fieldNamesOf(rule, out);
	return out;
};

describe('the reauthored-field guard', () => {
	it('counts a field kept when a field carries its upstream name', () => {
		const kept = keptOf({ type: 'SEQ', members: [field('item', { annotations: { renamedFrom: 'argument' } })] });
		expect(droppedFields(field('argument'), kept)).toEqual([]);
	});

	it('still reports a field that is gone with no stamp', () => {
		expect(droppedFields(field('argument'), keptOf(field('item')))).toEqual(['argument']);
	});

	it('does not accept a stamp naming a different upstream field', () => {
		const kept = keptOf(field('item', { annotations: { renamedFrom: 'other' } }));
		expect(droppedFields(field('argument'), kept)).toEqual(['argument']);
	});
});
