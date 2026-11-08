import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	assembleNativePackages,
	declareNativePackages,
	hostInstallSize,
	nativePackGaps,
	optionalDependencyGaps,
	platformPackGaps,
	shipLinkedCopies,
	unexpectedNativeFiles,
	type NapiPackage
} from '../src/native-pack.ts';

const binding = { binaryName: 'sittir-rust', loader: 'index.cjs', typings: 'index.d.ts' };
const packed = (...files: string[]) => files.map((file) => `package/${file}`);

describe('nativePackGaps', () => {
	it('accepts a grammar pack holding the loader and its typings', () => {
		expect(nativePackGaps(packed('dist/index.js', 'native/index.cjs', 'native/index.d.ts'), binding)).toEqual([]);
	});

	it('names a missing loader and missing typings', () => {
		expect(nativePackGaps(packed('dist/index.js'), binding)).toEqual(['native/index.cjs', 'native/index.d.ts']);
	});
});

describe('unexpectedNativeFiles', () => {
	it('names every file under native/ besides the loader and its typings: a binary ships in its platform package', () => {
		const entries = packed(
			'native/index.cjs',
			'native/index.d.ts',
			'native/sittir-rust.darwin-arm64.node',
			'native/libsittir_engine.dylib',
			'dist/other.node'
		);
		expect(unexpectedNativeFiles(entries, binding)).toEqual(['native/sittir-rust.darwin-arm64.node', 'native/libsittir_engine.dylib']);
	});

	it('finds none in a pack holding only the loader and its typings', () => {
		expect(unexpectedNativeFiles(packed('native/index.cjs', 'native/index.d.ts', 'dist/index.js'), binding)).toEqual([]);
	});
});

describe('optionalDependencyGaps', () => {
	const platformPackages = ['sittir-rust-darwin-arm64', 'sittir-rust-linux-x64-gnu'];

	it('accepts one optional dependency per platform package, each at the grammar package version', () => {
		const manifest = { version: '0.2.0', optionalDependencies: { 'sittir-rust-darwin-arm64': '0.2.0', 'sittir-rust-linux-x64-gnu': '0.2.0' } };
		expect(optionalDependencyGaps(manifest, platformPackages)).toEqual([]);
	});

	it('names a missing platform, a platform at another version and an optional dependency no platform package matches', () => {
		const manifest = { version: '0.2.0', optionalDependencies: { 'sittir-rust-darwin-arm64': '0.1.0', 'sittir-rust-win32-arm64-msvc': '0.2.0' } };
		expect(optionalDependencyGaps(manifest, platformPackages)).toEqual([
			'sittir-rust-darwin-arm64 is at 0.1.0, not 0.2.0',
			'sittir-rust-linux-x64-gnu is not an optional dependency',
			'sittir-rust-win32-arm64-msvc is an optional dependency but no platform package'
		]);
	});
});

const ELF = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0]);
const STD = 'libstd-0123456789abcdef.so';
const NODE = 'sittir-rust.linux-x64-gnu.node';
const stamped = (stamp: string, ...linked: string[]) =>
	Buffer.concat([ELF, Buffer.from(`sittir-engine-stamp:${stamp}\0`), ...linked.map((name) => Buffer.from(`${name}\0`))]);

function tree(root: string, files: Readonly<Record<string, Buffer | string>>): string {
	for (const [file, bytes] of Object.entries(files)) {
		mkdirSync(join(root, file, '..'), { recursive: true });
		writeFileSync(join(root, file), bytes);
	}
	return root;
}

const scratch = (name: string): string => mkdtempSync(join(tmpdir(), `sittir-${name}-`));

describe('platformPackGaps', () => {
	it('accepts a platform pack holding the .node, the engine and the std it links, under one stamp', () => {
		const dir = tree(scratch('platform-pack'), {
			[NODE]: stamped('0.2.0@abc', 'libsittir_engine.so', STD),
			'libsittir_engine.so': stamped('0.2.0@abc', STD),
			[STD]: ELF
		});
		expect(platformPackGaps(dir, 'sittir-rust', 'linux-x64-gnu')).toEqual([]);
	});

	it('names each copy the pack lacks', () => {
		const dir = tree(scratch('platform-pack'), { [NODE]: stamped('0.2.0@abc', 'libsittir_engine.so', STD) });
		expect(platformPackGaps(dir, 'sittir-rust', 'linux-x64-gnu')).toEqual(['lacks libsittir_engine.so', `lacks ${STD}`]);
	});

	it('names an engine copy that holds another stamp than the .node', () => {
		const dir = tree(scratch('platform-pack'), {
			[NODE]: stamped('0.2.0@abc', 'libsittir_engine.so', STD),
			'libsittir_engine.so': stamped('0.2.0@def', STD),
			[STD]: ELF
		});
		expect(platformPackGaps(dir, 'sittir-rust', 'linux-x64-gnu')).toEqual([
			`${NODE} was built against engine 0.2.0@abc, but libsittir_engine.so is 0.2.0@def`
		]);
	});

	it('names a missing .node and checks nothing else', () => {
		expect(platformPackGaps(scratch('platform-pack'), 'sittir-rust', 'linux-x64-gnu')).toEqual([`lacks ${NODE}`]);
	});
});

