import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('typescript text-leaf factories always run their guard', () => {
	it('builds text that matches the whole token', () => {
		expect(() => ir.identifier('abc')).not.toThrow();
		expect(() => ir.comment('// hello')).not.toThrow();
		expect(() => ir.comment('/* hello */')).not.toThrow();
		expect(() => ir.privatePropertyIdentifier('#x')).not.toThrow();
		expect(() => ir.number('1_000')).not.toThrow();
	});

	it('rejects empty text', () => {
		expect(() => ir.identifier('')).toThrow(/non-empty/);
		expect(() => ir.comment('')).toThrow(/non-empty/);
	});

	it('anchors the pattern: a valid prefix followed by more text is rejected', () => {
		expect(() => ir.identifier('a b')).toThrow(/does not match/);
		expect(() => ir.number('12z')).toThrow(/does not match/);
		expect(() => ir.regexFlags('gi1')).toThrow(/does not match/);
	});

	it('rejects an identifier that starts with a digit', () => {
		expect(() => ir.identifier('1x')).toThrow(/does not match/);
	});

	it('requires the affixes a token always carries', () => {
		expect(() => ir.comment('hello')).toThrow(/does not match/);
		expect(() => ir.comment('/* unterminated')).toThrow(/does not match/);
		expect(() => ir.privatePropertyIdentifier('x')).toThrow(/does not match/);
	});
});
