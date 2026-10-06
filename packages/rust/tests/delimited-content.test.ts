import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);
const b = rs.build;

const raw = (start: string, content: string, end: string) =>
	b.rawStringLiteral({
		rawStringLiteralStart: b.rawStringLiteralStart(start),
		stringContent: b.rawStringLiteralContent(content),
		rawStringLiteralEnd: b.rawStringLiteralEnd(end)
	});

describe('a raw string whose content or hashes would not read back as one literal', () => {
	it.each([
		['content closes it early', 'r"', 'x" + y + r"', '"'],
		['a longer close than open', 'r#"', 'x', '"##'],
		['a shorter close than open', 'r##"', 'x', '"#']
	])('refuses %s', (_why, start, content, end) => {
		expect(() => raw(start, content, end)).toThrow(/raw_string_literal: content .* cannot sit between/);
	});

	it.each([
		['r"', 'abc', '"'],
		['r#"', 'a#b', '"#'],
		['r##"', 'foo #"# bar', '"##']
	])('accepts %j %j %j', (start, content, end) => {
		expect(raw(start, content, end).$render()).toBe(`${start}${content}${end}`);
	});
});

describe('a block comment whose content would end it early', () => {
	it('refuses content that closes the comment', () => {
		expect(() => b.blockComment(b.blockCommentRegular(' a */ fn x() {} /* b '))).toThrow(/block_comment: content .* cannot sit between/);
	});

	it.each([[' a '], [' a/b '], [' /* nested */ ']])('accepts %j', (content) => {
		expect(b.blockComment(b.blockCommentRegular(content)).$render()).toBe(`/*${content}*/`);
	});
});
