/**
 * Emits a `render.ts` scaffold with a switch/case for each node kind.
 * Each case contains a heuristic-based render implementation derived
 * from the grammar metadata (fields, children, kind name).
 */

import type { NodeMeta, FieldMeta } from '../grammar-reader.ts';
import { toTypeName, toGrammarTypeName, toFieldName } from '../naming.ts';

export interface EmitRenderScaffoldConfig {
  grammar: string;
  nodes: NodeMeta[];
}

/**
 * Derive a language keyword from the node kind.
 * Strips common suffixes like _item, _expression, _statement, _declaration, _definition, _type, _pattern, _literal.
 * E.g. struct_item -> struct, if_expression -> if, use_declaration -> use
 */
function kindToKeyword(kind: string): string | null {
  const suffixes = [
    '_item',
    '_expression',
    '_statement',
    '_declaration',
    '_definition',
    '_type',
    '_pattern',
    '_literal',
    '_clause',
  ];
  for (const suffix of suffixes) {
    if (kind.endsWith(suffix)) {
      return kind.slice(0, -suffix.length).replace(/_/g, ' ').trim();
    }
  }
  return null;
}

/**
 * Generate the render body lines for a single node kind.
 * Uses heuristics based on field names to produce reasonable output.
 */
function generateRenderBody(node: NodeMeta, typeName: string): string[] {
  const lines: string[] = [];
  const cast = `n`;
  lines.push(`      const ${cast} = node as unknown as import('./types.js').${typeName};`);

  const fieldNames = node.fields.map((f) => f.name);
  const fieldSet = new Set(fieldNames);

  const keyword = kindToKeyword(node.kind);

  // Special case: source_file — just render children
  if (node.kind === 'source_file') {
    lines.push(`      if (!n.children) return '';`);
    lines.push(`      const items = Array.isArray(n.children) ? n.children as unknown[] : [n.children];`);
    lines.push(`      return items.map(renderChild).join('\\n\\n');`);
    return lines;
  }

  // Build parts array
  lines.push(`      const parts: string[] = [];`);

  // 1. Children as visibility/modifier prefix (common in Rust: struct, fn, enum, etc.)
  if (node.hasChildren && fieldSet.has('name')) {
    lines.push(`      if (n.children !== undefined) {`);
    lines.push(`        const ch = Array.isArray(n.children) ? (n.children as unknown[]).map(renderChild).join(' ') : renderChild(n.children);`);
    lines.push(`        if (ch) parts.push(ch);`);
    lines.push(`      }`);
  }

  // 2. Keyword from kind name
  if (keyword) {
    lines.push(`      parts.push('${keyword}');`);
  }

  // 3. Render fields in a heuristic order
  const orderedFields = orderFields(node.fields);

  for (const field of orderedFields) {
    const fn = toFieldName(field.name);
    if (field.name === 'body') {
      // Body gets special treatment — wrapped in braces
      lines.push(`      if (${cast}.${fn} !== undefined) {`);
      lines.push(`        parts.push('{');`);
      lines.push(`        parts.push(renderChild(${cast}.${fn}));`);
      lines.push(`        parts.push('}');`);
      lines.push(`      }`);
    } else if (field.name === 'parameters') {
      lines.push(`      parts.push('(' + (${cast}.${fn} !== undefined ? renderChild(${cast}.${fn}) : '') + ')');`);
    } else if (field.name === 'return_type') {
      lines.push(`      if (${cast}.${fn} !== undefined) parts.push('->', renderChild(${cast}.${fn}));`);
    } else if (field.name === 'type_parameters') {
      lines.push(`      if (${cast}.${fn} !== undefined) parts.push(renderChild(${cast}.${fn}));`);
    } else if (field.name === 'condition') {
      lines.push(`      if (${cast}.${fn} !== undefined) parts.push(renderChild(${cast}.${fn}));`);
    } else if (field.name === 'consequence') {
      lines.push(`      if (${cast}.${fn} !== undefined) {`);
      lines.push(`        parts.push('{', renderChild(${cast}.${fn}), '}');`);
      lines.push(`      }`);
    } else if (field.name === 'alternative') {
      lines.push(`      if (${cast}.${fn} !== undefined) {`);
      lines.push(`        const alt = renderChild(${cast}.${fn});`);
      lines.push(`        parts.push(alt.startsWith('if ') ? 'else ' + alt : 'else { ' + alt + ' }');`);
      lines.push(`      }`);
    } else if (field.name === 'left' || field.name === 'right' || field.name === 'operator' || field.name === 'value' || field.name === 'argument') {
      // Expressions: render inline without keyword wrapping
      lines.push(`      if (${cast}.${fn} !== undefined) parts.push(renderChild(${cast}.${fn}));`);
    } else if (field.name === 'trait') {
      lines.push(`      if (${cast}.${fn} !== undefined) parts.push(renderChild(${cast}.${fn}), 'for');`);
    } else if (field.name === 'macro') {
      // macro field for macro_invocation — render with !
      lines.push(`      if (${cast}.${fn} !== undefined) parts.push(renderChild(${cast}.${fn}) + '!');`);
    } else if (field.required || field.multiple) {
      lines.push(`      parts.push(renderChild(${cast}.${fn}));`);
    } else {
      lines.push(`      if (${cast}.${fn} !== undefined) parts.push(renderChild(${cast}.${fn}));`);
    }
  }

  // 4. Children (when not used as visibility prefix above)
  if (node.hasChildren && !fieldSet.has('name')) {
    lines.push(`      if (n.children !== undefined) {`);
    if (node.children?.multiple) {
      lines.push(`        const ch = Array.isArray(n.children) ? (n.children as unknown[]).map(renderChild).join(', ') : renderChild(n.children);`);
    } else {
      lines.push(`        const ch = renderChild(n.children);`);
    }
    lines.push(`        parts.push(ch);`);
    lines.push(`      }`);
  }

  lines.push(`      return parts.join(' ');`);
  return lines;
}

