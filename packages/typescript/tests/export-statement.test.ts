import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('export_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.exportStatement();
    const node = builder.build();
    expect(node.kind).toBe('export_statement');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.exportStatement();
    const cst = builder.toCST();
    expect(cst.type).toBe('export_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.exportStatement();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
