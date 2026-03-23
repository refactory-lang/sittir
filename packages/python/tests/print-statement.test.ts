import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('print_statement', () => {
  it('should build with correct kind', () => {
    const builder = ir.printStatement();
    const node = builder.build();
    expect(node.kind).toBe('print_statement');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.printStatement();
    const cst = builder.toCST();
    expect(cst.type).toBe('print_statement');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.printStatement();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
