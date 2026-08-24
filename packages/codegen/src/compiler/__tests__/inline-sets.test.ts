import { describe, expect, it } from 'vitest';
import { danglingInlineNames } from '../inline-sets.ts';

const rule = { type: 'STRING', value: 'x' } as const;

describe('danglingInlineNames', () => {
	it('reports every inline name absent from the rule bag, not just the first', () => {
		// tree-sitter's own generate step warns about exactly one undefined
		// inline rule per run — the assertion exists to surface the WHOLE
		// class at once.
		const parsed = {
			inline: ['_a', '_dead1', '_b', '_dead2', '_dead3'],
			rules: { _a: rule, _b: rule }
		};
		expect(danglingInlineNames(parsed)).toEqual(['_dead1', '_dead2', '_dead3']);
	});

	it('is empty when every inline name resolves', () => {
		expect(danglingInlineNames({ inline: ['_a'], rules: { _a: rule } })).toEqual([]);
	});

	it('tolerates absent inline and rules fields', () => {
		expect(danglingInlineNames({})).toEqual([]);
		expect(danglingInlineNames({ inline: ['_a'] })).toEqual(['_a']);
		expect(danglingInlineNames({ rules: { _a: rule } })).toEqual([]);
	});
});
