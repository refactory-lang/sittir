import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('flow_maybe_type', () => {
  it('should build with correct kind', () => {
    const builder = ir.flowMaybeType(ir.existentialType());
    const node = builder.build();
    expect(node.kind).toBe('flow_maybe_type');
    expect((node as any).children).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.flowMaybeType(ir.existentialType());
    const source = builder.renderImpl();
    expect(source).toContain('?');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.flowMaybeType(ir.existentialType());
    const cst = builder.toCST();
    expect(cst.type).toBe('flow_maybe_type');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.flowMaybeType(ir.existentialType());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
