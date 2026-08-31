export interface EmitConfigConfig {
	grammar: string;
}

export function emitConfig(_config: EmitConfigConfig): string {
	const lines: string[] = [];

	lines.push(`import { fileURLToPath } from 'node:url';`);
	lines.push(`import { defineConfig } from 'vitest/config';`);
	lines.push('');
	lines.push('const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));');
	lines.push('');
	lines.push('export default defineConfig({');
	lines.push('  resolve: {');
	lines.push('    alias: {');
	lines.push("      '@sittir/common/engine': src('../common/src/engine-boundary.ts'),");
	lines.push("      '@sittir/common/utils': src('../common/src/utils.ts'),");
	lines.push("      '@sittir/common': src('../common/src/index.ts'),");
	lines.push("      '@sittir/types': src('../types/src/index.ts'),");
	lines.push("      '@sittir/legacy-core/engine': src('../legacy-core/src/engine-boundary.ts'),");
	lines.push("      '@sittir/python/utils': src('../python/src/utils.ts'),");
	lines.push("      '@sittir/python': src('../python/src/index.ts'),");
	lines.push("      '@sittir/rust/utils': src('../rust/src/utils.ts'),");
	lines.push("      '@sittir/rust': src('../rust/src/index.ts'),");
	lines.push("      '@sittir/typescript/utils': src('../typescript/src/utils.ts'),");
	lines.push("      '@sittir/typescript/tsx': src('../typescript/src/tsx/index.ts'),");
	lines.push("      '@sittir/typescript': src('../typescript/src/index.ts'),");
	lines.push('    },');
	lines.push('  },');
	lines.push('  test: {');
	lines.push("    include: ['tests/**/*.test.ts'],");
	lines.push("    env: { SITTIR_BACKEND: 'native' },");
	lines.push('  },');
	lines.push('});');
	lines.push('');

	return lines.join('\n');
}
