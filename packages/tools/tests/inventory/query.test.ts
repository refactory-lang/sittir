import { describe, it, expect } from 'vitest';
import { parseQuery } from '../../src/inventory/query.ts';

describe('parseQuery', () => {
	it('keeps a semicolon inside a quoted literal', () => {
		const [pattern] = parseQuery('(expression_statement ";" @semi) @statement.expression');
		expect(pattern?.children.map((c) => c.text)).toContain(';');
	});

	it('still strips a line comment', () => {
		const patterns = parseQuery('; a comment with "quotes" and (parens\n(identifier) @identifier');
		expect(patterns).toHaveLength(1);
		expect(patterns[0]?.kind).toBe('identifier');
	});

	it('rejects an unterminated predicate instead of hanging', () => {
		expect(() => parseQuery('(identifier) @identifier (call #eq? @x "a"')).toThrow(/unterminated/);
		expect(() => parseQuery('(call #eq? @x "a"')).toThrow(/unterminated/);
	});

	it('rejects an unterminated alternation instead of hanging', () => {
		expect(() => parseQuery('(call [ (identifier) (number)')).toThrow(/unterminated/);
	});
});
