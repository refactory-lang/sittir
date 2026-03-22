/**
 * Emits a complete TypeScript source string for a `types.ts` file
 * containing node types, config types, and a discriminated union
 * for all IR node kinds in a given grammar.
 */

import { toTypeName, toGrammarTypeName } from '../naming.ts';

export interface EmitTypesConfig {
  grammar: string;       // e.g. 'rust'
  nodeKinds: string[];   // e.g. ['struct_item', 'function_item']
}

export function emitTypes(config: EmitTypesConfig): string {
  const { grammar, nodeKinds } = config;
  const grammarTypeName = toGrammarTypeName(grammar); // e.g. RustTypes
  // Derive PascalCase grammar prefix by stripping 'Types' suffix
  const grammarPrefix = grammarTypeName.slice(0, -5); // e.g. Rust
  const grammarAlias = `${grammarPrefix}Grammar`; // e.g. RustGrammar

  const typeNames = nodeKinds.map(toTypeName);

  const lines: string[] = [];

  // 1. Import grammar type
  lines.push(`import type ${grammarTypeName} from '@codemod.com/jssg-types/langs/${grammar}';`);

  // 2. Import from @sittir/types
  lines.push(`import type { NodeType, BuilderConfig, ValidationResult } from '@sittir/types';`);

  lines.push('');

  // 3. Grammar type alias
  lines.push(`export type ${grammarAlias} = ${grammarTypeName};`);

  lines.push('');

  // 4 & 5. For each node kind: NodeType and BuilderConfig
  for (let i = 0; i < nodeKinds.length; i++) {
    const kind = nodeKinds[i];
    const typeName = typeNames[i];
    lines.push(`export type ${typeName} = NodeType<${grammarAlias}, '${kind}'>;`);
    lines.push(`export type ${typeName}Config = BuilderConfig<${grammarAlias}, ${typeName}>;`);
    lines.push('');
  }

  // 6. Discriminated union
  lines.push(`export type ${grammarPrefix}IrNode =`);
  for (const typeName of typeNames) {
    lines.push(`  | ${typeName}`);
  }
  lines.push(';');

  lines.push('');

  // 7. Re-export ValidationResult
  lines.push(`export type { ValidationResult };`);
  lines.push('');

  return lines.join('\n');
}
