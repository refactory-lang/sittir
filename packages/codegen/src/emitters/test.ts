/**
 * Emits a test file for a single IR node kind.
 * Tests use the builder-only API and verify:
 * 1. build() produces the correct kind
 * 2. renderImpl() contains required grammar tokens
 * 3. toCST() produces a valid CST node
 * 4. render('fast') passes brace/paren/bracket validation
 */

import type { NodeMeta } from '../grammar-reader.ts';
import { collectRequiredTokens } from '../grammar-reader.ts';
import { toShortName } from '../naming.ts';

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

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function emitTest(config: EmitTestConfig): string {
  const { grammar, node } = config;
  const shortName = toShortName(node.kind);

  const irKey = config.irPropertyKey ?? (shortName.endsWith('_') ? shortName.slice(0, -1) : shortName);

  const ctorKind = needsConstructorArg(node);
  const ctorArg = ctorKind === 'multiple'
    ? 'ir.identifier(\'a\'), ir.identifier(\'b\')'
    : ctorKind === 'single'
      ? 'ir.identifier(\'test\')'
      : '';

  const requiredTokens = collectRequiredTokens(grammar, node.kind);

  const lines: string[] = [];

  lines.push(`import { describe, it, expect } from 'vitest';`);
  lines.push(`import { ir } from '../src/builder.js';`);
  lines.push('');

  lines.push(`describe('${node.kind}', () => {`);

  // Build test
  lines.push(`  it('should build with correct kind', () => {`);
  lines.push(`    const builder = ir.${irKey}(${ctorArg});`);
  lines.push(`    const node = builder.build();`);
  lines.push(`    expect(node.kind).toBe('${node.kind}');`);
  lines.push('  });');
  lines.push('');

  // Token assertion test
  if (requiredTokens.length > 0) {
    lines.push(`  it('should render required grammar tokens', () => {`);
    lines.push(`    const builder = ir.${irKey}(${ctorArg});`);
    lines.push(`    const source = builder.renderImpl();`);
    for (const token of requiredTokens) {
      lines.push(`    expect(source).toContain('${escapeString(token)}');`);
    }
    lines.push('  });');
    lines.push('');
  }

  // CST test
  lines.push(`  it('should produce a valid CST node', () => {`);
  lines.push(`    const builder = ir.${irKey}(${ctorArg});`);
  lines.push(`    const cst = builder.toCST();`);
  lines.push(`    expect(cst.type).toBe('${node.kind}');`);
  lines.push(`    expect(cst.isNamed).toBe(true);`);
  lines.push(`    expect(cst.startIndex).toBe(0);`);
  lines.push(`    expect(cst.endIndex).toBe(cst.text.length);`);
  lines.push('  });');
  lines.push('');

  // Fast validation test
  lines.push(`  it('should pass fast validation', () => {`);
  lines.push(`    const builder = ir.${irKey}(${ctorArg});`);
  lines.push(`    expect(() => builder.render('fast')).not.toThrow();`);
  lines.push('  });');

  lines.push('});');
  lines.push('');

  return lines.join('\n');
}
