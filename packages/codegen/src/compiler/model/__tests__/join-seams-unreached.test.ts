import { describe, expect, it } from 'vitest';
import type { AnyRule } from '../../../types/rule.ts';
import { NO_JOINS, unreachedJoinSeams } from '../join-seams/index.ts';

describe('unreachedJoinSeams', () => {
	const joins = {
		...NO_JOINS,
		seamIds: new Map([
			['k:members.0', new Set(['rule:k:members.0', 'rule:helper:root'])],
			['k:members.1', new Set(['rule:k:members.1'])],
			['k:members.2', new Set(['rule:k:members.2'])]
		])
	};
	const rules: Record<string, AnyRule> = {
		k: {
			type: 'SEQ',
			id: 'rule:k:root',
			members: [{ type: 'STRING', value: '-', id: 'rule:other:root', absorbedIds: ['rule:helper:root'] }]
		}
	};

	it('names each armed seam no rule id, absorbed id or slot id reaches', () => {
		expect(unreachedJoinSeams(joins, rules, [{ sourceRuleIds: ['rule:k:members.2'] }])).toEqual(['k:members.1']);
	});

	describe('a seam inside a slot', () => {
		const inside = {
			...NO_JOINS,
			joinsPrevious: new Set(['rule:k:members.2', 'rule:k:members.2/content/members.1']),
			seamIds: new Map([['k:members.2/members.1', new Set(['rule:k:members.2/content/members.1'])]])
		};

		it('is held when the slot arms what the seam arms', () => {
			expect(unreachedJoinSeams(inside, rules, [{ sourceRuleIds: ['rule:k:members.2'] }])).toEqual([]);
		});

		it('is named when the slot does not', () => {
			expect(
				unreachedJoinSeams({ ...inside, joinsPrevious: new Set(['rule:k:members.2/content/members.1']) }, rules, [
					{ sourceRuleIds: ['rule:k:members.2'] }
				])
			).toEqual(['k:members.2/members.1']);
		});

		it('is named when it lies outside every slot', () => {
			const beside = {
				...inside,
				joinsPrevious: new Set(['rule:k:members.2', 'rule:k:members.20/content']),
				seamIds: new Map([['k:members.20', new Set(['rule:k:members.20/content'])]])
			};
			expect(unreachedJoinSeams(beside, rules, [{ sourceRuleIds: ['rule:k:members.2'] }])).toEqual(['k:members.20']);
		});
	});

	it('names none when nothing is armed', () => {
		expect(unreachedJoinSeams(NO_JOINS, rules, [])).toEqual([]);
	});
});
