import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('lifetime_parameter', () => {
  it('should build with correct kind', () => {
    const builder = ir.lifetimeParameter(ir.identifier('test') as any);
    const node = builder.build();
    expect(node.kind).toBe('lifetime_parameter');
    expect((node as any).name).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.lifetimeParameter(ir.identifier('test') as any);
    const cst = builder.toCST();
    expect(cst.type).toBe('lifetime_parameter');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.lifetimeParameter(ir.identifier('test') as any);
    expect(() => builder.render('fast')).not.toThrow();
  });
});
