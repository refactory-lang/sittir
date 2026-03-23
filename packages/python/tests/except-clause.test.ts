import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('except_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.exceptClause(ir.block());
    const node = builder.build();
    expect(node.kind).toBe('except_clause');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.exceptClause(ir.block());
    const source = builder.renderImpl();
    expect(source).toContain('except');
    expect(source).toContain(':');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.exceptClause(ir.block());
    const cst = builder.toCST();
    expect(cst.type).toBe('except_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.exceptClause(ir.block());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
