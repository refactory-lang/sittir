import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const { execFileSync } = vi.hoisted(() => ({ execFileSync: vi.fn() }));
vi.mock('node:child_process', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:child_process')>();
	execFileSync.mockImplementation(actual.execFileSync);
	return { ...actual, execFileSync };
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
const cargoMetadataCalls = () => execFileSync.mock.calls.filter(([command, args]) => command === 'cargo' && (args as string[]).includes('metadata'));

let outDir: string;
let previousCwd: string;
beforeEach(() => {
	previousCwd = process.cwd();
	outDir = mkdtempSync(join(tmpdir(), 'sittir-node-api-level-'));
	mkdirSync(join(outDir, '.sittir'), { recursive: true });
	process.chdir(repoRoot);
});
afterEach(() => {
	process.chdir(previousCwd);
	rmSync(outDir, { recursive: true, force: true });
});

const generateScm = async (nodeApiLevel?: number) => {
	const { runCodegen } = await import('../src/run-codegen.ts');
	await runCodegen({ grammar: 'scm', outputDir: join(outDir, 'src'), testsDir: join(outDir, 'tests'), all: true, buildNative: false, noEmitDiff: true, nodeApiLevel });
};

describe('a gen run reads the Node-API level once, before it writes', () => {
	it('makes no cargo metadata call when its caller supplies the level', async () => {
		const { workspaceNodeApiLevel } = await import('../src/grammars.ts');
		const nodeApiLevel = workspaceNodeApiLevel();
		execFileSync.mockClear();
		await generateScm(nodeApiLevel);
		expect(cargoMetadataCalls()).toEqual([]);
	}, 60_000);

	it('reads it from cargo once when its caller supplies none', async () => {
		execFileSync.mockClear();
		await generateScm();
		expect(cargoMetadataCalls()).toHaveLength(1);
	}, 60_000);
});
