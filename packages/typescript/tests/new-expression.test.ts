import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('new_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.newExpression(ir.false('test'));
    const node = builder.build();
    expect(node.kind).toBe('new_expression');
    expect((node as any).constructor).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.newExpression(ir.false('test'));
    const source = builder.renderImpl();
    expect(source).toContain('new');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.newExpression(ir.false('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('new_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.newExpression(ir.false('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
