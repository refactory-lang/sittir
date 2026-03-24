/**
 * Emits a complete TypeScript source string for a `types.ts` file
 * containing node types, config types, leaf types, supertype unions,
 * and a discriminated union for all IR node kinds in a given grammar.
 */

import type { SupertypeInfo } from '../grammar-reader.ts';
import { toTypeName, toGrammarTypeName } from '../naming.ts';

export interface EmitTypesConfig {
  grammar: string;       // e.g. 'rust'
  nodeKinds: string[];   // e.g. ['struct_item', 'function_item']
  leafKinds?: string[];  // e.g. ['identifier', 'string_literal']
  supertypes?: SupertypeInfo[];
}

export function emitTypes(config: EmitTypesConfig): string {
  const { grammar, nodeKinds, leafKinds = [], supertypes = [] } = config;
  const grammarTypeName = toGrammarTypeName(grammar); // e.g. RustTypes
  // Derive PascalCase grammar prefix by stripping 'Types' suffix
  const grammarPrefix = grammarTypeName.slice(0, -5); // e.g. Rust
  const grammarAlias = `${grammarPrefix}Grammar`; // e.g. RustGrammar

  const typeNames = nodeKinds.map(toTypeName);

  // Track all generated type names to avoid duplicates
  const generatedTypes = new Set<string>(typeNames);

  const lines: string[] = [];

  // 1. Import grammar type from generated grammar.ts
  lines.push(`import type { ${grammarAlias} } from './grammar.js';`);

  // 2. Import from @sittir/types
  lines.push(`import type { NodeType, ValidationResult } from '@sittir/types';`);

  lines.push('');

  // 3. Re-export grammar type for consumers
  lines.push(`export type { ${grammarAlias} };`);

  lines.push('');

  // 4. For each node kind: NodeType projection
  for (let i = 0; i < nodeKinds.length; i++) {
    const kind = nodeKinds[i];
    const typeName = typeNames[i];
    lines.push(`export type ${typeName} = NodeType<${grammarAlias}, '${kind}'>;`);
    lines.push('');
  }

  // 6. Leaf node types (minimal shape for type-safe builder fields)
  if (leafKinds.length > 0) {
    lines.push('// Leaf node types');
    for (const kind of leafKinds) {
      const typeName = toTypeName(kind);
      if (generatedTypes.has(typeName)) continue;
      generatedTypes.add(typeName);
      lines.push(`export type ${typeName} = { kind: '${kind}' };`);
    }
    lines.push('');
  }

  // 7. Supertype union aliases
  if (supertypes.length > 0) {
    lines.push('// Supertype unions');

    // First pass: register all supertype type names so cross-references
    // resolve regardless of processing order (e.g. Expression → PrimaryExpression)
    const supertypeEntries: Array<{ st: SupertypeInfo; typeName: string }> = [];
    for (const st of supertypes) {
      const cleanName = st.name.replace(/^_/, '');
      const typeName = toTypeName(cleanName);
      if (generatedTypes.has(typeName)) continue;
      generatedTypes.add(typeName);
      supertypeEntries.push({ st, typeName });
    }

    // Second pass: generate the union types
    for (const { st, typeName } of supertypeEntries) {
      const memberTypes = st.subtypes
        .map(sub => toTypeName(sub))
        .filter(t => generatedTypes.has(t));

      if (memberTypes.length > 0) {
        lines.push(`export type ${typeName} =`);
        for (const member of memberTypes) {
          lines.push(`  | ${member}`);
        }
        lines.push(';');
        lines.push('');
      }
    }
  }

  // 8. Discriminated union
  lines.push(`export type ${grammarPrefix}IrNode =`);
  for (const typeName of typeNames) {
    lines.push(`  | ${typeName}`);
  }
  lines.push(';');

  lines.push('');

  // 9. Re-export ValidationResult
  lines.push(`export type { ValidationResult };`);
  lines.push('');

  return lines.join('\n');
}
