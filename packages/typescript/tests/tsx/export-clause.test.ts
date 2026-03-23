import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('export_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.export_clause();
    const node = builder.build();
    expect(node.kind).toBe('export_clause');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.export_clause();
    const cst = builder.toCST();
    expect(cst.type).toBe('export_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.export_clause();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
