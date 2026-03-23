import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('type_alias_declaration', () => {
  it('should build with correct kind', () => {
    const builder = ir.typeAliasDeclaration(ir.typeIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('type_alias_declaration');
    expect((node as any).name).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.typeAliasDeclaration(ir.typeIdentifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('type');
    expect(source).toContain('=');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.typeAliasDeclaration(ir.typeIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('type_alias_declaration');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.typeAliasDeclaration(ir.typeIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
