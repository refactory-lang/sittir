import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('range_expression', () => {
  it('should create a range_expression node via builder', () => {
    const builder = ir.range();
    const node = builder.build();
    expect(node.kind).toBe('range_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.range();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
