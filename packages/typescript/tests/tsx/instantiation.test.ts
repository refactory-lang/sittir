import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('instantiation_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.instantiation(ir.type_arguments(ir.identifier('test') as any));
    const node = builder.build();
    expect(node.kind).toBe('instantiation_expression');
    expect((node as any).typeArguments).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.instantiation(ir.type_arguments(ir.identifier('test') as any));
    const cst = builder.toCST();
    expect(cst.type).toBe('instantiation_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.instantiation(ir.type_arguments(ir.identifier('test') as any));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
