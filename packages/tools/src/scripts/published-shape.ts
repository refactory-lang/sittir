import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import {
	NATIVE_LOADER,
	NATIVE_TYPINGS,
	PACKAGES_DIR,
	assertGrammar,
	grammarPackageDir,
	nativeBinaryName,
	nativeBindingDir,
	nativePlatformPackage,
	stableGrammars
} from '@sittir/codegen/grammars';
import { hostPlatform, platformPackageName, platformSuffix } from '@sittir/common/engine';
import {
	NATIVE_PACKAGES_DIR,
	assembleNativePackages,
	grammarNapiPackage,
	nativePackGaps,
	nativePackageDirs,
	optionalDependencyGaps,
	pack,
	packWorkspacePackage,
	platformPackGaps,
	readManifest,
	unexpectedNativeFiles,
	type GrammarManifest,
	type PlatformPackageManifest
} from '../native-pack.ts';
import { packageBin, run } from '../spawn.ts';
import { SAMPLE_SOURCE } from '../sample-source.ts';

const SMOKE = `import { createEngine } from '@sittir/common';
const [name, source] = process.argv.slice(2);
const { default: language } = await import('@sittir/' + name);
const engine = await createEngine(language);
const rendered = engine.parse(source).$render();
if (rendered !== source) throw new Error(name + ': rendered ' + JSON.stringify(rendered) + ', expected ' + JSON.stringify(source));
console.log('@sittir/' + name + ': createEngine, parse and render from the installed package');
`;

const TYPES_CHECK = `import type { SlotKey } from '@sittir/types';
interface Node { readonly _argument: readonly string[]; readonly __slotNames__?: { readonly _argument: 'arguments' } }
export const plural: SlotKey<Node, 'argument'> = 'arguments';
// @ts-expect-error a slot key is the model's slot name, not the storage name
export const storage: SlotKey<Node, 'argument'> = 'argument';
`;

const TYPES_CHECK_CONFIG = {
	compilerOptions: { target: 'esnext', module: 'nodenext', strict: true, noEmit: true, skipLibCheck: false, types: [] },
	files: ['types.ts']
};

function unpack(tarball: string, into: string): string {
	const dir = mkdtempSync(join(into, 'unpacked-'));
	run('tar', ['-xzf', tarball, '-C', dir], into);
	return join(dir, 'package');
}

const args = process.argv.slice(2);
const release = args.includes('--release');
const named = args.filter((arg) => arg !== '--release');
const grammars = named.length === 0 ? stableGrammars() : named.map(assertGrammar);
const host = platformSuffix(hostPlatform());

const root = mkdtempSync(join(tmpdir(), 'sittir-published-'));
const assembled: string[] = [];
try {
	const tarballs = join(root, 'tarballs');
	const consumer = join(root, 'consumer');
	mkdirSync(tarballs);
	mkdirSync(consumer);

	const dependencies: Record<string, string> = {};
	for (const name of ['types', 'common']) dependencies[`@sittir/${name}`] = `file:${packWorkspacePackage(join(PACKAGES_DIR, name), tarballs)}`;

	const gaps: string[] = [];
	for (const grammar of grammars) {
		const label = `@sittir/${grammar}`;
		const tarball = packWorkspacePackage(grammarPackageDir(grammar), tarballs);
		const entries = run('tar', ['-tzf', tarball], root).split('\n');
		const binding = { binaryName: nativeBinaryName(grammar), loader: NATIVE_LOADER, typings: NATIVE_TYPINGS };
		gaps.push(...nativePackGaps(entries, binding).map((file) => `${label}: lacks ${file}`));
		gaps.push(...unexpectedNativeFiles(entries, binding).map((file) => `${label}: holds ${file}, which ships in a platform package`));
		dependencies[label] = `file:${tarball}`;

		const pkg = grammarNapiPackage(grammar);
		if (!release) assembled.push(join(pkg.dir, NATIVE_PACKAGES_DIR));
		const platformDirs = release ? nativePackageDirs(pkg) : assembleNativePackages(pkg, nativeBindingDir(grammar), [host]);
		const platformPackages = platformDirs.map((dir) => readManifest<PlatformPackageManifest>(dir).name);
		if (release) {
			const manifest = readManifest<GrammarManifest>(unpack(tarball, root));
			gaps.push(...optionalDependencyGaps(manifest, platformPackages).map((gap) => `${label}: ${gap}`));
		}
		for (const [index, dir] of platformDirs.entries()) {
			const name = platformPackages[index]!;
			const suffix = basename(dir);
			const looked = platformPackageName(nativePlatformPackage(grammar), suffix);
			if (name !== looked) gaps.push(`${name}: napi names the ${suffix} package ${name}, but a failed load looks for ${looked}`);
			const platformTarball = pack('npm', dir, tarballs);
			gaps.push(...platformPackGaps(unpack(platformTarball, root), binding.binaryName, suffix).map((gap) => `${name}: ${gap}`));
			if (suffix === host) dependencies[name] = `file:${platformTarball}`;
		}
	}
	if (gaps.length > 0) {
		throw new Error(`${release ? 'release' : 'host'} pack check failed:\n  ${gaps.join('\n  ')}`);
	}

	writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module', dependencies }));
	writeFileSync(join(consumer, 'smoke.mjs'), SMOKE);
	run('npm', ['install', '--no-audit', '--no-fund'], consumer);
	writeFileSync(join(consumer, 'types.ts'), TYPES_CHECK);
	writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify(TYPES_CHECK_CONFIG));
	run(process.execPath, [packageBin('typescript', 'tsc'), '-p', consumer], consumer);
	console.log('@sittir/types: type-checks from the installed package, without its devDependencies');
	for (const grammar of grammars) {
		const source = SAMPLE_SOURCE[grammar];
		if (source === undefined) throw new Error(`no sample source for grammar '${grammar}'`);
		process.stdout.write(run('node', ['smoke.mjs', grammar, source], consumer));
	}
} finally {
	rmSync(root, { recursive: true, force: true });
	for (const dir of assembled) rmSync(dir, { recursive: true, force: true });
}
