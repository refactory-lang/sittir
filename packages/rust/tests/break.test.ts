import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('break_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.break();
    const node = builder.build();
    expect(node.kind).toBe('break_expression');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.break();
    const source = builder.renderImpl();
    expect(source).toContain('break');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.break();
    const cst = builder.toCST();
    expect(cst.type).toBe('break_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.break();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
