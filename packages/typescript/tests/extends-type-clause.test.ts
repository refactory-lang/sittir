import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('extends_type_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.extendsTypeClause(ir.typeIdentifier('test'), ir.typeIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('extends_type_clause');
    expect(Array.isArray((node as any).type)).toBe(true);
    expect((node as any).type.length).toBeGreaterThan(0);
    expect((node as any).type[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.extendsTypeClause(ir.typeIdentifier('test'), ir.typeIdentifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('extends');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.extendsTypeClause(ir.typeIdentifier('test'), ir.typeIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('extends_type_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.extendsTypeClause(ir.typeIdentifier('test'), ir.typeIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
