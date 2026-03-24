/**
 * Emits a fluent namespace module (builder.ts) that maps short names to builder
 * constructors, plus leaf builders for all terminal node kinds, numeric overloads,
 * and semantic operator aliases.
 *
 * Uses the @sittir/typescript IR builder declarative from() API.
 * This is the IR-based replacement for the string-concatenation approach
 * in fluent.ts.
 */

import type { NodeMeta, SupertypeInfo } from '../grammar-reader.ts';
import { toShortName, toIrKey, toGrammarTypeName, toFactoryName, toFieldName, toTypeName, toBuilderClassName, resolveFileNames } from '../naming.ts';
import { selectConstructorField } from './builder.ts';
import { ir } from '@sittir/typescript';
import { Builder, LeafBuilder } from '@sittir/types';

// ---------------------------------------------------------------------------
// Re-export config and constants from the string-based emitter
// ---------------------------------------------------------------------------

export type { EmitFluentConfig, OperatorContext } from './fluent.ts';
import type { EmitFluentConfig } from './fluent.ts';

/** Leaf kinds that should accept number | string. */
const NUMERIC_LEAF_KINDS = new Set([
  'integer_literal',
  'float_literal',
]);

/** Map operator token → semantic name for binary_expression operators. */
const BINARY_OP_NAMES: Record<string, string> = {
  '+': 'add', '-': 'sub', '*': 'mul', '/': 'div', '%': 'mod',
  '==': 'eq', '!=': 'neq', '<': 'lt', '>': 'gt', '<=': 'lte', '>=': 'gte',
  '&&': 'and', '||': 'or',
  '&': 'bitAnd', '|': 'bitOr', '^': 'bitXor', '<<': 'shl', '>>': 'shr',
};

/** Map operator token → semantic name for compound_assignment_expr operators. */
const COMPOUND_OP_NAMES: Record<string, string> = {
  '+=': 'addAssign', '-=': 'subAssign', '*=': 'mulAssign', '/=': 'divAssign',
  '%=': 'modAssign', '&=': 'bitAndAssign', '|=': 'bitOrAssign', '^=': 'bitXorAssign',
  '<<=': 'shlAssign', '>>=': 'shrAssign',
};

// ---------------------------------------------------------------------------
// Leaf helpers
// ---------------------------------------------------------------------------

const leaf = LeafBuilder.of;
const str = (text: string) => LeafBuilder.of('string', `'${text}'`);
const ident = (text: string) => ir.identifier(text);

// ---------------------------------------------------------------------------
// AST construction helpers
// ---------------------------------------------------------------------------

/** `import { X } from 'Y';` or `import { X as Z } from 'Y';` */
function importNamed(bindings: Array<{ name: string; alias?: string }>, from: string): Builder {
  return ir.importStatement.from({
    children: ir.importClause.from({
      children: ir.namedImports.from({
        children: bindings.map(b =>
          b.alias
            ? ir.importSpecifier.from({ name: b.name, alias: b.alias })
            : ir.importSpecifier.from({ name: b.name }),
        ),
      }),
    }),
    source: str(from),
  });
}

/** `import type { X, Y } from 'Z';` — uses leaf (type-only import not in CST IR) */
function importTypeNamed(names: string[], from: string): LeafBuilder {
  return leaf('import_statement', `import type { ${names.join(', ')} } from '${from}'`);
}

/** `export const ir = { ... } as const;` */
function exportConstAsConst(name: string, objectEntries: Builder[]): Builder {
  return ir.exportStatement.from({
    declaration: ir.lexicalDeclaration.from({
      kind: leaf('const', 'const'),
      children: ir.variableDeclarator.from({
        name,
        value: ir.asExpression.from({
          children: [
            ir.object.from({ children: objectEntries }),
            leaf('type_identifier', 'const'),
          ],
        }),
      }),
    }),
  });
}

/** Object property: `key: value,` */
function prop(key: string, value: Builder): Builder {
  return ir.pair.from({
    key: ir.propertyIdentifier(key),
    value,
  });
}

