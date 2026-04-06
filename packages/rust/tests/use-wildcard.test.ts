import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('use_wildcard', () => {
  it('should build with correct kind', () => {
    const builder = ir.use_wildcard();
    const node = builder.build();
    expect(node.kind).toBe('use_wildcard');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.use_wildcard();
    const source = builder.renderImpl();
    expect(source).toContain('*');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.use_wildcard();
    const cst = builder.toCST();
    expect(cst.type).toBe('use_wildcard');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.use_wildcard();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
