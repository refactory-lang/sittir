/**
 * Emits a self-contained builder file for a single node kind.
 *
 * Each builder extends Builder and owns its render logic —
 * no central switch statement needed.
 *
 * Rendering is driven by grammar.json rules, not heuristics.
 * The grammar rule's SEQ structure determines the exact token
 * order, keywords, and punctuation for each node kind.
 */

import type { NodeMeta, FieldMeta, GrammarRule, SupertypeInfo } from '../grammar-reader.ts';
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
  /** All known branch node kinds (have builders/types). */
  nodeKinds?: string[];
  /** All known leaf node kinds (LeafBuilder types). */
  leafKinds?: string[];
  /** Supertype info for resolving abstract type references. */
  supertypes?: SupertypeInfo[];
}

// ---------------------------------------------------------------------------
// Field type resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a field's namedTypes to a TypeScript type expression for Builder<T>.
 * Returns the inner type T, or undefined if unresolvable (falls back to generic Builder).
 */
function resolveFieldType(
  namedTypes: string[],
  nodeKindSet: Set<string>,
  leafKindSet: Set<string>,
  supertypeMap: Map<string, string>, // supertype name → TypeScript type name
): string | undefined {
  if (namedTypes.length === 0) return undefined;

  const typeNames: string[] = [];
  for (const nt of namedTypes) {
    if (supertypeMap.has(nt)) {
      // Supertype reference → use the union alias
      typeNames.push(supertypeMap.get(nt)!);
    } else if (nodeKindSet.has(nt) || leafKindSet.has(nt)) {
      typeNames.push(toTypeName(nt));
    }
    // else: unknown type, skip
  }

  if (typeNames.length === 0) return undefined;

  // Deduplicate (a supertype might already include some concrete types)
  const unique = [...new Set(typeNames)];
  return unique.join(' | ');
}

// ---------------------------------------------------------------------------
// Constructor param selection
// ---------------------------------------------------------------------------

