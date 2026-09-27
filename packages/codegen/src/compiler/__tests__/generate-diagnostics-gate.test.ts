import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RawGrammar } from '../types.ts';
import type { GrammarDiagnostic } from '../../types/diagnostics.ts';

const evaluated = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock('../evaluate.ts', () => ({ evaluate: vi.fn(async () => evaluated.current) }));
vi.mock('../link.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../link.ts')>();
	return { ...actual, link: vi.fn(actual.link) };
});

function record(code: string, ownerKind: string, canProceed: boolean): GrammarDiagnostic {
	return { scope: 'grammar', grammar: 'fixture', code, severity: canProceed ? 'warning' : 'error', ownerKind, message: code, canProceed };
}

describe('assertGatePasses', () => {
	it('throws on an unfloored blocking record, naming its code', async () => {
		const { assertGatePasses, GrammarDiagnosticError } = await import('../diagnostics/grammar-diagnostics.ts');
		const gate = () => assertGatePasses([record('unclassifiable-shape', 'host', false)], {});
		expect(gate).toThrow(GrammarDiagnosticError);
		expect(gate).toThrow(/unclassifiable-shape/);
	});

	it('a floor for one code does not cover another code on the same owner', async () => {
		const { assertGatePasses } = await import('../diagnostics/grammar-diagnostics.ts');
		const records = [record('unclassifiable-shape', 'host', false), record('union-slot-mixed-row', 'host', false)];
		const gate = () => assertGatePasses(records, { 'unclassifiable-shape': ['host'] });
		expect(gate).toThrow(/union-slot-mixed-row/);
		expect(gate).not.toThrow(/unclassifiable-shape/);
	});

	it('a floor covers its code only on the owners it lists', async () => {
		const { assertGatePasses } = await import('../diagnostics/grammar-diagnostics.ts');
		const records = [record('unclassifiable-shape', 'host', false), record('unclassifiable-shape', 'other', false)];
		expect(() => assertGatePasses(records, { 'unclassifiable-shape': ['host'] })).toThrow(/unclassifiable-shape/);
		expect(() => assertGatePasses(records, { 'unclassifiable-shape': ['host', 'other'] })).not.toThrow();
	});

	it('a non-blocking record never stops the compile', async () => {
		const { assertGatePasses } = await import('../diagnostics/grammar-diagnostics.ts');
		expect(() => assertGatePasses([record('union-slot-routed', 'host', true)], {})).not.toThrow();
	});

	it('an allowed code passes for every owner', async () => {
		const { assertGatePasses } = await import('../diagnostics/grammar-diagnostics.ts');
		const records = [record('parsekind-noninjective', 'host', false), record('parsekind-noninjective', 'other', false)];
		expect(() => assertGatePasses(records, {}, new Set(['parsekind-noninjective']))).not.toThrow();
	});
});

describe('compileGrammar gates link', () => {
	beforeEach(async () => {
		const { link } = await import('../link.ts');
		vi.mocked(link).mockClear();
	});

	it('stops before link on a name the predicted catalog cannot resolve', async () => {
		evaluated.current = {
			name: 'rust',
			rules: {},
			predictedKinds: { failure: "undefined symbol 'missing'", undefinedNames: ['missing'] }
		} as unknown as RawGrammar;
		const { compileGrammar } = await import('../compile.ts');
		const { link } = await import('../link.ts');
		await expect(compileGrammar({ grammar: 'rust' })).rejects.toThrow(/dangling-internal-ref/);
		expect(link).not.toHaveBeenCalled();
	});

	it('stops before link on an expectDiagnostics entry for an unexpectable code', async () => {
		evaluated.current = {
			name: 'rust',
			rules: {},
			expectDiagnostics: { 'dangling-internal-ref': ['host'] }
		} as unknown as RawGrammar;
		const { compileGrammar } = await import('../compile.ts');
		const { link } = await import('../link.ts');
		await expect(compileGrammar({ grammar: 'rust' })).rejects.toThrow(/expect-diagnostics-invalid/);
		expect(link).not.toHaveBeenCalled();
	});
});

describe('generate() rejects a grammar the gate rejects, on its own', () => {
	const unexpectable = { name: 'rust', rules: {}, expectDiagnostics: { 'dangling-internal-ref': ['host'] } };

	it('throws GrammarDiagnosticError before reaching emission', async () => {
		evaluated.current = unexpectable as unknown as RawGrammar;
		const { generate } = await import('../generate.ts');
		const { GrammarDiagnosticError } = await import('../diagnostics/grammar-diagnostics.ts');
		await expect(generate({ grammar: 'rust', outputDir: 'unused' })).rejects.toThrow(GrammarDiagnosticError);
	});

	it('does not raise it for a code the caller allows', async () => {
		evaluated.current = unexpectable as unknown as RawGrammar;
		const { generate } = await import('../generate.ts');
		const { GrammarDiagnosticError } = await import('../diagnostics/grammar-diagnostics.ts');
		const outcome = await generate({
			grammar: 'rust',
			outputDir: 'unused',
			allowDiagnostics: new Set(['expect-diagnostics-invalid'])
		}).then(
			() => undefined,
			(error: unknown) => error
		);
		expect(outcome).not.toBeInstanceOf(GrammarDiagnosticError);
	});
});
