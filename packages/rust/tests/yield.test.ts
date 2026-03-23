import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('yield_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.yield();
    const node = builder.build();
    expect(node.kind).toBe('yield_expression');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.yield();
    const source = builder.renderImpl();
    expect(source).toContain('yield');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.yield();
    const cst = builder.toCST();
    expect(cst.type).toBe('yield_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.yield();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
