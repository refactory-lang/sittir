import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('class_heritage', () => {
  it('should build with correct kind', () => {
    const builder = ir.class_heritage(ir.extends_clause(ir.jsx_self_closing_element()), ir.extends_clause(ir.jsx_self_closing_element()));
    const node = builder.build();
    expect(node.kind).toBe('class_heritage');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.class_heritage(ir.extends_clause(ir.jsx_self_closing_element()), ir.extends_clause(ir.jsx_self_closing_element()));
    const cst = builder.toCST();
    expect(cst.type).toBe('class_heritage');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.class_heritage(ir.extends_clause(ir.jsx_self_closing_element()), ir.extends_clause(ir.jsx_self_closing_element()));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
