// Acceptance for the line-ending option on real sources. Each grammar's corpus
// is rendered from a CRLF copy of every entry: under the default the render is
// its LF twin, under '\r\n' every break is CRLF and nothing else differs, and
// the CRLF render parses back to a tree that renders as the same LF text.
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';
import { loadCorpusEntries, loadLanguageForGrammar, treeParser } from '../src/validate/common.ts';

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
		const built = engines.plain.build[root]!({
			statements: [...parsed.statements(), engines.plain.build['expressionStatement']!(engines.plain.build['identifier']!('z'))]
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
		for (const ending of ['\n', '\r\n'] as const) {
			const engine = await createEngine(language, { render: { layout: { newline: ending } } });
			expect(engine.render(plain.parse(source) as never).toString()).toBe(twin.replace(/\n/g, ending));
		}
	});
});

describe('a leaf whose text ends in a bare carriage return', () => {
	it('keeps that break: a template literal is not a line-terminated kind', async () => {
		const language = await languageByName('typescript');
		const plain = await createEngine(language);
		const crlf = await createEngine(language, { render: { layout: { newline: '\r\n' } } });
		const parsed = plain.parse('const s = `one\r`;\r\n');
		const built = plain.build.program({
			statements: [...parsed.statements(), plain.build.expressionStatement(plain.build.identifier('z'))]
		});
		expect(plain.render(built).toString()).toContain('`one\n`');
		expect(crlf.render(built).toString()).toContain('`one\r\n`');
	});
});

describe.each(['object', 'arena'] as const)('text a caller supplies, in %s storage', (nodeStorage) => {
	interface Built {
		readonly $trivia: { leading(text: string): Built; trailing(text: string): Built };
	}
	interface CallerEngine {
		parse(source: string): { statements(): readonly Built[] };
		render(node: unknown): { toString(): string };
		build: {
			comment: { block(text: string): Built };
			expressionStatement(expression: Built): Built;
			identifier(text: string): Built;
		};
	}

	it.each([
		['a CRLF', '\r\n'],
		['a lone CR', '\r']
	] as const)('spells %s in a built leaf and a written side as the render ending', async (_, br) => {
		const language = await languageByName('typescript');
		for (const newline of ['\n', '\r\n'] as const) {
			const ts = (await createEngine(language, {
				nodeStorage,
				render: { layout: { newline } }
			})) as never as CallerEngine;
			const spelled = (lf: string): string => lf.replace(/\n/g, newline);
			const comment = `/* a${br}b */`;
			const statement = (): Built => ts.build.expressionStatement(ts.build.identifier('x'));
			const parsed = ts.parse('x;\ny;\n');
			const [first, second] = parsed.statements();
			first!.$trivia.trailing(comment);
			second!.$trivia.leading(comment);
			expect(ts.render(ts.build.comment.block(` a${br}b `)).toString()).toBe(spelled('/* a\nb */'));
			expect(ts.render(statement().$trivia.leading(comment)).toString()).toBe(spelled('/* a\nb */ x;'));
			expect(ts.render(statement().$trivia.trailing(comment)).toString()).toBe(spelled('x; /* a\nb */'));
			expect(ts.render(parsed).toString()).toBe(spelled('x; /* a\nb */\n/* a\nb */ y;\n'));
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

describe.each([
	['rust', '// c\nfn f() {}\nfn g() {}\n', ['\n', '\r\n']],
	['typescript', '#!/usr/bin/env node\n// c\nconst a = 1\nlet b = 2\n', ['\n', '\r\n']],
	['python', '# c\nx = 1\ny = 2\n', ['\n', '\r\n']],
	['scm', '; c\n(a)\n(b)\n', ['\n', '\r\n']],
	['regex', 'a\nb', ['\n', '\r\n']]
] as const)('the line endings %s admits', (name, source, admitted) => {
	const endings = (async () => {
		const language = await languageByName(name as string);
		const accepted = await Promise.all(
			(['\n', '\r\n', '\r'] as const).map(async (newline) => {
				const engine = await createEngine(language, { render: { layout: { newline } } } as never).catch(() => undefined);
				return engine === undefined ? [] : [[newline, engine as never as { parse(text: string): never; render(node: never): { toString(): string } }] as const];
			})
		);
		return accepted.flat();
	})();
	const tree = async (text: string): Promise<string> => {
		using parser = treeParser(await loadLanguageForGrammar(name));
		using parsed = parser.parse(text);
		return parsed.root.toString();
	};

	it('are the arms its parser reads as a line break', async () => {
		expect((await endings).map(([newline]) => newline)).toEqual(admitted);
	});

	it('render a source as text its parser reads as it reads the source', async () => {
		const expected = await tree(source);
		for (const [newline, engine] of await endings) {
			expect(await tree(engine.render(engine.parse(source)).toString()), JSON.stringify(newline)).toBe(expected);
		}
	});
});
