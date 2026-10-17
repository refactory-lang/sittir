// Usage: tsx scripts/build-native.mts <grammar> [napi build flags…]
//
// Builds a grammar's native binding into the grammar package that ships it
// (`packages/<grammar>/native`): the loader, its typings and the host's `.node`.
// The crate's `build` scripts and CI both go through here, so the output
// location has one owner. Extra flags (`--release`, `--profile gate`,
// `--target`, a cross flag) pass through to `napi build`. Each build records
// its profile, its native inputs and its binary's hash (`native-binary-freshness.ts`),
// which validation and `regen:all` hold the binary to.
//
// A release binding is stripped. On an Apple target cargo's own stripping
// yields a binary dyld refuses, so the binary is stripped after the build
// (`strip -x`, which keeps the exported symbols node resolves) and re-signed
// ad hoc, since stripping invalidates the linker's signature and arm64 macOS
// will not load unsigned code. Every other target lets cargo strip symbols,
// which uses the right tool for a cross-compiled target.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { NATIVE_LOADER, NATIVE_TYPINGS, REPO_ROOT, assertGrammar, nativeBinaryName, nativeBindingDir, nativeCrateDir } from '../packages/codegen/src/grammars.ts';
import { type NativeProfile, writeNativeBuildStamp } from '../packages/codegen/src/scripts/native-binary-freshness.ts';
import { hostPlatform, platformSuffix, targetSuffix } from '../packages/common/src/native-binding.ts';

const [name, ...flags] = process.argv.slice(2);
if (name === undefined) throw new Error('usage: build-native.mts <grammar> [napi build flags…]');
const grammar = assertGrammar(name);

const release = flags.includes('--release');
const profile: NativeProfile = release ? 'release' : flags.includes('--profile') ? (flags[flags.indexOf('--profile') + 1] as NativeProfile) : 'dev';
const target = flags[flags.indexOf('--target') + 1];
const suffix = flags.includes('--target') && target !== undefined ? targetSuffix(target) : platformSuffix(hostPlatform());
const apple = suffix.startsWith('darwin-');

function run(command: string, args: readonly string[], cwd: string, env: NodeJS.ProcessEnv = process.env): void {
	const result = spawnSync(command, args, { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' });
	if (result.status !== 0) process.exit(result.status ?? 1);
}

const outDir = nativeBindingDir(grammar);
const buildEnv = release && !apple ? { ...process.env, CARGO_PROFILE_RELEASE_STRIP: 'symbols' } : process.env;
run(
	'pnpm',
	['exec', 'napi', 'build', '--platform', ...flags, '--output-dir', outDir, '--js', NATIVE_LOADER, '--dts', NATIVE_TYPINGS],
	nativeCrateDir(grammar),
	buildEnv
);

const binary = `${nativeBinaryName(grammar)}.${suffix}.node`;
if (release && apple && process.platform === 'darwin') {
	run('strip', ['-x', join(outDir, binary)], outDir);
	run('codesign', ['--force', '--sign', '-', join(outDir, binary)], outDir);
}
writeNativeBuildStamp(REPO_ROOT, grammar, profile, binary, { env: buildEnv });
