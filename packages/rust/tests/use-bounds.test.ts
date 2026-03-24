import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('use_bounds', () => {
  it('should build with correct kind', () => {
    const builder = ir.useBounds();
    const node = builder.build();
    expect(node.kind).toBe('use_bounds');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.useBounds();
    const cst = builder.toCST();
    expect(cst.type).toBe('use_bounds');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.useBounds();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
