/**
 * Emits a self-contained builder file for a single node kind.
 *
 * Each builder extends BaseBuilder and owns its render logic —
 * no central switch statement needed.
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

// ---------------------------------------------------------------------------
// Constructor param selection (unchanged from previous version)
// ---------------------------------------------------------------------------

function selectConstructorField(node: NodeMeta): { name: string; source: 'field' | 'children' } | null {
  const requiredFields = node.fields.filter((f) => f.required);
  const nameField = requiredFields.find((f) => f.name === 'name');
  if (nameField) return { name: nameField.name, source: 'field' };
  const argField = requiredFields.find((f) => f.name === 'argument');
  if (argField) return { name: argField.name, source: 'field' };
  if (requiredFields.length > 0) {
    return { name: requiredFields[0]!.name, source: 'field' };
  }
  if (node.hasChildren && node.children?.required) {
    return { name: 'children', source: 'children' };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Render heuristics (absorbed from render-scaffold.ts)
// ---------------------------------------------------------------------------

const RENDER_SUFFIXES = [
  '_item', '_expression', '_statement', '_declaration',
  '_definition', '_type', '_pattern', '_literal', '_clause',
];

function kindToKeyword(kind: string): string | null {
  for (const suffix of RENDER_SUFFIXES) {
    if (kind.endsWith(suffix)) {
      return kind.slice(0, -suffix.length).replace(/_/g, ' ').trim();
    }
  }
  return null;
}

const FIELD_PRIORITY: Record<string, number> = {
  macro: 0, left: 1, operator: 2, name: 3, type: 4, trait: 5,
  type_parameters: 6, parameters: 7, return_type: 8, argument: 9,
  pattern: 10, value: 11, condition: 12, consequence: 13,
  alternative: 14, right: 15, body: 100,
};

function orderFields(fields: FieldMeta[]): FieldMeta[] {
  return [...fields].sort((a, b) => {
    const pa = FIELD_PRIORITY[a.name] ?? 50;
    const pb = FIELD_PRIORITY[b.name] ?? 50;
    return pa - pb;
  });
}

/**
 * Generate the body lines for a builder's renderImpl() method.
 * Each line uses `this._fieldName` and `this.renderChild(...)`.
 */
