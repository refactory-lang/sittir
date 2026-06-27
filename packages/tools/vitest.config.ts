import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

function pkg(path: string): string {
	return fileURLToPath(new URL(`../${path}`, import.meta.url));
}

export default defineConfig({
	resolve: {
		alias: [
			// Resolve @sittir/* workspace packages to their TS sources so vitest can
			// run without pre-built dist/ directories. Needed since the validation
			// facade (run/commands/history) was absorbed here from @sittir/validator
			// — its tests transitively import @sittir/common / @sittir/core / types.
			{ find: '@sittir/codegen/run-codegen', replacement: pkg('codegen/src/run-codegen.ts') },
			{ find: '@sittir/codegen', replacement: pkg('codegen/src/index.ts') },
			{ find: '@sittir/common/engine', replacement: pkg('common/src/engine-boundary.ts') },
			{ find: '@sittir/common/utils', replacement: pkg('common/src/utils.ts') },
			{ find: '@sittir/common', replacement: pkg('common/src/index.ts') },
			{ find: '@sittir/core/engine', replacement: pkg('core/src/engine-boundary.ts') },
			{ find: '@sittir/core', replacement: pkg('core/src/index.ts') },
			{ find: '@sittir/types', replacement: pkg('types/src/index.ts') }
		]
	},
	test: {
		include: ['tests/**/*.test.ts'],
		exclude: ['dist/**', 'node_modules/**']
	}
});
