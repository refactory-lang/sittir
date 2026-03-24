import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('constrained_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.constrainedType(ir.type(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))), ir.type(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))));
    const node = builder.build();
    expect(node.kind).toBe('constrained_type');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.constrainedType(ir.type(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))), ir.type(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))));
    const source = builder.renderImpl();
    expect(source).toContain(':');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.constrainedType(ir.type(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))), ir.type(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))));
    const cst = builder.toCST();
    expect(cst.type).toBe('constrained_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.constrainedType(ir.type(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))), ir.type(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
