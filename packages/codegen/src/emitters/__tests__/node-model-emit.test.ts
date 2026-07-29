import { FIELD, PATTERN, SEQ, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledNonterminal,
	AssembledPattern,
	type AssembledNode
} from '../../compiler/model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { buildNodeModel, emitNodeModel } from '../node-model.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { deleteWrapper } from '../../compiler/wrapper-deletion.ts';

describe('node-model emitter', () => {
	it('serializes per-value parseKind without slot-level aliasSources', () => {
		const rule: SeqRule<'link'> = {
			type: SEQ,
			members: [{ type: FIELD, name: 'value', content: { type: SYMBOL, name: 'identifier' } }]
		};
		const nodes = new Map<string, AssembledNode>();
		nodes.set(
			'alias_host',
			new AssembledBranch('alias_host', rule, deleteWrapper(rule), deleteWrapper(rule), {
				slotRecord: Object.freeze({
					value: new AssembledNonterminal({
						fieldName: 'value',
						values: [
							{
								node: { kind: 'unresolved-ref', name: 'identifier' },
								// PR-K2: in-memory kind-id stamps must NEVER reach
								// node-model.json5 — names stay the identity on disk
								// (KindId-NodeRefs design §2.4; python regen renumbers
								// parser ids, so serialized ids would be regen noise).
								storageKindId: 42,
								parseKind: { kind: 'unresolved-ref', name: 'decorator' },
								parseKindId: 7,
								multiplicity: 'single'
							}
						],
						hasTrailing: false,
						hasLeading: false,
						sourceRuleIds: []
					})
				})
			})
		);
		nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
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
		// PR-K2 serialization shape: id stamps are in-memory facts only.
		expect(serialized).not.toContain('storageKindId');
		expect(serialized).not.toContain('parseKindId');
		expect(serialized).not.toContain('resolvedKindId');
	});
});
