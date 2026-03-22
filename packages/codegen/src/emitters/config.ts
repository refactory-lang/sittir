/**
 * Emits a `vitest.config.ts` with the codemod:ast-grep mock alias.
 */

export interface EmitConfigConfig {
  grammar: string;
}

export function emitConfig(config: EmitConfigConfig): string {
  const { grammar } = config;

  const lines: string[] = [];

  lines.push(`import { defineConfig } from 'vitest/config';`);
  lines.push('');
  lines.push('export default defineConfig({');
  lines.push('  resolve: {');
  lines.push('    alias: {');
  lines.push(`      'codemod:ast-grep/${grammar}': new URL(`);
  lines.push(`        './src/__mocks__/ast-grep-${grammar}.ts',`);
  lines.push('        import.meta.url,');
  lines.push('      ).pathname,');
  lines.push('    },');
  lines.push('  },');
  lines.push('  test: {');
  lines.push("    include: ['tests/**/*.test.ts'],");
  lines.push('  },');
  lines.push('});');
  lines.push('');

  return lines.join('\n');
}
