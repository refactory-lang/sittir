import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('scoped_use_list', () => {
  it('should build with correct kind', () => {
    const builder = ir.scopedUseList(ir.useList());
    const node = builder.build();
    expect(node.kind).toBe('scoped_use_list');
    expect((node as any).list).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.scopedUseList(ir.useList());
    const source = builder.renderImpl();
    expect(source).toContain('::');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.scopedUseList(ir.useList());
    const cst = builder.toCST();
    expect(cst.type).toBe('scoped_use_list');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.scopedUseList(ir.useList());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
