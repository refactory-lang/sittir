import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('class_body', () => {
  it('should build with correct kind', () => {
    const builder = ir.class_body();
    const node = builder.build();
    expect(node.kind).toBe('class_body');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.class_body();
    const source = builder.renderImpl();
    expect(source).toContain('{');
    expect(source).toContain('}');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.class_body();
    const cst = builder.toCST();
    expect(cst.type).toBe('class_body');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.class_body();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
