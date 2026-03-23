import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('dictionary_comprehension', () => {
  it('should build with correct kind', () => {
    const builder = ir.dictionaryComprehension(ir.pair(ir.asPattern(ir.identifier('test'))));
    const node = builder.build();
    expect(node.kind).toBe('dictionary_comprehension');
    expect((node as any).body).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.dictionaryComprehension(ir.pair(ir.asPattern(ir.identifier('test'))));
    const source = builder.renderImpl();
    expect(source).toContain('{');
    expect(source).toContain('}');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.dictionaryComprehension(ir.pair(ir.asPattern(ir.identifier('test'))));
    const cst = builder.toCST();
    expect(cst.type).toBe('dictionary_comprehension');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.dictionaryComprehension(ir.pair(ir.asPattern(ir.identifier('test'))));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
