// A lexed kind whose one slot is its own text is a leaf: one builder, text
// only. The builder takes the content, or the text spelled in full when the
// caller says the affixes are in it; it never reads the text to tell which.
import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ir = (await createEngine(python)).build;

describe('a leaf that is its own text', () => {
	it('builds from its content', () => {
		expect(ir.comment(' x').$render()).toBe('# x\n');
		expect(ir.escapeSequence.octal('101').$render()).toBe('\\101');
	});

	it('builds from its text spelled in full when told the affixes are in it', () => {
		expect(ir.comment('# x', false).$render()).toBe('# x\n');
		expect(ir.escapeSequence.named('\\N{DASH}', false).$render()).toBe('\\N{DASH}');
	});

	it('does not read the text to tell which form it was given', () => {
		expect(ir.comment('# x').content()).toBe('# x');
		expect(() => ir.escapeSequence.hex('\\x41')).toThrow(/escape_sequence_hex.content: text does not match/);
	});

	it('refuses text given as spelled in full that lacks an affix', () => {
		const text: string = ' x';
		expect(() => ir.comment(text as `#${string}`, false)).toThrow(/comment: text given with its affixes must be/);
	});

	it('is one builder, with no strict or coerce form', () => {
		for (const entry of [ir.comment, ir.escapeSequence.octal, ir.escapeSequence.named]) {
			expect(typeof entry).toBe('function');
			expect('strict' in entry).toBe(false);
			expect('coerce' in entry).toBe(false);
		}
	});
});
