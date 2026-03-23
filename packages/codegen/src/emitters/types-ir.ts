/**
 * Emits a complete TypeScript source string for a `types.ts` file
 * containing node types, config types, leaf types, supertype unions,
 * and a discriminated union for all IR node kinds in a given grammar.
 *
 * Uses the @sittir/typescript IR builder declarative from() API.
 * This is the IR-based replacement for the string-concatenation approach
 * in types.ts.
 */

import type { SupertypeInfo } from '../grammar-reader.ts';
import { toTypeName, toGrammarTypeName } from '../naming.ts';
import { ir } from '@sittir/typescript';
import { LeafBuilder } from '@sittir/types';

// ---------------------------------------------------------------------------
// Leaf helpers
// ---------------------------------------------------------------------------

const leaf = <K extends string>(kind: K, text: string) => new LeafBuilder(kind, text);
const str = (text: string) => leaf('string', `'${text}'`);

// ---------------------------------------------------------------------------
// AST construction helpers
// ---------------------------------------------------------------------------

/** `export type NAME = VALUE;` */
function exportTypeAlias(name: string, value: any) {
  return ir.exportStatement.from({
    declaration: ir.typeAliasDeclaration.from({
      name,
      value,
    }),
  });
}

/** `export type NAME = TYPE<ARG1, ARG2>;` */
function exportGenericTypeAlias(name: string, baseName: string, ...args: any[]) {
  return ir.exportStatement.from({
    declaration: ir.typeAliasDeclaration.from({
      name,
      value: ir.genericType.from({
        name: baseName,
        typeArguments: { children: args as any },
      }),
    }),
  });
}

/** `export type NAME = { kind: 'value' };` */
function exportObjectType(name: string, kindValue: string) {
  return ir.exportStatement.from({
    declaration: ir.typeAliasDeclaration.from({
      name,
      value: ir.objectType.from({
        children: ir.propertySignature.from({
          name: ir.propertyIdentifier('kind'),
          type: { children: ir.literalType.from({ children: str(kindValue) }) },
        }),
      }) as any,
    }),
  });
}

/** `export type NAME = | MemberA | MemberB | ...;` */
function exportUnionType(name: string, members: string[]) {
  return ir.exportStatement.from({
    declaration: ir.typeAliasDeclaration.from({
      name,
      value: ir.unionType.from({
        children: members.map(m => ir.typeIdentifier(m)) as any,
      }),
    }),
  });
}

// ---------------------------------------------------------------------------
// Public API — same interface as types.ts
// ---------------------------------------------------------------------------

export type { EmitTypesConfig } from './types.ts';
import type { EmitTypesConfig } from './types.ts';

export function emitTypesIr(config: EmitTypesConfig): string {
  const { grammar, nodeKinds, leafKinds = [], supertypes = [] } = config;
  const grammarTypeName = toGrammarTypeName(grammar);
  const grammarPrefix = grammarTypeName.slice(0, -5);
  const grammarAlias = `${grammarPrefix}Grammar`;

  const typeNames = nodeKinds.map(toTypeName);
  const generatedTypes = new Set<string>(typeNames);

  const statements: string[] = [];

  // 1. import type { RustGrammar } from './grammar.js';
  // import type { NodeType, BuilderConfig, ValidationResult } from '@sittir/types';
  // These use 'import type' which isn't directly representable in the CST IR,
  // so we use LeafBuilder for the full import lines.
  statements.push(leaf('import_statement', `import type { ${grammarAlias} } from './grammar.js'`).renderImpl() + ';');
  statements.push(leaf('import_statement', `import type { NodeType, BuilderConfig, ValidationResult } from '@sittir/types'`).renderImpl() + ';');
  statements.push('');

  // 3. export type { RustGrammar };
  statements.push(leaf('export_statement', `export type { ${grammarAlias} }`).renderImpl() + ';');
  statements.push('');

  // 4 & 5. For each node kind: NodeType and BuilderConfig
  for (let i = 0; i < nodeKinds.length; i++) {
    const kind = nodeKinds[i]!;
    const typeName = typeNames[i]!;

    // export type StructItem = NodeType<RustGrammar, 'struct_item'>;
    statements.push(
      exportGenericTypeAlias(typeName, 'NodeType', ir.typeIdentifier(grammarAlias), str(kind)).renderImpl() + ';',
    );

    // export type StructItemConfig = BuilderConfig<RustGrammar, StructItem>;
    statements.push(
      exportGenericTypeAlias(`${typeName}Config`, 'BuilderConfig', ir.typeIdentifier(grammarAlias), ir.typeIdentifier(typeName)).renderImpl() + ';',
    );

    statements.push('');
  }

  // 6. Leaf node types
  if (leafKinds.length > 0) {
    statements.push('// Leaf node types');
    for (const kind of leafKinds) {
      const typeName = toTypeName(kind);
      if (generatedTypes.has(typeName)) continue;
      generatedTypes.add(typeName);

      // export type Identifier = { kind: 'identifier' };
      statements.push(exportObjectType(typeName, kind).renderImpl() + ';');
    }
    statements.push('');
  }

  // 7. Supertype union aliases
  if (supertypes.length > 0) {
    statements.push('// Supertype unions');

    // First pass: register all supertype type names
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
        statements.push(exportUnionType(typeName, memberTypes).renderImpl() + ';');
        statements.push('');
      }
    }
  }

  // 8. Discriminated union
  statements.push(exportUnionType(`${grammarPrefix}IrNode`, typeNames).renderImpl() + ';');
  statements.push('');

  // 9. Re-export ValidationResult
  statements.push(leaf('export_statement', 'export type { ValidationResult }').renderImpl() + ';');
  statements.push('');

  return statements.join('\n');
}
