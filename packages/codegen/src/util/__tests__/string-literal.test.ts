import { describe, expect, it } from 'vitest';
import { rustStringLiteral, stringLiteral } from '../string-literal.ts';

describe('stringLiteral', () => {
	it('quotes text as a JSON string', () => {
		expect(stringLiteral('a"b\\c\n')).toBe('"a\\"b\\\\c\\n"');
	});
});

describe('rustStringLiteral', () => {
	it('escapes a backslash, a quote, a newline, a carriage return and a tab', () => {
		expect(rustStringLiteral('a\\b"c\nd\re\tf')).toBe('"a\\\\b\\"c\\nd\\re\\tf"');
	});

	it('escapes any other control character as a braced unicode escape, never as JSON does', () => {
		expect(rustStringLiteral('\b\f\u0000\u001f\u007f')).toBe('"\\u{8}\\u{c}\\u{0}\\u{1f}\\u{7f}"');
		expect(stringLiteral('\b\u0001')).toBe('"\\b\\u0001"');
	});

	it('keeps printable and non-ASCII text as it is', () => {
		expect(rustStringLiteral('pub fn → é')).toBe('"pub fn → é"');
	});
});
