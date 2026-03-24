import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('string', () => {
  it('should build with correct kind', () => {
    const builder = ir.string();
    const node = builder.build();
    expect(node.kind).toBe('string');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.string();
    const cst = builder.toCST();
    expect(cst.type).toBe('string');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.string();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
