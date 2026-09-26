import { defineConfig } from 'vitest/config';
import { sourceAliases } from '../codegen/src/grammars.ts';
import { fileURLToPath } from 'node:url';

function pkg(path: string): string {
	return fileURLToPath(new URL(`../${path}`, import.meta.url));
}

export default defineConfig({
	resolve: {
		alias: [
			{ find: '@sittir/codegen/validate/from', replacement: pkg('tools/src/validate/from.ts') },
			{ find: '@sittir/codegen/validate/factory-render-parse', replacement: pkg('tools/src/validate/factory-render-parse.ts') },
			{ find: '@sittir/codegen/validate/read-render-parse', replacement: pkg('tools/src/validate/read-render-parse.ts') },
			{ find: '@sittir/codegen/validate/template-coverage', replacement: pkg('tools/src/validate/template-coverage.ts') },
			...sourceAliases()
		]
	},
	test: {
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
		exclude: ['**/node_modules/**', '**/dist/**']
	}
});
