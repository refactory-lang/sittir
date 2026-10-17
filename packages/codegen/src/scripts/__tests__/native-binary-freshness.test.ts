import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	assertNativeBinaryFresh,
	hostBinaryFreshnessFor,
	nativeBuildFreshness,
	writeNativeBuildStamp
} from '../native-binary-freshness.ts';

const TOOLCHAIN = 'rustc 1.90.0 (host: aarch64-apple-darwin)';
const BINARY = 'sittir-rust.darwin-arm64.node';

let root: string;

function write(rel: string, contents: string): void {
	mkdirSync(dirname(join(root, rel)), { recursive: true });
	writeFileSync(join(root, rel), contents);
}

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'sittir-native-freshness-'));
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
	write(`packages/rust/native/${BINARY}`, 'binary v1');
	writeNativeBuildStamp(root, 'rust', 'gate', BINARY, TOOLCHAIN);
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('native build freshness', () => {
	it('is fresh right after the build that stamped it', () => {
		expect(hostBinaryFreshnessFor(root, 'rust', TOOLCHAIN)).toEqual([expect.objectContaining({ stale: false })]);
		expect(nativeBuildFreshness(root, 'rust', 'gate', TOOLCHAIN)).toEqual({ fresh: true, reason: 'built from the current native inputs (gate)' });
		expect(() => assertNativeBinaryFresh(root, 'rust', TOOLCHAIN)).not.toThrow();
	});

	for (const input of [
		'rust/crates/sittir-core/src/lib.rs',
		'rust/crates/sittir-core/build.rs',
		'rust/crates/sittir-transport-macros/src/lib.rs',
		'rust/crates/sittir-rust/src/lib.rs',
		'rust/crates/sittir-rust/Cargo.toml',
		'packages/rust/.sittir/src/parser.c',
		'Cargo.toml',
		'Cargo.lock',
		'rust-toolchain.toml'
	]) {
		it(`is stale once ${input} changes`, () => {
			write(input, 'changed\n');
			expect(hostBinaryFreshnessFor(root, 'rust', TOOLCHAIN)).toEqual([expect.objectContaining({ stale: true, reason: `${input} changed since the build` })]);
			expect(nativeBuildFreshness(root, 'rust', 'gate', TOOLCHAIN)).toEqual({ fresh: false, reason: `${input} changed since the build` });
			expect(() => assertNativeBinaryFresh(root, 'rust', TOOLCHAIN)).toThrow(`${input} changed since the build`);
		});
	}

	it('is stale once a native source is added', () => {
		write('rust/crates/sittir-core/src/added.rs', 'pub fn added() {}\n');
		expect(nativeBuildFreshness(root, 'rust', 'gate', TOOLCHAIN).reason).toBe('rust/crates/sittir-core/src/added.rs changed since the build');
	});

	it('is stale under another toolchain', () => {
		expect(nativeBuildFreshness(root, 'rust', 'gate', 'rustc 1.91.0')).toEqual({ fresh: false, reason: 'the rust toolchain changed since the build' });
	});

	it('is stale when the binary is not the one the build wrote', () => {
		write(`packages/rust/native/${BINARY}`, 'binary v2');
		expect(nativeBuildFreshness(root, 'rust', 'gate', TOOLCHAIN)).toEqual({ fresh: false, reason: `${BINARY} is not the binary the last build wrote` });
	});

	it('serves validation under any profile but a regen only under the profile it was built with', () => {
		expect(hostBinaryFreshnessFor(root, 'rust', TOOLCHAIN)).toEqual([expect.objectContaining({ stale: false, profile: 'gate' })]);
		expect(nativeBuildFreshness(root, 'rust', 'release', TOOLCHAIN)).toEqual({ fresh: false, reason: 'built under the gate profile, not release' });
	});

	it('is stale with no build stamp', () => {
		rmSync(join(root, 'node_modules'), { recursive: true, force: true });
		expect(nativeBuildFreshness(root, 'rust', 'gate', TOOLCHAIN)).toEqual({ fresh: false, reason: 'no record of the build that wrote the binary' });
		expect(hostBinaryFreshnessFor(root, 'rust', TOOLCHAIN)).toEqual([expect.objectContaining({ stale: true })]);
	});

	it('is not fresh, and has nothing to report, with no binary', () => {
		rmSync(join(root, 'packages/rust/native'), { recursive: true, force: true });
		expect(hostBinaryFreshnessFor(root, 'rust', TOOLCHAIN)).toEqual([]);
		expect(nativeBuildFreshness(root, 'rust', 'gate', TOOLCHAIN)).toEqual({ fresh: false, reason: 'no native binary' });
	});
});
