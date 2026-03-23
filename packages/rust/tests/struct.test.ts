import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('struct_item', () => {
  it('should build with correct kind', () => {
    const builder = ir.struct(ir.typeIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('struct_item');
    expect((node as any).name).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.struct(ir.typeIdentifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('struct');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.struct(ir.typeIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('struct_item');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.struct(ir.typeIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
