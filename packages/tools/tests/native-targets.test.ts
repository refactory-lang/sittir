import { describe, expect, it } from 'vitest';
import { NATIVE_TARGETS } from '@sittir/codegen/grammars';
import { nativeTargetRows } from '../src/native-targets.ts';

describe('nativeTargetRows', () => {
	it('builds every release target on the runner each workflow listed, cross exactly where the runner cannot run what it builds', () => {
		expect(nativeTargetRows().map(({ target, host, cross }) => ({ target, host, cross }))).toEqual([
			{ target: 'aarch64-apple-darwin', host: 'macos-15', cross: false },
			{ target: 'x86_64-unknown-linux-gnu', host: 'ubuntu-22.04', cross: false },
			{ target: 'x86_64-unknown-linux-musl', host: 'ubuntu-22.04', cross: true },
			{ target: 'aarch64-unknown-linux-gnu', host: 'ubuntu-22.04', cross: true },
			{ target: 'aarch64-unknown-linux-musl', host: 'ubuntu-22.04', cross: true },
			{ target: 'x86_64-pc-windows-msvc', host: 'windows-2022', cross: false }
		]);
	});

	it('runs each target on its own architecture, the musl targets inside an Alpine container', () => {
		expect(Object.fromEntries(nativeTargetRows().map(({ target, runner, container }) => [target, container === undefined ? runner : `${runner} ${container}`]))).toEqual({
			'aarch64-apple-darwin': 'macos-15',
			'x86_64-unknown-linux-gnu': 'ubuntu-22.04',
			'x86_64-unknown-linux-musl': 'ubuntu-24.04 node:24-alpine',
			'aarch64-unknown-linux-gnu': 'ubuntu-24.04-arm',
			'aarch64-unknown-linux-musl': 'ubuntu-24.04-arm node:24-alpine',
			'x86_64-pc-windows-msvc': 'windows-2022'
		});
	});

	it('lists the named targets alone, in the order NATIVE_TARGETS gives them', () => {
		expect(nativeTargetRows(['x86_64-pc-windows-msvc', 'x86_64-unknown-linux-gnu']).map((row) => row.target)).toEqual([
			'x86_64-unknown-linux-gnu',
			'x86_64-pc-windows-msvc'
		]);
		expect(nativeTargetRows().map((row) => row.target)).toEqual([...NATIVE_TARGETS]);
	});

	it('refuses a target that is not a release target, naming it', () => {
		expect(() => nativeTargetRows(['riscv64gc-unknown-linux-gnu'])).toThrow('riscv64gc-unknown-linux-gnu is not one of NATIVE_TARGETS');
	});
});
