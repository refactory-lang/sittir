import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('mut_pattern', () => {
  it('should build with correct kind', () => {
    const builder = ir.mut_pattern(ir.identifier('a'), ir.identifier('b'));
    const node = builder.build();
    expect(node.kind).toBe('mut_pattern');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.mut_pattern(ir.identifier('a'), ir.identifier('b'));
    const cst = builder.toCST();
    expect(cst.type).toBe('mut_pattern');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.mut_pattern(ir.identifier('a'), ir.identifier('b'));
    expect(() => builder.render('fast')).not.toThrow();
  });
});
