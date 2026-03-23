import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('switch_default', () => {
  it('should build with correct kind', () => {
    const builder = ir.switchDefault(ir.debuggerStatement('test'));
    const node = builder.build();
    expect(node.kind).toBe('switch_default');
    expect((node as any).body).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.switchDefault(ir.debuggerStatement('test'));
    const source = builder.renderImpl();
    expect(source).toContain('default');
    expect(source).toContain(':');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.switchDefault(ir.debuggerStatement('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('switch_default');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.switchDefault(ir.debuggerStatement('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
