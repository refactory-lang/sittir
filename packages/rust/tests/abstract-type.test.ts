import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('abstract_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.abstract_type(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('abstract_type');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.abstract_type(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('impl');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.abstract_type(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('abstract_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.abstract_type(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
