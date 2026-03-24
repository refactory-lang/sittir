import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('readonly_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.readonlyType(ir.callExpression(ir.import()));
    const node = builder.build();
    expect(node.kind).toBe('readonly_type');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.readonlyType(ir.callExpression(ir.import()));
    const source = builder.renderImpl();
    expect(source).toContain('readonly');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.readonlyType(ir.callExpression(ir.import()));
    const cst = builder.toCST();
    expect(cst.type).toBe('readonly_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.readonlyType(ir.callExpression(ir.import()));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
