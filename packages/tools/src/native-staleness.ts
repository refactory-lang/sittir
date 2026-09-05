/**
 * Native-binary staleness guard for `--backend native` measurement.
 *
 * The native render path is the generated render module compiled into the
 * `.node` at crate build time. A regen that skips `--all` (or uses
 * `--no-build-native`) rewrites `rust/crates/sittir-<g>/src/render/` WITHOUT
 * rebuilding the binding, leaving the `.node` with the PREVIOUS render module.
 * At runtime the backend shim detects the resulting render-module-hash
 * mismatch and falls back to the JS backend status — so `--backend native`
 * counts would not be native and would not reflect the regen.
 *
 * This guard turns that silent fallback into a loud, actionable warning. It
 * compares mtimes: if any generated render source is newer than the most
 * recent `.node`, the binary predates the last regen and is stale. mtime is a
 * deliberate heuristic — it needs neither a native engine instance nor the
 * codegen's exact file set, and it errs toward warning (never blocks). A
 * no-op regen that only bumps timestamps can false-positive; re-running
 * `pnpm validate:native` (incremental) clears it.
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
 * Warn (to stderr) if the grammar's native binding is older than its generated
 * render module, i.e. the `.node` was not rebuilt after the last regen. No-op
 * for grammars without a native crate.
 *
 * @param grammar — grammar name (used to locate `rust/crates/sittir-<grammar>`).
 */
export function warnIfNativeBinaryStale(grammar: string): void {
	// packages/tools/src/ → ../../.. → repo root
	const repoRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
	const crateDir = resolve(repoRoot, 'rust', 'crates', `sittir-${grammar}`);
	if (!existsSync(crateDir)) return; // no native crate for this grammar — nothing to guard

	const nodeMtime = newestMtimeMs(crateDir, '.node');
	if (nodeMtime === undefined) {
		console.warn(
			`⚠ [${grammar}] no native binding (.node) in rust/crates/sittir-${grammar}/ — ` +
				`\`--backend native\` will fail or fall back to TS. Build it: \`pnpm validate:native\` ` +
				`or \`pnpm -C rust/crates/sittir-${grammar} run build\`.`
		);
		return;
	}

	const renderMtime = newestMtimeMs(resolve(crateDir, 'src', 'render'), '.rs');
	if (renderMtime === undefined) return; // no render module to compare against

	if (renderMtime > nodeMtime) {
		console.warn(
			`⚠ [${grammar}] STALE NATIVE BINARY — the render module was regenerated after the last napi build ` +
				`(newest src/render/*.rs ${new Date(renderMtime).toISOString()} > newest .node ${new Date(nodeMtime).toISOString()}). ` +
				`The render module is compiled into the .node, so \`--backend native\` may fall back ` +
				`to the JS backend status — these counts will NOT reflect your changes. ` +
				`Rebuild: \`pnpm validate:native\` (regens + rebuilds + counts) or \`pnpm -C rust/crates/sittir-${grammar} run build\`. ` +
				`[mtime heuristic — a no-op regen that only bumped timestamps can false-positive.]`
		);
	}
}
