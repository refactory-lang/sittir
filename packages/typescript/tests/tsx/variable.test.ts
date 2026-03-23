import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('variable_declaration', () => {
  it('should build with correct kind', () => {
    const builder = ir.variable(ir.variable_declarator(ir.identifier('test')), ir.variable_declarator(ir.identifier('test')));
    const node = builder.build();
    expect(node.kind).toBe('variable_declaration');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.variable(ir.variable_declarator(ir.identifier('test')), ir.variable_declarator(ir.identifier('test')));
    const source = builder.renderImpl();
    expect(source).toContain('var');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.variable(ir.variable_declarator(ir.identifier('test')), ir.variable_declarator(ir.identifier('test')));
    const cst = builder.toCST();
    expect(cst.type).toBe('variable_declaration');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.variable(ir.variable_declarator(ir.identifier('test')), ir.variable_declarator(ir.identifier('test')));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