function generateRenderSilentBody(node: NodeMeta): string[] {
  const lines: string[] = [];
  const fieldSet = new Set(node.fields.map((f) => f.name));
  const keyword = kindToKeyword(node.kind);

  // Special case: source_file — just render children
  if (node.kind === 'source_file') {
    lines.push(`    return this.renderChildren(this._children, '\\n\\n', ctx);`);
    return lines;
  }

  lines.push('    const parts: string[] = [];');

  // 1. Children as visibility/modifier prefix (common in Rust: struct, fn, enum, etc.)
  if (node.hasChildren && fieldSet.has('name')) {
    lines.push('    if (this._children.length > 0) {');
    lines.push(`      parts.push(this.renderChildren(this._children, ' ', ctx));`);
    lines.push('    }');
  }

  // 2. Keyword from kind name
  if (keyword) {
    lines.push(`    parts.push('${keyword}');`);
  }

  // 3. Render fields in heuristic order
  const orderedFields = orderFields(node.fields);

  for (const field of orderedFields) {
    const fn = toFieldName(field.name);
    const priv = `this._${fn}`;

    if (field.name === 'body') {
      lines.push(`    if (${priv}) {`);
      lines.push(`      parts.push('{');`);
      lines.push(`      parts.push(this.renderChild(${priv}, ctx));`);
      lines.push(`      parts.push('}');`);
      lines.push('    }');
    } else if (field.name === 'parameters') {
      lines.push(`    parts.push('(' + (${priv} ? this.renderChild(${priv}, ctx) : '') + ')');`);
    } else if (field.name === 'return_type') {
      lines.push(`    if (${priv}) parts.push('->', this.renderChild(${priv}, ctx));`);
    } else if (field.name === 'type_parameters') {
      lines.push(`    if (${priv}) parts.push(this.renderChild(${priv}, ctx));`);
    } else if (field.name === 'condition') {
      lines.push(`    if (${priv}) parts.push(this.renderChild(${priv}, ctx));`);
    } else if (field.name === 'consequence') {
      lines.push(`    if (${priv}) {`);
      lines.push(`      parts.push('{', this.renderChild(${priv}, ctx), '}');`);
      lines.push('    }');
    } else if (field.name === 'alternative') {
      lines.push(`    if (${priv}) {`);
      lines.push(`      const alt = this.renderChild(${priv}, ctx);`);
      lines.push(`      parts.push(alt.startsWith('if ') ? 'else ' + alt : 'else { ' + alt + ' }');`);
      lines.push('    }');
    } else if (['left', 'right', 'operator', 'value', 'argument'].includes(field.name)) {
      lines.push(`    if (${priv}) parts.push(this.renderChild(${priv}, ctx));`);
    } else if (field.name === 'trait') {
      lines.push(`    if (${priv}) parts.push(this.renderChild(${priv}, ctx), 'for');`);
    } else if (field.name === 'macro') {
      lines.push(`    if (${priv}) parts.push(this.renderChild(${priv}, ctx) + '!');`);
    } else if (field.multiple) {
      lines.push(`    if (${priv}.length > 0) parts.push(this.renderChildren(${priv}, ', ', ctx));`);
    } else if (field.required) {
      lines.push(`    if (${priv}) parts.push(this.renderChild(${priv}, ctx));`);
    } else {
      lines.push(`    if (${priv}) parts.push(this.renderChild(${priv}, ctx));`);
    }
  }

  // 4. Children (when not used as visibility prefix above)
  if (node.hasChildren && !fieldSet.has('name')) {
    if (node.children?.multiple) {
      lines.push(`    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));`);
    } else {
      lines.push(`    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));`);
    }
  }

  lines.push(`    return parts.join(' ');`);
  return lines;
}

/**
 * Generate the body lines for a builder's toCSTChildren() method.
 * Mirrors renderImpl but produces CSTChild[] for position-tracked CST construction.
 */
