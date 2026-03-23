import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('rest_pattern', () => {
  it('should build with correct kind', () => {
    const builder = ir.restPattern(ir.undefined('test'), ir.undefined('test'));
    const node = builder.build();
    expect(node.kind).toBe('rest_pattern');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.restPattern(ir.undefined('test'), ir.undefined('test'));
    const source = builder.renderImpl();
    expect(source).toContain('...');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.restPattern(ir.undefined('test'), ir.undefined('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('rest_pattern');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.restPattern(ir.undefined('test'), ir.undefined('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
