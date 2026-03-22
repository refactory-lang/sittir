/**
 * Emits a test file for a single IR node kind.
 */

import type { NodeMeta } from '../grammar-reader.ts';
import { toFactoryName, toShortName, toFileName } from '../naming.ts';

export interface EmitTestConfig {
  grammar: string;
  node: NodeMeta;
}

export function emitTest(config: EmitTestConfig): string {
  const { grammar, node } = config;
  const factoryName = toFactoryName(node.kind);
  const shortName = toShortName(node.kind);
  const fileName = toFileName(node.kind);

  // Build minimal config placeholder from required fields
  const requiredFields = node.fields.filter((f) => f.required);
  const minimalConfig = requiredFields.length > 0
    ? requiredFields.map((f) => `\t\t\t${f.name}: '' /* TODO */,`).join('\n')
    : `\t\t\t/* TODO: add required fields */`;

  const lines: string[] = [];

  lines.push(`import { describe, it, expect } from 'vitest';`);
  lines.push(`import { ${factoryName} } from '../src/nodes/${fileName}.js';`);
  lines.push(`import { ir } from '../src/fluent.js';`);
  lines.push('');

  lines.push(`describe('${node.kind}', () => {`);

  // Build test (factory)
  lines.push(`  it('should create a ${node.kind} node via factory', () => {`);
  lines.push(`    const node = ${factoryName}({`);
  lines.push(minimalConfig);
  lines.push('    });');
  lines.push(`    expect(node.kind).toBe('${node.kind}');`);
  lines.push('  });');
  lines.push('');

  // Fluent API build test
  lines.push(`  it('should create a ${node.kind} node via fluent API', () => {`);
  lines.push(`    const builder = ir.${shortName}(/* TODO: args */);`);
  lines.push(`    const node = builder.build();`);
  lines.push(`    expect(node.kind).toBe('${node.kind}');`);
  lines.push('  });');
  lines.push('');

  // Kind check
  lines.push(`  it('should have the correct kind', () => {`);
  lines.push(`    const node = ${factoryName}({`);
  lines.push(minimalConfig);
  lines.push('    });');
  lines.push(`    expect(node.kind).toBe('${node.kind}');`);
  lines.push('  });');

  lines.push('});');
  lines.push('');

  return lines.join('\n');
}