describe('shipLinkedCopies', () => {
	function layout(...sourceFiles: string[]): { packageDir: string; source: string } {
		const root = scratch('platform-package');
		const packageDir = join(root, 'npm', 'linux-x64-gnu');
		const source = join(root, 'build');
		const image = Buffer.concat([ELF, Buffer.from(`libsittir_engine.so\0${STD}\0`)]);
		tree(packageDir, { [NODE]: image, 'package.json': JSON.stringify({ name: 'sittir-rust-linux-x64-gnu', main: NODE, files: [NODE] }) });
		tree(source, { [NODE]: image, ...Object.fromEntries(sourceFiles.map((file) => [file, file])) });
		return { packageDir, source };
	}

	it('copies the engine and the std its .node links beside it, and lists both in files', () => {
		const { packageDir, source } = layout('libsittir_engine.so', STD, 'libstd-fedcba9876543210.so');
		expect(shipLinkedCopies(packageDir, source)).toEqual(['libsittir_engine.so', STD]);
		expect(readdirSync(packageDir).sort()).toEqual(['libsittir_engine.so', STD, 'package.json', NODE].sort());
		expect(JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')).files).toEqual([NODE, 'libsittir_engine.so', STD]);
		expect(readFileSync(join(packageDir, STD), 'utf8')).toBe(STD);
	});

	it('refuses by name when the build left a copy out', () => {
		const { packageDir, source } = layout('libsittir_engine.so');
		expect(() => shipLinkedCopies(packageDir, source)).toThrow(`${join(source, NODE)} links ${STD}, which ${source} does not hold`);
	});
});

describe('the platform packages napi makes, filled from a release build tree', () => {
	const DARWIN_NODE = 'sittir-probe.darwin-arm64.node';
	const LINUX_NODE = 'sittir-probe.linux-x64-gnu.node';
	const DARWIN_STD = 'libstd-0123456789abcdef.dylib';
	const linking = (...names: string[]) => Buffer.concat([ELF, ...names.map((name) => Buffer.from(`${name}\0`))]);

	function release(targets: readonly ('darwin' | 'linux')[]): { pkg: NapiPackage; artifacts: string } {
		const root = scratch('napi-release');
		const pkg = { dir: join(root, 'packages', 'probe'), config: join(root, 'crate', 'napi.json') };
		tree(root, {
			'packages/probe/package.json': JSON.stringify({ name: '@sittir/probe', version: '0.2.0', description: 'probe', license: 'MIT' }),
			'crate/napi.json': JSON.stringify({
				binaryName: 'sittir-probe',
				packageName: 'sittir-probe',
				targets: ['aarch64-apple-darwin', 'x86_64-unknown-linux-gnu']
			})
		});
		const artifacts = join(root, 'artifacts');
		if (targets.includes('darwin')) {
			tree(join(artifacts, 'bindings-aarch64-apple-darwin', 'probe', 'native'), {
				[DARWIN_NODE]: linking('@rpath/libsittir_engine.dylib', `@rpath/${DARWIN_STD}`),
				'libsittir_engine.dylib': 'darwin engine',
				[DARWIN_STD]: 'darwin std'
			});
		}
		if (targets.includes('linux')) {
			tree(join(artifacts, 'bindings-x86_64-unknown-linux-gnu', 'probe', 'native'), {
				[LINUX_NODE]: linking('libsittir_engine.so', STD),
				'libsittir_engine.so': 'linux engine',
				[STD]: 'linux std'
			});
		}
		return { pkg, artifacts };
	}

	const manifestOf = (dir: string) => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name: string; version: string; files: string[] };

	it('gives each target package its .node from the build tree, with the engine and std copies built beside it', () => {
		const { pkg, artifacts } = release(['darwin', 'linux']);
		const dirs = assembleNativePackages(pkg, artifacts);
		expect(dirs.map((dir) => manifestOf(dir).name).sort()).toEqual(['sittir-probe-darwin-arm64', 'sittir-probe-linux-x64-gnu']);
		const darwin = dirs.find((dir) => dir.endsWith('darwin-arm64'))!;
		expect(manifestOf(darwin)).toMatchObject({ version: '0.2.0', files: [DARWIN_NODE, 'libsittir_engine.dylib', DARWIN_STD] });
		expect(readFileSync(join(darwin, 'libsittir_engine.dylib'), 'utf8')).toBe('darwin engine');
		const linux = dirs.find((dir) => dir.endsWith('linux-x64-gnu'))!;
		expect(readdirSync(linux).sort()).toEqual([LINUX_NODE, 'README.md', 'libsittir_engine.so', STD, 'package.json'].sort());
	}, 60_000);

	it('fills only the named targets', () => {
		const { pkg, artifacts } = release(['linux']);
		expect(assembleNativePackages(pkg, artifacts, ['linux-x64-gnu']).map((dir) => manifestOf(dir).name)).toEqual(['sittir-probe-linux-x64-gnu']);
	}, 60_000);

	it('refuses a build tree that lacks a target', () => {
		const { pkg, artifacts } = release(['linux']);
		expect(() => assembleNativePackages(pkg, artifacts)).toThrow(`${artifacts} holds 0 copies of ${DARWIN_NODE}, not one`);
	}, 60_000);

	it('declares every platform package as an optional dependency of the grammar package, at its version', () => {
		const { pkg, artifacts } = release(['darwin', 'linux']);
		assembleNativePackages(pkg, artifacts);
		declareNativePackages(pkg);
		expect(JSON.parse(readFileSync(join(pkg.dir, 'package.json'), 'utf8')).optionalDependencies).toEqual({
			'sittir-probe-darwin-arm64': '0.2.0',
			'sittir-probe-linux-x64-gnu': '0.2.0'
		});
	}, 60_000);
});

