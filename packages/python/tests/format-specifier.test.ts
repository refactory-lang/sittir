import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('format_specifier', () => {
  it('should build with correct kind', () => {
    const builder = ir.formatSpecifier();
    const node = builder.build();
    expect(node.kind).toBe('format_specifier');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.formatSpecifier();
    const cst = builder.toCST();
    expect(cst.type).toBe('format_specifier');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.formatSpecifier();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
