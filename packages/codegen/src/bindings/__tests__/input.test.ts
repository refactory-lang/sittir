import { describe, expect, it } from 'vitest';
import { preference } from '../../dsl/primitives/preference.ts';
import { layoutSlots, renamedFromOf, slotModelOf } from '../index.ts';

const RECORD = {
	nodes: [
		{
			kind: 'binary',
			modelType: 'branch',
			slots: [
				{ name: 'left', propertyName: 'left', required: true, kinds: ['expr'] },
				{
					name: 'operator',
					propertyName: 'operator',
					required: true,
					values: [
						{ kind: 'terminal', value: '+' },
						{ kind: 'node-ref', name: 'minus' }
					]
				}
			]
		},
		{ kind: 'call_expression', renamedFrom: 'call', subtypes: [] },
		{ kind: 'items', modelType: 'list', elementKinds: ['item'] }
	]
};

describe('slotModelOf', () => {
	it('reads each node\'s slots with their terminals, defaulting what the record leaves out', () => {
		const model = slotModelOf(RECORD);
		expect(model.get('binary')?.slots).toEqual([
			{ name: 'left', propertyName: 'left', required: true, multiple: false, storage: 'verbatim', kinds: ['expr'], terminals: [] },
			{ name: 'operator', propertyName: 'operator', required: true, multiple: false, storage: 'verbatim', kinds: [], terminals: ['+'] }
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
	it('names the slots an options block addresses, by owner or any, and the separator', () => {
		const options = {
			gap: { before: preference('space') },
			_labels: { '_/attributes:': 'gap/before', 'binary/operator:': 'gap/before', 'block/"{"/after': 'gap/before' }
		};
		expect(layoutSlots(options, new Set(['binary', 'block']))).toEqual([
			{ kind: null, slot: 'attributes' },
			{ kind: 'binary', slot: 'operator' },
			{ kind: null, slot: 'separator' }
		]);
	});
});
