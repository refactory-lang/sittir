import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { NATIVE_LOADER, allGrammars, nativeBindingDir } from '@sittir/codegen/grammars';
import { LOADED_ENGINE, engineStampFileOf } from '@sittir/common/engine';
import { languageByName } from '../src/languages.ts';

const ENGINE: Partial<Record<NodeJS.Platform, string>> = {
	darwin: 'libsittir_engine.dylib',
	linux: 'libsittir_engine.so',
	win32: 'sittir_engine.dll'
};
const STD = /^(?:lib)?std-[0-9a-f]+\.(?:dylib|so|dll)$/;

const run = (command: string, args: readonly string[]): string =>
	execFileSync(command, args, { encoding: 'utf8', maxBuffer: 1 << 28 });

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
			const std = files.filter((file) => STD.test(file));

			it('holds the .node, the engine and one std copy in one folder', () => {
				expect(node, `build ${grammar}'s binding with scripts/build-native.mts`).toBeDefined();
				expect(files).toContain(ENGINE[process.platform]);
				expect(std).toHaveLength(1);
			});

			it('holds the stamp its addon was built against, as the loaded engine reports it', () => {
				const native = createRequire(import.meta.url)(join(dir, NATIVE_LOADER)) as { engineStamp(): { stamp: string } };
				expect(readFileSync(join(dir, engineStampFileOf(node!)), 'utf8')).toBe(native.engineStamp().stamp);
			});

			it.runIf(process.platform === 'darwin' || process.platform === 'linux')(
				'links the engine and std from its own folder',
				() => {
					const { libraries, searchPaths } = links(join(dir, node!));
					const named = process.platform === 'darwin' ? (file: string) => `@rpath/${file}` : (file: string) => file;
					expect(libraries).toEqual(expect.arrayContaining([named(ENGINE[process.platform]!), named(std[0]!)]));
					expect(searchPaths).toEqual([process.platform === 'darwin' ? '@loader_path' : '$ORIGIN']);
				}
			);

			it.runIf(process.platform === 'darwin' || process.platform === 'linux')(
				'takes the tree-sitter runtime from the engine and defines none of it',
				() => {
					const runtime = symbols(join(dir, ENGINE[process.platform]!), 'exported');
					const image = join(dir, node!);
					expect([...symbols(image, 'imported')].filter((name) => runtime.has(name))).not.toEqual([]);
					expect([...symbols(image, 'defined')].filter((name) => runtime.has(name))).toEqual([]);
				}
			);

			it.runIf(process.platform === 'darwin')(
				'names std by @rpath from the engine and from its own id, and every image is signed',
				() => {
					const engine = join(dir, ENGINE.darwin!);
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
