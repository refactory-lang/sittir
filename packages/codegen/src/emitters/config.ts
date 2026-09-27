export interface EmitConfigConfig {
	grammar: string;
	stable: boolean;
}

export function emitConfig(config: EmitConfigConfig): string {
	return [
		`import { defineConfig } from 'vitest/config';`,
		`import { sourceAliases } from '../codegen/src/grammars.ts';`,
		'',
		'export default defineConfig({',
		'  resolve: { alias: sourceAliases() },',
		'  test: {',
		"    include: ['tests/**/*.test.ts'],",
		...(config.stable ? [] : ['    passWithNoTests: true,']),
		"    env: { SITTIR_BACKEND: 'native' },",
		'  },',
		'});',
		''
	].join('\n');
}
