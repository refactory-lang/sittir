import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CARGO_MESSAGE_FORMAT, artifactFile, linkerMapFile, parseCargoArtifacts, type CargoArtifact } from '../native-artifacts.ts';

const PACKAGE = 'native-fixture';
const LIBRARY = process.platform === 'win32' ? 'native_fixture.dll' : process.platform === 'darwin' ? 'libnative_fixture.dylib' : 'libnative_fixture.so';

let root: string;
let manifest: string;
let targetDir: string;

function build(feature: string): readonly CargoArtifact[] {
	const result = spawnSync('cargo', ['build', CARGO_MESSAGE_FORMAT, '--features', feature], {
		cwd: root,
		encoding: 'utf8',
		env: { ...process.env, CARGO_TARGET_DIR: targetDir },
		maxBuffer: 1 << 26
	});
	if (result.status !== 0) throw new Error(`cargo build failed: ${result.stderr}`);
	return parseCargoArtifacts(result.stdout);
}

beforeAll(() => {
	root = realpathSync(mkdtempSync(join(tmpdir(), 'sittir-native-artifacts-')));
	targetDir = join(root, 'target');
	manifest = join(root, 'Cargo.toml');
	mkdirSync(join(root, 'src'));
	writeFileSync(
		manifest,
		['[package]', 'name = "native-fixture"', 'version = "0.0.0"', 'edition = "2021"', '', '[lib]', 'crate-type = ["cdylib", "rlib"]', '', '[features]', 'a = []', 'b = []', '', '[workspace]', ''].join('\n')
	);
	writeFileSync(
		join(root, 'src', 'lib.rs'),
		['#[cfg(feature = "a")]', '#[no_mangle]', 'pub static MARK: [u8; 8] = *b"marker-a";', '#[cfg(feature = "b")]', '#[no_mangle]', 'pub static MARK: [u8; 8] = *b"marker-b";', ''].join('\n')
	);
}, 60_000);

afterAll(() => {
	rmSync(root, { recursive: true, force: true });
});

describe('the artifacts cargo names for a build', () => {
	it('name the library of the feature set just built, though another feature set built after it', () => {
		const first = build('a');
		build('b');
		const again = build('a');
		const file = artifactFile(again, manifest, LIBRARY);
		expect(readFileSync(file).includes('marker-a')).toBe(true);
		expect(readFileSync(file).includes('marker-b')).toBe(false);
		expect(dirname(linkerMapFile(again, manifest, PACKAGE))).toBe(dirname(linkerMapFile(first, manifest, PACKAGE)));
	}, 120_000);

	it('keep the output directory of each feature set apart', () => {
		expect(dirname(linkerMapFile(build('a'), manifest, PACKAGE))).not.toBe(dirname(linkerMapFile(build('b'), manifest, PACKAGE)));
	}, 120_000);

	it('refuse a file cargo did not name, with the manifest', () => {
		expect(() => artifactFile(build('a'), manifest, 'libabsent.dylib')).toThrow(`cargo named no libabsent.dylib among the artifacts it built for ${manifest}`);
	}, 120_000);

	it('are read from the compiler-artifact messages only', () => {
		const lines = [
			'warning: rendered diagnostics are not JSON',
			JSON.stringify({ reason: 'build-finished', success: true }),
			JSON.stringify({ reason: 'compiler-artifact', manifest_path: '/m/Cargo.toml', target: { name: 'one', kind: ['lib'] }, filenames: ['/t/libone.rlib'] }),
			'{ not json'
		].join('\n');
		expect(parseCargoArtifacts(lines)).toEqual([{ manifestPath: '/m/Cargo.toml', target: 'one', kinds: ['lib'], filenames: ['/t/libone.rlib'] }]);
	});
});
