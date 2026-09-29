import { describe, it, expect } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ts = await createEngine(typescript);

describe('typescript text-leaf factories always run their guard', () => {
	it('builds text that matches the whole token', () => {
		expect(() => ts.build.identifier('abc')).not.toThrow();
		expect(ts.build.comment.line(' hello').$render!()).toBe('// hello\n');
		expect(ts.build.comment.block(' hello ').$render!()).toBe('/* hello */');
		expect(ts.build.privatePropertyIdentifier('x').$render!()).toBe('#x');
		expect(() => ts.build.number('1_000')).not.toThrow();
	});

	it('rejects empty text', () => {
		expect(() => ts.build.identifier('')).toThrow(/non-empty/);
	});

	it('anchors the pattern: a valid prefix followed by more text is rejected', () => {
		expect(() => ts.build.identifier('a b')).toThrow(/does not match/);
		expect(() => ts.build.number('12z')).toThrow(/does not match/);
		expect(() => ts.build.regexFlags('gi1')).toThrow(/does not match/);
	});

	it('rejects an identifier that starts with a digit', () => {
		expect(() => ts.build.identifier('1x')).toThrow(/does not match/);
	});

	it('requires the content a structured comment can lex', () => {
		expect(() => ts.build.comment.block(' unterminated */ ')).toThrow(/comment_block.content: text does not match/);
	});

	it('takes a structured token as its content or spelled in full', () => {
		expect(ts.build.privatePropertyIdentifier('#x').$render!()).toBe('#x');
		expect(ts.build.escapeSequence('n').$render!()).toBe('\\n');
	});
});
