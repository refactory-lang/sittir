import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('class', () => {
  it('should build with correct kind', () => {
    const builder = ir.class(ir.classBody());
    const node = builder.build();
    expect(node.kind).toBe('class');
    expect((node as any).body).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.class(ir.classBody());
    const source = builder.renderImpl();
    expect(source).toContain('class');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.class(ir.classBody());
    const cst = builder.toCST();
    expect(cst.type).toBe('class');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.class(ir.classBody());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
