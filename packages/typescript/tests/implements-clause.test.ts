import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('implements_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.implementsClause(ir.identifier('test') as any, ir.identifier('test') as any);
    const node = builder.build();
    expect(node.kind).toBe('implements_clause');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.implementsClause(ir.identifier('test') as any, ir.identifier('test') as any);
    const source = builder.renderImpl();
    expect(source).toContain('implements');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.implementsClause(ir.identifier('test') as any, ir.identifier('test') as any);
    const cst = builder.toCST();
    expect(cst.type).toBe('implements_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.implementsClause(ir.identifier('test') as any, ir.identifier('test') as any);
    expect(() => builder.render('fast')).not.toThrow();
  });
});
