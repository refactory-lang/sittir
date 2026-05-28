/**
 * Tests for the codegen CLI grammar-diagnostics preflight gate.
 *
 * These tests exercise the `runCodegenCli` export in isolation by injecting
 * diagnostics directly (bypassing real grammar loading). The gate logic is:
 *
 * - Non-interactive + blocking diagnostic + NOT in allow-list → throws GrammarDiagnosticError
 * - Non-interactive + blocking diagnostic + IN allow-list → resolves 0
 * - Non-interactive + no blocking diagnostics → resolves 0
 */
import { describe, expect, it } from 'vitest';
import { runCodegenCli } from '../cli.ts';

describe('codegen CLI grammar-diagnostics preflight', () => {
	it('fails in non-interactive mode when a blocking code is encountered and not allowlisted', async () => {
		await expect(
			runCodegenCli(['--grammar', 'rust', '--all', '--output', 'packages/rust/src'], {
				isTTY: false,
				diagnostics: [{ code: 'parsekind-noninjective', canProceed: false }]
			})
		).rejects.toThrow(/parsekind-noninjective/);
	});

	it('continues when the encountered code is explicitly allowlisted via --allow-diagnostic', async () => {
		await expect(
			runCodegenCli(
				[
					'--grammar',
					'rust',
					'--all',
					'--output',
					'packages/rust/src',
					'--allow-diagnostic',
					'parsekind-noninjective'
				],
				{
					isTTY: false,
					diagnostics: [{ code: 'parsekind-noninjective', canProceed: false }]
				}
			)
		).resolves.toBe(0);
	});

	it('resolves 0 when there are no blocking diagnostics', async () => {
		await expect(
			runCodegenCli(['--grammar', 'rust', '--all', '--output', 'packages/rust/src'], {
				isTTY: false,
				diagnostics: []
			})
		).resolves.toBe(0);
	});

	it('supports --allow-diagnostic repeated for multiple codes', async () => {
		await expect(
			runCodegenCli(
				[
					'--grammar',
					'rust',
					'--all',
					'--output',
					'packages/rust/src',
					'--allow-diagnostic',
					'parsekind-noninjective',
					'--allow-diagnostic',
					'other-code'
				],
				{
					isTTY: false,
					diagnostics: [
						{ code: 'parsekind-noninjective', canProceed: false },
						{ code: 'other-code', canProceed: false }
					]
				}
			)
		).resolves.toBe(0);
	});

	it('still fails when only one of multiple blocking codes is allowlisted', async () => {
		await expect(
			runCodegenCli(
				[
					'--grammar',
					'rust',
					'--all',
					'--output',
					'packages/rust/src',
					'--allow-diagnostic',
					'parsekind-noninjective'
				],
				{
					isTTY: false,
					diagnostics: [
						{ code: 'parsekind-noninjective', canProceed: false },
						{ code: 'another-blocking-code', canProceed: false }
					]
				}
			)
		).rejects.toThrow(/another-blocking-code/);
	});
});
