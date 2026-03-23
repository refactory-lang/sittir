import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('unsafe_block', () => {
  it('should build with correct kind', () => {
    const builder = ir.unsafeBlock(ir.identifier('test') as any);
    const node = builder.build();
    expect(node.kind).toBe('unsafe_block');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.unsafeBlock(ir.identifier('test') as any);
    const source = builder.renderImpl();
    expect(source).toContain('unsafe');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.unsafeBlock(ir.identifier('test') as any);
    const cst = builder.toCST();
    expect(cst.type).toBe('unsafe_block');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.unsafeBlock(ir.identifier('test') as any);
    expect(() => builder.render('fast')).not.toThrow();
  });
});
