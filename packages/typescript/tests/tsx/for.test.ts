import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('for_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.for(ir.emptyStatement('test'));
    const node = builder.build();
    expect(node.kind).toBe('for_statement');
    expect((node as any).initializer).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.for(ir.emptyStatement('test'));
    const source = builder.renderImpl();
    expect(source).toContain('for');
    expect(source).toContain('(');
    expect(source).toContain(')');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.for(ir.emptyStatement('test'));
    const cst = builder.toCST();
    expect(cst.type).toBe('for_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.for(ir.emptyStatement('test'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
