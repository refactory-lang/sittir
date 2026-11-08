// Usage: tsx scripts/build-native.mts <grammar> [napi build flags…]
//
// Builds a grammar's native binding into the grammar package that ships it
// (`packages/<grammar>/native`): the loader, its typings and the host's `.node`.
// The crate's `build` scripts, CI and the release all go through here, so the
// output location has one owner. Extra flags (`--release`, `--profile gate`,
// `--target`, a cross flag) pass through to `napi build`. Each build records
// its profile, its native inputs and its binary's hash (`native-binary-freshness.ts`),
// which validation and `regen:all` hold the binary to. Every build carries
// the record codec (the crate's `arena` feature) beside the object codec, so
// one binary serves both node storages; the engine's `nodeStorage` picks.
// Its RUSTFLAGS are the target's row of `NATIVE_RUSTFLAGS`, then any
// RUSTFLAGS the environment already sets, then the build's own (`/MAP`):
// cargo reads no config rustflags once RUSTFLAGS is set, and the napi CLI
// sets it on every musl build.
//
// The row links every binding against the shared engine library and Rust's
// std dynamically (`-C prefer-dynamic`), so the build copies both beside the
// `.node`: the engine from cargo's output, std from the toolchain's sysroot
// for the target. Each copy is made writable, since a toolchain may install
// std read-only and the build rewrites and later replaces its copies. On
// macOS every std reference, and the std copy's own id,
// becomes `@rpath/<file>`, and the three images are re-signed ad hoc. A
// release strips the copies like the `.node` and keeps unstripped ones beside
// the build's stamp.
//
// A release stamps the engine with the commit it is built from
// (`SITTIR_ENGINE_COMMIT`, from `git rev-parse HEAD`). Every other build
// leaves the variable as the environment has it, so the engine reads `local`
// and a new commit doesn't rebuild every crate above the engine. The `.node`
// and the engine copy each hold their stamp in their bytes; the build reads
// both from the shipped (stripped, signed) images and refuses by name unless
// they agree with each other and with the workspace's engine version. Cargo
// gives every build of the engine one file name, so after a version change
// it can keep another build that it judges fresh.
//
// A release binding links with its symbols and is stripped after the build,
// on every target. Its unstripped copy is kept beside the build's stamp,
// which records where, so a tool can read the shipped code by name (the
// encode stack budget). On an Apple target the binary is stripped with
// `strip -x`, which keeps the exported symbols node resolves, and re-signed
// ad hoc, since stripping invalidates the linker's signature and arm64 macOS
// will not load unsigned code. Every other target is stripped with the
// pinned toolchain's `llvm-strip`, which reads every target's format, so a
// cross-compiled binary is stripped by the same tool. An MSVC image carries
// no symbol table, so its release link also writes a linker map (`/MAP`),
// kept beside the copy and recorded by the stamp: the map names the code,
// and it changes no allocated byte of the image. The flag names no path, so
// RUSTFLAGS is the same for every grammar and cargo keeps one build of the
// dependencies; the linker writes the map beside the image in cargo's
// `deps` directory, where the image's own link last left it.
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { NATIVE_LOADER, NATIVE_NAPI_CONFIG, NATIVE_TYPINGS, REPO_ROOT, assertGrammar, nativeBinaryName, nativeBindingDir, nativeBuildEnv, nativeCrateDir } from '../packages/codegen/src/grammars.ts';
import { type NativeProfile, linkerMapOf, llvmTool, nativeBuildFingerprint, rustHost, unstrippedBinaryPath, writeNativeBuildStamp } from '../packages/codegen/src/scripts/native-binary-freshness.ts';
import { engineLibraryName, engineStampOf, hostPlatform, isStdLibrary, platformSuffix, targetSuffix } from '../packages/common/src/native-binding.ts';

