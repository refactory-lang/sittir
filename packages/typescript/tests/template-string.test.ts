import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('template_string', () => {
  it('should build with correct kind', () => {
    const builder = ir.template_string();
    const node = builder.build();
    expect(node.kind).toBe('template_string');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.template_string();
    const source = builder.renderImpl();
    expect(source).toContain('`');
    expect(source).toContain('`');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.template_string();
    const cst = builder.toCST();
    expect(cst.type).toBe('template_string');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.template_string();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
