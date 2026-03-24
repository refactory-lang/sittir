import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('await_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.awaitExpression(ir.charLiteral('test'));
    const node = builder.build();
    expect(node.kind).toBe('await_expression');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.awaitExpression(ir.charLiteral('test'));
    const source = builder.renderImpl();
    expect(source).toContain('.');
    expect(source).toContain('await');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.awaitExpression(ir.charLiteral('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('await_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.awaitExpression(ir.charLiteral('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
