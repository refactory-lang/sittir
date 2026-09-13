import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../generated-metadata.ts', async () => {
	const actual = await vi.importActual<typeof import('../generated-metadata.ts')>('../generated-metadata.ts');
	return {
		...actual,
		loadGeneratedIdTables: vi.fn(async (grammar: string) => {
			const parserCUrl = new URL(`../../../../../packages/${grammar}/.sittir/src/parser.c`, import.meta.url);
			return actual.deriveGeneratedIdTablesFromParserCSource(
				readFileSync(parserCUrl, 'utf8'),
				`packages/${grammar}/.sittir/src/parser.c`
			);
		})
	};
});

import { generate } from '../generate.ts';

describe('generate — new pipeline end-to-end', () => {
	it('generates all output files for Python', async () => {
		const result = await generate({
			grammar: 'python',
			outputDir: '/tmp/sittir-test-python'
		});

		// All files should be non-empty strings
		expect(result.grammar.length).toBeGreaterThan(0);
		expect(result.types.length).toBeGreaterThan(0);
		expect(result.types).toContain('readonly $type: TSKindId.');
		expect(result.factories.length).toBeGreaterThan(0);
		expect(result.consts.length).toBeGreaterThan(0);
		expect(result.index.length).toBeGreaterThan(0);

		// NodeMap should have nodes
		expect(result.nodeMap.nodes.size).toBeGreaterThan(50);
	}, 30000);

	it('generates all output files for Rust', async () => {
		const result = await generate({
			grammar: 'rust',
			outputDir: '/tmp/sittir-test-rust'
		});

		expect(result.grammar.length).toBeGreaterThan(0);
		expect(result.types.length).toBeGreaterThan(0);
		expect(result.types).toContain('export type TokenKeywords = TSKindId.');
		expect(result.types).toContain('export interface BinaryExpression {');
		expect(result.types).toContain('readonly _operator: number;');
		expect(result.types).toContain(
			'readonly operator: KindEnum<"&&" | "||" | "&" | "|" | "^" | "==" | "!=" | "<" | "<=" | ">" | ">=" | "<<" | ">>" | "+" | "-" | "*" | "/" | "%",'
		);
		expect(result.factories.length).toBeGreaterThan(0);
		expect(result.nodeMap.nodes.size).toBeGreaterThan(100);
	}, 30000);

	it('generates all output files for TypeScript', async () => {
		const result = await generate({
			grammar: 'typescript',
			outputDir: '/tmp/sittir-test-typescript'
		});

		expect(result.grammar.length).toBeGreaterThan(0);
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
	}, 30000);
});

describe('generate() — non-literal-separator diagnostic', () => {
	function captureStderr(): { get: () => string; restore: () => void } {
		const original = process.stderr.write.bind(process.stderr);
		let captured = '';
		process.stderr.write = ((chunk: unknown) => {
			captured += String(chunk);
			return true;
		}) as typeof process.stderr.write;
		return {
			get: () => captured,
			restore: () => {
				process.stderr.write = original;
			}
		};
	}

	it('generate() emits no non-literal-separator warning for any grammar', async () => {
		// A choice-of-literals separator is a declared site preference, so no grammar warns.
		const cases: readonly [string, number][] = [
			['rust', 0],
			['python', 0],
			['typescript', 0]
		];
		for (const [grammar, expectedCount] of cases) {
			const capture = captureStderr();
			let stderrOutput = '';
			try {
				await generate({ grammar, outputDir: `/tmp/sittir-test-${grammar}-diag-probe` });
			} finally {
				stderrOutput = capture.get();
				capture.restore();
			}
			const occurrences = (stderrOutput.match(/non-literal-separator/g) ?? []).length;
			expect(occurrences, `${grammar}: expected ${expectedCount} non-literal-separator occurrence(s)`).toBe(
				expectedCount
			);
		}
	}, 90000);
});
