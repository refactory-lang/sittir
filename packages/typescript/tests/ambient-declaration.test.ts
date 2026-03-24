import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('ambient_declaration', () => {
  it('should build with correct kind', () => {
    const builder = ir.ambientDeclaration(ir.propertyIdentifier('test'), ir.propertyIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('ambient_declaration');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.ambientDeclaration(ir.propertyIdentifier('test'), ir.propertyIdentifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('declare');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.ambientDeclaration(ir.propertyIdentifier('test'), ir.propertyIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('ambient_declaration');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.ambientDeclaration(ir.propertyIdentifier('test'), ir.propertyIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
