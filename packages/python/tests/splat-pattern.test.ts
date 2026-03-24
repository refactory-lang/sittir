import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('splat_pattern', () => {
  it('should build with correct kind', () => {
    const builder = ir.splatPattern();
    const node = builder.build();
    expect(node.kind).toBe('splat_pattern');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.splatPattern();
    const cst = builder.toCST();
    expect(cst.type).toBe('splat_pattern');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.splatPattern();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
