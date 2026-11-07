import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);
const b = py.build;

const rendered = (node: { $render(): unknown }): string => String(node.$render());
const content = (text: string) => [b.stringContent(text)];

describe('a built string takes the quote its content derives', () => {
	it.each([
		['takes the preferred quote for content it fits', 'abc', '"abc"'],
		['moves to the next quote when the preferred one occurs in the content', 'a"b', `'a"b'`],
		['keeps an escaped quote inside the preferred one', 'a\\"b', '"a\\"b"'],
		['takes a multi-line quote for a line break', 'a\nb', '"""a\nb"""'],
		['keeps a single-line quote across an escaped line break', 'multiline \\\nstring', '"multiline \\\nstring"'],
		['keeps content that would close any single quote inside a triple one', `x" + __import__('os').system('id') + "`, `'''x" + __import__('os').system('id') + "'''`]
	])('%s', (_why, text, expected) => {
		expect(rendered(b.string({ contents: content(text) }))).toBe(expected);
	});

	it('keeps the prefix on the string it builds', () => {
		expect(rendered(b.string({ prefix: 'rb', contents: content('x') }))).toBe('rb"x"');
		const doubled = b.stringContent(b.stringFragment('a'), b.escapeInterpolation('{{'), b.stringFragment('b'), b.escapeInterpolation('}}'));
		expect(rendered(b.string({ prefix: 'f', contents: [doubled] }))).toBe('f"a{{b}}"');
	});

	it('keeps a preferred quote while the content fits it, and falls back when it no longer does', () => {
		const preferred = b.string({ contents: content('it') }, { quote: "'" });
		expect(rendered(preferred)).toBe("'it'");
		expect(rendered(b.string({ contents: content("it's") }, { quote: "'" }))).toBe(`"it's"`);
		expect(rendered(preferred.$with.contents(...content('a"b')))).toBe(`'a"b'`);
		expect(rendered(b.string({ contents: content('doc') }, { quote: '"""' }))).toBe('"""doc"""');
	});

	it('takes a spelling in the prefix closure on the loose surface, and refuses text outside it by the slot', () => {
		expect(rendered(b.string({ prefix: 'Rb', contents: content('x') }))).toBe('Rb"x"');
		for (const prefix of ['zz', 'bf']) {
			expect(() => b.string({ prefix: prefix as never, contents: content('x') })).toThrow(`string_start.prefix: text does not match pattern: ${prefix}`);
		}
	});

	it('refuses content that ends in an unpaired backslash, naming the kind', () => {
		expect(() => rendered(b.string({ contents: content('a\\') }))).toThrow(/string: no delimiter fits its content: it ends in an unpaired `\\`/);
	});
});

type ReadString = { prefix(): string | undefined; contents(): readonly unknown[]; stringEnd(): { content(): string | undefined } };

const readString = (source: string): ReadString =>
	(py.parse(`${source}\n`) as unknown as { statements(): readonly { statements(): readonly { content(): ReadString }[] }[] }).statements()[0]!.statements()[0]!.content();

const contentOf = (string: ReadString): string => string.contents().map(String).join('') + (string.stringEnd().content() ?? '');

describe("an interpolating string's built free text", () => {
	it.each(['f', 't', 'Rf', 'rt'])('refuses a brace under the %s prefix, naming the leaf', (prefix) => {
		expect(() => rendered(b.string({ prefix: prefix as never, contents: content('{evil()}') }))).toThrow(
			'string: its string_fragment text holds `{`, which would open another part of it'
		);
	});

	it('refuses a brace after a backslash, which escapes nothing before a brace', () => {
		expect(() => rendered(b.string({ prefix: 'f', contents: content('\\{evil()}') }))).toThrow('holds `{`');
	});

	it('refuses a brace under an opaque prefix', () => {
		const read = readString('bf"y"') as unknown as { prefix(): string | undefined; readonly $with: { contents(...items: unknown[]): { $render(): unknown } } };
		expect(read.prefix()).toBeUndefined();
		expect(() => rendered(read.$with.contents(...content('a}')))).toThrow('holds `}`');
	});

	it('keeps an interpolation and a doubled brace, which are their own parts', () => {
		const contents = [b.stringContent(b.stringFragment('a')), b.interpolation({ expression: 'x' }), b.stringContent(b.escapeInterpolation('{{'))];
		expect(rendered(b.string({ prefix: 'f', contents }))).toBe('f"a{x}{{"');
	});

	it.each([
		['no prefix', undefined, '{x}', '"{x}"'],
		['a format template', undefined, '{} and {0:>3}', '"{} and {0:>3}"'],
		['a bytes prefix', 'b', '\\N{WINKING FACE}', 'b"\\N{WINKING FACE}"'],
		['a raw prefix', 'r', '{x}', 'r"{x}"']
	] as const)('builds braces as text under %s', (_why, prefix, text, built) => {
		expect(rendered(b.string({ ...(prefix === undefined ? {} : { prefix }), contents: content(text) }))).toBe(built);
	});

	it('rebuilds the text of a read bytes string with a named escape', () => {
		const source = 'b"\\x12\\N{WINKING FACE}"';
		const read = readString(source);
		expect(rendered(b.string({ prefix: 'b', contents: content(contentOf(read)) }))).toBe(source);
	});
});

