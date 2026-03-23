import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('interface_declaration', () => {
  it('should build with correct kind', () => {
    const builder = ir.interface(ir.typeIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('interface_declaration');
    expect((node as any).name).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.interface(ir.typeIdentifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('interface');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.interface(ir.typeIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('interface_declaration');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.interface(ir.typeIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
