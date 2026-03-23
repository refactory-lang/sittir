import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('enum_variant_list', () => {
  it('should build with correct kind', () => {
    const builder = ir.enumVariantList();
    const node = builder.build();
    expect(node.kind).toBe('enum_variant_list');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.enumVariantList();
    const cst = builder.toCST();
    expect(cst.type).toBe('enum_variant_list');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.enumVariantList();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
