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
  },
});
