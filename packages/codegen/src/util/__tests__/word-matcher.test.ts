import { describe, expect, it } from 'vitest';
import { PATTERN } from '../../types/rule-types.ts';
import type { AnyRule } from '../../types/rule.ts';
import { compileWordMatcher } from '../word-matcher.ts';

describe('compileWordMatcher', () => {
	it("reads the word pattern's classes as tree-sitter lexes them", () => {
		const matcher = compileWordMatcher('word', { word: { type: PATTERN, value: '[^\\s]+' } as AnyRule })!;
		expect(matcher.test('a\u00a0b')).toBe(true);
		expect(matcher.test('a b')).toBe(false);
	});
});
