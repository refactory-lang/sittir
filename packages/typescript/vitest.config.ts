import { defineConfig } from 'vitest/config';
import { sourceAliases } from '../codegen/src/grammars.ts';
import { engineGuard } from '../../vitest.engine-guard.config.ts';

export default defineConfig({
	resolve: { alias: sourceAliases() },
	test: {
		...engineGuard,
		include: ['tests/**/*.test.ts'],
		env: { SITTIR_BACKEND: 'native' }
	}
});
