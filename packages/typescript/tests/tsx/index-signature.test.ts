import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('index_signature', () => {
  it('should build with correct kind', () => {
    const builder = ir.index_signature(ir.adding_type_annotation(ir.identifier('test') as any));
    const node = builder.build();
    expect(node.kind).toBe('index_signature');
    expect((node as any).type).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.index_signature(ir.adding_type_annotation(ir.identifier('test') as any));
    const source = builder.renderImpl();
    expect(source).toContain('[');
    expect(source).toContain(':');
    expect(source).toContain(']');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.index_signature(ir.adding_type_annotation(ir.identifier('test') as any));
    const cst = builder.toCST();
    expect(cst.type).toBe('index_signature');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.index_signature(ir.adding_type_annotation(ir.identifier('test') as any));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
