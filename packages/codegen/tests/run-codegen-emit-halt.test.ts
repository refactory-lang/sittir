import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { GrammarDiagnostic } from '../src/types/diagnostics.ts';

const halted: GrammarDiagnostic = {
	scope: 'grammar',
	code: 'slot-choice-text-lost',
	severity: 'error',
	canProceed: false,
	grammar: 'regex',
	ownerKind: 'holder',
	message: 'holder: a render would lose this text'
};

vi.mock('../src/compiler/diagnostics/grammar-diagnostics.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../src/compiler/diagnostics/grammar-diagnostics.ts')>();
	return { ...actual, writeGrammarDiagnosticsJson: vi.fn() };
});

vi.mock('../src/compiler/generate.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../src/compiler/generate.ts')>();
	const { EmitHaltedError } = await import('../src/types/diagnostics.ts');
	return {
		...actual,
		generate: vi.fn(async () => {
			throw new EmitHaltedError([halted]);
		})
	};
});

describe('runCodegen emit halt', () => {
	it('records the halt in grammar-diagnostics.json beside the compile records', async () => {
		const { runCodegen } = await import('../src/run-codegen.ts');
		const { writeGrammarDiagnosticsJson } = await import('../src/compiler/diagnostics/grammar-diagnostics.ts');
		const { EmitHaltedError } = await import('../src/types/diagnostics.ts');
		const write = vi.mocked(writeGrammarDiagnosticsJson);
		const repoRoot = resolve(import.meta.dirname, '..', '..', '..');
		const previousCwd = process.cwd();
		const outDir = mkdtempSync(join(tmpdir(), 'sittir-emit-halt-'));
		try {
			process.chdir(repoRoot);
			await expect(runCodegen({ grammar: 'regex', outputDir: join(outDir, 'src'), all: true, buildNative: false, noEmitDiff: true })).rejects.toBeInstanceOf(EmitHaltedError);
			expect(write).toHaveBeenCalledTimes(2);
			const [compiled, compiledPath] = write.mock.calls[0]!;
			const [recorded, recordedPath] = write.mock.calls[1]!;
			expect(recordedPath).toBe(compiledPath);
			expect(recorded).toEqual([...compiled, halted]);
		} finally {
			process.chdir(previousCwd);
			rmSync(outDir, { recursive: true, force: true });
		}
	}, 60_000);
});
