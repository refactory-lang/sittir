import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { NATIVE_NAPI_CONFIG, grammarPackageDir, nativeCrateDir, type GrammarName } from '@sittir/codegen/grammars';
import { engineLibraryName, engineStampOf, stdLibrariesLinkedBy } from '@sittir/common/engine';
import { packageBin, run } from './spawn.ts';

export interface PlatformPackageManifest {
	readonly name: string;
	readonly main: string;
	readonly files?: readonly string[];
}

export const readManifest = <T>(dir: string): T => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as T;

export function shipLinkedCopies(packageDir: string, source: string): string[] {
	const manifest = readManifest<PlatformPackageManifest>(packageDir);
	const image = join(source, manifest.main);
	const copies = [engineLibraryName(basename(packageDir)), ...stdLibrariesLinkedBy(image)];
	for (const copy of copies) {
		if (!existsSync(join(source, copy))) throw new Error(`${image} links ${copy}, which ${source} does not hold`);
		copyFileSync(join(source, copy), join(packageDir, copy));
	}
	const files = [...new Set([...(manifest.files ?? []), ...copies])];
	writeFileSync(join(packageDir, 'package.json'), `${JSON.stringify({ ...manifest, files }, null, 2)}\n`);
	return copies;
}

export const NATIVE_PACKAGES_DIR = 'npm';

export interface NapiPackage {
	readonly dir: string;
	readonly config: string;
}

export function grammarNapiPackage(grammar: GrammarName): NapiPackage {
	return { dir: grammarPackageDir(grammar), config: join(nativeCrateDir(grammar), NATIVE_NAPI_CONFIG) };
}

function napi(pkg: NapiPackage, command: string, ...flags: string[]): void {
	run(
		process.execPath,
		[packageBin('@napi-rs/cli', 'napi'), command, '--cwd', pkg.dir, '--config-path', pkg.config, '--npm-dir', NATIVE_PACKAGES_DIR, ...flags],
		pkg.dir
	);
}

export function nativePackageDirs(pkg: NapiPackage): string[] {
	const root = join(pkg.dir, NATIVE_PACKAGES_DIR);
	return readdirSync(root).map((suffix) => join(root, suffix));
}

export function assembleNativePackages(pkg: NapiPackage, artifacts: string, suffixes?: readonly string[]): string[] {
	rmSync(join(pkg.dir, NATIVE_PACKAGES_DIR), { recursive: true, force: true });
	napi(pkg, 'create-npm-dirs');
	const files = readdirSync(artifacts, { encoding: 'utf8', recursive: true });
	const created = nativePackageDirs(pkg);
	const filled = suffixes === undefined ? created : created.filter((dir) => suffixes.includes(basename(dir)));
	for (const dir of filled) {
		const { main } = readManifest<PlatformPackageManifest>(dir);
		const found = files.filter((file) => basename(file) === main);
		if (found.length !== 1) throw new Error(`${artifacts} holds ${found.length} copies of ${main}, not one`);
		const source = dirname(join(artifacts, found[0]!));
		copyFileSync(join(source, main), join(dir, main));
		shipLinkedCopies(dir, source);
	}
	return filled;
}

export function declareNativePackages(pkg: NapiPackage): void {
	napi(pkg, 'pre-publish', '--skip-optional-publish', '--no-gh-release');
}

export function publishNativePackages(pkg: NapiPackage, dryRun: boolean): void {
	if (!dryRun) return napi(pkg, 'pre-publish', '--no-gh-release');
	for (const dir of nativePackageDirs(pkg)) process.stdout.write(run('npm', ['publish', '--dry-run'], dir));
}

export interface PackedBinding {
	readonly binaryName: string;
	readonly loader: string;
	readonly typings: string;
}

const unpacked = (entries: readonly string[]): string[] => entries.map((entry) => entry.replace(/^package\//, ''));
const shippedNative = (binding: PackedBinding): string[] => [binding.loader, binding.typings].map((file) => `native/${file}`);

export function nativePackGaps(entries: readonly string[], binding: PackedBinding): string[] {
	const packed = new Set(unpacked(entries));
	return shippedNative(binding).filter((file) => !packed.has(file));
}

export function unexpectedNativeFiles(entries: readonly string[], binding: PackedBinding): string[] {
	const shipped = new Set(shippedNative(binding));
	return unpacked(entries).filter((file) => file.startsWith('native/') && !shipped.has(file));
}

export interface GrammarManifest {
	readonly version: string;
	readonly optionalDependencies?: Readonly<Record<string, string>>;
}

export function optionalDependencyGaps(manifest: GrammarManifest, platformPackages: readonly string[]): string[] {
	const declared = manifest.optionalDependencies ?? {};
	return [
		...platformPackages.flatMap((name) => {
			const version = declared[name];
			if (version === undefined) return [`${name} is not an optional dependency`];
			return version === manifest.version ? [] : [`${name} is at ${version}, not ${manifest.version}`];
		}),
		...Object.keys(declared)
			.filter((name) => !platformPackages.includes(name))
			.map((name) => `${name} is an optional dependency but no platform package`)
	];
}

export function platformPackGaps(dir: string, binaryName: string, suffix: string): string[] {
	const node = `${binaryName}.${suffix}.node`;
	if (!existsSync(join(dir, node))) return [`lacks ${node}`];
	const engine = engineLibraryName(suffix);
	const lacking = [engine, ...stdLibrariesLinkedBy(join(dir, node))].filter((copy) => !existsSync(join(dir, copy)));
	if (lacking.length > 0) return lacking.map((copy) => `lacks ${copy}`);
	const [built, copied] = [engineStampOf(join(dir, node)), engineStampOf(join(dir, engine))];
	return built === copied ? [] : [`${node} was built against engine ${built}, but ${engine} is ${copied}`];
}
