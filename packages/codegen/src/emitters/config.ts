/**
 * Emits a `vitest.config.ts` for the generated package.
 */

export interface EmitConfigConfig {
  grammar: string;
}

export function emitConfig(config: EmitConfigConfig): string {
  const lines: string[] = [];

  lines.push(`import { defineConfig } from 'vitest/config';`);
  lines.push('');
  lines.push('export default defineConfig({');
  lines.push('  test: {');
  lines.push("    include: ['tests/**/*.test.ts'],");
  lines.push('  },');
  lines.push('});');
  lines.push('');

  return lines.join('\n');
}
