import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('ternary_expression', () => {
  it('should create a ternary_expression node via builder', () => {
    const builder = ir.ternary(ir.identifier('test'));
    const node = builder.build();
    expect(node.kind).toBe('ternary_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.ternary(ir.identifier('test'));
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
