import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('lambda_parameters', () => {
  it('should build with correct kind', () => {
    const builder = ir.lambdaParameters(ir.identifier('test'), ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('lambda_parameters');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.lambdaParameters(ir.identifier('test'), ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('lambda_parameters');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.lambdaParameters(ir.identifier('test'), ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
