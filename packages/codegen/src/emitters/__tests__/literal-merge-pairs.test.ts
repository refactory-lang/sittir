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
			entries,
			undefined
		);
		expect(pairs).toEqual([['.'.charCodeAt(0), '='.charCodeAt(0)]]);
	});

	it('yields nothing for a literal no parser token spells', () => {
		expect(literalMergePairs([{ text: '()' }], entries, undefined)).toEqual([]);
	});

	it('adds a same-char pair only when the doubled token can begin what follows the single one', () => {
		const rules = {
			unary: { type: 'SEQ', members: [{ type: 'STRING', value: '-' }, { type: 'SYMBOL', name: 'expr' }] },
			update: { type: 'SEQ', members: [{ type: 'STRING', value: '--' }, { type: 'SYMBOL', name: 'id' }] },
			generic: {
				type: 'SEQ',
				members: [{ type: 'STRING', value: '<' }, { type: 'SYMBOL', name: 'id' }, { type: 'STRING', value: '>' }]
			},
			shift: { type: 'SEQ', members: [{ type: 'SYMBOL', name: 'id' }, { type: 'STRING', value: '>>' }, { type: 'SYMBOL', name: 'id' }] },
			expr: { type: 'CHOICE', members: [{ type: 'SYMBOL', name: 'update' }, { type: 'SYMBOL', name: 'id' }] },
			id: { type: 'PATTERN', value: '[a-z]+' }
		} as unknown as Parameters<typeof literalMergePairs>[2];
		const tokens = [
			{ kind: 'minus', id: 3, anon: true, symbolName: '-', literalText: '-' },
			{ kind: 'minus_minus', id: 4, anon: true, symbolName: '--', literalText: '--' },
			{ kind: 'shr', id: 5, anon: true, symbolName: '>>', literalText: '>>' }
		];
		expect(literalMergePairs([{ text: '--' }, { text: '>>' }], tokens, rules)).toEqual([['-'.charCodeAt(0), '-'.charCodeAt(0)]]);
	});
});
