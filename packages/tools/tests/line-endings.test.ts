// Acceptance for the line-ending option on real sources. Each grammar's corpus
// is rendered from a CRLF copy of every entry: under the default the render is
// its LF twin, under '\r\n' every break is CRLF and nothing else differs, and
// the CRLF render parses back to a tree that renders as the same LF text.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';
import { loadCorpusEntries } from '../src/validate/common.ts';

const LONE_BREAK = /(?<!\r)\n|\r(?!\n)/;
const toCrlf = (text: string): string => text.replace(/\r?\n/g, '\r\n');

interface Grammar {
	readonly name: 'rust' | 'typescript' | 'python';
	readonly root: string;
	readonly multiline: readonly [label: string, source: string][];
}

const GRAMMARS: readonly Grammar[] = [
	{
		name: 'rust',
		root: 'sourceFile',
		multiline: [
			['a block comment', '/* one\r\n   two */\r\nfn f() {}\r\n'],
			['a raw string', 'fn f() { let s = r#"one\r\ntwo"#; }\r\n']
		]
	},
	{
		name: 'typescript',
		root: 'program',
		multiline: [
			['a block comment', '/* one\r\n   two */\r\nconst a = 1;\r\n'],
			['a template literal', 'const s = `one\r\ntwo`;\r\n']
		]
	},
	{
		name: 'python',
		root: 'module',
		multiline: [['a triple-quoted string', 's = """one\r\ntwo"""\r\n']]
	}
];

describe.each(GRAMMARS)('line endings on the $name corpus', ({ name, root, multiline }) => {
	const engine = (async () => {
		const language = await languageByName(name);
		const plain = await createEngine(language);
		const crlf = await createEngine(language, { render: { layout: { newline: '\r\n' } } });
		return { plain: plain as never as Engine, crlf: crlf as never as Engine };
	})();

	interface Engine {
		parse(source: string): { readonly $errors: readonly unknown[]; $render(): { toString(): string } };
		render(node: never): { toString(): string };
		build: Record<string, (config: unknown) => never>;
	}

	const renderOf = async (via: 'plain' | 'crlf', source: string): Promise<string> => {
		const engines = await engine;
		return engines[via].render(engines.plain.parse(source) as never).toString();
	};

	const entries = loadCorpusEntries(name);

	it.each(entries.map((entry, index) => [index, entry.name, entry.source] as const))(
		'%i %s: a CRLF source renders as its LF twin by default, and as CRLF throughout under \\r\\n',
		async (_, __, lf) => {
			const crlf = toCrlf(lf);
			const twin = await renderOf('plain', lf);
			expect(await renderOf('plain', crlf)).toBe(twin);
			const out = await renderOf('crlf', crlf);
			expect(out).not.toMatch(LONE_BREAK);
			expect(out.replace(/\r\n/g, '\n')).toBe(twin);
			const engines = await engine;
			const reparsed = engines.plain.parse(out);
			expect(reparsed.$errors.length).toBe(engines.plain.parse(twin).$errors.length);
			expect(engines.plain.render(reparsed as never).toString()).toBe(twin);
		}
	);

	it.each(multiline)('keeps the meaning of %s spanning CRLF lines', async (_, source) => {
		const twin = await renderOf('plain', source.replace(/\r\n/g, '\n'));
		const out = await renderOf('crlf', source);
		expect(out).not.toMatch(LONE_BREAK);
		expect(out.replace(/\r\n/g, '\n')).toBe(twin);
		const engines = await engine;
		expect(engines.plain.parse(out).$errors).toEqual([]);
	});

	it('spells one ending throughout a render that includes an inserted built statement', async () => {
		const engines = await engine;
		const source = loadCorpusEntries(name)
			.map((entry) => toCrlf(entry.source))
			.find((text) => engines.plain.parse(text).$errors.length === 0);
		if (source === undefined) throw new Error('no corpus entry');
		const parsed = engines.plain.parse(source) as unknown as { statements(): readonly never[] };
		const built = engines.crlf.build[root]!({
			statements: [...parsed.statements(), engines.crlf.build['expressionStatement']!(engines.crlf.build['identifier']!('z'))]
		});
		const out = engines.crlf.render(built).toString();
		expect(out).not.toMatch(LONE_BREAK);
		expect(out.endsWith('\r\n')).toBe(true);
		const lf = engines.plain.render(built).toString();
		expect(lf).not.toContain('\r');
		expect(lf.replace(/\n/g, '\r\n')).toBe(out);
	});
});

describe.each([
	['rust', 'fn f() {}\r'],
	['typescript', 'a;\r'],
	['python', 'x = 1\r']
] as const)('a bare-CR %s source', (name, source) => {
	it('keeps its final break under every ending', async () => {
		const language = await languageByName(name);
		const plain = await createEngine(language);
		const twin = plain.render(plain.parse(source.replace(/\r/g, '\n')) as never).toString();
		expect(twin.endsWith('\n')).toBe(true);
		for (const ending of ['\n', '\r\n', '\r'] as const) {
			const engine = await createEngine(language, { render: { layout: { newline: ending } } });
			expect(engine.render(plain.parse(source) as never).toString()).toBe(twin.replace(/\n/g, ending));
		}
	});
});

describe('a comment that swallows the carriage return of its CRLF break', () => {
	it('renders unchanged under \\r\\n and as LF by default', async () => {
		const plain = await createEngine(await languageByName('python'));
		const crlf = await createEngine(await languageByName('python'), { render: { layout: { newline: '\r\n' } } });
		const source = 'x = 1  # note\r\ny = 2\r\n';
		expect(crlf.render(plain.parse(source) as never).toString()).toBe(source);
		expect(plain.render(plain.parse(source) as never).toString()).toBe('x = 1  # note\ny = 2\n');
	});

	it('is one break from the seam after a comment that swallows a bare-CR source to its end', async () => {
		const language = await languageByName('python');
		const plain = await createEngine(language);
		const crlf = await createEngine(language, { render: { layout: { newline: '\r\n' } } });
		const parsed = plain.parse('x = 1  # note\ry = 2\r');
		const built = plain.build.module({
			statements: [...parsed.statements(), plain.build.expressionStatement(plain.build.identifier('z'))]
		});
		expect(plain.render(built).toString()).toBe('x = 1  # note\ny = 2\nz\n');
		expect(crlf.render(built).toString()).toBe('x = 1  # note\r\ny = 2\r\nz\r\n');
	});

	it('is one break after the comment when a statement is built after it', async () => {
		const plain = await createEngine(await languageByName('python'));
		const crlf = await createEngine(await languageByName('python'), { render: { layout: { newline: '\r\n' } } });
		const parsed = plain.parse('x = 1  # note\r\ny = 2\r\n');
		const built = plain.build.module({
			statements: [...parsed.statements(), plain.build.expressionStatement(plain.build.identifier('z'))]
		});
		const out = crlf.render(built).toString();
		const lfParsed = plain.parse('x = 1  # note\ny = 2\n');
		const lfBuilt = plain.build.module({
			statements: [...lfParsed.statements(), plain.build.expressionStatement(plain.build.identifier('z'))]
		});
		expect(out).toContain('# note\r\n');
		expect(out).not.toContain('# note\r\r');
		expect(out).not.toMatch(LONE_BREAK);
		expect(out.replace(/\r\n/g, '\n')).toBe(plain.render(lfBuilt).toString());
	});
});
