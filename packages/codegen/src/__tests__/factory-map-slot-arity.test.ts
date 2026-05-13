import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledPattern,
	type AssembledNode
} from '../compiler/node-map.ts';
import type { SeqRule } from '../compiler/rule.ts';
import { buildFactoryMap } from '../emitters/factory-map.ts';
import { makeNodeMapWith } from './helpers/node-map-fixtures.ts';
import type { FactorySlotMeta } from '../emitters/factory-map.ts';

function makeSlotArityNodeMap() {
	const singleChildRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'identifier' }]
	};
	const multiSingularChildRule: SeqRule = {
		type: 'seq',
		members: [
			{ type: 'symbol', name: 'identifier' },
			{ type: 'symbol', name: 'number_literal' }
		]
	};
	const repeatFieldRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'field',
				name: 'items',
				content: {
					type: 'repeat1',
					content: { type: 'symbol', name: 'identifier' }
				}
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('single_parent', new AssembledBranch('single_parent', singleChildRule, singleChildRule));
	nodes.set('multi_parent', new AssembledBranch('multi_parent', multiSingularChildRule, multiSingularChildRule));
	nodes.set('repeat_parent', new AssembledBranch('repeat_parent', repeatFieldRule, repeatFieldRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	nodes.set('number_literal', new AssembledPattern('number_literal', { type: 'pattern', value: '[0-9]+' }));
	return makeNodeMapWith(nodes);
}

function expectFactorySlot(
	data: ReturnType<typeof buildFactoryMap>,
	kind: string,
	slotName: string
): FactorySlotMeta {
	const slots = data.factorySlots[kind];
	expect(slots).toBeDefined();
	if (!slots) {
		throw new Error(`Missing factorySlots entry for ${kind}`);
	}
	const slot = slots[slotName];
	expect(slot).toBeDefined();
	if (!slot) {
		throw new Error(`Missing factorySlots entry for ${kind}.${slotName}`);
	}
	return slot;
}

describe('factory-map slot arity metadata', () => {
	it('emits named and unnamed slot metadata from assembled slot values', () => {
		const data = buildFactoryMap(makeSlotArityNodeMap());

		expect(expectFactorySlot(data, 'single_parent', 'children')).toEqual({
			unnamed: true,
			slotCount: 1,
			required: true,
			multiple: false,
			nonEmpty: false
		});
		expect(expectFactorySlot(data, 'multi_parent', 'children')).toEqual({
			unnamed: true,
			slotCount: 2,
			required: true,
			multiple: false,
			nonEmpty: false
		});
		expect(expectFactorySlot(data, 'repeat_parent', 'items')).toEqual({
			unnamed: false,
			slotCount: 1,
			required: true,
			multiple: true,
			nonEmpty: true
		});
	});
});
