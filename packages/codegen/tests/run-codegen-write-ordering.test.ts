import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

vi.mock('node:child_process', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:child_process')>();
	return {
		...actual,
		execSync: vi.fn(() => {
			throw new Error('simulated native build failure');
		})
	};
});

vi.mock('../src/compiler/diagnostics/grammar-diagnostics.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../src/compiler/diagnostics/grammar-diagnostics.ts')>();
	return { ...actual, writeGrammarDiagnosticsJson: vi.fn() };
});
vi.mock('../src/scripts/generated-manifest.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../src/scripts/generated-manifest.ts')>();
	return { ...actual, writeManifestForGrammar: vi.fn() };
});

describe('runCodegen write ordering', () => {
	it('writes every derived file before a failed native build aborts the run', async () => {
		const { runCodegen } = await import('../src/run-codegen.ts');
		const repoRoot = resolve(import.meta.dirname, '..', '..', '..');
		const previousCwd = process.cwd();
		const outDir = mkdtempSync(join(tmpdir(), 'sittir-write-ordering-'));
		mkdirSync(join(outDir, '.sittir'), { recursive: true });
		try {
			process.chdir(repoRoot);
			await expect(
				runCodegen({
					grammar: 'rust',
					outputDir: join(outDir, 'src'),
					testsDir: join(outDir, 'tests'),
					all: true,
					buildNative: true,
					noEmitDiff: true
				})
			).rejects.toThrow('simulated native build failure');

			for (const derived of [
				join(outDir, 'src', 'grammar.ts'),
				join(outDir, 'src', 'types.ts'),
				join(outDir, 'src', 'node-model.json5'),
				join(outDir, 'tests', 'nodes.test.ts'),
				join(outDir, 'vitest.config.ts')
			]) {
				expect(existsSync(derived)).toBe(true);
			}
		} finally {
			process.chdir(previousCwd);
			rmSync(outDir, { recursive: true, force: true });
		}
	});
});
