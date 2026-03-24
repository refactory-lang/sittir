import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('tuple_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.tupleExpression(ir.charLiteral('test'), ir.charLiteral('test'));
    const node = builder.build();
    expect(node.kind).toBe('tuple_expression');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.tupleExpression(ir.charLiteral('test'), ir.charLiteral('test'));
    const source = builder.renderImpl();
    expect(source).toContain('(');
    expect(source).toContain(',');
    expect(source).toContain(')');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.tupleExpression(ir.charLiteral('test'), ir.charLiteral('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('tuple_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.tupleExpression(ir.charLiteral('test'), ir.charLiteral('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
