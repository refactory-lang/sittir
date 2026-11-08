import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	NATIVE_LOADER,
	REPO_ROOT,
	type GrammarName,
	allGrammars,
	nativeBinaryName,
	nativeBindingDir,
	nativePlatformPackage
} from '@sittir/codegen/grammars';
import { LOADED_ENGINE, engineLibraryName, engineStampOf, hostPlatform, isStdLibrary, platformSuffix } from '@sittir/common/engine';
import { languageByName } from '../src/languages.ts';
import { imageSymbols } from '../src/native-images.ts';

const ENGINE = engineLibraryName(platformSuffix(hostPlatform()));
const ENGINE_LOADED_STATIC = /13sittir_engine5stamp6LOADED/;

const run = (command: string, args: readonly string[]): string =>
	execFileSync(command, args, { encoding: 'utf8', maxBuffer: 1 << 28 });

const LOAD_FAILURE_PROBE = `
const [binding, loader, packageName, binaryName, platformPackage, dir] = process.argv.slice(1);
const { createRequire } = await import('node:module');
const { nativeLoadFailure } = await import(binding);
try {
	createRequire(loader)(loader);
	console.log('loaded');
} catch (error) {
	console.log(nativeLoadFailure({ packageName, binaryName, platformPackage, dir }, error));
}`;

function reasonInAFreshProcess(grammar: GrammarName, dir: string): string {
	const binding = pathToFileURL(join(REPO_ROOT, 'packages', 'common', 'src', 'native-binding.ts')).href;
	const args = [binding, join(dir, NATIVE_LOADER), `@sittir/${grammar}`, nativeBinaryName(grammar), nativePlatformPackage(grammar), dir];
	return execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', LOAD_FAILURE_PROBE, ...args], {
		cwd: REPO_ROOT,
		encoding: 'utf8'
	}).trim();
}

interface Links {
	readonly libraries: readonly string[];
	readonly searchPaths: readonly string[];
}

function links(image: string): Links {
	if (process.platform === 'darwin') {
		return {
			libraries: run('otool', ['-L', image])
				.split('\n')
				.slice(1)
				.map((line) => line.trim().split(' ')[0]!)
				.filter(Boolean),
			searchPaths: [...run('otool', ['-l', image]).matchAll(/cmd LC_RPATH\n\s+cmdsize \d+\n\s+path (\S+)/g)].map(
				(match) => match[1]!
			)
		};
	}
	const dynamic = run('readelf', ['-d', image]);
	return {
		libraries: [...dynamic.matchAll(/\(NEEDED\).*\[(.+)\]/g)].map((match) => match[1]!),
		searchPaths: [...dynamic.matchAll(/\(RUNPATH\).*\[(.+)\]/g)].map((match) => match[1]!)
	};
}

const NM_FLAGS = {
	defined: { darwin: ['-U'], linux: ['--defined-only'] },
	exported: { darwin: ['-g', '-U'], linux: ['--dynamic', '--defined-only'] },
	imported: { darwin: ['-u'], linux: ['--dynamic', '--undefined-only'] }
} as const;

const symbols = (image: string, which: keyof typeof NM_FLAGS): Set<string> =>
	new Set(
		run('nm', [...NM_FLAGS[which][process.platform as 'darwin' | 'linux'], '-j', image])
			.split('\n')
			.map((name) => name.trim().replace(/^_/, '').replace(/@.*$/, ''))
			.filter(Boolean)
	);

describe('a grammar binding ships the engine and std copies its .node loads', () => {
	for (const grammar of allGrammars()) {
		describe(grammar, () => {
			const dir = nativeBindingDir(grammar);
			const files = readdirSync(dir);
			const node = files.find((file) => file.endsWith('.node'));
			const std = files.filter(isStdLibrary);

			it('holds the .node, the engine and one std copy in one folder', () => {
				expect(node, `build ${grammar}'s binding with scripts/build-native.mts`).toBeDefined();
				expect(files).toContain(ENGINE);
				expect(std).toHaveLength(1);
			});

			it('holds one stamp in the .node and the engine copy, the one the loaded engine reports', () => {
				const native = createRequire(import.meta.url)(join(dir, NATIVE_LOADER)) as { engineStamp(): { stamp: string } };
				expect(engineStampOf(join(dir, node!))).toBe(native.engineStamp().stamp);
				expect(engineStampOf(join(dir, ENGINE))).toBe(native.engineStamp().stamp);
			});

			it.each(['engine', 'std'] as const)(
				'names its %s copy when native/ lacks it, from the reason a fresh process gets',
				(copy) => {
					const missing = copy === 'engine' ? ENGINE : std[0]!;
					const scratch = mkdtempSync(join(tmpdir(), 'sittir-missing-copy-'));
					for (const file of [NATIVE_LOADER, node!, ENGINE, std[0]!].filter((file) => file !== missing))
						copyFileSync(join(dir, file), join(scratch, file));
					expect(reasonInAFreshProcess(grammar, scratch)).toBe(
						`@sittir/${grammar}: native/${node} is present and failed to load: ${missing}, which it links, is missing from native/`
					);
				}
			);

			it("reads the mapped engine's stamp as data, which the loader binds when it maps the .node", async () => {
				const { boundAtLoad = [] } = await imageSymbols(join(dir, node!), { boundAtLoad: '' });
				expect(boundAtLoad.filter((name) => ENGINE_LOADED_STATIC.test(name))).toHaveLength(1);
			});

			it.runIf(process.platform === 'darwin' || process.platform === 'linux')(
				'links the engine and std from its own folder',
				() => {
					const { libraries, searchPaths } = links(join(dir, node!));
					const named = process.platform === 'darwin' ? (file: string) => `@rpath/${file}` : (file: string) => file;
					expect(libraries).toEqual(expect.arrayContaining([named(ENGINE), named(std[0]!)]));
					expect(searchPaths).toEqual([process.platform === 'darwin' ? '@loader_path' : '$ORIGIN']);
				}
			);

			it.runIf(process.platform === 'darwin' || process.platform === 'linux')(
				'takes the tree-sitter runtime from the engine and defines none of it',
				() => {
					const runtime = symbols(join(dir, ENGINE), 'exported');
					const image = join(dir, node!);
					expect([...symbols(image, 'imported')].filter((name) => runtime.has(name))).not.toEqual([]);
					expect([...symbols(image, 'defined')].filter((name) => runtime.has(name))).toEqual([]);
				}
			);

			it.runIf(process.platform === 'darwin')(
				'names std by @rpath from the engine and from its own id, and every image is signed',
				() => {
					const engine = join(dir, ENGINE);
					const stdCopy = join(dir, std[0]!);
					expect(links(engine).libraries).toEqual(
						expect.arrayContaining(['@rpath/libsittir_engine.dylib', `@rpath/${std[0]}`])
					);
					expect(links(stdCopy).libraries[0]).toBe(`@rpath/${std[0]}`);
					for (const image of [join(dir, node!), engine, stdCopy])
						expect(() => execFileSync('codesign', ['-v', image], { stdio: 'pipe' })).not.toThrow();
				}
			);
		});
	}
});

describe('a grammar backend that loads its binding', () => {
	it('records the engine image the process mapped, as text', async () => {
		const grammar = allGrammars()[0]!;
		(await (await languageByName(grammar)).load()).createNative();
		const native = createRequire(import.meta.url)(join(nativeBindingDir(grammar), NATIVE_LOADER)) as {
			engineStamp(): { stamp: string; path?: string };
		};
		expect((globalThis as Record<symbol, unknown>)[LOADED_ENGINE]).toEqual(native.engineStamp());
	});
});
