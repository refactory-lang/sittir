import { describe, it, expect } from 'vitest';
import { ir } from '../src/index.ts';

describe('python text-leaf factories always run their guard', () => {
	it('builds text that matches the whole token', () => {
		expect(() => ir.identifier('abc')).not.toThrow();
		expect(ir.comment(' hello').$render!()).toBe('# hello');
		expect(() => ir.integer('0x1F')).not.toThrow();
	});

	it('rejects empty text', () => {
		expect(() => ir.identifier('')).toThrow(/non-empty/);
	});

	it('anchors the pattern: a valid prefix followed by more text is rejected', () => {
		expect(() => ir.identifier('a b')).toThrow(/does not match/);
		expect(() => ir.integer('1x')).toThrow(/does not match/);
	});

	it('rejects an identifier that starts with a digit', () => {
		expect(() => ir.identifier('1x')).toThrow(/does not match/);
	});

	it('takes the content of a structured token and the marker is written for it', () => {
		expect(ir.comment('').$render!()).toBe('#');
		expect(() => ir.escapeSequence('q')).toThrow(/escape_sequence.content: text does not match/);
	});
});