/**
 * Order fields for rendering. Puts well-known fields in a logical order,
 * then appends any remaining fields.
 */
function orderFields(fields: FieldMeta[]): FieldMeta[] {
  const priority: Record<string, number> = {
    macro: 0,
    left: 1,
    operator: 2,
    name: 3,
    type: 4,
    trait: 5,
    type_parameters: 6,
    parameters: 7,
    return_type: 8,
    argument: 9,
    pattern: 10,
    value: 11,
    condition: 12,
    consequence: 13,
    alternative: 14,
    right: 15,
    body: 100,   // body always last
  };

  return [...fields].sort((a, b) => {
    const pa = priority[a.name] ?? 50;
    const pb = priority[b.name] ?? 50;
    return pa - pb;
  });
}

export function emitRenderScaffold(config: EmitRenderScaffoldConfig): string {
  const { grammar, nodes } = config;
  const grammarTypeName = toGrammarTypeName(grammar);
  const grammarPrefix = grammarTypeName.slice(0, -5);
  const unionType = `${grammarPrefix}IrNode`;

  const lines: string[] = [];

  // Import the union type
  lines.push(`import type { ${unionType} } from './types.js';`);
  lines.push(`import { assertValid } from './validate-fast.js';`);
  lines.push('');

  // indent helper
  lines.push('/** Indent each line of `text` by `level` tabs. */');
  lines.push('export function indent(text: string, level = 1): string {');
  lines.push(`  const prefix = '\\t'.repeat(level);`);
  lines.push('  return text');
  lines.push("    .split('\\n')");
  lines.push('    .map((line) => (line.trim() ? prefix + line : line))');
  lines.push("    .join('\\n');");
  lines.push('}');
  lines.push('');

  // renderChild helper
  lines.push('/**');
  lines.push(' * Render a value that may be an IR node, a string, or an array.');
  lines.push(' * Used in composition patterns where children may already be rendered.');
  lines.push(' */');
  lines.push(`function renderChild(item: unknown): string {`);
  lines.push(`  if (typeof item === 'string') return item;`);
  lines.push(`  if (Array.isArray(item)) return item.map(renderChild).join(', ');`);
  lines.push(`  if (typeof item === 'object' && item !== null && 'kind' in item) {`);
  lines.push(`    return renderSilent(item as ${unionType});`);
  lines.push(`  }`);
  lines.push(`  return String(item);`);
  lines.push('}');
  lines.push('');

  // renderSilent function
  lines.push(`/** Render an IR node to source text (no validation). */`);
  lines.push(`export function renderSilent(node: ${unionType}): string {`);
  lines.push('  switch (node.kind) {');

  for (const nodeMeta of nodes) {
    const typeName = toTypeName(nodeMeta.kind);
    lines.push(`    case '${nodeMeta.kind}': {`);
    const bodyLines = generateRenderBody(nodeMeta, typeName);
    for (const line of bodyLines) {
      lines.push(line);
    }
    lines.push('    }');
  }

  lines.push('    default:');
  lines.push('      throw new Error(`Unknown node kind: ${(node as any).kind}`);');
  lines.push('  }');
  lines.push('}');
  lines.push('');

  // render function
  lines.push('/** Render an IR node to source text and validate the output. */');
  lines.push(`export function render(node: ${unionType}): string {`);
  lines.push('  return assertValid(renderSilent(node));');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}
