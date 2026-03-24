import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('tuple', () => {
  it('should build with correct kind', () => {
    const builder = ir.tuple();
    const node = builder.build();
    expect(node.kind).toBe('tuple');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.tuple();
    const cst = builder.toCST();
    expect(cst.type).toBe('tuple');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.tuple();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
