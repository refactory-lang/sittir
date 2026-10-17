import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runNativeOnly } from '../src/run-codegen.ts';

const RECORDED = { source: 'the source the generation read', upstream: 'its upstream' };

const { execSync, clearNapiTypedefs, writeManifestForGrammar, recordedSourceFingerprint } = vi.hoisted(() => ({
	execSync: vi.fn(),
	clearNapiTypedefs: vi.fn(),
	writeManifestForGrammar: vi.fn(),
	recordedSourceFingerprint: vi.fn()
}));

vi.mock('node:child_process', async (importOriginal) => ({ ...(await importOriginal<typeof import('node:child_process')>()), execSync }));
vi.mock('../src/scripts/napi-typedefs.ts', () => ({ clearNapiTypedefs }));
vi.mock('../src/scripts/generated-manifest.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('../src/scripts/generated-manifest.ts')>()),
	writeManifestForGrammar,
	recordedSourceFingerprint
}));

const commands = () => execSync.mock.calls.map((call) => call[0] as string);

beforeEach(() => {
	vi.clearAllMocks();
	recordedSourceFingerprint.mockReturnValue(RECORDED);
});

describe('runNativeOnly', () => {
	it('builds the binding under the gate profile, checks the workspace, then records the generation against the source it came from', async () => {
		await runNativeOnly({ grammar: 'rust', outputDir: '' });
		expect(clearNapiTypedefs).toHaveBeenCalledWith('rust', process.cwd());
		expect(commands()).toEqual(['pnpm -C rust/crates/sittir-rust run build:gate', 'cargo check --workspace --features napi-bindings']);
		expect(writeManifestForGrammar).toHaveBeenCalledWith('rust', RECORDED);
		expect(writeManifestForGrammar.mock.invocationCallOrder[0]!).toBeGreaterThan(execSync.mock.invocationCallOrder[1]!);
	});

	it('builds a debug binding under --native-debug', async () => {
		await runNativeOnly({ grammar: 'rust', outputDir: '', nativeDebug: true });
		expect(commands()[0]).toBe('pnpm -C rust/crates/sittir-rust run build:debug');
	});

	it('leaves the workspace check to the caller under --no-workspace-check', async () => {
		await runNativeOnly({ grammar: 'rust', outputDir: '', workspaceCheck: false });
		expect(commands()).toEqual(['pnpm -C rust/crates/sittir-rust run build:gate']);
	});

	it('builds nothing when no generation is on record', async () => {
		recordedSourceFingerprint.mockReturnValue(undefined);
		await expect(runNativeOnly({ grammar: 'rust', outputDir: '' })).rejects.toThrow('No generation of rust is on record');
		expect(execSync).not.toHaveBeenCalled();
		expect(writeManifestForGrammar).not.toHaveBeenCalled();
	});

	it('records nothing when the build fails', async () => {
		execSync.mockImplementationOnce(() => {
			throw new Error('cargo failed');
		});
		await expect(runNativeOnly({ grammar: 'rust', outputDir: '' })).rejects.toThrow('cargo failed');
		expect(writeManifestForGrammar).not.toHaveBeenCalled();
	});
});
