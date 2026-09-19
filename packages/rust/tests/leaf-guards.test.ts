import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('rust text-leaf factories always run their guard', () => {
	it('builds text that matches the whole token', () => {
		expect(() => ir.identifier('abc')).not.toThrow();
		expect(() => ir.charLiteral("'a'")).not.toThrow();
		expect(() => ir.integerLiteral('1_000u8')).not.toThrow();
		expect(() => ir.metavariable('$x')).not.toThrow();
	});

	it('rejects empty text', () => {
		expect(() => ir.identifier('')).toThrow(/non-empty/);
		expect(() => ir.charLiteral('')).toThrow(/non-empty/);
	});

	it('anchors the pattern: a valid prefix followed by more text is rejected', () => {
		expect(() => ir.identifier('a b')).toThrow(/does not match/);
		expect(() => ir.integerLiteral('12z')).toThrow(/does not match/);
		expect(() => ir.metavariable('$x y')).toThrow(/does not match/);
	});

	it('rejects an identifier that starts with a digit', () => {
		expect(() => ir.identifier('1x')).toThrow(/does not match/);
	});

	it('requires the delimiters a token always carries', () => {
		expect(() => ir.charLiteral('a')).toThrow(/does not match/);
		expect(() => ir.metavariable('x')).toThrow(/does not match/);
	});
});
