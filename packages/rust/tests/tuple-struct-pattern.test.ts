import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('tuple_struct_pattern', () => {
  it('should build with correct kind', () => {
    const builder = ir.tupleStructPattern(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('tuple_struct_pattern');
    expect((node as any).type).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.tupleStructPattern(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('(');
    expect(source).toContain(')');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.tupleStructPattern(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('tuple_struct_pattern');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.tupleStructPattern(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
