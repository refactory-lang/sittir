import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('finally_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.finally_clause(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('finally_clause');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.finally_clause(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('finally');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.finally_clause(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('finally_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.finally_clause(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
