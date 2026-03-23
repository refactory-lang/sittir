import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('match_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.matchStatement(ir.asPattern(ir.identifier('test')), ir.asPattern(ir.identifier('test')));
    const node = builder.build();
    expect(node.kind).toBe('match_statement');
    expect(Array.isArray((node as any).subject)).toBe(true);
    expect((node as any).subject.length).toBeGreaterThan(0);
    expect((node as any).subject[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.matchStatement(ir.asPattern(ir.identifier('test')), ir.asPattern(ir.identifier('test')));
    const source = builder.renderImpl();
    expect(source).toContain('match');
    expect(source).toContain(':');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.matchStatement(ir.asPattern(ir.identifier('test')), ir.asPattern(ir.identifier('test')));
    const cst = builder.toCST();
    expect(cst.type).toBe('match_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.matchStatement(ir.asPattern(ir.identifier('test')), ir.asPattern(ir.identifier('test')));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
