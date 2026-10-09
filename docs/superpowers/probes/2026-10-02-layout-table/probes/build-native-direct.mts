/**
 * Does: what scripts/build-native.mts does (builds one grammar's native
 *   binding into packages/<grammar>/native, stripped and re-signed for a
 *   release build on an Apple target), but calls napi directly. `pnpm exec`
 *   can wait for minutes on another session's pnpm run. Not a measurement;
 *   the other probes use it to rebuild a prototype variant.
 * Run (from the root of the checkout to build):
 *   ./node_modules/.bin/tsx <probes>/build-native-direct.mts <grammar> [napi build flags…]
 * Prints: napi's and cargo's own output.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT } from './root.mts';

const { NATIVE_LOADER, NATIVE_TYPINGS, assertGrammar, nativeBinaryName, nativeBindingDir, nativeCrateDir } = await import(`${ROOT}packages/codegen/src/grammars.ts`);
const { hostPlatform, platformSuffix, targetSuffix } = await import(`${ROOT}packages/common/src/native-binding.ts`);

const [name, ...flags] = process.argv.slice(2);
if (name === undefined) throw new Error('usage: build-native-direct.mts <grammar> [napi build flags…]');
const grammar = assertGrammar(name);

const release = flags.includes('--release');
const target = flags[flags.indexOf('--target') + 1];
const suffix = flags.includes('--target') && target !== undefined ? targetSuffix(target) : platformSuffix(hostPlatform());
const apple = suffix.startsWith('darwin-');

function run(command: string, args: readonly string[], cwd: string, env: NodeJS.ProcessEnv = process.env): void {
	const result = spawnSync(command, args, { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' });
	if (result.status !== 0) process.exit(result.status ?? 1);
}

const outDir = nativeBindingDir(grammar);
run(
	join(nativeCrateDir(grammar), 'node_modules/.bin/napi'),
	['build', '--platform', ...flags, '--output-dir', outDir, '--js', NATIVE_LOADER, '--dts', NATIVE_TYPINGS],
	nativeCrateDir(grammar),
	release && !apple ? { ...process.env, CARGO_PROFILE_RELEASE_STRIP: 'symbols' } : process.env
);

if (release && apple && process.platform === 'darwin') {
	const binary = join(outDir, `${nativeBinaryName(grammar)}.${suffix}.node`);
	run('strip', ['-x', binary], outDir);
	run('codesign', ['--force', '--sign', '-', binary], outDir);
}
