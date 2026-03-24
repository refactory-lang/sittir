import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('use_declaration', () => {
  it('should build with correct kind', () => {
    const builder = ir.useDeclaration(ir.self());
    const node = builder.build();
    expect(node.kind).toBe('use_declaration');
    expect((node as any).argument).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.useDeclaration(ir.self());
    const source = builder.renderImpl();
    expect(source).toContain('use');
    expect(source).toContain(';');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.useDeclaration(ir.self());
    const cst = builder.toCST();
    expect(cst.type).toBe('use_declaration');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.useDeclaration(ir.self());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
