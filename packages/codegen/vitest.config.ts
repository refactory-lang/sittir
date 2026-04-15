import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Limit discovery to TS sources under src/ + tests/. Without this,
    // the default `**/*.test.?(c|m)[jt]s?(x)` glob also picks up the
    // compiled JS copies in `dist/__tests__/` after a build, and those
    // compiled tests resolve `__dirname` inside dist — where fixture
    // files (plain `.js`, not emitted by tsgo) don't exist.
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
