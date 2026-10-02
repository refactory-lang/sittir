import { readFileSync } from 'node:fs';
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { FULL_PIPELINE_TIMEOUT } from '../../__tests__/helpers/timeouts.ts';

vi.mock('../generated-metadata.ts', async () => {
	const actual = await vi.importActual<typeof import('../generated-metadata.ts')>('../generated-metadata.ts');
	return {
		...actual,
		loadGeneratedIdTables: vi.fn(async (grammar: string) => {
			const parserCUrl = new URL(`../../../../../packages/${grammar}/.sittir/src/parser.c`, import.meta.url);
			const grammarJsonUrl = new URL(`../../../../../packages/${grammar}/.sittir/src/grammar.json`, import.meta.url);
			return actual.deriveGeneratedIdTablesFromParserCSource(
				readFileSync(parserCUrl, 'utf8'),
				`packages/${grammar}/.sittir/src/parser.c`,
				JSON.parse(readFileSync(grammarJsonUrl, 'utf8'))
			);
		})
	};
});

import { generate } from '../generate.ts';

type Generated = Awaited<ReturnType<typeof generate>>;

async function generateCapturingStderr(grammar: string): Promise<{ result: Generated; stderr: string }> {
	const original = process.stderr.write.bind(process.stderr);
	let stderr = '';
	process.stderr.write = ((chunk: unknown) => {
		stderr += String(chunk);
		return true;
	}) as typeof process.stderr.write;
	try {
		return { result: await generate({ grammar, outputDir: `/tmp/sittir-test-${grammar}` }), stderr };
	} finally {
		process.stderr.write = original;
	}
}

describe('generate — new pipeline end-to-end', () => {
	describe('Python', () => {
		let generated: Awaited<ReturnType<typeof generateCapturingStderr>>;

		beforeAll(async () => {
			generated = await generateCapturingStderr('python');
		}, FULL_PIPELINE_TIMEOUT);

		it('generates all output files', () => {
			const { result } = generated;

			// All files should be non-empty strings
			expect(result.types.length).toBeGreaterThan(0);
			expect(result.types).toContain('readonly $type: TSKindId.');
			expect(result.factories.length).toBeGreaterThan(0);
			expect(result.consts.length).toBeGreaterThan(0);
			expect(result.index.length).toBeGreaterThan(0);

			// NodeMap should have nodes
			expect(result.nodeMap.nodes.size).toBeGreaterThan(50);
		});

		it('emits no non-literal-separator warning', () => {
			// A choice-of-literals separator is a declared site preference, so no grammar warns.
			expect(generated.stderr).not.toContain('non-literal-separator');
		});
	});

	describe('Rust', () => {
		let generated: Awaited<ReturnType<typeof generateCapturingStderr>>;

		beforeAll(async () => {
			generated = await generateCapturingStderr('rust');
		}, FULL_PIPELINE_TIMEOUT);

		it('generates all output files', () => {
			const { result } = generated;

			expect(result.types.length).toBeGreaterThan(0);
			expect(result.types).toContain('export type TokenKeywords = TSKindId.');
			expect(result.types).toContain('export interface BinaryExpression {');
			expect(result.types).toContain('readonly _operator: number;');
			expect(result.types).toContain(
				'readonly operator: KindEnum<"&&" | "||" | "&" | "|" | "^" | "==" | "!=" | "<" | "<=" | ">" | ">=" | "<<" | ">>" | "+" | "-" | "*" | "/" | "%",'
			);
			expect(result.factories.length).toBeGreaterThan(0);
			expect(result.nodeMap.nodes.size).toBeGreaterThan(100);
		});

		it('emits no non-literal-separator warning', () => {
			expect(generated.stderr).not.toContain('non-literal-separator');
		});
	});

	describe('TypeScript', () => {
		let generated: Awaited<ReturnType<typeof generateCapturingStderr>>;

		beforeAll(async () => {
			generated = await generateCapturingStderr('typescript');
		}, FULL_PIPELINE_TIMEOUT);

		it('generates all output files', () => {
			const { result } = generated;

			expect(result.types.length).toBeGreaterThan(0);
			expect(result.types).toContain('export interface BinaryExpression {');
			// A representative sample of operator tokens, not the full union —
			// hardcoding the whole (now multi-line) KindEnum union makes this
			// brittle to reformatting with no added signal. `in` is deliberately
			// NOT checked here: it has its own slot, storage-named after the kind
			// that slot holds (`_binary_expression_in`), not a member of
			// `operator` — its left-hand side also accepts
			// `private_property_identifier` (for `#field in obj`), which doesn't
			// fit the uniform `left: Expression` shape the other operators share.
			for (const token of ['&&', '||', '**', 'instanceof', '??']) {
				expect(result.types).toContain(`"${token}"`);
			}
			expect(result.types).toContain('_binary_expression_in?: BinaryExpressionIn');
			expect(result.factories.length).toBeGreaterThan(0);
			expect(result.nodeMap.nodes.size).toBeGreaterThan(100);
		});

		it('emits no non-literal-separator warning', () => {
			expect(generated.stderr).not.toContain('non-literal-separator');
		});
	});
});
