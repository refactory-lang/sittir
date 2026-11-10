import { defineConfig } from 'vitest/config';
import { engineGuard } from '../../vitest.engine-guard.config.ts';
import { sourceAliases } from '../codegen/src/grammars.ts';

export default defineConfig({
	resolve: {
		alias: [...sourceAliases()]
	},
	test: {
		...engineGuard,
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
		exclude: ['**/node_modules/**', '**/dist/**']
	}
});
