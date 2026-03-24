import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('function_definition', () => {
  it('should build with correct kind', () => {
    const builder = ir.functionDefinition(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('function_definition');
    expect((node as any).name).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.functionDefinition(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('def');
    expect(source).toContain(':');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.functionDefinition(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('function_definition');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.functionDefinition(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
