import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('format_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.formatExpression(ir.asPattern(ir.identifier('test')));
    const node = builder.build();
    expect(node.kind).toBe('format_expression');
    expect((node as any).expression).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.formatExpression(ir.asPattern(ir.identifier('test')));
    const cst = builder.toCST();
    expect(cst.type).toBe('format_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.formatExpression(ir.asPattern(ir.identifier('test')));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
