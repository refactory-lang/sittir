import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runNativeOnly } from '../src/run-codegen.ts';

const RECORDED = { read: { source: 'the source the generation read', upstream: 'its upstream' }, files: { 'packages/rust/src/index.ts': 'its hash' } };

const { execSync, spawnSync, clearNapiTypedefs, recordNativeBuild, recordedGeneration } = vi.hoisted(() => ({
	execSync: vi.fn(),
	spawnSync: vi.fn(),
	clearNapiTypedefs: vi.fn(),
	recordNativeBuild: vi.fn(),
	recordedGeneration: vi.fn()
}));

vi.mock('node:child_process', async (importOriginal) => ({ ...(await importOriginal<typeof import('node:child_process')>()), execSync, spawnSync }));
vi.mock('../src/scripts/napi-typedefs.ts', () => ({ clearNapiTypedefs }));
vi.mock('../src/scripts/generated-manifest.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('../src/scripts/generated-manifest.ts')>()),
	recordNativeBuild,
	recordedGeneration
}));

const builds = () => execSync.mock.calls.map((call) => call[0] as string);
const checks = () => spawnSync.mock.calls.map((call) => [call[0], ...(call[1] as string[])].join(' '));

beforeEach(() => {
	vi.clearAllMocks();
	recordedGeneration.mockReturnValue(RECORDED);
	spawnSync.mockReturnValue({ status: 0 });
});

describe('runNativeOnly', () => {
	it('builds the binding under the gate profile, checks the workspace, then records the generation against the generation it was built from', async () => {
		await runNativeOnly({ grammar: 'rust', outputDir: '' });
		expect(clearNapiTypedefs).toHaveBeenCalledWith('rust', process.cwd());
		expect(builds()).toEqual(['pnpm -C rust/crates/sittir-rust run build:gate']);
		expect(checks()).toEqual(['cargo check --workspace --features napi-bindings']);
		expect(spawnSync.mock.invocationCallOrder[0]!).toBeGreaterThan(execSync.mock.invocationCallOrder[0]!);
		expect(recordNativeBuild).toHaveBeenCalledWith('rust', RECORDED);
		expect(recordNativeBuild.mock.invocationCallOrder[0]!).toBeGreaterThan(spawnSync.mock.invocationCallOrder[0]!);
	});

	it('builds a debug binding under --native-debug', async () => {
		await runNativeOnly({ grammar: 'rust', outputDir: '', nativeDebug: true });
		expect(builds()[0]).toBe('pnpm -C rust/crates/sittir-rust run build:debug');
	});

	it('leaves the workspace check to the caller under --no-workspace-check', async () => {
		await runNativeOnly({ grammar: 'rust', outputDir: '', workspaceCheck: false });
		expect(builds()).toEqual(['pnpm -C rust/crates/sittir-rust run build:gate']);
		expect(checks()).toEqual([]);
	});

	it('builds nothing when no generation is on record', async () => {
		recordedGeneration.mockReturnValue(undefined);
		await expect(runNativeOnly({ grammar: 'rust', outputDir: '' })).rejects.toThrow('No generation of rust is on record');
		expect(execSync).not.toHaveBeenCalled();
		expect(recordNativeBuild).not.toHaveBeenCalled();
	});

	it('records nothing when the workspace check fails', async () => {
		spawnSync.mockReturnValue({ status: 101 });
		await expect(runNativeOnly({ grammar: 'rust', outputDir: '' })).rejects.toThrow('cargo check --workspace --features napi-bindings exited with 101');
		expect(recordNativeBuild).not.toHaveBeenCalled();
	});

	it('records nothing when the build fails', async () => {
		execSync.mockImplementationOnce(() => {
			throw new Error('cargo failed');
		});
		await expect(runNativeOnly({ grammar: 'rust', outputDir: '' })).rejects.toThrow('cargo failed');
		expect(recordNativeBuild).not.toHaveBeenCalled();
	});
});
