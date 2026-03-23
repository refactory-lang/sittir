import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('instantiation_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.instantiationExpression(ir.typeArguments(ir.callExpression(ir.import('test'))));
    const node = builder.build();
    expect(node.kind).toBe('instantiation_expression');
    expect((node as any).typeArguments).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.instantiationExpression(ir.typeArguments(ir.callExpression(ir.import('test'))));
    const cst = builder.toCST();
    expect(cst.type).toBe('instantiation_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.instantiationExpression(ir.typeArguments(ir.callExpression(ir.import('test'))));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
