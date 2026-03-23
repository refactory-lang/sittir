import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('binary_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.binaryExpression(ir.privatePropertyIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('binary_expression');
    expect((node as any).left).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.binaryExpression(ir.privatePropertyIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('binary_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.binaryExpression(ir.privatePropertyIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
