import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('exec_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.execStatement(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('exec_statement');
    expect((node as any).code).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.execStatement(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('exec');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.execStatement(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('exec_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.execStatement(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
