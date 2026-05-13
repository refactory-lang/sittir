import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledPattern,
	type AssembledNode
} from '../compiler/node-map.ts';
import type { SeqRule } from '../compiler/rule.ts';
import { emitWrap } from '../emitters/wrap.ts';
import { makeNodeMapWith } from './helpers/node-map-fixtures.ts';

function makeRequiredSingleChildNodeMap() {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'symbol', name: 'identifier' }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('single_parent', new AssembledBranch('single_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

function makeRequiredSingleFieldNodeMap() {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [{ type: 'field', name: 'value', content: { type: 'symbol', name: 'identifier' } }]
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('single_field_parent', new AssembledBranch('single_field_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

function makeRepeatFieldNodeMap() {
	const parentRule: SeqRule = {
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
	nodes.set('repeat_field_parent', new AssembledBranch('repeat_field_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

describe('wrap emitter slot arity', () => {
	it('normalizes named singular and repeated slots from grammar-derived cardinality', () => {
		const singularSource = emitWrap({ grammar: 'synth', nodeMap: makeRequiredSingleFieldNodeMap() });
		const repeatedSource = emitWrap({ grammar: 'synth', nodeMap: makeRepeatFieldNodeMap() });

		expect(singularSource).toContain('_value: normalizeSingularWrapSlot(data._value, "value", true),');
		expect(repeatedSource).toContain('_items: normalizeRepeatedWrapSlot(data._items, true, "items"),');
	});

	it('normalizes singular unnamed children through the singular slot path', () => {
		const source = emitWrap({ grammar: 'synth', nodeMap: makeRequiredSingleChildNodeMap() });

		expect(source).toContain('$children: normalizeSingularWrapSlot(');
		expect(source).toContain('children() { return drillIn<');
		expect(source).not.toContain('children() { return drillInAll<');
		expect(source).toContain('$with: { $child: (v: T.Identifier) => wrapSingleParent({ ...data, $children: v }, tree) },');
	});

	it('emits singular-mismatch guards for wrapped children', () => {
		const source = emitWrap({ grammar: 'synth', nodeMap: makeRequiredSingleChildNodeMap() });

		expect(source).toContain('function normalizeSingularWrapSlot<T>(');
		expect(source).toContain("throw new TypeError(`wrapNode: singular slot ${JSON.stringify(slotName)} received ${value.length} values`);");
	});
});
