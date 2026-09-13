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
import { flatten } from '../../compiler/flatten.ts';
import { clauseNodeMap, comparisonNodeMap, twoChoiceSlotsNodeMap } from './sub-factories.test.ts';

describe('node-model emitter', () => {
	it('serializes per-value parseKind without slot-level aliasSources', () => {
		const rule: SeqRule<'link'> = {
			type: SEQ,
			members: [{ type: FIELD, name: 'value', content: { type: SYMBOL, name: 'identifier' } }]
		};
		const nodes = new Map<string, AssembledNode>();
		const render = flatten(rule);
		nodes.set(
			'alias_host',
			new AssembledBranch('alias_host', render, render, {
				slots: Object.freeze([
					new AssembledNonterminal({
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
						hasTrailingDelimiter: false,
						hasLeadingDelimiter: false,
						sourceRuleIds: []
					})
				])
			})
		);
		nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
		const nodeMap = makeNodeMapWith(nodes);

		const model = buildNodeModel(nodeMap);
		const branch = model.nodes.find((node) => node.kind === 'alias_host');
		if (!branch || branch.modelType !== 'branch') throw new Error('expected alias_host branch');
		const field = branch.slots[0];
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

describe('seats', () => {
	it('serializes the seat of every hoisted slot value', () => {
		const model = buildNodeModel(twoChoiceSlotsNodeMap());
		const header = model.nodes.find((n) => n.kind === 'header')!;
		const content = (header as { slots: { name: string; values: { seat?: unknown }[] }[] }).slots.find((s) => s.name === 'content')!;
		expect(content.values.map((v) => v.seat)).toEqual([
			{ kind: '_header_lhs', shape: 'arm', mount: 'lhs' },
			{ kind: '_header_kind', shape: 'arm', mount: 'kind' }
		]);
		const clause = buildNodeModel(clauseNodeMap()).nodes.find((n) => n.kind === 'clause')! as {
			slots: { values: { seat?: unknown }[] }[];
		};
		expect(clause.slots.flatMap((s) => s.values).find((v) => v.seat)?.seat).toEqual({
			kind: '_clause_group',
			shape: 'splice'
		});
		const comparison = buildNodeModel(comparisonNodeMap()).nodes.find((n) => n.kind === 'comparison')! as {
			slots: { name: string; values: { seat?: unknown }[] }[];
		};
		expect(comparison.slots.find((s) => s.name === 'comparators')!.values[0]!.seat).toEqual({
			kind: '_comparison_comparator',
			shape: 'elements'
		});
	});
});
