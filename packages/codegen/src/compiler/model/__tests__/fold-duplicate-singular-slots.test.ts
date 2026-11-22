import { describe, expect, it } from 'vitest';
import { flatten } from '../../flatten.ts';
import { AssembledBranch } from '../node-map.ts';
import { withGeneratedIdTablesNode } from '../../../__tests__/helpers/node-map-fixtures.ts';
import { ALIAS, OPTIONAL, REPEAT, SEQ, STRING, SYMBOL } from '../../../types/rule-types.ts';
import type { Rule, RuleId } from '../../../types/rule.ts';

const id = (path: string): RuleId => `rule:holder:${path}`;

const slotsOf = (rule: Rule<'link'>) => {
	const flat = flatten(rule);
	return withGeneratedIdTablesNode((kindEntries) => new AssembledBranch('holder', flat, flat, { kindEntries })).slots;
};

describe('a singular unnamed slot beside a repeated slot covering its parse kinds', () => {
	it('folds into the repeated slot of the same name and leaves its rule ids there', () => {
		const slots = slotsOf({
			type: SEQ,
			id: id('root'),
			members: [
				{ type: SYMBOL, name: 'expression', id: id('members.0') },
				{ type: STRING, value: ',' },
				{ type: REPEAT, id: id('members.2'), content: { type: SYMBOL, name: 'expression', id: id('members.2/content') } }
			]
		});
		const named = slots.filter((slot) => slot.name === 'expression');
		expect(named).toHaveLength(1);
		expect(named[0]!.arity).toBe('many');
		expect(named[0]!.sourceRuleIds).toEqual(expect.arrayContaining([id('members.0'), id('members.2/content')]));
	});

	it('stays its own slot when the repeated slot has another name', () => {
		const slots = slotsOf({
			type: SEQ,
			id: id('root'),
			members: [
				{ type: REPEAT, id: id('members.0'), content: { type: SYMBOL, name: 'match_arm', id: id('members.0/content') } },
				{
					type: OPTIONAL,
					id: id('members.1'),
					content: {
						type: ALIAS,
						id: id('members.1/content'),
						named: true,
						value: 'match_arm',
						content: { type: SYMBOL, name: 'last_match_arm', id: id('members.1/content/content') }
					}
				}
			]
		});
		expect(slots.map((slot) => slot.name).sort()).toEqual(['last_match_arm', 'match_arm']);
	});
});
