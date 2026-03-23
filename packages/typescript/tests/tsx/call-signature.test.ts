import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('call_signature', () => {
  it('should build with correct kind', () => {
    const builder = ir.call_signature(ir.formal_parameters());
    const node = builder.build();
    expect(node.kind).toBe('call_signature');
    expect((node as any).parameters).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.call_signature(ir.formal_parameters());
    const cst = builder.toCST();
    expect(cst.type).toBe('call_signature');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.call_signature(ir.formal_parameters());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
