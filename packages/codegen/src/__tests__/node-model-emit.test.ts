import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledNonterminal, AssembledPattern, type AssembledNode } from '../compiler/node-map.ts';
import type { SeqRule } from '../compiler/rule.ts';
import { buildNodeModel, emitNodeModel } from '../emitters/node-model.ts';
import { makeNodeMapWith } from './helpers/node-map-fixtures.ts';

describe('node-model emitter', () => {
	it('serializes per-value parseKind without slot-level aliasSources', () => {
		const rule: SeqRule = {
			type: 'seq',
			members: [{ type: 'field', name: 'value', content: { type: 'symbol', name: 'identifier' } }]
		};
		const nodes = new Map<string, AssembledNode>();
		nodes.set(
			'alias_host',
			new AssembledBranch('alias_host', rule, rule, rule, {
				slotRecord: Object.freeze({
					value: new AssembledNonterminal({
						fieldName: 'value',
						values: [
							{
								kind: 'node-ref',
								node: { kind: 'unresolved-ref', name: 'identifier' },
								parseKind: { kind: 'unresolved-ref', name: 'decorator' },
								multiplicity: 'single'
							}
						],
						hasTrailing: false,
						hasLeading: false,
						source: 'grammar',
						sourceRuleIds: []
					})
				})
			})
		);
		nodes.set('identifier', new AssembledPattern('identifier', { type: 'pattern', value: '[a-z]+' }));
		const nodeMap = makeNodeMapWith(nodes);

		const model = buildNodeModel(nodeMap);
		const branch = model.nodes.find((node) => node.kind === 'alias_host');
		if (!branch || branch.modelType !== 'branch') throw new Error('expected alias_host branch');
		const field = branch.fields[0];
		const value = field?.values[0];

		expect(field).toBeDefined();
		expect(field).not.toHaveProperty('aliasSources');
		expect(value).toMatchObject({ kind: 'node-ref', name: 'identifier', parseKind: 'decorator' });

		const serialized = emitNodeModel({ grammar: 'synth', nodeMap });
		expect(serialized).toContain('"parseKind": "decorator"');
		expect(serialized).not.toContain('aliasSources');
	});
});
