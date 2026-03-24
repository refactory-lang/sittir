import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('block_comment', () => {
  it('should build with correct kind', () => {
    const builder = ir.blockComment();
    const node = builder.build();
    expect(node.kind).toBe('block_comment');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.blockComment();
    const cst = builder.toCST();
    expect(cst.type).toBe('block_comment');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.blockComment();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
