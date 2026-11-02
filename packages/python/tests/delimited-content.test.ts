import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';
import { buildString, buildStringContent, buildStringEnd, buildStringFragment, buildStringStart } from '../src/factories/raw.ts';

const py = await createEngine(python);
const b = py.build;

const quoted = (start: string, content: string, end: string) =>
	b.string({ stringStart: b.stringStart(start), contents: [b.stringContent(content)], stringEnd: b.stringEnd(end) });

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
				contents: [buildStringContent(buildStringFragment(content))],
				stringEnd: buildStringEnd(end)
			});
		quoted('"', 'abc', '"');
		expect(() => raw('"', 'abc', '"')).toThrow(/its delimiters need an engine/);
	});
});

describe.each([
	['objects', await createEngine(python, { nodeStorage: 'object' })],
	['records', py]
] as const)('a read string edited under %s construction', (_construction, engine) => {
	type Read = { readonly $type: number; readonly $with?: Record<string, unknown> } & Record<string, unknown>;
	type Quoted = { contents(): readonly unknown[]; readonly $with: { contents(...items: unknown[]): { $render(): string } } };
	const stringIn = (node: Read): Quoted | undefined => {
		if (typeof node.stringStart === 'function' && typeof node.contents === 'function') return node as unknown as Quoted;
		for (const key of Object.keys(node.$with ?? {})) {
			const value = typeof node[key] === 'function' ? (node[key] as () => unknown)() : undefined;
			for (const child of Array.isArray(value) ? value : [value]) {
				const found = child !== null && typeof child === 'object' ? stringIn(child as Read) : undefined;
				if (found !== undefined) return found;
			}
		}
		return undefined;
	};
	const contentsOf = (source: string): Quoted => stringIn(engine.parse(source) as unknown as Read)!;

	it.each([`f"""a"{b}c"""\n`, `f"""a""{b}c"""\n`])('refuses contents that put a quote before the closing delimiter of %j', (source) => {
		const string = contentsOf(source);
		expect(() => string.$with.contents(...[...string.contents()].reverse())).toThrow(/string: content .* cannot sit between/);
	});

	it('accepts contents that read back as the same string', () => {
		const string = contentsOf(`f"""a"{b}c"""\n`);
		expect(string.$with.contents(...string.contents().slice(1)).$render()).toBe('f"""{b}c"""');
	});
});
