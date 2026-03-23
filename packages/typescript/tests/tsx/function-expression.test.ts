import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('function_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.functionExpression(ir.formal_parameters());
    const node = builder.build();
    expect(node.kind).toBe('function_expression');
    expect((node as any).parameters).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.functionExpression(ir.formal_parameters());
    const source = builder.renderImpl();
    expect(source).toContain('function');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.functionExpression(ir.formal_parameters());
    const cst = builder.toCST();
    expect(cst.type).toBe('function_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.functionExpression(ir.formal_parameters());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
