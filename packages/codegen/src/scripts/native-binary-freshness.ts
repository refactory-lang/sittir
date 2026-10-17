import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { hostPlatform, platformSuffix } from '@sittir/common/engine';
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

export interface BuildSetting {
	readonly toolchain?: string;
	readonly env?: NodeJS.ProcessEnv;
}

const STAMP_DIR = 'node_modules/.cache/sittir/native-build';
const SHARED_CRATES = ['sittir-core', 'sittir-transport-macros'];
const WORKSPACE_INPUTS = ['Cargo.toml', 'Cargo.lock', 'rust-toolchain.toml'];
const CARGO_CONFIG_FILES = ['.cargo/config.toml', '.cargo/config'];
const BUILD_ENV = /^(RUSTFLAGS|RUSTC_WRAPPER|CARGO_ENCODED_RUSTFLAGS|CARGO_BUILD_.+|CARGO_PROFILE_.+)$/;

const toolchains = new Map<string, string>();

function rustToolchain(repoRoot: string): string {
	const cached = toolchains.get(repoRoot);
	if (cached !== undefined) return cached;
	const toolchain = execFileSync('rustc', ['-vV'], { cwd: repoRoot, encoding: 'utf8' }).trim();
	toolchains.set(repoRoot, toolchain);
	return toolchain;
}

function sha256(file: string): string {
	return createHash('sha256').update(readFileSync(file)).digest('hex');
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

function crateInputs(crateRel: string): string[] {
	return [`${crateRel}/Cargo.toml`, `${crateRel}/build.rs`, `${crateRel}/src`, `${crateRel}/templates`];
}

export function hostBinaryName(grammar: string): string {
	return `${nativeBinaryName(grammar as GrammarName)}.${platformSuffix(hostPlatform())}.node`;
}

export function nativeInputs(repoRoot: string, grammar: string): Record<string, string> {
	const roots = [
		...WORKSPACE_INPUTS,
		...SHARED_CRATES.flatMap((crate) => crateInputs(`rust/crates/${crate}`)),
		...crateInputs(nativeCrateRelDir(grammar)),
		`${relative(REPO_ROOT, grammarPackageDir(grammar))}/.sittir/src`
	];
	const files: string[] = [];
	for (const root of roots) walk(join(repoRoot, root), files);
	const inputs: Record<string, string> = {};
	for (const file of files.sort()) inputs[relative(repoRoot, file)] = sha256(file);
	return inputs;
}

export function nativeBuildConfig(repoRoot: string, env: NodeJS.ProcessEnv): Record<string, string> {
	const config: Record<string, string> = {};
	for (const name of Object.keys(env).filter((name) => BUILD_ENV.test(name)).sort()) config[name] = env[name] ?? '';
	for (const rel of CARGO_CONFIG_FILES) {
		if (existsSync(join(repoRoot, rel))) config[rel] = sha256(join(repoRoot, rel));
	}
	return config;
}

function stampPath(repoRoot: string, grammar: string, binary: string): string {
	return join(repoRoot, STAMP_DIR, grammar, `${binary}.json`);
}

export function nativeBuildStamp(repoRoot: string, grammar: string, binary: string = hostBinaryName(grammar)): NativeBuildStamp | undefined {
	const path = stampPath(repoRoot, grammar, binary);
	return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as NativeBuildStamp) : undefined;
}

export function writeNativeBuildStamp(
	repoRoot: string,
	grammar: string,
	profile: NativeProfile,
	binary: string,
	setting: BuildSetting = {}
): void {
	const stamp: NativeBuildStamp = {
		profile,
		binarySha256: sha256(join(repoRoot, nativeBindingRelDir(grammar), binary)),
		toolchain: setting.toolchain ?? rustToolchain(repoRoot),
		config: nativeBuildConfig(repoRoot, setting.env ?? process.env),
		inputs: nativeInputs(repoRoot, grammar)
	};
	const path = stampPath(repoRoot, grammar, binary);
	mkdirSync(dirname(path), { recursive: true });
	const scratch = `${path}.${process.pid}.tmp`;
	writeFileSync(scratch, JSON.stringify(stamp, null, 2) + '\n');
	renameSync(scratch, path);
}

function changedKey(recorded: Readonly<Record<string, string>>, current: Readonly<Record<string, string>>): string | undefined {
	return [...new Set([...Object.keys(recorded), ...Object.keys(current)])].sort().find((key) => recorded[key] !== current[key]);
}

function staleness(repoRoot: string, grammar: string, binary: string, stamp: NativeBuildStamp | undefined): string | undefined {
	if (stamp === undefined) return 'no record of the build that wrote the binary';
	if (stamp.binarySha256 !== sha256(join(repoRoot, nativeBindingRelDir(grammar), binary))) return `${binary} is not the binary the last build wrote`;
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
	const config = changedKey(stamp.config, nativeBuildConfig(repoRoot, setting.env ?? process.env));
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
