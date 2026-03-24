import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('keyword_argument', () => {
  it('should build with correct kind', () => {
    const builder = ir.keywordArgument(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('keyword_argument');
    expect((node as any).name).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.keywordArgument(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('=');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.keywordArgument(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('keyword_argument');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.keywordArgument(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
