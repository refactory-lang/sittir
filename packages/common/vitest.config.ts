import { defineConfig } from 'vitest/config';
import { engineGuard } from '../../vitest.engine-guard.config.ts';

export default defineConfig({
	test: {
		...engineGuard,
		include: ['tests/**/*.test.ts'],
		exclude: ['**/node_modules/**', '**/dist/**']
	}
});
