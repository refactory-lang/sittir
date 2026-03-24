import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('raw_string_literal', () => {
  it('should build with correct kind', () => {
    const builder = ir.rawStringLiteral(ir.stringContent('test'));
    const node = builder.build();
    expect(node.kind).toBe('raw_string_literal');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.rawStringLiteral(ir.stringContent('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('raw_string_literal');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.rawStringLiteral(ir.stringContent('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
