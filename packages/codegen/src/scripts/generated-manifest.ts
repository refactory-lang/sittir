import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join, relative } from 'node:path';
import { BINDINGS_FILE, VOCABULARY_DIR } from '../bindings/facts.ts';
import { isVocabularySource, vocabularySources } from '../bindings/vocabulary.ts';
import { PIN_FILE } from '../bootstrap/bootstrap.ts';
import { moduleClosure } from './module-closure.ts';
import { sha256File } from '../util/content-hash.ts';
import { writeFileAtomic } from '../util/write-file-atomic.ts';
import { hostBinaryFreshnessFor } from './native-binary-freshness.ts';
import { readUpstreamRecord } from '../transpile/compile-parser.ts';
import { ensureWasmToolchain, treeSitterToolchain, treeSitterToolchainIdentity, wasmToolchainInstalled } from '../transpile/tree-sitter-cli.ts';
import {
	BASE_ENTRY,
	GRAMMAR_ENTRY,
	NATIVE_LOADER,
	REPO_ROOT,
	allGrammars,
	grammarPackageDir,
	nativeBindingRelDir,
	nativeCrateRelDir,
	stableGrammars,
	upstreamPackage,
	type GrammarName
} from '../grammars.ts';

export { REPO_ROOT };

const MANIFEST_DIR = 'node_modules/.cache/sittir/generated-manifest';
const KNOWN_PAIR_LIMIT = 8;

export function generatedRootsFor(grammar: GrammarName): string[] {
	return [
		`packages/${grammar}/src`,
		`packages/${grammar}/.sittir`,
		`packages/${grammar}/tests/nodes.test.ts`,
		`packages/${grammar}/vitest.config.ts`,
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
	readonly upstream?: string;
}

interface Manifest {
	readonly files: Readonly<Record<string, string>>;
	readonly known: readonly GenerationPair[];
}

const samePair = (a: GenerationPair, b: GenerationPair): boolean => a.source === b.source && a.outputs === b.outputs;

const CODEGEN_SOURCE_DIR = 'packages/codegen/src';

const LOCKFILE = 'pnpm-lock.yaml';

const COMMON_PACKAGE_DIR = 'packages/common';

const VOCABULARY_SOURCE_DIR = relative(REPO_ROOT, VOCABULARY_DIR);

const isVocabularyInput = (rel: string): boolean => rel.startsWith(`${VOCABULARY_SOURCE_DIR}/`) && isVocabularySource(rel.slice(VOCABULARY_SOURCE_DIR.length + 1));

const bindingsInput = (grammar: GrammarName): string => `${relative(REPO_ROOT, grammarPackageDir(grammar))}/${BINDINGS_FILE}`;

const isBound = (grammar: GrammarName, src: ManifestSource): boolean => existsSync(join(src.root, bindingsInput(grammar)));

function grammarSourceInputs(grammar: GrammarName, src: ManifestSource): string[] {
	const dir = relative(REPO_ROOT, grammarPackageDir(grammar));
	const own = [`${dir}/${GRAMMAR_ENTRY}`, `${dir}/${BASE_ENTRY}`, `${dir}/package.json`, bindingsInput(grammar), LOCKFILE];
	if (!isBound(grammar, src)) return own;
	const vocabularyDir = join(src.root, VOCABULARY_SOURCE_DIR);
	const vocabulary = existsSync(vocabularyDir) ? vocabularySources(vocabularyDir).map((name) => `${VOCABULARY_SOURCE_DIR}/${name}`) : [];
	return [...own, PIN_FILE, ...vocabulary];
}

export function stagedInputPathspecs(): string[] {
	return [CODEGEN_SOURCE_DIR, COMMON_PACKAGE_DIR, PIN_FILE, LOCKFILE, VOCABULARY_SOURCE_DIR, ...allGrammars().flatMap((grammar) => [`packages/${grammar}`, nativeCrateRelDir(grammar)])];
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

const runtimeClosureBySource = new WeakMap<ManifestSource, readonly string[]>();

function codegenSourceFiles(src: ManifestSource): string[] {
	const files: string[] = [];
	walk(join(src.root, CODEGEN_SOURCE_DIR), files);
	return files.sort().filter((f) => isCodegenSourceInput(relative(src.root, f)));
}

function runtimeClosure(src: ManifestSource): readonly string[] {
	const cached = runtimeClosureBySource.get(src);
	if (cached !== undefined) return cached;
	const entries = codegenSourceFiles(src).map((file) => relative(src.root, file));
	const closure = moduleClosure(src.root, entries).filter((rel) => !isCodegenSourceInput(rel));
	runtimeClosureBySource.set(src, closure);
	return closure;
}

function codegenSourceHash(src: ManifestSource): string {
	const cached = codegenHashBySource.get(src);
	if (cached !== undefined) return cached;
	const hash = createHash('sha256');
	for (const f of codegenSourceFiles(src)) {
		hash.update(`${relative(src.root, f)}\0`);
		hash.update(readFileSync(f));
		hash.update('\0');
	}
	for (const rel of runtimeClosure(src)) {
		hash.update(`${rel}\0`);
		hash.update(readFileSync(join(src.root, rel)));
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
	const sourceInputs = grammarSourceInputs(grammar, src);
	const bound = isBound(grammar, src);
	const roots = generatedRootsFor(grammar);
	const closure = runtimeClosure(src);
	const pathspecs = [CODEGEN_SOURCE_DIR, ...closure, ...sourceInputs, ...(bound ? [VOCABULARY_SOURCE_DIR] : []), ...roots];
	const matters = (rel: string): boolean =>
		isCodegenSourceInput(rel) ||
		closure.includes(rel) ||
		sourceInputs.includes(rel) ||
		(bound && isVocabularyInput(rel)) ||
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

const UPSTREAM_SKIPPED_DIRS = new Set(['node_modules', 'bindings', 'prebuilds', 'queries', 'test', 'tests', 'examples', 'tree_sitter', '.github']);

const isUpstreamSource = (name: string): boolean =>
	name === 'package.json' || name === 'tree-sitter.json' || name === 'scanner.c' || name === 'scanner.cc' || name.endsWith('.js') || name.endsWith('.h');

function upstreamFiles(dir: string, out: string[]): void {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (!UPSTREAM_SKIPPED_DIRS.has(entry.name)) upstreamFiles(path, out);
		} else if (isUpstreamSource(entry.name)) {
			out.push(path);
		}
	}
}

function resolvePackageDir(from: string, name: string): string | undefined {
	const paths = createRequire(join(from, 'package.json')).resolve.paths(name) ?? [];
	const found = paths.map((nodeModules) => join(nodeModules, name)).find((dir) => existsSync(join(dir, 'package.json')));
	return found === undefined ? undefined : realpathSync(found);
}

function grammarDependencies(dir: string): string[] {
	const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
		dependencies?: Record<string, string>;
		peerDependencies?: Record<string, string>;
	};
	return Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })
		.filter((name) => name.startsWith('tree-sitter-') && name !== 'tree-sitter-cli')
		.sort();
}

