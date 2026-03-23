import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('use_bounds', () => {
  it('should build with correct kind', () => {
    const builder = ir.use_bounds();
    const node = builder.build();
    expect(node.kind).toBe('use_bounds');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.use_bounds();
    const source = builder.renderImpl();
    expect(source).toContain('use');
    expect(source).toContain('<');
    expect(source).toContain('>');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.use_bounds();
    const cst = builder.toCST();
    expect(cst.type).toBe('use_bounds');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.use_bounds();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
