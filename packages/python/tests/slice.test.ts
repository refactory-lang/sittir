import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('slice', () => {
  it('should build with correct kind', () => {
    const builder = ir.slice();
    const node = builder.build();
    expect(node.kind).toBe('slice');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.slice();
    const cst = builder.toCST();
    expect(cst.type).toBe('slice');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.slice();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
