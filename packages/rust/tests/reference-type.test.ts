import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('reference_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.referenceType(ir.metavariable('test'));
    const node = builder.build();
    expect(node.kind).toBe('reference_type');
    expect((node as any).type).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.referenceType(ir.metavariable('test'));
    const source = builder.renderImpl();
    expect(source).toContain('&');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.referenceType(ir.metavariable('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('reference_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.referenceType(ir.metavariable('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
