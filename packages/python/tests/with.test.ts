import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('with_item', () => {
  it('should build with correct kind', () => {
    const builder = ir.with(ir.asPattern(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))));
    const node = builder.build();
    expect(node.kind).toBe('with_item');
    expect((node as any).value).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.with(ir.asPattern(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))));
    const cst = builder.toCST();
    expect(cst.type).toBe('with_item');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.with(ir.asPattern(ir.asPattern(ir.asPattern(ir.asPattern(ir.identifier('test') as any)))));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
