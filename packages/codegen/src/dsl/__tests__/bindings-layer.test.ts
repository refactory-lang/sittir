import { join } from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it, vi } from 'vitest';
import { evaluateDsl } from '../../compiler/evaluate.ts';
import { evaluateSittirGrammar } from '../../compiler/__tests__/_sittir-grammar.ts';

const PACKAGES = join(__dirname, '../../../..');
const require = createRequire(import.meta.url);
const checks = vi.hoisted(() => ({ count: 0 }));

vi.mock('../sittir-grammar.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../sittir-grammar.ts')>();
	const withBindings = <B extends Parameters<typeof actual.sittirGrammar>[0], P, O>(
		...[base, config]: Parameters<typeof actual.sittirGrammar<B, P, O>>
	) => actual.sittirGrammar<B, P, O>(base, { ...config, bindings: config.bindings ?? {} });
	return { ...actual, sittirGrammar: withBindings };
});

vi.mock('../enrich.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../enrich.ts')>();
	return {
		...actual,
		withEnrichSidecarsOf: <G extends object>(grammar: G, enriched: unknown): G => {
			checks.count++;
			return actual.withEnrichSidecarsOf(grammar, enriched);
		}
	};
});

describe('the grammar bindings layer', () => {
	it.each(['rust', 'typescript', 'python', 'regex', 'scm'])(
		"takes %s's wired grammar as a base enrich leaves unchanged",
		async (grammar) => {
			checks.count = 0;
			await expect(evaluateDsl(join(PACKAGES, grammar, 'grammar.sittir.ts'))).resolves.toBeDefined();
			expect(checks.count).toBeGreaterThan(0);
		},
		240_000
	);

	it('refuses a configured layer whose base enrich would reshape', async () => {
		checks.count = 0;
		await expect(
			evaluateSittirGrammar(require.resolve('tree-sitter-c/grammar.js'), 'c', 'bindings: bindings({})')
		).rejects.toThrow(
			/grammar bindings: enrich changes _type_declarator, generic_expression, sized_type_specifier, sized_type_specifier_arm/
		);
		expect(checks.count).toBeGreaterThan(0);
	}, 120_000);
});
