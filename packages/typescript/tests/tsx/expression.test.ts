import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('expression_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.expression(ir.jsx_self_closing_element());
    const node = builder.build();
    expect(node.kind).toBe('expression_statement');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.expression(ir.jsx_self_closing_element());
    const cst = builder.toCST();
    expect(cst.type).toBe('expression_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.expression(ir.jsx_self_closing_element());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
