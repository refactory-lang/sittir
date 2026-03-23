import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('catch_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.catch_clause(ir.statement_block());
    const node = builder.build();
    expect(node.kind).toBe('catch_clause');
    expect((node as any).body).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.catch_clause(ir.statement_block());
    const source = builder.renderImpl();
    expect(source).toContain('catch');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.catch_clause(ir.statement_block());
    const cst = builder.toCST();
    expect(cst.type).toBe('catch_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.catch_clause(ir.statement_block());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
