import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('expression_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.expressionStatement(ir.assignment(ir.identifier('test')), ir.assignment(ir.identifier('test')));
    const node = builder.build();
    expect(node.kind).toBe('expression_statement');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.expressionStatement(ir.assignment(ir.identifier('test')), ir.assignment(ir.identifier('test')));
    const cst = builder.toCST();
    expect(cst.type).toBe('expression_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.expressionStatement(ir.assignment(ir.identifier('test')), ir.assignment(ir.identifier('test')));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
