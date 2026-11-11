import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const { existsSync } = vi.hoisted(() => ({ existsSync: vi.fn() }));
vi.mock('node:fs', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:fs')>();
	existsSync.mockImplementation(actual.existsSync);
	return { ...actual, existsSync };
});
vi.mock('../src/compiler/diagnostics/grammar-diagnostics.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('../src/compiler/diagnostics/grammar-diagnostics.ts')>()),
	writeGrammarDiagnosticsJson: vi.fn()
}));
vi.mock('../src/scripts/generated-manifest.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('../src/scripts/generated-manifest.ts')>()),
	writeManifestForGrammar: vi.fn()
}));

const repoRoot = resolve(import.meta.dirname, '..', '..', '..');
const crateManifestChecked = () => existsSync.mock.calls.some(([path]) => path === join(repoRoot, 'rust', 'crates', 'sittir-scm', 'Cargo.toml'));

let outDir: string;
let previousCwd: string;
beforeEach(() => {
	previousCwd = process.cwd();
	outDir = mkdtempSync(join(tmpdir(), 'sittir-rust-crate-'));
	mkdirSync(join(outDir, '.sittir'), { recursive: true });
	process.chdir(repoRoot);
});
afterEach(() => {
	process.chdir(previousCwd);
	rmSync(outDir, { recursive: true, force: true });
});

const generateScm = async (all: boolean) => {
	const { runCodegen } = await import('../src/run-codegen.ts');
	await runCodegen({ grammar: 'scm', outputDir: join(outDir, 'src'), testsDir: join(outDir, 'tests'), all, buildNative: false, noEmitDiff: true });
};

describe('a gen run writes the grammar crate only under --all', () => {
	it('writes it for an --all run', async () => {
		existsSync.mockClear();
		await generateScm(true);
		expect(crateManifestChecked()).toBe(true);
	}, 60_000);

	it('leaves it alone otherwise', async () => {
		existsSync.mockClear();
		await generateScm(false);
		expect(crateManifestChecked()).toBe(false);
	}, 60_000);
});
