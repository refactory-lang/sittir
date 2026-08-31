import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			'@sittir/common/engine': src('../common/src/engine-boundary.ts'),
			'@sittir/common/utils': src('../common/src/utils.ts'),
			'@sittir/common': src('../common/src/index.ts'),
			'@sittir/types': src('../types/src/index.ts'),
			'@sittir/legacy-core/engine': src('../legacy-core/src/engine-boundary.ts'),
			'@sittir/python/utils': src('../python/src/utils.ts'),
			'@sittir/python': src('../python/src/index.ts'),
			'@sittir/rust/utils': src('../rust/src/utils.ts'),
			'@sittir/rust': src('../rust/src/index.ts'),
			'@sittir/typescript/utils': src('../typescript/src/utils.ts'),
			'@sittir/typescript/tsx': src('../typescript/src/tsx/index.ts'),
			'@sittir/typescript': src('../typescript/src/index.ts')
		}
	},
	test: {
		include: ['tests/**/*.test.ts'],
		env: { SITTIR_BACKEND: 'native' }
	}
});
