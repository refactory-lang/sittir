import { describe, expect, it } from 'vitest';
import { fieldWrapIssue } from '../bind.ts';

const grammarOf = (inline: readonly string[]) => ({
	rules: {
		owner: { type: 'SEQ', members: [{ type: 'STRING', value: 'x' }, { type: 'SYMBOL', name: 'inner' }] },
		inner: {
			type: 'SEQ',
			members: [
				{ type: 'STRING', value: ':' },
				{ type: 'FIELD', name: 'items', content: { type: 'SYMBOL', name: 'leaf' } }
			]
		},
		leaf: { type: 'PATTERN', value: '[a-z]+' }
	},
	inline: inline.map((name) => ({ type: 'SYMBOL', name }))
});

describe('fieldWrapIssue', () => {
	const wrap = { owner: 'owner', field: 'wrapped', target: { symbol: 'inner' } } as const;

	it('refuses a wrap around an inlined child whose body already fields its parts', () => {
		expect(fieldWrapIssue(grammarOf(['inner']), wrap)).toMatch(/inlined and its body already fields its parts/);
	});

	it('wraps the same child when the grammar keeps it as a node', () => {
		expect(fieldWrapIssue(grammarOf([]), wrap)).toBeUndefined();
	});
});
