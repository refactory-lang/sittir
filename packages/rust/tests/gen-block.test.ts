import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('gen_block', () => {
  it('should build with correct kind', () => {
    const builder = ir.genBlock(ir.block());
    const node = builder.build();
    expect(node.kind).toBe('gen_block');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.genBlock(ir.block());
    const source = builder.renderImpl();
    expect(source).toContain('gen');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.genBlock(ir.block());
    const cst = builder.toCST();
    expect(cst.type).toBe('gen_block');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.genBlock(ir.block());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
