import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('throw_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.throwStatement(ir.yieldExpression());
    const node = builder.build();
    expect(node.kind).toBe('throw_statement');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.throwStatement(ir.yieldExpression());
    const source = builder.renderImpl();
    expect(source).toContain('throw');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.throwStatement(ir.yieldExpression());
    const cst = builder.toCST();
    expect(cst.type).toBe('throw_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.throwStatement(ir.yieldExpression());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
