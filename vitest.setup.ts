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
	// Rebuild core + grammar package dists so tests never run against
	// stale compiled output. pnpm build is mtime-aware via tsgo's
	// incremental mode — no-op when sources haven't changed (~50ms).
	//
	// Skipped in CI: the workflow's own "Build" step already ran this
	// exact command moments earlier. Running it again here — a second
	// `pnpm -r run build` in the same job, against a cross-run-warm
	// cargo cache (Swatinem/rust-cache) — is what triggers a napi-rs
	// build-determinism bug: the second build's napi codegen pass
	// regenerates `rust/crates/sittir-*/index.d.ts` incompletely,
	// dropping dependency-crate type defs (e.g. `Edit`/`Span`), which
	// then fails `assertGeneratedManifestsClean`. Confirmed reproducible
	// (identical failure across 2 independent CI runs, 2026-07-18).
	// Local dev runs are unaffected and keep rebuilding here as before.
	if (!process.env.CI) {
		try {
			const t0 = Date.now();
			execFileSync('pnpm', ['-r', 'run', 'build'], {
				cwd: import.meta.dirname,
				stdio: 'pipe'
			});
			console.log(`[vitest-setup] pnpm -r run build (${Date.now() - t0}ms)`);
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
