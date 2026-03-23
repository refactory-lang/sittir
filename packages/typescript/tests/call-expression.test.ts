import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('call_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.callExpression(ir.yieldExpression());
    const node = builder.build();
    expect(node.kind).toBe('call_expression');
    expect((node as any).function).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.callExpression(ir.yieldExpression());
    const cst = builder.toCST();
    expect(cst.type).toBe('call_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.callExpression(ir.yieldExpression());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
