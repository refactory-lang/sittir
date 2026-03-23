import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('generic_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.genericType(ir.identifier('test'), ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('generic_type');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.genericType(ir.identifier('test'), ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('generic_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.genericType(ir.identifier('test'), ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
