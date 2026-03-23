import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('yield_expression', () => {
  it('should create a yield_expression node via builder', () => {
    const builder = ir.yield();
    const node = builder.build();
    expect(node.kind).toBe('yield_expression');
  });

  it('should render without throwing', () => {
    const builder = ir.yield();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
