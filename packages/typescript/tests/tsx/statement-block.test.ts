import { describe, it, expect } from 'vitest';
import { ir } from '../../src/tsx/builder.js';

describe('statement_block', () => {
  it('should build with correct kind', () => {
    const builder = ir.statement_block();
    const node = builder.build();
    expect(node.kind).toBe('statement_block');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.statement_block();
    const cst = builder.toCST();
    expect(cst.type).toBe('statement_block');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.statement_block();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
