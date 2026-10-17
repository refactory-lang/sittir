import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	type BuildSetting,
	assertNativeBinaryFresh,
	hostBinaryFreshnessFor,
	hostBinaryName,
	nativeBuildFreshness,
	writeNativeBuildStamp
} from '../native-binary-freshness.ts';

const TOOLCHAIN = 'rustc 1.90.0 (host: aarch64-apple-darwin)';
const BINARY = hostBinaryName('rust');

let outer: string;
let root: string;
let BUILD_ENV: NodeJS.ProcessEnv;
let current: BuildSetting;

function write(rel: string, contents: string): void {
	mkdirSync(dirname(join(root, rel)), { recursive: true });
	writeFileSync(join(root, rel), contents);
}

beforeEach(() => {
	outer = mkdtempSync(join(tmpdir(), 'sittir-native-freshness-'));
	root = join(outer, 'checkout');
	BUILD_ENV = { PATH: '/usr/bin', CARGO_HOME: join(outer, 'cargo-home') };
	current = { toolchain: TOOLCHAIN, env: BUILD_ENV };
	write('Cargo.toml', '[workspace]\n');
	write('Cargo.lock', 'version = 4\n');
	write('rust-toolchain.toml', '[toolchain]\nchannel = "1.90"\n');
	write('rust/crates/sittir-core/Cargo.toml', '[package]\n');
	write('rust/crates/sittir-core/build.rs', 'fn main() {}\n');
	write('rust/crates/sittir-core/src/lib.rs', 'pub fn core() {}\n');
	write('rust/crates/sittir-transport-macros/Cargo.toml', '[package]\n');
	write('rust/crates/sittir-transport-macros/src/lib.rs', 'pub fn macros() {}\n');
	write('rust/crates/sittir-rust/Cargo.toml', '[package]\n');
	write('rust/crates/sittir-rust/build.rs', 'fn main() {}\n');
	write('rust/crates/sittir-rust/src/lib.rs', 'pub fn grammar() {}\n');
	write('packages/rust/.sittir/src/parser.c', 'int parser;\n');
	write('packages/rust/.sittir/src/scanner.c', '#include "tree_sitter/parser.h"\n#include <wctype.h>\n#include "../../common/scanner.h"\n');
	write('packages/rust/.sittir/src/tree_sitter/parser.h', 'typedef int TSLexer;\n');
	write('packages/rust/common/scanner.h', '#include "inner.h"\nint shared;\n');
	write('packages/rust/common/inner.h', 'int inner;\n');
	write(`packages/rust/native/${BINARY}`, 'binary v1');
	writeNativeBuildStamp(root, 'rust', 'gate', BINARY, current);
});
afterEach(() => rmSync(outer, { recursive: true, force: true }));

describe('native build freshness', () => {
	it('is fresh right after the build that stamped it', () => {
		expect(hostBinaryFreshnessFor(root, 'rust')).toEqual([expect.objectContaining({ stale: false })]);
		expect(nativeBuildFreshness(root, 'rust', 'gate', current)).toEqual({ fresh: true, reason: 'built from the current native inputs (gate)' });
		expect(() => assertNativeBinaryFresh(root, 'rust')).not.toThrow();
	});

	for (const input of [
		'rust/crates/sittir-core/src/lib.rs',
		'rust/crates/sittir-core/build.rs',
		'rust/crates/sittir-transport-macros/src/lib.rs',
		'rust/crates/sittir-rust/src/lib.rs',
		'rust/crates/sittir-rust/Cargo.toml',
		'packages/rust/.sittir/src/parser.c',
		'packages/rust/common/scanner.h',
		'packages/rust/common/inner.h',
		'Cargo.toml',
		'Cargo.lock',
		'rust-toolchain.toml'
	]) {
		it(`is stale once ${input} changes`, () => {
			write(input, `${readFileSync(join(root, input), 'utf8')}changed\n`);
			expect(hostBinaryFreshnessFor(root, 'rust')).toEqual([expect.objectContaining({ stale: true, reason: `${input} changed since the build` })]);
			expect(nativeBuildFreshness(root, 'rust', 'gate', current)).toEqual({ fresh: false, reason: `${input} changed since the build` });
			expect(() => assertNativeBinaryFresh(root, 'rust')).toThrow(`${input} changed since the build`);
		});
	}

	it('is stale once a native source is added', () => {
		write('rust/crates/sittir-core/src/added.rs', 'pub fn added() {}\n');
		expect(nativeBuildFreshness(root, 'rust', 'gate', current).reason).toBe('rust/crates/sittir-core/src/added.rs changed since the build');
	});

	it('is stale when the binary is not the one the build wrote', () => {
		write(`packages/rust/native/${BINARY}`, 'binary v2');
		expect(nativeBuildFreshness(root, 'rust', 'gate', current)).toEqual({ fresh: false, reason: `${BINARY} is not the binary the last build wrote` });
	});

	it('is stale with no build stamp', () => {
		rmSync(join(root, 'node_modules'), { recursive: true, force: true });
		expect(nativeBuildFreshness(root, 'rust', 'gate', current)).toEqual({ fresh: false, reason: 'no record of the build that wrote the binary' });
		expect(hostBinaryFreshnessFor(root, 'rust')).toEqual([expect.objectContaining({ stale: true })]);
	});

	it('is not fresh, and has nothing to report, with no binary', () => {
		rmSync(join(root, 'packages/rust/native'), { recursive: true, force: true });
		expect(hostBinaryFreshnessFor(root, 'rust')).toEqual([]);
		expect(nativeBuildFreshness(root, 'rust', 'gate', current)).toEqual({ fresh: false, reason: 'no native binary' });
	});
});

