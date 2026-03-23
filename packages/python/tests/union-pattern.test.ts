import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('union_pattern', () => {
  it('should build with correct kind', () => {
    const builder = ir.unionPattern();
    const node = builder.build();
    expect(node.kind).toBe('union_pattern');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.unionPattern();
    const cst = builder.toCST();
    expect(cst.type).toBe('union_pattern');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.unionPattern();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
