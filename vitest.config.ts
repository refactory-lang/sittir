import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Root vitest config. The workspace is still defined in
 * `vitest.workspace.ts` (one project per package), but the default
 * test-file glob (`**\/*.test.?(c|m)[jt]s?(x)`) picks up compiled
 * `dist/__tests__/*.test.js` copies after a build — those compiled
 * tests resolve `__dirname` inside `dist/` where the fixture `.js`
 * files don't exist (tsgo only emits TS sources). Excluding `dist/`
 * and every `tests/unit/emitters/*-ir.test.ts` shadow pointer keeps
 * test discovery to the real TypeScript sources.
 */
export default defineConfig({
	resolve: {
		// Root-level tests (tests/format-roundtrip/*, tests/acceptance/*) have
		// no per-package tsconfig `paths` mapping to fall back on, so `@sittir/*`
		// imports there resolve via real Node/Vite package resolution — which
		// requires `dist/` to already be built (package.json's `exports`).
		// Package-scoped tests avoid this via tsconfig paths (`tsx` honors them
		// at runtime — see project convention), resolving straight to source.
		// Mirror that here so root-level tests don't have a hard dependency on
		// a fresh `dist/` build either — matches tsconfig.json's paths exactly.
		alias: {
			'@sittir/legacy-core/engine': fileURLToPath(
				new URL('./packages/legacy-core/src/engine-boundary.ts', import.meta.url)
			),
			'@sittir/python/utils': fileURLToPath(new URL('./packages/python/src/utils.ts', import.meta.url)),
			'@sittir/python': fileURLToPath(new URL('./packages/python/src/index.ts', import.meta.url)),
			'@sittir/rust/utils': fileURLToPath(new URL('./packages/rust/src/utils.ts', import.meta.url)),
			'@sittir/rust': fileURLToPath(new URL('./packages/rust/src/index.ts', import.meta.url)),
			'@sittir/typescript/utils': fileURLToPath(new URL('./packages/typescript/src/utils.ts', import.meta.url)),
			'@sittir/typescript/tsx': fileURLToPath(new URL('./packages/typescript/src/tsx/index.ts', import.meta.url)),
			'@sittir/typescript': fileURLToPath(new URL('./packages/typescript/src/index.ts', import.meta.url))
		}
	},
	test: {
		exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**', '**/.claude/worktrees/**'],
		// Compile every grammar's override parser before any test runs.
		// `.sittir/parser.wasm` is gitignored; on a fresh checkout / in CI
		// the file doesn't exist and validators silently fall back to the
		// base WASM (which lacks override fields), dropping corpus
		// ceilings below floor. compileParser() is mtime-aware — local
		// runs with a cached wasm are a no-op (~1ms). Cold compile pays
		// ~10s total across the three grammars, paid once per session.
		globalSetup: ['./vitest.setup.ts'],
		// JSON report as a side artifact of the SAME run (gitignored scratch
		// path) — `scripts/test-and-record.ts` reads it to append a
		// test-history.jsonl entry without spawning a second, separate
		// vitest invocation. Cheap to always emit; nothing consumes it
		// unless the wrapper script asks for it.
		reporters: ['default', 'json'],
		outputFile: { json: './.vitest-report.json' }
	}
});
