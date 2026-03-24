import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('return_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.returnStatement();
    const node = builder.build();
    expect(node.kind).toBe('return_statement');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.returnStatement();
    const cst = builder.toCST();
    expect(cst.type).toBe('return_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.returnStatement();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
