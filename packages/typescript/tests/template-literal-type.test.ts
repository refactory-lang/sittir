import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('template_literal_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.templateLiteralType();
    const node = builder.build();
    expect(node.kind).toBe('template_literal_type');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.templateLiteralType();
    const cst = builder.toCST();
    expect(cst.type).toBe('template_literal_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.templateLiteralType();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
