import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('formal_parameters', () => {
  it('should build with correct kind', () => {
    const builder = ir.formal_parameters();
    const node = builder.build();
    expect(node.kind).toBe('formal_parameters');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.formal_parameters();
    const cst = builder.toCST();
    expect(cst.type).toBe('formal_parameters');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.formal_parameters();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
