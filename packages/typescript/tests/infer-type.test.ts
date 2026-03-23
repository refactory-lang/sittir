import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('infer_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.infer_type(ir.identifier('a'), ir.identifier('b'));
    const node = builder.build();
    expect(node.kind).toBe('infer_type');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.infer_type(ir.identifier('a'), ir.identifier('b'));
    const source = builder.renderImpl();
    expect(source).toContain('infer');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.infer_type(ir.identifier('a'), ir.identifier('b'));
    const cst = builder.toCST();
    expect(cst.type).toBe('infer_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.infer_type(ir.identifier('a'), ir.identifier('b'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
