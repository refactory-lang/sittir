import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('export_specifier', () => {
  it('should build with correct kind', () => {
    const builder = ir.export_specifier(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('export_specifier');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.export_specifier(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('export_specifier');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.export_specifier(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
