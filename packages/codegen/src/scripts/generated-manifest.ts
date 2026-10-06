import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, dirname } from 'node:path';
import { hostBinaryFreshnessFor } from './native-binary-freshness.ts';
import {
	GRAMMAR_ENTRY,
	NATIVE_LOADER,
	REPO_ROOT,
	grammarPackageDir,
	nativeBindingRelDir,
	nativeCrateRelDir,
	stableGrammars,
	type GrammarName
} from '../grammars.ts';

export { REPO_ROOT };

const MANIFEST_DIR = 'node_modules/.cache/sittir/generated-manifest';
const KNOWN_PAIR_LIMIT = 8;

export function generatedRootsFor(grammar: GrammarName): string[] {
	return [
		`packages/${grammar}/src`,
		`packages/${grammar}/.sittir`,
		`${nativeCrateRelDir(grammar)}/src`,
		`${nativeCrateRelDir(grammar)}/test-fixtures.json`,
		`${nativeBindingRelDir(grammar)}/index.d.ts`,
		`${nativeBindingRelDir(grammar)}/${NATIVE_LOADER}`
	];
}

function pathsFor(grammar: GrammarName): string[] {
	return generatedRootsFor(grammar);
}

export interface ManifestSource {
	readonly root: string;
	readonly visible: ReadonlySet<string>;
	readonly checkout: string;
}

export function checkoutSource(root: string): ManifestSource {
	return { root, visible: gitVisiblePaths(root), checkout: root };
}

function isCheckout(src: ManifestSource): boolean {
	return src.root === src.checkout;
}

let cachedWorktreeSource: ManifestSource | null = null;

export function worktreeSource(): ManifestSource {
	cachedWorktreeSource ??= checkoutSource(REPO_ROOT);
	return cachedWorktreeSource;
}

export function manifestPath(grammar: GrammarName, src: ManifestSource = worktreeSource()): string {
	return join(src.checkout, MANIFEST_DIR, `${grammar}.json`);
}

function isJunkFile(name: string): boolean {
	return name === '.DS_Store';
}

function walk(path: string, out: string[]): void {
	if (!existsSync(path)) return;
	const stat = statSync(path);
	if (stat.isFile()) {
		if (isJunkFile(basename(path))) return;
		out.push(path);
		return;
	}
	if (stat.isDirectory()) {
		for (const name of readdirSync(path)) walk(join(path, name), out);
	}
}

function sha256(file: string): string {
	return createHash('sha256').update(readFileSync(file)).digest('hex');
}

export function gitVisiblePaths(root: string): ReadonlySet<string> {
	let stdout: string;
	try {
		stdout = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
			cwd: root,
			maxBuffer: 1 << 28,
			encoding: 'utf8'
		});
	} catch (cause) {
		throw new Error(
			`generated-manifest: could not list git-visible files in ${root}. The manifest records exactly ` +
				`the generated artifacts the repository tracks or would track, so this fact has to come from git.`,
			{ cause }
		);
	}
	return new Set(stdout.split('\0').filter((p) => p.length > 0));
}

function landsOnItsOwnCadence(relPath: string): boolean {
	return relPath.endsWith('/test-fixtures.json') || relPath.endsWith('/test-fixtures.left-out.json');
}

function isManifestExcluded(relPath: string, src: ManifestSource): boolean {
	return !src.visible.has(relPath) || landsOnItsOwnCadence(relPath);
}

function collectFiles(grammar: GrammarName, src: ManifestSource): string[] {
	const all: string[] = [];
	for (const root of pathsFor(grammar)) walk(join(src.root, root), all);
	return all
		.filter((f) => !isManifestExcluded(relative(src.root, f), src))
		.sort();
}

interface GenerationPair {
	readonly source: string;
	readonly outputs: string;
}

interface Manifest {
	readonly files: Readonly<Record<string, string>>;
	readonly known: readonly GenerationPair[];
}

const samePair = (a: GenerationPair, b: GenerationPair): boolean => a.source === b.source && a.outputs === b.outputs;

const CODEGEN_SOURCE_DIR = 'packages/codegen/src';

function grammarSourceInputs(grammar: GrammarName): string[] {
	const dir = relative(REPO_ROOT, grammarPackageDir(grammar));
	return [`${dir}/${GRAMMAR_ENTRY}`, `${dir}/package.json`];
}

