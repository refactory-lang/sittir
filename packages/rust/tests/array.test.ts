import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('array_expression', () => {
  it('should create a array_expression node via builder', () => {
    const builder = ir.array();
    const node = builder.build();
    expect(node.kind).toBe('array_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.array();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