const upstreamDigestBySource = new WeakMap<ManifestSource, Map<GrammarName, string>>();

export function upstreamDigest(grammar: GrammarName, src: ManifestSource = worktreeSource()): string {
	const digests = upstreamDigestBySource.get(src) ?? new Map<GrammarName, string>();
	upstreamDigestBySource.set(src, digests);
	const cached = digests.get(grammar);
	if (cached !== undefined) return cached;
	const digest = walkUpstream(grammar, src);
	digests.set(grammar, digest);
	return digest;
}

function walkUpstream(grammar: GrammarName, src: ManifestSource): string {
	const hash = createHash('sha256');
	const grammarDir = join(src.checkout, relative(REPO_ROOT, grammarPackageDir(grammar)));
	const pending: Array<[string, string]> = [[grammarDir, upstreamPackage(grammar)]];
	const seen = new Set<string>();
	while (pending.length > 0) {
		const [from, name] = pending.shift()!;
		const dir = resolvePackageDir(from, name);
		if (dir === undefined || seen.has(dir)) continue;
		seen.add(dir);
		const files: string[] = [];
		upstreamFiles(dir, files);
		for (const file of files.sort()) {
			hash.update(`${name}/${relative(dir, file)}\0`);
			hash.update(readFileSync(file));
			hash.update('\0');
		}
		for (const dependency of grammarDependencies(dir)) pending.push([dir, dependency]);
	}
	return hash.digest('hex');
}