function generateToCSTChildrenBody(node: NodeMeta): string[] {
  const lines: string[] = [];
  const fieldSet = new Set(node.fields.map((f) => f.name));
  const keyword = kindToKeyword(node.kind);

  // Special case: source_file
  if (node.kind === 'source_file') {
    lines.push('    const parts: CSTChild[] = [];');
    lines.push('    for (const child of this._children) {');
    lines.push(`      parts.push({ kind: 'builder', builder: child });`);
    lines.push('    }');
    lines.push('    return parts;');
    return lines;
  }

  lines.push('    const parts: CSTChild[] = [];');

  // 1. Children as visibility/modifier prefix
  if (node.hasChildren && fieldSet.has('name')) {
    lines.push('    for (const child of this._children) {');
    lines.push(`      parts.push({ kind: 'builder', builder: child });`);
    lines.push('    }');
  }

  // 2. Keyword
  if (keyword) {
    lines.push(`    parts.push({ kind: 'token', text: '${keyword}' });`);
  }

  // 3. Fields in heuristic order
  const orderedFields = orderFields(node.fields);

  for (const field of orderedFields) {
    const fn = toFieldName(field.name);
    const priv = `this._${fn}`;
    const fieldNameStr = `'${fn}'`;

    if (field.name === 'body') {
      lines.push(`    if (${priv}) {`);
      lines.push(`      parts.push({ kind: 'token', text: '{', type: '{' });`);
      lines.push(`      parts.push({ kind: 'builder', builder: ${priv}, fieldName: ${fieldNameStr} });`);
      lines.push(`      parts.push({ kind: 'token', text: '}', type: '}' });`);
      lines.push('    }');
    } else if (field.name === 'parameters') {
      lines.push(`    parts.push({ kind: 'token', text: '(', type: '(' });`);
      lines.push(`    if (${priv}) parts.push({ kind: 'builder', builder: ${priv}, fieldName: ${fieldNameStr} });`);
      lines.push(`    parts.push({ kind: 'token', text: ')', type: ')' });`);
    } else if (field.name === 'return_type') {
      lines.push(`    if (${priv}) {`);
      lines.push(`      parts.push({ kind: 'token', text: '->', type: '->' });`);
      lines.push(`      parts.push({ kind: 'builder', builder: ${priv}, fieldName: ${fieldNameStr} });`);
      lines.push('    }');
    } else if (field.name === 'trait') {
      lines.push(`    if (${priv}) {`);
      lines.push(`      parts.push({ kind: 'builder', builder: ${priv}, fieldName: ${fieldNameStr} });`);
      lines.push(`      parts.push({ kind: 'token', text: 'for' });`);
      lines.push('    }');
    } else if (field.name === 'macro') {
      lines.push(`    if (${priv}) {`);
      lines.push(`      parts.push({ kind: 'builder', builder: ${priv}, fieldName: ${fieldNameStr} });`);
      lines.push(`      parts.push({ kind: 'token', text: '!', type: '!' });`);
      lines.push('    }');
    } else if (field.multiple) {
      lines.push(`    for (const child of ${priv}) {`);
      lines.push(`      parts.push({ kind: 'builder', builder: child, fieldName: ${fieldNameStr} });`);
      lines.push('    }');
    } else {
      lines.push(`    if (${priv}) parts.push({ kind: 'builder', builder: ${priv}, fieldName: ${fieldNameStr} });`);
    }
  }

  // 4. Children (when not used as visibility prefix)
  if (node.hasChildren && !fieldSet.has('name')) {
    lines.push('    for (const child of this._children) {');
    lines.push(`      parts.push({ kind: 'builder', builder: child });`);
    lines.push('    }');
  }

  lines.push('    return parts;');
  return lines;
}

// ---------------------------------------------------------------------------
// Main emitter
// ---------------------------------------------------------------------------

