import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('member_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.memberExpression(ir.yieldExpression());
    const node = builder.build();
    expect(node.kind).toBe('member_expression');
    expect((node as any).object).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.memberExpression(ir.yieldExpression());
    const source = builder.renderImpl();
    expect(source).toContain('.');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.memberExpression(ir.yieldExpression());
    const cst = builder.toCST();
    expect(cst.type).toBe('member_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.memberExpression(ir.yieldExpression());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
