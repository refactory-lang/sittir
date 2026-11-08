import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import {
	LOADED_ENGINE,
	type HostPlatform,
	engineLibraryName,
	engineStampOf,
	isStdLibrary,
	nativeLoadFailure,
	platformPackageName,
	platformSuffix,
	recordLoadedEngine,
	stdLibrariesLinkedBy,
	targetSuffix
} from '../src/native-binding.ts';

function nativeDir(...files: string[]): string {
	const dir = mkdtempSync(join(tmpdir(), 'sittir-native-'));
	for (const file of files) writeFileSync(join(dir, file), '');
	return dir;
}

const spec = (dir: string) => ({ packageName: '@sittir/rust', binaryName: 'sittir-rust', platformPackage: 'sittir-rust', dir });

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

describe('engineLibraryName', () => {
	it("spells the engine's file the way each platform's loader looks it up", () => {
		expect(engineLibraryName('darwin-arm64')).toBe('libsittir_engine.dylib');
		expect(engineLibraryName('linux-x64-gnu')).toBe('libsittir_engine.so');
		expect(engineLibraryName('linux-arm64-musl')).toBe('libsittir_engine.so');
		expect(engineLibraryName('win32-x64-msvc')).toBe('sittir_engine.dll');
	});
});

describe('platformPackageName', () => {
	it('names a per-platform package the way napi publishes it', () => {
		expect(platformPackageName('sittir-rust', 'linux-arm64-musl')).toBe('sittir-rust-linux-arm64-musl');
	});
});

describe('isStdLibrary', () => {
	it("takes each platform's std file and nothing that only resembles one", () => {
		expect(['libstd-0123456789abcdef.dylib', 'libstd-0123456789abcdef.so', 'std-0123456789abcdef.dll'].every(isStdLibrary)).toBe(true);
		expect(['libstd.dylib', 'libstd-0123456789abcdef.dylib.map', 'libsittir_engine.so', 'std-XYZ.dll'].some(isStdLibrary)).toBe(false);
	});
});

describe('stdLibrariesLinkedBy', () => {
	const image = (...linked: string[]): string => {
		const path = join(nativeDir(), 'image.node');
		writeFileSync(path, Buffer.concat([Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0]), ...linked.map((name) => Buffer.from(`${name}\0`))]));
		return path;
	};

	it('reads the std file an image links from its bytes, once, in any platform spelling', () => {
		expect(stdLibrariesLinkedBy(image('@rpath/libstd-0123456789abcdef.dylib', '@rpath/libstd-0123456789abcdef.dylib'))).toEqual([
			'libstd-0123456789abcdef.dylib'
		]);
		expect(stdLibrariesLinkedBy(image('libsittir_engine.so', 'libstd-0123456789abcdef.so'))).toEqual(['libstd-0123456789abcdef.so']);
		expect(stdLibrariesLinkedBy(image('sittir_engine.dll', 'std-0123456789abcdef.dll'))).toEqual(['std-0123456789abcdef.dll']);
	});

	it('reads none from an image that links no std', () => {
		expect(stdLibrariesLinkedBy(image('libsittir_engine.so'))).toEqual([]);
	});
});

