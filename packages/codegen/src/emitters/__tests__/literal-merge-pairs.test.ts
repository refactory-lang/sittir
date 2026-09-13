import { describe, expect, it } from 'vitest';
import { literalMergePairs } from '../shared.ts';

const entries = [
	{ kind: 'dotdoteq', id: 1, anon: true, symbolName: '..=', literalText: '..=' },
	{ kind: 'unit_expression', id: 2, anon: false, symbolName: 'unit_expression', literalText: '()' }
];

describe('literalMergePairs', () => {
	it('derives pairs from literals that are parser tokens only', () => {
		const pairs = literalMergePairs(
			[
				{ text: '..=' },
				{ text: '()' }
			],
			entries
		);
		expect(pairs).toEqual([['.'.charCodeAt(0), '='.charCodeAt(0)]]);
	});

	it('yields nothing for a literal no parser token spells', () => {
		expect(literalMergePairs([{ text: '()' }], entries)).toEqual([]);
	});
});
