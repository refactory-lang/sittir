import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('method_signature', () => {
  it('should build with correct kind', () => {
    const builder = ir.method_signature(ir.privatePropertyIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('method_signature');
    expect((node as any).name).toHaveProperty('kind');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.method_signature(ir.privatePropertyIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('method_signature');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.method_signature(ir.privatePropertyIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
