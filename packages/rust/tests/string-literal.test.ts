import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('string_literal', () => {
  it('should build with correct kind', () => {
    const builder = ir.string_literal();
    const node = builder.build();
    expect(node.kind).toBe('string_literal');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.string_literal();
    const source = builder.renderImpl();
    expect(source).toContain('"');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.string_literal();
    const cst = builder.toCST();
    expect(cst.type).toBe('string_literal');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.string_literal();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
