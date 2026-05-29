import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledPattern } from '../compiler/node-map.ts';
import type { AssembledNode } from '../compiler/node-map.ts';
import type { NodeMap } from '../compiler/types.ts';
import type { SeqRule } from '../compiler/rule.ts';
import { emitRenderModule } from '../emitters/render-module.ts';
import { makeNodeMapWith } from './helpers/node-map-fixtures.ts';

function makeRepeatedUnnamedChoiceNodeMap(): NodeMap {
	const parentRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'repeat1',
				content: {
					type: 'choice',
					members: [
						{ type: 'symbol', name: 'identifier' },
						{ type: 'symbol', name: 'integer' },
					],
				},
			},
		],
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('mixed_parent', new AssembledBranch('mixed_parent', parentRule, parentRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	nodes.set('integer', new AssembledPattern('integer', { type: 'pattern', value: '[0-9]+' }));
	return makeNodeMapWith(nodes);
}

function makeOptionalUnnamedHelperNodeMap(): NodeMap {
	const helperRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'field',
				name: 'value',
				content: { type: 'symbol', name: 'identifier' },
			},
			{ type: 'symbol', name: 'integer' },
		],
	};
	const parentRule: SeqRule = {
		type: 'seq',
		members: [
			{
				type: 'optional',
				content: { type: 'symbol', name: '_helper' },
			},
		],
	};
	const nodes = new Map<string, AssembledNode>();
	nodes.set('parent_helper', new AssembledBranch('parent_helper', parentRule, parentRule));
	nodes.set('_helper', new AssembledBranch('_helper', helperRule, helperRule));
	nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
	nodes.set('integer', new AssembledPattern('integer', { type: 'pattern', value: '[0-9]+' }));
	return makeNodeMapWith(nodes);
}

describe('render-module unnamed structural signals', () => {
	it('keeps unnamed repeated choice aliases wired to transport storage via isUnnamed', () => {
		const nodeMap = makeRepeatedUnnamedChoiceNodeMap();
		const parent = nodeMap.nodes.get('mixed_parent');
		expect(parent?.modelType).toBe('branch');
		if (!parent || parent.modelType !== 'branch') throw new Error('expected mixed_parent branch');
		(parent.fields[0] as unknown as { source: 'grammar' }).source = 'grammar';

		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'mixed_parent.jinja',
					content: '{# @generated #}\n{{ identifier | join(" ") }}',
				},
			],
			nodeMap
		).transportRs.contents;

		expect(emitted).toContain('pub content: Option<Vec<MixedParentContentTransportSlot>>,');
		expect(emitted).toContain('identifier: ListNonterminalView {');
		expect(emitted).toContain('items: content_buf.as_slice(),');
		expect(emitted).not.toContain('items: &[],');
	});

	it('skips hoisting unnamed helper internals even if their source drifts', () => {
		const nodeMap = makeOptionalUnnamedHelperNodeMap();
		const helper = nodeMap.nodes.get('_helper');
		expect(helper?.modelType).toBe('branch');
		if (!helper || helper.modelType !== 'branch') throw new Error('expected _helper branch');
		const innerUnnamed = helper.fields.find((slot) => slot.isUnnamed);
		expect(innerUnnamed).toBeDefined();
		(innerUnnamed! as unknown as { source: 'grammar' }).source = 'grammar';

		const emitted = emitRenderModule(
			'rust',
			[
				{
					filename: 'parent_helper.jinja',
					content: '{# @generated #}\n{{ value }}',
				},
			],
			nodeMap
		).transportRs.contents;

		const start = emitted.indexOf('pub struct ParentHelperTransport');
		const end = emitted.indexOf('}', start);
		const structBody = emitted.slice(start, end);
		expect(structBody).toContain('pub helper: Option<HelperTransport>,');
		expect(structBody).toContain('pub value: Option<IdentifierTransport>,');
		expect(structBody).not.toContain('pub integer: Option<IntegerTransport>,');
	});
});
