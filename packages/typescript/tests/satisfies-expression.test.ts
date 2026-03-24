import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('satisfies_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.satisfiesExpression(ir.yieldExpression(), ir.yieldExpression());
    const node = builder.build();
    expect(node.kind).toBe('satisfies_expression');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.satisfiesExpression(ir.yieldExpression(), ir.yieldExpression());
    const source = builder.renderImpl();
    expect(source).toContain('satisfies');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.satisfiesExpression(ir.yieldExpression(), ir.yieldExpression());
    const cst = builder.toCST();
    expect(cst.type).toBe('satisfies_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.satisfiesExpression(ir.yieldExpression(), ir.yieldExpression());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
