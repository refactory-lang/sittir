import { describe, it, expect } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);

describe('rust text-leaf factories always run their guard', () => {
	it('builds text that matches the whole token', () => {
		expect(() => rs.build.identifier('abc')).not.toThrow();
		expect(rs.build.charLiteral('a').$render!()).toBe("'a'");
		expect(rs.build.charLiteral({ content: 'a', byte: true }).$render!()).toBe("b'a'");
		expect(rs.build.integerLiteral({ content: '1_000', suffix: 'u8' }).$render!()).toBe('1_000u8');
		expect(rs.build.metavariable('x').$render!()).toBe('$x');
	});

	it('names the byte prefix `byte` on every char form that holds a character', () => {
		expect(rs.build.charLiteral.plain({ content: 'a', byte: true }).$render!()).toBe("b'a'");
		expect(rs.build.charLiteral.escaped.simple({ content: '\\n', byte: true }).$render!()).toBe("b'\\n'");
		expect(rs.build.charLiteral.escaped.unicodeFixed({ content: '\\u0041', byte: true }).$render!()).toBe("b'\\u0041'");
		expect(rs.build.charLiteral.escaped.unicodeBraced({ content: '\\u{41}', byte: true }).$render!()).toBe("b'\\u{41}'");
		expect(rs.build.charLiteral.escaped.hex({ content: '\\x41', byte: true }).$render!()).toBe("b'\\x41'");
	});

	it('rejects empty text', () => {
		expect(() => rs.build.identifier('')).toThrow(/non-empty/);
		expect(() => rs.build.integerLiteral('')).toThrow(/integer_literal_decimal.content: text does not match/);
	});

	it('anchors the pattern: a valid prefix followed by more text is rejected', () => {
		expect(() => rs.build.identifier('a b')).toThrow(/does not match/);
		expect(() => rs.build.integerLiteral('12z')).toThrow(/integer_literal_decimal.content: text does not match/);
		expect(() => rs.build.metavariable('x y')).toThrow(/metavariable.name: text does not match/);
	});

	it('rejects an identifier that starts with a digit', () => {
		expect(() => rs.build.identifier('1x')).toThrow(/does not match/);
	});

	it('takes a token spelled in full only when told its delimiters are in the text', () => {
		expect(() => rs.build.charLiteral("'a'")).toThrow(/char_literal_plain.content: text does not match/);
		expect(rs.build.metavariable('$x', false).$render!()).toBe('$x');
		expect(() => rs.build.metavariable('$x')).toThrow(/metavariable.name: text does not match/);
	});
});
