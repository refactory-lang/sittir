// A lexed kind whose one slot is its own text is a leaf: one builder, text
// only. The builder takes the content, or the text spelled in full when the
// caller says the affixes are in it; it never reads the text to tell which.
// A slot that holds such a leaf still takes either form.
import { describe, expect, it } from 'vitest';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const ir = (await createEngine(typescript)).build;

const statement = () => ir.expressionStatement(ir.identifier('x'));

describe('a leaf that is its own text', () => {
	it('builds from its content', () => {
		expect(ir.comment.line(' a').$render()).toBe('// a\n');
		expect(ir.comment.line(' a', true).$render()).toBe('// a\n');
		expect(ir.comment.block(' a ').$render()).toBe('/* a */');
		expect(ir.hashBangLine('/usr/bin/env node').$render()).toBe('#!/usr/bin/env node\n');
		expect(ir.number.bigint('1').$render()).toBe('1n');
		expect(ir.number.bigint(1n).$render()).toBe('1n');
	});

	it('builds from its text spelled in full when told the affixes are in it', () => {
		expect(ir.comment.line('// a', false).$render()).toBe('// a\n');
		expect(ir.comment.block('/* a */', false).$render()).toBe('/* a */');
		expect(ir.hashBangLine('#!/usr/bin/env node', false).$render()).toBe('#!/usr/bin/env node\n');
		expect(ir.number.bigint('1n', false).$render()).toBe('1n');
		expect(ir.comment.block('/* a */', false).content()).toBe(' a ');
	});

	it('does not read the text to tell which form it was given', () => {
		expect(ir.comment.line('// a').content()).toBe('// a');
		expect(() => ir.comment.block('/* a */')).toThrow(/comment_block.content: text does not match/);
		expect(() => ir.number.bigint('1n')).toThrow(/number_bigint_decimal.content: text does not match/);
	});

	it('refuses text given as spelled in full that lacks an affix, naming both', () => {
		const text: string = '/* a';
		expect(() => ir.comment.block(text as `/*${string}*/`, false)).toThrow(
			'comment_block: text given with its affixes must be "/*"…"*/", got "/* a"'
		);
	});

	it('is one builder, with no strict or coerce form, at the top and under a parent', () => {
		for (const entry of [ir.comment.line, ir.comment.block, ir.hashBangLine, ir.privatePropertyIdentifier]) {
			expect(typeof entry).toBe('function');
			expect('strict' in entry).toBe(false);
			expect('coerce' in entry).toBe(false);
		}
		expect('strict' in ir.number.bigint.hex).toBe(false);
	});

	it('is copied by building again from its content', () => {
		const comment = ir.comment.line(' a');
		const copy = ir.comment.line(comment.content());
		expect(copy).not.toBe(comment);
		expect(copy.$render()).toBe(comment.$render());
	});

	it('is forwarded by a parent sub-builder with the same two forms', () => {
		expect(ir.literalType.bigint('1').$render()).toBe('1n');
		expect(ir.literalType.bigint('1n', false).$render()).toBe('1n');
		expect(ir.literalType.bigint.hex('0xff').$render()).toBe('0xffn');
		expect(ir.literalType.bigint.hex('0xffn', false).$render()).toBe('0xffn');
	});
});

describe('a slot that holds a leaf that is its own text', () => {
	it('still takes the content, the text spelled in full, or the built leaf', () => {
		const rendered = '#!/usr/bin/env node\nx;\n';
		expect(ir.program({ hashBangLine: '/usr/bin/env node', statements: [statement()] }).$render()).toBe(rendered);
		expect(ir.program({ hashBangLine: '#!/usr/bin/env node', statements: [statement()] }).$render()).toBe(rendered);
		expect(ir.program({ hashBangLine: ir.hashBangLine('/usr/bin/env node'), statements: [statement()] }).$render()).toBe(rendered);
	});
});
