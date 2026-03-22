/**
 * Emits a complete TypeScript source string for a single builder file
 * containing a factory function, a fluent Builder class, and a short-name export.
 */

import type { NodeMeta, FieldMeta } from '../grammar-reader.ts';
import {
  toFactoryName,
  toTypeName,
  toBuilderClassName,
  toShortName,
  toFieldName,
  toParamName,
} from '../naming.ts';

export interface EmitBuilderConfig {
  grammar: string;
  node: NodeMeta;
}

/**
 * Select the "primary" field to use as the constructor parameter.
 * Priority: required field named 'name' > required field named 'argument' > first required field.
 * If no fields but required children, use 'children'.
 * Returns null if nothing qualifies.
 */
function selectConstructorField(node: NodeMeta): { name: string; source: 'field' | 'children' } | null {
  const requiredFields = node.fields.filter((f) => f.required);

  // Look for 'name' first
  const nameField = requiredFields.find((f) => f.name === 'name');
  if (nameField) return { name: nameField.name, source: 'field' };

  // Look for 'argument'
  const argField = requiredFields.find((f) => f.name === 'argument');
  if (argField) return { name: argField.name, source: 'field' };

  // First required field
  if (requiredFields.length > 0) {
    return { name: requiredFields[0].name, source: 'field' };
  }

  // No fields but required children
  if (node.hasChildren && node.children?.required) {
    return { name: 'children', source: 'children' };
  }

  return null;
}

/**
 * Determine the TypeScript type for a field's setter parameter.
 * All setter parameters use `string` — grammar-types BuilderConfig handles the loosening.
 */
function fieldTsType(field: FieldMeta): string {
  const base = 'string';
  return field.multiple ? `${base}[]` : base;
}

