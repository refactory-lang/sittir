import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('enum_variant_list', () => {
  it('should build with correct kind', () => {
    const builder = ir.enum_variant_list();
    const node = builder.build();
    expect(node.kind).toBe('enum_variant_list');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.enum_variant_list();
    const source = builder.renderImpl();
    expect(source).toContain('{');
    expect(source).toContain('}');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.enum_variant_list();
    const cst = builder.toCST();
    expect(cst.type).toBe('enum_variant_list');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.enum_variant_list();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
