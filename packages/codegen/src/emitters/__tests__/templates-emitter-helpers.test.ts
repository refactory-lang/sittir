import { CHOICE, SEQ, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import { stringifyRule } from '../templates.ts';

describe('stringifyRule', () => {
	it('returns string rule values', () => {
		const rule: Rule = { type: STRING, value: 'fn' };
		expect(stringifyRule(rule)).toBe('fn');
	});

	it('recursively joins seq members', () => {
		const rule: Rule = {
			type: SEQ,
			members: [
				{ type: STRING, value: 'fn' },
				{
					type: SEQ,
					members: [
						{ type: STRING, value: ' ' },
						{ type: STRING, value: 'main' }
					]
				}
			]
		};
		expect(stringifyRule(rule)).toBe('fn main');
	});

	it('returns an empty string for unsupported rule types', () => {
		const rule: Rule = { type: CHOICE, members: [{ type: STRING, value: 'a' }] };
		expect(stringifyRule(rule)).toBe('');
	});
});
