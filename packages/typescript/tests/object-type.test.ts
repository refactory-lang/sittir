import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('object_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.objectType();
    const node = builder.build();
    expect(node.kind).toBe('object_type');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.objectType();
    const cst = builder.toCST();
    expect(cst.type).toBe('object_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.objectType();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