describe('nativeLoadFailure', () => {
	it('names the platform, the file and package it looked for, and the platforms native/ holds', () => {
		const dir = nativeDir('index.cjs', 'sittir-rust.darwin-arm64.node', 'sittir-rust.linux-x64-gnu.node');
		const message = nativeLoadFailure(spec(dir), new Error('Cannot find native binding.'), {
			platform: 'win32',
			arch: 'arm64'
		});
		expect(message).toBe(
			'@sittir/rust has no native binary for win32-arm64-msvc: looked for native/sittir-rust.win32-arm64-msvc.node ' +
				'and the package sittir-rust-win32-arm64-msvc; native/ holds darwin-arm64, linux-x64-gnu'
		);
	});

	it('says so when native/ holds no binary and no per-platform package is installed', () => {
		const message = nativeLoadFailure(spec(nativeDir('index.cjs')), new Error('x'), { platform: 'darwin', arch: 'x64' });
		expect(message).toBe(
			'@sittir/rust has no native binary for darwin-x64: looked for native/sittir-rust.darwin-x64.node ' +
				'and the package sittir-rust-darwin-x64; native/ holds none'
		);
	});

	it('looks in the installed per-platform package, where a published binary and its copies live', () => {
		const root = mkdtempSync(join(tmpdir(), 'sittir-installed-'));
		const dir = join(root, 'node_modules', '@sittir', 'rust', 'native');
		const platform = join(root, 'node_modules', 'sittir-rust-linux-x64-gnu');
		mkdirSync(dir, { recursive: true });
		mkdirSync(platform, { recursive: true });
		writeFileSync(join(dir, 'index.cjs'), '');
		writeFileSync(join(platform, 'package.json'), JSON.stringify({ name: 'sittir-rust-linux-x64-gnu', main: 'sittir-rust.linux-x64-gnu.node' }));
		writeFileSync(join(platform, 'sittir-rust.linux-x64-gnu.node'), '');
		const message = nativeLoadFailure(spec(dir), napiLoadError('libsittir_engine.so: cannot open shared object file'), {
			platform: 'linux',
			arch: 'x64',
			libc: 'gnu'
		});
		expect(message).toBe(
			'@sittir/rust: sittir-rust-linux-x64-gnu/sittir-rust.linux-x64-gnu.node is present and failed to load: ' +
				'libsittir_engine.so, which it links, is missing from sittir-rust-linux-x64-gnu/'
		);
	});

	it('gives the load error when the binary is there and will not load', () => {
		const dir = nativeDir('sittir-rust.darwin-arm64.node', 'libsittir_engine.dylib');
		const dlopen = new Error(`dlopen(${dir}/sittir-rust.darwin-arm64.node, 0x0001): mis-aligned LINKEDIT string pool`);
		const missing = new Error("Cannot find module 'sittir-rust-darwin-arm64'", { cause: dlopen });
		const top = new Error('Cannot find native binding. npm has a bug related to optional dependencies', { cause: missing });
		const message = nativeLoadFailure(spec(dir), top, { platform: 'darwin', arch: 'arm64' });
		expect(message).toBe(
			`@sittir/rust: native/sittir-rust.darwin-arm64.node is present and failed to load: ${dlopen.message}`
		);
	});

	it('falls back to the outermost message when no cause names the binary', () => {
		const dir = nativeDir('sittir-rust.darwin-arm64.node', 'libsittir_engine.dylib');
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


function napiLoadError(failure: string): Error {
	const candidates = [
		"Cannot find module './sittir-rust.universal.node'",
		"Cannot find module 'sittir-rust-universal'",
		failure,
		"Cannot find module 'sittir-rust-host'",
		"Cannot find module './sittir-rust.wasi.cjs'",
		"Cannot find module 'sittir-rust-wasm32-wasi'"
	];
	const top = new Error('Cannot find native binding. npm has a bug related to optional dependencies');
	top.cause = candidates.reduce<Error | null>((previous, message) => {
		const error = new Error(message);
		error.cause = previous;
		return error;
	}, null);
	return top;
}

const registry = globalThis as Record<symbol, unknown>;

const NOT_A_STAMP = Buffer.concat([Buffer.from('sittir-engine-stamp:'), Buffer.from([0xff, 0x02, 0x00])]);

function imageHolding(...stamps: string[]): Buffer {
	return Buffer.concat([
		Buffer.from([0x7f, 0x45, 0x4c, 0x46]),
		NOT_A_STAMP,
		...stamps.flatMap((stamp) => [Buffer.from(`sittir-engine-stamp:${stamp}\0`), Buffer.from([1, 2, 3, 0])])
	]);
}

describe('engineStampOf', () => {
	const image = (...stamps: string[]): string => {
		const path = join(nativeDir(), 'image.node');
		writeFileSync(path, imageHolding(...stamps));
		return path;
	};

	it('reads the one stamp an image holds, however often it repeats, past bytes that only open like one', () => {
		expect(engineStampOf(image('0.1.0@a', '0.1.0@a'))).toBe('0.1.0@a');
	});

	it('refuses an image that holds no stamp, naming it', () => {
		const path = image();
		expect(() => engineStampOf(path)).toThrow(`${path} holds no engine stamp`);
	});

	it('refuses an image that holds two differing stamps, naming both, and never takes the first', () => {
		const path = image('0.1.0@a', '0.2.0@b');
		expect(() => engineStampOf(path)).toThrow(`${path} holds 2 differing engine stamps: 0.1.0@a, 0.2.0@b`);
	});
});

describe('nativeLoadFailure across engine releases', () => {
	afterEach(() => {
		delete registry[LOADED_ENGINE];
	});

	const darwin: HostPlatform = { platform: 'darwin', arch: 'arm64' };
	const refusal = (built: string) =>
		`sittir: sittir-rust was built against engine ${built} but loaded engine 0.1.0@a from /engines/libsittir_engine.dylib`;
	const presentFile = (host: HostPlatform) => `sittir-rust.${platformSuffix(host)}.node`;
	const stamped = (host: HostPlatform, ...built: string[]): string => {
		const dir = nativeDir();
		writeFileSync(join(dir, presentFile(host)), imageHolding(...built));
		return dir;
	};
	const withEngineCopy = (dir: string): string => {
		writeFileSync(join(dir, 'libsittir_engine.dylib'), '');
		return dir;
	};

	it("gives the engine's refusal from wherever napi's loader chain holds it", () => {
		const dir = nativeDir(presentFile(darwin));
		const message = nativeLoadFailure(spec(dir), napiLoadError(refusal('0.1.0@b')), darwin);
		expect(message).toBe(`@sittir/rust: native/${presentFile(darwin)} is present and failed to load: ${refusal('0.1.0@b')}`);
	});

	const symbolFailures: readonly [string, HostPlatform, (path: string) => string][] = [
		['macOS', darwin, (path) => `dlopen(${path}, 0x0001): Symbol not found: __RNvNtCs1_13sittir_engine5stamp6LOADED`],
		['glibc', { platform: 'linux', arch: 'x64', libc: 'gnu' }, (path) => `${path}: undefined symbol: _RNvNtCs1_13sittir_engine5stamp6LOADED`],
		['musl', { platform: 'linux', arch: 'x64', libc: 'musl' }, (path) => `Error relocating ${path}: _RNvNtCs1_13sittir_engine5stamp6LOADED: symbol not found`],
		['Windows', { platform: 'win32', arch: 'x64' }, (path) => `The specified procedure could not be found.\r\n\\\\?\\${path}`]
	];

	it.each(symbolFailures)(
		'maps a %s symbol failure to the same refusal, from the stamp the binary holds and the engine the process mapped, ahead of a copy missing beside it',
		(_, host, failure) => {
			registry[LOADED_ENGINE] = { stamp: '0.1.0@a', path: '/engines/libsittir_engine.dylib' };
			const dir = stamped(host, '0.2.0@b');
			const message = nativeLoadFailure(spec(dir), napiLoadError(failure(join(dir, presentFile(host)))), host);
			expect(message).toBe(`@sittir/rust: native/${presentFile(host)} is present and failed to load: ${refusal('0.2.0@b')}`);
		}
	);

	it("keeps the loader's reason when the binary was built against the engine the process mapped", () => {
		registry[LOADED_ENGINE] = { stamp: '0.1.0@a', path: '/engines/libsittir_engine.dylib' };
		const dir = withEngineCopy(stamped(darwin, '0.1.0@a'));
		const failure = symbolFailures[0]![2](join(dir, presentFile(darwin)));
		expect(nativeLoadFailure(spec(dir), napiLoadError(failure), darwin)).toBe(
			`@sittir/rust: native/${presentFile(darwin)} is present and failed to load: ${failure}`
		);
	});

	it.each([[], ['0.2.0@b', '0.3.0@c']])("keeps the loader's reason when the binary holds stamps %j, not exactly one", (...built) => {
		registry[LOADED_ENGINE] = { stamp: '0.1.0@a', path: '/engines/libsittir_engine.dylib' };
		const dir = withEngineCopy(stamped(darwin, ...built));
		const failure = symbolFailures[0]![2](join(dir, presentFile(darwin)));
		expect(nativeLoadFailure(spec(dir), napiLoadError(failure), darwin)).toBe(
			`@sittir/rust: native/${presentFile(darwin)} is present and failed to load: ${failure}`
		);
	});

	it.each([undefined, 42, 'text', {}, { stamp: 7 }, { stamp: '0.1.0@a', path: 7 }])(
		"keeps the loader's reason when the registry holds %o, changing nothing but the message",
		(entry) => {
			if (entry !== undefined) registry[LOADED_ENGINE] = entry;
			const dir = withEngineCopy(stamped(darwin, '0.2.0@b'));
			const failure = symbolFailures[0]![2](join(dir, presentFile(darwin)));
			expect(nativeLoadFailure(spec(dir), napiLoadError(failure), darwin)).toBe(
				`@sittir/rust: native/${presentFile(darwin)} is present and failed to load: ${failure}`
			);
			expect(registry[LOADED_ENGINE]).toBe(entry);
		}
	);
});

describe('nativeLoadFailure when a copy the binary links is missing', () => {
	const hosts: readonly [string, HostPlatform, string, string][] = [
		['macOS', { platform: 'darwin', arch: 'arm64' }, 'libsittir_engine.dylib', '@rpath/libstd-0123456789abcdef.dylib'],
		['glibc', { platform: 'linux', arch: 'x64', libc: 'gnu' }, 'libsittir_engine.so', 'libstd-0123456789abcdef.so'],
		['musl', { platform: 'linux', arch: 'arm64', libc: 'musl' }, 'libsittir_engine.so', 'libstd-0123456789abcdef.so'],
		['Windows', { platform: 'win32', arch: 'x64' }, 'sittir_engine.dll', 'std-0123456789abcdef.dll']
	];
	const binaryOf = (host: HostPlatform) => `sittir-rust.${platformSuffix(host)}.node`;
	const linking = (host: HostPlatform, engine: string, std: string, ...copies: string[]): string => {
		const dir = nativeDir(...copies);
		writeFileSync(join(dir, binaryOf(host)), Buffer.concat([Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0]), Buffer.from(`${engine}\0${std}\0`)]));
		return dir;
	};
	const loaderSaid = (engine: string) => napiLoadError(`${engine}: cannot open shared object file: No such file or directory`);

	it.each(hosts)('names the %s engine copy a present binary links when native/ lacks it', (_, host, engine, std) => {
		const dir = linking(host, engine, std, basename(std));
		expect(nativeLoadFailure(spec(dir), loaderSaid(engine), host)).toBe(
			`@sittir/rust: native/${binaryOf(host)} is present and failed to load: ${engine}, which it links, is missing from native/`
		);
	});

	it.each(hosts)('names the %s std copy the binary links, read from its bytes, when native/ lacks it', (_, host, engine, std) => {
		const dir = linking(host, engine, std, engine);
		expect(nativeLoadFailure(spec(dir), loaderSaid(basename(std)), host)).toBe(
			`@sittir/rust: native/${binaryOf(host)} is present and failed to load: ${basename(std)}, which it links, is missing from native/`
		);
	});
});

describe('recordLoadedEngine', () => {
	afterEach(() => {
		delete registry[LOADED_ENGINE];
	});

	it('records nothing and throws nothing when the binding cannot name its engine, so the load goes on', () => {
		expect(() => recordLoadedEngine({})).not.toThrow();
		expect(() =>
			recordLoadedEngine({
				engineStamp: () => {
					throw new Error('no stamp');
				}
			})
		).not.toThrow();
		expect(registry[LOADED_ENGINE]).toBeUndefined();
	});

	it('keeps the first engine the process mapped, as text', () => {
		recordLoadedEngine({ engineStamp: () => ({ stamp: '0.1.0@a', path: '/a/libsittir_engine.dylib' }) });
		recordLoadedEngine({ engineStamp: () => ({ stamp: '0.1.0@b', path: '/b/libsittir_engine.dylib' }) });
		expect(registry[LOADED_ENGINE]).toEqual({ stamp: '0.1.0@a', path: '/a/libsittir_engine.dylib' });
	});
});