function isCodegenSourceInput(relPath: string): boolean {
	return (
		relPath.startsWith(`${CODEGEN_SOURCE_DIR}/`) &&
		relPath.endsWith('.ts') &&
		!relPath.endsWith('.d.ts') &&
		!relPath.includes('/__tests__/') &&
		!relPath.includes('/src/validate/')
	);
}

const codegenHashBySource = new WeakMap<ManifestSource, string>();

function codegenSourceHash(src: ManifestSource): string {
	const cached = codegenHashBySource.get(src);
	if (cached !== undefined) return cached;
	const hash = createHash('sha256');
	const files: string[] = [];
	walk(join(src.root, CODEGEN_SOURCE_DIR), files);
	for (const f of files.sort()) {
		const rel = relative(src.root, f);
		if (!isCodegenSourceInput(rel)) continue;
		hash.update(`${rel}\0`);
		hash.update(readFileSync(f));
		hash.update('\0');
	}
	const digest = hash.digest('hex');
	codegenHashBySource.set(src, digest);
	return digest;
}

function gitPaths(checkout: string, args: readonly string[]): string[] {
	return execFileSync('git', [...args], { cwd: checkout, maxBuffer: 1 << 28, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
		.split('\0')
		.filter((p) => p.length > 0);
}

function trustedCommits(checkout: string): string[] {
	return ['HEAD', 'MERGE_HEAD'].filter((ref) => {
		try {
			execFileSync('git', ['rev-parse', '-q', '--verify', `${ref}^{commit}`], { cwd: checkout, stdio: 'ignore' });
			return true;
		} catch {
			return false;
		}
	});
}

function differencesFromTrustedCommit(grammar: GrammarName, src: ManifestSource): string[] {
	const sourceInputs = grammarSourceInputs(grammar);
	const roots = generatedRootsFor(grammar);
	const pathspecs = [CODEGEN_SOURCE_DIR, ...sourceInputs, ...roots];
	const matters = (rel: string): boolean =>
		isCodegenSourceInput(rel) ||
		sourceInputs.includes(rel) ||
		(!landsOnItsOwnCadence(rel) && roots.some((root) => rel === root || rel.startsWith(`${root}/`)));
	const untracked = isCheckout(src)
		? gitPaths(src.checkout, ['ls-files', '-z', '--others', '--exclude-standard', '--', ...pathspecs])
		: [];
	const tree = isCheckout(src) ? [] : ['--cached'];
	const perCommit = trustedCommits(src.checkout).map((commit) =>
		[...untracked, ...gitPaths(src.checkout, ['diff', '--name-only', '--no-renames', '-z', ...tree, commit, '--', ...pathspecs])].filter(matters)
	);
	if (perCommit.some((differences) => differences.length === 0)) return [];
	return perCommit[0] ?? untracked.filter(matters);
}

export function computeSourceHash(grammar: GrammarName, src: ManifestSource = worktreeSource()): string {
	const hash = createHash('sha256');
	for (const rel of grammarSourceInputs(grammar)) {
		const input = join(src.root, rel);
		if (existsSync(input)) {
			hash.update(`${rel}\0`);
			hash.update(readFileSync(input));
			hash.update('\0');
		}
	}
	hash.update('codegen\0');
	hash.update(codegenSourceHash(src));
	hash.update('\0');
	return hash.digest('hex');
}

function hashGeneratedFiles(grammar: GrammarName, src: ManifestSource): Record<string, string> {
	const files: Record<string, string> = {};
	for (const f of collectFiles(grammar, src)) files[relative(src.root, f)] = sha256(f);
	return files;
}

function outputsDigest(files: Readonly<Record<string, string>>): string {
	const hash = createHash('sha256');
	for (const rel of Object.keys(files).sort()) hash.update(`${rel}\0${files[rel]}\0`);
	return hash.digest('hex');
}

function readManifest(grammar: GrammarName, src: ManifestSource): Manifest | undefined {
	const path = manifestPath(grammar, src);
	return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf-8')) as Manifest) : undefined;
}

function recordGeneration(grammar: GrammarName, src: ManifestSource, files: Readonly<Record<string, string>>, pair: GenerationPair): void {
	const earlier = (readManifest(grammar, src)?.known ?? []).filter((known) => !samePair(known, pair));
	const manifest: Manifest = { files, known: [...earlier, pair].slice(-KNOWN_PAIR_LIMIT) };
	const path = manifestPath(grammar, src);
	mkdirSync(dirname(path), { recursive: true });
	const scratch = `${path}.${process.pid}.tmp`;
	writeFileSync(scratch, JSON.stringify(manifest, null, 2) + '\n');
	renameSync(scratch, path);
}

export function writeManifestForGrammar(grammar: GrammarName, src: ManifestSource = worktreeSource()): void {
	const files = hashGeneratedFiles(grammar, src);
	recordGeneration(grammar, src, files, { source: computeSourceHash(grammar, src), outputs: outputsDigest(files) });
}

export interface VerifyResult {
	grammar: GrammarName;
	ok: boolean;
	sourceChanged: boolean;
	missing: string[];
	modified: string[];
	extra: string[];
	differs: string[];
	stale: string[];
}

export function verifyManifestForGrammar(grammar: GrammarName, src: ManifestSource = worktreeSource()): VerifyResult {
	const result: VerifyResult = {
		grammar,
		ok: false,
		sourceChanged: false,
		missing: [],
		modified: [],
		extra: [],
		differs: [],
		stale: []
	};
	const files = hashGeneratedFiles(grammar, src);
	const pair: GenerationPair = { source: computeSourceHash(grammar, src), outputs: outputsDigest(files) };
	const manifest = readManifest(grammar, src);

	if (!(manifest?.known.some((known) => samePair(known, pair)) ?? false)) {
		const differs = differencesFromTrustedCommit(grammar, src);
		if (differs.length === 0) {
			if (isCheckout(src)) recordGeneration(grammar, src, files, pair);
		} else if (manifest === undefined) {
			result.differs = differs;
		} else {
			result.sourceChanged = manifest.known.at(-1)?.source !== pair.source;
			for (const [rel, expectedHash] of Object.entries(manifest.files)) {
				if (!(rel in files)) result.missing.push(rel);
				else if (files[rel] !== expectedHash) result.modified.push(rel);
			}
			for (const rel of Object.keys(files)) {
				if (!(rel in manifest.files)) result.extra.push(rel);
			}
		}
	}

	if (isCheckout(src)) {
		for (const b of hostBinaryFreshnessFor(src.checkout, grammar)) {
			if (b.stale) result.stale.push(`${b.rel} (older than ${b.newestInputRel})`);
		}
	}

	result.ok =
		!result.sourceChanged &&
		result.missing.length === 0 &&
		result.modified.length === 0 &&
		result.extra.length === 0 &&
		result.differs.length === 0 &&
		result.stale.length === 0;
	return result;
}

export function assertGeneratedManifestsClean(
	grammars?: readonly GrammarName[],
	src: ManifestSource = worktreeSource()
): void {
	if (process.env.SITTIR_INTERNAL_CODEGEN_RUN === '1') return;
	const targets = grammars ?? stableGrammars();
	const results = targets.map((g) => verifyManifestForGrammar(g, src));
	const failed = results.filter((r) => !r.ok);
	if (failed.length === 0) return;
	const lines: string[] = ['Generated output verification failed:'];
	for (const r of failed) {
		lines.push(`  ${r.grammar}:`);
		if (r.sourceChanged) {
			lines.push(
				`    SOURCE INPUTS CHANGED (grammar.sittir.ts, package.json, or packages/codegen/src/** edited since last regen)`
			);
		}
		for (const f of r.modified) lines.push(`    MODIFIED: ${f}`);
		for (const f of r.missing) lines.push(`    MISSING : ${f}`);
		for (const f of r.extra) lines.push(`    EXTRA   : ${f}`);
		for (const f of r.differs) lines.push(`    DIFFERS FROM HEAD: ${f}`);
		for (const f of r.stale) lines.push(`    STALE-BINARY: ${f} — rebuild the napi crate`);
	}
	lines.push('');
	lines.push('To restore canonical state, regenerate the affected grammar(s):');
	lines.push('  pnpm exec tsx packages/cli/src/cli.ts gen --grammar <name> --all --output packages/<name>/src');
	throw new Error(lines.join('\n'));
}
