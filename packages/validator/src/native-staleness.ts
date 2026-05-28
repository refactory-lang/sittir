/**
 * Native-binary staleness guard for `--backend native` measurement.
 *
 * The native render path bakes the per-kind `.jinja` templates INTO the `.node`
 * at crate build time — Askama compiles templates via a proc macro, so the
 * binary carries a fixed template bundle. A regen that skips `--all` (or uses
 * `--no-build-native`) rewrites `packages/<g>/templates/` WITHOUT rebuilding the
 * binding, leaving the `.node` with the PREVIOUS templates baked in. At runtime
 * the backend shim detects the resulting template-bundle-hash mismatch and
 * SILENTLY falls back to the JS engine (FR-020) — so `--backend native` counts
 * are not actually native and won't reflect the regen.
 *
 * This guard turns that silent fallback into a loud, actionable warning. It
 * compares mtimes: if any template is newer than the most recent `.node`, the
 * binary predates the last template regen and is stale. mtime is a deliberate
 * heuristic — it needs neither a native engine instance nor the codegen's exact
 * bundled-file set, and it errs toward warning (never blocks). A no-op regen
 * that only bumps timestamps can false-positive; re-running `pnpm validate:native`
 * (incremental) clears it.
 *
 * Discipline this enforces: produce native counts via `pnpm validate:native`
 * (regens + rebuilds + counts), not by calling the raw validator after a
 * partial regen.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Newest mtime (ms) among files in `dir` ending with `ext`, or undefined if none/missing. */
function newestMtimeMs(dir: string, ext: string): number | undefined {
	let files: string[];
	try {
		files = readdirSync(dir).filter((f) => f.endsWith(ext));
	} catch {
		return undefined; // directory absent — caller decides what that means
	}
	if (files.length === 0) return undefined;
	return Math.max(...files.map((f) => statSync(resolve(dir, f)).mtimeMs));
}

/**
 * Warn (to stderr) if the grammar's native binding is older than its templates,
 * i.e. the `.node` was not rebuilt after the last template regen. No-op for
 * grammars without a native crate.
 *
 * @param grammar — grammar name (used to locate `rust/crates/sittir-<grammar>`).
 * @param templatesPath — the `packages/<grammar>/templates` dir (from `defaultTemplatesPath`).
 */
export function warnIfNativeBinaryStale(grammar: string, templatesPath: string): void {
	// packages/validator/src/ → ../../.. → repo root
	const repoRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
	const crateDir = resolve(repoRoot, 'rust', 'crates', `sittir-${grammar}`);
	if (!existsSync(crateDir)) return; // no native crate for this grammar — nothing to guard

	const nodeMtime = newestMtimeMs(crateDir, '.node');
	if (nodeMtime === undefined) {
		console.warn(
			`⚠ [${grammar}] no native binding (.node) in rust/crates/sittir-${grammar}/ — ` +
				`\`--backend native\` will fail or fall back to TS. Build it: \`pnpm validate:native\` ` +
				`or \`pnpm -C rust/crates/sittir-${grammar} run build\`.`,
		);
		return;
	}

	const tplMtime = newestMtimeMs(templatesPath, '.jinja');
	if (tplMtime === undefined) return; // no templates to compare against

	if (tplMtime > nodeMtime) {
		console.warn(
			`⚠ [${grammar}] STALE NATIVE BINARY — templates were regenerated after the last napi build ` +
				`(newest .jinja ${new Date(tplMtime).toISOString()} > newest .node ${new Date(nodeMtime).toISOString()}). ` +
				`Askama bakes templates into the .node at build time, so \`--backend native\` may silently fall back ` +
				`to JS render (FR-020) — these counts will NOT reflect your template changes. ` +
				`Rebuild: \`pnpm validate:native\` (regens + rebuilds + counts) or \`pnpm -C rust/crates/sittir-${grammar} run build\`. ` +
				`[mtime heuristic — a no-op regen that only bumped timestamps can false-positive.]`,
		);
	}
}