const [name, ...flags] = process.argv.slice(2);
if (name === undefined) throw new Error('usage: build-native.mts <grammar> [napi build flags…]');
const grammar = assertGrammar(name);

const release = flags.includes('--release');
const profile: NativeProfile = release ? 'release' : flags.includes('--profile') ? (flags[flags.indexOf('--profile') + 1] as NativeProfile) : 'dev';
const target = flags[flags.indexOf('--target') + 1];
const suffix = flags.includes('--target') && target !== undefined ? targetSuffix(target) : platformSuffix(hostPlatform());
const apple = suffix.startsWith('darwin-');

function run(command: string, args: readonly string[], cwd: string, shell = false, env: NodeJS.ProcessEnv = process.env): void {
	const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell, env });
	if (result.status !== 0) process.exit(result.status ?? 1);
}

interface CargoMetadata {
	readonly target_directory: string;
	readonly packages: readonly {
		readonly name: string;
		readonly version: string;
		readonly manifest_path: string;
		readonly targets: readonly { readonly name: string; readonly kind: readonly string[] }[];
	}[];
}

function gitHead(): string {
	const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' });
	if (result.status !== 0) throw new Error('a release build stamps its engine with its commit, and `git rev-parse HEAD` failed');
	return result.stdout.trim();
}

function engineVersion(metadata: CargoMetadata): string {
	const version = metadata.packages.find((pkg) => pkg.name === 'sittir-engine')?.version;
	if (version === undefined) throw new Error('cargo metadata names no sittir-engine package');
	return version;
}

function assertOneEngine(addon: string, engine: string, source: string, version: string): void {
	const built = engineStampOf(addon);
	const copied = engineStampOf(engine);
	const problems = [
		...(built === copied ? [] : [`the engine copied from ${source} is ${copied}`]),
		...(built.startsWith(`${version}@`) ? [] : [`the workspace's sittir-engine is ${version}`])
	];
	if (problems.length === 0) return;
	throw new Error(
		`${basename(addon)} was built against engine ${built}, but ${problems.join(' and ')}. ` +
			'Cargo gives every build of the engine one file name and keeps a build it judges fresh, so after an engine version change it can hold another build: ' +
			'touch rust/crates/sittir-engine/src/lib.rs and build again.'
	);
}

const PROFILE_DIR: Readonly<Record<NativeProfile, string>> = { release: 'release', gate: 'gate', dev: 'debug' };

// A full resolve, not `--no-deps`: it settles Cargo.lock after a manifest
// change before the build's fingerprint reads it, so the build doesn't
// rewrite an input its own stamp has already hashed.
function cargoMetadata(crateDir: string): CargoMetadata {
	const result = spawnSync('cargo', ['metadata', '--format-version', '1'], { cwd: crateDir, encoding: 'utf8', maxBuffer: 1 << 28 });
	if (result.status !== 0) throw new Error(`cargo metadata exited ${result.status} in ${crateDir}`);
	return JSON.parse(result.stdout) as CargoMetadata;
}

function writtenLinkerMap(metadata: CargoMetadata, crateDir: string, cargoOut: string): string {
	const library = metadata.packages
		.find((pkg) => resolve(dirname(pkg.manifest_path)) === resolve(crateDir))
		?.targets.find((built) => built.kind.includes('cdylib'))?.name;
	if (library === undefined) throw new Error(`cargo metadata names no cdylib for ${crateDir}`);
	return join(cargoOut, 'deps', `${library.replaceAll('-', '_')}.map`);
}

function stdLibrary(triple: string): string {
	const sysroot = spawnSync('rustc', ['--print', 'sysroot'], { encoding: 'utf8' }).stdout.trim();
	const dir = join(sysroot, 'lib', 'rustlib', triple, 'lib');
	const found = readdirSync(dir).filter(isStdLibrary);
	if (found.length !== 1) throw new Error(`expected one std library in ${dir}, found ${found.length}`);
	return join(dir, found[0]!);
}

