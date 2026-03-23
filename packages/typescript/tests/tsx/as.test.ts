import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('as_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.as(ir.jsx_self_closing_element(), ir.jsx_self_closing_element());
    const node = builder.build();
    expect(node.kind).toBe('as_expression');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.as(ir.jsx_self_closing_element(), ir.jsx_self_closing_element());
    const source = builder.renderImpl();
    expect(source).toContain('as');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.as(ir.jsx_self_closing_element(), ir.jsx_self_closing_element());
    const cst = builder.toCST();
    expect(cst.type).toBe('as_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.as(ir.jsx_self_closing_element(), ir.jsx_self_closing_element());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
