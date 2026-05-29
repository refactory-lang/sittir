import { describe, it, expect } from 'vitest';
import type { Diagnostic, GrammarDiagnostic, CompilerDiagnostic, RuntimeDiagnostic, AnyDiagnostic } from './diagnostics.ts';

describe('diagnostics model', () => {
	it('discriminates by scope', () => {
		const g: GrammarDiagnostic = { scope: 'grammar', code: 'x', severity: 'error', message: 'm', canProceed: false, grammar: 'rust' };
		const c: CompilerDiagnostic = { scope: 'compiler', code: 'y', severity: 'warning', message: 'm', canProceed: true, phase: 'assemble' };
		const r: RuntimeDiagnostic = { scope: 'runtime', code: 'z', severity: 'info', message: 'm', canProceed: true, stage: 'render' };
		const all: AnyDiagnostic[] = [g, c, r];
		expect(all.map((d) => d.scope)).toEqual(['grammar', 'compiler', 'runtime']);
		// base fields shared:
		const base: Diagnostic = g;
		expect(base.code).toBe('x');
	});
	it('accepts all phase enum values on CompilerDiagnostic', () => {
		const phases: CompilerDiagnostic['phase'][] = ['evaluate', 'link', 'normalize', 'simplify', 'assemble', 'emit'];
		expect(phases).toHaveLength(6);
	});
});