export function emitBuilder(config: EmitBuilderConfig): string {
  const { node } = config;
  const kind = node.kind;

  const typeName = toTypeName(kind);
  const builderClassName = toBuilderClassName(kind);
  const shortName = toShortName(kind);

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
  lines.push(`import { BaseBuilder } from '@sittir/types';`);
  lines.push(`import type { RenderContext, CSTChild } from '@sittir/types';`);
  lines.push(`import type { ${typeName} } from '../types.js';`);
  lines.push('');
  lines.push(`type Child = BaseBuilder<{ kind: string }>;`);
  lines.push('');

  // --- Builder class ---
  lines.push(`class ${builderClassName} extends BaseBuilder<${typeName}> {`);

  // Private fields
  for (const field of node.fields) {
    const fieldName = toFieldName(field.name);
    if (field.multiple) {
      lines.push(`  private _${fieldName}: Child[] = [];`);
    } else if (field.required) {
      // Required non-constructor fields get initialized with a placeholder
      // Constructor field is set in constructor
      if (constructorParam?.source === 'field' && constructorParam.name === field.name) {
        lines.push(`  private _${fieldName}: Child;`);
      } else {
        lines.push(`  private _${fieldName}!: Child;`);
      }
    } else {
      lines.push(`  private _${fieldName}?: Child;`);
    }
  }

  // Children field
  if (node.hasChildren) {
    lines.push(`  private _children: Child[] = [];`);
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

    // Determine if multiple
    let isMultiple = false;
    if (constructorParam.source === 'children' && node.children?.multiple) {
      isMultiple = true;
    } else if (constructorParam.source === 'field') {
      const ctorField = node.fields.find((f) => f.name === constructorParam.name);
      if (ctorField?.multiple) isMultiple = true;
    }

    const paramType = isMultiple ? 'Child[]' : 'Child';

    lines.push(`  constructor(${ctorParamName}: ${paramType}) {`);
    lines.push('    super();');
    if (constructorParam.source === 'children') {
      lines.push(`    this._children = ${isMultiple ? ctorParamName : `[${ctorParamName}]`};`);
    } else {
      lines.push(`    this._${ctorFieldName} = ${ctorParamName};`);
    }
    lines.push('  }');
  } else {
    lines.push('  constructor() { super(); }');
  }

  lines.push('');

  // Fluent setters for non-constructor fields
  for (const field of setterFields) {
    const fieldName = toFieldName(field.name);
    const paramType = field.multiple ? 'Child[]' : 'Child';
    lines.push(`  ${fieldName}(value: ${paramType}): this {`);
    lines.push(`    this._${fieldName} = value;`);
    lines.push('    return this;');
    lines.push('  }');
    lines.push('');
  }

  // Children setter if applicable and not constructor param
  if (node.hasChildren && constructorParam?.source !== 'children') {
    lines.push('  children(value: Child[]): this {');
    lines.push('    this._children = value;');
    lines.push('    return this;');
    lines.push('  }');
    lines.push('');
  }

  // --- renderImpl() ---
  lines.push('  renderImpl(ctx?: RenderContext): string {');
  const renderBody = generateRenderSilentBody(node);
  for (const line of renderBody) {
    lines.push(line);
  }
  lines.push('  }');
  lines.push('');

  // --- build() ---
  lines.push(`  build(ctx?: RenderContext): ${typeName} {`);
  lines.push(`    return {`);
  lines.push(`      kind: '${kind}',`);
  for (const field of node.fields) {
    const fieldName = toFieldName(field.name);
    const isCtorField = constructorParam?.source === 'field' && constructorParam.name === field.name;
    if (field.multiple) {
      lines.push(`      ${fieldName}: this._${fieldName}.map(c => this.renderChild(c, ctx)),`);
    } else if (field.required && isCtorField) {
      lines.push(`      ${fieldName}: this.renderChild(this._${fieldName}, ctx),`);
    } else {
      lines.push(`      ${fieldName}: this._${fieldName} ? this.renderChild(this._${fieldName}, ctx) : undefined,`);
    }
  }
  if (node.hasChildren) {
    lines.push(`      children: this._children.map(c => this.renderChild(c, ctx)),`);
  }
  lines.push(`    } as unknown as ${typeName};`);
  lines.push('  }');
  lines.push('');

  // --- nodeKind getter ---
  lines.push(`  override get nodeKind(): string { return '${kind}'; }`);
  lines.push('');

  // --- toCSTChildren() ---
  lines.push('  override toCSTChildren(ctx?: RenderContext): CSTChild[] {');
  const cstBody = generateToCSTChildrenBody(node);
  for (const line of cstBody) {
    lines.push(line);
  }
  lines.push('  }');

  lines.push('}');
  lines.push('');

  // --- Short-name export ---
  if (constructorParam) {
    const shortParamName = constructorParam.source === 'children'
      ? 'children'
      : toParamName(constructorParam.name);

    let isMultiple = false;
    if (constructorParam.source === 'children' && node.children?.multiple) {
      isMultiple = true;
    } else if (constructorParam.source === 'field') {
      const ctorField = node.fields.find((f) => f.name === constructorParam.name);
      if (ctorField?.multiple) isMultiple = true;
    }

    const paramType = isMultiple ? 'Child[]' : 'Child';
    lines.push(`export function ${shortName}(${shortParamName}: ${paramType}): ${builderClassName} {`);
    lines.push(`  return new ${builderClassName}(${shortParamName});`);
    lines.push('}');
  } else {
    lines.push(`export function ${shortName}(): ${builderClassName} {`);
    lines.push(`  return new ${builderClassName}();`);
    lines.push('}');
  }

  lines.push('');

  return lines.join('\n');
}
