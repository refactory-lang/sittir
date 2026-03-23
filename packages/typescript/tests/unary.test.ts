import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('unary_expression', () => {
  it('should create a unary_expression node via builder', () => {
    const builder = ir.unary(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('unary_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.unary(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
