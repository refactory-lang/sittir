import { describe, it, expect } from 'vitest';
import type { Diagnostic, GrammarDiagnostic, CompilerDiagnostic, RuntimeDiagnostic, Severity } from '../types/diagnostics.ts';
import { DiagnosticSink, EmitHaltedError } from '../types/diagnostics.ts';

describe('diagnostics model', () => {
	it('discriminates by scope', () => {
		const g: GrammarDiagnostic = { scope: 'grammar', code: 'x', severity: 'error', message: 'm', canProceed: false, grammar: 'rust' };
		const c: CompilerDiagnostic = { scope: 'compiler', code: 'y', severity: 'warning', message: 'm', canProceed: true, phase: 'assemble' };
		const r: RuntimeDiagnostic = { scope: 'runtime', code: 'z', severity: 'info', message: 'm', canProceed: true, stage: 'render' };
		const all = [g, c, r];
		expect(all.map((d) => d.scope)).toEqual(['grammar', 'compiler', 'runtime']);
		// base fields shared:
		const base: Diagnostic = g;
		expect(base.code).toBe('x');
	});
	it('accepts all phase enum values on CompilerDiagnostic', () => {
		const phases: CompilerDiagnostic['phase'][] = ['evaluate', 'link', 'normalize', 'simplify', 'assemble', 'emit'];
		expect(phases).toHaveLength(6);
	});
	it("'fail' is a valid Severity member", () => {
		const s: Severity = 'fail';
		expect(s).toBe('fail');
	});
});

describe('DiagnosticSink', () => {
	it('starts empty', () => {
		const sink = new DiagnosticSink();
		expect(sink.all()).toEqual([]);
		expect(sink.hasBlocking()).toBe(false);
	});

	it('emit() then all() returns items in order', () => {
		const sink = new DiagnosticSink();
		const d1: Diagnostic = { code: 'A', severity: 'info', message: 'first', canProceed: true };
		const d2: Diagnostic = { code: 'B', severity: 'warning', message: 'second', canProceed: true };
		sink.emit(d1);
		sink.emit(d2);
		expect(sink.all()).toEqual([d1, d2]);
	});

	it('fail() sugar sets severity to fail and FORCES canProceed false', () => {
		const sink = new DiagnosticSink();
		sink.fail({ code: 'F1', message: 'bad' });
		const items = sink.all();
		expect(items).toHaveLength(1);
		expect(items[0]!.severity).toBe('fail');
		expect(items[0]!.code).toBe('F1');
		expect(items[0]!.canProceed).toBe(false);
	});

	it('all() returns a copy — external mutation does not corrupt the sink', () => {
		const sink = new DiagnosticSink();
		sink.info({ code: 'I1', message: 'note', canProceed: true });
		(sink.all() as Diagnostic[]).push({ code: 'X', message: 'y', severity: 'fail', canProceed: false });
		expect(sink.all()).toHaveLength(1);
	});

	it('warn() sugar sets severity to warning', () => {
		const sink = new DiagnosticSink();
		sink.warn({ code: 'W1', message: 'meh', canProceed: true });
		expect(sink.all()[0]!.severity).toBe('warning');
	});

	it('info() sugar sets severity to info', () => {
		const sink = new DiagnosticSink();
		sink.info({ code: 'I1', message: 'note', canProceed: true });
		expect(sink.all()[0]!.severity).toBe('info');
	});

	it('hasBlocking() is true only when a fail item exists', () => {
		const sink = new DiagnosticSink();
		sink.emit({ code: 'E', severity: 'error', message: 'err', canProceed: false });
		// error + canProceed:false does NOT block — gate keys on 'fail', not 'error'/'canProceed'
		expect(sink.hasBlocking()).toBe(false);

		sink.fail({ code: 'F', message: 'fatal' });
		expect(sink.hasBlocking()).toBe(true);
	});

	it('hasBlocking() is false for warning/info/error items', () => {
		const sink = new DiagnosticSink();
		sink.warn({ code: 'W', message: 'w', canProceed: true });
		sink.info({ code: 'I', message: 'i', canProceed: true });
		sink.emit({ code: 'E', severity: 'error', message: 'e', canProceed: false });
		expect(sink.hasBlocking()).toBe(false);
	});
});

describe('EmitHaltedError', () => {
	it('is an Error subclass', () => {
		const d: Diagnostic = { code: 'F', severity: 'fail', message: 'fatal', canProceed: false };
		const err = new EmitHaltedError([d]);
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(EmitHaltedError);
	});

	it('carries blocking diagnostics', () => {
		const d: Diagnostic = { code: 'HALT', severity: 'fail', message: 'emit halted', canProceed: false };
		const err = new EmitHaltedError([d]);
		expect(err.blocking).toHaveLength(1);
		expect(err.blocking[0]!.code).toBe('HALT');
	});

	it('message includes code and message of each blocking item', () => {
		const items: Diagnostic[] = [
			{ code: 'F1', severity: 'fail', message: 'first fatal', canProceed: false },
			{ code: 'F2', severity: 'fail', message: 'second fatal', canProceed: false },
		];
		const err = new EmitHaltedError(items);
		expect(err.message).toContain('F1');
		expect(err.message).toContain('first fatal');
		expect(err.message).toContain('F2');
	});
});
