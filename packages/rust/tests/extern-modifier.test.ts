import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('extern_modifier', () => {
  it('should build with correct kind', () => {
    const builder = ir.externModifier();
    const node = builder.build();
    expect(node.kind).toBe('extern_modifier');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.externModifier();
    const cst = builder.toCST();
    expect(cst.type).toBe('extern_modifier');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.externModifier();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
