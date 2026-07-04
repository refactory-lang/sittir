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
	// Force the native (Rust napi) render backend. Production consumers run
	// `--backend native`; the JS dispatch engine is deprecated (see
	// CLAUDE.md). `SITTIR_BACKEND=native` also disables the silent
	// native->JS fallback (backend.ts computeBackend), so a missing/stale
	// native binary fails the suite loudly instead of quietly exercising
	// the deprecated engine.
	lines.push("    env: { SITTIR_BACKEND: 'native' },");
	lines.push('  },');
	lines.push('});');
	lines.push('');

	return lines.join('\n');
}
