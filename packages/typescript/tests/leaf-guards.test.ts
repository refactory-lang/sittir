import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('typescript text-leaf factories always run their guard', () => {
	it('builds text that matches the whole token', () => {
		expect(() => ir.identifier('abc')).not.toThrow();
		expect(ir.comment.line(' hello').$render!()).toBe('// hello');
		expect(ir.comment.block(' hello ').$render!()).toBe('/* hello */');
		expect(ir.privatePropertyIdentifier('x').$render!()).toBe('#x');
		expect(() => ir.number('1_000')).not.toThrow();
	});

	it('rejects empty text', () => {
		expect(() => ir.identifier('')).toThrow(/non-empty/);
	});

	it('anchors the pattern: a valid prefix followed by more text is rejected', () => {
		expect(() => ir.identifier('a b')).toThrow(/does not match/);
		expect(() => ir.number('12z')).toThrow(/does not match/);
		expect(() => ir.regexFlags('gi1')).toThrow(/does not match/);
	});

	it('rejects an identifier that starts with a digit', () => {
		expect(() => ir.identifier('1x')).toThrow(/does not match/);
	});

	it('requires the content a structured comment can lex', () => {
		expect(() => ir.comment.block(' unterminated */ ')).toThrow(/comment_block.content: text does not match/);
	});

	it('takes the content of a structured token and never its affixes', () => {
		expect(() => ir.privatePropertyIdentifier('#x')).toThrow(/private_property_identifier.content: text does not match/);
		expect(ir.escapeSequence('n').$render!()).toBe('\\n');
	});
});
