import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('use_as_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.use_as_clause(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('use_as_clause');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.use_as_clause(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('as');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.use_as_clause(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('use_as_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.use_as_clause(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
