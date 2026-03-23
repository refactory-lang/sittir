import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('object_pattern', () => {
  it('should build with correct kind', () => {
    const builder = ir.object_pattern();
    const node = builder.build();
    expect(node.kind).toBe('object_pattern');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.object_pattern();
    const cst = builder.toCST();
    expect(cst.type).toBe('object_pattern');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.object_pattern();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
