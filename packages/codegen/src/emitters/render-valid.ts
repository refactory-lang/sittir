/**
 * Emits a `render-valid.ts` file that re-exports a `render` function
 * combining `renderSilent` with `assertValid`.
 */

import { toGrammarTypeName } from '../naming.ts';

export interface EmitRenderValidConfig {
  grammar: string;
}

export function emitRenderValid(config: EmitRenderValidConfig): string {
  const { grammar } = config;
  const grammarTypeName = toGrammarTypeName(grammar);
  const grammarPrefix = grammarTypeName.slice(0, -5);
  const unionType = `${grammarPrefix}IrNode`;

  const lines: string[] = [];

  lines.push(`import type { ${unionType} } from './types.js';`);
  lines.push(`import { renderSilent } from './render.js';`);
  lines.push(`import { assertValid } from './validate-fast.js';`);
  lines.push('');
  lines.push(`export function render(node: ${unionType}): string {`);
  lines.push('  return assertValid(renderSilent(node));');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}
