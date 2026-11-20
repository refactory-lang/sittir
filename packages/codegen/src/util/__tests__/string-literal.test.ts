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
		expect(rustStringLiteral('\b\f\u0000\u001f\u007f')).toBe('"\\u{8}\\u{C}\\u{0}\\u{1F}\\u{7F}"');
		expect(stringLiteral('\b\u0001')).toBe('"\\b\\u0001"');
	});

	it('escapes any noncharacter code point', () => {
		expect(rustStringLiteral('a\u{FFFE}b')).toBe('"a\\u{FFFE}b"');
		expect(rustStringLiteral('\u{FDD0}\n')).toBe('"\\u{FDD0}\\n"');
	});

	it('keeps printable and non-ASCII text as it is', () => {
		expect(rustStringLiteral('pub fn → é')).toBe('"pub fn → é"');
	});
});
