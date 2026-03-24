import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('parenthesized_list_splat', () => {
  it('should build with correct kind', () => {
    const builder = ir.parenthesizedListSplat(ir.parenthesizedExpression(ir.yield()));
    const node = builder.build();
    expect(node.kind).toBe('parenthesized_list_splat');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.parenthesizedListSplat(ir.parenthesizedExpression(ir.yield()));
    const source = builder.renderImpl();
    expect(source).toContain('(');
    expect(source).toContain(')');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.parenthesizedListSplat(ir.parenthesizedExpression(ir.yield()));
    const cst = builder.toCST();
    expect(cst.type).toBe('parenthesized_list_splat');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.parenthesizedListSplat(ir.parenthesizedExpression(ir.yield()));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
