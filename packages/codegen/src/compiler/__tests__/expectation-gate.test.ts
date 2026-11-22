import { describe, expect, it } from 'vitest';
import { diagnoseGrammar } from '../compile.ts';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';
import { predictedIdTablesOf } from '../../dsl/symbol-table.ts';

const UPSTREAM = {
	extras: '/\\s/',
	word: 'ident',
	rules: "source: ($) => repeat($.pair), pair: ($) => seq(repeat($.mod), field('name', $.ident), repeat($.mod)), mod: ($) => 'const', ident: ($) => /[a-z]+/"
};

const diagnose = async ([config, allow]: readonly [string, readonly string[]]) => {
	const evaluated = await evaluateTempGrammar(UPSTREAM, config);
	return diagnoseGrammar({
		grammar: 'demo',
		evaluated,
		generatedIdTables: predictedIdTablesOf(evaluated),
		allowDiagnostics: new Set(['indent-undeclared', ...allow])
	});
};

describe('the generation gate and expectDiagnostics', () => {
	it('blocks a final compile whose kind holds two slots of one storage name', async () => {
		const diagnosis = await diagnose(['', []]);
		expect(diagnosis.passed).toBe(false);
		expect(diagnosis.blocked).toContainEqual(expect.objectContaining({ code: 'storagename-collision', ownerKind: 'pair' }));
	}, 60_000);

	it('refuses an expectDiagnostics entry for a storage-name collision', async () => {
		const diagnosis = await diagnose(["expectDiagnostics: { 'storagename-collision': ['pair'] }", []]);
		expect(diagnosis.passed).toBe(false);
		expect(diagnosis.blocked).toContainEqual(
			expect.objectContaining({ code: 'expect-diagnostics-invalid', details: { code: 'storagename-collision' } })
		);
	}, 60_000);

	it('keeps the last slot only in a run that allows the collision, and says so', async () => {
		const diagnosis = await diagnose(['', ['storagename-collision']]);
		expect(diagnosis.passed).toBe(true);
		const collision = diagnosis.grammarDiagnostics.find((d) => d.code === 'storagename-collision');
		expect(collision?.message).toContain('only the last is kept');
	}, 60_000);

	it('blocks an expectDiagnostics entry that matches no diagnostic the compiler raises', async () => {
		const diagnosis = await diagnose(["expectDiagnostics: { 'unclassifiable-shape': ['pair'] }", ['storagename-collision']]);
		expect(diagnosis.passed).toBe(false);
		expect(diagnosis.blocked).toEqual([
			expect.objectContaining({ code: 'expect-diagnostics-stale', ownerKind: 'pair', details: { code: 'unclassifiable-shape' } })
		]);
	}, 60_000);
});
