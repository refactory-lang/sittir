/**
 * Emits a self-contained builder file for a single node kind.
 *
 * Each builder extends BaseBuilder and owns its render logic —
 * no central switch statement needed.
 *
 * Rendering is driven by grammar.json rules, not heuristics.
 * The grammar rule's SEQ structure determines the exact token
 * order, keywords, and punctuation for each node kind.
 */

import type { NodeMeta, FieldMeta, GrammarRule } from '../grammar-reader.ts';
import { readGrammarRule } from '../grammar-reader.ts';
import {
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
// Constructor param selection
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
// Grammar-rule-driven rendering
// ---------------------------------------------------------------------------

/**
 * A render element extracted from a grammar.json rule.
 * Tokens that are siblings of fields in an optional group
 * are bundled into 'group' elements so they render together.
 */
type RenderElement =
  | { kind: 'token'; value: string; optional: boolean }
  | { kind: 'field'; name: string; optional: boolean }
  | { kind: 'symbol'; name: string; optional: boolean }
  | { kind: 'group'; elements: RenderElement[]; optional: boolean };

/**
 * Flatten a grammar.json rule into a sequence of render elements.
 * When an optional SEQ contains both STRING and FIELD nodes,
 * they're grouped so the tokens render conditionally on the field's presence.
 */
function flattenRule(
  rule: GrammarRule,
  fieldMeta: Map<string, FieldMeta>,
  grammar: string,
  optional: boolean = false,
): RenderElement[] {
  switch (rule.type) {
    case 'SEQ': {
      const members: RenderElement[] = [];
      for (const member of rule.members) {
        members.push(...flattenRule(member, fieldMeta, grammar, optional));
      }
      return members;
    }

    case 'STRING':
      return [{ kind: 'token', value: rule.value, optional }];

    case 'FIELD':
      return [{
        kind: 'field',
        name: rule.name,
        optional: optional || !fieldMeta.get(rule.name)?.required,
      }];

    case 'SYMBOL': {
      // Inline _-prefixed abstract symbols (e.g. _call_signature)
      // that contain fields belonging to this node
      if (rule.name.startsWith('_')) {
        const subRule = readGrammarRule(grammar, rule.name);
        if (subRule) {
          const inlined = flattenRule(subRule, fieldMeta, grammar, optional);
          // Only use inlined result if it produced fields that match our metadata
          const hasRelevantFields = inlined.some(
            el => el.kind === 'field' && fieldMeta.has(el.name),
          );
          if (hasRelevantFields) return inlined;
        }
      }
      return [{ kind: 'symbol', name: rule.name, optional }];
    }

    case 'BLANK':
      return [];

    case 'CHOICE': {
      const hasBlank = rule.members.some(m => m.type === 'BLANK');
      const nonBlank = rule.members.filter(m => m.type !== 'BLANK');

      if (hasBlank && nonBlank.length >= 1) {
        // Optional content — flatten and wrap in group if mixed tokens+fields
        const inner = flattenRule(nonBlank[0]!, fieldMeta, grammar, true);
        const hasToken = inner.some(e => e.kind === 'token');
        const hasField = inner.some(e => e.kind === 'field');

        if (hasToken && hasField && inner.length > 1) {
          // Group tokens with their fields so they render conditionally together
          return [{ kind: 'group', elements: inner, optional: true }];
        }
        return inner;
      }
      // Non-optional CHOICE — use first variant as representative
      return flattenRule(rule.members[0]!, fieldMeta, grammar, optional);
    }

    case 'PREC':
    case 'PREC_LEFT':
    case 'PREC_RIGHT':
      return flattenRule(rule.content, fieldMeta, grammar, optional);

    case 'REPEAT':
      return flattenRule(rule.content, fieldMeta, grammar, true);

    case 'REPEAT1':
      return flattenRule(rule.content, fieldMeta, grammar, optional);

    case 'ALIAS':
      return flattenRule(rule.content, fieldMeta, grammar, optional);

    case 'TOKEN':
    case 'IMMEDIATE_TOKEN':
      return flattenRule(rule.content, fieldMeta, grammar, optional);

    case 'PATTERN':
      return [];

    default:
      // Unknown rule type — skip gracefully
      return [];
  }
}

/**
 * Deduplicate render elements:
 * - Each field appears only once (first occurrence wins)
 * - Symbols (unnamed children) appear only once
 */
function deduplicateElements(elements: RenderElement[]): RenderElement[] {
  const seenFields = new Set<string>();
  let seenChildren = false;
  const result: RenderElement[] = [];

  for (const el of elements) {
    if (el.kind === 'field') {
      if (seenFields.has(el.name)) continue;
      seenFields.add(el.name);
    } else if (el.kind === 'symbol') {
      if (seenChildren) continue;
      seenChildren = true;
    } else if (el.kind === 'group') {
      // Deduplicate within group too
      const deduped = deduplicateElements(el.elements);
      // Skip group if all fields already seen
      const groupFields = deduped.filter(e => e.kind === 'field');
      const allSeen = groupFields.every(f => f.kind === 'field' && seenFields.has(f.name));
      if (allSeen && groupFields.length > 0) continue;
      for (const ge of deduped) {
        if (ge.kind === 'field') seenFields.add(ge.name);
      }
      result.push({ ...el, elements: deduped });
      continue;
    }
    result.push(el);
  }

  return result;
}

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Generate renderImpl() lines for a single render element.
 */
function emitRenderElement(
  el: RenderElement,
  fieldMeta: Map<string, FieldMeta>,
  lines: string[],
  indent: string = '    ',
): void {
  switch (el.kind) {
    case 'token':
      if (el.optional) {
        // Optional standalone tokens are rare — skip them in render
        // (they'll be in groups when paired with fields)
      } else {
        lines.push(`${indent}parts.push('${escapeString(el.value)}');`);
      }
      break;

    case 'field': {
      const fn = toFieldName(el.name);
      const priv = `this._${fn}`;
      const meta = fieldMeta.get(el.name);

      if (meta?.multiple) {
        lines.push(`${indent}if (${priv}.length > 0) parts.push(this.renderChildren(${priv}, ', ', ctx));`);
      } else {
        lines.push(`${indent}if (${priv}) parts.push(this.renderChild(${priv}, ctx));`);
      }
      break;
    }

    case 'symbol':
      lines.push(`${indent}if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));`);
      break;

    case 'group': {
      // Find the field(s) to guard on
      const guardField = el.elements.find(e => e.kind === 'field');
      if (guardField && guardField.kind === 'field') {
        const fn = toFieldName(guardField.name);
        const priv = `this._${fn}`;
        const meta = fieldMeta.get(guardField.name);
        const isMultiple = meta?.multiple;
        const guard = isMultiple ? `${priv}.length > 0` : priv;

        lines.push(`${indent}if (${guard}) {`);
        for (const ge of el.elements) {
          if (ge.kind === 'token') {
            lines.push(`${indent}  parts.push('${escapeString(ge.value)}');`);
          } else {
            emitRenderElement(ge, fieldMeta, lines, indent + '  ');
          }
        }
        lines.push(`${indent}}`);
      } else {
        // No field to guard on — emit all elements
        for (const ge of el.elements) {
          emitRenderElement(ge, fieldMeta, lines, indent);
        }
      }
      break;
    }
  }
}

/**
 * Generate renderImpl() body from grammar.json rule.
 */
function generateRenderBody(
  node: NodeMeta,
  rule: GrammarRule,
  grammar: string,
): string[] {
  const fieldMeta = new Map(node.fields.map(f => [f.name, f]));
  const rawElements = flattenRule(rule, fieldMeta, grammar);
  const deduped = deduplicateElements(rawElements);
  // Skip symbol (children) elements if node has no children in metadata
  const elements = node.hasChildren ? deduped : deduped.filter(el => el.kind !== 'symbol');

  const lines: string[] = [];
  lines.push('    const parts: string[] = [];');

  for (const el of elements) {
    emitRenderElement(el, fieldMeta, lines);
  }

  lines.push(`    return parts.join(' ');`);
  return lines;
}

/**
 * Generate toCSTChildren() lines for a single render element.
 */
function emitCSTElement(
  el: RenderElement,
  fieldMeta: Map<string, FieldMeta>,
  lines: string[],
  indent: string = '    ',
): void {
  switch (el.kind) {
    case 'token':
      if (!el.optional) {
        lines.push(`${indent}parts.push({ kind: 'token', text: '${escapeString(el.value)}', type: '${escapeString(el.value)}' });`);
      }
      break;

    case 'field': {
      const fn = toFieldName(el.name);
      const priv = `this._${fn}`;
      const meta = fieldMeta.get(el.name);
      const fieldNameStr = `'${fn}'`;

      if (meta?.multiple) {
        lines.push(`${indent}for (const child of ${priv}) {`);
        lines.push(`${indent}  parts.push({ kind: 'builder', builder: child, fieldName: ${fieldNameStr} });`);
        lines.push(`${indent}}`);
      } else {
        lines.push(`${indent}if (${priv}) parts.push({ kind: 'builder', builder: ${priv}, fieldName: ${fieldNameStr} });`);
      }
      break;
    }

    case 'symbol':
      lines.push(`${indent}for (const child of this._children) {`);
      lines.push(`${indent}  parts.push({ kind: 'builder', builder: child });`);
      lines.push(`${indent}}`);
      break;

    case 'group': {
      const guardField = el.elements.find(e => e.kind === 'field');
      if (guardField && guardField.kind === 'field') {
        const fn = toFieldName(guardField.name);
        const priv = `this._${fn}`;
        const meta = fieldMeta.get(guardField.name);
        const isMultiple = meta?.multiple;
        const guard = isMultiple ? `${priv}.length > 0` : priv;

        lines.push(`${indent}if (${guard}) {`);
        for (const ge of el.elements) {
          if (ge.kind === 'token') {
            lines.push(`${indent}  parts.push({ kind: 'token', text: '${escapeString(ge.value)}', type: '${escapeString(ge.value)}' });`);
          } else {
            emitCSTElement(ge, fieldMeta, lines, indent + '  ');
          }
        }
        lines.push(`${indent}}`);
      } else {
        for (const ge of el.elements) {
          emitCSTElement(ge, fieldMeta, lines, indent);
        }
      }
      break;
    }
  }
}

/**
 * Generate toCSTChildren() body from grammar.json rule.
 */
function generateCSTBody(
  node: NodeMeta,
  rule: GrammarRule,
  grammar: string,
): string[] {
  const fieldMeta = new Map(node.fields.map(f => [f.name, f]));
  const rawElements = flattenRule(rule, fieldMeta, grammar);
  const deduped = deduplicateElements(rawElements);
  const elements = node.hasChildren ? deduped : deduped.filter(el => el.kind !== 'symbol');

  const lines: string[] = [];
  lines.push('    const parts: CSTChild[] = [];');

  for (const el of elements) {
    emitCSTElement(el, fieldMeta, lines);
  }

  lines.push('    return parts;');
  return lines;
}

// ---------------------------------------------------------------------------
// Main emitter
// ---------------------------------------------------------------------------

export function emitBuilder(config: EmitBuilderConfig): string {
  const { grammar, node } = config;
  const kind = node.kind;

  const typeName = toTypeName(kind);
  const builderClassName = toBuilderClassName(kind);
  const shortName = toShortName(kind);

  const constructorParam = selectConstructorField(node);

  // Try to load grammar rule for this node kind
  const rule = readGrammarRule(grammar, kind);

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
  lines.push('');

  // --- Builder class ---
  lines.push(`class ${builderClassName} extends BaseBuilder<${typeName}> {`);

  // Private fields
  for (const field of node.fields) {
    const fieldName = toFieldName(field.name);
    if (field.multiple) {
      lines.push(`  private _${fieldName}: BaseBuilder[] = [];`);
    } else if (field.required) {
      if (constructorParam?.source === 'field' && constructorParam.name === field.name) {
        lines.push(`  private _${fieldName}: BaseBuilder;`);
      } else {
        lines.push(`  private _${fieldName}!: BaseBuilder;`);
      }
    } else {
      lines.push(`  private _${fieldName}?: BaseBuilder;`);
    }
  }

  // Children field
  if (node.hasChildren) {
    lines.push(`  private _children: BaseBuilder[] = [];`);
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

    let isMultiple = false;
    if (constructorParam.source === 'children' && node.children?.multiple) {
      isMultiple = true;
    } else if (constructorParam.source === 'field') {
      const ctorField = node.fields.find((f) => f.name === constructorParam.name);
      if (ctorField?.multiple) isMultiple = true;
    }

    const paramType = isMultiple ? 'BaseBuilder[]' : 'BaseBuilder';

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
    const paramType = field.multiple ? 'BaseBuilder[]' : 'BaseBuilder';
    lines.push(`  ${fieldName}(value: ${paramType}): this {`);
    lines.push(`    this._${fieldName} = value;`);
    lines.push('    return this;');
    lines.push('  }');
    lines.push('');
  }

  // Children setter if applicable and not constructor param
  if (node.hasChildren && constructorParam?.source !== 'children') {
    lines.push('  children(value: BaseBuilder[]): this {');
    lines.push('    this._children = value;');
    lines.push('    return this;');
    lines.push('  }');
    lines.push('');
  }

  // --- renderImpl() ---
  lines.push('  renderImpl(ctx?: RenderContext): string {');
  if (rule) {
    const renderBody = generateRenderBody(node, rule, grammar);
    for (const line of renderBody) {
      lines.push(line);
    }
  } else {
    // Fallback: no grammar rule available — render children
    lines.push(`    return this._children ? this.renderChildren(this._children, ' ', ctx) : '';`);
  }
  lines.push('  }');
  lines.push('');

  // --- build() ---
  lines.push(`  build(ctx?: RenderContext): ${typeName} {`);
  lines.push(`    return {`);
  lines.push(`      kind: '${kind}',`);
  for (const field of node.fields) {
    // Skip fields named "kind" — would collide with the kind discriminant above
    if (field.name === 'kind') continue;
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
  if (rule) {
    const cstBody = generateCSTBody(node, rule, grammar);
    for (const line of cstBody) {
      lines.push(line);
    }
  } else {
    lines.push('    const parts: CSTChild[] = [];');
    lines.push('    for (const child of this._children) {');
    lines.push(`      parts.push({ kind: 'builder', builder: child });`);
    lines.push('    }');
    lines.push('    return parts;');
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

    const paramType = isMultiple ? 'BaseBuilder[]' : 'BaseBuilder';
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
