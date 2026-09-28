/**
 * Global vitest setup — ensure every grammar has its override parser before
 * any test runs.
 *
 * `.sittir/parser.wasm` is committed, and every regen rebuilds it after its
 * own `tree-sitter generate`. Setup is only a backstop for a missing file:
 * without it, validators that call `loadLanguageForGrammar` would fall back to
 * the base WASM, which lacks override fields. A present wasm is never
 * rebuilt here, so a grammar edit reaches tests through a regen.
 */

import { ensureParserWasm } from './packages/codegen/src/transpile/compile-parser.ts';
import { allGrammars, grammarPackageDir } from './packages/codegen/src/grammars.ts';
import { execFileSync } from 'node:child_process';

export async function setup() {
	// Rebuild TS package dists so tests never run against stale compiled
	// output. tsc's incremental mode makes this a near-no-op when sources
	// haven't changed. Scoped to `packages/**` (`--filter`) — the napi/
	// cargo crates under `rust/crates/*` are ALSO pnpm workspace members
	// with their own `build` script, and an unscoped `pnpm -r run build`
	// pulls those in too: cargo's own incremental check still costs
	// 30-50s wall-clock even when nothing changed (verified locally),
	// versus ~2s for every TS package combined. Native binary staleness
	// is a separate, much rarer concern (requires actual Rust source
	// changes) already handled by the project's own SITTIR_NATIVE_DEBUG /
	// validate:native discipline — not something this global test setup
	// should pay for on every run. Tests resolve via tsconfig paths (tsx
	// runtime) in the common case anyway; only a handful of root-level
	// tests actually need dist/ fresh.
	//
	// Skipped in CI: the workflow's own "Build" step already ran this
	// exact command moments earlier — rebuilding here is pure redundancy.
	// (Historically the redundant rebuild also amplified a napi-rs
	// index.d.ts nondeterminism bug; that root cause is fixed at
	// `rust/crates/sittir-core/build.rs` — see its doc comment.)
	// Local dev runs are unaffected and keep rebuilding here as before.
	if (!process.env.CI) {
		try {
			const t0 = Date.now();
			execFileSync('pnpm', ['--filter', './packages/**', '-r', 'run', 'build'], {
				cwd: import.meta.dirname,
				stdio: 'pipe'
			});
			console.log(`[vitest-setup] pnpm --filter ./packages/** -r run build (${Date.now() - t0}ms)`);
		} catch {
			// The dist artifacts are already present from the last successful build.
			// Warn but continue — tests resolve via tsconfig paths (tsx runtime),
			// not from dist.
			console.warn('[vitest-setup] pnpm -r run build failed — continuing with cached dist');
		}
	} else {
		console.log('[vitest-setup] CI detected — skipping redundant pnpm -r run build (workflow already built)');
	}

	for (const grammar of allGrammars()) {
		const t0 = Date.now();
		const { wasmPath, built } = ensureParserWasm(grammarPackageDir(grammar));
		if (built) console.log(`[vitest-setup] ${grammar}: built ${wasmPath} (${Date.now() - t0}ms)`);
	}
}
