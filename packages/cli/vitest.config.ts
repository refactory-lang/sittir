import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

function pkg(path: string): string {
	return fileURLToPath(new URL(`../${path}`, import.meta.url));
}

export default defineConfig({
	resolve: {
		alias: [
			// Resolve @sittir/* workspace packages to their TS sources so
			// vitest can run without pre-built dist/ directories.
			{ find: '@sittir/validator', replacement: pkg('validator/src/index.ts') },
			{ find: '@sittir/codegen/validate/from', replacement: pkg('tools/src/validate/from.ts') },
			{ find: '@sittir/codegen/validate/factory-render-parse', replacement: pkg('tools/src/validate/factory-render-parse.ts') },
			{ find: '@sittir/codegen/validate/read-render-parse', replacement: pkg('tools/src/validate/read-render-parse.ts') },
			{ find: '@sittir/codegen/validate/template-coverage', replacement: pkg('tools/src/validate/template-coverage.ts') },
			{ find: '@sittir/codegen/run-codegen', replacement: pkg('codegen/src/run-codegen.ts') },
			{ find: '@sittir/codegen', replacement: pkg('codegen/src/index.ts') },
			{ find: '@sittir/tools', replacement: pkg('tools/src/index.ts') },
			{ find: '@sittir/common/engine', replacement: pkg('common/src/engine-boundary.ts') },
			{ find: '@sittir/common/utils', replacement: pkg('common/src/utils.ts') },
			{ find: '@sittir/common', replacement: pkg('common/src/index.ts') },
			{ find: '@sittir/core/engine', replacement: pkg('core/src/engine-boundary.ts') },
			{ find: '@sittir/core', replacement: pkg('core/src/index.ts') },
			{ find: '@sittir/types', replacement: pkg('types/src/index.ts') },
		],
	},
	test: {
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
		exclude: ['**/node_modules/**', '**/dist/**'],
	},
});
