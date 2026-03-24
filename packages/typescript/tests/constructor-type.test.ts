import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('constructor_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.constructorType(ir.formalParameters());
    const node = builder.build();
    expect(node.kind).toBe('constructor_type');
    expect((node as any).parameters).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.constructorType(ir.formalParameters());
    const source = builder.renderImpl();
    expect(source).toContain('new');
    expect(source).toContain('=>');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.constructorType(ir.formalParameters());
    const cst = builder.toCST();
    expect(cst.type).toBe('constructor_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.constructorType(ir.formalParameters());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
