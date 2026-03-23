import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('attribute', () => {
  it('should build with correct kind', () => {
    const builder = ir.attribute(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('attribute');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.attribute(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('attribute');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.attribute(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
