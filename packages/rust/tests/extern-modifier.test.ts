import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('extern_modifier', () => {
  it('should build with correct kind', () => {
    const builder = ir.extern_modifier();
    const node = builder.build();
    expect(node.kind).toBe('extern_modifier');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.extern_modifier();
    const source = builder.renderImpl();
    expect(source).toContain('extern');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.extern_modifier();
    const cst = builder.toCST();
    expect(cst.type).toBe('extern_modifier');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.extern_modifier();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
