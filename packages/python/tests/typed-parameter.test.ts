import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('typed_parameter', () => {
  it('should build with correct kind', () => {
    const builder = ir.typedParameter(ir.identifier('test') as any);
    const node = builder.build();
    expect(node.kind).toBe('typed_parameter');
    expect((node as any).type).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.typedParameter(ir.identifier('test') as any);
    const source = builder.renderImpl();
    expect(source).toContain(':');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.typedParameter(ir.identifier('test') as any);
    const cst = builder.toCST();
    expect(cst.type).toBe('typed_parameter');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.typedParameter(ir.identifier('test') as any);
    expect(() => builder.render('fast')).not.toThrow();
  });
});
