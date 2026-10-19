import { describe, expect, it } from 'vitest';
import { preference } from '../../dsl/primitives/preference.ts';
import { layoutSlots, renamedFromOf, slotModelOf } from '../index.ts';

const RECORD = {
	nodes: [
		{
			kind: 'binary',
			modelType: 'branch',
			slots: [
				{ name: 'left', required: true, values: [{ kind: 'node-ref', multiplicity: 'single', parseKind: 'expr' }] },
				{
					name: 'operator',
					required: true,
					values: [
						{ kind: 'terminal', multiplicity: 'single', value: '+' },
						{ kind: 'node-ref', multiplicity: 'single', name: 'minus', parseKind: 'dash' }
					]
				},
				{ name: 'argument', multiple: true, values: [{ kind: 'node-ref', multiplicity: 'array', parseKind: 'expr' }] }
			]
		},
		{ kind: 'call_expression', renamedFrom: 'call', subtypes: [] },
		{ kind: 'items', modelType: 'list', elementKinds: ['item'] }
	]
};

describe('slotModelOf', () => {
	it('reads each node\'s slots with their terminals, deriving what the record leaves out', () => {
		const model = slotModelOf(RECORD);
		expect(model.get('binary')?.slots).toEqual([
			{ name: 'left', propertyName: 'left', required: true, multiple: false, storage: 'verbatim', kinds: ['expr'], terminals: [] },
			{ name: 'operator', propertyName: 'operator', required: true, multiple: false, storage: 'verbatim', kinds: ['minus'], terminals: ['+'] },
			{ name: 'argument', propertyName: 'arguments', required: false, multiple: true, storage: 'verbatim', kinds: ['expr'], terminals: [] }
		]);
		expect(model.get('items')).toMatchObject({ modelType: 'list', elementKinds: ['item'], slots: [] });
		expect(model.get('call_expression')?.modelType).toBe('branch');
	});
});

describe('renamedFromOf', () => {
	it('maps each renamed kind to its base kind', () => {
		expect(renamedFromOf(RECORD)).toEqual({ call_expression: 'call' });
	});
});

describe('layoutSlots', () => {
	it('names the slots an options block addresses, by owner or any, and no slot by its name alone', () => {
		const options = {
			gap: { before: preference('space') },
			_labels: { '_/attributes:': 'gap/before', 'binary/operator:': 'gap/before', 'block/"{"/after': 'gap/before' }
		};
		expect(layoutSlots(options, new Set(['binary', 'block']))).toEqual([
			{ kind: null, slot: 'attributes' },
			{ kind: 'binary', slot: 'operator' }
		]);
	});
});
