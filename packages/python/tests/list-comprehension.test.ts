import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('list_comprehension', () => {
  it('should build with correct kind', () => {
    const builder = ir.listComprehension(ir.asPattern(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))));
    const node = builder.build();
    expect(node.kind).toBe('list_comprehension');
    expect((node as any).body).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.listComprehension(ir.asPattern(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))));
    const source = builder.renderImpl();
    expect(source).toContain('[');
    expect(source).toContain(']');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.listComprehension(ir.asPattern(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))));
    const cst = builder.toCST();
    expect(cst.type).toBe('list_comprehension');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.listComprehension(ir.asPattern(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
