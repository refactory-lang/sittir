import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, normalize, relative } from 'node:path';
import { hostPlatform, platformSuffix } from '@sittir/common/engine';
import { moduleClosure } from './module-closure.ts';
import { sha256File } from '../util/content-hash.ts';
import { writeFileAtomic } from '../util/write-file-atomic.ts';
import { REPO_ROOT, grammarPackageDir, nativeBinaryName, nativeBindingRelDir, nativeCrateRelDir, type GrammarName } from '../grammars.ts';

export type NativeProfile = 'release' | 'gate' | 'dev';

export interface NativeBuildStamp {
	readonly profile: NativeProfile;
	readonly binarySha256: string;
	readonly toolchain: string;
	readonly config: Readonly<Record<string, string>>;
	readonly inputs: Readonly<Record<string, string>>;
}

export interface HostBinaryFreshness {
	rel: string;
	binaryMtimeMs: number;
	stale: boolean;
	reason: string;
	profile?: NativeProfile;
}

export interface NativeBuildFingerprint {
	readonly toolchain: string;
	readonly config: Readonly<Record<string, string>>;
	readonly inputs: Readonly<Record<string, string>>;
}

export interface BuildSetting {
	readonly toolchain?: string;
	readonly env?: NodeJS.ProcessEnv;
}

const STAMP_DIR = 'node_modules/.cache/sittir/native-build';
const PATH_DEPENDENCY = /\bpath\s*=\s*"([^"]+)"/g;
const WORKSPACE_INPUTS = ['Cargo.toml', 'Cargo.lock', 'rust-toolchain.toml', 'pnpm-lock.yaml'];
const BUILD_DRIVER = 'scripts/build-native.mts';
const CARGO_CONFIG_NAMES = ['config.toml', 'config'];
const BUILD_ENV =
	/^(?:RUSTC|RUSTC_WRAPPER|RUSTC_WORKSPACE_WRAPPER|RUSTFLAGS|CARGO_ENCODED_RUSTFLAGS|CARGO_BUILD_(?!TARGET_DIR$).+|CARGO_PROFILE_.+|CARGO_TARGET_(?!DIR$).+|(?:HOST_|TARGET_)?(?:CC|CXX|AR|CFLAGS|CXXFLAGS|CPPFLAGS|ARFLAGS)(?:_.+)?|CRATE_CC_NO_DEFAULTS|SDKROOT|MACOSX_DEPLOYMENT_TARGET)$/;
const SCANNER_SOURCES = ['scanner.c', 'scanner.cc'];
const QUOTED_INCLUDE = /^\s*#include "([^"]+)"/;

const toolchains = new Map<string, string>();

function rustToolchain(repoRoot: string): string {
	const cached = toolchains.get(repoRoot);
	if (cached !== undefined) return cached;
	const toolchain = execFileSync('rustc', ['-vV'], { cwd: repoRoot, encoding: 'utf8' }).trim();
	toolchains.set(repoRoot, toolchain);
	return toolchain;
}

function walk(path: string, out: string[]): void {
	if (!existsSync(path)) return;
	const stat = statSync(path);
	if (stat.isFile()) {
		if (basename(path) !== '.DS_Store') out.push(path);
		return;
	}
	if (stat.isDirectory()) {
		for (const name of readdirSync(path)) walk(join(path, name), out);
	}
}

function crateClosure(repoRoot: string, crateRel: string): string[] {
	const seen = new Set<string>();
	const visit = (rel: string): void => {
		const manifest = join(repoRoot, rel, 'Cargo.toml');
		if (seen.has(rel) || !existsSync(manifest)) return;
		seen.add(rel);
		for (const [, path] of readFileSync(manifest, 'utf8').matchAll(PATH_DEPENDENCY)) visit(normalize(join(rel, path!)));
	};
	visit(crateRel);
	return [...seen];
}

function crateInputs(crateRel: string): string[] {
	return [`${crateRel}/Cargo.toml`, `${crateRel}/package.json`, `${crateRel}/build.rs`, `${crateRel}/src`, `${crateRel}/templates`];
}

export function hostBinaryName(grammar: string): string {
	return `${nativeBinaryName(grammar as GrammarName)}.${platformSuffix(hostPlatform())}.node`;
}

function quotedIncludeClosure(file: string, seen: Set<string>): void {
	if (seen.has(file)) return;
	seen.add(file);
	for (const line of readFileSync(file, 'utf8').split('\n')) {
		const header = QUOTED_INCLUDE.exec(line)?.[1];
		if (header !== undefined && existsSync(join(dirname(file), header))) quotedIncludeClosure(join(dirname(file), header), seen);
	}
}

export function nativeInputs(repoRoot: string, grammar: string): Record<string, string> {
	const parserSources = join(repoRoot, relative(REPO_ROOT, grammarPackageDir(grammar)), '.sittir/src');
	const roots = [
		...WORKSPACE_INPUTS,
		...crateClosure(repoRoot, nativeCrateRelDir(grammar)).flatMap(crateInputs),
		...moduleClosure(repoRoot, [BUILD_DRIVER])
	];
	const files: string[] = [];
	for (const root of roots) walk(join(repoRoot, root), files);
	walk(parserSources, files);
	const scannerIncludes = new Set<string>();
	for (const scanner of SCANNER_SOURCES.map((name) => join(parserSources, name)).filter((path) => existsSync(path))) {
		quotedIncludeClosure(scanner, scannerIncludes);
	}
	const inputs: Record<string, string> = {};
	for (const file of [...new Set([...files, ...scannerIncludes])].sort()) inputs[relative(repoRoot, file)] = sha256File(file);
	return inputs;
}

