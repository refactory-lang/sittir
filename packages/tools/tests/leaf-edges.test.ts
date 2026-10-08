import { describe, expect, it } from 'vitest';
import { probeTrace } from '../src/probe/kind.ts';

interface Probe {
	readonly rendered: string;
	readonly wrapped: string;
}

async function probe(grammar: string, source: string, kind: string): Promise<Probe> {
	const trace = await probeTrace(grammar, source, { kind, engine: 'native' });
	const deep = trace.trace.native?.deep;
	return { rendered: deep?.rendered ?? '', wrapped: JSON.stringify(deep?.untypedNode ?? null) };
}

const FORMAT_SPECS: readonly (readonly [source: string, spec: string, kinds: readonly string[]])[] = [
	['f"a {b:2} {c:34.5}"', '2', ['expression_statement', 'string']],
	['f"{a:#06x}"', '#06x', ['expression_statement', 'string']],
	['f"{a=:.2f}"', '.2f', ['expression_statement', 'string']],
	['t"a {b:2} {c:34.5}"', '2', ['expression_statement', 'string']],
	['a = f"{x:>10}"', '>10', ['expression_statement', 'assignment_eq']],
	['b = f"pre{val:.2f}post"', '.2f', ['expression_statement', 'assignment_eq']]
];

describe('a format specifier is content, so no layout lands between its colon and its text', () => {
	for (const [source, spec, kinds] of FORMAT_SPECS) {
		for (const kind of kinds) {
			it(`${kind} of ${source}`, async () => {
				const { rendered, wrapped } = await probe('python', source, kind);
				expect(wrapped, 'wrap layer: the read leaf keeps its text').toContain(`"${spec}"`);
				expect(wrapped).not.toContain(`" ${spec}"`);
				expect(rendered, 'render layer').toContain(`:${spec}`);
				expect(rendered).not.toContain(`: ${spec}`);
			}, 120_000);
		}
	}
});

describe('a newline inside a string fragment is content, so no indentation follows it', () => {
	it('keeps the interpolation of a triple-quoted f-string at the column it had', async () => {
		const source = 'def function():\n    return f"""\n{"string1" if True else\n "string2"}"""';
		const { rendered, wrapped } = await probe('python', source, 'function_definition');
		expect(wrapped, 'wrap layer: the fragment is a bare newline').toContain('"\\n"');
		expect(rendered, 'render layer').toContain('f"""\n{');
		expect(rendered).not.toContain('f"""\n    {');
	}, 120_000);
});

describe('a macro separator leaf keeps its own text', () => {
	const MACROS: readonly (readonly [source: string, kind: string, text: string])[] = [
		['macro_rules! zero_or_one {\n    ($($e:expr),?) => {\n       $($e),?\n    };\n}', 'macro_definition_brace', '),?'],
		['macro_rules! _m { () => {\n  $($($x + $e),*),*\n} }', 'macro_definition_brace', '),*'],
		['macro_rules! _m { () => {\n  $($e),?\n} }', 'token_tree_brace', '),?']
	];
	for (const [source, kind, text] of MACROS) {
		it(`${kind} of ${JSON.stringify(source.slice(0, 40))}`, async () => {
			const { rendered, wrapped } = await probe('rust', source, kind);
			expect(wrapped, 'wrap layer: the separator is a bare comma').toContain('","');
			expect(rendered, 'render layer').toContain(text);
			expect(rendered).not.toContain(' , ');
		}, 120_000);
	}
});
