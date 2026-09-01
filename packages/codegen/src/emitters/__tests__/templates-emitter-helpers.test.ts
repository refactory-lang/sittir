import { CHOICE, SEQ, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import { escapeJinjaString, separateBraceFromTag, stringifyRule } from '../templates.ts';

describe('separateBraceFromTag', () => {
	// Askama lexes only `{{`, `{%` and `{#`; see the glossary entry.
	it('leaves a brace followed by ordinary text alone', () => {
		expect(separateBraceFromTag('{value')).toBe('{value');
	});

	it('leaves closing braces alone, adjacent or not', () => {
		expect(separateBraceFromTag('value}')).toBe('value}');
		expect(separateBraceFromTag('{{ x }}}')).toBe('{{ x }}}');
	});

	it('leaves empty braces alone', () => {
		expect(separateBraceFromTag('{}')).toBe('{}');
	});

	it('separates a literal brace from a following expression and trims it back out', () => {
		expect(separateBraceFromTag('{{{ x }}')).toBe('{ {{- x }}');
	});

	it('separates a literal brace from a following statement or comment', () => {
		expect(separateBraceFromTag('{{% if x %}')).toBe('{ {%- if x %}');
		expect(separateBraceFromTag('{{# c #}')).toBe('{ {#- c #}');
	});

	it('does not double the trim marker when the tag already carries one', () => {
		expect(separateBraceFromTag('{{{- x }}')).toBe('{ {{- x }}');
	});

	it('splits only the tag off a longer run of literal braces', () => {
		expect(separateBraceFromTag('{{{{ x }}')).toBe('{{ {{- x }}');
		expect(separateBraceFromTag('{{{{{ x }}')).toBe('{{{ {{- x }}');
	});
});

describe('escapeJinjaString', () => {
	it('escapes backslashes', () => {
		expect(escapeJinjaString('a\\b')).toBe('a\\\\b');
	});

	it('escapes double quotes', () => {
		expect(escapeJinjaString('say "hi"')).toBe('say \\"hi\\"');
	});

	it('escapes backslashes before double quotes', () => {
		expect(escapeJinjaString('\\"')).toBe('\\\\\\"');
	});
});

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
