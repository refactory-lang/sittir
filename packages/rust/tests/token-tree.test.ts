import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('token_tree', () => {
  it('should build with correct kind', () => {
    const builder = ir.tokenTree();
    const node = builder.build();
    expect(node.kind).toBe('token_tree');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.tokenTree();
    const cst = builder.toCST();
    expect(cst.type).toBe('token_tree');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.tokenTree();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
