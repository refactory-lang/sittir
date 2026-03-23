import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('unary_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.unary(ir.jsx_self_closing_element());
    const node = builder.build();
    expect(node.kind).toBe('unary_expression');
    expect((node as any).argument).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.unary(ir.jsx_self_closing_element());
    const cst = builder.toCST();
    expect(cst.type).toBe('unary_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.unary(ir.jsx_self_closing_element());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