/** Shorthand property: `key,` (key === value) */
function shorthand(key: string): Builder {
  return leaf('shorthand_property_identifier', key);
}

/** Arrow function: `(text: string) => new LeafBuilder('kind', text)` */
function leafFactory(kind: string, paramName: string, paramType: string, bodyExpr: string): Builder {
  return leaf('arrow_function', `(${paramName}: ${paramType}) => new LeafBuilder('${kind}', ${bodyExpr})`);
}

/** Nested object: `{ key: value, ... }` */
function nestedObject(entries: Builder[]): Builder {
  return ir.object.from({ children: entries });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function emitFluentIr(config: EmitFluentConfig): string {
  const { grammar, nodeKinds, leafKinds, operatorContexts } = config;
  const grammarTypeName = toGrammarTypeName(grammar);
  const grammarPrefix = grammarTypeName.slice(0, -5);

  const fileNames = resolveFileNames(nodeKinds);

  // Detect duplicate irKey collisions and fall back to full factory name
  const irKeyCounts = new Map<string, number>();
  for (const kind of nodeKinds) {
    const key = toIrKey(kind);
    irKeyCounts.set(key, (irKeyCounts.get(key) ?? 0) + 1);
  }

  const importStatements: Builder[] = [];
  const objectEntries: Builder[] = [];
  const usedPropertyKeys = new Set<string>();

  // --- Imports + branch node entries ---
  for (const kind of nodeKinds) {
    const shortName = toShortName(kind);
    const fileName = fileNames.get(kind)!;
    const factoryName = toFactoryName(kind);

    const irKey = toIrKey(kind);
    const isDuplicate = (irKeyCounts.get(irKey) ?? 0) > 1;
    const propertyKey = isDuplicate ? factoryName : irKey;
    const importBinding = isDuplicate ? factoryName : shortName;

    if (importBinding !== shortName) {
      importStatements.push(importNamed([{ name: shortName, alias: importBinding }], `./nodes/${fileName}.js`));
    } else {
      importStatements.push(importNamed([{ name: shortName }], `./nodes/${fileName}.js`));
    }

    if (usedPropertyKeys.has(propertyKey)) continue;
    usedPropertyKeys.add(propertyKey);

    if (propertyKey !== importBinding) {
      objectEntries.push(prop(propertyKey, ident(importBinding)));
    } else {
      objectEntries.push(shorthand(importBinding));
    }
  }

  // --- Leaf node builder entries ---
  const leafEntries: Builder[] = [];
  for (const kind of leafKinds) {
    let propName = toIrKey(kind);
    if (usedPropertyKeys.has(propName)) {
      propName = toFactoryName(kind);
      if (usedPropertyKeys.has(propName)) continue;
    }
    usedPropertyKeys.add(propName);

    if (NUMERIC_LEAF_KINDS.has(kind)) {
      leafEntries.push(prop(propName, leafFactory(kind, 'value', 'number | string', 'String(value)')));
    } else {
      leafEntries.push(prop(propName, leafFactory(kind, 'text', 'string', 'text')));
    }
  }

  // --- Operator alias entries ---
  const opEntries: Builder[] = [];
  if (operatorContexts) {
    for (const ctx of operatorContexts) {
      const nameMap = ctx.parentKind === 'binary_expression'
        ? BINARY_OP_NAMES
        : ctx.parentKind === 'compound_assignment_expr'
          ? COMPOUND_OP_NAMES
          : null;

      if (!nameMap) continue;

      for (const token of ctx.tokens) {
        const semanticName = nameMap[token];
        if (!semanticName) continue;
        if (usedPropertyKeys.has(semanticName)) continue;
        usedPropertyKeys.add(semanticName);

        const escapedToken = token.replace(/'/g, "\\'");
        opEntries.push(prop(semanticName,
          leaf('arrow_function', `() => new LeafBuilder('${ctx.parentKind}_operator', '${escapedToken}')`)));
      }
    }
  }

  // --- Supertype namespace entries ---
  const nsEntries: Builder[] = [];
  if (config.supertypes && config.supertypes.length > 0) {
    const kindToBinding = new Map<string, string>();
    const kindToIrKeyMap = new Map<string, string>();
    for (const kind of nodeKinds) {
      const shortName = toShortName(kind);
      const irKey = toIrKey(kind);
      const isDuplicate = (irKeyCounts.get(irKey) ?? 0) > 1;
      kindToBinding.set(kind, isDuplicate ? toFactoryName(kind) : shortName);
      kindToIrKeyMap.set(kind, isDuplicate ? toFactoryName(kind) : irKey);
    }

    for (const st of config.supertypes) {
      const nsName = toFieldName(st.name.replace(/^_/, ''));
      const nsSuffix = nsName.charAt(0).toUpperCase() + nsName.slice(1);
      const innerEntries: Builder[] = [];
      const usedNsKeys = new Set<string>();

      for (const subtype of st.subtypes) {
        const binding = kindToBinding.get(subtype);
        if (!binding) continue;
        const irKey = kindToIrKeyMap.get(subtype);
        if (!irKey) continue;

        let nsKey = irKey;
        if (nsKey.endsWith(nsSuffix) && nsKey.length > nsSuffix.length) {
          nsKey = nsKey.slice(0, -nsSuffix.length);
        }
        if (usedNsKeys.has(nsKey)) nsKey = irKey;
        usedNsKeys.add(nsKey);

        innerEntries.push(prop(nsKey, ident(binding)));
      }

      if (innerEntries.length > 0 && !usedPropertyKeys.has(nsName)) {
        nsEntries.push(prop(nsName, nestedObject(innerEntries)));
      }
    }
  }

  // --- Combine all object entries ---
  const allObjectEntries = [
    ...objectEntries,
    // Comment separator for leaf builders
    ...leafEntries,
    ...opEntries,
    ...nsEntries,
  ];

  // --- Build statements ---
  const statements: string[] = [
    '// Auto-generated by ir-codegen — do not edit',
    '',
    importNamed([{ name: 'LeafBuilder' }], '@sittir/types').renderImpl() + ';',
    ...importStatements.map(s => s.renderImpl() + ';'),
    '',
  ];

  // The `ir` const declaration is too deeply nested for the IR builders to
  // handle the `as const` assertion cleanly. We build the object entries with
  // IR for the property pairs, then wrap them manually.
  statements.push('export const ir = {');
  for (const entry of objectEntries) {
    statements.push(`  ${entry.renderImpl()},`);
  }
  if (leafEntries.length > 0) {
    statements.push('');
    statements.push('  // Leaf node builders');
    for (const entry of leafEntries) {
      statements.push(`  ${entry.renderImpl()},`);
    }
  }
  if (opEntries.length > 0) {
    statements.push('');
    statements.push('  // Semantic operator aliases');
    for (const entry of opEntries) {
      statements.push(`  ${entry.renderImpl()},`);
    }
  }
  if (nsEntries.length > 0) {
    statements.push('');
    statements.push('  // Namespaced access via supertypes');
    for (const entry of nsEntries) {
      statements.push(`  ${entry.renderImpl()},`);
    }
  }
  statements.push('} as const;');
  statements.push('');
  statements.push(`export type ${grammarPrefix}Ir = typeof ir;`);
  statements.push('');

  // --- BuilderMap + OptionsMap type lookups ---
  // Group type imports by file, tracking globally seen type names to avoid duplicates
  const typeImportsByFile = new Map<string, Set<string>>();
  const seenTypeNames = new Set<string>();
  for (const kind of nodeKinds) {
    const fileName = fileNames.get(kind)!;
    const types = typeImportsByFile.get(fileName) ?? new Set<string>();
    const builderName = toBuilderClassName(kind);
    const optionsName = `${toTypeName(kind)}Options`;
    if (!seenTypeNames.has(builderName)) { types.add(builderName); seenTypeNames.add(builderName); }
    if (!seenTypeNames.has(optionsName)) { types.add(optionsName); seenTypeNames.add(optionsName); }
    typeImportsByFile.set(fileName, types);
  }
  for (const [fileName, types] of typeImportsByFile) {
    if (types.size === 0) continue;
    statements.push(`import type { ${[...types].sort().join(', ')} } from './nodes/${fileName}.js';`);
  }
  statements.push('');

  statements.push('export interface BuilderMap {');
  for (const kind of nodeKinds) {
    statements.push(`  '${kind}': ${toBuilderClassName(kind)};`);
  }
  statements.push('}');
  statements.push('');

  statements.push('export interface OptionsMap {');
  for (const kind of nodeKinds) {
    statements.push(`  '${kind}': ${toTypeName(kind)}Options;`);
  }
  statements.push('}');
  statements.push('');

  statements.push('export type BuilderFor<K extends keyof BuilderMap> = BuilderMap[K];');
  statements.push('export type OptionsFor<K extends keyof OptionsMap> = OptionsMap[K];');
  statements.push('');

  // --- CSTFieldMap + CSTNode + fromCST() + edit() ---
  // These are highly dynamic generated code with switch statements,
  // type assertions, and complex expressions. Use leaf builders.
  if (config.nodes && config.nodes.length > 0) {
    const grammarName = `${grammarPrefix}Grammar`;

    statements.push(importTypeNamed(['Builder', 'Edit', 'FieldKinds', 'FieldName', 'NodeTransform', 'NodeType'], '@sittir/types').renderImpl() + ';');
    statements.push(importTypeNamed([grammarName], './types.js').renderImpl() + ';');
    statements.push('');

    // CSTNode interface
    statements.push('/** Tree-sitter CST node interface, parameterized by grammar node kind. */');
    statements.push(`export interface CSTNode<K extends keyof ${grammarName} = keyof ${grammarName}> {`);
    statements.push('  type: K;');
    statements.push('  text: string;');
    statements.push('  isNamed: boolean;');
    statements.push('  startIndex: number;');
    statements.push('  endIndex: number;');
    statements.push(`  namedChildren: CSTNode<keyof ${grammarName}>[];`);
    statements.push(`  childForFieldName<F extends FieldName<${grammarName}, K & string>>(name: F): CSTNode<FieldKinds<${grammarName}, K & string, F> & keyof ${grammarName}> | null;`);
    statements.push(`  childForFieldName(name: string): CSTNode<keyof ${grammarName}> | null;`);
    statements.push(`  childrenForFieldName<F extends FieldName<${grammarName}, K & string>>(name: F): CSTNode<FieldKinds<${grammarName}, K & string, F> & keyof ${grammarName}>[];`);
    statements.push(`  childrenForFieldName(name: string): CSTNode<keyof ${grammarName}>[];`);
    statements.push('}');
    statements.push('');

    // fromCST function
    statements.push('/**');
    statements.push(' * Hydrate a tree-sitter CST node into a builder tree.');
    statements.push(' * Walks the CST recursively — no parsing needed.');
    statements.push(' */');
    statements.push(`export function fromCST<K extends keyof ${grammarName}>(node: CSTNode<K>): Builder<NodeType<${grammarName}, K>> {`);
    statements.push('  const builder = resolveBuilder(node);');
    statements.push(`  if (!builder) return new LeafBuilder(node.type, node.text) as any;`);
    statements.push(`  return builder as any;`);
    statements.push('}');
    statements.push('');

    // resolveBuilder switch
    statements.push(`function resolveBuilder(node: CSTNode): Builder | null {`);
    statements.push('  switch (node.type) {');

    for (const nodeMeta of config.nodes) {
      const nodeIrKey = toIrKey(nodeMeta.kind);
      const isDuplicate = (irKeyCounts.get(nodeIrKey) ?? 0) > 1;
      const resolvedKey = isDuplicate ? toFactoryName(nodeMeta.kind) : nodeIrKey;

      statements.push(`    case '${nodeMeta.kind}': {`);
      statements.push(`      const n = node as CSTNode<'${nodeMeta.kind}'>;`);

      const ctorResult = selectConstructorField(nodeMeta, config.grammar);
      const ctorField = ctorResult?.source === 'field'
        ? nodeMeta.fields.find(f => f.name === ctorResult.name)
        : undefined;
      const ctorIsChildren = ctorResult?.source === 'children';

      if (ctorField) {
        if (ctorField.multiple) {
          statements.push(`      const ctorChildren = n.childrenForFieldName('${ctorField.name}');`);
          statements.push(`      const b = ir.${resolvedKey}(...ctorChildren.map(c => fromCST(c) as any));`);
        } else {
          statements.push(`      const ctorChild = n.childForFieldName('${ctorField.name}');`);
          statements.push(`      const b = ir.${resolvedKey}(ctorChild ? fromCST(ctorChild) as any : new LeafBuilder('${ctorField.name}', '') as any);`);
        }
      } else if (ctorIsChildren) {
        if (nodeMeta.children?.multiple) {
          statements.push(`      const b = ir.${resolvedKey}(...n.namedChildren.map(c => fromCST(c) as any));`);
        } else {
          statements.push('      const firstChild = n.namedChildren[0];');
          statements.push(`      const b = ir.${resolvedKey}(firstChild ? fromCST(firstChild) as any : new LeafBuilder('unknown', '') as any);`);
        }
      } else {
        statements.push(`      const b = ir.${resolvedKey}();`);
      }

      const nonCtorFields = nodeMeta.fields.filter((f) => f !== ctorField);
      for (const field of nonCtorFields) {
        const fieldName = toFieldName(field.name);
        if (field.multiple) {
          statements.push(`      const ${fieldName}Children = n.childrenForFieldName('${field.name}');`);
          statements.push(`      if (${fieldName}Children.length > 0) b.${fieldName}(...${fieldName}Children.map(c => fromCST(c) as any));`);
        } else {
          statements.push(`      const ${fieldName}Child = n.childForFieldName('${field.name}');`);
          statements.push(`      if (${fieldName}Child) b.${fieldName}(fromCST(${fieldName}Child) as any);`);
        }
      }

      if (nodeMeta.hasChildren && !ctorIsChildren) {
        if (!ctorField || ctorField.name !== 'children') {
          statements.push('      const remainingChildren = n.namedChildren.filter(c => {');
          const fieldNames = nodeMeta.fields.map(f => `'${f.name}'`);
          if (fieldNames.length > 0) {
            statements.push(`        const fieldNames = [${fieldNames.join(', ')}];`);
            statements.push('        return !fieldNames.some(fn => n.childForFieldName(fn) === c);');
          } else {
            statements.push('        return true;');
          }
          statements.push('      });');
          statements.push('      if (remainingChildren.length > 0) b.children(...remainingChildren.map(c => fromCST(c) as any));');
        }
      }

      statements.push('      return b;');
      statements.push('    }');
    }

    statements.push("    default: return null;");
    statements.push('  }');
    statements.push('}');
    statements.push('');

    // edit function
    statements.push('/**');
    statements.push(' * Create a codemod-compatible Edit from a tree-sitter node.');
    statements.push(' * Hydrates the node into a builder, passes it to the transform,');
    statements.push(' * then renders the result and wraps it with byte positions.');
    statements.push(' */');
    statements.push(`export function edit<K extends keyof ${grammarName}>(`);
    statements.push(`  node: CSTNode<K>,`);
    statements.push(`  transform: NodeTransform<NodeType<${grammarName}, K>>,`);
    statements.push('): Edit {');
    statements.push('  const builder = fromCST(node);');
    statements.push('  const result = transform(builder);');
    statements.push('  return {');
    statements.push('    startPos: node.startIndex,');
    statements.push('    endPos: node.endIndex,');
    statements.push('    insertedText: result.renderImpl(),');
    statements.push('  };');
    statements.push('}');
    statements.push('');
  }

  return statements.join('\n');
}
