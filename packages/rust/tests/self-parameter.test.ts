import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('self_parameter', () => {
  it('should build with correct kind', () => {
    const builder = ir.selfParameter(ir.mutableSpecifier(), ir.mutableSpecifier());
    const node = builder.build();
    expect(node.kind).toBe('self_parameter');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.selfParameter(ir.mutableSpecifier(), ir.mutableSpecifier());
    const cst = builder.toCST();
    expect(cst.type).toBe('self_parameter');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.selfParameter(ir.mutableSpecifier(), ir.mutableSpecifier());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