export function computeSourceHash(grammar: GrammarName, src: ManifestSource = worktreeSource()): string {
	const hash = createHash('sha256');
	for (const rel of grammarSourceInputs(grammar, src)) {
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
	hash.update('toolchain\0');
	hash.update(treeSitterToolchainIdentity());
	hash.update('\0');
	hash.update('upstream\0');
	hash.update(upstreamDigest(grammar, src));
	hash.update('\0');
	return hash.digest('hex');
}

function hashGeneratedFiles(grammar: GrammarName, src: ManifestSource): Record<string, string> {
	const files: Record<string, string> = {};
	for (const f of collectFiles(grammar, src)) files[relative(src.root, f)] = sha256File(f);
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
	writeFileAtomic(manifestPath(grammar, src), JSON.stringify(manifest, null, 2) + '\n');
}

export interface SourceFingerprint {
	readonly source: string;
	readonly upstream?: string;
}

export function sourceFingerprint(grammar: GrammarName, src: ManifestSource = worktreeSource()): SourceFingerprint {
	ensureWasmToolchain();
	return { source: computeSourceHash(grammar, src), upstream: upstreamDigest(grammar, src) };
}

export interface RecordedGeneration {
	readonly read: SourceFingerprint;
	readonly files: Readonly<Record<string, string>>;
}

export function recordedGeneration(grammar: GrammarName, src: ManifestSource = worktreeSource()): RecordedGeneration | undefined {
	const manifest = readManifest(grammar, src);
	const last = manifest?.known.at(-1);
	if (manifest === undefined || last === undefined) return undefined;
	const read = last.upstream === undefined ? { source: last.source } : { source: last.source, upstream: last.upstream };
	return { read, files: manifest.files };
}

function outputView(src: ManifestSource): ManifestSource {
	return isCheckout(src) ? checkoutSource(src.checkout) : src;
}

export function writeManifestForGrammar(grammar: GrammarName, read: SourceFingerprint, src: ManifestSource = worktreeSource()): void {
	const now = outputView(src);
	const files = hashGeneratedFiles(grammar, now);
	recordGeneration(grammar, now, files, { ...read, outputs: outputsDigest(files) });
}

export function recordNativeBuild(grammar: GrammarName, generation: RecordedGeneration, src: ManifestSource = worktreeSource()): void {
	const now = outputView(src);
	const files = hashGeneratedFiles(grammar, now);
	const rewritten = (rel: string): boolean => rel.startsWith(`${nativeBindingRelDir(grammar)}/`);
	const changed = [...new Set([...Object.keys(generation.files), ...Object.keys(files)])].sort().find((rel) => !rewritten(rel) && generation.files[rel] !== files[rel]);
	if (changed !== undefined) throw new Error(`${changed} changed since the generation of ${grammar}; regenerate it with gen --all.`);
	recordGeneration(grammar, now, files, { ...generation.read, outputs: outputsDigest(files) });
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
	toolchainMoved: ToolchainMove | undefined;
}

export interface ToolchainMove {
	readonly committed: readonly string[];
	readonly current: readonly string[];
}

function toolchainMove(grammar: GrammarName, src: ManifestSource): ToolchainMove | undefined {
	if (!wasmToolchainInstalled()) return undefined;
	const sittirDir = join(src.root, relative(REPO_ROOT, grammarPackageDir(grammar)), '.sittir');
	const committed = readUpstreamRecord(sittirDir)?.toolchain ?? [];
	const current = treeSitterToolchain();
	const same = committed.length === current.length && committed.every((entry, i) => entry === current[i]);
	return same ? undefined : { committed, current };
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
		stale: [],
		toolchainMoved: undefined
	};
	const files = hashGeneratedFiles(grammar, src);
	const pair: GenerationPair = { source: computeSourceHash(grammar, src), outputs: outputsDigest(files), upstream: upstreamDigest(grammar, src) };
	const manifest = readManifest(grammar, src);
	const recordedUpstream = manifest?.known.at(-1)?.upstream;

	if (!(manifest?.known.some((known) => samePair(known, pair)) ?? false)) {
		const differs = differencesFromTrustedCommit(grammar, src);
		if (differs.length === 0 && (recordedUpstream === undefined || recordedUpstream === pair.upstream)) {
			result.toolchainMoved = toolchainMove(grammar, src);
			if (result.toolchainMoved === undefined && isCheckout(src)) recordGeneration(grammar, src, files, pair);
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
			if (b.stale) result.stale.push(`${b.rel} (${b.reason})`);
		}
	}

	result.ok =
		!result.sourceChanged &&
		result.missing.length === 0 &&
		result.modified.length === 0 &&
		result.extra.length === 0 &&
		result.differs.length === 0 &&
		result.stale.length === 0 &&
		result.toolchainMoved === undefined;
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
				`    SOURCE INPUTS CHANGED (grammar.sittir.ts, package.json, bindings.scm, the vocabulary, bootstrap.json, or packages/codegen/src/** edited since last regen)`
			);
		}
		for (const f of r.modified) lines.push(`    MODIFIED: ${f}`);
		for (const f of r.missing) lines.push(`    MISSING : ${f}`);
		for (const f of r.extra) lines.push(`    EXTRA   : ${f}`);
		for (const f of r.differs) lines.push(`    DIFFERS FROM HEAD: ${f}`);
		for (const f of r.stale) lines.push(`    STALE-BINARY: ${f} — rebuild the napi crate`);
		if (r.toolchainMoved !== undefined) {
			const named = (toolchain: readonly string[]): string => (toolchain.length === 0 ? 'none' : toolchain.join(', '));
			lines.push(`    TOOLCHAIN MOVED since generation (committed ${named(r.toolchainMoved.committed)}, current ${named(r.toolchainMoved.current)}): regenerate`);
		}
	}
	lines.push('');
	lines.push('To restore canonical state, regenerate the affected grammar(s):');
	lines.push('  pnpm exec tsx packages/cli/src/cli.ts gen --grammar <name> --all --output packages/<name>/src');
	throw new Error(lines.join('\n'));
}
