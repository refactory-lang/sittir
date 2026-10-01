import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
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

const MANIFEST_FILENAME = 'generated.manifest.json';

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
	readonly hostBinaries: boolean;
}

let cachedWorktreeSource: ManifestSource | null = null;

export function worktreeSource(): ManifestSource {
	cachedWorktreeSource ??= { root: REPO_ROOT, visible: gitVisiblePaths(REPO_ROOT), hostBinaries: true };
	return cachedWorktreeSource;
}

function manifestPath(grammar: GrammarName, src: ManifestSource): string {
	return join(src.root, `packages/${grammar}/.sittir/${MANIFEST_FILENAME}`);
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

function isManifestExcluded(relPath: string, src: ManifestSource): boolean {
	if (!src.visible.has(relPath)) return true;
	return relPath.endsWith('/test-fixtures.json') || relPath.endsWith('/test-fixtures.left-out.json');
}

function collectFiles(grammar: GrammarName, src: ManifestSource): string[] {
	const all: string[] = [];
	for (const root of pathsFor(grammar)) walk(join(src.root, root), all);
	const manifestAbs = manifestPath(grammar, src);
	return all
		.filter((f) => f !== manifestAbs)
		.filter((f) => !isManifestExcluded(relative(src.root, f), src))
		.sort();
}

interface Manifest {
	grammar: GrammarName;
	source_hash: string;
	files: Record<string, string>;
}

function sourceInputsFor(grammar: GrammarName, src: ManifestSource): string[] {
	const dir = join(src.root, relative(REPO_ROOT, grammarPackageDir(grammar)));
	return [join(dir, GRAMMAR_ENTRY), join(dir, 'package.json')];
}

const codegenHashByRoot = new Map<string, string>();

function codegenSourceHash(src: ManifestSource): string {
	const cached = codegenHashByRoot.get(src.root);
	if (cached !== undefined) return cached;
	const hash = createHash('sha256');
	const codegenSrc = join(src.root, 'packages/codegen/src');
	const files: string[] = [];
	walk(codegenSrc, files);
	for (const f of files.sort()) {
		if (f.endsWith('.js') || f.endsWith('.d.ts')) continue;
		if (f.includes('/__tests__/')) continue;
		if (f.includes('/src/validate/')) continue;
		if (!f.endsWith('.ts')) continue;
		hash.update(`${relative(src.root, f)}\0`);
		hash.update(readFileSync(f));
		hash.update('\0');
	}
	const digest = hash.digest('hex');
	codegenHashByRoot.set(src.root, digest);
	return digest;
}

export function computeSourceHash(grammar: GrammarName, src: ManifestSource = worktreeSource()): string {
	const hash = createHash('sha256');
	for (const input of sourceInputsFor(grammar, src)) {
		if (existsSync(input)) {
			hash.update(`${relative(src.root, input)}\0`);
			hash.update(readFileSync(input));
			hash.update('\0');
		}
	}
	hash.update('codegen\0');
	hash.update(codegenSourceHash(src));
	hash.update('\0');
	return hash.digest('hex');
}

export function writeManifestForGrammar(grammar: GrammarName): void {
	const src = worktreeSource();
	const files: Record<string, string> = {};
	for (const f of collectFiles(grammar, src)) {
		const rel = relative(src.root, f);
		files[rel] = sha256(f);
	}

	const manifest: Manifest = {
		grammar,
		source_hash: computeSourceHash(grammar, src),
		files
	};
	const path = manifestPath(grammar, src);
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
}

export interface VerifyResult {
	grammar: GrammarName;
	ok: boolean;
	manifestPresent: boolean;
	sourceHashMismatch: boolean;
	missing: string[];
	modified: string[];
	extra: string[];
	stale: string[];
}

export function verifyManifestForGrammar(grammar: GrammarName, src: ManifestSource = worktreeSource()): VerifyResult {
	const result: VerifyResult = {
		grammar,
		ok: false,
		manifestPresent: false,
		sourceHashMismatch: false,
		missing: [],
		modified: [],
		extra: [],
		stale: []
	};
	const path = manifestPath(grammar, src);
	if (!existsSync(path)) return result;
	result.manifestPresent = true;
	const manifest = JSON.parse(readFileSync(path, 'utf-8')) as Manifest;

	if (manifest.source_hash !== computeSourceHash(grammar, src)) {
		result.sourceHashMismatch = true;
	}

	const expectedFiles = new Set(Object.keys(manifest.files));
	const actualFiles = new Set(collectFiles(grammar, src).map((f) => relative(src.root, f)));
	for (const [rel, expectedHash] of Object.entries(manifest.files)) {
		const full = join(src.root, rel);
		if (!existsSync(full)) {
			result.missing.push(rel);
			continue;
		}
		if (sha256(full) !== expectedHash) result.modified.push(rel);
	}
	for (const rel of actualFiles) {
		if (!expectedFiles.has(rel)) result.extra.push(rel);
	}

	if (src.hostBinaries) {
		for (const b of hostBinaryFreshnessFor(REPO_ROOT, grammar)) {
			if (b.stale) result.stale.push(`${b.rel} (older than ${b.newestInputRel})`);
		}
	}

	result.ok =
		!result.sourceHashMismatch &&
		result.missing.length === 0 &&
		result.modified.length === 0 &&
		result.extra.length === 0 &&
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
	const lines: string[] = ['Generated manifest verification failed:'];
	for (const r of failed) {
		lines.push(`  ${r.grammar}:`);
		if (!r.manifestPresent) {
			lines.push(
				`    MANIFEST MISSING — no packages/${r.grammar}/.sittir/generated.manifest.json. ` +
					`Run codegen for this grammar to populate it (see regen command below).`
			);
			continue;
		}
		if (r.sourceHashMismatch) {
			lines.push(
				`    SOURCE INPUTS CHANGED (grammar.sittir.ts, package.json, or packages/codegen/src/** edited since last regen)`
			);
		}
		for (const f of r.modified) lines.push(`    MODIFIED: ${f}`);
		for (const f of r.missing) lines.push(`    MISSING : ${f}`);
		for (const f of r.extra) lines.push(`    EXTRA   : ${f}`);
		for (const f of r.stale) lines.push(`    STALE-BINARY: ${f} — rebuild the napi crate`);
	}
	lines.push('');
	lines.push('To restore canonical state, regenerate the affected grammar(s):');
	lines.push('  pnpm exec tsx packages/cli/src/cli.ts gen --grammar <name> --all --output packages/<name>/src');
	throw new Error(lines.join('\n'));
}
