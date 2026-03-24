import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('mapped_type_clause', () => {
  it('should build with correct kind', () => {
    const builder = ir.mappedTypeClause(ir.typeIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('mapped_type_clause');
    expect((node as any).name).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.mappedTypeClause(ir.typeIdentifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('in');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.mappedTypeClause(ir.typeIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('mapped_type_clause');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.mappedTypeClause(ir.typeIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
