import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

describe('a text leaf slot takes a built node strictly and its text loosely', () => {
	it('rejects bare text strictly, naming the leaf builders', () => {
		// @ts-expect-error a strict slot takes a built node, not text
		expect(() => py.build.stringContent.strict('hello')).toThrow(/a strict factory takes a built node, not a string/);
	});

	it('builds the first text kind, in lexical rank order, whose pattern accepts the text', () => {
		expect(py.build.stringContent.coerce('hello').$render()).toBe('hello');
	});

	it('throws when no text kind accepts the text', () => {
		expect(() => py.build.stringContent.coerce('')).toThrow(/matches none of \[.*string_fragment/);
	});

	it.each([['a"b'], ['.*\\.txt$'], ['a\nb'], ['a{b}']])(
		'builds a string fragment from %j, text the scanner reads inside some string',
		(text) => {
			expect(py.build.stringContent.coerce(text).$render()).toBe(text);
			expect(py.build.stringFragment(text).$text).toBe(text);
		}
	);

	it.each([['`'], ["r'"], ['"""']])('builds the string start %j the scanner reads', (text) => {
		expect(py.build.stringStart(text).$text).toBe(text);
	});

	it.each([['`'], ["\\'"], ['\\\\"']])('builds the string end %j the scanner reads, backslashes of a raw string included', (text) => {
		expect(py.build.stringEnd(text).$text).toBe(text);
	});

	it('rejects bare text strictly in a node slot', () => {
		// @ts-expect-error a strict node slot takes a built node, not text
		expect(() => py.build.returnStatement.strict('x')).toThrow(/ReturnStatement\.\w+: a strict factory takes a built node, not a string; expected a built /);
	});
});
