import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import { REPEAT, SEQ, CHOICE, STRING, SYMBOL } from '../../types/rule-types.ts';
import type { RawGrammar } from '../types.ts';
import { link } from '../link.ts';
import { DiagnosticSink, type CompilerDiagnostic } from '../../types/diagnostics.ts';
import { formatCompilerDiagnostics } from '../diagnostics/grammar-diagnostics.ts';

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
		expect(result.types).toContain('export type TokenKeywords = Terminal<');
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
		// NOT checked here: it has its own field (`_binary_expression_arm`),
		// not a member of `operator` — its left-hand side also accepts
		// `private_property_identifier` (for `#field in obj`), which doesn't
		// fit the uniform `left: Expression` shape the other operators share.
		for (const token of ['&&', '||', '**', 'instanceof', '??']) {
			expect(result.types).toContain(`"${token}"`);
		}
		expect(result.types).toContain('_binary_expression_arm?: BinaryExpressionArm');
		expect(result.factories.length).toBeGreaterThan(0);
		expect(result.nodeMap.nodes.size).toBeGreaterThan(100);
	}, 30000);
});

describe('generate() — non-literal-separator diagnostic surfacing (PR-S task 5, Stage 2)', () => {
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

	it('formatCompilerDiagnostics renders the non-literal-separator warning generate() would print for a rule with a non-literal separator', () => {
		// generate() has no hook to feed it a synthetic in-memory grammar —
		// `cfg.grammar` resolves to a real packages/<grammar>/grammar.js plus a
		// pre-built .sittir/src/parser.c (for loadGeneratedIdTables). Building a
		// full tree-sitter fixture purely to exercise a stderr print is
		// disproportionate — especially since real grammars only trip this in
		// ONE narrow, already-documented spot today (see the live-grammar test
		// below). This instead exercises the exact two production units
		// generate.ts's new code composes: `link()` (which, now that it's
		// threaded a `DiagnosticSink` via PR-S task 5's `LinkOptions.diagnostics`,
		// emits the `non-literal-separator` CompilerDiagnostic through
		// `liftSeparators`) and `formatCompilerDiagnostics()` (generate.ts's new
		// formatter) — the same code path generate() runs, minus the
		// filesystem/tree-sitter plumbing around it.
		const raw: RawGrammar = {
			name: 'test',
			rules: {
				items: {
					type: REPEAT,
					content: {
						type: SEQ,
						members: [
							{
								type: CHOICE,
								members: [
									{ type: STRING, value: ',' },
									{ type: STRING, value: ';' }
								]
							},
							{ type: SYMBOL, name: 'item' }
						]
					}
				},
				item: { type: STRING, value: 'x' }
			},
			ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
			extras: [],
			externals: [],
			supertypes: [],
			factoryInline: [],
			inline: [],
			conflicts: [],
			word: null,
			references: []
		};
		const diagnostics = new DiagnosticSink();
		link(raw, { diagnostics });
		const warnings = diagnostics
			.all()
			.filter(
				(d): d is CompilerDiagnostic => d.severity === 'warning' && (d as { scope?: unknown }).scope === 'compiler'
			);
		expect(warnings).toHaveLength(1);
		const rendered = formatCompilerDiagnostics(warnings);
		expect(rendered).toContain('non-literal-separator');
		expect(rendered).toContain('(link)');
	});

	it('rust and python generate() runs are silent; typescript surfaces exactly one known non-literal-separator gap', async () => {
		// Empirical "0 witnesses" proof for rust and python. TypeScript is
		// NOT silent — ground truth (verified empirically, not assumed): one
		// repeat shape still carries a genuine CHOICE separator (a real,
		// documented rendering gap — tracked in the diagnostic itself via the
		// non-slot-separator-rules design doc). This used to be TWO sites:
		// `object_type`'s inherited pre-refine shape and `interface_body`'s
		// synthesized `_object_type_optional1` wrapper. The object_type
		// rewrite replaced that wrapper with the `object_type_content`
		// separated-list kind, whose separator is a captured runtime slot
		// (`_separator`) rather than an unsupported CHOICE template —
		// the wrapper kind no longer exists in grammar.json/node-model, so
		// its diagnostic legitimately stopped firing. The assertion pins the
		// count so a REGRESSION (more occurrences, or occurrences in
		// rust/python) fails loudly.
		const cases: readonly [string, number][] = [
			['rust', 0],
			['python', 0],
			['typescript', 1]
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
