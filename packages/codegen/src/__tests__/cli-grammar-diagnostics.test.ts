/**
 * Tests for the codegen CLI grammar-diagnostics preflight gate.
 *
 * These tests exercise the `runCodegenCli` export in isolation by injecting
 * full GrammarDiagnostic objects (bypassing real grammar loading) and, for
 * interactive cases, an injected `confirm` callback instead of stdin.
 *
 * Gate policy:
 * - Non-interactive + blocking diagnostic + NOT in allow-list → throws GrammarDiagnosticError
 * - Non-interactive + blocking diagnostic + IN allow-list     → resolves 0
 * - Non-interactive + no blocking diagnostics                 → resolves 0
 * - Interactive + user confirms "y"                           → resolves 0
 * - Interactive + user declines "n"                          → throws GrammarDiagnosticError
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCodegenCli } from '../run-codegen.ts';
import type { GrammarDiagnostic } from '../compiler/grammar-diagnostics.ts';

/** Build a minimal-but-valid GrammarDiagnostic for preflight gate tests. */
function makeDiagnostic(
	code: string,
	opts: { canProceed?: boolean; ownerKind?: string } = {}
): GrammarDiagnostic {
	return {
		scope: 'grammar',
		code,
		severity: 'error',
		grammar: 'test-grammar',
		ownerKind: opts.ownerKind ?? '_test_kind',
		message: `Diagnostic: ${code}`,
		canProceed: opts.canProceed ?? false
	};
}

const BASE_ARGV = ['--grammar', 'rust', '--all', '--output', 'packages/rust/src'] as const;

describe('codegen CLI grammar-diagnostics preflight', () => {
	beforeEach(() => {
		vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// -------------------------------------------------------------------------
	// Non-interactive cases
	// -------------------------------------------------------------------------
	it('fails in non-interactive mode when a blocking code is not allowlisted', async () => {
		await expect(
			runCodegenCli([...BASE_ARGV], {
				isTTY: false,
				diagnostics: [makeDiagnostic('parsekind-noninjective')]
			})
		).rejects.toThrow(/parsekind-noninjective/);
	});

	it('fails with GrammarDiagnosticError in non-interactive mode', async () => {
		const { GrammarDiagnosticError } = await import('../compiler/grammar-diagnostics.ts');
		await expect(
			runCodegenCli([...BASE_ARGV], {
				isTTY: false,
				diagnostics: [makeDiagnostic('parsekind-noninjective')]
			})
		).rejects.toBeInstanceOf(GrammarDiagnosticError);
	});

	it('continues when the blocking code is explicitly allowlisted via --allow-diagnostic', async () => {
		await expect(
			runCodegenCli(
				[...BASE_ARGV, '--allow-diagnostic', 'parsekind-noninjective'],
				{
					isTTY: false,
					diagnostics: [makeDiagnostic('parsekind-noninjective')]
				}
			)
		).resolves.toBe(0);
	});

	it('resolves 0 when there are no blocking diagnostics', async () => {
		await expect(
			runCodegenCli([...BASE_ARGV], {
				isTTY: false,
				diagnostics: []
			})
		).resolves.toBe(0);
	});

	it('supports --allow-diagnostic repeated for multiple codes', async () => {
		await expect(
			runCodegenCli(
				[...BASE_ARGV, '--allow-diagnostic', 'parsekind-noninjective', '--allow-diagnostic', 'other-code'],
				{
					isTTY: false,
					diagnostics: [
						makeDiagnostic('parsekind-noninjective'),
						makeDiagnostic('other-code')
					]
				}
			)
		).resolves.toBe(0);
	});

	it('still fails when only one of multiple blocking codes is allowlisted', async () => {
		await expect(
			runCodegenCli(
				[...BASE_ARGV, '--allow-diagnostic', 'parsekind-noninjective'],
				{
					isTTY: false,
					diagnostics: [
						makeDiagnostic('parsekind-noninjective'),
						makeDiagnostic('another-blocking-code')
					]
				}
			)
		).rejects.toThrow(/another-blocking-code/);
	});

	// -------------------------------------------------------------------------
	// Interactive cases — confirmed via injected `confirm` callback so no
	// stdin mocking is needed.
	// -------------------------------------------------------------------------
	it('continues in interactive mode when the injected confirm callback returns true', async () => {
		await expect(
			runCodegenCli([...BASE_ARGV], {
				isTTY: true,
				diagnostics: [makeDiagnostic('parsekind-noninjective')],
				confirm: async () => true
			})
		).resolves.toBe(0);
	});

	it('fails in interactive mode when the injected confirm callback returns false', async () => {
		await expect(
			runCodegenCli([...BASE_ARGV], {
				isTTY: true,
				diagnostics: [makeDiagnostic('parsekind-noninjective')],
				confirm: async () => false
			})
		).rejects.toThrow(/parsekind-noninjective/);
	});

	it('does not invoke confirm when all blocking codes are allowlisted', async () => {
		let confirmCalled = false;
		await expect(
			runCodegenCli(
				[...BASE_ARGV, '--allow-diagnostic', 'parsekind-noninjective'],
				{
					isTTY: true,
					diagnostics: [makeDiagnostic('parsekind-noninjective')],
					confirm: async () => { confirmCalled = true; return true; }
				}
			)
		).resolves.toBe(0);
		expect(confirmCalled).toBe(false);
	});

	it('confirm receives the blocked (non-allowed) diagnostics', async () => {
		let receivedBlocked: readonly GrammarDiagnostic[] = [];
		await runCodegenCli(
			[...BASE_ARGV, '--allow-diagnostic', 'parsekind-noninjective'],
			{
				isTTY: true,
				diagnostics: [
					makeDiagnostic('parsekind-noninjective'),
					makeDiagnostic('another-code')
				],
				confirm: async (blocked) => { receivedBlocked = blocked; return true; }
			}
		);
		expect(receivedBlocked).toHaveLength(1);
		expect(receivedBlocked[0]?.code).toBe('another-code');
	});
});
