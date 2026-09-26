import { defineConfig } from 'vitest/config';
import { sourceAliases } from '../codegen/src/grammars.ts';

export default defineConfig({
	resolve: { alias: sourceAliases() },
	test: {
		include: ['tests/**/*.test.ts'],
		env: { SITTIR_BACKEND: 'native' }
	}
});
