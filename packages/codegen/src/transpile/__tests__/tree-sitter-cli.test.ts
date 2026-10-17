import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UNBOUND_ENV } from '../../dsl/sittir-grammar.ts';
import { ensureWasmToolchain, nodeFloorViolation, treeSitterCacheDir, treeSitterCliEnv, treeSitterCliVersion, treeSitterToolchainIdentity } from '../tree-sitter-cli.ts';

describe('treeSitterCliEnv', () => {
	it('drops the unbound toggle an evaluation left in the parent environment', () => {
		const env = treeSitterCliEnv({}, { PATH: '/bin', [UNBOUND_ENV]: '1' });
		expect(env).toEqual({ PATH: '/bin' });
	});

	it('passes the unbound toggle a caller asks for', () => {
		expect(treeSitterCliEnv({ [UNBOUND_ENV]: '1' }, { PATH: '/bin' })).toEqual({ PATH: '/bin', [UNBOUND_ENV]: '1' });
	});
});

describe('nodeFloorViolation', () => {
	it('reads its floor from the codegen package engines', () => {
		expect(nodeFloorViolation('v22.17.9')).toContain('>=22.18.0');
	});

	it.each(['v20.19.0', 'v22.17.1', 'v22.9.0'])('refuses %s below 22.18', (version) => {
		expect(nodeFloorViolation(version, '>=22.18.0')).toBe(
			`tree-sitter runs grammar.sittir.ts with the \`node\` on PATH, which is ${version}; stripping its TypeScript types needs node >=22.18.0`
		);
	});

	it.each(['v22.18.0', 'v22.18.1', 'v22.20.0', 'v23.0.0', 'v26.10.0'])('accepts %s', (version) => {
		expect(nodeFloorViolation(version, '>=22.18.0')).toBeUndefined();
	});
});

describe('treeSitterCacheDir', () => {
	it('is under XDG_CACHE_HOME when it is an absolute path', () => {
		expect(treeSitterCacheDir({ XDG_CACHE_HOME: '/xdg/cache' }, 'darwin', '/home/u')).toBe('/xdg/cache/tree-sitter');
	});

	it('is under ~/.cache when XDG_CACHE_HOME is unset or relative', () => {
		expect(treeSitterCacheDir({}, 'linux', '/home/u')).toBe('/home/u/.cache/tree-sitter');
		expect(treeSitterCacheDir({ XDG_CACHE_HOME: 'relative/cache' }, 'darwin', '/home/u')).toBe('/home/u/.cache/tree-sitter');
	});

	it('is under AppData/Local on Windows', () => {
		expect(treeSitterCacheDir({ XDG_CACHE_HOME: '/xdg/cache' }, 'win32', '/home/u')).toBe(join('/home/u', 'AppData', 'Local', 'tree-sitter'));
	});
});

describe('the wasm toolchain identity', () => {
	let cache: string;
	let env: NodeJS.ProcessEnv;

	const install = (dir: string, version: string): void => {
		mkdirSync(dir, { recursive: true });
		writeFileSync(join(dir, '.version'), version);
	};

	beforeEach(() => {
		cache = mkdtempSync(join(tmpdir(), 'sittir-wasm-toolchain-'));
		env = { XDG_CACHE_HOME: cache };
		install(join(cache, 'tree-sitter', 'wasi-sdk'), '34.0');
		install(join(cache, 'tree-sitter', 'binaryen'), '132');
	});
	afterEach(() => rmSync(cache, { recursive: true, force: true }));

	it('names the CLI and the version of each toolchain the CLI builds wasm with', () => {
		expect(treeSitterToolchainIdentity(env).split('\0')).toEqual([`tree-sitter-cli ${treeSitterCliVersion()}`, 'wasi-sdk 34.0', 'binaryen 132']);
	});

	it('changes when a toolchain is replaced by another version', () => {
		const before = treeSitterToolchainIdentity(env);
		install(join(cache, 'tree-sitter', 'binaryen'), '133');
		expect(treeSitterToolchainIdentity(env)).not.toBe(before);
	});

	it('reads the directory TREE_SITTER_WASI_SDK_PATH or TREE_SITTER_BINARYEN_PATH points at instead of the cache', () => {
		install(join(cache, 'own-sdk'), '35.0');
		install(join(cache, 'own-binaryen'), '140');
		const own = { ...env, TREE_SITTER_WASI_SDK_PATH: join(cache, 'own-sdk'), TREE_SITTER_BINARYEN_PATH: join(cache, 'own-binaryen') };
		expect(treeSitterToolchainIdentity(own).split('\0').slice(1)).toEqual(['wasi-sdk 35.0', 'binaryen 140']);
	});

	it('names a missing version file without throwing, so it can never equal an identity a generation recorded', () => {
		rmSync(join(cache, 'tree-sitter', 'wasi-sdk', '.version'));
		const file = join(cache, 'tree-sitter', 'wasi-sdk', '.version');
		expect(treeSitterToolchainIdentity(env).split('\0')[1]).toBe(`wasi-sdk: no ${file}`);
	});

	it('leaves an installed toolchain alone', () => {
		const installer = vi.fn();
		ensureWasmToolchain(env, installer);
		expect(installer).not.toHaveBeenCalled();
	});

	it('installs a missing toolchain', () => {
		rmSync(join(cache, 'tree-sitter', 'binaryen'), { recursive: true });
		const installer = vi.fn(() => install(join(cache, 'tree-sitter', 'binaryen'), '132'));
		ensureWasmToolchain(env, installer);
		expect(installer).toHaveBeenCalledOnce();
		expect(treeSitterToolchainIdentity(env).split('\0')[2]).toBe('binaryen 132');
	});

	it('fails naming the version file when installing leaves it missing', () => {
		const sdk = join(cache, 'own-sdk');
		mkdirSync(sdk);
		expect(() => ensureWasmToolchain({ ...env, TREE_SITTER_WASI_SDK_PATH: sdk }, () => {})).toThrow(join(sdk, '.version'));
	});
});
