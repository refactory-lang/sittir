import { defineConfig } from 'vitest/config';

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
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    // Compile every grammar's override parser before any test runs.
    // `.sittir/parser.wasm` is gitignored; on a fresh checkout / in CI
    // the file doesn't exist and validators silently fall back to the
    // base WASM (which lacks override fields), dropping corpus
    // ceilings below floor. compileParser() is mtime-aware — local
    // runs with a cached wasm are a no-op (~1ms). Cold compile pays
    // ~10s total across the three grammars, paid once per session.
    globalSetup: ['./vitest.setup.ts'],
  },
});
