import { describe, expect, it } from 'vitest';
import { collectFixedLiteral } from '../rule-patterns.ts';
import { wordCharClass } from '../../util/word-matcher.ts';
import { SEQ, STRING } from '../../types/rule-types.ts';
import type { RenderRule } from '../../types/rule.ts';

const str = (value: string): RenderRule => ({ type: STRING, value }) as unknown as RenderRule;
const seq = (...values: string[]): RenderRule => ({ type: SEQ, members: values.map(str) }) as unknown as RenderRule;

describe('wordCharClass', () => {
	it('is the writer word class: identifier characters join, punctuation does not', () => {
		const isWord = wordCharClass(undefined);
		expect(isWord('a')).toBe(true);
		expect(isWord('Z')).toBe(true);
		expect(isWord('0')).toBe(true);
		expect(isWord('_')).toBe(true);
		expect(isWord('(')).toBe(false);
		expect(isWord(')')).toBe(false);
		expect(isWord('*')).toBe(false);
	});
});

describe('collectFixedLiteral', () => {
	it('joins two word-shaped literals with the space the lexer needs', () => {
		expect(collectFixedLiteral(seq('raw', 'const'))).toBe('raw const');
	});

	it('joins punctuation tight, so a unit is () and not ( )', () => {
		expect(collectFixedLiteral(seq('(', ')'))).toBe('()');
		expect(collectFixedLiteral(seq('[', ']'))).toBe('[]');
	});

	it('joins a punctuation flank to a word tight', () => {
		expect(collectFixedLiteral(seq('*', 'const'))).toBe('*const');
		expect(collectFixedLiteral(seq('const', '*'))).toBe('const*');
	});

	it('keeps a lone literal and an empty seq unchanged', () => {
		expect(collectFixedLiteral(str('mut'))).toBe('mut');
		expect(collectFixedLiteral(seq())).toBeUndefined();
	});
});
