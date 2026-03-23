import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('unary_operator', () => {
  it('should build with correct kind', () => {
    const builder = ir.unaryOperator(ir.ellipsis('test'));
    const node = builder.build();
    expect(node.kind).toBe('unary_operator');
    expect((node as any).argument).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.unaryOperator(ir.ellipsis('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('unary_operator');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.unaryOperator(ir.ellipsis('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
