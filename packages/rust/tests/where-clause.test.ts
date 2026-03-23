import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('where_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.where_clause();
    const node = builder.build();
    expect(node.kind).toBe('where_clause');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.where_clause();
    const source = builder.renderImpl();
    expect(source).toContain('where');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.where_clause();
    const cst = builder.toCST();
    expect(cst.type).toBe('where_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.where_clause();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
