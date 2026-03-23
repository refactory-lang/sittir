/**
 * Emits a test file for a single IR node kind.
 * Tests use the builder-only API (no factory functions, no string fields).
 */

import type { NodeMeta } from '../grammar-reader.ts';
import { toShortName, toFileName } from '../naming.ts';

export interface EmitTestConfig {
  grammar: string;
  node: NodeMeta;
  fileName?: string;
  irPropertyKey?: string;
}

function needsConstructorArg(node: NodeMeta): 'single' | 'multiple' | null {
  const requiredFields = node.fields.filter((f) => f.required);
  const nameField = requiredFields.find((f) => f.name === 'name');
  if (nameField) return nameField.multiple ? 'multiple' : 'single';
  const argField = requiredFields.find((f) => f.name === 'argument');
  if (argField) return argField.multiple ? 'multiple' : 'single';
  if (requiredFields.length > 0) {
    const f = requiredFields[0]!;
    return f.multiple ? 'multiple' : 'single';
  }
  if (node.hasChildren && node.children?.required) {
    return node.children.multiple ? 'multiple' : 'single';
  }
  return null;
}

export function emitTest(config: EmitTestConfig): string {
  const { node } = config;
  const shortName = toShortName(node.kind);

  const irKey = config.irPropertyKey ?? (shortName.endsWith('_') ? shortName.slice(0, -1) : shortName);

  const ctorKind = needsConstructorArg(node);
  const ctorArg = ctorKind === 'multiple'
    ? '[ir.identifier(\'test\')]'
    : ctorKind === 'single'
      ? 'ir.identifier(\'test\')'
      : '';

  const lines: string[] = [];

  lines.push(`import { describe, it, expect } from 'vitest';`);
  lines.push(`import { ir } from '../src/builder.js';`);
  lines.push('');

  lines.push(`describe('${node.kind}', () => {`);

  // Builder + render test
  lines.push(`  it('should create a ${node.kind} node via builder', () => {`);
  lines.push(`    const builder = ir.${irKey}(${ctorArg});`);
  lines.push(`    const node = builder.build();`);
  lines.push(`    expect(node.kind).toBe('${node.kind}');`);
  lines.push('  });');
  lines.push('');

  // Render test
  lines.push(`  it('should render without throwing', () => {`);
  lines.push(`    const builder = ir.${irKey}(${ctorArg});`);
  lines.push(`    const source = builder.renderImpl();`);
  lines.push(`    expect(typeof source).toBe('string');`);
  lines.push('  });');

  lines.push('});');
  lines.push('');

  return lines.join('\n');
}
