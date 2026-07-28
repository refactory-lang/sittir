/**
 * generated-manifest — module that writes/verifies per-grammar SHA256
 * manifests for every generated file.
 *
 * Manifest lives at `packages/<grammar>/.sittir/generated.manifest.json`.
 *
 * ## Lifecycle
 *
 * - `writeManifestForGrammar(grammar)` is called by `packages/codegen/src/cli.ts`
 *   at the end of each successful per-grammar regen. There is intentionally no
 *   separate CLI for writing — the manifest must always be in lockstep with the
 *   codegen output it describes.
 * - `assertGeneratedManifestsClean()` is called by the validator
 *   (`packages/tools/src/validate/common.ts`) at startup, before any
 *   counts/probe-factory work. Verification failure aborts the validator;
 *   the only legitimate way to update a manifest is to re-run codegen.
 *
 * The manifest excludes itself (would otherwise be a chicken-and-egg).
 *
 * ## Tracked in git
 *
 * The manifest file is force-added to git despite `packages/*\/.sittir/`
 * being gitignored — same pattern as `grammar.js`, `package.json`,
 * `tree-sitter.json` inside the same directory. Tracking the manifest is
 * what makes cross-commit drift detectable: if a commit changes a generated
 * file without re-running codegen, the committed file hash diverges from
 * the committed manifest entry and `verifyManifestForGrammar` flags it.
 *
 * ## Limits
 *
 * The manifest catches honest-mistake hand-edits AND cross-commit drift
 * (since the manifest is itself committed). It does NOT catch a coordinated
 * commit that updates both the file and its manifest entry but ships an
 * INTERNALLY inconsistent codegen output (e.g., wrap.ts and templates that
 * disagree on slot optionality). That class of bug requires a CI gate that
 * re-runs codegen and diffs the on-disk content.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostBinaryFreshnessFor } from './native-binary-freshness.ts';

export const REPO_ROOT = (() => {
	// File location: packages/codegen/src/scripts/generated-manifest.ts
	// Repo root is 5 dirname() steps up from the file location.
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
		`rust/crates/sittir-${grammar}/templates`,
		`rust/crates/sittir-${grammar}/test-fixtures.json`,
		`rust/crates/sittir-${grammar}/index.d.ts`,
		`rust/crates/sittir-${grammar}/index.js`
	];
}

function pathsFor(grammar: Grammar): string[] {
	return generatedRootsFor(grammar);
}

function hostFilesFor(grammar: Grammar): string[] {
	// Platform-specific build artifacts (napi-emitted compiled binaries).
	// Tracked in the `host_files` section: hashed and verified, but
	// missing-locally is tolerated because different developers / CI runners
	// produce different per-platform binaries (`*.darwin-arm64.node`,
	// `*.linux-x64.node`, etc.). The manifest will accumulate every binary
	// every developer commits; verification only enforces matches for the
	// binaries that exist on the current host.
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

function isManifestUntracked(relPath: string): boolean {
	return relPath.endsWith('/test-fixtures.json');
}

function collectFiles(grammar: Grammar): string[] {
	const all: string[] = [];
	for (const root of pathsFor(grammar)) walk(join(REPO_ROOT, root), all);
	const manifestAbs = manifestPath(grammar);
	return all
		.filter((f) => f !== manifestAbs)
		.filter((f) => !isManifestUntracked(relative(REPO_ROOT, f)))
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
	return [join(REPO_ROOT, `packages/${grammar}/overrides.ts`), join(REPO_ROOT, `packages/${grammar}/package.json`)];
}

let cachedCodegenHash: string | null = null;

function codegenSourceHash(): string {
	if (cachedCodegenHash !== null) return cachedCodegenHash;
	const hash = createHash('sha256');
	const codegenSrc = join(REPO_ROOT, 'packages/codegen/src');
	const files: string[] = [];
	walk(codegenSrc, files);
	for (const f of files.sort()) {
		// Skip generated `.js`/`.d.ts` companions and test directories.
		if (f.endsWith('.js') || f.endsWith('.d.ts')) continue;
		if (f.includes('/__tests__/')) continue;
		// Consumer-side validators don't affect generated output.
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
	// 1. Per-grammar source inputs (overrides.ts + package.json).
	for (const input of sourceInputsFor(grammar)) {
		if (existsSync(input)) {
			hash.update(`${relative(REPO_ROOT, input)}\0`);
			hash.update(readFileSync(input));
			hash.update('\0');
		}
	}
	// 2. Codegen source — same per-grammar inputs against a different codegen
	// produce different output, so codegen state IS part of the source.
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

	// Preserve previously-recorded host_files entries from other platforms,
	// then overwrite/add this host's binaries. This way commits from a
	// darwin-arm64 dev don't wipe a linux-x64 binary previously committed
	// by another dev. Entries carry the freshness sentinel, not a content
	// hash — see the Manifest.host_files docs.
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

	// Source-hash cross-layer synchronicity check: did the source inputs
	// (overrides.ts + package.json) change since this manifest was written?
	// If yes, the generated content is stale relative to current inputs and
	// the user needs to re-run codegen.
	if (manifest.source_hash !== computeSourceHash(grammar)) {
		result.sourceHashMismatch = true;
	}

	// Cross-platform `files`: every entry must exist and match.
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

	// Platform-specific `host_files`: FRESHNESS check, not content hashes
	// (see Manifest.host_files docs). Missing binaries are silently
	// tolerated (per-platform); present-but-stale binaries fail — they
	// would validate stale code. Checks ALL binaries on this host, not just
	// manifest-listed ones, so a never-committed local build is gated too.
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
				`    SOURCE INPUTS CHANGED (overrides.ts, package.json, or packages/codegen/src/** edited since last regen)`
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