function shipLibrary(source: string): string {
	if (!existsSync(source)) throw new Error(`the build left no ${basename(source)} at ${source}`);
	const shipped = join(outDir, basename(source));
	copyFileSync(source, shipped);
	chmodSync(shipped, 0o755);
	return shipped;
}

function linkedStd(image: string): string {
	const linked = spawnSync('otool', ['-L', image], { encoding: 'utf8' })
		.stdout.split('\n')
		.slice(1)
		.map((line) => line.trim().split(' ')[0]!)
		.find((library) => isStdLibrary(basename(library)));
	if (linked === undefined) throw new Error(`${image} links no std library`);
	return linked;
}

function nameStdByRpath(images: readonly string[], std: string): void {
	const rpathName = `@rpath/${basename(std)}`;
	run('install_name_tool', ['-id', rpathName, std], outDir);
	for (const image of images) {
		const linked = linkedStd(image);
		if (linked !== rpathName) run('install_name_tool', ['-change', linked, rpathName, image], outDir);
	}
}

const outDir = nativeBindingDir(grammar);
const binary = `${nativeBinaryName(grammar)}.${suffix}.node`;
const copy = unstrippedBinaryPath(REPO_ROOT, grammar, binary);
const linkerMap = release && suffix.endsWith('-msvc') ? linkerMapOf(copy) : undefined;
const triple = flags.includes('--target') && target !== undefined ? target : rustHost();
const crateDir = nativeCrateDir(grammar);
const metadata = cargoMetadata(crateDir);
const cargoOut = join(metadata.target_directory, triple, PROFILE_DIR[profile]);
const engineLibrary = engineLibraryName(suffix);
mkdirSync(dirname(copy), { recursive: true });
const built = nativeBuildFingerprint(REPO_ROOT, grammar);
run(
	'pnpm',
	['exec', 'napi', 'build', '--config-path', NATIVE_NAPI_CONFIG, '--platform', '--features', 'arena', ...flags, '--output-dir', outDir, '--js', NATIVE_LOADER, '--dts', NATIVE_TYPINGS],
	crateDir,
	process.platform === 'win32',
	nativeBuildEnv(triple, release ? { ...process.env, SITTIR_ENGINE_COMMIT: gitHead() } : process.env, linkerMap === undefined ? [] : ['-C link-arg=/MAP'])
);
if (linkerMap !== undefined) {
	const written = writtenLinkerMap(metadata, crateDir, cargoOut);
	if (!existsSync(written)) throw new Error(`the release link wrote no linker map at ${written}`);
	copyFileSync(written, linkerMap);
}

const shipped = join(outDir, binary);
const std = stdLibrary(triple);
for (const stale of readdirSync(outDir).filter((file) => isStdLibrary(file) && file !== basename(std))) rmSync(join(outDir, stale));
const libraries = [shipLibrary(join(cargoOut, 'deps', engineLibrary)), shipLibrary(std)];
const images = [shipped, ...libraries];
const signs = apple && process.platform === 'darwin';
if (signs) nameStdByRpath([shipped, libraries[0]!], libraries[1]!);
let unstripped: string | undefined;
if (release) {
	unstripped = copy;
	copyFileSync(shipped, unstripped);
	for (const library of libraries) copyFileSync(library, unstrippedBinaryPath(REPO_ROOT, grammar, basename(library)));
	for (const image of images) {
		if (!apple) run(llvmTool('llvm-strip'), ['--strip-all', image], outDir);
		else if (signs) run('strip', ['-x', image], outDir);
	}
}
if (signs) for (const image of images) run('codesign', ['--force', '--sign', '-', image], outDir);
assertOneEngine(shipped, libraries[0]!, join(cargoOut, 'deps', engineLibrary), engineVersion(metadata));
writeNativeBuildStamp(REPO_ROOT, grammar, profile, binary, built, unstripped, linkerMap);
