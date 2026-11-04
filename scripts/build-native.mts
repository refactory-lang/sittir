// Usage: tsx scripts/build-native.mts <grammar> [napi build flags…]
//
// Builds a grammar's native binding into the grammar package that ships it
// (`packages/<grammar>/native`): the loader, its typings and the host's `.node`.
// The crate's `build` scripts, CI and the release all go through here, so the
// output location has one owner. Extra flags (`--release`, `--profile gate`,
// `--target`, a cross flag) pass through to `napi build`. Each build records
// its profile, its native inputs and its binary's hash (`native-binary-freshness.ts`),
// which validation and `regen:all` hold the binary to.
//
// A release binding links with its symbols and is stripped after the build,
// on every target. Its unstripped copy is kept beside the build's stamp,
// which records where, so a tool can read the shipped code by name (the
// encode stack budget). On an Apple target the binary is stripped with
// `strip -x`, which keeps the exported symbols node resolves, and re-signed
// ad hoc, since stripping invalidates the linker's signature and arm64 macOS
// will not load unsigned code. Every other target is stripped with the
// pinned toolchain's `llvm-strip`, which reads every target's format, so a
// cross-compiled binary is stripped by the same tool.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { NATIVE_LOADER, NATIVE_TYPINGS, REPO_ROOT, assertGrammar, nativeBinaryName, nativeBindingDir, nativeCrateDir } from '../packages/codegen/src/grammars.ts';
import { type NativeProfile, llvmTool, nativeBuildFingerprint, unstrippedBinaryPath, writeNativeBuildStamp } from '../packages/codegen/src/scripts/native-binary-freshness.ts';
import { hostPlatform, platformSuffix, targetSuffix } from '../packages/common/src/native-binding.ts';

const [name, ...flags] = process.argv.slice(2);
if (name === undefined) throw new Error('usage: build-native.mts <grammar> [napi build flags…]');
const grammar = assertGrammar(name);

const release = flags.includes('--release');
const profile: NativeProfile = release ? 'release' : flags.includes('--profile') ? (flags[flags.indexOf('--profile') + 1] as NativeProfile) : 'dev';
const target = flags[flags.indexOf('--target') + 1];
const suffix = flags.includes('--target') && target !== undefined ? targetSuffix(target) : platformSuffix(hostPlatform());
const apple = suffix.startsWith('darwin-');

function run(command: string, args: readonly string[], cwd: string): void {
	const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
	if (result.status !== 0) process.exit(result.status ?? 1);
}

const outDir = nativeBindingDir(grammar);
const built = nativeBuildFingerprint(REPO_ROOT, grammar);
run(
	'pnpm',
	['exec', 'napi', 'build', '--platform', ...flags, '--output-dir', outDir, '--js', NATIVE_LOADER, '--dts', NATIVE_TYPINGS],
	nativeCrateDir(grammar)
);

const binary = `${nativeBinaryName(grammar)}.${suffix}.node`;
const shipped = join(outDir, binary);
let unstripped: string | undefined;
if (release) {
	unstripped = unstrippedBinaryPath(REPO_ROOT, grammar, binary);
	mkdirSync(dirname(unstripped), { recursive: true });
	copyFileSync(shipped, unstripped);
	if (!apple) run(llvmTool('llvm-strip'), ['--strip-all', shipped], outDir);
	else if (process.platform === 'darwin') {
		run('strip', ['-x', shipped], outDir);
		run('codesign', ['--force', '--sign', '-', shipped], outDir);
	}
}
writeNativeBuildStamp(REPO_ROOT, grammar, profile, binary, built, unstripped);
