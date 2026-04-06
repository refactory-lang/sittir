import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('program', () => {
  it('should build with correct kind', () => {
    const builder = ir.file();
    const node = builder.build();
    expect(node.kind).toBe('program');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.file();
    const cst = builder.toCST();
    expect(cst.type).toBe('program');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.file();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
