import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostBinaryFreshnessFor } from './native-binary-freshness.ts';

export const REPO_ROOT = (() => {
	const here = dirname(fileURLToPath(import.meta.url));
	return dirname(dirname(dirname(dirname(here))));
})();

export const GRAMMARS = ['rust', 'typescript', 'python'] as const;
export type Grammar = (typeof GRAMMARS)[number];

const MANIFEST_FILENAME = 'generated.manifest.json';

export function generatedRootsFor(grammar: Grammar): string[] {
	return [
		`packages/${grammar}/src`,
		`packages/${grammar}/templates`,
		`packages/${grammar}/.sittir`,
		`rust/crates/sittir-${grammar}/src`,
		`rust/crates/sittir-${grammar}/test-fixtures.json`,
		`rust/crates/sittir-${grammar}/index.d.ts`,
		`rust/crates/sittir-${grammar}/index.js`
	];
}

function pathsFor(grammar: Grammar): string[] {
	return generatedRootsFor(grammar);
}

function hostFilesFor(grammar: Grammar): string[] {
	const crateDir = join(REPO_ROOT, `rust/crates/sittir-${grammar}`);
	if (!existsSync(crateDir)) return [];
	return readdirSync(crateDir)
		.filter((name) => name.endsWith('.node'))
		.map((name) => `rust/crates/sittir-${grammar}/${name}`);
}

function manifestPath(grammar: Grammar): string {
	return join(REPO_ROOT, `packages/${grammar}/.sittir/${MANIFEST_FILENAME}`);
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

let cachedTrackedPaths: ReadonlySet<string> | null = null;

function trackedPaths(): ReadonlySet<string> {
	if (cachedTrackedPaths !== null) return cachedTrackedPaths;
	let stdout: string;
	try {
		stdout = execFileSync('git', ['ls-files', '-z'], {
			cwd: REPO_ROOT,
			maxBuffer: 1 << 28,
			encoding: 'utf8'
		});
	} catch (cause) {
		throw new Error(
			`generated-manifest: could not list git-tracked files in ${REPO_ROOT}. The manifest records exactly ` +
				`the generated artifacts the repository tracks, so this fact has to come from git.`,
			{ cause }
		);
	}
	cachedTrackedPaths = new Set(stdout.split('\0').filter((p) => p.length > 0));
	return cachedTrackedPaths;
}

function isManifestExcluded(relPath: string): boolean {
	if (!trackedPaths().has(relPath)) return true;
	return relPath.endsWith('/test-fixtures.json');
}

function collectFiles(grammar: Grammar): string[] {
	const all: string[] = [];
	for (const root of pathsFor(grammar)) walk(join(REPO_ROOT, root), all);
	const manifestAbs = manifestPath(grammar);
	return all
		.filter((f) => f !== manifestAbs)
		.filter((f) => !isManifestExcluded(relative(REPO_ROOT, f)))
		.sort();
}

interface Manifest {
	grammar: Grammar;
	source_hash: string;
	files: Record<string, string>;
	host_files?: Record<string, string>;
}

const HOST_BINARY_SENTINEL = 'freshness-checked';

function sourceInputsFor(grammar: Grammar): string[] {
	return [
		join(REPO_ROOT, `packages/${grammar}/grammar.sittir.ts`),
		join(REPO_ROOT, `packages/${grammar}/package.json`)
	];
}

let cachedCodegenHash: string | null = null;

function codegenSourceHash(): string {
	if (cachedCodegenHash !== null) return cachedCodegenHash;
	const hash = createHash('sha256');
	const codegenSrc = join(REPO_ROOT, 'packages/codegen/src');
	const files: string[] = [];
	walk(codegenSrc, files);
	for (const f of files.sort()) {
		if (f.endsWith('.js') || f.endsWith('.d.ts')) continue;
		if (f.includes('/__tests__/')) continue;
		if (f.includes('/src/validate/')) continue;
		if (!f.endsWith('.ts')) continue;
		hash.update(`${relative(REPO_ROOT, f)}\0`);
		hash.update(readFileSync(f));
		hash.update('\0');
	}
	cachedCodegenHash = hash.digest('hex');
	return cachedCodegenHash;
}

export function computeSourceHash(grammar: Grammar): string {
	const hash = createHash('sha256');
	for (const input of sourceInputsFor(grammar)) {
		if (existsSync(input)) {
			hash.update(`${relative(REPO_ROOT, input)}\0`);
			hash.update(readFileSync(input));
			hash.update('\0');
		}
	}
	hash.update('codegen\0');
	hash.update(codegenSourceHash());
	hash.update('\0');
	return hash.digest('hex');
}

export function writeManifestForGrammar(grammar: Grammar): void {
	const files: Record<string, string> = {};
	for (const f of collectFiles(grammar)) {
		const rel = relative(REPO_ROOT, f);
		files[rel] = sha256(f);
	}

	const existing = readExistingManifest(grammar);
	const host_files: Record<string, string> = { ...existing?.host_files };
	for (const rel of hostFilesFor(grammar)) {
		host_files[rel] = HOST_BINARY_SENTINEL;
	}

	const manifest: Manifest = {
		grammar,
		source_hash: computeSourceHash(grammar),
		files,
		...(Object.keys(host_files).length > 0 ? { host_files } : {})
	};
	const path = manifestPath(grammar);
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
}

function readExistingManifest(grammar: Grammar): Manifest | null {
	const path = manifestPath(grammar);
	if (!existsSync(path)) return null;
	try {
		return JSON.parse(readFileSync(path, 'utf-8')) as Manifest;
	} catch {
		return null;
	}
}

export interface VerifyResult {
	grammar: Grammar;
	ok: boolean;
	manifestPresent: boolean;
	sourceHashMismatch: boolean;
	missing: string[];
	modified: string[];
	extra: string[];
	stale: string[];
}

export function verifyManifestForGrammar(grammar: Grammar): VerifyResult {
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
	const path = manifestPath(grammar);
	if (!existsSync(path)) return result;
	result.manifestPresent = true;
	const manifest = JSON.parse(readFileSync(path, 'utf-8')) as Manifest;

	if (manifest.source_hash !== computeSourceHash(grammar)) {
		result.sourceHashMismatch = true;
	}

	const expectedFiles = new Set(Object.keys(manifest.files));
	const actualFiles = new Set(collectFiles(grammar).map((f) => relative(REPO_ROOT, f)));
	for (const [rel, expectedHash] of Object.entries(manifest.files)) {
		const full = join(REPO_ROOT, rel);
		if (!existsSync(full)) {
			result.missing.push(rel);
			continue;
		}
		if (sha256(full) !== expectedHash) result.modified.push(rel);
	}
	for (const rel of actualFiles) {
		if (!expectedFiles.has(rel)) result.extra.push(rel);
	}

	for (const b of hostBinaryFreshnessFor(REPO_ROOT, grammar)) {
		if (b.stale) result.stale.push(`${b.rel} (older than ${b.newestInputRel})`);
	}

	result.ok =
		!result.sourceHashMismatch &&
		result.missing.length === 0 &&
		result.modified.length === 0 &&
		result.extra.length === 0 &&
		result.stale.length === 0;
	return result;
}

export function assertGeneratedManifestsClean(grammars?: readonly Grammar[]): void {
	if (process.env.SITTIR_INTERNAL_CODEGEN_RUN === '1') return;
	const targets = grammars ?? GRAMMARS;
	const results = targets.map((g) => verifyManifestForGrammar(g));
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
