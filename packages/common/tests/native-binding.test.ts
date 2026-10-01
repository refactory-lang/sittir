import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { nativeLoadFailure, platformSuffix, targetSuffix } from '../src/native-binding.ts';

function nativeDir(...files: string[]): string {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-native-'));
	for (const file of files) writeFileSync(join(dir, file), '');
	return dir;
}

const spec = (dir: string) => ({ packageName: '@sittir/rust', binaryName: 'sittir-rust', dir });

describe('platformSuffix', () => {
	it('spells a host the way the binaries are named', () => {
		expect(platformSuffix({ platform: 'darwin', arch: 'arm64' })).toBe('darwin-arm64');
		expect(platformSuffix({ platform: 'linux', arch: 'x64', libc: 'gnu' })).toBe('linux-x64-gnu');
		expect(platformSuffix({ platform: 'linux', arch: 'arm64', libc: 'musl' })).toBe('linux-arm64-musl');
		expect(platformSuffix({ platform: 'win32', arch: 'x64' })).toBe('win32-x64-msvc');
	});
});

describe('targetSuffix', () => {
	it('spells a build target the way its binary is named', () => {
		expect(targetSuffix('aarch64-apple-darwin')).toBe('darwin-arm64');
		expect(targetSuffix('x86_64-apple-darwin')).toBe('darwin-x64');
		expect(targetSuffix('x86_64-unknown-linux-gnu')).toBe('linux-x64-gnu');
		expect(targetSuffix('aarch64-unknown-linux-musl')).toBe('linux-arm64-musl');
		expect(targetSuffix('x86_64-pc-windows-msvc')).toBe('win32-x64-msvc');
		expect(targetSuffix('aarch64-pc-windows-msvc')).toBe('win32-arm64-msvc');
	});

	it('rejects a target it cannot name', () => {
		expect(() => targetSuffix('riscv64gc-unknown-freebsd')).toThrow(/riscv64gc-unknown-freebsd/);
	});
});

describe('nativeLoadFailure', () => {
	it('names the platform, the file it looked for and the platforms the package ships', () => {
		const dir = nativeDir('index.cjs', 'sittir-rust.darwin-arm64.node', 'sittir-rust.linux-x64-gnu.node');
		const message = nativeLoadFailure(spec(dir), new Error('Cannot find native binding.'), {
			platform: 'win32',
			arch: 'arm64'
		});
		expect(message).toBe(
			'@sittir/rust has no native binary for win32-arm64-msvc: looked for native/sittir-rust.win32-arm64-msvc.node; ' +
				'it ships darwin-arm64, linux-x64-gnu'
		);
	});

	it('says so when the package ships no binary at all', () => {
		const message = nativeLoadFailure(spec(nativeDir('index.cjs')), new Error('x'), { platform: 'darwin', arch: 'x64' });
		expect(message).toBe(
			'@sittir/rust has no native binary for darwin-x64: looked for native/sittir-rust.darwin-x64.node; it ships none'
		);
	});

	it('gives the load error when the binary is there and will not load', () => {
		const dir = nativeDir('sittir-rust.darwin-arm64.node');
		const dlopen = new Error(`dlopen(${dir}/sittir-rust.darwin-arm64.node, 0x0001): mis-aligned LINKEDIT string pool`);
		const missing = new Error("Cannot find module 'sittir-rust-darwin-arm64'", { cause: dlopen });
		const top = new Error('Cannot find native binding. npm has a bug related to optional dependencies', { cause: missing });
		const message = nativeLoadFailure(spec(dir), top, { platform: 'darwin', arch: 'arm64' });
		expect(message).toBe(
			`@sittir/rust: native/sittir-rust.darwin-arm64.node is present and failed to load: ${dlopen.message}`
		);
	});

	it('falls back to the outermost message when no cause names the binary', () => {
		const dir = nativeDir('sittir-rust.darwin-arm64.node');
		const message = nativeLoadFailure(spec(dir), new Error('boom'), { platform: 'darwin', arch: 'arm64' });
		expect(message).toBe('@sittir/rust: native/sittir-rust.darwin-arm64.node is present and failed to load: boom');
	});

	it('reports the override and the loader error when the loader was pointed at another library', () => {
		const dir = nativeDir('sittir-rust.darwin-arm64.node');
		const message = nativeLoadFailure(
			spec(dir),
			new Error('Cannot find native binding.', { cause: new Error("Cannot find module '/elsewhere/x.node'") }),
			{ platform: 'darwin', arch: 'arm64' },
			{ NAPI_RS_NATIVE_LIBRARY_PATH: '/elsewhere/x.node' }
		);
		expect(message).toBe(
			"@sittir/rust: the native loader was redirected by NAPI_RS_NATIVE_LIBRARY_PATH=/elsewhere/x.node and did not try the packaged binary: Cannot find module '/elsewhere/x.node'"
		);
	});

	it('reports the override when the loader was forced to WASI', () => {
		const message = nativeLoadFailure(
			spec(nativeDir('sittir-rust.darwin-arm64.node')),
			new Error('no wasi binding'),
			{ platform: 'darwin', arch: 'arm64' },
			{ NAPI_RS_FORCE_WASI: '1' }
		);
		expect(message).toBe(
			'@sittir/rust: the native loader was redirected by NAPI_RS_FORCE_WASI=1 and did not try the packaged binary: no wasi binding'
		);
	});
});

