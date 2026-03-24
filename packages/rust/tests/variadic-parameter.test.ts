import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('variadic_parameter', () => {
  it('should build with correct kind', () => {
    const builder = ir.variadicParameter();
    const node = builder.build();
    expect(node.kind).toBe('variadic_parameter');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.variadicParameter();
    const cst = builder.toCST();
    expect(cst.type).toBe('variadic_parameter');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.variadicParameter();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
