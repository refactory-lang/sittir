import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledPattern,
	type AssembledNode
} from '../compiler/node-map.ts';
import type { SeqRule } from '../compiler/rule.ts';
import { buildFactoryMap } from '../emitters/factory-map.ts';
import { makeNodeMapWith } from './helpers/node-map-fixtures.ts';

function makeSlotArityNodeMap() {
	const singleChildRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'identifier' }]
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
	nodes.set('repeat_parent', new AssembledBranch('repeat_parent', repeatFieldRule, repeatFieldRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

describe('factory-map slot arity metadata', () => {
	it('emits named and unnamed slot metadata from assembled slot values', () => {
		const data = buildFactoryMap(makeSlotArityNodeMap());

		expect(data.factorySlots.single_parent.children).toEqual({
			unnamed: true,
			required: true,
			multiple: false,
			nonEmpty: false
		});
		expect(data.factorySlots.repeat_parent.items).toEqual({
			unnamed: false,
			required: true,
			multiple: true,
			nonEmpty: true
		});
	});
});
