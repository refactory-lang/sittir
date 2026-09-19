import { describe, it, expect } from 'vitest';
import { runCodegen, runFullRegen, runGrammarDiagnosticsPreflight, type CodegenOptions } from '../src/run-codegen.ts';
import type { GrammarDiagnostic } from '../src/compiler/diagnostics/grammar-diagnostics.ts';

describe('run-codegen library surface', () => {
	it('exports runCodegen and runFullRegen as functions', () => {
		expect(typeof runCodegen).toBe('function');
		expect(typeof runFullRegen).toBe('function');
	});
	it('CodegenOptions shape is accepted at the type level', () => {
		const opts: CodegenOptions = { grammar: 'rust', outputDir: 'packages/rust/src', all: true };
		expect(opts.grammar).toBe('rust');
	});

	it('restores SITTIR_INTERNAL_CODEGEN_RUN after a rejected call, so a manifest check made afterward is not skipped', async () => {
		const previous = process.env['SITTIR_INTERNAL_CODEGEN_RUN'];
		delete process.env['SITTIR_INTERNAL_CODEGEN_RUN'];
		try {
			await expect(runCodegen({ grammar: 'rust' } as CodegenOptions)).rejects.toThrow(
				'Missing required argument: --output'
			);
			expect(process.env['SITTIR_INTERNAL_CODEGEN_RUN']).toBeUndefined();
		} finally {
			if (previous === undefined) delete process.env['SITTIR_INTERNAL_CODEGEN_RUN'];
			else process.env['SITTIR_INTERNAL_CODEGEN_RUN'] = previous;
		}
	});
});

const blockedDiagnostic: GrammarDiagnostic = {
	scope: 'grammar',
	code: 'parsekind-noninjective',
	severity: 'warning',
	grammar: 'rust',
	ownerKind: 'host',
	message: 'two branches parse into the same kind at slot `content`',
	canProceed: false
};

describe('the preflight decision reaches the generation gate', () => {
	it('returns the allowed codes when nothing is blocked', async () => {
		const allowed = await runGrammarDiagnosticsPreflight({
			grammar: 'rust',
			allowDiagnostics: new Set(['x']),
			isTTY: false,
			injectedDiagnostics: []
		});
		expect([...allowed]).toEqual(['x']);
	});

	it('adds the blocked codes a confirmed interactive run proceeds past', async () => {
		const allowed = await runGrammarDiagnosticsPreflight({
			grammar: 'rust',
			allowDiagnostics: new Set(),
			isTTY: true,
			injectedDiagnostics: [blockedDiagnostic],
			confirm: async () => true
		});
		expect(allowed.has('parsekind-noninjective')).toBe(true);
	});
});