function cargoConfigFiles(repoRoot: string, grammar: string, env: NodeJS.ProcessEnv): string[] {
	const dirs: string[] = [];
	for (let dir = join(repoRoot, nativeCrateRelDir(grammar)); ; dir = dirname(dir)) {
		dirs.push(join(dir, '.cargo'));
		if (dirname(dir) === dir) break;
	}
	dirs.push(env.CARGO_HOME ?? join(homedir(), '.cargo'));
	return [...new Set(dirs)].flatMap((dir) => CARGO_CONFIG_NAMES.map((name) => join(dir, name))).filter((path) => existsSync(path));
}

export function nativeBuildConfig(repoRoot: string, grammar: string, env: NodeJS.ProcessEnv): Record<string, string> {
	const config: Record<string, string> = {};
	for (const name of Object.keys(env).filter((name) => BUILD_ENV.test(name)).sort()) config[name] = env[name] ?? '';
	for (const file of cargoConfigFiles(repoRoot, grammar, env)) config[relative(repoRoot, file)] = sha256File(file);
	return config;
}

function stampPath(repoRoot: string, grammar: string, binary: string): string {
	return join(repoRoot, STAMP_DIR, grammar, `${binary}.json`);
}

export function nativeBuildStamp(repoRoot: string, grammar: string, binary: string = hostBinaryName(grammar)): NativeBuildStamp | undefined {
	const path = stampPath(repoRoot, grammar, binary);
	return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as NativeBuildStamp) : undefined;
}

export function nativeBuildFingerprint(repoRoot: string, grammar: string, setting: BuildSetting = {}): NativeBuildFingerprint {
	return {
		toolchain: setting.toolchain ?? rustToolchain(repoRoot),
		config: nativeBuildConfig(repoRoot, grammar, setting.env ?? process.env),
		inputs: nativeInputs(repoRoot, grammar)
	};
}

export function writeNativeBuildStamp(repoRoot: string, grammar: string, profile: NativeProfile, binary: string, built: NativeBuildFingerprint): void {
	const stamp: NativeBuildStamp = { profile, binarySha256: sha256File(join(repoRoot, nativeBindingRelDir(grammar), binary)), ...built };
	writeFileAtomic(stampPath(repoRoot, grammar, binary), JSON.stringify(stamp, null, 2) + '\n');
}

function changedKey(recorded: Readonly<Record<string, string>>, current: Readonly<Record<string, string>>): string | undefined {
	return [...new Set([...Object.keys(recorded), ...Object.keys(current)])].sort().find((key) => recorded[key] !== current[key]);
}

function staleness(repoRoot: string, grammar: string, binary: string, stamp: NativeBuildStamp | undefined): string | undefined {
	if (stamp === undefined) return 'no record of the build that wrote the binary';
	if (stamp.binarySha256 !== sha256File(join(repoRoot, nativeBindingRelDir(grammar), binary))) return `${binary} is not the binary the last build wrote`;
	const changed = changedKey(stamp.inputs, nativeInputs(repoRoot, grammar));
	return changed === undefined ? undefined : `${changed} changed since the build`;
}

export function hostBinaryFreshnessFor(repoRoot: string, grammar: string): HostBinaryFreshness[] {
	const binary = hostBinaryName(grammar);
	const path = join(repoRoot, nativeBindingRelDir(grammar), binary);
	if (!existsSync(path)) return [];
	const stamp = nativeBuildStamp(repoRoot, grammar, binary);
	const reason = staleness(repoRoot, grammar, binary, stamp);
	return [
		{
			rel: `${nativeBindingRelDir(grammar)}/${binary}`,
			binaryMtimeMs: statSync(path).mtimeMs,
			stale: reason !== undefined,
			reason: reason ?? 'built from the current native inputs',
			...(stamp === undefined ? {} : { profile: stamp.profile })
		}
	];
}

export function nativeBuildFreshness(
	repoRoot: string,
	grammar: string,
	profile: NativeProfile,
	setting: BuildSetting = {}
): { readonly fresh: boolean; readonly reason: string } {
	const [built] = hostBinaryFreshnessFor(repoRoot, grammar);
	if (built === undefined) return { fresh: false, reason: 'no native binary' };
	if (built.stale) return { fresh: false, reason: built.reason };
	const stamp = nativeBuildStamp(repoRoot, grammar)!;
	if (stamp.toolchain !== (setting.toolchain ?? rustToolchain(repoRoot))) return { fresh: false, reason: 'the rust toolchain changed since the build' };
	const config = changedKey(stamp.config, nativeBuildConfig(repoRoot, grammar, setting.env ?? process.env));
	if (config !== undefined) return { fresh: false, reason: `${config} changed since the build` };
	if (stamp.profile !== profile) return { fresh: false, reason: `built under the ${stamp.profile} profile, not ${profile}` };
	return { fresh: true, reason: `built from the current native inputs (${profile})` };
}

export function assertNativeBinaryFresh(repoRoot: string, grammar: string): void {
	const stale = hostBinaryFreshnessFor(repoRoot, grammar).filter((b) => b.stale);
	if (stale.length === 0) return;
	const lines = stale.map((b) => `  ${b.rel}: ${b.reason} — it would validate stale code.`);
	throw new Error(
		`Stale native binary for grammar '${grammar}':\n${lines.join('\n')}\n` +
			`Rebuild it:\n  pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${grammar} --all --output packages/${grammar}/src\n` +
			`(or: pnpm -C ${nativeCrateRelDir(grammar)} run build:gate)`
	);
}
