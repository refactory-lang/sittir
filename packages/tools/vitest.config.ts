import { defineConfig } from 'vitest/config';
import { sourceAliases } from '../codegen/src/grammars.ts';

export default defineConfig({
	resolve: {
		alias: sourceAliases()
	},
	test: {
		// Include src-level guards too (corpus-validation, render-pipeline, etc.)
		// relocated here from codegen by R9 — codegen's vitest discovered them via
		// src/**; tools must as well or these regression guards go unrun. They are
		// excluded from the build (tsconfig.build.json) so they don't gate tsc.
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
		exclude: ['dist/**', 'node_modules/**']
	}
});
