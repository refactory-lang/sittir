// A lexed kind whose one slot is its own text is a leaf: one builder, text
// only. The builder takes the content, or the text spelled in full when the
// caller says the affixes are in it; it never reads the text to tell which.
import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ir = (await createEngine(rust)).build;

describe('a leaf that is its own text', () => {
	it('builds from its content', () => {
		expect(ir.shebang('/bin/x').$render()).toBe('#!/bin/x\n');
		expect(ir.metavariable('x').$render()).toBe('$x');
		expect(ir.escapeSequence.hex('x41').$render()).toBe('\\x41');
	});

	it('builds from its text spelled in full when told the affixes are in it', () => {
		expect(ir.shebang('#!/bin/x\n', false).$render()).toBe('#!/bin/x\n');
		expect(ir.metavariable('$x', false).$render()).toBe('$x');
		expect(ir.escapeSequence.unicodeBraced('\\u{41}', false).$render()).toBe('\\u{41}');
	});

	it('does not read the text to tell which form it was given', () => {
		expect(() => ir.metavariable('$x')).toThrow(/metavariable.name: text does not match/);
		expect(() => ir.escapeSequence.hex('\\x41')).toThrow(/escape_sequence_hex.content: text does not match/);
	});

	it('refuses text given as spelled in full that lacks an affix', () => {
		const text: string = '#!/bin/x';
		expect(() => ir.shebang(text as `#!${string}\n`, false)).toThrow(/shebang: text given with its affixes must be/);
	});

	it('is one builder, with no strict or coerce form', () => {
		for (const entry of [ir.shebang, ir.metavariable, ir.escapeSequence.hex, ir.escapeSequence.unicodeBraced]) {
			expect(typeof entry).toBe('function');
			expect('strict' in entry).toBe(false);
			expect('coerce' in entry).toBe(false);
		}
	});
});

describe('a kind with a second slot, and a polymorph parent', () => {
	it('keeps its coercing entry, which takes either form', () => {
		expect(ir.lifetime("'a").$render()).toBe("'a");
		expect(ir.lifetime('a').$render()).toBe("'a");
		expect(ir.lineComment('// x').$render()).toBe('// x\n');
		expect(ir.lineComment(' x').$render()).toBe('// x\n');
	});
});
