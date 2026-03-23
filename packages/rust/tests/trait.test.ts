import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('trait_item', () => {
  it('should build with correct kind', () => {
    const builder = ir.trait(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('trait_item');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.trait(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('trait');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.trait(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('trait_item');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.trait(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
