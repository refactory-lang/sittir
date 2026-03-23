import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('namespace_export', () => {
  it('should build with correct kind', () => {
    const builder = ir.namespace_export(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('namespace_export');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.namespace_export(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('*');
    expect(source).toContain('as');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.namespace_export(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('namespace_export');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.namespace_export(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
