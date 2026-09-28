import { describe, expect, it } from 'vitest';
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

	// Follow-up: the reader gives this comment to the header's first empty_statement, which its slot stores as a
	// kind id, so the entry has nowhere to live. Flips once a scalar-stored child no longer owns trivia.
	it.fails('typescript: a comment in a for header survives a detached read (scalar-stored owner follow-up)', async () => {
		expect((await detachedRenderer('typescript'))('for (/*a*/;;) {}\n')).toContain('/*a*/');
	});
});
