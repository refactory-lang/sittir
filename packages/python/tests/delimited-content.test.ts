import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';
import { buildString, buildStringContent, buildStringEnd, buildStringFragment, buildStringStart } from '../src/factories/raw.ts';

const py = await createEngine(python);
const b = py.build;

const quoted = (start: string, content: string, end: string) =>
	b.string({ stringStart: b.stringStart(start), content: [b.stringContent.coerce(content)], stringEnd: b.stringEnd(end) });

describe('a string whose content or delimiters would not read back as one string', () => {
	it.each([
		['the content ends the string and runs code', `"`, `x" + __import__('os').system('id') + "`, `"`],
		['mismatched quotes', `"`, 'abc', `'`],
		['a triple start closed by one quote', `'''`, 'x', `"`],
		['a quote inside a single-quoted string', `'`, "it's", `'`],
		['an interpolation smuggled into an f-string', `f'`, '{evil()}', `'`]
	])('refuses %s', (_why, start, content, end) => {
		expect(() => quoted(start, content, end)).toThrow(/string: content .* cannot sit between/);
	});

	it.each([
		[`'`, 'abc', `'`],
		[`"`, 'a b', `"`],
		[`"""`, 'a"b', `"""`],
		[`f'`, 'a{{b}}', `'`]
	])('accepts %j %j %j', (start, content, end) => {
		expect(quoted(start, content, end).$render()).toBe(`${start}${content}${end}`);
	});

	it('round-trips a string the parser read with a quote of the other kind inside', () => {
		const read = py.parse(`x = 'a"b'\n`);
		expect(py.render(read).toString()).toBe(`x = 'a"b'\n`);
	});

	it('refuses a varying delimiter pair without an engine, whatever an engine confirmed before', () => {
		const raw = (start: string, content: string, end: string) =>
			buildString({
				stringStart: buildStringStart(start),
				content: [buildStringContent(buildStringFragment(content))],
				stringEnd: buildStringEnd(end)
			});
		quoted('"', 'abc', '"');
		expect(() => raw('"', 'abc', '"')).toThrow(/its delimiters need an engine/);
	});
});
