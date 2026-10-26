import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { emitFactorySourceText } from '../../src/emit/factory-source.ts';
import { languageByName } from '../../src/languages.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRATCH = join(HERE, '__scratch__');

async function rebuildAndRender(grammar: 'rust' | 'typescript' | 'python' | 'regex', input: string): Promise<{ source: string; rendered: string }> {
	const source = await emitFactorySourceText(grammar, input, 'rebuild');
	mkdirSync(SCRATCH, { recursive: true });
	const file = join(SCRATCH, `${grammar}-${Math.random().toString(36).slice(2)}.ts`);
	writeFileSync(file, source);
	try {
		const mod = (await import(/* @vite-ignore */ pathToFileURL(file).href)) as { rebuild(): unknown };
		const engine = await createEngine(await languageByName(grammar));
		return { source, rendered: engine.render(mod.rebuild() as never).toString() };
	} finally {
		rmSync(file, { force: true });
	}
}

describe('a corpus entry rebuilds through the printed builder source and renders', () => {
	it('typescript: a string in an expression or type slot keeps its string node', async () => {
		const { source, rendered } = await rebuildAndRender('typescript', 'throw "boom";\ntype T = "lit";\n');
		expect(source).toContain('throwStatement(ts.build.stringDouble(');
		expect(source).toContain('literalType(ts.build.stringDouble(');
		expect(rendered).toContain('"boom"');
		expect(rendered).toContain('"lit"');
	});

	it('typescript: a reserved word after a dot is an identifier placed in the property slot of the member', async () => {
		const { source, rendered } = await rebuildAndRender('typescript', 'Symbol.for("bar");\nx.class;\n');
		expect(source).toContain('property: ts.build.identifier("for")');
		expect(source).toContain('property: ts.build.identifier("class")');
		expect(rendered).toContain('Symbol.for("bar")');
		expect(rendered).toContain('x.class');
	});

	it('typescript: an optional or definite marker on a class member sits tight against its name', async () => {
		const members = ['public readonly async bar?<T>();', 'abstract baz?(): void;', 'qux?() {}', 'requiredProp!: string;'];
		const { rendered } = await rebuildAndRender('typescript', `abstract class A {\n${members.map((m) => `  ${m}\n`).join('')}}\n`);
		for (const member of members) expect(rendered).toContain(member);
	});

	it('typescript: a definite variable and an optional tuple element sit tight against their marker', async () => {
		const lines = ['let x!: number;', 'type T = [x?: number, number?];'];
		const { rendered } = await rebuildAndRender('typescript', lines.map((l) => `${l}\n`).join(''));
		for (const line of lines) expect(rendered).toContain(line);
	});

	it('typescript: an owner forwarding to a list with options of its own is printed with the list built as its value, its options second', async () => {
		const { source, rendered } = await rebuildAndRender('typescript', 'class A {\n  static {\n    x = 1;\n  }\n}\n');
		expect(source).toContain('ts.build.classStaticBlock(ts.build.statementBlock(');
		expect(rendered.replace(/\s+/g, ' ')).toContain('static { x = 1; }');
	});

	it('rust: a comment with extra slashes is built from its text by the variant', async () => {
		const { source, rendered } = await rebuildAndRender('rust', '//// - Only a comment\nfn f() {}\n');
		expect(source).toContain('extraSlashes("// - Only a comment")');
		expect(source).not.toContain('identifier("// - Only a comment")');
		expect(rendered).toContain('//// - Only a comment');
	});

	it('python: a negative literal on either side of a union pattern, or as a mapping key, rebuilds', async () => {
		for (const pattern of ['-1 | 2', '2 | -1', '{-1: y}']) {
			const input = `match x:\n    case ${pattern}:\n        pass\n`;
			const { rendered } = await rebuildAndRender('python', input);
			expect(rendered).toBe(input);
		}
		const { source } = await rebuildAndRender('python', 'match x:\n    case -1 | 2:\n        pass\n');
		expect(source).toContain('py.build.simplePattern.negative(');
	});

	it('python: every = site rebuilds in its idiom, spaced for an assignment, an annotated default and a type alias, tight for a keyword and a debug interpolation', async () => {
		const inputs = [
			'x = 1\n',
			'x: int = 1\n',
			'type X = int\n',
			'def f(a=1, b: int = 2):\n    pass\n',
			'f(a=1)\n',
			'match x:\n    case C(k=1):\n        pass\n',
			'f"{x=}"\n',
			'f"{x=!r:>10}"\n'
		];
		for (const input of inputs) expect((await rebuildAndRender('python', input)).rendered).toBe(input);
	});

	it('regex: a count quantifier with a range and a unicode property value both build', async () => {
		const range = await rebuildAndRender('regex', 'a{4}b{2,3}\n');
		expect(range.rendered).toBe('a{4}b{2,3}');
		const property = await rebuildAndRender('regex', '\\p{Script=Greek}\n');
		expect(property.rendered).toBe('\\p{Script=Greek}');
	});
});
