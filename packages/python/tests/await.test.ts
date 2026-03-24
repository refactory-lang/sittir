import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('await', () => {
  it('should build with correct kind', () => {
    const builder = ir.await(ir.ellipsis());
    const node = builder.build();
    expect(node.kind).toBe('await');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.await(ir.ellipsis());
    const source = builder.renderImpl();
    expect(source).toContain('await');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.await(ir.ellipsis());
    const cst = builder.toCST();
    expect(cst.type).toBe('await');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.await(ir.ellipsis());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
