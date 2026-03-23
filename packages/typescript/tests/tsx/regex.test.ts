import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('regex', () => {
  it('should build with correct kind', () => {
    const builder = ir.regex(ir.regexPattern('test'));
    const node = builder.build();
    expect(node.kind).toBe('regex');
    expect((node as any).pattern).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.regex(ir.regexPattern('test'));
    const source = builder.renderImpl();
    expect(source).toContain('/');
    expect(source).toContain('/');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.regex(ir.regexPattern('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('regex');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.regex(ir.regexPattern('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
