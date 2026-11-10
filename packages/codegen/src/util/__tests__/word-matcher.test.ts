import { describe, expect, it } from 'vitest';
import { ALIAS, FIELD, IMMEDIATE_TOKEN, PATTERN, SEQ, STRING, TOKEN } from '../../types/rule-types.ts';
import type { AnyRule } from '../../types/rule.ts';
import { compileWordMatcher, ruleToRegexSource } from '../word-matcher.ts';

describe('compileWordMatcher', () => {
	it("reads the word pattern's classes as tree-sitter lexes them", () => {
		const matcher = compileWordMatcher('word', { word: { type: PATTERN, value: '[^\\s]+' } as AnyRule })!;
		expect(matcher.test('a\u00a0b')).toBe(true);
		expect(matcher.test('a b')).toBe(false);
	});
});

describe('ruleToRegexSource', () => {
	it('reads through the wrappers the lexer ignores inside a token', () => {
		const rule = {
			type: IMMEDIATE_TOKEN,
			content: {
				type: 'PREC',
				value: 1,
				content: {
					type: SEQ,
					members: [
						{ type: FIELD, name: 'radix', content: { type: STRING, value: '0x' } },
						{ type: ALIAS, named: true, value: 'digits', content: { type: TOKEN, content: { type: PATTERN, value: '[0-9a-f]+' } } }
					]
				}
			}
		} as AnyRule;
		expect(new RegExp(`^(?:${ruleToRegexSource(rule)})$`).test('0xff')).toBe(true);
	});
});
