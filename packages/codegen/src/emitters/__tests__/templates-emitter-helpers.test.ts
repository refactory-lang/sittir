import { describe, expect, it } from 'vitest';
import type { Rule } from '../../compiler/rule.ts';
import { escapeJinjaString, escapeLiteral, snakeToCamel, stringifyRule } from '../templates.ts';

describe('escapeLiteral', () => {
	it('adds spacing around opening braces', () => {
		expect(escapeLiteral('{value')).toBe('{ value');
	});

	it('adds spacing around closing braces', () => {
		expect(escapeLiteral('value}')).toBe('value }');
	});

	it('collapses empty braces to a single interior space', () => {
		expect(escapeLiteral('{}')).toBe('{ }');
	});

	it('escapes multiple brace pairs', () => {
		expect(escapeLiteral('{{value}}')).toBe('{ { value } }');
	});
});

describe('snakeToCamel', () => {
	it('converts snake case to camel case', () => {
		expect(snakeToCamel('field_name')).toBe('fieldName');
	});

	it('converts digit-prefixed segments', () => {
		expect(snakeToCamel('field_1_name')).toBe('field1Name');
	});

	it('leaves names without underscores unchanged', () => {
		expect(snakeToCamel('fieldName')).toBe('fieldName');
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
		const rule: Rule = { type: 'string', value: 'fn' };
		expect(stringifyRule(rule)).toBe('fn');
	});

	it('recursively joins seq members', () => {
		const rule: Rule = {
			type: 'seq',
			members: [
				{ type: 'string', value: 'fn' },
				{
					type: 'seq',
					members: [
						{ type: 'string', value: ' ' },
						{ type: 'string', value: 'main' }
					]
				}
			]
		};
		expect(stringifyRule(rule)).toBe('fn main');
	});

	it('returns an empty string for unsupported rule types', () => {
		const rule: Rule = { type: 'choice', members: [{ type: 'string', value: 'a' }] };
		expect(stringifyRule(rule)).toBe('');
	});
});
