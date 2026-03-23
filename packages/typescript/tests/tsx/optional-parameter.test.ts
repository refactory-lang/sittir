import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('optional_parameter', () => {
  it('should build with correct kind', () => {
    const builder = ir.optional_parameter();
    const node = builder.build();
    expect(node.kind).toBe('optional_parameter');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.optional_parameter();
    const cst = builder.toCST();
    expect(cst.type).toBe('optional_parameter');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.optional_parameter();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