export function emitBuilder(config: EmitBuilderConfig): string {
  const { grammar, node } = config;
  const kind = node.kind;

  const factoryName = toFactoryName(kind);         // e.g. structItem
  const typeName = toTypeName(kind);               // e.g. StructItem
  const configTypeName = `${typeName}Config`;      // e.g. StructItemConfig
  const builderClassName = toBuilderClassName(kind); // e.g. StructBuilder
  const shortName = toShortName(kind);             // e.g. struct_

  const constructorParam = selectConstructorField(node);

  // Determine which fields are setters (not the constructor param)
  const setterFields = node.fields.filter((f) => {
    if (constructorParam && constructorParam.source === 'field') {
      return f.name !== constructorParam.name;
    }
    return true;
  });

  const lines: string[] = [];

  // --- Imports ---
  lines.push(`import type { BuilderTerminal } from '@sittir/types';`);
  lines.push(`import type { ${typeName}, ${configTypeName} } from '../types.js';`);
  lines.push(`import { renderSilent } from '../render.js';`);
  lines.push(`import { assertValid } from '../validate-fast.js';`);
  lines.push('');

  // --- Factory function ---
  // When factory name collides with short name, use an internal name and don't export
  const hasNameCollision = factoryName === shortName;
  const internalFactoryName = hasNameCollision ? `create${typeName}` : factoryName;
  const factoryExport = hasNameCollision ? '' : 'export ';
  lines.push(`${factoryExport}function ${internalFactoryName}(config: ${configTypeName}): ${typeName} {`);
  lines.push(`  return {`);
  lines.push(`    kind: '${kind}',`);
  lines.push(`    ...config,`);
  lines.push(`  } as ${typeName};`);
  lines.push(`}`);
  lines.push('');

  // --- Builder class ---
  lines.push(`class ${builderClassName} implements BuilderTerminal<${typeName}> {`);

  // Private fields
  for (const field of node.fields) {
    const tsType = fieldTsType(field);
    const fieldName = toFieldName(field.name);
    if (field.multiple) {
      lines.push(`  private _${fieldName}: ${tsType} = [];`);
    } else if (field.required) {
      lines.push(`  private _${fieldName}: ${tsType} = '';`);
    } else {
      lines.push(`  private _${fieldName}?: ${tsType};`);
    }
  }

  // Children field if applicable
  if (node.hasChildren) {
    if (node.children?.multiple) {
      lines.push(`  private _children: string[] = [];`);
    } else {
      if (constructorParam?.source === 'children') {
        lines.push(`  private _children: string;`);
      } else {
        lines.push(`  private _children?: string;`);
      }
    }
  }

  lines.push('');

  // Constructor
  if (constructorParam) {
    const ctorFieldName = constructorParam.source === 'children'
      ? 'children'
      : toFieldName(constructorParam.name);
    const ctorParamName = constructorParam.source === 'children'
      ? 'children'
      : toParamName(constructorParam.name);
    // Determine the constructor parameter type
    let ctorParamType = 'string';
    if (constructorParam.source === 'children' && node.children?.multiple) {
      ctorParamType = 'string[]';
    } else if (constructorParam.source === 'field') {
      const ctorField = node.fields.find((f) => f.name === constructorParam.name);
      if (ctorField?.multiple) ctorParamType = 'string[]';
    }
    lines.push(`  constructor(${ctorParamName}: ${ctorParamType}) {`);
    lines.push(`    this._${ctorFieldName} = ${ctorParamName};`);
    lines.push(`  }`);
  } else {
    lines.push(`  constructor() {}`);
  }

  lines.push('');

  // Fluent setters for non-constructor fields
  for (const field of setterFields) {
    const fieldName = toFieldName(field.name);
    const tsType = fieldTsType(field);
    lines.push(`  ${fieldName}(value: ${tsType}): this {`);
    lines.push(`    this._${fieldName} = value;`);
    lines.push(`    return this;`);
    lines.push(`  }`);
    lines.push('');
  }

  // Children setter if applicable and not constructor param
  if (node.hasChildren && constructorParam?.source !== 'children') {
    if (node.children?.multiple) {
      lines.push(`  children(value: string[]): this {`);
    } else {
      lines.push(`  children(value: string): this {`);
    }
    lines.push(`    this._children = value;`);
    lines.push(`    return this;`);
    lines.push(`  }`);
    lines.push('');
  }

  // build()
  lines.push(`  build(): ${typeName} {`);
  lines.push(`    return ${internalFactoryName}({`);
  for (const field of node.fields) {
    const fieldName = toFieldName(field.name);
    lines.push(`      ${fieldName}: this._${fieldName},`);
  }
  if (node.hasChildren) {
    lines.push(`      children: this._children,`);
  }
  lines.push(`    } as ${configTypeName});`);
  lines.push(`  }`);
  lines.push('');

  // render()
  lines.push(`  render(): string {`);
  lines.push(`    return assertValid(renderSilent(this.build()));`);
  lines.push(`  }`);
  lines.push('');

  // renderSilent()
  lines.push(`  renderSilent(): string {`);
  lines.push(`    return renderSilent(this.build());`);
  lines.push(`  }`);

  lines.push(`}`);
  lines.push('');

  // --- Short-name export ---
  if (constructorParam) {
    const shortParamName = constructorParam.source === 'children'
      ? 'children'
      : toParamName(constructorParam.name);
    // Match the constructor parameter type
    let shortParamType = 'string';
    if (constructorParam.source === 'children' && node.children?.multiple) {
      shortParamType = 'string[]';
    } else if (constructorParam.source === 'field') {
      const ctorField = node.fields.find((f) => f.name === constructorParam.name);
      if (ctorField?.multiple) shortParamType = 'string[]';
    }
    lines.push(`export function ${shortName}(${shortParamName}: ${shortParamType}): ${builderClassName} {`);
    lines.push(`  return new ${builderClassName}(${shortParamName});`);
    lines.push(`}`);
  } else {
    lines.push(`export function ${shortName}(): ${builderClassName} {`);
    lines.push(`  return new ${builderClassName}();`);
    lines.push(`}`);
  }

  lines.push('');

  return lines.join('\n');
}
