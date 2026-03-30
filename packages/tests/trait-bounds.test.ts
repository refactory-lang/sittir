import { describe, it, expect } from 'vitest';
import { ir } from '../src/builder.js';

describe('trait_bounds', () => {
  it('should create a trait_bounds node via builder', () => {
    const builder = ir.trait_bounds([ir.identifier('test')]);
    const node = builder.build();
    expect(node.kind).toBe('trait_bounds');
  });

  it('should render without throwing', () => {
    const builder = ir.trait_bounds([ir.identifier('test')]);
    const source = builder.renderImpl();
    expect(typeof source).toBe('string');
  });
});
