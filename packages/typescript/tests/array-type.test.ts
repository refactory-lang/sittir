import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('array_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.arrayType(ir.existentialType());
    const node = builder.build();
    expect(node.kind).toBe('array_type');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.arrayType(ir.existentialType());
    const source = builder.renderImpl();
    expect(source).toContain('[');
    expect(source).toContain(']');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.arrayType(ir.existentialType());
    const cst = builder.toCST();
    expect(cst.type).toBe('array_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.arrayType(ir.existentialType());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
