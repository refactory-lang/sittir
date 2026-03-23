import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('template_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.template_type(ir.existentialType('test'));
    const node = builder.build();
    expect(node.kind).toBe('template_type');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.template_type(ir.existentialType('test'));
    const source = builder.renderImpl();
    expect(source).toContain('${');
    expect(source).toContain('}');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.template_type(ir.existentialType('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('template_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.template_type(ir.existentialType('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
