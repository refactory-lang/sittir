import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('dict_pattern', () => {
  it('should build with correct kind', () => {
    const builder = ir.dictPattern();
    const node = builder.build();
    expect(node.kind).toBe('dict_pattern');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.dictPattern();
    const cst = builder.toCST();
    expect(cst.type).toBe('dict_pattern');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.dictPattern();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
