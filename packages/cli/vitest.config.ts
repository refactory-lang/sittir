import { defineConfig } from 'vitest/config';
import { sourceAliases } from '../codegen/src/grammars.ts';

export default defineConfig({
	resolve: {
		alias: [...sourceAliases()]
	},
	test: {
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
		exclude: ['**/node_modules/**', '**/dist/**']
	}
});
