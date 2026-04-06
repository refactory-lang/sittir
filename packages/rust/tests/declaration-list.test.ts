import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('declaration_list', () => {
  it('should build with correct kind', () => {
    const builder = ir.declaration_list();
    const node = builder.build();
    expect(node.kind).toBe('declaration_list');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.declaration_list();
    const source = builder.renderImpl();
    expect(source).toContain('{');
    expect(source).toContain('}');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.declaration_list();
    const cst = builder.toCST();
    expect(cst.type).toBe('declaration_list');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.declaration_list();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
