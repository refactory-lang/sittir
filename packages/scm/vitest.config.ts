import { defineConfig } from 'vitest/config';
import { sourceAliases } from '../codegen/src/grammars.ts';

export default defineConfig({
	resolve: { alias: sourceAliases() },
	test: {
		include: ['tests/**/*.test.ts'],
		passWithNoTests: true,
		env: { SITTIR_BACKEND: 'native' }
	}
});
