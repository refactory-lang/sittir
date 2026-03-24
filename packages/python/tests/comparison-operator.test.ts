import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('comparison_operator', () => {
  it('should build with correct kind', () => {
    const builder = ir.comparisonOperator(ir.identifier('test') as any, ir.identifier('test') as any);
    const node = builder.build();
    expect(node.kind).toBe('comparison_operator');
    expect(Array.isArray((node as any).operators)).toBe(true);
    expect((node as any).operators.length).toBeGreaterThan(0);
    expect((node as any).operators[0]).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.comparisonOperator(ir.identifier('test') as any, ir.identifier('test') as any);
    const cst = builder.toCST();
    expect(cst.type).toBe('comparison_operator');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.comparisonOperator(ir.identifier('test') as any, ir.identifier('test') as any);
    expect(() => builder.render('fast')).not.toThrow();
  });
});
