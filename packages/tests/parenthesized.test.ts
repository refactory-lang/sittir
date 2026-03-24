import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('parenthesized_expression', () => {
  it('should create a parenthesized_expression node via builder', () => {
    const builder = ir.parenthesized(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('parenthesized_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.parenthesized(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
