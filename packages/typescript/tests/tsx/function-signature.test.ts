import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('function_signature', () => {
  it('should build with correct kind', () => {
    const builder = ir.function_signature(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('function_signature');
    expect((node as any).name).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.function_signature(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('function');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.function_signature(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('function_signature');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.function_signature(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
