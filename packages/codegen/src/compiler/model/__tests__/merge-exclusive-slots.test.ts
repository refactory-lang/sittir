import { describe, expect, it } from 'vitest';
import { flatten } from '../../flatten.ts';
import { deriveSlots } from '../node-map.ts';
import { queryRoutesOf } from '../../../emitters/client-utils.ts';
import { makeNodeMapWith } from '../../../__tests__/helpers/node-map-fixtures.ts';
import { CHOICE, FIELD, OPTIONAL, SEQ, STRING, SYMBOL } from '../../../types/rule-types.ts';
import type { Rule, RuleId } from '../../../types/rule.ts';

const id = (path: string): RuleId => `rule:creation:${path}`;

describe('same-named slots of exclusive arms', () => {
	it('fold the copies a fanned-out seq leaves of its optional member into one slot', () => {
		const body: Rule<'link'> = {
			type: OPTIONAL,
			id: id('members.1/members.1'),
			content: { type: SYMBOL, name: 'class_body', id: id('members.1/members.1/content') }
		};
		const rule: Rule<'link'> = {
			type: SEQ,
			id: id('root'),
			members: [
				{ type: STRING, value: 'new' },
				{
					type: CHOICE,
					id: id('members.1'),
					members: [
						{ type: SEQ, id: id('members.1'), members: [{ type: STRING, value: '<>' }, body] },
						{ type: SEQ, id: id('members.1'), members: [{ type: STRING, value: '@' }, body] }
					]
				}
			]
		};
		const slots = deriveSlots(flatten(rule), { kindEntries: [] });
		expect(slots.map((slot) => slot.storageName)).toEqual(['class_body']);
		expect(slots[0]!.sourceRuleIds).toEqual([id('members.1/members.1'), id('members.1/members.1/content')]);
	});

	it('fold a fielded occurrence and a bare one under the field, read both tagged and untagged', () => {
		const rule: Rule<'link'> = {
			type: CHOICE,
			id: id('root'),
			members: [
				{
					type: SEQ,
					id: id('members.0'),
					members: [
						{ type: STRING, value: 'new' },
						{ type: FIELD, name: 'clause', id: id('members.0/members.1'), content: { type: SYMBOL, name: 'clause', id: id('members.0/members.1/content') } }
					]
				},
				{
					type: SEQ,
					id: id('members.1'),
					members: [
						{ type: STRING, value: '@' },
						{ type: SYMBOL, name: 'clause', id: id('members.1/members.1') }
					]
				}
			]
		};
		const slots = deriveSlots(flatten(rule), { kindEntries: [] });
		expect(slots.map((slot) => [slot.storageName, slot.isUnnamed])).toEqual([['clause', false]]);
		expect(queryRoutesOf(slots[0]!, makeNodeMapWith(new Map()))).toEqual({ fields: ['clause'], kinds: ['clause'] });
	});
});
