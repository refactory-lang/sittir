import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('use_bounds', () => {
  it('should create a use_bounds node via builder', () => {
    const builder = ir.use_bounds();
    const node = builder.build();
    expect(node.kind).toBe('use_bounds');
  });

  it('should render without throwing', () => {
    const builder = ir.use_bounds();
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
