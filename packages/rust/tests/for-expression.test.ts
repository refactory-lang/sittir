import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('for_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.forExpression(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('for_expression');
    expect((node as any).pattern).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.forExpression(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('for');
    expect(source).toContain('in');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.forExpression(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('for_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.forExpression(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
