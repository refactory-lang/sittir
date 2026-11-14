import { beforeAll, describe, expect, it } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';
import { absorbAlignedIds, absorbDroppedIds } from '../../dsl/rule-attrs.ts';
import { attributeBuilder } from '../../dsl/builders.ts';
import { compileGrammar } from '../compile.ts';
import { flatten } from '../flatten.ts';
import { grammarPackage } from '../../grammars.ts';
import type { AnyRule, Rule, RuleId } from '../../types/rule.ts';

function idsWithin(rule: unknown, out = new Set<RuleId>()): Set<RuleId> {
	if (rule === null || typeof rule !== 'object') return out;
	if (Array.isArray(rule)) {
		for (const item of rule) idsWithin(item, out);
		return out;
	}
	const node = rule as { id?: RuleId; absorbedIds?: readonly RuleId[] };
	if (node.id !== undefined) out.add(node.id);
	for (const id of node.absorbedIds ?? []) out.add(id);
	for (const [key, value] of Object.entries(rule)) if (key !== 'id' && key !== 'absorbedIds') idsWithin(value, out);
	return out;
}

describe('absorbing rule ids', () => {
	it('absorbAlignedIds gives each node of the host the ids of the same node in the others', () => {
		const arm = (n: string): AnyRule => ({
			type: 'SEQ',
			id: `rule:k:arm${n}`,
			members: [
				{ type: 'STRING', value: '(', id: `rule:k:open${n}` },
				{
					type: 'FIELD',
					name: 'f',
					id: `rule:k:field${n}`,
					content: { type: 'SYMBOL', name: 'x', id: `rule:k:symbol${n}` }
				}
			]
		});
		const merged = absorbAlignedIds(arm('0'), arm('1')) as {
			absorbedIds?: RuleId[];
			members: { absorbedIds?: RuleId[]; content?: { absorbedIds?: RuleId[] } }[];
		};
		expect(merged.absorbedIds).toEqual(['rule:k:arm1']);
		expect(merged.members[0]!.absorbedIds).toEqual(['rule:k:open1']);
		expect(merged.members[1]!.absorbedIds).toEqual(['rule:k:field1']);
		expect(merged.members[1]!.content!.absorbedIds).toEqual(['rule:k:symbol1']);
	});

	it('absorbDroppedIds keeps on the result every input id the result no longer holds', () => {
		const element: AnyRule = { type: 'SYMBOL', name: 'x', id: 'rule:k:element' };
		const input: AnyRule = {
			type: 'REPEAT',
			id: 'rule:k:repeat',
			content: {
				type: 'SEQ',
				id: 'rule:k:pair',
				members: [{ type: 'STRING', value: ',', id: 'rule:k:comma' }, element]
			}
		};
		const lifted = absorbDroppedIds(
			{
				type: 'REPEAT',
				id: 'rule:k:repeat',
				content: element,
				separator: { value: { type: 'STRING', value: ',', id: 'rule:k:comma' } }
			} as AnyRule,
			input
		);
		expect(lifted.absorbedIds).toEqual(['rule:k:pair']);
	});

	it('flattening a wrapper keeps the survivor id and the ids the wrapper had absorbed', () => {
		const rule: Rule<'link'> = {
			type: 'FIELD',
			name: 'f',
			id: 'rule:k:field',
			content: {
				type: 'OPTIONAL',
				id: 'rule:k:optional',
				absorbedIds: ['rule:k:earlier'],
				content: { type: 'SYMBOL', name: 'x', id: 'rule:k:symbol' }
			}
		};
		const flat = flatten(rule);
		expect(flat.id).toBe('rule:k:field');
		expect([...idsWithin(flat)].sort()).toEqual(['rule:k:earlier', 'rule:k:field', 'rule:k:optional', 'rule:k:symbol']);
	});

	it('splicing a nested sequence keeps its id on its first member', () => {
		const built = attributeBuilder.seq(
			{ type: 'STRING', value: '(', id: 'rule:k:open' },
			{
				type: 'SEQ',
				id: 'rule:k:inner',
				members: [
					{ type: 'SYMBOL', name: 'x', id: 'rule:k:x' },
					{ type: 'SYMBOL', name: 'y', id: 'rule:k:y' }
				]
			}
		) as { members: AnyRule[] };
		expect(built.members.map((member) => member.id)).toEqual(['rule:k:open', 'rule:k:x', 'rule:k:y']);
		expect(built.members[1]!.absorbedIds).toEqual(['rule:k:inner']);
	});
});

describe('rust rule ids survive normalize', () => {
	let reached: ReadonlySet<RuleId>;

	beforeAll(async () => {
		const { nodeMap } = await compileGrammar({ package: grammarPackage('rust') });
		const ids = idsWithin(nodeMap.normalizedRules);
		for (const node of nodeMap.nodes.values())
			for (const slot of node.slots ?? []) for (const id of slot.sourceRuleIds ?? []) ids.add(id);
		reached = ids;
	}, FULL_PIPELINE_TIMEOUT);

	it.each([
		['the first element of a separated list', 'rule:trait_bounds:members.1/members.0'],
		['an arm member that factoring shares with the first arm', 'rule:binary_expression:members.2/members.2'],
		['a literal minted into its catalog kind', 'rule:range_expression_binary:members.1/content/members.0'],
		['a list item under a collapsed field', 'rule:token_tree_paren:members.1/content/content'],
		['a reference a hidden body is spliced over', 'rule:closure_parameters:members.1/content'],
		['a spliced body under a collapsed optional', 'rule:let_declaration:members.4/content'],
		['a choice fanned out over its sequence', 'rule:range_pattern_with_left:members.1']
	])('%s keeps its id (%s)', (_what, id) => {
		expect(reached.has(id)).toBe(true);
	});
});
