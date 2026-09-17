import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// The preflight and generate() used to each run their own independent
// evaluate→link→normalize→assemble pass — evaluate() (which injects DSL
// globals onto globalThis) ran twice per `sittir gen` invocation.
// compileGrammar()/Compilation unify the two into one compile, reused by
// both the diagnostics gate and emission.
const evaluateCalls: number[] = [];
vi.mock('../src/compiler/evaluate.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../src/compiler/evaluate.ts')>();
	return {
		...actual,
		evaluate: async (entryPath: string) => {
			evaluateCalls.push(Date.now());
			return actual.evaluate(entryPath);
		}
	};
});

// Real writes this real-grammar run would otherwise make outside the test's
// temp outputDir — packages/rust/.sittir/grammar-diagnostics.json and
// packages/rust/.sittir/generated.manifest.json — are keyed by grammar name,
// not outputDir. Stub only those two side effects.
vi.mock('../src/compiler/diagnostics/grammar-diagnostics.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../src/compiler/diagnostics/grammar-diagnostics.ts')>();
	return { ...actual, writeGrammarDiagnosticsJson: vi.fn() };
});
vi.mock('../src/scripts/generated-manifest.ts', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../src/scripts/generated-manifest.ts')>();
	return { ...actual, writeManifestForGrammar: vi.fn() };
});

describe('runCodegen calls evaluate() exactly once per generation', () => {
	it('compiles rust once for the preflight and for emission combined', async () => {
		const { runCodegen } = await import('../src/run-codegen.ts');
		const repoRoot = resolve(process.cwd(), '..', '..');
		const previousCwd = process.cwd();
		const outDir = mkdtempSync(join(tmpdir(), 'sittir-single-compile-'));
		mkdirSync(join(outDir, '.sittir'), { recursive: true });
		try {
			process.chdir(repoRoot);
			await runCodegen({
				grammar: 'rust',
				outputDir: join(outDir, 'src'),
				testsDir: join(outDir, 'tests'),
				all: false,
				buildNative: false,
				noEmitDiff: true
			});
			expect(evaluateCalls).toHaveLength(1);
		} finally {
			process.chdir(previousCwd);
			rmSync(outDir, { recursive: true, force: true });
		}
	});
});
