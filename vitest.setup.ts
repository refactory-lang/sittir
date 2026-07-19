/**
 * Global vitest setup — ensure every grammar's override parser is
 * compiled before any test runs.
 *
 * `.sittir/parser.wasm` is gitignored and regenerated on demand. On a
 * fresh checkout (or in CI) the file doesn't exist, and validators
 * that call `loadLanguageForGrammar` silently fall back to the base
 * WASM — which lacks override fields, which drops corpus-validation
 * ceilings below their floors, which fails the test.
 *
 * compileParser() is mtime-aware: if the WASM is newer than
 * grammar.js it's a no-op. Local developer runs skip the compile
 * step entirely. CI pays the compile cost (~5-10s per grammar) once
 * at the start of the test run.
 */

import { compileParser } from './packages/codegen/src/transpile/compile-parser.ts';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const GRAMMARS = ['rust', 'typescript', 'python'] as const;

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

	for (const grammar of GRAMMARS) {
		const grammarDir = join(import.meta.dirname, 'packages', grammar);
		const grammarJs = join(grammarDir, '.sittir', 'grammar.js');
		if (!existsSync(grammarJs)) {
			console.warn(`[vitest-setup] no .sittir/grammar.js for ${grammar} — skip`);
			continue;
		}
		try {
			const t0 = Date.now();
			const wasm = await compileParser(grammarDir);
			console.log(`[vitest-setup] ${grammar}: ${wasm} (${Date.now() - t0}ms)`);
		} catch (e) {
			console.error(`[vitest-setup] compileParser(${grammar}) failed:`, (e as Error).message?.slice(0, 200));
			throw e;
		}
	}
}
