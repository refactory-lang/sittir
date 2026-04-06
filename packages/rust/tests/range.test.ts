import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('range_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.range();
    const node = builder.build();
    expect(node.kind).toBe('range_expression');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.range();
    const source = builder.renderImpl();
    expect(source).toContain('..');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.range();
    const cst = builder.toCST();
    expect(cst.type).toBe('range_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.range();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
