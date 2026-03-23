import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('generator_function', () => {
  it('should build with correct kind', () => {
    const builder = ir.generatorFunction(ir.formalParameters());
    const node = builder.build();
    expect(node.kind).toBe('generator_function');
    expect((node as any).parameters).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.generatorFunction(ir.formalParameters());
    const source = builder.renderImpl();
    expect(source).toContain('function');
    expect(source).toContain('*');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.generatorFunction(ir.formalParameters());
    const cst = builder.toCST();
    expect(cst.type).toBe('generator_function');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.generatorFunction(ir.formalParameters());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
