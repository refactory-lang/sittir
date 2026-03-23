import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('as_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.as(ir.identifier('a'), ir.identifier('b'));
    const node = builder.build();
    expect(node.kind).toBe('as_expression');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.as(ir.identifier('a'), ir.identifier('b'));
    const source = builder.renderImpl();
    expect(source).toContain('as');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.as(ir.identifier('a'), ir.identifier('b'));
    const cst = builder.toCST();
    expect(cst.type).toBe('as_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.as(ir.identifier('a'), ir.identifier('b'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
