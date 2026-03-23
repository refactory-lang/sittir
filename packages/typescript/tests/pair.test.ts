import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('pair', () => {
  it('should build with correct kind', () => {
    const builder = ir.pair(ir.privatePropertyIdentifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('pair');
    expect((node as any).key).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.pair(ir.privatePropertyIdentifier('test'));
    const source = builder.renderImpl();
    expect(source).toContain(':');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.pair(ir.privatePropertyIdentifier('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('pair');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.pair(ir.privatePropertyIdentifier('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
