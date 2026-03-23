import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('try_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.try(ir.statement_block());
    const node = builder.build();
    expect(node.kind).toBe('try_statement');
    expect((node as any).body).toHaveProperty('kind');
  });

  it('should render required grammar tokens', () => {
    const builder = ir.try(ir.statement_block());
    const source = builder.renderImpl();
    expect(source).toContain('try');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.try(ir.statement_block());
    const cst = builder.toCST();
    expect(cst.type).toBe('try_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.try(ir.statement_block());
    expect(() => builder.render('fast')).not.toThrow();
  });
});
