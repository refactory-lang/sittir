import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    env: { SITTIR_BACKEND: 'js' },
  },
});
