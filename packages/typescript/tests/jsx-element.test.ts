import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('jsx_element', () => {
  it('should build with correct kind', () => {
    const builder = ir.jsxElement(ir.identifier('test') as any);
    const node = builder.build();
    expect(node.kind).toBe('jsx_element');
    expect((node as any).openTag).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.jsxElement(ir.identifier('test') as any);
    const cst = builder.toCST();
    expect(cst.type).toBe('jsx_element');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.jsxElement(ir.identifier('test') as any);
    expect(() => builder.render('fast')).not.toThrow();
  });
});