describe('what only a rebuild cares about', () => {
	it('serves validation under any profile, but a regeneration only under the profile it was built with', () => {
		expect(hostBinaryFreshnessFor(root, 'rust')).toEqual([expect.objectContaining({ stale: false, profile: 'gate' })]);
		expect(nativeBuildFreshness(root, 'rust', 'release', current)).toEqual({ fresh: false, reason: 'built under the gate profile, not release' });
	});

	it('serves validation under another toolchain, but not a regeneration', () => {
		expect(hostBinaryFreshnessFor(root, 'rust')).toEqual([expect.objectContaining({ stale: false })]);
		expect(nativeBuildFreshness(root, 'rust', 'gate', { ...current, toolchain: 'rustc 1.91.0' })).toEqual({ fresh: false, reason: 'the rust toolchain changed since the build' });
	});

	it('serves validation under other build flags, but not a regeneration', () => {
		expect(nativeBuildFreshness(root, 'rust', 'gate', { ...current, env: { ...BUILD_ENV, RUSTFLAGS: '-C opt-level=1' } })).toEqual({
			fresh: false,
			reason: 'RUSTFLAGS changed since the build'
		});
		expect(nativeBuildFreshness(root, 'rust', 'gate', { ...current, env: { ...BUILD_ENV, CARGO_PROFILE_GATE_OPT_LEVEL: '1' } }).reason).toBe(
			'CARGO_PROFILE_GATE_OPT_LEVEL changed since the build'
		);
		expect(hostBinaryFreshnessFor(root, 'rust')).toEqual([expect.objectContaining({ stale: false })]);
	});

	it('is not fresh for a regeneration once cargo configuration changes', () => {
		write('.cargo/config.toml', '[profile.gate]\nopt-level = 1\n');
		expect(nativeBuildFreshness(root, 'rust', 'gate', current)).toEqual({ fresh: false, reason: '.cargo/config.toml changed since the build' });
		expect(hostBinaryFreshnessFor(root, 'rust')).toEqual([expect.objectContaining({ stale: false })]);
	});

	for (const [where, path] of [
		['in the crate it builds', 'checkout/rust/crates/sittir-rust/.cargo/config.toml'],
		['above the checkout', '.cargo/config.toml'],
		['in the cargo home', 'cargo-home/config.toml']
	] as const) {
		it(`is not fresh for a regeneration once cargo configuration ${where} changes`, () => {
			mkdirSync(dirname(join(outer, path)), { recursive: true });
			writeFileSync(join(outer, path), '[build]\nrustflags = ["-C", "opt-level=1"]\n');
			expect(nativeBuildFreshness(root, 'rust', 'gate', current).reason).toBe(`${relative(root, join(outer, path))} changed since the build`);
		});
	}

	for (const variable of [
		'CC',
		'CFLAGS',
		'CXXFLAGS',
		'CFLAGS_aarch64_apple_darwin',
		'TARGET_CC',
		'HOST_CFLAGS',
		'AR',
		'RUSTC',
		'RUSTC_WORKSPACE_WRAPPER',
		'CARGO_TARGET_AARCH64_APPLE_DARWIN_RUSTFLAGS',
		'CARGO_TARGET_X86_64_UNKNOWN_LINUX_GNU_LINKER'
	]) {
		it(`is not fresh for a regeneration once ${variable} changes`, () => {
			expect(nativeBuildFreshness(root, 'rust', 'gate', { ...current, env: { ...BUILD_ENV, [variable]: 'changed' } }).reason).toBe(
				`${variable} changed since the build`
			);
		});
	}

	it('stays fresh when only where cargo puts its output changes', () => {
		expect(nativeBuildFreshness(root, 'rust', 'gate', { ...current, env: { ...BUILD_ENV, CARGO_TARGET_DIR: '/elsewhere', CARGO_BUILD_TARGET_DIR: '/elsewhere' } }).fresh).toBe(true);
	});
});

describe('binaries for other targets', () => {
	it('judges only the binary the host loads', () => {
		write('packages/rust/native/sittir-rust.some-other-target.node', 'foreign');
		expect(hostBinaryFreshnessFor(root, 'rust')).toEqual([expect.objectContaining({ rel: `packages/rust/native/${BINARY}`, stale: false })]);
		expect(nativeBuildFreshness(root, 'rust', 'gate', current).fresh).toBe(true);
	});

	it('keeps the host stamp when another target is built', () => {
		write('packages/rust/native/sittir-rust.some-other-target.node', 'foreign');
		writeNativeBuildStamp(root, 'rust', 'release', 'sittir-rust.some-other-target.node', current);
		expect(nativeBuildFreshness(root, 'rust', 'gate', current).fresh).toBe(true);
	});
});

describe('a binary built elsewhere', () => {
	it('validates in a checkout that receives the binary and its stamp, with no rust toolchain', () => {
		const consumer = mkdtempSync(join(tmpdir(), 'sittir-native-consumer-'));
		try {
			for (const rel of ['Cargo.toml', 'Cargo.lock', 'rust-toolchain.toml', 'rust', 'packages/rust/.sittir', 'packages/rust/common']) cpSync(join(root, rel), join(consumer, rel), { recursive: true });
			cpSync(join(root, 'packages/rust/native'), join(consumer, 'packages/rust/native'), { recursive: true });
			cpSync(join(root, 'node_modules'), join(consumer, 'node_modules'), { recursive: true });
			expect(() => assertNativeBinaryFresh(consumer, 'rust')).not.toThrow();
		} finally {
			rmSync(consumer, { recursive: true, force: true });
		}
	});
});
