import { CHOICE, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import { deriveValuesForRule } from '../model/node-map.ts';
import type { Rule } from '../../types/rule.ts';

describe('deriveValuesForRule — arm facts on STRING/PATTERN arms', () => {
	it('a STRING arm annotated { default: true } yields a value with default: true', () => {
		const rule: Rule = { type: STRING, value: ';', annotations: { default: true } };
		const [v] = deriveValuesForRule(rule, undefined, 'single');
		expect(v).toMatchObject({ value: ';', default: true });
	});

	it('a literal member of an enum choice keeps its declared default', () => {
		const rule: Rule = {
			type: CHOICE,
			members: [
				{ type: STRING, value: 'type' },
				{ type: STRING, value: ';', annotations: { default: true } }
			]
		};
		const values = deriveValuesForRule(rule, undefined, 'single');
		expect(values.map((v) => [v.value, v.default])).toEqual([
			['type', undefined],
			[';', true]
		]);
	});

	it('a STRING arm with no annotations yields a value with no default fact', () => {
		const rule: Rule = { type: STRING, value: ';' };
		const [v] = deriveValuesForRule(rule, undefined, 'single');
		expect(v?.default).toBeUndefined();
	});
});
