/**
 * Emits a `vitest.config.ts` for the generated package.
 */

export interface EmitConfigConfig {
	grammar: string;
}

export function emitConfig(_config: EmitConfigConfig): string {
	const lines: string[] = [];

	lines.push(`import { defineConfig } from 'vitest/config';`);
	lines.push('');
	lines.push('export default defineConfig({');
	lines.push('  test: {');
	lines.push("    include: ['tests/**/*.test.ts'],");
	// Force the JS (Nunjucks) render backend for factory/render tests.
	// The nodes.test.ts stubs use minimal `{ $type, $text }` placeholders
	// that satisfy the JS render templates but not the native transport
	// validator's recursive structure checks. The native-path integration
	// tests live in separate test files and are not affected.
	lines.push("    env: { SITTIR_BACKEND: 'js' },");
	lines.push('  },');
	lines.push('});');
	lines.push('');

	return lines.join('\n');
}
