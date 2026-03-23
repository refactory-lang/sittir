import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('else_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.elseClause(ir.block());
    const node = builder.build();
    expect(node.kind).toBe('else_clause');
    expect((node as any).body).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.elseClause(ir.block());
    const source = builder.renderImpl();
    expect(source).toContain('else');
    expect(source).toContain(':');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.elseClause(ir.block());
    const cst = builder.toCST();
    expect(cst.type).toBe('else_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.elseClause(ir.block());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
