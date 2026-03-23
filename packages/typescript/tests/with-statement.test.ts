import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('with_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.withStatement(ir.parenthesizedExpression(ir.asExpression(ir.asExpression(ir.asExpression(ir.identifier('test') as any)))));
    const node = builder.build();
    expect(node.kind).toBe('with_statement');
    expect((node as any).object).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.withStatement(ir.parenthesizedExpression(ir.asExpression(ir.asExpression(ir.asExpression(ir.identifier('test') as any)))));
    const source = builder.renderImpl();
    expect(source).toContain('with');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.withStatement(ir.parenthesizedExpression(ir.asExpression(ir.asExpression(ir.asExpression(ir.identifier('test') as any)))));
    const cst = builder.toCST();
    expect(cst.type).toBe('with_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.withStatement(ir.parenthesizedExpression(ir.asExpression(ir.asExpression(ir.asExpression(ir.identifier('test') as any)))));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
