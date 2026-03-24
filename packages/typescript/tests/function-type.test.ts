import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('function_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.functionType(ir.formalParameters());
    const node = builder.build();
    expect(node.kind).toBe('function_type');
    expect((node as any).parameters).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.functionType(ir.formalParameters());
    const source = builder.renderImpl();
    expect(source).toContain('=>');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.functionType(ir.formalParameters());
    const cst = builder.toCST();
    expect(cst.type).toBe('function_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.functionType(ir.formalParameters());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