describe("a string's read content is checked under the prefix it is seated under", () => {
	type Seated = ReadString & { readonly $with: { prefix(prefix: string): { $render(): unknown }; contents(...items: unknown[]): { $render(): unknown } } };
	const seated = (source: string) => readString(source) as unknown as Seated;

	it('refuses read text that would interpolate under an f prefix', () => {
		const read = seated('"{marker()}"');
		const refusal = 'string: its string_fragment text holds `{`, which would open another part of it';
		expect(() => rendered(b.string({ prefix: 'f', contents: read.contents() as never }))).toThrow(refusal);
		expect(() => rendered(read.$with.prefix('f'))).toThrow(refusal);
	});

	it.each([`f'{"{x}"}'`, `f'{d["{"]}'`, `f"{f'{x}'}"`, `f"a{{b}}{x:>{w}}"`])('rebuilds %s, whose braces belong to its interpolations', (source) => {
		const read = seated(source);
		expect(rendered(read.$with.contents(...read.contents()))).toBe(source);
		expect(rendered(b.string({ prefix: 'f', contents: read.contents() as never }))).toBe(source);
	});

	it.each([
		['b', 'the `b` prefix'],
		[undefined, 'no prefix']
	] as const)('refuses an interpolation under %s, naming it', (prefix, under) => {
		const contents = [b.interpolation({ expression: 'x' })];
		expect(() => rendered(b.string({ ...(prefix === undefined ? {} : { prefix }), contents }))).toThrow(`string: its interpolation is no part of it under ${under}`);
	});

	it('refuses a doubled brace under a bytes prefix, where it would read as two braces', () => {
		const contents = [b.stringContent(b.escapeInterpolation('{{'))];
		expect(() => rendered(b.string({ prefix: 'b', contents }))).toThrow('string: its escape_interpolation is no part of it under the `b` prefix');
	});

	it('refuses a read interpolation reseated under a bytes prefix', () => {
		expect(() => rendered(seated('f"{x}"').$with.prefix('b'))).toThrow('string: its interpolation is no part of it under the `b` prefix');
		expect(() => rendered(seated('f"a{{b"').$with.prefix('b'))).toThrow('string: its escape_interpolation is no part of it under the `b` prefix');
	});

	it.each(['"{x}"', 'b"{x}"', 'r"{x}"', 'u"{x}"', 'f"{x}"', 'bf"y"'])('keeps %s as read', (source) => {
		const read = seated(source);
		expect(rendered(read.$with.contents(...read.contents()))).toBe(source);
	});
});

describe("a string's prefix reads as its canonical member", () => {
	it.each([
		['"x"', undefined],
		['rb"x"', 'rb'],
		['BR"x"', 'rb'],
		['bR"x"', 'rb'],
		['Rb"x"', 'rb'],
		['F"x"', 'f'],
		['fR"{x}"', 'rf'],
		['T"x"', 't'],
		['U"x"', 'u'],
		['UR"x"', 'ur'],
		['bf"x"', undefined]
	] as const)('%s reads %j', (source, member) => {
		const read = readString(source);
		expect(read.prefix()).toBe(member);
		expect(py.render(py.parse(`${source}\n`)).toString()).toBe(`${source}\n`);
	});

	it.each([
		['BR"x"', 'rb"x"'],
		['Rf"{x}"', 'rf"{x}"'],
		["F'a'", 'f"a"']
	] as const)('rebuilds %s through the builder in canonical spelling', (source, built) => {
		const read = readString(source) as unknown as { prefix(): 'rb' | 'rf' | 'f'; contents(): never };
		expect(rendered(b.string({ prefix: read.prefix(), contents: read.contents() }))).toBe(built);
	});

	it('reads a built spelling as its member', () => {
		expect(b.string({ prefix: 'Rb', contents: content('x') }).prefix()).toBe('rb');
	});
});

describe('a raw string whose content is only escape pairs reads the pairs as content and builds them back', () => {
	it.each([
		['r"\\\\"', 'r', 'r"\\\\"'],
		['r"\\""', 'r', 'r"\\""'],
		["r'\\''", 'r', `r"\\'"`],
		['rb"\\\\"', 'rb', 'rb"\\\\"'],
		['r"""\\\\"""', 'r', 'r"\\\\"'],
		['r"\\\\\\\\"', 'r', 'r"\\\\\\\\"'],
		['r"a\\\\"', 'r', 'r"a\\\\"']
	] as const)('%s', (source, prefix, built) => {
		expect(py.render(py.parse(`${source}\n`)).toString()).toBe(`${source}\n`);
		const read = readString(source);
		expect(read.prefix()).toBe(prefix);
		const text = contentOf(read);
		const out = rendered(b.string({ prefix, contents: content(text) }));
		expect(out).toBe(built);
		expect(readString(out).prefix()).toBe(prefix);
		expect(contentOf(readString(out))).toBe(text);
	});
});

describe('a quote carried from a read', () => {
	const read = (source: string) => readString(source) as unknown as { readonly $with: { contents(...items: unknown[]): { $render(): unknown } } };

	it('stays while the edited content fits it', () => {
		expect(rendered(read("'a'").$with.contents(...content('b')))).toBe("'b'");
	});

	it("falls back to the derivation when the edited content gains it", () => {
		expect(rendered(read("'a'").$with.contents(...content("it's")))).toBe(`"it's"`);
	});
});

describe('a read string keeps the quote it was read with', () => {
	it.each([`x = 'a"b'\n`, `x = """doc"""\n`, `x = rb'q'\n`, `x = f"a{b}"\n`, 'x = `a`\n', `x = r'a\\\\'\n`, `x = r'''a'''\n`])('round-trips %j', (source) => {
		expect(py.render(py.parse(source)).toString()).toBe(source);
	});
});
