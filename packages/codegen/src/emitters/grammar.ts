/**
 * Emits a `grammar.ts` file containing a TypeScript type literal
 * derived from tree-sitter's node-types.json.
 */

import { createRequire } from 'node:module';
import { toGrammarTypeName } from '../naming.ts';

const require = createRequire(import.meta.url);

export interface EmitGrammarConfig {
  grammar: string;
}

interface RawNodeEntry {
  type: string;
  named: boolean;
  fields?: Record<string, unknown>;
  children?: unknown;
  subtypes?: unknown[];
}

export function emitGrammar(config: EmitGrammarConfig): string {
  const { grammar } = config;
  const grammarTypeName = toGrammarTypeName(grammar);
  const grammarPrefix = grammarTypeName.slice(0, -5);
  const grammarAlias = `${grammarPrefix}Grammar`;

  const nodeTypesPath = require.resolve(
    `tree-sitter-${grammar}/src/node-types.json`,
  );
  const entries: RawNodeEntry[] = require(nodeTypesPath);

  const lines: string[] = [];

  lines.push('// Auto-generated grammar type from tree-sitter-' + grammar + '/src/node-types.json');
  lines.push('// Structurally compatible with @codemod.com/jssg-types ' + grammarTypeName);
  lines.push('');
  lines.push(`export type ${grammarAlias} = {`);

  // Deduplicate: some types appear twice (named + unnamed).
  // Use "type:named" as the key to avoid duplicate property names.
  const seen = new Set<string>();
  for (const entry of entries) {
    const key = entry.named ? entry.type : `_anonymous_${entry.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const json = JSON.stringify(entry);
    lines.push(`  readonly ${JSON.stringify(key)}: ${json};`);
  }

  lines.push('};');
  lines.push('');

  return lines.join('\n');
}
