import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('use_list', () => {
  it('should build with correct kind', () => {
    const builder = ir.use_list();
    const node = builder.build();
    expect(node.kind).toBe('use_list');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.use_list();
    const source = builder.renderImpl();
    expect(source).toContain('{');
    expect(source).toContain('}');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.use_list();
    const cst = builder.toCST();
    expect(cst.type).toBe('use_list');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.use_list();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
