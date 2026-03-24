import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('continue_expression', () => {
  it('should build with correct kind', () => {
    const builder = ir.continueExpression();
    const node = builder.build();
    expect(node.kind).toBe('continue_expression');
  });

  it('should produce a valid CST node', () => {
    const builder = ir.continueExpression();
    const cst = builder.toCST();
    expect(cst.type).toBe('continue_expression');
    expect(cst.isNamed).toBe(true);
    expect(cst.startIndex).toBe(0);
    expect(cst.endIndex).toBe(cst.text.length);
  });

  it('should pass fast validation', () => {
    const builder = ir.continueExpression();
    expect(() => builder.render('fast')).not.toThrow();
  });
});
