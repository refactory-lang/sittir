import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('rust text-leaf factories always run their guard', () => {
	it('builds text that matches the whole token', () => {
		expect(() => ir.identifier('abc')).not.toThrow();
		expect(ir.charLiteral('a').$render!()).toBe("'a'");
		expect(ir.charLiteral({ content: 'a', b: true }).$render!()).toBe("b'a'");
		expect(ir.integerLiteral({ content: '1_000', suffix: 'u8' }).$render!()).toBe('1_000u8');
		expect(ir.metavariable('x').$render!()).toBe('$x');
	});

	it('rejects empty text', () => {
		expect(() => ir.identifier('')).toThrow(/non-empty/);
		expect(() => ir.integerLiteral('')).toThrow(/integer_literal_decimal.content: text does not match/);
	});

	it('anchors the pattern: a valid prefix followed by more text is rejected', () => {
		expect(() => ir.identifier('a b')).toThrow(/does not match/);
		expect(() => ir.integerLiteral('12z')).toThrow(/integer_literal_decimal.content: text does not match/);
		expect(() => ir.metavariable('x y')).toThrow(/metavariable.name: text does not match/);
	});

	it('rejects an identifier that starts with a digit', () => {
		expect(() => ir.identifier('1x')).toThrow(/does not match/);
	});

	it('takes the content of a token and never the delimiters it always carries', () => {
		expect(() => ir.charLiteral("'a'")).toThrow(/char_literal_plain.content: text does not match/);
		expect(() => ir.metavariable('$x')).toThrow(/metavariable.name: text does not match/);
	});
});
