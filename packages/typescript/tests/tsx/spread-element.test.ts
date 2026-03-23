import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('spread_element', () => {
  it('should build with correct kind', () => {
    const builder = ir.spread_element(ir.jsx_self_closing_element());
    const node = builder.build();
    expect(node.kind).toBe('spread_element');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.spread_element(ir.jsx_self_closing_element());
    const source = builder.renderImpl();
    expect(source).toContain('...');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.spread_element(ir.jsx_self_closing_element());
    const cst = builder.toCST();
    expect(cst.type).toBe('spread_element');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.spread_element(ir.jsx_self_closing_element());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
