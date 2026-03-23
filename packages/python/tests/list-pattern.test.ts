import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('list_pattern', () => {
  it('should build with correct kind', () => {
    const builder = ir.listPattern();
    const node = builder.build();
    expect(node.kind).toBe('list_pattern');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.listPattern();
    const cst = builder.toCST();
    expect(cst.type).toBe('list_pattern');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.listPattern();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
