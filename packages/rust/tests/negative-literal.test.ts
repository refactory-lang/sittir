import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('negative_literal', () => {
  it('should build with correct kind', () => {
    const builder = ir.negativeLiteral(ir.floatLiteral('test'));
    const node = builder.build();
    expect(node.kind).toBe('negative_literal');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.negativeLiteral(ir.floatLiteral('test'));
    const source = builder.renderImpl();
    expect(source).toContain('-');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.negativeLiteral(ir.floatLiteral('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('negative_literal');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.negativeLiteral(ir.floatLiteral('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
