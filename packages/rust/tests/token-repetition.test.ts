import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('token_repetition', () => {
  it('should build with correct kind', () => {
    const builder = ir.tokenRepetition();
    const node = builder.build();
    expect(node.kind).toBe('token_repetition');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.tokenRepetition();
    const cst = builder.toCST();
    expect(cst.type).toBe('token_repetition');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.tokenRepetition();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
