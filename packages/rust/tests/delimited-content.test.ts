import { describe, expect, it } from 'vitest';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rs = await createEngine(rust);
const b = rs.build;

const raw = (prefix: 'r' | 'br' | 'cr', content: string) => String(b.rawStringLiteral({ prefix, stringContent: b.rawStringLiteralContent(content) }).$render());

describe('a built raw string takes the shortest hash run its content fits', () => {
	it.each([
		['r', 'abc', 'r"abc"'],
		['r', 'a#b', 'r"a#b"'],
		['r', 'a"b', 'r#"a"b"#'],
		['br', 'a"#b', 'br##"a"#b"##'],
		['cr', 'foo #"# bar', 'cr##"foo #"# bar"##'],
		['r', 'x" + y + r"', 'r#"x" + y + r""#']
	] as const)('%s %j renders %j', (prefix, content, expected) => {
		expect(raw(prefix, content)).toBe(expected);
	});
});

describe('a read raw string keeps the hashes it was read with while its content fits them', () => {
	it.each(['fn f() { let x = r##"a"##; }\n', 'fn f() { let x = br#"a"b"#; }\n'])('round-trips %j', (source) => {
		expect(rs.render(rs.parse(source)).toString()).toBe(source);
	});
});

describe('a hash run carried from a read', () => {
	const read = (source: string) =>
		(rs.parse(source) as unknown as { statements(): readonly { value(): { readonly $with: { stringContent(content: unknown): { $render(): unknown } } } }[] }).statements()[0]!.value();

	it('stays while the edited content fits it, and grows when the content gains its closer', () => {
		const string = read('const X: &str = r#"a"#;\n');
		expect(String(string.$with.stringContent(b.rawStringLiteralContent('b')).$render())).toBe('r#"b"#');
		expect(String(string.$with.stringContent(b.rawStringLiteralContent('x"#y')).$render())).toBe('r##"x"#y"##');
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
