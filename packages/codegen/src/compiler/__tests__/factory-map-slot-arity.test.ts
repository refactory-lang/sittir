import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledPattern, type AssembledNode } from '../model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { buildFactoryMap } from '../../emitters/factory-map.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import type { FactorySlotMeta } from '../../emitters/factory-map.ts';

function makeSlotArityNodeMap() {
	const singleChildRule: SeqRule = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const multiSingularChildRule: SeqRule = {
		type: SEQ,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'number_literal' }
		]
	};
	const repeatFieldRule: SeqRule = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'items',
				content: {
					type: REPEAT1,
					content: { type: SYMBOL, name: 'identifier' }
				}
			}
		]
	};
	const optionalThenRequiredChildRule: SeqRule = {
		type: SEQ,
		members: [
			{
				type: OPTIONAL,
				content: { type: SYMBOL, name: 'identifier' }
			},
			{ type: SYMBOL, name: 'number_literal' }
		]
	};
	const multiSiblingFieldRule: SeqRule = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'declaration',
				content: {
					type: CHOICE,
					members: [
						{ type: SYMBOL, name: 'identifier' },
						{
							type: SEQ,
							members: [
								{ type: STRING, value: 'module' },
								{ type: SYMBOL, name: 'property_identifier' },
								{ type: STRING, value: ':' },
								{ type: SYMBOL, name: 'object_type' }
							]
						}
					]
				}
			}
		]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('single_parent', new AssembledBranch('single_parent', singleChildRule, singleChildRule));
	nodes.set('multi_parent', new AssembledBranch('multi_parent', multiSingularChildRule, multiSingularChildRule));
	nodes.set('repeat_parent', new AssembledBranch('repeat_parent', repeatFieldRule, repeatFieldRule));
	nodes.set(
		'optional_then_required_parent',
		new AssembledBranch('optional_then_required_parent', optionalThenRequiredChildRule, optionalThenRequiredChildRule)
	);
	nodes.set('ambient_like_parent', new AssembledBranch('ambient_like_parent', multiSiblingFieldRule, multiSiblingFieldRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('number_literal', new AssembledPattern('number_literal', { type: PATTERN, value: '[0-9]+' }));
	nodes.set('property_identifier', new AssembledPattern('property_identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('object_type', new AssembledPattern('object_type', { type: PATTERN, value: '\\{\\}' }));
	return makeNodeMapWith(nodes);
}

function expectFactorySlot(data: ReturnType<typeof buildFactoryMap>, kind: string, slotName: string): FactorySlotMeta {
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
		expect(expectFactorySlot(data, 'optional_then_required_parent', 'children')).toEqual({
			unnamed: true,
			slotCount: 2,
			required: true,
			multiple: false,
			nonEmpty: false
		});
		expect(expectFactorySlot(data, 'ambient_like_parent', 'declaration')).toEqual({
			unnamed: false,
			slotCount: 1,
			required: true,
			multiple: true,
			nonEmpty: true
		});
	});
});
