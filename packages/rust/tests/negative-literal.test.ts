import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('negative_literal', () => {
  it('should build with correct kind', () => {
    const builder = ir.negative_literal(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('negative_literal');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.negative_literal(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('-');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.negative_literal(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('negative_literal');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.negative_literal(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
