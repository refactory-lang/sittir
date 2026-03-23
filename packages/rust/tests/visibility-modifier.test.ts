import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('visibility_modifier', () => {
  it('should build with correct kind', () => {
    const builder = ir.visibility_modifier();
    const node = builder.build();
    expect(node.kind).toBe('visibility_modifier');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.visibility_modifier();
    const cst = builder.toCST();
    expect(cst.type).toBe('visibility_modifier');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.visibility_modifier();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
