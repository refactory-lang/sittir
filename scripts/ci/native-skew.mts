// Usage: tsx scripts/ci/native-skew.mts
//
// Loads two grammar packages built against different engine releases into one
// process and checks that the second is refused, naming both stamps and the
// engine the process mapped, in both ways a release can differ:
// - same version, another commit: every engine symbol still resolves, so the
//   addon's load hook compares the stamps and refuses;
// - a newer version: every mangled engine symbol changes, so the OS loader
//   refuses the addon first, and the grammar's backend names the same stamps,
//   read from the `.node`'s bytes and the engine the process mapped.
//
// Each case builds regex (whose engine the process maps first) and then scm,
// and loads both through their backends in a fresh process. The version case
// gives the engine its own version in its manifest for the length of one
// build and restores the manifest and the lockfile after. Whether the cases
// pass or fail, the script then touches the engine's source and rebuilds both
// grammars under the profile each was built with before the run, in the
// caller's environment: cargo gives every build of the engine one file name,
// so the other version's build would otherwise stay in its output, judged
// fresh, and every grammar a process loads must carry the same engine build.
import { spawnSync } from 'node:child_process';
import { readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REPO_ROOT, nativeBinaryName, nativeBindingDir } from '../../packages/codegen/src/grammars.ts';
import { NATIVE_PROFILE_FLAGS, hostBinaryName, nativeBuildStamp } from '../../packages/codegen/src/scripts/native-binary-freshness.ts';
import { engineLibraryName, engineStampOf, hostPlatform, platformSuffix } from '../../packages/common/src/native-binding.ts';
import { engineRefusalGap } from '../../packages/tools/src/native-layouts.ts';

const FIRST = 'regex';
const SECOND = 'scm';
const shell = process.platform === 'win32';

if (process.argv[2] === 'load') {
	const reasons: string[] = [];
	for (const grammar of [FIRST, SECOND]) {
		const backend = pathToFileURL(join(REPO_ROOT, 'packages', grammar, 'src', 'backend.ts')).href;
		const { getActiveBackend } = (await import(backend)) as { getActiveBackend(): { name: string; reason?: string } };
		const status = getActiveBackend();
		reasons.push(status.name === 'native' ? 'native' : status.reason ?? status.name);
	}
	console.log(JSON.stringify(reasons));
	process.exit(0);
}

function run(command: string, args: readonly string[], env: NodeJS.ProcessEnv = process.env): string {
	const result = spawnSync(command, args, { cwd: REPO_ROOT, encoding: 'utf8', shell, env, maxBuffer: 1 << 26 });
	if (result.status !== 0) {
		process.stderr.write(result.stdout + result.stderr);
		throw new Error(`${command} ${args.join(' ')} exited ${result.status}`);
	}
	return result.stdout;
}

const build = (grammar: string, env: NodeJS.ProcessEnv = process.env, flags: readonly string[] = []): void => {
	run('pnpm', ['exec', 'tsx', 'scripts/build-native.mts', grammar, ...flags], env);
};

const buildAt = (grammar: string, commit: string): void => build(grammar, { ...process.env, SITTIR_ENGINE_COMMIT: commit });

const stampOf = (grammar: string): string => engineStampOf(join(nativeBindingDir(grammar), hostBinaryName(grammar)));

function loadBoth(): [string, string] {
	const out = run('pnpm', ['exec', 'tsx', fileURLToPath(import.meta.url), 'load']);
	return JSON.parse(out.trim().split('\n').at(-1)!) as [string, string];
}

function expectRefused(name: string, built: string, loaded: string): void {
	const [first, second] = loadBoth();
	if (first !== 'native') throw new Error(`${name}: ${FIRST} did not load: ${first}`);
	const gap = engineRefusalGap(second === 'native' ? undefined : second, {
		packageName: `@sittir/${SECOND}`,
		home: 'native/',
		file: hostBinaryName(SECOND),
		binaryName: nativeBinaryName(SECOND),
		built,
		loaded,
		engine: join(nativeBindingDir(FIRST), engineLibraryName(platformSuffix(hostPlatform())))
	});
	if (gap !== undefined) throw new Error(`${name}: ${gap}`);
	console.log(`${name}: refused — ${second}`);
}

function withEngineVersion<T>(version: string, body: () => T): T {
	const manifest = join(REPO_ROOT, 'rust', 'crates', 'sittir-engine', 'Cargo.toml');
	const lockfile = join(REPO_ROOT, 'Cargo.lock');
	const [originalManifest, originalLock] = [readFileSync(manifest, 'utf8'), readFileSync(lockfile, 'utf8')];
	if (!originalManifest.includes('version.workspace = true')) throw new Error(`${manifest} no longer inherits the workspace version`);
	writeFileSync(manifest, originalManifest.replace('version.workspace = true', `version = "${version}"`));
	try {
		return body();
	} finally {
		writeFileSync(manifest, originalManifest);
		writeFileSync(lockfile, originalLock);
	}
}

const profileBefore = new Map([FIRST, SECOND].map((grammar) => [grammar, nativeBuildStamp(REPO_ROOT, grammar)?.profile ?? 'dev'] as const));

function rebuildAsTheCallerBuilt(): void {
	const now = new Date();
	utimesSync(join(REPO_ROOT, 'rust', 'crates', 'sittir-engine', 'src', 'lib.rs'), now, now);
	for (const [grammar, profile] of profileBefore) build(grammar, process.env, NATIVE_PROFILE_FLAGS[profile]);
}

try {
	buildAt(FIRST, 'skew-first');
	const loaded = stampOf(FIRST);
	const version = loaded.slice(0, loaded.indexOf('@'));

	buildAt(SECOND, 'skew-second');
	expectRefused('same version, another commit', `${version}@skew-second`, loaded);

	const newer = `${version}-skew`;
	withEngineVersion(newer, () => buildAt(SECOND, 'skew-second'));
	expectRefused('a newer version', `${newer}@skew-second`, loaded);
} finally {
	rebuildAsTheCallerBuilt();
}
