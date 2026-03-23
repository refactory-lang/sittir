import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('function_modifiers', () => {
  it('should build with correct kind', () => {
    const builder = ir.function_modifiers();
    const node = builder.build();
    expect(node.kind).toBe('function_modifiers');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.function_modifiers();
    const source = builder.renderImpl();
    expect(source).toContain('async');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.function_modifiers();
    const cst = builder.toCST();
    expect(cst.type).toBe('function_modifiers');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.function_modifiers();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
