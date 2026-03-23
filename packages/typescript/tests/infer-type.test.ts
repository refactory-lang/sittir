import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('infer_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.inferType(ir.typeIdentifier('test'), ir.typeIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('infer_type');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.inferType(ir.typeIdentifier('test'), ir.typeIdentifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('infer');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.inferType(ir.typeIdentifier('test'), ir.typeIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('infer_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.inferType(ir.typeIdentifier('test'), ir.typeIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