const linkingEngineAndStd = Buffer.concat([ELF, Buffer.from(`libsittir_engine.so\0${STD}\0`)]);

describe('hostInstallSize', () => {
	const grammarPackage = {
		'packages/regex/package.json': JSON.stringify({ name: '@sittir/regex', version: '0.2.0', files: ['dist', 'native'] }),
		'packages/regex/dist/index.js': 'export {};\n'.repeat(100)
	};

	it('counts the grammar package alone for a tree that ships no platform package', () => {
		const root = tree(scratch('install-size'), { ...grammarPackage, 'packages/regex/native/sittir-regex.linux-x64-gnu.node': 'x'.repeat(4096) });
		const size = hostInstallSize(root, 'regex', 'linux-x64-gnu');
		expect(Object.keys(size.packages)).toEqual(['@sittir/regex']);
		const files = ['package.json', 'dist/index.js', 'native/sittir-regex.linux-x64-gnu.node'];
		expect(size.packages['@sittir/regex']).toBe(files.reduce((sum, file) => sum + statSync(join(root, 'packages', 'regex', file)).size, 0));
		expect(size.bytes).toBe(size.packages['@sittir/regex']);
	}, 60_000);

	it("adds the host platform package napi makes from the tree's own build, and leaves no npm folder behind", () => {
		const native = 'packages/regex/native';
		const root = tree(scratch('install-size'), {
			...grammarPackage,
			'rust/crates/sittir-regex/napi.json': JSON.stringify({ binaryName: 'sittir-regex', packageName: 'sittir-regex', targets: ['x86_64-unknown-linux-gnu'] }),
			[`${native}/sittir-regex.linux-x64-gnu.node`]: linkingEngineAndStd,
			[`${native}/libsittir_engine.so`]: 'e'.repeat(2048),
			[`${native}/${STD}`]: 's'.repeat(1024)
		});
		const size = hostInstallSize(root, 'regex', 'linux-x64-gnu');
		expect(Object.keys(size.packages)).toEqual(['@sittir/regex', 'sittir-regex-linux-x64-gnu']);
		const binaries = ['sittir-regex.linux-x64-gnu.node', 'libsittir_engine.so', STD].reduce((sum, file) => sum + statSync(join(root, native, file)).size, 0);
		expect(size.packages['sittir-regex-linux-x64-gnu']).toBeGreaterThan(binaries);
		expect(size.bytes).toBe(size.packages['@sittir/regex']! + size.packages['sittir-regex-linux-x64-gnu']!);
		expect(existsSync(join(root, 'packages', 'regex', 'npm'))).toBe(false);
	}, 60_000);
});
