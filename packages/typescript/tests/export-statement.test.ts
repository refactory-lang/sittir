import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('export_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.exportStatement(ir.identifier('test'), ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('export_statement');
    expect(Array.isArray((node as any).children)).toBe(true);
    expect((node as any).children.length).toBeGreaterThan(0);
    expect((node as any).children[0]).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.exportStatement(ir.identifier('test'), ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('export');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.exportStatement(ir.identifier('test'), ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('export_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.exportStatement(ir.identifier('test'), ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
