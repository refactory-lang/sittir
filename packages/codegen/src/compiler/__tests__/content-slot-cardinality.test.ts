import { describe, expect, it } from 'vitest';
import { collectSlots } from '../collect-slots.ts';
import { isNonEmpty, isRequired } from '../model/node-map.ts';
import type { SimplifiedRule } from '../../types/rule.ts';

describe('repeat slot cardinality', () => {
	it.each(['content', 'clauses'])('preserves repeat1 for the %s field', (fieldName) => {
		const rule: SimplifiedRule = {
			type: 'CHOICE',
			fieldName,
			multiplicity: 'nonEmptyArray',
			nonterminal: true,
			members: [
				{ type: 'SYMBOL', name: 'for_in_clause', nonterminal: true },
				{ type: 'SYMBOL', name: 'if_clause', nonterminal: true }
			]
		};
		const slots = collectSlots(rule, 'comprehension_clauses');
		expect(slots).toHaveLength(1);
		expect(isRequired(slots[0]!)).toBe(true);
		expect(isNonEmpty(slots[0]!)).toBe(true);
		expect(slots[0]!.values.map((value) => value.multiplicity)).toEqual(['nonEmptyArray', 'nonEmptyArray']);
	});

	it('preserves zero-or-more content', () => {
		const rule: SimplifiedRule = {
			type: 'SYMBOL',
			name: 'item',
			fieldName: 'content',
			multiplicity: 'array',
			nonterminal: true
		};
		const slots = collectSlots(rule, 'module');
		expect(slots).toHaveLength(1);
		expect(isRequired(slots[0]!)).toBe(false);
		expect(isNonEmpty(slots[0]!)).toBe(false);
	});
});
