import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../compiler/generated-metadata.ts', async () => {
	const actual = await vi.importActual<typeof import('../compiler/generated-metadata.ts')>(
		'../compiler/generated-metadata.ts'
	);
	return {
		...actual,
		loadGeneratedIdTables: vi.fn(async (grammar: string) => {
			const parserCUrl = new URL(
				`../../../../packages/${grammar}/.sittir/src/parser.c`,
				import.meta.url
			);
			return actual.deriveGeneratedIdTablesFromParserCSource(
				readFileSync(parserCUrl, 'utf8'),
				`packages/${grammar}/.sittir/src/parser.c`
			);
		})
	};
});

import { generate } from '../compiler/generate.ts';

describe('generate — new pipeline end-to-end', () => {
	it('generates all output files for Python', async () => {
		const result = await generate({
			grammar: 'python',
			outputDir: '/tmp/sittir-test-python'
		});

		// All files should be non-empty strings
		expect(result.grammar.length).toBeGreaterThan(0);
		expect(result.types.length).toBeGreaterThan(0);
		expect(result.types).toContain('readonly $type: "');
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
		expect(result.types).toContain('TokSq = "\'"');
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
		expect(result.types).toContain(
			'readonly operator: KindEnum<"&&" | "||" | ">>" | ">>>" | "<<" | "&" | "^" | "|" | "+" | "-" | "*" | "/" | "%" | "**" | "<" | "<=" | "==" | "===" | "!=" | "!==" | ">=" | ">" | "??" | "instanceof" | "in",'
		);
		expect(result.factories.length).toBeGreaterThan(0);
		expect(result.nodeMap.nodes.size).toBeGreaterThan(100);
	}, 30000);
});
