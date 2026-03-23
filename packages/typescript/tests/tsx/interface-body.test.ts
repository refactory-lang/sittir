import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('interface_body', () => {
  it('should build with correct kind', () => {
    const builder = ir.interface_body();
    const node = builder.build();
    expect(node.kind).toBe('interface_body');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.interface_body();
    const cst = builder.toCST();
    expect(cst.type).toBe('interface_body');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.interface_body();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
