import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('for_in_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.forInClause(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('for_in_clause');
    expect((node as any).left).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.forInClause(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('for');
    expect(source).toContain('in');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.forInClause(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('for_in_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.forInClause(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
