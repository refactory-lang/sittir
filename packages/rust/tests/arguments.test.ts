import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('arguments', () => {
  it('should build with correct kind', () => {
    const builder = ir.arguments();
    const node = builder.build();
    expect(node.kind).toBe('arguments');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.arguments();
    const cst = builder.toCST();
    expect(cst.type).toBe('arguments');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.arguments();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
