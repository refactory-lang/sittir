// Usage: tsx scripts/build-native.mts <grammar> [napi build flags…]
//
// Builds a grammar's native binding into the grammar package that ships it
// (`packages/<grammar>/native`): the loader, its typings and the host's `.node`.
// The crate's `build` scripts and CI both go through here, so the output
// location has one owner. Extra flags (`--release`, `--target`, a cross flag)
// pass through to `napi build`.
import { spawnSync } from 'node:child_process';
import { NATIVE_LOADER, NATIVE_TYPINGS, assertGrammar, nativeBindingDir, nativeCrateDir } from '../packages/codegen/src/grammars.ts';

const [name, ...flags] = process.argv.slice(2);
if (name === undefined) throw new Error('usage: build-native.mts <grammar> [napi build flags…]');
const grammar = assertGrammar(name);

const result = spawnSync(
	'pnpm',
	['exec', 'napi', 'build', '--platform', ...flags, '--output-dir', nativeBindingDir(grammar), '--js', NATIVE_LOADER, '--dts', NATIVE_TYPINGS],
	{ cwd: nativeCrateDir(grammar), stdio: 'inherit', shell: process.platform === 'win32' }
);
process.exit(result.status ?? 1);
