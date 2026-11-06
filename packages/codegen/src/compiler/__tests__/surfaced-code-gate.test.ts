import { describe, expect, it } from 'vitest';
import { assertCompilation, diagnoseGrammar, type Compilation } from '../compile.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { grammarPackage } from '../../grammars.ts';
import { predictedIdTablesOf } from '../../dsl/symbol-table.ts';
import { EmitHaltedError } from '../../types/diagnostics.ts';

const UPSTREAM = {
	extras: '/\\s/',
	word: 'word',
	rules: "source: ($) => repeat(choice($.word, $.ident)), ident: ($) => token(seq(optional('@'), /[a-z_]+/))"
};

const diagnose = async (config: string) => {
	const evaluated = await evaluateTempGrammar(UPSTREAM, config);
	return { evaluated, diagnosis: diagnoseGrammar({ grammar: 'demo', evaluated, generatedIdTables: predictedIdTablesOf(evaluated), allowDiagnostics: new Set(['indent-undeclared']) }) };
};

describe('a surfaced compiler code is gated once, by the generation gate', () => {
	it('blocks the generation gate when nothing expects it', async () => {
		const { diagnosis } = await diagnose('');
		expect(diagnosis.passed).toBe(false);
		expect(diagnosis.blocked.map((d) => d.code)).toContain('token-interior-unstructurable');
	}, 60_000);

	it('lets an expected record through the generation gate and through assertCompilation, the token staying opaque', async () => {
		const { diagnosis } = await diagnose("expectDiagnostics: { 'token-interior-unstructurable': ['ident'] }");
		if (!diagnosis.passed) throw new Error(`gate blocked: ${diagnosis.blocked.map((d) => d.code).join(', ')}`);
		const { raw, linked, normalized, nodeMap, compilerDiagnostics, slotGroupingDiagnostics } = diagnosis.collected;
		expect(compilerDiagnostics.all().some((d) => d.code === 'token-interior-unstructurable' && d.severity === 'fail')).toBe(true);
		const compilation: Compilation = {
			grammar: 'demo',
			package: grammarPackage('rust'),
			generatedIdTables: linked.generatedIdTables,
			raw,
			linked,
			normalized,
			nodeMap,
			diagnostics: compilerDiagnostics,
			slotGroupingDiagnostics,
			grammarDiagnostics: diagnosis.grammarDiagnostics,
			diagnosticRecords: diagnosis.diagnosticRecords
		};
		expect(() => assertCompilation(compilation)).not.toThrow();
		expect(JSON.stringify(linked.rules.ident)).not.toContain('"FIELD"');
	}, 60_000);

	it('still halts on a fail the generation gate does not own', async () => {
		const { diagnosis } = await diagnose("expectDiagnostics: { 'token-interior-unstructurable': ['ident'] }");
		if (!diagnosis.passed) throw new Error('gate blocked');
		const { compilerDiagnostics } = diagnosis.collected;
		compilerDiagnostics.fail({ code: 'HALT', message: 'not surfaced' });
		const { raw, linked, normalized, nodeMap, slotGroupingDiagnostics } = diagnosis.collected;
		expect(() =>
			assertCompilation({
				grammar: 'demo',
				package: grammarPackage('rust'),
				generatedIdTables: linked.generatedIdTables,
				raw,
				linked,
				normalized,
				nodeMap,
				diagnostics: compilerDiagnostics,
				slotGroupingDiagnostics,
				grammarDiagnostics: [],
				diagnosticRecords: []
			})
		).toThrow(EmitHaltedError);
	}, 60_000);
});
