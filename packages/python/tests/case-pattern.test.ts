import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('case_pattern', () => {
  it('should build with correct kind', () => {
    const builder = ir.casePattern();
    const node = builder.build();
    expect(node.kind).toBe('case_pattern');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.casePattern();
    const cst = builder.toCST();
    expect(cst.type).toBe('case_pattern');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.casePattern();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
