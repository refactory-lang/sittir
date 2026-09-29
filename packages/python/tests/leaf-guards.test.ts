import { describe, it, expect } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('python text-leaf factories always run their guard', () => {
	it('builds text that matches the whole token', () => {
		expect(() => py.build.identifier('abc')).not.toThrow();
		expect(py.build.comment(' hello').$render!()).toBe('# hello\n');
		expect(() => py.build.integer.hex({ content: '1F' }, { prefix: '0x' })).not.toThrow();
	});

	it('rejects empty text', () => {
		expect(() => py.build.identifier('')).toThrow(/non-empty/);
	});

	it('anchors the pattern: a valid prefix followed by more text is rejected', () => {
		expect(() => py.build.identifier('a b')).toThrow(/does not match/);
		expect(() => py.build.integer('1x')).toThrow(/does not match/);
	});

	it('rejects an identifier that starts with a digit', () => {
		expect(() => py.build.identifier('1x')).toThrow(/does not match/);
	});

	it('takes the content of a structured token and the marker is written for it', () => {
		expect(py.build.comment('').$render!()).toBe('#\n');
		expect(() => py.build.escapeSequence('q')).toThrow(/escape_sequence_simple.content: text does not match/);
	});
});