export function selectConstructorField(node: NodeMeta, grammar?: string): { name: string; source: 'field' | 'children' } | null {
  const requiredFields = node.fields.filter((f) => f.required);

  // Semantic priority: 'name' and 'argument' fields are always primary
  const nameField = requiredFields.find((f) => f.name === 'name');
  if (nameField) return { name: nameField.name, source: 'field' };
  const argField = requiredFields.find((f) => f.name === 'argument');
  if (argField) return { name: argField.name, source: 'field' };

  // Use grammar rule to pick the first field in syntactic order
  if (grammar && requiredFields.length > 0) {
    const rule = readGrammarRule(grammar, node.kind);
    if (rule) {
      const fieldMeta = new Map(node.fields.map(f => [f.name, f]));
      const elements = flattenRule(rule, fieldMeta, grammar);
      const requiredNames = new Set(requiredFields.map(f => f.name));
      const firstField = elements.find(
        el => el.kind === 'field' && requiredNames.has(el.name),
      );
      if (firstField && firstField.kind === 'field') {
        return { name: firstField.name, source: 'field' };
      }
    }
  }

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
  | { kind: 'symbol'; name: string; optional: boolean; separator?: string; separatorPrefix?: boolean; index?: number }
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
      // Non-optional CHOICE — for binary STRING/SYMBOL choices, prefer SYMBOL
      // e.g. CHOICE('const', type) → prefer type (more general for rendering)
      if (nonBlank.length === 2) {
        const hasString = nonBlank.some(m => m.type === 'STRING');
        const symbolMember = nonBlank.find(m => m.type === 'SYMBOL');
        if (hasString && symbolMember) {
          return flattenRule(symbolMember, fieldMeta, grammar, optional);
        }
      }
      return flattenRule(nonBlank[0]!, fieldMeta, grammar, optional);
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
  let childrenSeparator: string | undefined;
  const result: RenderElement[] = [];

  // Detect separator: look for token between two same-named symbol elements
  // Pattern 1 (prefix): optional_symbol token same_symbol (e.g. union_type: CHOICE(type, BLANK) '|' type)
  // Pattern 2 (infix): required_symbol token optional_same_symbol (e.g. implements_clause: type ',' REPEAT(type))
  let separatorPrefix = false;
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]!;
    if (el.kind === 'symbol' && i + 2 < elements.length) {
      const next = elements[i + 1]!;
      const after = elements[i + 2]!;
      if (next.kind === 'token' && after.kind === 'symbol' && after.name === el.name) {
        if (el.optional) {
          // Pattern 1: optional first → prefix separator
          childrenSeparator = next.value;
          separatorPrefix = true;
          break;
        } else if (after.optional) {
          // Pattern 2: required first, optional second → infix separator
          childrenSeparator = next.value;
          separatorPrefix = false;
          break;
        }
      }
    }
  }

  // Detect positional children: multiple non-abstract symbols without separator
  // Handles both different-named (satisfies_expression: <expression> 'satisfies' <type>)
  // and same-named (import_alias: <identifier> '=' <identifier>) patterns
  const nonAbstractSymbols = elements.filter(el => el.kind === 'symbol' && !el.name.startsWith('_'));
  const usePositional = !childrenSeparator && nonAbstractSymbols.length > 1;

  if (usePositional) {
    let childIndex = 0;
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]!;
      if (el.kind === 'field') {
        if (seenFields.has(el.name)) continue;
        seenFields.add(el.name);
      } else if (el.kind === 'symbol') {
        // Skip abstract symbols — they don't correspond to real child slots
        if (el.name.startsWith('_')) continue;
        result.push({ ...el, index: childIndex++ });
        continue;
      } else if (el.kind === 'group') {
        const deduped = deduplicateElements(el.elements);
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

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]!;
    if (el.kind === 'field') {
      if (seenFields.has(el.name)) continue;
      seenFields.add(el.name);
    } else if (el.kind === 'token' && childrenSeparator && el.value === childrenSeparator) {
      // Skip separator tokens — they're absorbed into the symbol element
      const prevIsSymbol = i > 0 && elements[i - 1]!.kind === 'symbol';
      const nextIsSymbol = i + 1 < elements.length && elements[i + 1]!.kind === 'symbol';
      if (prevIsSymbol || nextIsSymbol) continue;
    } else if (el.kind === 'symbol') {
      if (seenChildren) continue;
      seenChildren = true;
      // Attach separator if detected
      if (childrenSeparator) {
        result.push({ ...el, separator: childrenSeparator, separatorPrefix });
        continue;
      }
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

    case 'symbol': {
      if (el.index !== undefined) {
        // Positional child — guard against missing children for safe progressive construction
        lines.push(`${indent}if (this._children[${el.index}]) parts.push(this.renderChild(this._children[${el.index}]!, ctx));`);
      } else if (el.separator) {
        const sep = ` ${el.separator} `;
        if (el.separatorPrefix) {
          // Binary pattern: separator always appears (e.g. union_type: | string, string | number)
          lines.push(`${indent}if (this._children.length === 1) {`);
          lines.push(`${indent}  parts.push('${escapeString(el.separator)}');`);
          lines.push(`${indent}  parts.push(this.renderChild(this._children[0]!, ctx));`);
          lines.push(`${indent}} else if (this._children.length > 1) {`);
          lines.push(`${indent}  parts.push(this.renderChildren(this._children, '${escapeString(sep)}', ctx));`);
          lines.push(`${indent}}`);
        } else {
          lines.push(`${indent}if (this._children.length > 0) parts.push(this.renderChildren(this._children, '${escapeString(sep)}', ctx));`);
        }
      } else {
        lines.push(`${indent}if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));`);
      }
      break;
    }

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
/**
 * Collect all field names that appear in a list of render elements (including nested groups).
 */
function collectFieldNames(elements: RenderElement[]): Set<string> {
  const names = new Set<string>();
  for (const el of elements) {
    if (el.kind === 'field') names.add(el.name);
    else if (el.kind === 'group') {
      for (const ge of el.elements) {
        if (ge.kind === 'field') names.add(ge.name);
      }
    }
  }
  return names;
}

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

  // Append missing fields — fields in metadata but not captured by rule walking
  const emittedFields = collectFieldNames(elements);
  for (const field of node.fields) {
    if (!emittedFields.has(field.name)) {
      elements.push({
        kind: 'field',
        name: field.name,
        optional: !field.required,
      });
    }
  }

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
      if (el.index !== undefined) {
        // Positional child — guard against missing children
        lines.push(`${indent}if (this._children[${el.index}]) parts.push({ kind: 'builder', builder: this._children[${el.index}]! });`);
      } else if (el.separator) {
        if (el.separatorPrefix) {
          // Binary pattern: separator always appears as prefix or infix
          lines.push(`${indent}for (let i = 0; i < this._children.length; i++) {`);
          lines.push(`${indent}  if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: '${escapeString(el.separator)}', type: '${escapeString(el.separator)}' });`);
          lines.push(`${indent}  parts.push({ kind: 'builder', builder: this._children[i]! });`);
          lines.push(`${indent}}`);
        } else {
          lines.push(`${indent}for (let i = 0; i < this._children.length; i++) {`);
          lines.push(`${indent}  if (i > 0) parts.push({ kind: 'token', text: '${escapeString(el.separator)}', type: '${escapeString(el.separator)}' });`);
          lines.push(`${indent}  parts.push({ kind: 'builder', builder: this._children[i]! });`);
          lines.push(`${indent}}`);
        }
      } else {
        lines.push(`${indent}for (const child of this._children) {`);
        lines.push(`${indent}  parts.push({ kind: 'builder', builder: child });`);
        lines.push(`${indent}}`);
      }
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

  // Append missing fields — fields in metadata but not captured by rule walking
  const emittedFields = collectFieldNames(elements);
  for (const field of node.fields) {
    if (!emittedFields.has(field.name)) {
      elements.push({
        kind: 'field',
        name: field.name,
        optional: !field.required,
      });
    }
  }

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
  const { grammar, node, nodeKinds = [], leafKinds = [], supertypes = [] } = config;
  const kind = node.kind;

  const typeName = toTypeName(kind);
  const builderClassName = toBuilderClassName(kind);
  const shortName = toShortName(kind);

  const constructorParam = selectConstructorField(node, grammar);

  // Try to load grammar rule for this node kind
  const rule = readGrammarRule(grammar, kind);

  // Build type resolution sets
  const nodeKindSet = new Set(nodeKinds);
  const leafKindSet = new Set(leafKinds);
  const supertypeMap = new Map<string, string>();
  for (const st of supertypes) {
    const cleanName = st.name.replace(/^_/, '');
    supertypeMap.set(st.name, toTypeName(cleanName));
  }

  // Resolve field types for imports and signatures
  const fieldTypeMap = new Map<string, string | undefined>();
  const importedTypes = new Set<string>([typeName]);
  for (const field of node.fields) {
    const resolved = resolveFieldType(field.namedTypes, nodeKindSet, leafKindSet, supertypeMap);
    fieldTypeMap.set(field.name, resolved);
    if (resolved) {
      for (const t of resolved.split(' | ')) {
        importedTypes.add(t.trim());
      }
    }
  }
  // Resolve children type
  let childrenType: string | undefined;
  if (node.children) {
    childrenType = resolveFieldType(node.children.namedTypes, nodeKindSet, leafKindSet, supertypeMap);
    if (childrenType) {
      for (const t of childrenType.split(' | ')) {
        importedTypes.add(t.trim());
      }
    }
  }

  // Check if .from() needs LeafBuilder for string → builder resolution
  const hasLeafResolution = node.fields.some(f =>
    f.namedTypes.length === 1 && leafKindSet.has(f.namedTypes[0]!)
  ) || !!(node.children?.namedTypes.length === 1 && node.children.namedTypes[0] !== undefined && leafKindSet.has(node.children.namedTypes[0]));

  /** Get the Builder<T> type string for a field, or plain Builder if unresolved. */
  function builderType(fieldName: string): string {
    const resolved = fieldTypeMap.get(fieldName);
    return resolved ? `Builder<${resolved}>` : 'Builder';
  }

  function childBuilderType(): string {
    return childrenType ? `Builder<${childrenType}>` : 'Builder';
  }

  // Determine which fields are setters (not the constructor param)
  const setterFields = node.fields.filter((f) => {
    if (constructorParam && constructorParam.source === 'field') {
      return f.name !== constructorParam.name;
    }
    return true;
  });

  const lines: string[] = [];

  // --- Imports ---
  const builderImports = hasLeafResolution ? 'Builder, LeafBuilder' : 'Builder';
  lines.push(`import { ${builderImports} } from '@sittir/types';`);
  lines.push(`import type { RenderContext, CSTChild } from '@sittir/types';`);
  // Import all referenced types from types.ts
  const sortedImports = [...importedTypes].sort();
  lines.push(`import type { ${sortedImports.join(', ')} } from '../types.js';`);
  lines.push('');
  lines.push('');

  // --- Builder class ---
  lines.push(`class ${builderClassName} extends Builder<${typeName}> {`);

  // Private fields (use wide Builder type for internal storage — compatible with fromCST)
  for (const field of node.fields) {
    const fieldName = toFieldName(field.name);
    if (field.multiple) {
      lines.push(`  private _${fieldName}: Builder[] = [];`);
    } else if (field.required) {
      if (constructorParam?.source === 'field' && constructorParam.name === field.name) {
        lines.push(`  private _${fieldName}: Builder;`);
      } else {
        lines.push(`  private _${fieldName}!: Builder;`);
      }
    } else {
      lines.push(`  private _${fieldName}?: Builder;`);
    }
  }

  // Children field
  if (node.hasChildren) {
    lines.push(`  private _children: Builder[] = [];`);
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

    if (isMultiple) {
      lines.push(`  constructor(...${ctorParamName}: Builder[]) {`);
      lines.push('    super();');
      if (constructorParam.source === 'children') {
        lines.push(`    this._children = ${ctorParamName};`);
      } else {
        lines.push(`    this._${ctorFieldName} = ${ctorParamName};`);
      }
    } else {
      lines.push(`  constructor(${ctorParamName}: Builder) {`);
      lines.push('    super();');
      if (constructorParam.source === 'children') {
        lines.push(`    this._children = [${ctorParamName}];`);
      } else {
        lines.push(`    this._${ctorFieldName} = ${ctorParamName};`);
      }
    }
    lines.push('  }');
  } else {
    lines.push('  constructor() { super(); }');
  }

  lines.push('');

  // Fluent setters for non-constructor fields
  for (const field of setterFields) {
    const fieldName = toFieldName(field.name);
    if (field.multiple) {
      lines.push(`  ${fieldName}(...value: Builder[]): this {`);
      lines.push(`    this._${fieldName} = value;`);
    } else {
      lines.push(`  ${fieldName}(value: Builder): this {`);
      lines.push(`    this._${fieldName} = value;`);
    }
    lines.push('    return this;');
    lines.push('  }');
    lines.push('');
  }

  // Children setter if applicable and not constructor param
  if (node.hasChildren && constructorParam?.source !== 'children') {
    lines.push('  children(...value: Builder[]): this {');
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

  // --- Export builder type ---
  lines.push(`export type { ${builderClassName} };`);
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

    if (isMultiple) {
      lines.push(`export function ${shortName}(...${shortParamName}: Builder[]): ${builderClassName} {`);
      lines.push(`  return new ${builderClassName}(...${shortParamName});`);
      lines.push('}');
    } else {
      lines.push(`export function ${shortName}(${shortParamName}: Builder): ${builderClassName} {`);
      lines.push(`  return new ${builderClassName}(${shortParamName});`);
      lines.push('}');
    }
  } else {
    lines.push(`export function ${shortName}(): ${builderClassName} {`);
    lines.push(`  return new ${builderClassName}();`);
    lines.push('}');
  }

  lines.push('');

  // --- .from() declarative API ---
  const optionsName = `${typeName}Options`;

  lines.push(`export interface ${optionsName} {`);
  for (const field of node.fields) {
    const fieldName = toFieldName(field.name);
    const preciseType = builderType(field.name);
    const isLeaf = field.namedTypes.length === 1 && leafKindSet.has(field.namedTypes[0]!);
    const baseType = isLeaf ? `${preciseType} | string` : preciseType;
    const optional = !field.required;

    if (field.multiple) {
      lines.push(`  ${fieldName}${optional ? '?' : ''}: ${baseType} | (${baseType})[];`);
    } else {
      lines.push(`  ${fieldName}${optional ? '?' : ''}: ${baseType};`);
    }
  }
  if (node.hasChildren) {
    const ct = childBuilderType();
    const isLeaf = !!(node.children?.namedTypes.length === 1 && node.children.namedTypes[0] !== undefined && leafKindSet.has(node.children.namedTypes[0]));
    const baseType = isLeaf ? `${ct} | string` : ct;
    const isRequired = !!(node.children?.required && constructorParam?.source === 'children');
    lines.push(`  children${isRequired ? '' : '?'}: ${baseType} | (${baseType})[];`);
  }
  lines.push('}');
  lines.push('');

  // Helper for leaf resolution expressions
  const resolveExpr = (varName: string, leafKind: string) =>
    `typeof ${varName} === 'string' ? new LeafBuilder('${leafKind}', ${varName}) : ${varName}`;

  // Namespace with .from()
  lines.push(`export namespace ${shortName} {`);
  lines.push(`  export function from(options: ${optionsName}): ${builderClassName} {`);

  // Constructor
  if (constructorParam && constructorParam.source === 'field') {
    const ctorFieldName = toFieldName(constructorParam.name);
    const ctorField = node.fields.find(f => f.name === constructorParam.name);
    const ctorLeaf = !!(ctorField && ctorField.namedTypes.length === 1 && leafKindSet.has(ctorField.namedTypes[0]!));
    const ctorLeafKind = ctorLeaf ? ctorField!.namedTypes[0]! : '';

    if (ctorField?.multiple) {
      lines.push(`    const _ctor = options.${ctorFieldName};`);
      lines.push(`    const _arr = Array.isArray(_ctor) ? _ctor : [_ctor];`);
      if (ctorLeaf) {
        lines.push(`    const b = new ${builderClassName}(..._arr.map(_v => ${resolveExpr('_v', ctorLeafKind)}));`);
      } else {
        lines.push(`    const b = new ${builderClassName}(..._arr);`);
      }
    } else {
      if (ctorLeaf) {
        lines.push(`    const _ctor = options.${ctorFieldName};`);
        lines.push(`    const b = new ${builderClassName}(${resolveExpr('_ctor', ctorLeafKind)});`);
      } else {
        lines.push(`    const b = new ${builderClassName}(options.${ctorFieldName});`);
      }
    }
  } else if (constructorParam?.source === 'children') {
    const isMultiple = node.children?.multiple;
    const isLeaf = !!(node.children?.namedTypes.length === 1 && node.children.namedTypes[0] !== undefined && leafKindSet.has(node.children.namedTypes[0]));
    const leafKind = isLeaf ? node.children!.namedTypes[0]! : '';
    const childrenRequired = !!node.children?.required;

    if (isMultiple) {
      lines.push(`    const _children = options.children;`);
      if (childrenRequired) {
        lines.push(`    const _arr = Array.isArray(_children) ? _children : [_children];`);
      } else {
        lines.push(`    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];`);
      }
      if (isLeaf) {
        lines.push(`    const b = new ${builderClassName}(..._arr.map(_v => ${resolveExpr('_v', leafKind)}));`);
      } else {
        lines.push(`    const b = new ${builderClassName}(..._arr);`);
      }
    } else {
      // Single child as constructor — normalize from T | T[]
      if (childrenRequired) {
        lines.push(`    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;`);
        if (isLeaf) {
          lines.push(`    const b = new ${builderClassName}(${resolveExpr('_ctor', leafKind)});`);
        } else {
          lines.push(`    const b = new ${builderClassName}(_ctor);`);
        }
      } else {
        lines.push(`    const _raw = options.children;`);
        lines.push(`    const _ctor = _raw !== undefined ? (Array.isArray(_raw) ? _raw[0]! : _raw) : undefined;`);
        if (isLeaf) {
          lines.push(`    const b = _ctor !== undefined ? new ${builderClassName}(${resolveExpr('_ctor', leafKind)}) : new ${builderClassName}();`);
        } else {
          lines.push(`    const b = _ctor !== undefined ? new ${builderClassName}(_ctor) : new ${builderClassName}();`);
        }
      }
    }
  } else {
    lines.push(`    const b = new ${builderClassName}();`);
  }

  // Set non-constructor fields
  for (const field of setterFields) {
    const fieldName = toFieldName(field.name);
    const isLeaf = field.namedTypes.length === 1 && leafKindSet.has(field.namedTypes[0]!);
    const leafKind = isLeaf ? field.namedTypes[0]! : '';

    if (field.multiple) {
      lines.push(`    if (options.${fieldName} !== undefined) {`);
      lines.push(`      const _v = options.${fieldName};`);
      lines.push(`      const _arr = Array.isArray(_v) ? _v : [_v];`);
      if (isLeaf) {
        lines.push(`      b.${fieldName}(..._arr.map(_x => ${resolveExpr('_x', leafKind)}));`);
      } else {
        lines.push(`      b.${fieldName}(..._arr);`);
      }
      lines.push(`    }`);
    } else {
      if (isLeaf) {
        lines.push(`    if (options.${fieldName} !== undefined) {`);
        lines.push(`      const _v = options.${fieldName};`);
        lines.push(`      b.${fieldName}(${resolveExpr('_v', leafKind)});`);
        lines.push(`    }`);
      } else {
        lines.push(`    if (options.${fieldName} !== undefined) b.${fieldName}(options.${fieldName});`);
      }
    }
  }

  // Children (if not constructor)
  if (node.hasChildren && constructorParam?.source !== 'children') {
    const isLeaf = !!(node.children?.namedTypes.length === 1 && node.children.namedTypes[0] !== undefined && leafKindSet.has(node.children.namedTypes[0]));
    const leafKind = isLeaf ? node.children!.namedTypes[0]! : '';

    lines.push(`    if (options.children !== undefined) {`);
    lines.push(`      const _v = options.children;`);
    lines.push(`      const _arr = Array.isArray(_v) ? _v : [_v];`);
    if (isLeaf) {
      lines.push(`      b.children(..._arr.map(_x => ${resolveExpr('_x', leafKind)}));`);
    } else {
      lines.push(`      b.children(..._arr);`);
    }
    lines.push(`    }`);
  }

  lines.push('    return b;');
  lines.push('  }');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}
