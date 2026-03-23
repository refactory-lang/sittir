import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('ternary_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.ternary(ir.jsx_self_closing_element());
    const node = builder.build();
    expect(node.kind).toBe('ternary_expression');
    expect((node as any).condition).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.ternary(ir.jsx_self_closing_element());
    const source = builder.renderImpl();
    expect(source).toContain(':');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.ternary(ir.jsx_self_closing_element());
    const cst = builder.toCST();
    expect(cst.type).toBe('ternary_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.ternary(ir.jsx_self_closing_element());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
