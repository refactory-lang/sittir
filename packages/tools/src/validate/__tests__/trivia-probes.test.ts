import { describe, expect, it } from 'vitest';
import { loadLanguageForGrammar } from '../common.ts';
import { detachedRenderer } from './helpers/detached-renderer.ts';

async function sourceRenderer(grammar: string): Promise<(source: string, deep: boolean) => string> {
	const { createEngine } = (await import(`@sittir/${grammar}`)) as {
		createEngine: () => { parse(source: string, options?: { deep?: boolean }): { $render(): string } };
	};
	const engine = createEngine();
	return (source, deep) => engine.parse(source, { deep }).$render();
}

interface Probe {
	readonly source: string;
	readonly detached: string;
	readonly owner?: string;
}

const PROBES: Record<string, readonly Probe[]> = {
	rust: [
		{ source: 'fn f() { // TODO\n}\n', detached: 'fn f() {\n    // TODO\n}' },
		{ source: 'foo(/* none */);\n', detached: 'foo(/* none */);' },
		{ source: 'struct S { /* empty */ }\n', detached: 'struct S {\n    /* empty */\n}' },
		{ source: 'a; // note\n', detached: 'a; // note\n' },
		{ source: '// one\n/* two */\n', detached: '// one\n/* two */' }
	],
	typescript: [
		{
			source: 'function f() { /* empty */ }\n',
			detached: 'function f() {\n    /* empty */\n}\n',
			owner: 'inner of the block: its zero-width automatic_semicolon owns nothing'
		}
	],
	python: [
		{
			source: 'def f():\n    # only a comment\n    pass\n',
			detached: 'def f():\n    # only a comment\n    pass\n',
			owner: 'leading of the body block'
		},
		{
			source: 'if x:\n    a\n# c\nb\n',
			detached: 'if x:\n    a\n# c\nb\n',
			owner: 'leading of the next statement, not trailing of the if block'
		}
	]
};

describe('trivia probes', () => {
	for (const [grammar, probes] of Object.entries(PROBES)) {
		for (const { source, detached, owner } of probes) {
			const name = `${grammar}: ${JSON.stringify(source)}${owner === undefined ? '' : ` (comment is ${owner})`}`;
			it(`${name} renders byte-exact from its read, and detached as its layout`, async () => {
				const render = await sourceRenderer(grammar);
				expect(render(source, false)).toBe(source);
				expect(render(source, true)).toBe(source);
				expect((await detachedRenderer(grammar))(source)).toBe(detached);
			});
		}
	}

	const ORPHANS: Record<string, readonly (readonly [string, string])[]> = {
		typescript: [
			['x = (/* c */ this);', 'x = /* c */ (this);'],
			['x = (/* c */ undefined);', 'x = /* c */ (undefined);'],
			['x = (/* c */ true);', 'x = /* c */ (true);'],
			['x = (/* c */ null);', 'x = /* c */ (null);'],
			['class A extends B { m() { (/* c */ super).m(); } }', 'class A extends B {\n    m() {\n        /* c */ (super).m();\n    }\n}\n'],
			['for (/* c */;;) {}', 'for (;;) /* c */ {}\n'],
			['x = (// c\n this);', 'x = // c\n(this);'],
			['x = (this /* c */);', 'x = (this) /* c */;']
		],
		rust: [
			['fn f() { (/* c */ self); }', 'fn f() {\n    /* c */ (self);\n}'],
			['fn f() { (self /* c */); }', 'fn f() {\n    (self) /* c */;\n}'],
			['fn f() { (// c\n self); }', 'fn f() {\n    // c\n    (self);\n}']
		],
		python: [
			['x = (  # c\n    True)\n', 'x = # c\n(True)\n'],
			['x = (  # c\n    True) + 1\n', 'x = # c\n(True) + 1\n'],
			['a = 1; x = (  # c\n    True)\n', 'a = 1; x = # c\n(True)\n']
		]
	};
	for (const [grammar, cases] of Object.entries(ORPHANS)) {
		for (const [source, detached] of cases) {
			it(`${grammar}: ${JSON.stringify(source)} keeps a comment beside a scalar-stored leaf on the enclosing node`, async () => {
				const rendered = (await detachedRenderer(grammar))(source);
				expect(rendered).toBe(detached);
				const { Parser, lang } = await loadLanguageForGrammar(grammar);
				const parser = new Parser();
				parser.setLanguage(lang);
				expect(parser.parse(rendered)!.rootNode.hasError).toBe(false);
			});
		}
	}
});
