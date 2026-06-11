/**
 * Freshness predicate for grammar-owned napi binaries (`*.node`).
 *
 * Askama bakes the per-kind `.jinja` templates into the binary at compile
 * time, and the transport/dispatch code is compiled from the generated
 * `src/render/*.rs` — so a `.node` older than ANY of those inputs renders
 * with stale templates or stale transport logic. Historically this failed
 * SILENTLY (validators ran against the stale engine; in the worst case the
 * stale binary segfaulted mid-gate). Every native consumer should assert
 * freshness before loading the engine.
 *
 * Shared leaf module: consumed by `generated-manifest.ts` (manifest
 * verification of host binaries) and `validate/common.ts`
 * (`loadNativeEngineForGrammar`). Keep it dependency-free so neither
 * consumer picks up import cycles.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Freshness report for one host binary. */
export interface HostBinaryFreshness {
	/** Repo-relative binary path, e.g. `rust/crates/sittir-rust/sittir-rust.darwin-arm64.node`. */
	rel: string;
	binaryMtimeMs: number;
	/** Newest mtime across the crate's `src/**` + `templates/**` inputs. */
	newestInputMtimeMs: number;
	/** Repo-relative path of the newest input (diagnostic). */
	newestInputRel: string;
	/** True when the binary is OLDER than at least one compiled-in input. */
	stale: boolean;
}

function walkMtimes(root: string, repoRoot: string, newest: { mtimeMs: number; rel: string }): void {
	if (!existsSync(root)) return;
	const stat = statSync(root);
	if (stat.isFile()) {
		if (stat.mtimeMs > newest.mtimeMs) {
			newest.mtimeMs = stat.mtimeMs;
			newest.rel = root.slice(repoRoot.length + 1);
		}
		return;
	}
	if (stat.isDirectory()) {
		for (const name of readdirSync(root)) walkMtimes(join(root, name), repoRoot, newest);
	}
}

/**
 * Report freshness for every `*.node` present in the grammar's crate dir.
 * Returns `[]` when the crate dir or binaries are absent (not built yet —
 * absence is tolerated; staleness is not).
 */
export function hostBinaryFreshnessFor(repoRoot: string, grammar: string): HostBinaryFreshness[] {
	const crateDir = join(repoRoot, `rust/crates/sittir-${grammar}`);
	if (!existsSync(crateDir)) return [];
	const binaries = readdirSync(crateDir).filter((name) => name.endsWith('.node'));
	if (binaries.length === 0) return [];

	const newest = { mtimeMs: 0, rel: '' };
	walkMtimes(join(crateDir, 'src'), repoRoot, newest);
	walkMtimes(join(crateDir, 'templates'), repoRoot, newest);

	return binaries.map((name) => {
		const binaryMtimeMs = statSync(join(crateDir, name)).mtimeMs;
		return {
			rel: `rust/crates/sittir-${grammar}/${name}`,
			binaryMtimeMs,
			newestInputMtimeMs: newest.mtimeMs,
			newestInputRel: newest.rel,
			stale: binaryMtimeMs < newest.mtimeMs
		};
	});
}

/**
 * Throw when any present host binary is stale. No-op when no binary exists
 * (not built yet — callers fall back to their own "engine unavailable"
 * handling).
 */
export function assertNativeBinaryFresh(repoRoot: string, grammar: string): void {
	const stale = hostBinaryFreshnessFor(repoRoot, grammar).filter((b) => b.stale);
	if (stale.length === 0) return;
	const lines = stale.map(
		(b) =>
			`  ${b.rel} is OLDER than ${b.newestInputRel} — the binary was built before the current ` +
			`generated sources/templates and would validate stale code.`
	);
	throw new Error(
		`Stale native binary for grammar '${grammar}':\n${lines.join('\n')}\n` +
			`Rebuild it:\n  pnpm exec tsx packages/cli/src/cli.ts gen --grammar ${grammar} --all --output packages/${grammar}/src\n` +
			`(or: pnpm -C rust/crates/sittir-${grammar} run build)`
	);
}
