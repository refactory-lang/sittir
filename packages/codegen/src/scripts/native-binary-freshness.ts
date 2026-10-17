import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { REPO_ROOT, grammarPackageDir, nativeBindingRelDir, nativeCrateRelDir } from '../grammars.ts';

export type NativeProfile = 'release' | 'gate' | 'dev';

export interface NativeBuildStamp {
	readonly profile: NativeProfile;
	readonly binary: string;
	readonly binarySha256: string;
	readonly toolchain: string;
	readonly inputs: Readonly<Record<string, string>>;
}

export interface HostBinaryFreshness {
	rel: string;
	binaryMtimeMs: number;
	stale: boolean;
	reason: string;
	profile?: NativeProfile;
}

const STAMP_DIR = 'node_modules/.cache/sittir/native-build';
const SHARED_CRATES = ['sittir-core', 'sittir-transport-macros'];
const WORKSPACE_INPUTS = ['Cargo.toml', 'Cargo.lock', 'rust-toolchain.toml'];

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

function stampPath(repoRoot: string, grammar: string): string {
	return join(repoRoot, STAMP_DIR, `${grammar}.json`);
}

function readStamp(repoRoot: string, grammar: string): NativeBuildStamp | undefined {
	const path = stampPath(repoRoot, grammar);
	return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as NativeBuildStamp) : undefined;
}

export function writeNativeBuildStamp(
	repoRoot: string,
	grammar: string,
	profile: NativeProfile,
	binary: string,
	toolchain: string = rustToolchain(repoRoot)
): void {
	const stamp: NativeBuildStamp = {
		profile,
		binary,
		binarySha256: sha256(join(repoRoot, nativeBindingRelDir(grammar), binary)),
		toolchain,
		inputs: nativeInputs(repoRoot, grammar)
	};
	const path = stampPath(repoRoot, grammar);
	mkdirSync(dirname(path), { recursive: true });
	const scratch = `${path}.${process.pid}.tmp`;
	writeFileSync(scratch, JSON.stringify(stamp, null, 2) + '\n');
	renameSync(scratch, path);
}

function changedInput(recorded: Readonly<Record<string, string>>, current: Readonly<Record<string, string>>): string | undefined {
	return [...new Set([...Object.keys(recorded), ...Object.keys(current)])].sort().find((rel) => recorded[rel] !== current[rel]);
}

function staleness(repoRoot: string, grammar: string, binary: string, stamp: NativeBuildStamp | undefined, toolchain: () => string): string | undefined {
	if (stamp === undefined) return 'no record of the build that wrote the binary';
	if (stamp.binary !== binary || stamp.binarySha256 !== sha256(join(repoRoot, nativeBindingRelDir(grammar), binary))) {
		return `${binary} is not the binary the last build wrote`;
	}
	if (stamp.toolchain !== toolchain()) return 'the rust toolchain changed since the build';
	const changed = changedInput(stamp.inputs, nativeInputs(repoRoot, grammar));
	return changed === undefined ? undefined : `${changed} changed since the build`;
}

export function hostBinaryFreshnessFor(repoRoot: string, grammar: string, toolchain?: string): HostBinaryFreshness[] {
	const bindingDir = join(repoRoot, nativeBindingRelDir(grammar));
	if (!existsSync(bindingDir)) return [];
	const binaries = readdirSync(bindingDir).filter((name) => name.endsWith('.node'));
	const stamp = readStamp(repoRoot, grammar);
	const currentToolchain = () => toolchain ?? rustToolchain(repoRoot);
	return binaries.map((name) => {
		const reason = staleness(repoRoot, grammar, name, stamp, currentToolchain);
		return {
			rel: `${nativeBindingRelDir(grammar)}/${name}`,
			binaryMtimeMs: statSync(join(bindingDir, name)).mtimeMs,
			stale: reason !== undefined,
			reason: reason ?? 'built from the current native inputs',
			...(stamp !== undefined && stamp.binary === name ? { profile: stamp.profile } : {})
		};
	});
}

export function nativeBuildFreshness(
	repoRoot: string,
	grammar: string,
	profile: NativeProfile,
	toolchain?: string
): { readonly fresh: boolean; readonly reason: string } {
	const stamp = readStamp(repoRoot, grammar);
	const binaries = hostBinaryFreshnessFor(repoRoot, grammar, toolchain);
	const built = stamp === undefined ? binaries[0] : binaries.find((b) => b.rel.endsWith(`/${stamp.binary}`));
	if (built === undefined) return { fresh: false, reason: 'no native binary' };
	if (built.stale) return { fresh: false, reason: built.reason };
	if (built.profile !== profile) return { fresh: false, reason: `built under the ${built.profile} profile, not ${profile}` };
	return { fresh: true, reason: `built from the current native inputs (${profile})` };
}

export function assertNativeBinaryFresh(repoRoot: string, grammar: string, toolchain?: string): void {
	const stale = hostBinaryFreshnessFor(repoRoot, grammar, toolchain).filter((b) => b.stale);
	if (stale.length === 0) return;
	const lines = stale.map((b) => `  ${b.rel}: ${b.reason} — it would validate stale code.`);
	throw new Error(
		`Stale native binary for grammar '${grammar}':\n${lines.join('\n')}\n` +
			`Rebuild it:\n  pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${grammar} --all --output packages/${grammar}/src\n` +
			`(or: pnpm -C ${nativeCrateRelDir(grammar)} run build:gate)`
	);
}
