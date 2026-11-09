import { describe, expect, it } from 'vitest';
import { NATIVE_RUSTFLAGS, NATIVE_TARGETS, nativeBuildEnv } from '../grammars.ts';

describe('nativeBuildEnv', () => {
	it('passes the target row of the rustflags table through RUSTFLAGS', () => {
		expect(nativeBuildEnv('x86_64-unknown-linux-musl', {}).RUSTFLAGS).toBe('-C prefer-dynamic -C target-feature=-crt-static');
	});

	it('appends the RUSTFLAGS already in the environment after the table row', () => {
		expect(nativeBuildEnv('aarch64-apple-darwin', { RUSTFLAGS: '-C link-arg=-fuse-ld=lld' }).RUSTFLAGS).toBe('-C prefer-dynamic -C link-arg=-fuse-ld=lld');
	});

	it('puts the build driver flags last', () => {
		expect(nativeBuildEnv('x86_64-pc-windows-msvc', { RUSTFLAGS: '-C debuginfo=1' }, ['-C link-arg=/MAP']).RUSTFLAGS).toBe(
			'-C prefer-dynamic -C debuginfo=1 -C link-arg=/MAP'
		);
	});

	it('keeps the rest of the environment', () => {
		expect(nativeBuildEnv('aarch64-apple-darwin', { PATH: '/bin' })).toEqual({ PATH: '/bin', RUSTFLAGS: '-C prefer-dynamic' });
	});

	it('links every release target against the engine library', () => {
		for (const target of NATIVE_TARGETS) expect(NATIVE_RUSTFLAGS[target]).toContain('-C prefer-dynamic');
	});

	it('refuses a target with no row, by name', () => {
		expect(() => nativeBuildEnv('x86_64-apple-darwin', {})).toThrow('x86_64-apple-darwin has no row in NATIVE_RUSTFLAGS');
	});

	it('refuses CARGO_ENCODED_RUSTFLAGS, which cargo would read instead of the table', () => {
		expect(() => nativeBuildEnv('x86_64-unknown-linux-gnu', { CARGO_ENCODED_RUSTFLAGS: '-Copt-level=1' })).toThrow(
			'CARGO_ENCODED_RUSTFLAGS overrides the native rustflags table; set RUSTFLAGS instead'
		);
	});

	it('has a row for every release target and no other', () => {
		expect(Object.keys(NATIVE_RUSTFLAGS).sort()).toEqual([...NATIVE_TARGETS].sort());
	});
});
