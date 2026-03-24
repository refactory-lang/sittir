import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('nested_identifier', () => {
  it('should build with correct kind', () => {
    const builder = ir.nestedIdentifier(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('nested_identifier');
    expect((node as any).object).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.nestedIdentifier(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain('.');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.nestedIdentifier(ir.identifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('nested_identifier');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.nestedIdentifier(ir.identifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
