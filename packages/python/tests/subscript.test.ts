import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('subscript', () => {
  it('should build with correct kind', () => {
    const builder = ir.subscript(ir.ellipsis('test'));
    const node = builder.build();
    expect(node.kind).toBe('subscript');
    expect((node as any).value).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.subscript(ir.ellipsis('test'));
    const source = builder.renderImpl();
    expect(source).toContain('[');
    expect(source).toContain(']');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.subscript(ir.ellipsis('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('subscript');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.subscript(ir.ellipsis('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
