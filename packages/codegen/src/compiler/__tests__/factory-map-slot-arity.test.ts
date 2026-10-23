import { CHOICE, FIELD, OPTIONAL, PATTERN, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledPattern, type AssembledNode } from '../model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { buildFactoryMap } from '../../emitters/factory-map.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import type { FactorySlotMeta } from '../../emitters/factory-map.ts';
import { flatten } from '../flatten.ts';

function makeSlotArityNodeMap() {
	const singleChildRule: SeqRule<'link'> = {
		type: SEQ,
		members: [{ type: SYMBOL, name: 'identifier' }]
	};
	const multiSingularChildRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{ type: SYMBOL, name: 'identifier' },
			{ type: SYMBOL, name: 'number_literal' }
		]
	};
	const repeatFieldRule: SeqRule<'link'> = {
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
	const optionalThenRequiredChildRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: OPTIONAL,
				content: { type: SYMBOL, name: 'identifier' }
			},
			{ type: SYMBOL, name: 'number_literal' }
		]
	};
	const multiSiblingFieldRule: SeqRule<'link'> = {
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
	const singleChildRender = flatten(singleChildRule);
	nodes.set('single_parent', new AssembledBranch('single_parent', singleChildRender, singleChildRender));
	const multiSingularChildRender = flatten(multiSingularChildRule);
	nodes.set('multi_parent', new AssembledBranch('multi_parent', multiSingularChildRender, multiSingularChildRender));
	const repeatFieldRender = flatten(repeatFieldRule);
	nodes.set('repeat_parent', new AssembledBranch('repeat_parent', repeatFieldRender, repeatFieldRender));
	const optionalThenRequiredChildRender = flatten(optionalThenRequiredChildRule);
	nodes.set(
		'optional_then_required_parent',
		new AssembledBranch(
			'optional_then_required_parent',
			optionalThenRequiredChildRender,
			optionalThenRequiredChildRender
		)
	);
	const multiSiblingFieldRender = flatten(multiSiblingFieldRule);
	nodes.set(
		'ambient_like_parent',
		new AssembledBranch('ambient_like_parent', multiSiblingFieldRender, multiSiblingFieldRender)
	);
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
	it('emits each slot\'s arity metadata from its assembled values', () => {
		// Each positional child gets its own kind-named slot with its own
		// required/multiple facts: `optional_then_required_parent` records
		// `identifier` as optional and `number_literal` as required.
		const data = buildFactoryMap(makeSlotArityNodeMap());

		expect(expectFactorySlot(data, 'single_parent', 'identifier')).toEqual({
			propertyName: 'identifier',
			required: true,
			multiple: false,
			nonEmpty: false
		});
		expect(expectFactorySlot(data, 'multi_parent', 'identifier')).toEqual({
			propertyName: 'identifier',
			required: true,
			multiple: false,
			nonEmpty: false
		});
		expect(expectFactorySlot(data, 'multi_parent', 'number_literal')).toEqual({
			propertyName: 'numberLiteral',
			required: true,
			multiple: false,
			nonEmpty: false
		});
		expect(expectFactorySlot(data, 'repeat_parent', 'items')).toEqual({
			propertyName: 'items',
			required: true,
			multiple: true,
			nonEmpty: true
		});
		expect(expectFactorySlot(data, 'optional_then_required_parent', 'identifier')).toEqual({
			propertyName: 'identifier',
			required: false,
			multiple: false,
			nonEmpty: false
		});
		expect(expectFactorySlot(data, 'optional_then_required_parent', 'number_literal')).toEqual({
			propertyName: 'numberLiteral',
			required: true,
			multiple: false,
			nonEmpty: false
		});
		// declaration is a singular field occurrence (FIELD(choice(...)));
		// the old `multiple: true, nonEmpty: true` expectation reflected a
		// pre-unification cardinality derivation that treated a
		// choice-with-seq-arm as multi. The slot occurs exactly once.
		expect(expectFactorySlot(data, 'ambient_like_parent', 'declaration')).toEqual({
			propertyName: 'declaration',
			required: true,
			multiple: false,
			nonEmpty: false
		});
	});
});
