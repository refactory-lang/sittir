import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('if_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.ifExpression(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('if_expression');
    expect((node as any).condition).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.ifExpression(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('if');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.ifExpression(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('if_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.ifExpression(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
