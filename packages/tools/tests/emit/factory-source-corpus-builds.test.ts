import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { emitFactorySourceText } from '../../src/emit/factory-source.ts';
import { languageByName } from '../../src/languages.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRATCH = join(HERE, '__scratch__');

async function rebuildAndRender(grammar: 'rust' | 'typescript' | 'regex', input: string): Promise<{ source: string; rendered: string }> {
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
		expect(source).toContain('throwStatement.strict(ts.build.stringDouble.strict(');
		expect(source).toContain('literalType.strict(ts.build.stringDouble.strict(');
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

	it('typescript: an owner forwarding to a list with options of its own is printed with the list built as its value, its options second', async () => {
		const { source, rendered } = await rebuildAndRender('typescript', 'class A {\n  static {\n    x = 1;\n  }\n}\n');
		expect(source).toContain('ts.build.classStaticBlock.strict(ts.build.statementBlock.strict(');
		expect(rendered.replace(/\s+/g, ' ')).toContain('static { x = 1; }');
	});

	it('rust: a comment with extra slashes is built from its text by the variant', async () => {
		const { source, rendered } = await rebuildAndRender('rust', '//// - Only a comment\nfn f() {}\n');
		expect(source).toContain('extraSlashes.strict("// - Only a comment")');
		expect(source).not.toContain('identifier("// - Only a comment")');
		expect(rendered).toContain('//// - Only a comment');
	});

	it('regex: a count quantifier with a range and a unicode property value both build', async () => {
		const range = await rebuildAndRender('regex', 'a{4}b{2,3}\n');
		expect(range.rendered).toBe('a{4}b{2,3}');
		const property = await rebuildAndRender('regex', '\\p{Script=Greek}\n');
		expect(property.rendered).toBe('\\p{Script=Greek}');
	});
});
